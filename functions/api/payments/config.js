const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function onRequestGet({ env }) {
  const publicKey = env.MERCADO_PAGO_PUBLIC_KEY || "";
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN || "";
  const configured = publicKey.startsWith("TEST-") && accessToken.startsWith("TEST-");
  return json({ publicKey: configured ? publicKey : "", configured, environment: "test" });
}
