create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id text primary key,
  username text not null unique,
  password text not null,
  role text not null check (role in ('admin', 'cashier')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id integer primary key,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  special_price numeric(10, 2) check (special_price >= 0),
  image text not null default '',
  category text not null,
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id text primary key,
  menu_item_id integer not null references public.menu_items(id) on delete cascade,
  title text not null,
  discount_percent numeric(5, 2) not null check (discount_percent >= 0 and discount_percent <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null check (total >= 0),
  subtotal numeric(10, 2) check (subtotal >= 0),
  tax_applied boolean not null default false,
  tax_rate numeric(5, 4) not null default 0 check (tax_rate >= 0),
  tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0),
  timestamp_ms bigint not null,
  status text not null check (status in ('pending', 'paid')),
  table_label text,
  cashier_id text,
  payment_method text check (payment_method in ('cash', 'card', 'instapay')),
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  cashier_id text not null,
  table_label text,
  items jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null check (total >= 0),
  subtotal numeric(10, 2) check (subtotal >= 0),
  tax_applied boolean not null default false,
  tax_rate numeric(5, 4) not null default 0 check (tax_rate >= 0),
  tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0),
  paid_at_ms bigint not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'instapay')),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists subtotal numeric(10, 2) check (subtotal >= 0);
alter table public.orders add column if not exists tax_applied boolean not null default false;
alter table public.orders add column if not exists tax_rate numeric(5, 4) not null default 0 check (tax_rate >= 0);
alter table public.orders add column if not exists tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0);

alter table public.sales add column if not exists subtotal numeric(10, 2) check (subtotal >= 0);
alter table public.sales add column if not exists tax_applied boolean not null default false;
alter table public.sales add column if not exists tax_rate numeric(5, 4) not null default 0 check (tax_rate >= 0);
alter table public.sales add column if not exists tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0);

alter table public.menu_items add column if not exists special_price numeric(10, 2) check (special_price >= 0);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  cashier_id text not null,
  shift_start_ms bigint,
  shift_end_ms bigint not null,
  initial_drawer numeric(10, 2) not null default 0,
  final_drawer numeric(10, 2) not null default 0,
  total_sales numeric(10, 2) not null default 0,
  cash_sales numeric(10, 2) not null default 0,
  card_sales numeric(10, 2) not null default 0,
  instapay_sales numeric(10, 2) not null default 0,
  expected_drawer numeric(10, 2) not null default 0,
  difference numeric(10, 2) not null default 0,
  orders_count integer not null default 0,
  paid_orders_count integer not null default 0,
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;
alter table public.menu_items enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;
alter table public.sales enable row level security;
alter table public.shifts enable row level security;

drop policy if exists "pos can manage app users" on public.app_users;
drop policy if exists "pos can manage menu items" on public.menu_items;
drop policy if exists "pos can manage offers" on public.offers;
drop policy if exists "pos can manage orders" on public.orders;
drop policy if exists "pos can manage sales" on public.sales;
drop policy if exists "pos can manage shifts" on public.shifts;

create policy "pos can manage app users" on public.app_users
  for all using (true) with check (true);

create policy "pos can manage menu items" on public.menu_items
  for all using (true) with check (true);

create policy "pos can manage offers" on public.offers
  for all using (true) with check (true);

create policy "pos can manage orders" on public.orders
  for all using (true) with check (true);

create policy "pos can manage sales" on public.sales
  for all using (true) with check (true);

create policy "pos can manage shifts" on public.shifts
  for all using (true) with check (true);

insert into public.app_users (id, username, password, role, active) values
  ('admin-omar', 'Omar', '01277554354', 'admin', true),
  ('cashier-gooba', 'Gooba', '01008191994', 'cashier', true),
  ('cashier-elsos', 'Elsos', '01226210927', 'cashier', true),
  ('cashier-mohanad', 'Mohanad', '01207266413', 'cashier', true)
on conflict (id) do update set
  username = excluded.username,
  password = excluded.password,
  role = excluded.role,
  active = excluded.active;
