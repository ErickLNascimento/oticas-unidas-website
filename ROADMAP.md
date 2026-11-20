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

## Fase 2 — Dados reais com Supabase ✅ (código pronto; falta criar o projeto)

Antes, produtos, pedidos e contatos ficavam em `localStorage`. O que era cadastrado no admin só existia naquele navegador, e os pedidos dos clientes não chegavam à loja.

- ✅ Esquema do banco com regras de segurança (`supabase/schema.sql`): produtos, pedidos, configurações e fotos.
- ✅ Login do painel admin (Supabase Auth), com acesso restrito à tabela `admins`.
- ✅ Upload das fotos das armações no Supabase Storage.
- ✅ Checkout grava o pedido via `place_order`. O servidor recalcula preços, frete e desconto, baixa o estoque e não guarda dados de cartão (antes o número do cartão e o CVV ficavam salvos no navegador).
- ✅ Painel lê pedidos e clientes reais (antes "Clientes" e "Visão geral" mostravam dados fictícios).
- ✅ Modo demonstração mantido quando não há chaves do Supabase (`npm run dev` funciona sem configurar nada).
- 🔜 **Você:** criar o projeto seguindo `supabase/README.md` e preencher o `.env`.

## Fase 2.5 — Pagamento de verdade 🔜

O formulário de cartão ainda **não cobra nada**: pedidos no cartão entram como "Aguardando pagamento" e o QR Code do PIX é demonstrativo.

- ⬜ Integrar um gateway brasileiro (Mercado Pago, Pagar.me ou Asaas): PIX com QR Code real e cartão processado pelo gateway, sem os dados passarem pelo site.
- ⬜ Confirmar o pagamento automaticamente (webhook → Supabase Edge Function muda o status para "Confirmado").
- ⬜ Até lá: avaliar esconder a opção de cartão ou trocar por "combinar pagamento pelo WhatsApp".
- ⬜ Avisar a loja a cada pedido novo (e-mail ou WhatsApp) e enviar confirmação ao cliente.

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
- ⬜ Reduzir o peso do cliente Supabase (+57 KB gzip): ler o catálogo público com `fetch` simples e carregar a biblioteca completa só no painel.
