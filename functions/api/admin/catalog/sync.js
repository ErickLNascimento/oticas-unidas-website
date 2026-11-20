import { json, requireAdmin } from "../../../../server/http.mjs";
import { CatalogError, applyCatalogPage, applyLinks, erpConfig, fetchCatalogPage } from "../../../../server/erp-catalog.mjs";

const MAX_PAGES = 20;

async function readState(db) {
  const state = await db.prepare("SELECT tenant_id, branch_id, cursor, last_result, updated_at FROM erp_sync WHERE id = 1").first();
  const row = await db.prepare("SELECT value FROM store_sections WHERE section = 'products'").first();
  return { state, products: row ? JSON.parse(row.value) : [] };
}

// Grava catálogo e cursor juntos. Se outro processo avançou o cursor, o lote inteiro é desfeito.
function commitStatements(db, { products, fromCursor, nextCursor, config, result }) {
  return [
    db.prepare("UPDATE erp_sync SET cursor = ?, tenant_id = ?, branch_id = ?, last_result = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1 AND cursor = ?")
      .bind(nextCursor, config.tenantId, config.branchId, JSON.stringify(result), fromCursor),
    db.prepare("INSERT INTO erp_sync_guard (ok) SELECT changes()"),
    db.prepare("DELETE FROM erp_sync_guard"),
    db.prepare("INSERT INTO store_sections (section, value, updated_at) VALUES ('products', ?, CURRENT_TIMESTAMP) ON CONFLICT(section) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP")
      .bind(JSON.stringify(products)),
  ];
}

export async function onRequestGet(context) {
  if (!(await requireAdmin(context))) return json({ error: "Acesso administrativo inválido." }, 401);
  const { state, products } = await readState(context.env.DB);
  return json({
    configured: Boolean(erpConfig(context.env)),
    cursor: state?.cursor ?? "0",
    lastResult: state?.last_result ? JSON.parse(state.last_result) : null,
    updatedAt: state?.updated_at ?? null,
    erpProducts: products.filter((p) => p.erpVariantId).length,
  });
}

export async function onRequestPost(context, { fetcher = fetch } = {}) {
  if (!(await requireAdmin(context))) return json({ error: "Acesso administrativo inválido." }, 401);
  const config = erpConfig(context.env);
  if (!config) return json({ error: "Integração com o ERP não configurada." }, 503);
  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const summary = { pages: 0, created: 0, updated: 0, skipped: 0, hasMore: false };
  try {
    let { state, products } = await readState(db);
    if (!state) throw new CatalogError("ERP_SYNC_NOT_MIGRATED");
    // O mesmo banco não pode passar a receber outra loja/empresa sem uma decisão explícita.
    if (state.tenant_id && (state.tenant_id !== config.tenantId || state.branch_id !== config.branchId)) throw new CatalogError("ERP_SCOPE_CHANGED");
    let cursor = state.cursor;
    if (body.links) {
      products = applyLinks(products, body.links);
      await db.batch(commitStatements(db, { products, fromCursor: cursor, nextCursor: cursor, config, result: { links: body.links.length } }));
    }
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const data = await fetchCatalogPage(config, cursor, fetcher);
      const applied = applyCatalogPage(products, data);
      summary.pages += 1;
      summary.created += applied.created;
      summary.updated += applied.updated;
      summary.skipped += applied.skipped;
      summary.hasMore = data.hasMore;
      await db.batch(commitStatements(db, { products: applied.products, fromCursor: cursor, nextCursor: data.nextCursor, config, result: { ...summary, at: new Date().toISOString() } }));
      products = applied.products;
      cursor = data.nextCursor;
      if (!data.hasMore) break;
    }
    return json({ ok: true, cursor, ...summary });
  } catch (error) {
    // O cursor só avança junto com páginas confirmadas; a próxima tentativa continua daqui.
    const code = error instanceof CatalogError ? error.code : /CHECK constraint/i.test(String(error?.message)) ? "ERP_SYNC_CONCURRENT" : "ERP_SYNC_FAILED";
    return json({ error: "Não foi possível sincronizar o catálogo.", code, ...summary }, code === "ERP_SYNC_CONCURRENT" ? 409 : 502);
  }
}
