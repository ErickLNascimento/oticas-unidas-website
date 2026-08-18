import React, { useEffect, useState } from "react";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import { Copy, QrCode } from "lucide-react";
import "./payment.css";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function MercadoPagoPayment({ amount, payment, checkout, onPaymentCreated }) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch("/api/payments/config")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar o pagamento.");
        return data;
      })
      .then((data) => {
        setConfig(data);
        if (data.configured) initMercadoPago(data.publicKey, { locale: "pt-BR" });
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function submit({ formData, selectedPaymentMethod }) {
    setError("");
    const paymentData = {
      ...formData,
      payment_method_id:
        formData?.payment_method_id || selectedPaymentMethod,
    };
    const response = await fetch("/api/payments/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentData, expectedMethod: payment, checkout }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error || "O pagamento não pôde ser processado.";
      setError(message);
      throw new Error(message);
    }
    setResult(data);
    onPaymentCreated(data);
  }

  if (error && !config) return <p className="checkoutError">{error}</p>;
  if (!config) return <div className="paymentLoading">Carregando ambiente de testes…</div>;
  if (!config.configured)
    return (
      <div className="sandboxSetup">
        <b>Ambiente de testes preparado</b>
        <p>Adicione as credenciais TEST do Mercado Pago no arquivo <code>.dev.vars</code> para liberar PIX e cartão.</p>
      </div>
    );
  if (result?.pix?.qrCode)
    return (
      <div className="pixResult">
        <QrCode />
        <h3>PIX de teste gerado</h3>
        {result.pix.qrCodeBase64 && <img src={`data:image/png;base64,${result.pix.qrCodeBase64}`} alt="QR Code PIX" />}
        <textarea readOnly value={result.pix.qrCode} aria-label="Código PIX copia e cola" />
        <button type="button" onClick={() => navigator.clipboard.writeText(result.pix.qrCode)}><Copy /> Copiar código</button>
      </div>
    );

  return (
    <div className="mercadoPagoBox">
      <div className="sandboxBadge">AMBIENTE DE TESTES · nenhum dinheiro real</div>
      <Payment
        initialization={{ amount }}
        customization={{ paymentMethods: payment === "pix" ? { bankTransfer: ["pix"] } : { creditCard: "all" } }}
        onSubmit={submit}
        onError={(brickError) => setError(brickError?.message || "Erro ao carregar o formulário de pagamento.")}
      />
      {error && <p className="checkoutError">{error}</p>}
      <small>Valor desta simulação: {money(amount)}</small>
    </div>
  );
}
