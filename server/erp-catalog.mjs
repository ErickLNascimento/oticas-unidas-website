// Consumidor do catálogo do OptiFlow ERP (contrato storefront v1, revisões incrementais).
// O ERP é dono dos campos comerciais; fotos, textos e PNG do provador pertencem ao site.

export const ERP_FIELDS = ["price", "color", "size", "sku", "category", "active", "purchaseEnabled", "erpProductId", "erpVariantId", "erpRevision", "erpName"];

const MAX_REVISION = 9223372036854775807n;
export const validRevision = (value) =>
  typeof value === "string" && /^(0|[1-9]\d{0,18})$/.test(value) && BigInt(value) <= MAX_REVISION;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isId = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
const isText = (value, max) => typeof value === "string" && value.length <= max;

export class CatalogError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// Valida e reconstrói só os campos permitidos; nunca repassa campos arbitrários do ERP.
export function parseCatalogPage(raw, scope, after) {
  const invalid = () => { throw new CatalogError("ERP_INVALID_CATALOG"); };
  if (!isRecord(raw) || raw.version !== 1 || raw.tenantId !== scope.tenantId || raw.branchId !== scope.branchId ||
    raw.fromCursor !== after || !validRevision(after) || !validRevision(raw.nextCursor) ||
    typeof raw.hasMore !== "boolean" || !Array.isArray(raw.items) || raw.items.length > 100) return invalid();
  let previous = BigInt(after);
  const items = raw.items.map((event) => {
    if (!isRecord(event) || !validRevision(event.revision) || BigInt(event.revision) <= previous || !isRecord(event.variant)) return invalid();
    previous = BigInt(event.revision);
    const v = event.variant;
    if (!isId(v.productId) || !isId(v.variantId) || !isText(v.sku, 100) || !isText(v.name, 200) ||
      !(v.color === null || isText(v.color, 100)) || !(v.size === null || isText(v.size, 100)) ||
      typeof v.active !== "boolean" || (v.active && (!v.sku.trim() || !v.name.trim())) ||
      !["grau", "sol"].includes(v.category) || v.currency !== "BRL" || v.purchaseEnabled !== false ||
      !Number.isSafeInteger(v.priceMinor) || v.priceMinor < 0 || v.priceMinor > 999999999999) return invalid();
    return {
      revision: event.revision,
      variant: {
        productId: v.productId, variantId: v.variantId, sku: v.sku, name: v.name, color: v.color, size: v.size,
        active: v.active, category: v.category, priceMinor: v.priceMinor, purchaseEnabled: false,
      },
    };
  });
  if (previous.toString() !== raw.nextCursor || (raw.hasMore && items.length === 0)) return invalid();
  return { tenantId: scope.tenantId, branchId: scope.branchId, fromCursor: after, nextCursor: raw.nextCursor, hasMore: raw.hasMore, items };
}

export function erpConfig(env) {
  const url = (() => { try { return new URL(env.ERP_API_URL || ""); } catch { return null; } })();
  if (!url || url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
    !/^\/api\/v1\/?$/.test(url.pathname) || !/^ofsf_[A-Za-z0-9_-]{43,128}$/.test(env.ERP_STOREFRONT_TOKEN || "") ||
    !isId(env.ERP_TENANT_ID) || !isId(env.ERP_BRANCH_ID)) return null;
  return { endpoint: `${url.origin}/api/v1/integrations/storefront/catalog`, token: env.ERP_STOREFRONT_TOKEN, tenantId: env.ERP_TENANT_ID, branchId: env.ERP_BRANCH_ID };
}

export async function fetchCatalogPage(config, after, fetcher = fetch, timeoutMs = 5000) {
  if (!validRevision(after)) throw new CatalogError("ERP_INVALID_CURSOR");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${config.endpoint}?after=${after}&limit=100`, {
      redirect: "manual", signal: controller.signal,
      headers: { authorization: `Bearer ${config.token}`, accept: "application/json", "x-tenant-id": config.tenantId, "x-branch-id": config.branchId },
    });
    if (response.status !== 200) { await response.body?.cancel(); throw new CatalogError(`ERP_HTTP_${response.status}`); }
    if (!/^application\/json(?:;|$)/i.test(response.headers.get("content-type") || "")) { await response.body?.cancel(); throw new CatalogError("ERP_INVALID_CATALOG"); }
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 1_048_576) { await reader.cancel(); throw new CatalogError("ERP_INVALID_CATALOG"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let raw;
    try { raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { throw new CatalogError("ERP_INVALID_CATALOG"); }
    return parseCatalogPage(raw, config, after);
  } catch (error) {
    if (controller.signal.aborted) throw new CatalogError("ERP_TIMEOUT");
    if (error instanceof CatalogError) throw error;
    throw new CatalogError("ERP_UNAVAILABLE");
  } finally { clearTimeout(timer); }
}

// Aplica uma página ao catálogo do site. Função pura: devolve uma nova lista.
export function applyCatalogPage(products, page, { newId = () => Date.now() } = {}) {
  const list = products.map((product) => ({ ...product }));
  const byVariant = new Map(list.filter((p) => p.erpVariantId).map((p) => [p.erpVariantId, p]));
  let created = 0, updated = 0, skipped = 0;
  for (const { revision, variant: v } of page.items) {
    let product = byVariant.get(v.variantId);
    if (product && product.erpRevision && BigInt(product.erpRevision) >= BigInt(revision)) { skipped += 1; continue; }
    if (!product) {
      // Nunca juntar por suposição: SKU igual sem vínculo explícito interrompe a sincronização.
      if (list.some((p) => !p.erpVariantId && p.sku && p.sku === v.sku)) throw new CatalogError("ERP_UNLINKED_SKU_CONFLICT");
      if (!v.active) { skipped += 1; continue; } // inativo que o site nunca recebeu: nada a guardar
      product = { id: newId(), name: v.name, type: "", tag: "", shape: "round", tone: "#49352b", image: "", tryOnImage: "", stock: 0 };
      list.unshift(product);
      byVariant.set(v.variantId, product);
      created += 1;
    } else updated += 1;
    Object.assign(product, {
      erpProductId: v.productId, erpVariantId: v.variantId, erpRevision: revision, erpName: v.name,
      sku: v.sku, color: v.color || "", size: v.size || "", category: v.category,
      price: v.priceMinor / 100, active: v.active, purchaseEnabled: false,
    });
  }
  return { products: list, created, updated, skipped };
}

// Vínculos explícitos de produtos já existentes no site com variantes do ERP.
export function applyLinks(products, links = []) {
  if (!Array.isArray(links) || links.length > 500) throw new CatalogError("ERP_INVALID_LINKS");
  const list = products.map((product) => ({ ...product }));
  const seenSite = new Set();
  const seenVariant = new Set(list.filter((p) => p.erpVariantId).map((p) => p.erpVariantId));
  for (const link of links) {
    if (!isRecord(link) || !isId(link.variantId) || link.siteId === undefined) throw new CatalogError("ERP_INVALID_LINKS");
    const product = list.find((p) => String(p.id) === String(link.siteId));
    if (!product || seenSite.has(String(link.siteId)) || product.erpVariantId || seenVariant.has(link.variantId)) throw new CatalogError("ERP_INVALID_LINKS");
    seenSite.add(String(link.siteId));
    seenVariant.add(link.variantId);
    product.erpVariantId = link.variantId;
  }
  return list;
}

// Ao salvar pelo painel do site, campos comerciais de itens do ERP não podem ser alterados nem os itens removidos.
export function protectErpFields(stored, incoming) {
  if (!Array.isArray(incoming)) throw new CatalogError("INVALID_PRODUCTS");
  const storedErp = new Map(stored.filter((p) => p.erpVariantId).map((p) => [p.erpVariantId, p]));
  const result = incoming.map((product) => {
    if (!isRecord(product)) throw new CatalogError("INVALID_PRODUCTS");
    const original = product.erpVariantId ? storedErp.get(product.erpVariantId) : stored.find((p) => p.erpVariantId && String(p.id) === String(product.id));
    if (!original) {
      if (product.erpVariantId) throw new CatalogError("INVALID_PRODUCTS"); // não se inventa vínculo pelo painel
      const clean = { ...product };
      for (const field of ["erpProductId", "erpRevision", "erpName"]) delete clean[field];
      return clean;
    }
    const merged = { ...product, id: original.id };
    for (const field of ERP_FIELDS) {
      if (original[field] === undefined) delete merged[field];
      else merged[field] = original[field];
    }
    return merged;
  });
  const kept = new Set(result.filter((p) => p.erpVariantId).map((p) => p.erpVariantId));
  for (const [variantId, original] of storedErp) {
    if (!kept.has(variantId)) {
      if (original.active) throw new CatalogError("ERP_PRODUCT_REMOVAL"); // despublicar no ERP, não apagar no site
      result.push(original);
    }
  }
  return result;
}
