import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ClipboardCheck, PencilLine } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { idr, timeAgo, toProductRow, validMovements } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: rawProducts } = await supabase
    .from("master_products")
    .select("id, plu_code, name, category, price, min_stock, inventory(current_qty, location)")
    .order("name");
  const products = (rawProducts ?? []).map(toProductRow);
  const restock = products.filter((p) => p.current_qty <= p.min_stock);

  const { data: rawMov } = await supabase
    .from("stock_movements")
    .select("id, movement_type, qty_change, reason, created_at, master_products(name)")
    .order("created_at", { ascending: false })
    .limit(5);
  const movements = validMovements(rawMov ?? []);

  const iconFor = (t: string) =>
    t === "IN" ? (
      <ArrowUpRight size={18} className="text-slate-900" />
    ) : t === "OUT" ? (
      <ArrowDownRight size={18} className="text-slate-900" />
    ) : (
      <PencilLine size={18} className="text-slate-900" />
    );

  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl">Dasbor</h1>
      <p className="text-sm font-medium text-slate-600">Ringkasan stok hari ini.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
          <p className="text-xs font-bold text-slate-600">Total SKU</p>
          <p className="mt-1 font-display text-2xl">{products.length}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-900 bg-amber-400 p-4 shadow-[4px_4px_0_0_#0f172a]">
          <p className="text-xs font-bold">Stok Kritis</p>
          <p className="mt-1 font-display text-2xl">{restock.length}</p>
        </div>
      </div>

      {restock.length > 0 && (
        <Link
          href="/produk"
          className="mt-3 flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-amber-400 p-3 text-sm font-bold shadow-[4px_4px_0_0_#0f172a]"
        >
          <AlertTriangle size={18} /> {restock.length} SKU kritis — pesan sekarang
        </Link>
      )}
      <Link
        href="/opname"
        className="mt-3 flex items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-pink-400 p-3 text-sm font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <ClipboardCheck size={18} /> Mulai stok opname
      </Link>

      <section className="mt-6">
        <h2 className="text-base">Perlu Re-stock</h2>
        <div className="mt-2 flex flex-col gap-3">
          {restock.length === 0 && <p className="text-sm font-medium text-slate-600">Semua stok aman.</p>}
          {restock.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
              <div className="min-w-0">
                <p className="truncate font-bold">{p.name}</p>
                <p className="truncate text-xs font-medium text-slate-600">
                  {p.plu_code} • {p.location ?? "-"} • {idr(p.price)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full border-2 border-slate-900 bg-amber-400 px-2 py-1 text-[11px] font-bold">
                <AlertTriangle size={12} /> {p.current_qty}/{p.min_stock}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base">Aktivitas Terakhir</h2>
        <div className="mt-2 flex flex-col gap-3">
          {movements.length === 0 && <p className="text-sm font-medium text-slate-600">Belum ada mutasi.</p>}
          {movements.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-amber-400">
                {iconFor(m.movement_type)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{m.product_name}</p>
                <p className="truncate text-xs font-medium text-slate-600">
                  {m.movement_type} {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change} • {m.reason ?? "-"} • {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
