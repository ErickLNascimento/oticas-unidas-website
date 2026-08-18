const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const requireAdmin = ({ env, request }) => Boolean(env.ADMIN_TOKEN && request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") === env.ADMIN_TOKEN);

const allowed = new Set(["products", "formats", "contact", "slides"]);

export async function onRequestPut(context) {
  if (!requireAdmin(context)) return json({ error: "Acesso administrativo inválido." }, 401);
  const section = context.params.section;
  if (!allowed.has(section)) return json({ error: "Seção inválida." }, 400);
  const value = await context.request.json();
  await context.env.DB.prepare(
    "INSERT INTO store_sections (section, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
  ).bind(section, JSON.stringify(value)).run();
  return json({ ok: true, section });
}
