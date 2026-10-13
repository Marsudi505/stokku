import BackupButton from "@/components/BackupButton";
import ExportCsv from "@/components/ExportCsv";
import { timeAgo, validMovements } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

const field =
  "h-11 rounded-lg border-2 border-slate-900 bg-white px-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export const dynamic = "force-dynamic";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const { type = "", from = "", to = "" } = await searchParams;
  const supabase = await createServerSupabase();

  let q = supabase
    .from("stock_movements")
    .select("id, movement_type, qty_change, reason, created_at, master_products(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (type === "IN" || type === "OUT" || type === "ADJUSTMENT") q = q.eq("movement_type", type);
  if (from) q = q.gte("created_at", `${from}T00:00:00`);
  if (to) q = q.lte("created_at", `${to}T23:59:59`);

  const { data: raw } = await q;
  const movements = validMovements(raw ?? []);
  const totalIn = movements.filter((m) => m.qty_change > 0).reduce((s, m) => s + m.qty_change, 0);
  const totalOut = movements.filter((m) => m.qty_change < 0).reduce((s, m) => s - m.qty_change, 0);

  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl">Laporan</h1>
      <p className="text-sm font-medium text-slate-600">Mutasi stok {movements.length} tercatat.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
          <p className="text-xs font-bold text-slate-600">Total masuk</p>
          <p className="mt-1 font-display text-2xl text-pink-600">+{totalIn}</p>
        </div>
        <div className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
          <p className="text-xs font-bold text-slate-600">Total keluar</p>
          <p className="mt-1 font-display text-2xl text-red-600">−{totalOut}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <ExportCsv
          rows={movements.map((m) => ({
            tanggal: (m.created_at ?? "").slice(0, 19).replace("T", " "),
            produk: m.product_name,
            tipe: m.movement_type,
            qty: m.qty_change,
            alasan: m.reason ?? "-",
          }))}
        />
        <BackupButton />
      </div>

      <form method="GET" className="mt-4 grid grid-cols-3 gap-2">
        <select name="type" defaultValue={type} className={field}>
          <option value="">Semua</option>
          <option value="IN">Masuk</option>
          <option value="OUT">Keluar</option>
          <option value="ADJUSTMENT">Opname</option>
        </select>
        <input name="from" type="date" defaultValue={from} className={field} />
        <input name="to" type="date" defaultValue={to} className={field} />
        <button
          type="submit"
          className="col-span-3 h-11 rounded-lg border-2 border-slate-900 bg-amber-400 font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Tampilkan
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        {movements.length === 0 && <p className="text-sm font-medium text-slate-600">Tidak ada mutasi pada filter ini.</p>}
        {movements.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{m.product_name}</p>
              <p className="truncate text-xs font-medium text-slate-600">
                {m.movement_type} • {m.reason ?? "-"} • {timeAgo(m.created_at)}
              </p>
            </div>
            <p className={`shrink-0 font-display ${m.qty_change > 0 ? "text-pink-600" : "text-red-600"}`}>
              {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
