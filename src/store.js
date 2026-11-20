// Camada de dados da loja.
// Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY definidos, tudo vai para o Supabase.
// Sem eles, o site funciona em "modo demonstração", salvando só neste navegador.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const isRemote = Boolean(supabase);

const local = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento cheio ou bloqueado */ }
  },
};

const fromRow = (row) => ({
  id: Number(row.id),
  name: row.name,
  category: row.category,
  type: row.type,
  color: row.color,
  price: Number(row.price),
  stock: row.stock,
  tag: row.tag,
  shape: row.shape,
  tone: row.tone,
  image: row.image,
  tryOnImage: row.try_on_image,
});

const toRow = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category || "grau",
  type: p.type || "",
  color: p.color || "",
  price: Number(p.price),
  stock: Math.max(0, Number(p.stock) || 0),
  tag: p.tag || "",
  shape: p.shape || "round",
  tone: p.tone || "#49352b",
  image: p.image || "",
  try_on_image: p.tryOnImage || "",
});

const fromOrder = (row) => ({
  ...row,
  date: row.created_at,
  subtotal: Number(row.subtotal),
  shipping: Number(row.shipping),
  discount: Number(row.discount),
  total: Number(row.total),
});

function check({ data, error }) {
  if (error) throw error;
  return data;
}

// ---------- Catálogo e configurações ----------

export async function loadStore(defaults) {
  if (!isRemote) {
    return {
      frames: local.get("oticas-frames", defaults.frames),
      formats: local.get("oticas-formats", defaults.formats),
      contact: local.get("oticas-contact", defaults.contact),
    };
  }
  const [products, settings] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }).order("id"),
    supabase.from("settings").select("key, value"),
  ]);
  const values = Object.fromEntries(check(settings).map((s) => [s.key, s.value]));
  return {
    frames: check(products).map(fromRow),
    formats: values.formats || defaults.formats,
    contact: { ...defaults.contact, ...values.contact },
  };
}

// Recebe a lista completa (como o painel já trabalha) e grava só o que mudou.
export async function saveProducts(list, changed) {
  if (!isRemote) return local.set("oticas-frames", list);
  if (changed?.length) check(await supabase.from("products").upsert(changed.map(toRow)));
}

export async function deleteProduct(list, id) {
  if (!isRemote) return local.set("oticas-frames", list);
  check(await supabase.from("products").delete().eq("id", id));
}

async function saveSetting(key, value) {
  if (!isRemote) return local.set(`oticas-${key}`, value);
  check(await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }));
}
export const saveFormats = (formats) => saveSetting("formats", formats);
export const saveContact = (contact) => saveSetting("contact", contact);

// ---------- Imagens ----------

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export async function uploadImage(file, folder = "products") {
  if (!isRemote) return readAsDataUrl(file);
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  check(await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" }));
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

// ---------- Pedidos ----------

const CUSTOMER_FIELDS = ["name", "email", "cpf", "phone", "cep", "street", "number", "complement", "district", "city", "state"];

export async function placeOrder({ customer, cart, payment }) {
  // Dados de cartão nunca saem daqui: só contato e endereço são enviados/guardados.
  const safeCustomer = Object.fromEntries(CUSTOMER_FIELDS.map((k) => [k, customer[k] || ""]));
  if (isRemote) {
    const items = cart.map((item) => ({ id: item.id, qty: item.qty }));
    const { data, error } = await supabase.rpc("place_order", { p_customer: safeCustomer, p_items: items, p_payment: payment });
    if (error) {
      const outOfStock = error.message?.startsWith("OUT_OF_STOCK");
      throw new Error(outOfStock
        ? "Um dos produtos da sacola acabou de esgotar. Ajuste a sacola e tente novamente."
        : "Não foi possível registrar o pedido. Verifique os dados e tente novamente.");
    }
    return fromOrder(data);
  }
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 499 ? 0 : 24.9;
  const discount = payment === "pix" ? subtotal * 0.1 : 0;
  const order = {
    id: `OU-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    customer: safeCustomer,
    items: cart.map(({ id, name, type, color, price, qty }) => ({ id, name, type, color, price, qty })),
    payment,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
    status: payment === "pix" ? "Aguardando PIX" : "Aguardando pagamento",
  };
  local.set("oticas-orders", [order, ...local.get("oticas-orders", [])]);
  return order;
}

export async function listOrders() {
  if (!isRemote) return local.get("oticas-orders", []);
  return check(await supabase.from("orders").select("*").order("created_at", { ascending: false })).map(fromOrder);
}

export async function updateOrderStatus(orders, id, status) {
  if (!isRemote) return local.set("oticas-orders", orders);
  check(await supabase.from("orders").update({ status }).eq("id", id));
}

// ---------- Acesso ao painel ----------

export async function getAdminSession() {
  if (!isRemote) return { ok: true };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: false };
  const { data: admin } = await supabase.rpc("is_admin");
  return { ok: Boolean(admin), email: data.session.user.email, notAdmin: !admin };
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("E-mail ou senha incorretos.");
  return getAdminSession();
}

export async function signOut() {
  if (isRemote) await supabase.auth.signOut();
}
