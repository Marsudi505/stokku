-- Fix: helper otorisasi membaca `profiles` (sumber kebenaran) alih-alih klaim JWT.
--
-- Masalah: app_role()/app_store() membaca auth.jwt()->'app_metadata'. Klaim itu
-- hanya terisi untuk user yang dibuat lewat Edge Function. Akun owner yang
-- di-seed langsung (sebelum fitur ini) tidak punya klaim `role`, sehingga
-- is_owner() = false dan SEMUA tulis yang di-gate owner (stores, products,
-- review request, transfer) ditolak RLS. Klaim juga basi setelah ubah role
-- sampai user login ulang.
--
-- Solusi: baca `profiles` (yang memang dinyatakan sumber kebenaran di spec).
-- SECURITY DEFINER wajib agar tidak memicu rekursi policy pada `profiles`.
-- is_active diperiksa di semua helper → user nonaktif otomatis kehilangan akses.

create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from profiles where user_id = auth.uid() and is_active),
    ''
  )
$$;

create or replace function public.app_store() returns uuid
language sql stable security definer set search_path = public as $$
  select (select store_id from profiles where user_id = auth.uid() and is_active)
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and is_active and role = 'owner'
  )
$$;
