import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  Package,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import MercadoPagoPayment from "./MercadoPagoPayment.jsx";
import "./checkout.css";
import "./cep-lookup.css";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export default function Checkout({ cart, setCart, setPage }) {
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState("pix");
  const [error, setError] = useState("");
  const [cepStatus, setCepStatus] = useState({ loading: false, message: "" });
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 499 ? 0 : 24.9;
  const discount = payment === "pix" ? subtotal * 0.1 : 0;
  const total = subtotal + shipping - discount;
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  const updatePhone = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 6 && digits.length <= 10) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    if (digits.length > 10) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    setForm({ ...form, phone: formatted });
  };
  const updateCep = async (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((current) => ({ ...current, cep: formatted }));
    setCepStatus({ loading: false, message: "" });
    if (digits.length !== 8) return;
    setCepStatus({ loading: true, message: "Buscando endereço..." });
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error("Falha na consulta");
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado");
      setForm((current) => ({
        ...current,
        street: data.logradouro || current.street,
        district: data.bairro || current.district,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
      setCepStatus({ loading: false, message: "Endereço encontrado. Confira os dados antes de continuar." });
    } catch {
      setCepStatus({ loading: false, message: "Não foi possível localizar esse CEP. Preencha o endereço manualmente." });
    }
  };
  function next() {
    const required =
      step === 1
        ? ["name", "email", "phone"]
        : ["cep", "street", "number", "district", "city", "state"];
    if (required.some((key) => !form[key].trim())) {
      setError("Preencha todos os campos obrigatórios para continuar.");
      return;
    }
    setError("");
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function finish(result) {
    const completed = { ...result.order, pix: result.pix || null };
    const existing = JSON.parse(localStorage.getItem("oticas-orders") || "[]");
    localStorage.setItem(
      "oticas-orders",
      JSON.stringify([completed, ...existing]),
    );
    setOrder(completed);
    setCart([]);
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (!cart.length && !order)
    return (
      <main className="checkoutEmpty">
        <Package />
        <h1>Seu carrinho está vazio</h1>
        <button className="primary" onClick={() => setPage("catalog")}>
          Escolher produtos
        </button>
      </main>
    );
  if (step === 4)
    return (
      <main className="orderSuccess">
        <div className="successCheck">
          <Check />
        </div>
        <span className="eyebrow">PEDIDO REALIZADO</span>
        <h1>Obrigado pela compra!</h1>
        <p>
          Seu pedido <b>#{order.id}</b> foi recebido.
        </p>
        {order.payment === "pix" && order.pix && (
          <div className="pixBox">
            {order.pix.qrCodeBase64 ? <img src={`data:image/png;base64,${order.pix.qrCodeBase64}`} alt="QR Code PIX" /> : <QrCode />}
            <div>
              <b>PIX de teste gerado</b>
              <span>
                Use o QR Code do Mercado Pago para validar o fluxo sandbox.
              </span>
            </div>
          </div>
        )}
        <div className="successInfo">
          <span>
            Total do pedido <b>{money(order.total)}</b>
          </span>
          <span>
            Status <b>{order.status}</b>
          </span>
        </div>
        <button className="primary" onClick={() => setPage("home")}>
          Voltar para a Home <ArrowRight />
        </button>
      </main>
    );
  return (
    <main className="checkoutPage">
      <button
        className="checkoutBack"
        onClick={() => (step === 1 ? setPage("cart") : setStep(step - 1))}
      >
        <ArrowLeft /> Voltar
      </button>
      <div className="checkoutHeading">
        <span className="eyebrow">FINALIZAR COMPRA</span>
        <h1>Checkout</h1>
        <div className="checkoutSteps">
          {["Identificação", "Entrega", "Pagamento"].map((label, index) => (
            <div className={step >= index + 1 ? "active" : ""} key={label}>
              <i>{step > index + 1 ? <Check /> : index + 1}</i>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="checkoutLayout">
        <section className="checkoutForm">
          {step === 1 && (
            <>
              <div className="checkoutSectionTitle">
                <ShieldCheck />
                <div>
                  <h2>Seus dados</h2>
                  <p>
                    Usaremos essas informações para enviar atualizações do
                    pedido.
                  </p>
                </div>
              </div>
              <label>
                Nome completo *
                <input value={form.name} onChange={update("name")} />
              </label>
              <div className="checkoutRow">
                <label>
                  E-mail *
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                  />
                </label>
                <label>
                  Telefone *
                  <input
                    value={form.phone}
                    onChange={updatePhone}
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength="15"
                    placeholder="(92) 99999-9999"
                  />
                </label>
              </div>
              <label>
                CPF
                <input
                  value={form.cpf}
                  onChange={update("cpf")}
                  placeholder="000.000.000-00"
                />
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <div className="checkoutSectionTitle">
                <MapPin />
                <div>
                  <h2>Endereço de entrega</h2>
                  <p>Informe onde deseja receber seu pedido.</p>
                </div>
              </div>
              <div className="checkoutRow smallFirst">
                <label>
                  CEP *
                  <input
                    value={form.cep}
                    onChange={updateCep}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength="9"
                    placeholder="00000-000"
                  />
                  {cepStatus.message && <small className={cepStatus.loading ? "cepLoading" : "cepMessage"}>{cepStatus.message}</small>}
                </label>
                <label>
                  Rua ou avenida *
                  <input value={form.street} onChange={update("street")} />
                </label>
              </div>
              <div className="checkoutRow">
                <label>
                  Número *
                  <input value={form.number} onChange={update("number")} />
                </label>
                <label>
                  Complemento
                  <input
                    value={form.complement}
                    onChange={update("complement")}
                  />
                </label>
              </div>
              <label>
                Bairro *
                <input value={form.district} onChange={update("district")} />
              </label>
              <div className="checkoutRow">
                <label>
                  Cidade *<input value={form.city} onChange={update("city")} />
                </label>
                <label>
                  Estado *
                  <input
                    maxLength="2"
                    value={form.state}
                    onChange={update("state")}
                    placeholder="AM"
                  />
                </label>
              </div>
              <div className="shippingOption">
                <span>
                  <Package />
                  <b>Entrega padrão</b>
                </span>
                <span>
                  {shipping ? money(shipping) : "Grátis"}
                  <small>5 a 8 dias úteis</small>
                </span>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="checkoutSectionTitle">
                <CreditCard />
                <div>
                  <h2>Forma de pagamento</h2>
                  <p>Escolha como deseja pagar.</p>
                </div>
              </div>
              <div className="paymentOptions">
                <button
                  className={payment === "pix" ? "active" : ""}
                  onClick={() => setPayment("pix")}
                >
                  <QrCode />
                  <span>
                    <b>PIX</b>
                    <small>10% de desconto</small>
                  </span>
                </button>
                <button
                  className={payment === "card" ? "active" : ""}
                  onClick={() => setPayment("card")}
                >
                  <CreditCard />
                  <span>
                    <b>Cartão de crédito</b>
                    <small>Até 10x sem juros</small>
                  </span>
                </button>
              </div>
              <MercadoPagoPayment
                key={payment}
                amount={total}
                payment={payment}
                checkout={{ cart, customer: form }}
                onPaymentCreated={finish}
              />
            </>
          )}
          {error && <p className="checkoutError">{error}</p>}
          {step < 3 && <button className="primary checkoutContinue" onClick={next}>Continuar <ArrowRight /></button>}
        </section>
        <aside className="checkoutSummary">
          <h2>Resumo do pedido</h2>
          {cart.map((item) => (
            <div className="checkoutItem" key={item.id}>
              <div>
                <b>
                  {item.qty}× {item.name}
                </b>
                <small>
                  {item.type} · {item.color}
                </small>
              </div>
              <span>{money(item.price * item.qty)}</span>
            </div>
          ))}
          <hr />
          <p>
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
          </p>
          <p>
            <span>Frete</span>
            <b>{shipping ? money(shipping) : "Grátis"}</b>
          </p>
          {payment === "pix" && (
            <p className="discount">
              <span>Desconto PIX</span>
              <b>− {money(discount)}</b>
            </p>
          )}
          <hr />
          <p className="checkoutTotal">
            <span>Total</span>
            <b>{money(total)}</b>
          </p>
          <small>Ambiente seguro e protegido</small>
        </aside>
      </div>
    </main>
  );
}
