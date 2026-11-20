import { json, requireAdmin, ORDER_STATUSES } from "../../../server/http.mjs";

export async function onRequestPatch(context) {
  if (!(await requireAdmin(context))) return json({ error: "Acesso administrativo inválido." }, 401);
  const { status } = await context.request.json().catch(() => ({}));
  if (!ORDER_STATUSES.includes(status)) return json({ error: "Status inválido." }, 400);
  const result = await context.env.DB.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(status, context.params.id).run();
  if (!result.meta?.changes) return json({ error: "Pedido não encontrado." }, 404);
  return json({ ok: true });
}
