import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequestPost as sync, onRequestGet as status } from "../functions/api/admin/catalog/sync.js";
import { onRequestPut as saveSection } from "../functions/api/admin/store/[section].js";
import { protectErpFields, applyCatalogPage } from "../server/erp-catalog.mjs";
import { priceCart } from "../server/http.mjs";

const TOKEN = "chave-administrativa-de-teste";
const ERP_TOKEN = `ofsf_${"a".repeat(43)}`;

// D1 mínimo sobre SQLite real (mesma semântica de changes() e transação do batch).
function fakeD1() {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0001_shared_store.sql", "0002_erp_catalog_sync.sql"]) db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
  const statement = (sql, params = []) => ({
    sql, params,
    bind: (...values) => statement(sql, values),
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...params).changes) } }),
  });
  return {
    raw: db,
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      db.exec("BEGIN");
      try { for (const s of statements) db.prepare(s.sql).run(...s.params); db.exec("COMMIT"); }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
  };
}

const variant = (id, over = {}) => ({ productId: "p1", variantId: id, sku: `SKU-${id}`, name: "Armação ERP", color: "Azul", size: "52",
  active: true, category: "grau", currency: "BRL", priceMinor: 34990, purchaseEnabled: false, ...over });

// ERP falso: um log de eventos, paginado como o endpoint real.
function fakeErp(events, { pageSize = 2, tenantId = "t1", branchId = "b1", failAfter = Infinity } = {}) {
  let calls = 0;
  const fetcher = async (url, init) => {
    calls += 1;
    if (calls > failAfter) throw new Error("rede caiu");
    assert.equal(init.headers.authorization, `Bearer ${ERP_TOKEN}`);
    assert.equal(init.redirect, "manual");
    const after = new URL(url).searchParams.get("after");
    const rest = events.filter((e) => BigInt(e.revision) > BigInt(after));
    const items = rest.slice(0, pageSize);
    const body = { version: 1, tenantId, branchId, fromCursor: after, nextCursor: items.at(-1)?.revision ?? after, hasMore: rest.length > pageSize, items };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  };
  return { fetcher, get calls() { return calls; } };
}

const env = (DB, over = {}) => ({ DB, ADMIN_TOKEN: TOKEN, ERP_API_URL: "https://erp.example/api/v1", ERP_STOREFRONT_TOKEN: ERP_TOKEN, ERP_TENANT_ID: "t1", ERP_BRANCH_ID: "b1", ...over });
const post = (body = {}, auth = TOKEN) => new Request("https://site/api/admin/catalog/sync", { method: "POST", headers: { authorization: `Bearer ${auth}` }, body: JSON.stringify(body) });
const products = async (DB) => JSON.parse((await DB.prepare("SELECT value FROM store_sections WHERE section='products'").first())?.value ?? "[]");
const cursor = async (DB) => (await DB.prepare("SELECT cursor FROM erp_sync WHERE id=1").first()).cursor;
const run = async (DB, erp, body, extraEnv) => { const r = await sync({ env: env(DB, extraEnv), request: post(body) }, { fetcher: erp.fetcher }); return { status: r.status, body: await r.json() }; };

test("carga inicial cria produtos só para consulta, com preço do ERP", async () => {
  const DB = fakeD1();
  const erp = fakeErp([{ revision: "1", variant: variant("v1") }, { revision: "2", variant: variant("v2", { color: "Preto", priceMinor: 45990, category: "sol" }) }, { revision: "3", variant: variant("v3") }]);
  const r = await run(DB, erp);
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.pages, r.body.created, r.body.cursor], [2, 3, "3"]);
  const list = await products(DB);
  assert.equal(list.length, 3);
  const v2 = list.find((p) => p.erpVariantId === "v2");
  assert.deepEqual([v2.price, v2.color, v2.category, v2.purchaseEnabled, v2.active, v2.stock], [459.9, "Preto", "sol", false, true, 0]);
  assert.equal(await cursor(DB), "3");
});

test("repetir não duplica e revisões novas preservam fotos e textos do site", async () => {
  const DB = fakeD1();
  const events = [{ revision: "1", variant: variant("v1") }];
  await run(DB, fakeErp(events));
  const [first] = await products(DB);
  // edição editorial pelo painel (tentando também mudar o preço)
  const put = await saveSection({ env: env(DB), params: { section: "products" }, request: new Request("https://site/x", { method: "PUT", headers: { authorization: `Bearer ${TOKEN}` }, body: JSON.stringify([{ ...first, name: "Título editorial", image: "/api/media/foto.webp", tryOnImage: "/api/media/png.png", price: 1 }]) }) });
  assert.equal(put.status, 200);
  let [p] = await products(DB);
  assert.deepEqual([p.name, p.image, p.price], ["Título editorial", "/api/media/foto.webp", 349.9]);
  await run(DB, fakeErp(events)); // repetição: nada novo
  events.push({ revision: "5", variant: variant("v1", { priceMinor: 29990, name: "Nome novo no ERP" }) });
  const r = await run(DB, fakeErp(events));
  assert.equal(r.body.updated, 1);
  const list = await products(DB);
  assert.equal(list.length, 1);
  [p] = list;
  assert.deepEqual([p.name, p.erpName, p.image, p.tryOnImage, p.price, p.erpRevision], ["Título editorial", "Nome novo no ERP", "/api/media/foto.webp", "/api/media/png.png", 299.9, "5"]);
});

test("inativação mantém o conteúdo editorial e a reativação o recupera", async () => {
  const DB = fakeD1();
  const events = [{ revision: "1", variant: variant("v1") }];
  await run(DB, fakeErp(events));
  const [p0] = await products(DB);
  await DB.prepare("UPDATE store_sections SET value=? WHERE section='products'").bind(JSON.stringify([{ ...p0, image: "/foto.webp" }])).run();
  events.push({ revision: "2", variant: variant("v1", { active: false }) });
  await run(DB, fakeErp(events));
  let [p] = await products(DB);
  assert.deepEqual([p.active, p.image], [false, "/foto.webp"]);
  await assert.rejects(priceCart({ DB }, [{ id: p.id, qty: 1 }], "pix"));
  events.push({ revision: "3", variant: variant("v1", { active: true }) });
  await run(DB, fakeErp(events));
  [p] = await products(DB);
  assert.deepEqual([p.active, p.image], [true, "/foto.webp"]);
});

test("produto do ERP não pode ser vendido direto (purchaseEnabled false)", async () => {
  const DB = fakeD1();
  await run(DB, fakeErp([{ revision: "1", variant: variant("v1") }]));
  const [p] = await products(DB);
  await assert.rejects(priceCart({ DB }, [{ id: p.id, qty: 1 }], "pix"), /consulta/);
});

test("página inválida é recusada sem avançar o cursor", async () => {
  for (const bad of [
    { tenantId: "outro" },
    { item: { purchaseEnabled: true } },
    { item: { priceMinor: 10.5 } },
    { item: { category: "lente" } },
  ]) {
    const DB = fakeD1();
    const erp = fakeErp([{ revision: "1", variant: variant("v1", bad.item) }], { tenantId: bad.tenantId ?? "t1" });
    const r = await run(DB, erp);
    assert.equal(r.status, 502);
    assert.equal(r.body.code, "ERP_INVALID_CATALOG");
    assert.equal(await cursor(DB), "0");
    assert.equal((await products(DB)).length, 0);
  }
});

test("campos extras do ERP nunca chegam ao site", async () => {
  const DB = fakeD1();
  await run(DB, fakeErp([{ revision: "1", variant: { ...variant("v1"), cost: 12, supplier: "X", stock: 99 } }]));
  const [p] = await products(DB);
  assert.equal("cost" in p || "supplier" in p, false);
  assert.equal(p.stock, 0);
});

test("falha no meio preserva as páginas confirmadas e o cursor delas", async () => {
  const DB = fakeD1();
  const events = [1, 2, 3, 4].map((n) => ({ revision: String(n), variant: variant(`v${n}`) }));
  const r = await run(DB, fakeErp(events, { failAfter: 1 }));
  assert.equal(r.status, 502);
  assert.equal(r.body.code, "ERP_UNAVAILABLE");
  assert.equal(await cursor(DB), "2");
  assert.equal((await products(DB)).length, 2);
  const again = await run(DB, fakeErp(events));
  assert.equal(again.status, 200);
  assert.equal((await products(DB)).length, 4);
});

test("sincronizações concorrentes: a que perdeu a corrida é desfeita inteira", async () => {
  const DB = fakeD1();
  const erp = fakeErp([{ revision: "1", variant: variant("v1") }]);
  const slow = async (...args) => { const response = await erp.fetcher(...args); DB.raw.exec("UPDATE erp_sync SET cursor='7' WHERE id=1"); return response; };
  const r = await sync({ env: env(DB), request: post() }, { fetcher: slow });
  assert.equal(r.status, 409);
  assert.equal((await products(DB)).length, 0);
  assert.equal(await cursor(DB), "7");
});

test("mesmo banco não troca de empresa/loja silenciosamente", async () => {
  const DB = fakeD1();
  await run(DB, fakeErp([{ revision: "1", variant: variant("v1") }]));
  const r = await run(DB, fakeErp([], { tenantId: "t2" }), {}, { ERP_TENANT_ID: "t2" });
  assert.equal(r.body.code, "ERP_SCOPE_CHANGED");
});

test("vínculo explícito reaproveita produto existente; SKU igual sem vínculo interrompe", async () => {
  const DB = fakeD1();
  const existing = [{ id: 1, name: "Aurora", price: 429, image: "/aurora.webp", type: "Gatinho" }, { id: 2, name: "Nômade", sku: "SKU-v9", price: 389 }];
  await DB.prepare("INSERT INTO store_sections (section, value) VALUES ('products', ?)").bind(JSON.stringify(existing)).run();
  const r = await run(DB, fakeErp([{ revision: "1", variant: variant("v1") }]), { links: [{ variantId: "v1", siteId: "1" }] });
  assert.equal(r.status, 200);
  const aurora = (await products(DB)).find((p) => p.id === 1);
  assert.deepEqual([aurora.name, aurora.image, aurora.type, aurora.price, aurora.erpVariantId], ["Aurora", "/aurora.webp", "Gatinho", 349.9, "v1"]);
  const conflict = await run(DB, fakeErp([{ revision: "1", variant: variant("v1") }, { revision: "2", variant: variant("v9") }]));
  assert.equal(conflict.body.code, "ERP_UNLINKED_SKU_CONFLICT");
  const dup = await run(DB, fakeErp([]), { links: [{ variantId: "v1", siteId: "2" }] });
  assert.equal(dup.body.code, "ERP_INVALID_LINKS");
});

test("painel não remove nem inventa item do ERP", () => {
  const stored = [{ id: 1, erpVariantId: "v1", active: true, price: 100, name: "A" }, { id: 2, erpVariantId: "v2", active: false, price: 50, name: "B" }, { id: 3, name: "Local", price: 10 }];
  assert.throws(() => protectErpFields(stored, [stored[1], stored[2]]), /ERP_PRODUCT_REMOVAL/);
  const kept = protectErpFields(stored, [stored[0], stored[2]]); // inativo removido pelo painel volta para a lista
  assert.equal(kept.some((p) => p.erpVariantId === "v2"), true);
  assert.throws(() => protectErpFields(stored, [...stored, { id: 9, erpVariantId: "v-novo", price: 1 }]), /INVALID_PRODUCTS/);
  const local = protectErpFields(stored, [...stored.slice(0, 2), { ...stored[2], price: 15 }]);
  assert.equal(local.find((p) => p.id === 3).price, 15); // produtos próprios do site continuam editáveis
});

test("revisão antiga nunca sobrescreve uma nova", () => {
  const base = [{ id: 1, erpVariantId: "v1", erpRevision: "10", price: 300 }];
  const r = applyCatalogPage(base, { items: [{ revision: "4", variant: variant("v1", { priceMinor: 100 }) }] });
  assert.equal(r.products[0].price, 300);
  assert.equal(r.skipped, 1);
});

test("exige chave do painel e configuração do ERP", async () => {
  const DB = fakeD1();
  assert.equal((await sync({ env: env(DB), request: post({}, "errada") })).status, 401);
  assert.equal((await sync({ env: env(DB, { ERP_API_URL: "http://inseguro/api/v1" }), request: post() })).status, 503);
  assert.equal((await sync({ env: env(DB, { ERP_STOREFRONT_TOKEN: "curto" }), request: post() })).status, 503);
  const s = await status({ env: env(DB), request: post() });
  assert.equal((await s.json()).configured, true);
});
