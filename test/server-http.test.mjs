import { test } from "node:test";
import assert from "node:assert/strict";
import { priceCart, requireAdmin, safeCustomer, orderId } from "../server/http.mjs";

const catalog = [
  { id: 1, name: "Aurora", type: "Gatinho", color: "Âmbar", price: 429 },
  { id: 2, name: "Nômade", type: "Redondo", color: "Tartaruga", price: 389 },
  { id: 3, name: "Oculta", price: 300, active: false },
];
const env = (products = catalog) => ({ DB: { prepare: () => ({ first: async () => (products ? { value: JSON.stringify(products) } : null) }) } });

test("ignora o preço enviado pelo navegador", async () => {
  const r = await priceCart(env(), [{ id: 1, qty: 1, price: 1 }], "card");
  assert.equal(r.subtotal, 429);
  assert.equal(r.items[0].price, 429);
  assert.equal(r.shipping, 24.9);
  assert.equal(r.total, 453.9);
});

test("aplica frete grátis acima de R$ 499 e 10% no PIX", async () => {
  const r = await priceCart(env(), [{ id: 2, qty: 2 }], "pix");
  assert.deepEqual([r.subtotal, r.shipping, r.discount, r.total], [778, 0, 77.8, 700.2]);
});

test("recusa produto inexistente, inativo ou quantidade inválida", async () => {
  await assert.rejects(priceCart(env(), [{ id: 99, qty: 1 }], "pix"));
  await assert.rejects(priceCart(env(), [{ id: 3, qty: 1 }], "pix"));
  for (const qty of [0, -1, 1.5, 21, "abc", null]) await assert.rejects(priceCart(env(), [{ id: 1, qty }], "pix"));
  await assert.rejects(priceCart(env(), [], "pix"));
  await assert.rejects(priceCart(env(null), [{ id: 1, qty: 1 }], "pix"));
});

test("chave administrativa", async () => {
  const req = (h) => ({ headers: new Headers(h ? { authorization: h } : {}) });
  const env = { ADMIN_TOKEN: "uma-chave-bem-longa-123" };
  assert.equal(await requireAdmin({ env, request: req("Bearer uma-chave-bem-longa-123") }), true);
  assert.equal(await requireAdmin({ env, request: req("Bearer errada") }), false);
  assert.equal(await requireAdmin({ env, request: req() }), false);
  assert.equal(await requireAdmin({ env: { ADMIN_TOKEN: "curta" }, request: req("Bearer curta") }), false);
  assert.equal(await requireAdmin({ env: {}, request: req("Bearer ") }), false);
});

test("cliente sem dados de cartão e id único", () => {
  const c = safeCustomer({ name: "Ana", cardNumber: "4111", cvv: "123", email: "a@a" });
  assert.equal("cardNumber" in c || "cvv" in c, false);
  assert.equal(c.name, "Ana");
  const ids = new Set(Array.from({ length: 20000 }, orderId));
  assert.equal(ids.size, 20000);
  assert.match(orderId(), /^OU-\d{6}-[0-9A-Z]{8}$/);
});
