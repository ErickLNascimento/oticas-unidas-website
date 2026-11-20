import { json, requireAdmin } from "../../../../server/http.mjs";
import { CatalogError, protectErpFields } from "../../../../server/erp-catalog.mjs";

const allowed = new Set(["products", "formats", "contact", "slides"]);

export async function onRequestPut(context) {
  if (!(await requireAdmin(context))) return json({ error: "Acesso administrativo inválido." }, 401);
  const section = context.params.section;
  if (!allowed.has(section)) return json({ error: "Seção inválida." }, 400);
  let value = await context.request.json().catch(() => undefined);
  if (value === undefined) return json({ error: "Conteúdo inválido." }, 400);
  if (section === "products") {
    try {
      const row = await context.env.DB.prepare("SELECT value FROM store_sections WHERE section = 'products'").first();
      value = protectErpFields(row ? JSON.parse(row.value) : [], value);
    } catch (error) {
      const message = error instanceof CatalogError && error.code === "ERP_PRODUCT_REMOVAL"
        ? "Produtos publicados pelo ERP não podem ser removidos aqui. Despublique no ERP."
        : "Lista de produtos inválida.";
      return json({ error: message }, 400);
    }
  }
  await context.env.DB.prepare(
    "INSERT INTO store_sections (section, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
  ).bind(section, JSON.stringify(value)).run();
  return json({ ok: true, section });
}
