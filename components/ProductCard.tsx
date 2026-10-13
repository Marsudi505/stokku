import Link from "next/link";
import type { ProductRow } from "@/lib/types";
import { idr } from "@/lib/types";

export default function ProductCard({ p }: { p: ProductRow }) {
  const critical = p.current_qty <= p.min_stock;
  return (
    <Link
      href={`/produk/${p.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-[4px_4px_0_0_#0f172a]"
    >
      <div className="min-w-0">
        <p className="truncate font-bold">{p.name}</p>
        <p className="truncate text-xs font-medium text-slate-600">
          {p.plu_code} • {p.location ?? "-"} • {idr(p.price)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-lg">{p.current_qty}</p>
        {critical && (
          <span className="rounded-full border-2 border-slate-900 bg-amber-400 px-2 py-0.5 text-[11px] font-bold">Kritis</span>
        )}
      </div>
    </Link>
  );
}
