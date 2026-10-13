import OpnameForm from "@/components/OpnameForm";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OpnamePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("inventory")
    .select("current_qty, location, master_products(id, plu_code, name)")
    .order("location");
  const rows = (data ?? [])
    .filter((r) => r.master_products && !Array.isArray(r.master_products))
    .map((r) => {
      const p = r.master_products as unknown as { id: string; plu_code: string; name: string };
      return { id: p.id, plu: p.plu_code, name: p.name, loc: r.location, sys: r.current_qty };
    });

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Stok Opname</h1>
      <p className="text-sm text-slate-600">
        Hitung fisik per lokasi, selisih otomatis jadi penyesuaian (ADJUSTMENT).
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Belum ada stok.</p>
      ) : (
        <OpnameForm rows={rows} />
      )}
    </main>
  );
}
