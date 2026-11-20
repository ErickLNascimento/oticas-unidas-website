import { json, requireAdmin } from "../../../server/http.mjs";

// Pedidos só são criados por /api/payments/process, que recalcula valores no servidor.

export async function onRequestGet(context) {
  if (!(await requireAdmin(context))) return json({ error: "Acesso administrativo inválido." }, 401);
  const { results } = await context.env.DB.prepare("SELECT value, status FROM orders ORDER BY created_at DESC").all();
  return json(results.map((row) => ({ ...JSON.parse(row.value), status: row.status })));
}
