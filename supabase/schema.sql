-- Óticas Unidas — esquema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase. Pode ser executado de novo sem perder dados.

-- ---------------------------------------------------------------------------
-- Administradores: só quem estiver nesta tabela edita produtos e vê pedidos.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins see themselves" on public.admins;
create policy "admins see themselves" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Produtos (armações)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id bigint primary key,
  name text not null,
  category text not null default 'grau' check (category in ('grau', 'sol')),
  type text not null default '',
  color text not null default '',
  price numeric(10, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  tag text not null default '',
  shape text not null default 'round',
  tone text not null default '#49352b',
  image text not null default '',
  try_on_image text not null default '',
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "catalog is public" on public.products;
create policy "catalog is public" on public.products
  for select using (true);

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Configurações da loja (contatos, formatos de armação)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;

drop policy if exists "settings are public" on public.settings;
create policy "settings are public" on public.settings
  for select using (true);

drop policy if exists "admins manage settings" on public.settings;
create policy "admins manage settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Pedidos: o público não lê nem grava direto. O checkout usa place_order(),
-- que recalcula preços, frete e desconto no servidor e baixa o estoque.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  customer jsonb not null,
  items jsonb not null,
  payment text not null check (payment in ('pix', 'card')),
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null,
  discount numeric(10, 2) not null,
  total numeric(10, 2) not null,
  status text not null,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.place_order(p_customer jsonb, p_items jsonb, p_payment text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer jsonb;
  v_items jsonb := '[]'::jsonb;
  v_subtotal numeric(10, 2) := 0;
  v_shipping numeric(10, 2);
  v_discount numeric(10, 2);
  v_order public.orders;
  v_line jsonb;
  v_qty integer;
  v_product public.products;
begin
  if p_payment not in ('pix', 'card') then
    raise exception 'INVALID_PAYMENT';
  end if;

  -- Guarda só os dados de contato e entrega. Dados de cartão nunca entram no banco.
  select coalesce(jsonb_object_agg(key, left(value #>> '{}', 200)), '{}'::jsonb)
    into v_customer
    from jsonb_each(coalesce(p_customer, '{}'::jsonb))
   where key in ('name', 'email', 'cpf', 'phone', 'cep', 'street', 'number',
                 'complement', 'district', 'city', 'state');

  if coalesce(v_customer ->> 'name', '') = ''
     or coalesce(v_customer ->> 'email', '') = ''
     or coalesce(v_customer ->> 'phone', '') = '' then
    raise exception 'MISSING_CUSTOMER_DATA';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_line in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_line ->> 'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_QUANTITY';
    end if;

    update public.products
       set stock = stock - v_qty
     where id = (v_line ->> 'id')::bigint and stock >= v_qty
    returning * into v_product;

    if not found then
      raise exception 'OUT_OF_STOCK:%', v_line ->> 'id';
    end if;

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_items := v_items || jsonb_build_object(
      'id', v_product.id, 'name', v_product.name, 'type', v_product.type,
      'color', v_product.color, 'price', v_product.price, 'qty', v_qty);
  end loop;

  -- Mesmas regras exibidas no site: frete grátis acima de R$ 499, 10% OFF no PIX.
  v_shipping := case when v_subtotal >= 499 then 0 else 24.90 end;
  v_discount := case when p_payment = 'pix' then round(v_subtotal * 0.10, 2) else 0 end;

  insert into public.orders (id, customer, items, payment, subtotal, shipping, discount, total, status)
  values (
    'OU-' || to_char(now() at time zone 'America/Manaus', 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5)),
    v_customer, v_items, p_payment, v_subtotal, v_shipping, v_discount,
    v_subtotal + v_shipping - v_discount,
    case when p_payment = 'pix' then 'Aguardando PIX' else 'Aguardando pagamento' end
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text) from public;
grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fotos das armações (Storage): leitura pública, upload só para administradores.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins change product images" on storage.objects;
create policy "admins change product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Dados iniciais (só entram se ainda não existirem)
-- ---------------------------------------------------------------------------
insert into public.products (id, name, category, type, color, price, stock, tag, shape, tone) values
  (1, 'Aurora',    'grau', 'Gatinho',    'Âmbar',       429, 12, 'MAIS VENDIDO',    'cat',     '#b86f41'),
  (2, 'Nômade',    'grau', 'Redondo',    'Tartaruga',   389, 12, 'NOVO',            'round',   '#49352b'),
  (3, 'Essencial', 'grau', 'Retangular', 'Preto',       349, 12, '',                'rect',    '#181716'),
  (4, 'Solaris',   'grau', 'Aviador',    'Dourado',     459, 12, 'EDIÇÃO LIMITADA', 'aviator', '#b08b46'),
  (5, 'Íris',      'grau', 'Oval',       'Rosa Chá',    399, 3,  'NOVO',            'oval',    '#c49191'),
  (6, 'Horizonte', 'grau', 'Quadrado',   'Verde Oliva', 419, 12, '',                'square',  '#5f6450')
on conflict (id) do nothing;

insert into public.settings (key, value) values
  ('contact', '{"instagram":"","facebook":"","email":"contato@oticasunidas.com.br","whatsapp":"","phone":""}'),
  ('formats', '[{"name":"Redondo","shape":"round"},{"name":"Gatinho","shape":"cat"},{"name":"Retangular","shape":"rect"},{"name":"Aviador","shape":"aviator"},{"name":"Oval","shape":"oval"},{"name":"Quadrado","shape":"square"}]')
on conflict (key) do nothing;
