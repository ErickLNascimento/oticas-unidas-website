import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Heart,
  ArrowRight,
  Camera,
  Upload,
  ChevronDown,
  Check,
  Minus,
  Plus,
  Trash2,
  User,
  Package,
  LayoutGrid,
  LogOut,
  Eye,
  Edit3,
  ImagePlus,
  House,
  Download,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
} from "lucide-react";
import "./styles.css";
import "./admin-editor.css";
import "./format-manager.css";
import "./product-admin.css";
import "./frontend-fixes.css";
import "./admin-navigation.css";
import "./tryon-categories.css";
import "./tryon-result.css";
import "./result-actions.css";
import "./contact-settings.css";
import "./user-menu.css";
import "./sales-manager.css";
import "./official-brand.css";
import "./photo-guidance.css";
import "./photo-guidance-fix.css";
import "./mediapipe-tryon.css";
import "./tryon-image-consistency.css";
import { TEXTS } from "./content.js";
import Checkout from "./Checkout.jsx";
import { detectGlassesPlacement } from "./faceLandmarker.js";

const defaultFrames = [
  {
    id: 1,
    name: "Aurora",
    type: "Gatinho",
    color: "Âmbar",
    price: 429,
    tag: "MAIS VENDIDO",
    shape: "cat",
    tone: "#b86f41",
  },
  {
    id: 2,
    name: "Nômade",
    type: "Redondo",
    color: "Tartaruga",
    price: 389,
    tag: "NOVO",
    shape: "round",
    tone: "#49352b",
  },
  {
    id: 3,
    name: "Essencial",
    type: "Retangular",
    color: "Preto",
    price: 349,
    tag: "",
    shape: "rect",
    tone: "#181716",
  },
  {
    id: 4,
    name: "Solaris",
    type: "Aviador",
    color: "Dourado",
    price: 459,
    tag: "EDIÇÃO LIMITADA",
    shape: "aviator",
    tone: "#b08b46",
  },
  {
    id: 5,
    name: "Íris",
    type: "Oval",
    color: "Rosa Chá",
    price: 399,
    tag: "NOVO",
    shape: "oval",
    tone: "#c49191",
  },
  {
    id: 6,
    name: "Horizonte",
    type: "Quadrado",
    color: "Verde Oliva",
    price: 419,
    tag: "",
    shape: "square",
    tone: "#5f6450",
  },
];
const frames = (() => {
  try {
    return JSON.parse(localStorage.getItem("oticas-frames")) || defaultFrames;
  } catch {
    return defaultFrames;
  }
})();
const defaultContact = { instagram: "", facebook: "", email: "contato@oticasunidas.com.br", whatsapp: "", phone: "" };

function Glasses({ shape = "round", tone = "#222", large = false, category = "grau" }) {
  return (
    <div
      className={`glasses ${shape} ${category === "sol" ? "sun" : ""} ${large ? "large" : ""}`}
      style={{ "--tone": tone }}
    >
      <i />
      <b />
      <i />
    </div>
  );
}
function ProductVisual({ f, large = false }) {
  return f.image ? (
    <img className="framePhoto" src={f.image} alt={`Armação ${f.name}`} />
  ) : (
    <Glasses shape={f.shape} tone={f.tone} category={f.category} large={large} />
  );
}
function getTryOnAsset(product) {
  if (product?.tryOnImage) return product.tryOnImage;
  return product?.image?.startsWith("data:image/png") ? product.image : "";
}
function BrandLogo({ dark = false }) {
  return <img className={`officialLogo ${dark ? "onDark" : ""}`} src="/logo-oficial.png" alt="Óticas Unidas — Sua visão em primeiro lugar" />;
}

function Header({ page, setPage, cart }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  return (
    <>
      <div className="topbar">
        {TEXTS.header.announcement} <span>•</span> {TEXTS.header.discount}
      </div>
      <header>
        <button className="brand" onClick={() => setPage("home")}>
          <BrandLogo />
        </button>
        <nav>
          <button onClick={() => setPage("home")}>{TEXTS.header.menu.home}</button>
          <button onClick={() => setPage("catalog")}>{TEXTS.header.menu.prescription}</button>
          <button onClick={() => setPage("sunglasses")}>{TEXTS.header.menu.sunglasses}</button>
          <button onClick={() => setPage("tryon")}>{TEXTS.header.menu.tryOn}</button>
          <button>{TEXTS.header.menu.about}</button>
        </nav>
        <div className="tools">
          <Search />
          <div className="userMenu">
            <button className="userMenuTrigger" aria-label="Abrir menu do usuário" aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen(!userMenuOpen)}><User /></button>
            {userMenuOpen && <div className="userDropdown"><span>MINHA CONTA</span><button onClick={() => { setPage("admin"); setUserMenuOpen(false); }}><LayoutGrid /> Área administrativa</button></div>}
          </div>
          <button className="bag" onClick={() => setPage("cart")}>
            <ShoppingBag />
            <span>{cart.length}</span>
          </button>
          <Menu className="mobile" />
        </div>
      </header>
    </>
  );
}

function Home({ setPage, addCart }) {
  return (
    <main>
      <section className="hero">
        <img src="/hero-optica.png" />
        <div className="heroCopy">
          <span className="eyebrow">{TEXTS.home.collectionLabel}</span>
          <h1>
            {TEXTS.home.title}
            <br />
            <i>{TEXTS.home.titleHighlight}</i>
          </h1>
          <p>
            {TEXTS.home.description}
            <br />
            {TEXTS.home.descriptionSecondLine}
          </p>
          <div>
            <button className="primary" onClick={() => setPage("catalog")}>
              {TEXTS.home.collectionButton} <ArrowRight />
            </button>
            <button className="link" onClick={() => setPage("tryon")}>
              {TEXTS.home.tryOnButton}
            </button>
          </div>
        </div>
        <div className="heroNote">
          <b>{TEXTS.home.imageTitle}</b>
          <span>{TEXTS.home.imageSubtitle}</span>
        </div>
      </section>
      <section className="benefits">{TEXTS.home.benefits.map((benefit) => <div key={benefit.title}><span><strong>{benefit.title}</strong>{benefit.description}</span></div>)}</section>
      <section className="collection">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">{TEXTS.home.featuredLabel}</span>
            <h2>
              {TEXTS.home.featuredTitle}
              <br />
              <i>{TEXTS.home.featuredHighlight}</i>
            </h2>
          </div>
          <p>
            {TEXTS.home.featuredDescription}
            <button onClick={() => setPage("catalog")}>
              {TEXTS.home.seeAll} <ArrowRight />
            </button>
          </p>
        </div>
        <div className="productGrid">
          {frames.slice(0, 3).map((f) => (
            <ProductCard key={f.id} f={f} setPage={setPage} addCart={addCart} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductCard({ f, setPage, addCart }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className="product">
      <div className="productImg">
        <span>{f.tag}</span>
        <button onClick={() => setLiked(!liked)}>
          <Heart fill={liked ? "#9c4f3b" : "none"} />
        </button>
        <Glasses shape={f.shape} tone={f.tone} large />
        <button className="quick" onClick={() => addCart(f)}>
          {TEXTS.catalog.addToBag}
        </button>
      </div>
      <div className="productInfo" onClick={() => setPage("detail")}>
        <div>
          <h3>{f.name}</h3>
          <small>
            {f.type} · {f.color}
          </small>
        </div>
        <strong>R$ {f.price},00</strong>
      </div>
    </article>
  );
}

function Catalog({ setPage, addCart, category = "grau" }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const shown = frames.filter(
    (f) =>
      (f.category || "grau") === category &&
      (filter === "Todos" || f.type === filter) &&
      f.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="page">
      <div className="catalogTitle">
        <span className="eyebrow">{TEXTS.catalog.label}</span>
        <h1>{category === "sol" ? TEXTS.catalog.sunglassesTitle : TEXTS.catalog.prescriptionTitle}</h1>
        <p>{TEXTS.catalog.description}</p>
      </div>
      <div className="catalogTools">
        <div className="search">
          <Search />
          <input
            placeholder={TEXTS.catalog.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="chips">
          {["Todos", "Gatinho", "Redondo", "Retangular", "Aviador"].map((x) => (
            <button
              className={filter === x ? "active" : ""}
              onClick={() => setFilter(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <button className="sort">
          {TEXTS.catalog.sort} <ChevronDown />
        </button>
      </div>
      <p className="count">{shown.length} armações encontradas</p>
      <div className="productGrid four">
        {shown.map((f) => (
          <ProductCard key={f.id} f={f} setPage={setPage} addCart={addCart} />
        ))}
      </div>
    </main>
  );
}

function TryOn({ setPage }) {
  const [photo, setPhoto] = useState(null);
  const [selected, setSelected] = useState(frames[0]);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [placement, setPlacement] = useState(null);
  const [faceStatus, setFaceStatus] = useState("");
  const [tryCategory, setTryCategory] = useState("todos");
  const tryFrames = frames.filter((frame) => tryCategory === "todos" || (frame.category || "grau") === tryCategory);
  function changeTryCategory(category) {
    setTryCategory(category);
    const first = frames.find((frame) => category === "todos" || (frame.category || "grau") === category);
    if (first) setSelected(first);
  }
  const input = useRef();
  function load(e) {
    const file = e.target.files?.[0];
    if (file) { setPhoto(URL.createObjectURL(file)); setPlacement(null); setFaceStatus("Detectando seu rosto..."); }
  }
  async function locateFace(image) {
    try { const detected = await detectGlassesPlacement(image); setPlacement(detected); setFaceStatus(""); return detected; }
    catch { setFaceStatus("Não encontramos um rosto. Use uma foto frontal, nítida e bem iluminada."); return null; }
  }
  function generateResult() {
    if (!photo || !selected) return;
    setGenerating(true);
    const image = new Image();
    image.onload = async () => {
      const detected = placement || await locateFace(image);
      if (!detected) { setGenerating(false); return; }
      const maxWidth = 1200;
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth * scale;
      canvas.height = image.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const centerX = canvas.width * detected.x;
      const centerY = canvas.height * detected.y;
      const lensWidth = canvas.width * detected.width * 0.44;
      const lensHeight = lensWidth * (selected.shape === "rect" ? 0.65 : 0.82);
      const gap = lensWidth * 0.22;
      const leftX = centerX - gap / 2 - lensWidth;
      const rightX = centerX + gap / 2;
      ctx.lineWidth = Math.max(5, canvas.width * 0.009);
      ctx.strokeStyle = selected.tone || "#222";
      ctx.fillStyle = selected.category === "sol" ? "rgba(35,30,27,.68)" : "rgba(255,255,255,.08)";
      const radius = selected.shape === "rect" ? lensHeight * 0.18 : lensHeight * 0.48;
      ctx.save(); ctx.translate(centerX, centerY); ctx.rotate((detected.angle * Math.PI) / 180); ctx.translate(-centerX, -centerY);
      const selectedAsset = getTryOnAsset(selected);
      if (selectedAsset) {
        const frameAsset = new Image();
        frameAsset.onload = () => { const frameWidth = canvas.width * detected.width; const frameHeight = frameWidth * (frameAsset.naturalHeight / frameAsset.naturalWidth); ctx.drawImage(frameAsset, centerX - frameWidth / 2, centerY - frameHeight / 2, frameWidth, frameHeight); ctx.restore(); setResult(canvas.toDataURL("image/jpeg", 0.92)); setGenerating(false); };
        frameAsset.onerror = () => { ctx.restore(); setGenerating(false); setFaceStatus("Não foi possível carregar a imagem transparente da armação."); };
        frameAsset.src = selectedAsset; return;
      }
      const drawLens = (x) => { ctx.beginPath(); ctx.roundRect(x, centerY - lensHeight / 2, lensWidth, lensHeight, radius); ctx.fill(); ctx.stroke(); };
      drawLens(leftX); drawLens(rightX);
      ctx.beginPath(); ctx.moveTo(leftX + lensWidth, centerY); ctx.lineTo(rightX, centerY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(leftX, centerY - lensHeight * .25); ctx.lineTo(leftX - lensWidth * .48, centerY - lensHeight * .38); ctx.moveTo(rightX + lensWidth, centerY - lensHeight * .25); ctx.lineTo(rightX + lensWidth * 1.48, centerY - lensHeight * .38); ctx.stroke();
      ctx.restore();
      setResult(canvas.toDataURL("image/jpeg", 0.92));
      setGenerating(false);
    };
    image.onerror = () => setGenerating(false);
    image.src = photo;
  }
  return (
    <main className="tryPage">
      <div className="tryIntro">
        <span className="eyebrow">{TEXTS.tryOn.label}</span>
        <h1>
          {TEXTS.tryOn.title}
          <br />
          <i>{TEXTS.tryOn.titleHighlight}</i>
        </h1>
        <p>
          {TEXTS.tryOn.description}
        </p>
        <div className="steps">
          <span className="on">1</span>
          <i />
          <span className={photo ? "on" : ""}>2</span>
          <i />
          <span className={photo ? "on" : ""}>3</span>
        </div>
        <div className="stepLabels">
          <b>Escolha uma foto</b>
          <b>Selecione a armação</b>
          <b>Veja o resultado</b>
        </div>
      </div>
      <div className="studio">
        <section className="photoStage">
          {photo ? (
            <>
              <img src={photo} onLoad={(event) => locateFace(event.currentTarget)} />
              {placement && <div className="faceGlasses detected" style={{left:`${placement.x * 100}%`,top:`${placement.y * 100}%`,width:`${placement.width * 100}%`,transform:`translate(-50%,-50%) rotate(${placement.angle}deg)`}}>
                {getTryOnAsset(selected) ? <img className="tryOnFrameAsset" src={getTryOnAsset(selected)} alt={`Armação ${selected.name}`}/> : <Glasses shape={selected.shape} tone={selected.tone} category={selected.category} large />}
              </div>
              }
              {faceStatus && <div className="faceStatus">{faceStatus}</div>}
              <button className="change" onClick={() => input.current.click()}>
                <Edit3 /> Trocar foto
              </button>
            </>
          ) : (
            <div className="upload">
              <div>
                <Camera />
              </div>
              <h2>{TEXTS.tryOn.uploadTitle}</h2>
              <p>
                {TEXTS.tryOn.uploadHelp}
              </p>
              <div className="photoGuidance"><Camera/><span><b>Dica para um resultado melhor</b>{TEXTS.tryOn.photoTip}</span></div>
              <button className="primary" onClick={() => input.current.click()}>
                <Upload /> {TEXTS.tryOn.galleryButton}
              </button>
              <button className="camera">
                <Camera /> {TEXTS.tryOn.cameraButton}
              </button>
              <small>JPG ou PNG · Máximo 10 MB</small>
            </div>
          )}
          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={load}
          />
        </section>
        <aside className="framePicker">
          <div>
            <span className="eyebrow">2 · ESCOLHA SUA ARMAÇÃO</span>
            <h2>{TEXTS.tryOn.chooseFrame}</h2>
            <div className="tryCategoryTabs">
              <button className={tryCategory === "todos" ? "active" : ""} onClick={() => changeTryCategory("todos")}>Todos</button>
              <button className={tryCategory === "grau" ? "active" : ""} onClick={() => changeTryCategory("grau")}>Grau</button>
              <button className={tryCategory === "sol" ? "active" : ""} onClick={() => changeTryCategory("sol")}>Sol</button>
            </div>
          </div>
          <div className="miniFrames">
            {tryFrames.map((f) => (
              <button
                className={selected.id === f.id ? "selected" : ""}
                onClick={() => setSelected(f)}
              >
                {getTryOnAsset(f) ? <img className="miniTryOnAsset" src={getTryOnAsset(f)} alt={f.name}/> : <ProductVisual f={f}/>} 
                <span>{f.name}</span>
                <small>R$ {f.price},00</small>
                {selected.id === f.id && <Check />}
              </button>
            ))}
          </div>
          {photo && (
            <button className="primary full" onClick={generateResult} disabled={generating}>
              {generating ? "Gerando resultado..." : TEXTS.tryOn.generateButton} {!generating && <ArrowRight />}
            </button>
          )}
          <p className="privacy">
            🔒 Sua foto é privada e não fica armazenada.
          </p>
        </aside>
      </div>
      {result && <div className="overlay resultOverlay"><div className="tryResult"><button className="resultClose" onClick={() => setResult(null)}><X /></button><span className="eyebrow">SEU RESULTADO</span><h2>Ficou a sua cara.</h2><img src={result} alt={`Resultado com o modelo ${selected.name}`} /><div className="resultActions"><button className="cancel" onClick={() => setResult(null)}><ArrowRight className="backIcon" /> Voltar ao provador</button><button className="homeResult" onClick={() => setPage("home")}><House /> Ir para a Home</button><a className="primary" href={result} download={`provador-${selected.name.toLowerCase()}.jpg`}><Download /> Baixar imagem</a></div><small>Resultado demonstrativo. Ajuste a posição usando uma foto frontal para maior precisão.</small></div></div>}
    </main>
  );
}

function Cart({ cart, setCart, setPage }) {
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  function qty(id, n) {
    setCart(
      cart.map((x) =>
        x.id === id ? { ...x, qty: Math.max(1, x.qty + n) } : x,
      ),
    );
  }
  return (
    <main className="page cartPage">
      <span className="eyebrow">{TEXTS.cart.label}</span>
      <h1>{TEXTS.cart.title}</h1>
      {!cart.length ? (
        <div className="empty">
          <ShoppingBag />
          <h2>{TEXTS.cart.emptyTitle}</h2>
          <p>{TEXTS.cart.emptyDescription}</p>
          <button className="primary" onClick={() => setPage("catalog")}>
            Ver armações
          </button>
        </div>
      ) : (
        <div className="cartLayout">
          <section>
            {cart.map((x) => (
              <div className="cartItem">
                <div className="cartPic">
                  <Glasses shape={x.shape} tone={x.tone} />
                </div>
                <div>
                  <h3>{x.name}</h3>
                  <p>
                    {x.type} · {x.color}
                  </p>
                  <button
                    className="remove"
                    onClick={() => setCart(cart.filter((i) => i.id !== x.id))}
                  >
                    <Trash2 /> Remover
                  </button>
                </div>
                <div className="quantity">
                  <button onClick={() => qty(x.id, -1)}>
                    <Minus />
                  </button>
                  <span>{x.qty}</span>
                  <button onClick={() => qty(x.id, 1)}>
                    <Plus />
                  </button>
                </div>
                <strong>R$ {x.price * x.qty},00</strong>
              </div>
            ))}
          </section>
          <aside className="summary">
            <h2>Resumo do pedido</h2>
            <p>
              <span>Subtotal</span>
              <b>R$ {total},00</b>
            </p>
            <p>
              <span>Frete</span>
              <b>{total >= 499 ? "Grátis" : "Calculado no checkout"}</b>
            </p>
            <hr />
            <p className="total">
              <span>Total</span>
              <b>R$ {total},00</b>
            </p>
            <small>
              ou 10x de R$ {(total / 10).toFixed(2).replace(".", ",")} sem juros
            </small>
            <button className="primary full" onClick={() => setPage("checkout")}>
              {TEXTS.cart.continueButton} <ArrowRight />
            </button>
            <div className="secure">🔒 Compra segura e protegida</div>
          </aside>
        </div>
      )}
    </main>
  );
}

function Admin() {
  const [items, setItems] = useState(frames);
  const [modal, setModal] = useState(false);
  return (
    <main className="admin">
      <aside>
        <div className="brand"><BrandLogo dark /></div>
        <nav>
          <button>
            <LayoutGrid />
            Visão geral
          </button>
          <button className="active">
            <Package />
            Produtos
          </button>
          <button>
            <ShoppingBag />
            Pedidos <i>8</i>
          </button>
          <button>
            <User />
            Clientes
          </button>
        </nav>
        <div className="adminUser">
          <span>EU</span>
          <div>
            <b>Erick</b>
            <small>Administrador</small>
          </div>
          <LogOut />
        </div>
      </aside>
      <section>
        <header>
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h1>Armações</h1>
            <p>Gerencie os produtos disponíveis na sua loja.</p>
          </div>
          <button className="primary" onClick={() => setModal(true)}>
            <Plus /> Nova armação
          </button>
        </header>
        <div className="stats">
          <div>
            <small>Total de armações</small>
            <b>{items.length}</b>
            <span>+2 este mês</span>
          </div>
          <div>
            <small>Em estoque</small>
            <b>{items.length - 1}</b>
            <span className="green">Estoque saudável</span>
          </div>
          <div>
            <small>Estoque baixo</small>
            <b>1</b>
            <span className="red">Requer atenção</span>
          </div>
        </div>
        <div className="tableBox">
          <div className="tableTools">
            <div className="search">
              <Search />
              <input placeholder="Buscar por nome ou SKU..." />
            </div>
            <button>
              Todos os status <ChevronDown />
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th>SKU</th>
                <th>PREÇO</th>
                <th>ESTOQUE</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => (
                <tr>
                  <td>
                    <div className="tiny">
                      <Glasses shape={f.shape} tone={f.tone} />
                    </div>
                    <span>
                      <b>{f.name}</b>
                      <small>
                        {f.type} · {f.color}
                      </small>
                    </span>
                  </td>
                  <td>OU-{String(f.id).padStart(4, "0")}</td>
                  <td>R$ {f.price},00</td>
                  <td>{i === 4 ? "3" : "12"} un.</td>
                  <td>
                    <span className={i === 4 ? "low" : "published"}>
                      {i === 4 ? "Estoque baixo" : "Publicado"}
                    </span>
                  </td>
                  <td>
                    <button>
                      <Edit3 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {modal && (
        <div className="overlay">
          <div className="modal">
            <button className="close" onClick={() => setModal(false)}>
              <X />
            </button>
            <span className="eyebrow">NOVO PRODUTO</span>
            <h2>Cadastrar armação</h2>
            <label>
              Nome da armação
              <input placeholder="Ex: Sereno" />
            </label>
            <div className="row">
              <label>
                Formato
                <select>
                  <option>Redondo</option>
                  <option>Gatinho</option>
                  <option>Retangular</option>
                </select>
              </label>
              <label>
                Cor
                <input placeholder="Ex: Azul petróleo" />
              </label>
            </div>
            <div className="row">
              <label>
                Preço
                <input placeholder="R$ 0,00" />
              </label>
              <label>
                Estoque
                <input type="number" placeholder="0" />
              </label>
            </div>
            <label>
              Fotos do produto
              <button className="drop">
                <ImagePlus />
                Clique para adicionar fotos<small>PNG ou JPG até 10 MB</small>
              </button>
            </label>
            <button className="primary full" onClick={() => setModal(false)}>
              Salvar armação
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState([]);
  const [contactInfo, setContactInfo] = useState(() => { try { return JSON.parse(localStorage.getItem("oticas-contact")) || defaultContact; } catch { return defaultContact; } });
  function addCart(f) {
    setCart((c) => {
      const old = c.find((x) => x.id === f.id);
      return old
        ? c.map((x) => (x.id === f.id ? { ...x, qty: x.qty + 1 } : x))
        : [...c, { ...f, qty: 1 }];
    });
  }
  if (page === "admin") return <Admin contactInfo={contactInfo} setContactInfo={setContactInfo} />;
  return (
    <>
      <Header page={page} setPage={setPage} cart={cart} />
      {page === "home" && <Home setPage={setPage} addCart={addCart} />}{" "}
      {page === "catalog" && <Catalog setPage={setPage} addCart={addCart} />}{" "}
      {page === "sunglasses" && (
        <Catalog category="sol" setPage={setPage} addCart={addCart} />
      )}
      {page === "tryon" && <TryOn setPage={setPage} />}{" "}
      {page === "cart" && (
        <Cart cart={cart} setCart={setCart} setPage={setPage} />
      )}
      {page === "checkout" && (
        <Checkout cart={cart} setCart={setCart} setPage={setPage} />
      )}
      <footer>
        <div className="brand"><BrandLogo dark /></div>
        <p>{TEXTS.footer.slogan}</p>
        <div className="footerContacts">
          {contactInfo.instagram && <a href={contactInfo.instagram} target="_blank" rel="noreferrer"><Camera /> Instagram</a>}
          {contactInfo.facebook && <a href={contactInfo.facebook} target="_blank" rel="noreferrer"><Globe /> Facebook</a>}
          {contactInfo.email && <a href={`mailto:${contactInfo.email}`}><Mail /> {contactInfo.email}</a>}
          {contactInfo.whatsapp && <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Phone /> WhatsApp</a>}
          {contactInfo.phone && <a href={`tel:${contactInfo.phone.replace(/\D/g, "")}`}><Phone /> {contactInfo.phone}</a>}
        </div>
      </footer>
    </>
  );
}

function AdminSection({ view, items }) {
  const content = {
    overview: { eyebrow: "PAINEL", title: "Visão geral", description: "Acompanhe os principais números da sua ótica." },
    orders: { eyebrow: "VENDAS", title: "Pedidos", description: "Acompanhe os pedidos realizados na loja." },
    customers: { eyebrow: "RELACIONAMENTO", title: "Clientes", description: "Consulte sua base de clientes." },
  }[view];
  if (!content) return null;
  return <section className="adminSecondary"><header><div><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p></div></header>{view === "overview" && <><div className="stats"><div><small>Produtos cadastrados</small><b>{items.length}</b><span>Catálogo completo</span></div><div><small>Unidades em estoque</small><b>{items.reduce((total,item)=>total+Number(item.stock||0),0)}</b><span className="green">Disponíveis para venda</span></div><div><small>Pedidos recentes</small><b>8</b><span>Últimos 30 dias</span></div></div><div className="adminWelcome"><LayoutGrid/><h2>Bem-vindo ao painel</h2><p>Use o menu lateral para gerenciar produtos, acompanhar pedidos e consultar clientes.</p></div></>}{view === "orders" && <div className="tableBox simpleAdminTable"><table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>DATA</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody><tr><td>#OU-1008</td><td>Mariana Silva</td><td>Hoje, 10:32</td><td>R$ 429,00</td><td><span className="published">Confirmado</span></td></tr><tr><td>#OU-1007</td><td>Lucas Almeida</td><td>Ontem, 16:18</td><td>R$ 389,00</td><td><span className="low">Em separação</span></td></tr></tbody></table></div>}{view === "customers" && <div className="tableBox simpleAdminTable"><table><thead><tr><th>CLIENTE</th><th>E-MAIL</th><th>PEDIDOS</th><th>ÚLTIMA COMPRA</th></tr></thead><tbody><tr><td>Mariana Silva</td><td>mariana@email.com</td><td>3</td><td>Hoje</td></tr><tr><td>Lucas Almeida</td><td>lucas@email.com</td><td>1</td><td>Ontem</td></tr></tbody></table></div>}</section>;
}

function ContactSettings({ value, onSave }) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  function submit(e) { e.preventDefault(); onSave(draft); localStorage.setItem("oticas-contact", JSON.stringify(draft)); setSaved(true); setTimeout(() => setSaved(false), 2200); }
  const field = (key, label, placeholder, type = "text") => <label>{label}<input type={type} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} placeholder={placeholder} /></label>;
  return <section className="adminSecondary contactSettings"><header><div><span className="eyebrow">CONFIGURAÇÕES</span><h1>Contato e redes</h1><p>Altere os dados exibidos no rodapé da loja.</p></div></header><form className="contactForm" onSubmit={submit}><div className="contactFormTitle"><Globe/><div><h2>Redes sociais e atendimento</h2><p>Deixe em branco os canais que não deseja exibir.</p></div></div>{field("instagram", "Instagram", "https://instagram.com/suaotica", "url")}{field("facebook", "Facebook", "https://facebook.com/suaotica", "url")}<div className="row">{field("email", "E-mail", "contato@suaotica.com", "email")}{field("whatsapp", "WhatsApp com DDD", "5592999999999")}</div>{field("phone", "Telefone", "(92) 3333-3333")}<button className="primary" type="submit">{saved ? <><Check/> Alterações salvas</> : "Salvar contatos"}</button></form></section>;
}

function SalesManager({ orders, setOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  const filtered = orders.filter((order) => `${order.id} ${order.customer?.name} ${order.customer?.email}`.toLowerCase().includes(search.toLowerCase()));
  const revenue = orders.reduce((total, order) => total + Number(order.total || 0), 0);
  function updateStatus(orderId, status) {
    const updated = orders.map((order) => order.id === orderId ? { ...order, status } : order);
    setOrders(updated); localStorage.setItem("oticas-orders", JSON.stringify(updated));
    setSelectedOrder((current) => current?.id === orderId ? { ...current, status } : current);
  }
  return <section className="adminSecondary salesManager"><header><div><span className="eyebrow">VENDAS</span><h1>Pedidos</h1><p>Gerencie pagamentos, clientes e entregas.</p></div></header><div className="stats"><div><small>Total vendido</small><b>{money(revenue)}</b><span>Todos os pedidos</span></div><div><small>Pedidos recebidos</small><b>{orders.length}</b><span className="green">Registrados no checkout</span></div><div><small>Aguardando pagamento</small><b>{orders.filter((order) => order.status?.includes("Aguardando")).length}</b><span className="red">Requer atenção</span></div></div><div className="tableBox"><div className="tableTools"><div className="search"><Search/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido ou cliente..."/></div></div>{filtered.length ? <table><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>PAGAMENTO</th><th>TOTAL</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td>#{order.id}</td><td><span><b>{order.customer?.name}</b><small>{order.customer?.email}</small></span></td><td>{order.payment === "pix" ? "PIX" : "Cartão"}</td><td>{money(order.total)}</td><td><select className="statusSelect" value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}><option>Aguardando PIX</option><option>Confirmado</option><option>Em separação</option><option>Enviado</option><option>Entregue</option><option>Cancelado</option></select></td><td><button className="editButton" onClick={() => setSelectedOrder(order)}><Eye/> Ver detalhes</button></td></tr>)}</tbody></table> : <div className="noOrders"><ShoppingBag/><h2>Nenhum pedido encontrado</h2><p>As vendas concluídas no checkout aparecerão aqui.</p></div>}</div>{selectedOrder && <div className="overlay"><div className="modal orderModal"><button className="close" onClick={() => setSelectedOrder(null)}><X/></button><span className="eyebrow">PEDIDO #{selectedOrder.id}</span><h2>Detalhes da venda</h2><div className="orderDetailGrid"><div className="orderDetailBlock"><h3><User/> Cliente</h3><p><b>{selectedOrder.customer?.name}</b></p><p>{selectedOrder.customer?.email}</p><p>{selectedOrder.customer?.phone}</p>{selectedOrder.customer?.cpf && <p>CPF: {selectedOrder.customer.cpf}</p>}</div><div className="orderDetailBlock"><h3><MapPin/> Entrega</h3><p>{selectedOrder.customer?.street}, {selectedOrder.customer?.number}</p>{selectedOrder.customer?.complement && <p>{selectedOrder.customer.complement}</p>}<p>{selectedOrder.customer?.district}</p><p>{selectedOrder.customer?.city} · {selectedOrder.customer?.state}</p><p>CEP {selectedOrder.customer?.cep}</p></div></div><div className="orderDetailBlock paymentDetail"><h3><CreditCard/> Pagamento</h3><p><span>Forma</span><b>{selectedOrder.payment === "pix" ? "PIX" : "Cartão de crédito"}</b></p><p><span>Status</span><select className="statusSelect" value={selectedOrder.status} onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}><option>Aguardando PIX</option><option>Confirmado</option><option>Em separação</option><option>Enviado</option><option>Entregue</option><option>Cancelado</option></select></p></div><div className="orderProducts"><h3>Itens do pedido</h3>{selectedOrder.items?.map((item) => <div key={item.id}><span>{item.qty}× {item.name}<small>{item.type} · {item.color}</small></span><b>{money(item.price * item.qty)}</b></div>)}<hr/><p><span>Subtotal</span><b>{money(selectedOrder.subtotal)}</b></p><p><span>Frete</span><b>{selectedOrder.shipping ? money(selectedOrder.shipping) : "Grátis"}</b></p>{selectedOrder.discount > 0 && <p className="discount"><span>Desconto</span><b>− {money(selectedOrder.discount)}</b></p>}<p className="orderGrandTotal"><span>Total</span><b>{money(selectedOrder.total)}</b></p></div></div></div>}</section>;
}

Admin = function AdminEditor({ contactInfo, setContactInfo }) {
  const blank = {
    category: "grau",
    name: "",
    type: "Redondo",
    color: "",
    price: "",
    stock: "0",
    tag: "",
    shape: "round",
    tone: "#49352b",
    image: "",
    tryOnImage: "",
  };
  const [items, setItems] = useState(() =>
    frames.map((f, i) => ({ ...f, category: f.category || "grau", stock: f.stock ?? (i === 4 ? 3 : 12) })),
  );
  const [adminView, setAdminView] = useState("products");
  const [orders, setOrders] = useState(() => { try { return JSON.parse(localStorage.getItem("oticas-orders")) || []; } catch { return []; } });
  const [adminCategory, setAdminCategory] = useState("todos");
  const [editing, setEditing] = useState(false);
  const [formatModal, setFormatModal] = useState(false);
  const [formatDraft, setFormatDraft] = useState({ name: "", shape: "round" });
  const [editingFormat, setEditingFormat] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const fileInput = useRef();
  const tryOnInput = useRef();
  const [formats, setFormats] = useState(() => {
    const defaults = [
      { name: "Redondo", shape: "round" },
      { name: "Gatinho", shape: "cat" },
      { name: "Retangular", shape: "rect" },
      { name: "Aviador", shape: "aviator" },
      { name: "Oval", shape: "oval" },
      { name: "Quadrado", shape: "square" },
    ];
    try {
      return JSON.parse(localStorage.getItem("oticas-formats")) || defaults;
    } catch {
      return defaults;
    }
  });
  const shapes = Object.fromEntries(formats.map((item) => [item.name, item.shape]));
  function persistFormats(next) {
    setFormats(next);
    localStorage.setItem("oticas-formats", JSON.stringify(next));
  }
  function saveFormat(e) {
    e.preventDefault();
    const name = formatDraft.name.trim();
    if (!name) return;
    if (formats.some((item, index) => item.name.toLowerCase() === name.toLowerCase() && index !== editingFormat)) {
      setError("Já existe um formato com esse nome.");
      return;
    }
    const next = editingFormat === null
      ? [...formats, { name, shape: formatDraft.shape }]
      : formats.map((item, index) => index === editingFormat ? { name, shape: formatDraft.shape } : item);
    if (editingFormat !== null) {
      const oldName = formats[editingFormat].name;
      const updatedItems = items.map((item) => item.type === oldName ? { ...item, type: name, shape: formatDraft.shape } : item);
      setItems(updatedItems);
      frames.splice(0, frames.length, ...updatedItems);
      localStorage.setItem("oticas-frames", JSON.stringify(updatedItems));
    }
    persistFormats(next);
    setFormatDraft({ name: "", shape: "round" });
    setEditingFormat(null);
    setError("");
  }
  function editFormat(item, index) {
    setEditingFormat(index);
    setFormatDraft({ ...item });
  }
  function removeFormat(index) {
    const target = formats[index];
    if (items.some((item) => item.type === target.name)) {
      setError(`O formato ${target.name} está sendo usado por uma armação e não pode ser removido.`);
      return;
    }
    persistFormats(formats.filter((_, itemIndex) => itemIndex !== index));
    setError("");
  }
  function openNew() {
    setEditing("new");
    setForm({
      ...blank,
      category: adminCategory === "sol" ? "sol" : "grau",
    });
    setError("");
  }
  function openEdit(item) {
    setEditing(item.id);
    setForm({
      ...item,
      price: String(item.price),
      stock: String(item.stock ?? 0),
    });
    setError("");
  }
  function close() {
    setEditing(false);
    setError("");
  }
  function choosePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((v) => ({
        ...v,
        image: reader.result,
        tryOnImage: file.type === "image/png" && !v.tryOnImage ? reader.result : v.tryOnImage,
      }));
      setError("");
    };
    reader.readAsDataURL(file);
  }
  function chooseTryOnPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") { setError("A imagem do provador deve ser um arquivo PNG com fundo transparente."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("A imagem do provador deve ter no máximo 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm((current) => ({ ...current, tryOnImage: reader.result })); setError(""); };
    reader.readAsDataURL(file);
  }
  function save(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.color.trim() || Number(form.price) <= 0) {
      setError("Preencha nome, cor e um preço válido.");
      return;
    }
    const product = {
      ...form,
      id: editing === "new" ? Date.now() : editing,
      name: form.name.trim(),
      color: form.color.trim(),
      price: Number(form.price),
      stock: Math.max(0, Number(form.stock) || 0),
      shape: shapes[form.type] || form.shape,
      tag: form.tag || "",
    };
    const updated =
      editing === "new"
        ? [product, ...items]
        : items.map((x) => (x.id === editing ? product : x));
    setItems(updated);
    frames.splice(0, frames.length, ...updated);
    localStorage.setItem("oticas-frames", JSON.stringify(updated));
    close();
  }
  function removeProduct(product) {
    const confirmed = window.confirm(`Remover ${product.name}? Esta ação não poderá ser desfeita.`);
    if (!confirmed) return;
    const updated = items.filter((item) => item.id !== product.id);
    setItems(updated);
    frames.splice(0, frames.length, ...updated);
    localStorage.setItem("oticas-frames", JSON.stringify(updated));
  }
  const low = items.filter((x) => Number(x.stock) <= 3).length;
  const visibleItems = adminCategory === "todos" ? items : items.filter((item) => item.category === adminCategory);
  return (
    <main className="admin">
      <aside>
        <div className="brand"><BrandLogo dark /></div>
        <nav>
          <button onClick={() => window.location.reload()}>
            <House />
            Home
          </button>
          <button className={adminView === "overview" ? "active" : ""} onClick={() => setAdminView("overview")}>
            <LayoutGrid />
            Visão geral
          </button>
          <button className={adminView === "products" ? "active" : ""} onClick={() => setAdminView("products")}>
            <Package />
            Produtos
          </button>
          <button className={adminView === "orders" ? "active" : ""} onClick={() => setAdminView("orders")}>
            <ShoppingBag />
            Pedidos {orders.length > 0 && <i>{orders.length}</i>}
          </button>
          <button className={adminView === "customers" ? "active" : ""} onClick={() => setAdminView("customers")}>
            <User />
            Clientes
          </button>
          <button className={adminView === "contacts" ? "active" : ""} onClick={() => setAdminView("contacts")}>
            <Globe />
            Contato e redes
          </button>
        </nav>
        <div className="adminUser">
          <span>EU</span>
          <div>
            <b>Erick</b>
            <small>Administrador</small>
          </div>
          <button className="logoutButton" onClick={() => window.location.reload()} title="Sair da área administrativa"><LogOut /></button>
        </div>
      </aside>
      {adminView !== "products" && adminView !== "orders" && <AdminSection view={adminView} items={items} />}
      {adminView === "orders" && <SalesManager orders={orders} setOrders={setOrders} />}
      {adminView === "contacts" && <ContactSettings value={contactInfo} onSave={setContactInfo} />}
      <section className={adminView === "products" ? "" : "adminSectionHidden"}>
        <header>
          <div>
            <span className="eyebrow">CATÁLOGO</span>
            <h1>{TEXTS.admin.productsTitle}</h1>
            <p>{TEXTS.admin.productsDescription}</p>
          </div>
          <div className="adminHeaderActions">
            <button className="manageFormats" onClick={() => { setFormatModal(true); setError(""); }}>
              <Edit3 /> {TEXTS.admin.manageModels}
            </button>
            <button className="primary" onClick={openNew}>
              <Plus /> {TEXTS.admin.newProduct}
            </button>
          </div>
        </header>
        <div className="stats">
          <div>
            <small>Total de armações</small>
            <b>{items.length}</b>
            <span>Produtos cadastrados</span>
          </div>
          <div>
            <small>Em estoque</small>
            <b>{items.filter((x) => Number(x.stock) > 0).length}</b>
            <span className="green">Disponíveis para venda</span>
          </div>
          <div>
            <small>Estoque baixo</small>
            <b>{low}</b>
            <span className="red">Até 3 unidades</span>
          </div>
        </div>
        <div className="tableBox">
          <div className="tableTools">
            <div className="search">
              <Search />
              <input placeholder="Buscar por nome ou SKU..." />
            </div>
            <div className="adminCategoryTabs">
              <button className={adminCategory === "todos" ? "active" : ""} onClick={() => setAdminCategory("todos")}>Todos</button>
              <button className={adminCategory === "grau" ? "active" : ""} onClick={() => setAdminCategory("grau")}>Armações de grau</button>
              <button className={adminCategory === "sol" ? "active" : ""} onClick={() => setAdminCategory("sol")}>Óculos de sol</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th>SKU</th>
                <th>PREÇO</th>
                <th>ESTOQUE</th>
                <th>STATUS</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="tiny">
                      <ProductVisual f={f} />
                    </div>
                    <span>
                      <b>{f.name}</b>
                      <small>
                        {f.type} · {f.color}
                      </small>
                    </span>
                  </td>
                  <td>OU-{String(f.id).slice(-4).padStart(4, "0")}</td>
                  <td>R$ {f.price},00</td>
                  <td>{f.stock} un.</td>
                  <td>
                    <span
                      className={Number(f.stock) <= 3 ? "low" : "published"}
                    >
                      {Number(f.stock) <= 3 ? "Estoque baixo" : "Publicado"}
                    </span>
                  </td>
                  <td>
                    <div className="productActions"><button className="editButton" onClick={() => openEdit(f)}><Edit3 /> Editar</button><button className="deleteButton" onClick={() => removeProduct(f)}><Trash2 /> Remover</button></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <div className="overlay">
          <form className="modal" onSubmit={save}>
            <button type="button" className="close" onClick={close}>
              <X />
            </button>
            <span className="eyebrow">
              {editing === "new" ? "NOVO PRODUTO" : "EDITAR PRODUTO"}
            </span>
            <h2>
              {editing === "new" ? "Cadastrar produto" : "Editar produto"}
            </h2>
            <label>
              Categoria
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="grau">Armação de grau</option>
                <option value="sol">Óculos de sol</option>
              </select>
            </label>
            <label>
              Nome da armação
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Sereno"
              />
            </label>
            <div className="row">
              <label>
                Formato
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                      shape: shapes[e.target.value],
                    })
                  }
                >
                  {Object.keys(shapes).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Cor
                <input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="Ex: Azul petróleo"
                />
              </label>
            </div>
            <div className="row">
              <label>
                Preço (R$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </label>
              <label>
                Estoque
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </label>
            </div>
            <label>
              Foto principal
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={choosePhoto}
              />
              {form.image ? (
                <div className="imagePreview">
                  <img src={form.image} alt="Prévia da armação" />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInput.current.click()}
                    >
                      <ImagePlus /> Trocar foto
                    </button>
                    <button
                      type="button"
                      className="removePhoto"
                      onClick={() => setForm({ ...form, image: "" })}
                    >
                      <Trash2 /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="drop"
                  onClick={() => fileInput.current.click()}
                >
                  <ImagePlus />
                  Clique para adicionar a foto
                  <small>PNG, JPG ou WEBP até 10 MB</small>
                </button>
              )}
            </label>
            <label>
              PNG frontal para o provador virtual
              <input ref={tryOnInput} type="file" accept="image/png" hidden onChange={chooseTryOnPhoto}/>
              {form.tryOnImage ? <div className="imagePreview tryOnPreview"><img src={form.tryOnImage} alt="Prévia transparente da armação"/><div><button type="button" onClick={() => tryOnInput.current.click()}><ImagePlus/> Trocar PNG</button><button type="button" className="removePhoto" onClick={() => setForm({ ...form, tryOnImage: "" })}><Trash2/> Remover</button></div></div> : <button type="button" className="drop" onClick={() => tryOnInput.current.click()}><ImagePlus/>Adicionar PNG frontal transparente<small>Somente a armação, centralizada e sem fundo · até 5 MB</small></button>}
            </label>
            {error && <p className="formError">{error}</p>}
            <div className="modalActions">
              <button type="button" className="cancel" onClick={close}>
                Cancelar
              </button>
              <button className="primary" type="submit">
                {editing === "new" ? "Cadastrar produto" : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      )}
      {formatModal && (
        <div className="overlay">
          <div className="modal formatModal">
            <button type="button" className="close" onClick={() => setFormatModal(false)}><X /></button>
            <span className="eyebrow">CONFIGURAÇÕES DO CATÁLOGO</span>
            <h2>Gerenciar formatos</h2>
            <p className="modalDescription">Adicione, renomeie ou remova os formatos disponíveis no cadastro de armações.</p>
            <form className="formatForm" onSubmit={saveFormat}>
              <label>Nome do formato<input value={formatDraft.name} onChange={(e) => setFormatDraft({ ...formatDraft, name: e.target.value })} placeholder="Ex: Hexagonal" /></label>
              <label>Desenho de referência<select value={formatDraft.shape} onChange={(e) => setFormatDraft({ ...formatDraft, shape: e.target.value })}><option value="round">Redondo</option><option value="cat">Gatinho</option><option value="rect">Retangular</option><option value="aviator">Aviador</option><option value="oval">Oval</option><option value="square">Quadrado</option></select></label>
              <button className="primary" type="submit">{editingFormat === null ? <><Plus /> Adicionar</> : "Salvar edição"}</button>
            </form>
            {error && <p className="formError">{error}</p>}
            <div className="formatList">
              {formats.map((item, index) => <div className="formatItem" key={item.name}><div className="formatIcon"><Glasses shape={item.shape} /></div><b>{item.name}</b><button type="button" onClick={() => editFormat(item, index)} title="Editar formato"><Edit3 /></button><button type="button" className="danger" onClick={() => removeFormat(index)} title="Remover formato"><Trash2 /></button></div>)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

ProductCard = function ProductCardWithPhoto({ f, setPage, addCart }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className="product">
      <div className="productImg">
        <span>{f.tag}</span>
        <button onClick={() => setLiked(!liked)}>
          <Heart fill={liked ? "#9c4f3b" : "none"} />
        </button>
        <ProductVisual f={f} large />
        <button className="quick" onClick={() => addCart(f)}>
          {TEXTS.catalog.addToBag}
        </button>
      </div>
      <div className="productInfo" onClick={() => setPage("detail")}>
        <div>
          <h3>{f.name}</h3>
          <small>
            {f.type} · {f.color}
          </small>
        </div>
        <strong>R$ {f.price},00</strong>
      </div>
    </article>
  );
};

createRoot(document.getElementById("root")).render(<App />);
