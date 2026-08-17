const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const requireAdmin = ({ env, request }) => Boolean(env.ADMIN_TOKEN && request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") === env.ADMIN_TOKEN);

export async function onRequestPost(context) {
  if (!requireAdmin(context)) return json({ error: "Acesso administrativo inválido." }, 401);
  const form = await context.request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return json({ error: "Envie uma imagem válida." }, 400);
  if (file.size > 10 * 1024 * 1024) return json({ error: "A imagem deve ter no máximo 10 MB." }, 400);
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const key = `${crypto.randomUUID()}.${extension}`;
  await context.env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
  return json({ url: `/api/media/${key}` }, 201);
}

