import { json, requireAdmin } from "../../../server/http.mjs";

export async function onRequestPost(context) {
  if (!(await requireAdmin(context))) return json({ error: "Acesso administrativo inválido." }, 401);
  const form = await context.request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return json({ error: "Envie uma imagem válida." }, 400);
  if (file.size > 10 * 1024 * 1024) return json({ error: "A imagem deve ter no máximo 10 MB." }, 400);
  const extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[file.type];
  const key = `${crypto.randomUUID()}.${extension}`;
  await context.env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
  return json({ url: `/api/media/${key}` }, 201);
}

