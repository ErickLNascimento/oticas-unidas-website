const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare("SELECT section, value FROM store_sections").all();
    return json(Object.fromEntries(results.map((row) => [row.section, JSON.parse(row.value)])));
  } catch (error) {
    return json({ error: "Não foi possível carregar os dados da loja." }, 500);
  }
}
