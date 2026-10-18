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

-- ============================================================
-- RPC SECURITY DEFINER — satu-satunya jalur tulis stok
-- ============================================================
-- Catatan: overload lama dari schema.sql (adjust_stock tanpa p_store,
-- transfer_stock dengan from_loc/to_loc TEXT) sudah DIHAPUS — keduanya
-- bukan SECURITY DEFINER dan tanpa cek role.

create or replace function public.adjust_stock(
  p_id uuid, delta int, mtype text, reason text, p_store uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_role text := public.app_role();
  v_uid  uuid := auth.uid();
  v_cur  int;
begin
  if v_uid is null then
    raise exception 'belum login';
  end if;
  if not exists (select 1 from profiles where user_id = v_uid and is_active) then
    raise exception 'profil tidak aktif';
  end if;

  if v_role = 'kasir' then
    if p_store is distinct from public.app_store() then
      raise exception 'kasir hanya boleh di cabangnya sendiri';
    end if;
    if mtype not in ('IN','OUT') then
      raise exception 'kasir hanya boleh IN/OUT; koreksi harus lewat permintaan';
    end if;
  elsif v_role <> 'owner' then
    raise exception 'role tidak dikenal';
  end if;

  select current_qty into v_cur from inventory
   where product_id = p_id and store_id = p_store;

  if v_cur is null then
    insert into inventory (product_id, store_id, current_qty)
    values (p_id, p_store, 0);
    v_cur := 0;
  end if;

  if v_cur + delta < 0 then
    raise exception 'stok tidak boleh minus (sisa %)', v_cur;
  end if;

  update inventory set current_qty = current_qty + delta
   where product_id = p_id and store_id = p_store;

  insert into stock_movements
    (product_id, movement_type, qty_change, reason, store_id, created_by)
  values (p_id, mtype, delta, reason, p_store, v_uid);
end;
$$;

create or replace function public.transfer_stock(
  p_id uuid, from_loc uuid, to_loc uuid, qty int, reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cur int;
begin
  if v_uid is null or not public.is_owner() then
    raise exception 'hanya owner yang boleh transfer';
  end if;

  select current_qty into v_cur from inventory
   where product_id = p_id and store_id = from_loc for update;
  if v_cur is null or v_cur < qty then
    raise exception 'stok sumber tidak mencukupi';
  end if;

  update inventory set current_qty = current_qty - qty
   where product_id = p_id and store_id = from_loc;

  insert into inventory (product_id, store_id, current_qty)
  values (p_id, to_loc, qty)
  on conflict (product_id, store_id)
  do update set current_qty = inventory.current_qty + excluded.current_qty;

  insert into stock_movements (product_id, movement_type, qty_change, reason, store_id, created_by)
  values (p_id, 'OUT', -qty, coalesce(reason,'transfer ke toko lain'), from_loc, v_uid);
  insert into stock_movements (product_id, movement_type, qty_change, reason, store_id, created_by)
  values (p_id, 'IN',  qty, coalesce(reason,'transfer dari toko lain'), to_loc, v_uid);
end;
$$;

create or replace function public.request_stock_change(
  p_id uuid, delta int, p_type text, reason text, p_store uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'belum login';
  end if;
  if not public.is_owner()
     and (public.app_role() <> 'kasir' or p_store is distinct from public.app_store()) then
    raise exception 'kasir hanya boleh mengajukan untuk cabangnya sendiri';
  end if;

  insert into stock_requests
    (product_id, store_id, request_type, requested_delta, reason, requested_by)
  values (p_id, p_store, p_type, delta, reason, v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.review_stock_request(
  req_id uuid, approve boolean, note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  r stock_requests%rowtype;
begin
  if not public.is_owner() then
    raise exception 'hanya owner yang boleh menyetujui/menolak';
  end if;

  select * into r from stock_requests where id = req_id for update;
  if not found then
    raise exception 'permintaan tidak ditemukan';
  end if;
  if r.status <> 'pending' then
    return;
  end if;

  if approve then
    perform public.adjust_stock(r.product_id, r.requested_delta, 'ADJUSTMENT', r.reason, r.store_id);
    update stock_requests set status='approved', reviewed_by=auth.uid(),
           reviewed_at=now(), review_note=note where id = req_id;
  else
    update stock_requests set status='rejected', reviewed_by=auth.uid(),
           reviewed_at=now(), review_note=note where id = req_id;
  end if;
end;
$$;

create or replace function public.submit_opname_batch(
  items jsonb, p_store uuid
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_role text := public.app_role();
  v_uid  uuid := auth.uid();
  v_batch uuid := gen_random_uuid();
  it jsonb;
  v_sys int;
  v_counted int;
  v_delta int;
begin
  if v_uid is null then
    raise exception 'belum login';
  end if;
  if v_role = 'kasir' and p_store is distinct from public.app_store() then
    raise exception 'kasir hanya boleh di cabangnya sendiri';
  end if;
  if v_role not in ('owner','kasir') then
    raise exception 'role tidak dikenal';
  end if;

  for it in select * from jsonb_array_elements(items) loop
    v_counted := (it->>'counted')::int;
    select current_qty into v_sys from inventory
     where product_id = (it->>'id')::uuid and store_id = p_store;
    v_sys := coalesce(v_sys, 0);
    v_delta := v_counted - v_sys;
    if v_delta = 0 then
      continue;
    end if;

    if v_role = 'owner' then
      perform public.adjust_stock((it->>'id')::uuid, v_delta, 'ADJUSTMENT',
                                  'opname', p_store);
    else
      insert into stock_requests
        (product_id, store_id, request_type, requested_delta, reason, requested_by)
      values ((it->>'id')::uuid, p_store, 'OPNAME', v_delta, 'opname', v_uid);
    end if;
  end loop;

  return v_batch;
end;
$$;

-- ============================================================
-- SEEDER OWNER (sudah dijalankan; email auth: yowes6652@gmail.com)
-- ============================================================
insert into public.stores (name, code) values ('Toko Utama','UTAMA')
on conflict (code) do nothing;

insert into public.profiles (user_id, username, full_name, role, store_id, is_active)
select u.id, 'owner', 'Owner', 'owner', s.id, true
  from auth.users u, public.stores s
 where u.email = 'yowes6652@gmail.com' and s.code='UTAMA'
on conflict (user_id) do nothing;
