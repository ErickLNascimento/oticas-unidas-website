// Utilitários compartilhados pelas Cloudflare Pages Functions (não é uma rota).

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

// Compara em tempo constante: ambos viram hashes de 32 bytes antes da comparação.
export async function requireAdmin({ env, request }) {
  const expected = env.ADMIN_TOKEN || "";
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (expected.length < 16 || !received) return false;
  const [a, b] = await Promise.all([sha256(expected), sha256(received)]);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

const ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // 32 símbolos, sem I/L/O/U

// OU-AAMMDD-XXXXXXXX: 40 bits aleatórios por dia.
export function orderId() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (n) => ID_ALPHABET[n & 31]).join("");
  return `OU-${date}-${suffix}`;
}

export const ORDER_STATUSES = [
  "Aguardando PIX",
  "Aguardando pagamento",
  "Pagamento não aprovado",
  "Confirmado",
  "Em separação",
  "Enviado",
  "Entregue",
  "Cancelado",
];

const CUSTOMER_FIELDS = ["name", "email", "cpf", "phone", "cep", "street", "number", "complement", "district", "city", "state"];

// Só dados de contato e entrega; nunca dados de cartão.
export function safeCustomer(customer = {}) {
  return Object.fromEntries(CUSTOMER_FIELDS.map((key) => [key, String(customer[key] ?? "").slice(0, 200)]));
}

const round = (value) => Math.round(value * 100) / 100;

// Recalcula o pedido a partir do catálogo salvo no servidor. O preço enviado pelo navegador é ignorado.
export async function priceCart(env, cart, paymentMethod) {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > 30) throw new Error("Sacola inválida.");
  const row = await env.DB.prepare("SELECT value FROM store_sections WHERE section = 'products'").first();
  const catalog = row ? JSON.parse(row.value) : [];
  if (!Array.isArray(catalog) || catalog.length === 0) throw new Error("Catálogo indisponível. Tente novamente em instantes.");
  const byId = new Map(catalog.map((product) => [String(product.id), product]));
  const items = cart.map((line) => {
    const product = byId.get(String(line?.id));
    const qty = Number(line?.qty);
    if (!product || product.active === false) throw new Error("Um dos produtos da sacola não está mais disponível.");
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error("Quantidade inválida.");
    const price = Number(product.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error("Produto com preço inválido.");
    return { id: product.id, name: product.name, type: product.type, color: product.color, price, qty };
  });
  const subtotal = round(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const shipping = subtotal >= 499 ? 0 : 24.9;
  const discount = paymentMethod === "pix" ? round(subtotal * 0.1) : 0;
  return { items, subtotal, shipping, discount, total: round(subtotal + shipping - discount) };
}
