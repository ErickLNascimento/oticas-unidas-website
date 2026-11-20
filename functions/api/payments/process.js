import { json, orderId, priceCart, safeCustomer } from "../../../server/http.mjs";

const cleanDigits = (value) => String(value || "").replace(/\D/g, "");

export async function onRequestPost({ request, env }) {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN?.startsWith("TEST-")) {
    return json({ error: "Credencial TEST do Mercado Pago ainda não configurada." }, 503);
  }
  const body = await request.json().catch(() => ({}));
  const paymentData = body.paymentData?.formData || body.paymentData;
  const { expectedMethod, checkout } = body;
  const cart = checkout?.cart;
  const customer = checkout?.customer;
  if (!paymentData?.payment_method_id || !Array.isArray(cart) || !cart.length || !customer?.email) {
    return json({ error: "Dados do pagamento incompletos." }, 400);
  }
  const actualMethod = paymentData.payment_method_id === "pix" ? "pix" : "card";
  if (!["pix", "card"].includes(expectedMethod) || actualMethod !== expectedMethod) {
    return json({ error: "Forma de pagamento divergente. Atualize a página e tente novamente." }, 400);
  }
  let priced;
  try { priced = await priceCart(env, cart, actualMethod); }
  catch (error) { return json({ error: error.message }, 400); }
  const { items, ...totals } = priced;

  const payer = {
    email: customer.email,
    first_name: customer.name?.trim().split(/\s+/)[0] || undefined,
    identification: cleanDigits(customer.cpf).length === 11
      ? { type: "CPF", number: cleanDigits(customer.cpf) }
      : paymentData.payer?.identification,
  };
  const payload = {
    transaction_amount: totals.total,
    token: paymentData.token,
    description: `Óticas Unidas - ${items.length} item(ns)`,
    installments: Number(paymentData.installments || 1),
    payment_method_id: paymentData.payment_method_id,
    issuer_id: paymentData.issuer_id,
    payer,
  };
  Object.keys(payload).forEach((key) => payload[key] == null && delete payload[key]);

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "content-type": "application/json",
      "x-idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });
  const payment = await response.json();
  if (!response.ok) return json({ error: payment.message || "Pagamento recusado pelo ambiente de testes.", details: payment.cause || [] }, response.status);

  const id = orderId();
  const status = payment.status === "approved" ? "Confirmado" : payment.status === "pending" ? "Aguardando pagamento" : "Pagamento não aprovado";
  const order = {
    id,
    date: new Date().toISOString(),
    customer: safeCustomer(customer),
    items,
    payment: paymentData.payment_method_id === "pix" ? "pix" : "card",
    paymentId: String(payment.id),
    paymentStatus: payment.status,
    ...totals,
    status,
  };
  await env.DB.prepare("INSERT INTO orders (id, value, status) VALUES (?, ?, ?)")
    .bind(id, JSON.stringify(order), status).run();

  return json({
    order,
    paymentId: String(payment.id),
    status: payment.status,
    statusDetail: payment.status_detail,
    pix: payment.point_of_interaction?.transaction_data
      ? {
          qrCode: payment.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
          ticketUrl: payment.point_of_interaction.transaction_data.ticket_url,
        }
      : null,
  }, 201);
}
