const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const requireAdmin = ({ env, request }) => Boolean(env.ADMIN_TOKEN && request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") === env.ADMIN_TOKEN);

export async function onRequestPatch(context) {
  if (!requireAdmin(context)) return json({ error: "Acesso administrativo inválido." }, 401);
  const { status } = await context.request.json();
  const valid = ["Aguardando PIX", "Confirmado", "Em separação", "Enviado", "Entregue", "Cancelado"];
  if (!valid.includes(status)) return json({ error: "Status inválido." }, 400);
  await context.env.DB.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(status, context.params.id).run();
  return json({ ok: true });
}
