# Integração do catálogo com o OptiFlow ERP

O ERP é a fonte de **produto, preço, cor, tamanho, SKU, categoria (grau/sol) e publicação**.
O site continua dono de **fotos, título editorial, formato, cor da ilustração, tag e PNG do provador**.

## Como funciona

1. No ERP, um usuário com `products.manage` publica cada variante para a loja:
   `PUT /api/v1/storefront-publications/{variantId}` com `{"published": true, "channelPrice": "529.90"}`
   (`channelPrice` opcional; `null` usa o preço da variante).
2. No painel do site, **Produtos → Sincronizar com o ERP** chama `POST /api/admin/catalog/sync`.
   A função busca `GET /integrations/storefront/catalog` no ERP com a credencial do servidor e
   aplica cada página no D1 numa transação junto com o cursor.
3. Produtos vindos do ERP aparecem na vitrine com **"Consultar pelo WhatsApp"**: o contrato v1 do ERP
   envia `purchaseEnabled: false` (estoque por loja e reservas ainda não existem no ERP). O checkout recusa esses itens.

## Regras garantidas (testes em `test/erp-catalog.test.mjs`)

- Repetir a sincronização não duplica produtos; revisão antiga nunca sobrescreve uma nova.
- Falha no meio preserva as páginas já confirmadas e o cursor delas; a próxima tentativa continua dali.
- Duas sincronizações ao mesmo tempo: a que perdeu a corrida é desfeita inteira (HTTP 409).
- Inativar no ERP esconde o item, mas mantém fotos e textos; reativar recupera tudo.
- O painel do site não altera preço/cor/SKU/categoria de item do ERP, não remove item publicado e não inventa vínculo.
- SKU igual a um produto antigo do site, sem vínculo explícito, interrompe a sincronização em vez de juntar por suposição.
- Campos extras enviados pelo ERP (custo, fornecedor, estoque) são descartados; só a lista permitida é gravada.
- O banco não troca de empresa/loja sem decisão explícita (`ERP_SCOPE_CHANGED`).

### Vincular produtos que já existem no site

Para reaproveitar fotos de um produto antigo, envie os vínculos uma vez:

```bash
curl -X POST https://SEU-SITE/api/admin/catalog/sync \
  -H "authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"links":[{"variantId":"ID-REAL-DA-VARIANTE-NO-ERP","siteId":"1"}]}'
```

## Configuração (Cloudflare Pages → Settings → Variables and Secrets)

| Variável | Valor |
|---|---|
| `ERP_API_URL` | Base HTTPS da API terminando em `/api/v1` |
| `ERP_STOREFRONT_TOKEN` | Credencial `ofsf_…` dedicada, **somente** `catalog.read` (cadastrar como *Secret*) |
| `ERP_TENANT_ID` / `ERP_BRANCH_ID` | IDs reais da empresa e da loja no ERP |

No ERP, a credencial é registrada em `STOREFRONT_CREDENTIALS_JSON` com o SHA-256 do token
(ver `docs/STOREFRONT-INTEGRATION.md` no repositório do ERP). Aplicar a migration do D1 antes:

```bash
npx wrangler d1 migrations apply oticas-unidas-db --remote
```

## Ainda não feito

- Sincronização automática periódica (hoje é pelo botão do painel; pode virar um GitHub Action ou Worker com cron).
- Estoque e compra de itens do ERP: dependem de estoque por variante/loja e reservas no ERP (cards 05/06 do ERP).
