-- ============================================================
-- STOKKU multi-user + cabang + approval
-- Jalankan berurutan: skema (ini) → RLS → RPC → seeder.
-- DB saat ini KOSONG (0 baris) → tidak ada data yang perlu di-backup.
-- ============================================================

-- 1. Tabel cabang
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Tabel profil (satu baris per user auth)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username varchar(60) not null unique,
  full_name text,
  role text not null check (role in ('owner','kasir')),
  store_id uuid references public.stores(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Tabel pengajuan perubahan stok
create table if not exists public.stock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.master_products(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  request_type text not null default 'ADJUSTMENT',
  requested_delta int not null,
  reason text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  requested_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

-- 4. Kolom cabang di tabel lama
alter table public.inventory       add column if not exists store_id uuid references public.stores(id);
alter table public.stock_movements add column if not exists store_id uuid references public.stores(id);

-- 5. Hapus kolom location lama (satu sumber kebenaran = stores).
--    Kedua tabel masih 0 baris → aman di-drop langsung.
alter table public.inventory       drop column if exists location;
alter table public.stock_movements drop column if exists location;

-- 6. Fungsi pembantu claim (dipanggil policy & RPC)
create or replace function public.app_role() returns text
language sql stable as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role','')
$$;

create or replace function public.app_store() returns uuid
language sql stable as $$
  select coalesce((auth.jwt()->'app_metadata'->>'store_id')::uuid, null)
$$;

-- is_owner() WAJIB SECURITY DEFINER: ia membaca profiles, dan policy
-- profiles sendiri memanggilnya. Tanpa ini Postgres melempar
-- "infinite recursion detected in policy for relation profiles".
create or replace function public.is_owner() returns boolean
language sql security definer stable set search_path = public as $$
  select public.app_role() = 'owner'
     and exists (select 1 from profiles where user_id = auth.uid() and is_active);
$$;

-- ============================================================
-- RLS — HAPUS POLICY LAMA DULU (bug: policy lama USING (true))
-- ============================================================
drop policy if exists "authenticated full access"   on public.master_products;
drop policy if exists "authenticated full access"   on public.inventory;
drop policy if exists "authenticated append read"   on public.stock_movements;
drop policy if exists "authenticated append insert" on public.stock_movements;

alter table public.stores         enable row level security;
alter table public.profiles       enable row level security;
alter table public.master_products enable row level security;
alter table public.inventory      enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_requests enable row level security;

create policy stores_select on public.stores
  for select to authenticated using (true);
create policy stores_write on public.stores
  for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_owner());
create policy profiles_write on public.profiles
  for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy products_select on public.master_products
  for select to authenticated using (true);
create policy products_write on public.master_products
  for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy inventory_select on public.inventory
  for select to authenticated
  using (public.is_owner() or store_id = public.app_store());

create policy movements_select on public.stock_movements
  for select to authenticated
  using (public.is_owner() or store_id = public.app_store());

create policy requests_select on public.stock_requests
  for select to authenticated
  using (public.is_owner() or store_id = public.app_store());
create policy requests_insert on public.stock_requests
  for insert to authenticated
  with check (
    (public.is_owner())
    or (public.app_role() = 'kasir' and store_id = public.app_store())
  );
create policy requests_update on public.stock_requests
  for update to authenticated
  using (public.is_owner()) with check (public.is_owner());

revoke all on public.inventory       from authenticated;
revoke all on public.stock_movements from authenticated;

grant select on public.inventory, public.stock_movements,
                public.stock_requests, public.profiles, public.stores
       to authenticated;
grant insert on public.stock_requests to authenticated;
grant update (status, reviewed_by, reviewed_at, review_note)
      on public.stock_requests to authenticated;
