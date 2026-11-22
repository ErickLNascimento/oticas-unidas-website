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

## Fase 2 — Dados compartilhados e segurança ✅

Decisão: o site usa **Cloudflare Pages Functions + D1** (dados) e **R2** (fotos), com pagamento via Mercado Pago (sandbox). A tentativa com Supabase foi descartada.

- ✅ Produtos, formatos, contatos e destaques da Home salvos no D1 e iguais para todos os visitantes.
- ✅ Fotos enviadas pelo painel vão para o R2 (só PNG, JPEG e WebP).
- ✅ Pagamento recalcula preço, frete e desconto PIX no servidor a partir do catálogo, ignorando o preço vindo do navegador.
- ✅ Removida a rota pública que aceitava pedidos falsos; chave do painel comparada em tempo constante; número de pedido sem colisão.
- ✅ Testes automáticos: `npm test`.
- 🔜 Pedir a chave ao abrir o painel (hoje ela só é pedida ao salvar ou ver pedidos).
- 🔜 Pagamento real no Mercado Pago (hoje só credenciais TEST) e confirmação automática por webhook.

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

## Fase futura — Integração com o OptiFlow ERP ⬜

Por enquanto o site é **independente** do ERP. Quando a integração for retomada, o ponto de partida já existe:

- **ERP:** PR [optiflow-erp#33](https://github.com/ErickLNascimento/optiflow-erp/pull/33) (branch `feat/storefront-catalog`, em rascunho). Faz a publicação explícita de variantes por loja, com preço de canal, e o feed incremental `catalog.read`. Testado contra o `main` de 20/11/2026.
- **Site:** o código de sincronização foi escrito e testado, mas retirado para manter o site independente. Para recuperá-lo, use o commit `32cfc8c` deste repositório (`git show 32cfc8c`). Ele traz o botão "Sincronizar com o ERP", o consumidor no D1 (migration `0002`), 13 testes e o guia `ERP-INTEGRATION.md`.
- Regras combinadas: o ERP é dono de preço, cor, SKU, categoria e publicação; o site é dono de fotos, títulos e PNG do provador. A credencial do ERP fica só no servidor.
- Antes de retomar: rebasear o PR #33 no `main` do ERP da época, definir empresa e loja reais e decidir estoque e reservas, porque hoje os itens do ERP seriam só para consulta.
