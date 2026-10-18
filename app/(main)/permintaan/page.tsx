import { requireOwner } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import PermintaanList from "@/components/PermintaanList";
import type { StockRequestRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PermintaanPage() {
  await requireOwner();
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("stock_requests")
    .select("*, master_products(name, plu_code), stores(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl font-bold">Permintaan</h1>
      <p className="text-sm font-medium text-slate-600">Pengajuan penyesuaian stok.</p>
      <PermintaanList rows={(data ?? []) as unknown as StockRequestRow[]} />
    </main>
  );
}
