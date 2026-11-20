const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const requireAdmin = ({ env, request }) => Boolean(env.ADMIN_TOKEN && request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") === env.ADMIN_TOKEN);

export async function onRequestPost({ request, env }) {
  const order = await request.json();
  if (!order?.id || !order?.customer?.email || !Array.isArray(order?.items)) {
    return json({ error: "Pedido inválido." }, 400);
  }
  await env.DB.prepare(
    "INSERT INTO orders (id, value, status) VALUES (?, ?, ?)",
  ).bind(order.id, JSON.stringify(order), order.status || "Confirmado").run();
  return json({ ok: true, id: order.id }, 201);
}

export async function onRequestGet(context) {
  if (!requireAdmin(context)) return json({ error: "Acesso administrativo inválido." }, 401);
  const { results } = await context.env.DB.prepare("SELECT value, status FROM orders ORDER BY created_at DESC").all();
  return json(results.map((row) => ({ ...JSON.parse(row.value), status: row.status })));
}
