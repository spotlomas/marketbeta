-- ============================================================
--  MARKETBETA — Supabase SQL Setup
--  Ejecuta este script en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabla de usuarios (perfil extendido)
create table if not exists public.usuarios (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  nombre        text not null,
  numero_control text,
  edad          int,
  tipo_usuario  text not null default 'comprador' check (tipo_usuario in ('comprador','vendedor')),
  curp          text,
  escuela       text,
  rfc           text,
  tipo_pago     text,
  created_at    timestamptz default now()
);

-- 2. Tabla de productos
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  seller_id   uuid references public.usuarios(id) on delete cascade,
  featured    boolean default false,
  created_at  timestamptz default now()
);

-- 3. Tabla de carrito (persistencia futura)
create table if not exists public.cart (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.usuarios(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity   int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- 4. Tabla de órdenes
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid references public.usuarios(id) on delete set null,
  seller_id  uuid references public.usuarios(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  amount     numeric(10,2) not null,
  quantity   int not null default 1,
  status     text not null default 'pendiente' check (status in ('pendiente','completado','cancelado')),
  created_at timestamptz default now()
);

-- ============================================================
--  Row Level Security (RLS)
-- ============================================================

alter table public.usuarios  enable row level security;
alter table public.products  enable row level security;
alter table public.cart      enable row level security;
alter table public.orders    enable row level security;

-- Usuarios: solo el propio usuario puede leer/editar su perfil
create policy "usuarios_select_own" on public.usuarios
  for select using (auth.uid() = id);

create policy "usuarios_insert_own" on public.usuarios
  for insert with check (auth.uid() = id);

create policy "usuarios_update_own" on public.usuarios
  for update using (auth.uid() = id);

-- Productos: cualquier autenticado puede leer; solo el vendedor puede escribir
create policy "products_select_all" on public.products
  for select using (auth.role() = 'authenticated');

create policy "products_insert_seller" on public.products
  for insert with check (auth.uid() = seller_id);

create policy "products_update_seller" on public.products
  for update using (auth.uid() = seller_id);

create policy "products_delete_seller" on public.products
  for delete using (auth.uid() = seller_id);

-- Carrito: solo el dueño puede ver y modificar
create policy "cart_own" on public.cart
  using (auth.uid() = user_id);

-- Órdenes: comprador ve las suyas; vendedor ve las suyas
create policy "orders_buyer" on public.orders
  for select using (auth.uid() = buyer_id);

create policy "orders_seller" on public.orders
  for select using (auth.uid() = seller_id);

create policy "orders_insert_buyer" on public.orders
  for insert with check (auth.uid() = buyer_id);

-- ============================================================
--  Datos de prueba (opcional — comenta si no los quieres)
-- ============================================================

-- insert into public.products (name, description, price, seller_id, featured)
-- values
--   ('Producto Demo 1', 'Descripción de prueba', 99.99, '<TU_USER_UUID>', true),
--   ('Producto Demo 2', 'Otro producto de prueba', 49.50, '<TU_USER_UUID>', false);
