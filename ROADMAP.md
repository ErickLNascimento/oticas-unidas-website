# Roadmap — Óticas Unidas

Plano de evolução do site, em ordem de prioridade. Cada fase pode ir para o ar sozinha.
Referências de ferramentas: [Design Engineer Resources](https://resources.cesaroeduardo.com/).

Legenda: ✅ feito · 🔜 próximo · ⬜ planejado

---

## Fase 1 — Desempenho e fundamentos ✅

Objetivo: a primeira tela abrir rápido no celular e o site ser lido corretamente por navegadores e buscadores.

- ✅ Hero convertido de PNG (1,9 MB) para WebP responsivo: 54 KB no desktop, 18 KB no celular (`srcset`).
- ✅ Logo redimensionado de 2172 px (497 KB) para 480 px em WebP (26 KB).
- ✅ `width`/`height` nas imagens principais (evita "pulos" de layout) e `fetchpriority="high"` + preload do hero.
- ✅ MediaPipe (provador virtual) carregado sob demanda: ~154 KB de JS saem do carregamento inicial e só baixam ao usar o provador.
- ✅ Removida a variante `vision_wasm_module_internal.*` (~12 MB), que o código nunca usa. Mantida a `nosimd`, fallback para navegadores antigos.
- ✅ `index.html` completo: `<!doctype>`, `lang="pt-BR"`, meta viewport (sem ela o celular exibia o site encolhido), título, descrição, `theme-color` e preconnect das fontes.

Resultado medido na home: de ~2,8 MB para ~450 KB transferidos.

## Fase 2 — Dados reais com Supabase 🔜

Hoje produtos, pedidos e contatos ficam em `localStorage`. Isso quer dizer que o que é cadastrado no admin só existe naquele navegador e que os pedidos dos clientes não chegam à loja. É o maior bloqueio para o site funcionar como loja.

- ⬜ Criar projeto no Supabase: tabelas `products`, `orders`, `order_items`, `settings`.
- ⬜ Login do painel admin (Supabase Auth) e proteção da rota `/admin`.
- ⬜ Upload das fotos das armações no Supabase Storage.
- ⬜ Checkout grava o pedido no banco, e o admin passa a ler pedidos reais.
- ⬜ Migrar o conteúdo atual (`content.js` e produtos de exemplo) para o banco.

## Fase 3 — SEO local e conversão ⬜

- ⬜ Rotas reais por página (`/oculos-de-grau`, `/provador`, `/produto/:slug`) em vez de troca de estado, para cada página poder ser indexada e compartilhada.
- ⬜ Open Graph (imagem e título ao compartilhar no WhatsApp/Instagram) e favicon quadrado próprio.
- ⬜ Dados estruturados `LocalBusiness`/`Optician` (endereço, horário, telefone) e `Product`.
- ⬜ Botão flutuante de WhatsApp usando o número já configurável no admin.
- ⬜ Página "Sobre/Lojas" com mapa, endereço e horário; link para o Perfil da Empresa no Google.
- ⬜ `sitemap.xml` e `robots.txt`.

## Fase 4 — Visual e experiência ⬜

- ⬜ Fotos reais das armações (ou, provisoriamente, Pixabay/Lummi) no lugar dos desenhos em CSS.
- ⬜ Pesquisar referências de lojas de óculos no Mobbin, 60fps e Awwwards antes de redesenhar vitrine e página de produto.
- ⬜ Página de produto: galeria, cores, medidas da armação, "experimentar no provador".
- ⬜ Animações sutis com Motion (entrada das seções, troca de armação, gaveta do carrinho).
- ⬜ Revisar responsividade da faixa de benefícios no celular (hoje corta o texto lateralmente).
- ⬜ Acessibilidade: textos alternativos, foco visível, contraste dos textos claros (#948b84 em fundo claro).

## Fase 5 — Métricas e manutenção ⬜

- ⬜ PostHog: funil home → produto → carrinho → checkout e uso do provador virtual.
- ⬜ Fixar versões no `package.json` (hoje várias dependências estão como `latest`, o que pode quebrar o build sem aviso).
- ⬜ Consolidar os 19 arquivos CSS de "correções" num conjunto organizado.
- ⬜ Dividir `main.jsx` (1300 linhas) em componentes por página.
- ⬜ Avaliar servir o MediaPipe por CDN (jsDelivr) para tirar ~26 MB do deploy.
