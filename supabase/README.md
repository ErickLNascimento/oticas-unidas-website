# Configurar o Supabase

Leva uns 10 minutos. Sem estes passos o site continua funcionando em **modo demonstração**
(dados salvos só no navegador de quem usa).

## 1. Criar o projeto
1. Crie uma conta grátis em [supabase.com](https://supabase.com) e clique em **New project**.
2. Região: **South America (São Paulo)**. Guarde a senha do banco num lugar seguro.

## 2. Criar as tabelas
1. No menu lateral, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`schema.sql`](./schema.sql) e clique em **Run**.

Isso cria produtos, pedidos, configurações, a pasta de fotos e as regras de segurança,
e já cadastra as 6 armações de exemplo. Pode rodar de novo sem perder dados.

## 3. Criar o seu acesso ao painel
1. **Authentication → Sign In / Providers**: desligue **Allow new users to sign up**
   (ninguém de fora consegue criar conta).
2. **Authentication → Users → Add user → Create new user**: informe seu e-mail e uma senha forte,
   com **Auto Confirm User** marcado.
3. Volte ao **SQL Editor** e rode, trocando o e-mail:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com';
   ```

## 4. Ligar o site ao banco
1. **Project Settings → API** (ou **API Keys**): copie a **Project URL** e a chave **anon / publishable**.
2. Na pasta do projeto, copie `.env.example` para `.env` e cole os dois valores.
3. Teste com `npm run dev` e publique com `npm run deploy`.

A chave anon é pública por natureza: ela vai no código do site. Quem protege os dados são as
regras do `schema.sql`. Nunca coloque a chave **service_role** no `.env` do site.

## O que as regras garantem
- Qualquer visitante **lê** o catálogo e os contatos, mas não altera nada.
- Pedidos entram só pela função `place_order`, que **recalcula preço, frete e desconto no servidor**,
  confere e baixa o estoque, e **descarta dados de cartão**.
- Só e-mails da tabela `admins` editam produtos, sobem fotos e veem pedidos e clientes.

## Observações
- Produtos cadastrados antes no painel (modo demonstração) ficaram só naquele navegador.
  Cadastre-os de novo depois de ligar o Supabase.
- O plano grátis pausa o projeto após 7 dias sem nenhum acesso; com a loja no ar isso não acontece.
