const ADMIN_TOKEN_KEY = "oticas-admin-token";

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function loadSharedStore() {
  return request("/api/store");
}

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setAdminToken(token) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function saveSharedSection(section, value, token = getAdminToken()) {
  return request(`/api/admin/store/${section}`, {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(value),
  });
}

export async function uploadSharedMedia(file, token = getAdminToken()) {
  const body = new FormData();
  body.append("file", file);
  return request("/api/admin/media", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body,
  });
}

export async function createSharedOrder(order) {
  return request("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(order),
  });
}

export async function loadSharedOrders(token = getAdminToken()) {
  return request("/api/orders", { headers: { authorization: `Bearer ${token}` } });
}

export async function updateSharedOrderStatus(id, status, token = getAdminToken()) {
  return request(`/api/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}
