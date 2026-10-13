import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Pencil } from "lucide-react";
import DeleteProduct from "@/components/DeleteProduct";
import StockAdjust from "@/components/StockAdjust";
import TransferForm from "@/components/TransferForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { idr, inventoryRows, timeAgo, toProductRow, validMovements } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isAdmin = (await getRole()) === "admin";
  const supabase = await createServerSupabase();
  const { data: raw } = await supabase
    .from("master_products")
    .select("id, plu_code, name, category, price, min_stock, inventory(current_qty, location)")
    .eq("id", id)
    .maybeSingle();
  if (!raw) notFound();
  const p = toProductRow(raw);
  const locs = inventoryRows(raw);
  const critical = p.current_qty <= p.min_stock;

  const { data: rawMov } = await supabase
    .from("stock_movements")
    .select("id, movement_type, qty_change, reason, created_at, master_products(name)")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  const movements = validMovements(rawMov ?? []);

  const buckets = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * DAY);
    const key = day.toISOString().slice(0, 10);
    const net = movements
      .filter((m) => (m.created_at ?? "").slice(0, 10) === key)
      .reduce((s, m) => s + m.qty_change, 0);
    return { label: String(day.getDate()), net };
  });
  const maxAbs = Math.max(1, ...buckets.map((b) => Math.abs(b.net)));
  const hasTrend = buckets.some((b) => b.net !== 0);

  return (
    <main className="p-4 text-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-600">{p.plu_code} • {p.category ?? "-"}</p>
          <h1 className="text-xl">{p.name}</h1>
        </div>
        {isAdmin && (
          <Link
            href={`/produk/${p.id}/edit`}
            className="flex h-11 shrink-0 items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-3 text-sm font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Pencil size={16} /> Ubah
          </Link>
        )}
      </div>

      <div className={`mt-3 flex items-center justify-between rounded-xl border-2 border-slate-900 p-4 shadow-[4px_4px_0_0_#0f172a] ${critical ? "bg-amber-400" : "bg-white"}`}>
        <div>
          <p className="text-xs font-bold">Total stok • {idr(p.price)}</p>
          <p className="font-display text-3xl">{p.current_qty}</p>
          <p className="text-xs font-medium">Min. {p.min_stock}</p>
        </div>
        {critical && (
          <span className="flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-bold">
            <AlertTriangle size={14} /> Kritis
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {locs.map((r) => (
          <div key={r.location} className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white px-4 py-2 shadow-[4px_4px_0_0_#0f172a]">
            <p className="text-sm font-bold">{r.location}</p>
            <p className="font-display">{r.current_qty}</p>
          </div>
        ))}
      </div>

      <StockAdjust productId={p.id} locations={locs.map((r) => r.location)} />
      {locs.length > 0 && <TransferForm productId={p.id} locations={locs.map((r) => r.location)} />}

      <section className="mt-6">
        <h2 className="text-base">Tren 14 hari</h2>
        {!hasTrend ? (
          <p className="mt-2 text-sm font-medium text-slate-600">Belum ada mutasi 14 hari terakhir.</p>
        ) : (
          <div className="mt-2 flex h-28 items-end gap-1 rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_0_#0f172a]">
            {buckets.map((b, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div
                  className={`w-full rounded-sm border border-slate-900 ${b.net >= 0 ? "bg-pink-400" : "bg-red-400"}`}
                  style={{ height: `${Math.max(4, (Math.abs(b.net) / maxAbs) * 100)}%` }}
                  title={`${b.label}: ${b.net > 0 ? "+" : ""}${b.net}`}
                />
                <span className="text-[9px] font-bold text-slate-600">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-base">Riwayat</h2>
        <div className="mt-2 flex flex-col gap-3">
          {movements.length === 0 && <p className="text-sm font-medium text-slate-600">Belum ada mutasi.</p>}
          {movements.slice(0, 10).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {m.movement_type}{" "}
                  <span className={m.qty_change > 0 ? "text-pink-600" : "text-red-600"}>
                    {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}
                  </span>
                </p>
                <p className="truncate text-xs font-medium text-slate-600">{m.reason ?? "-"} • {timeAgo(m.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isAdmin && (
        <div className="mt-6">
          <DeleteProduct id={p.id} name={p.name} />
        </div>
      )}
    </main>
  );
}
