const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const cleanDigits = (value) => String(value || "").replace(/\D/g, "");
const round = (value) => Math.round(value * 100) / 100;

function calculate(cart, paymentMethod) {
  const subtotal = round(cart.reduce((sum, item) => sum + Number(item.price) * Math.max(1, Number(item.qty) || 1), 0));
  const shipping = subtotal >= 499 ? 0 : 24.9;
  const discount = paymentMethod === "pix" ? round(subtotal * 0.1) : 0;
  return { subtotal, shipping, discount, total: round(subtotal + shipping - discount) };
}

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
  const totals = calculate(cart, paymentData.payment_method_id);
  if (!Number.isFinite(totals.total) || totals.total <= 0) return json({ error: "Valor do pedido inválido." }, 400);

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
    description: `Óticas Unidas - ${cart.length} item(ns)`,
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

  const id = `OU-${Date.now().toString().slice(-6)}`;
  const status = payment.status === "approved" ? "Confirmado" : payment.status === "pending" ? "Aguardando pagamento" : "Pagamento não aprovado";
  const order = {
    id,
    date: new Date().toISOString(),
    customer: { ...customer, cardName: undefined, cardNumber: undefined, expiry: undefined, cvv: undefined },
    items: cart,
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
