import TambahForm from "@/components/TambahForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TambahPage() {
  const profile = await getProfile();
  if (profile.role !== "owner") redirect("/produk");

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("stores")
    .select("id, name, code, address, is_active")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Tambah Produk</h1>
      <p className="text-sm text-slate-600">Daftarkan SKU baru beserta stok awalnya.</p>
      <TambahForm
        stores={(data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          address: s.address,
          is_active: s.is_active,
        }))}
        defaultStoreId={profile.storeId}
      />
    </main>
  );
}
