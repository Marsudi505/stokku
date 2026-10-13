"use client";
import { useActionState, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { adjustStock } from "@/lib/actions";

const field =
  "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";
const submitPink =
  "mt-3 h-12 w-full rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60";

export default function StockAdjust({
  productId,
  locations,
}: {
  productId: string;
  locations: string[];
}) {
  const [kind, setKind] = useState<"IN" | "OUT">("IN");
  const [state, action, pending] = useActionState(adjustStock, {});
  const base =
    "flex h-12 items-center justify-center gap-1 rounded-lg border-2 border-slate-900 font-bold transition-all";
  const on = "shadow-[2px_2px_0_0_#0f172a]";
  const off = "bg-white text-slate-900";

  return (
    <form action={action} className="mt-4 rounded-xl border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-[4px_4px_0_0_#0f172a]">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind("IN")}
          className={`${base} ${kind === "IN" ? `bg-pink-400 text-slate-900 ${on}` : off}`}
        >
          <Plus size={18} /> Masuk
        </button>
        <button
          type="button"
          onClick={() => setKind("OUT")}
          className={`${base} ${kind === "OUT" ? `bg-red-400 text-slate-900 ${on}` : off}`}
        >
          <Minus size={18} /> Keluar
        </button>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs font-bold">
        Lokasi (bisa ketik baru)
        <input
          name="location"
          list="stokku-locs"
          defaultValue={locations[0] ?? "Utama"}
          required
          className={field}
        />
        <datalist id="stokku-locs">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </label>
      <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
        <input name="qty" type="number" min={1} defaultValue={1} required className={field} />
        <input
          name="reason"
          placeholder={kind === "IN" ? "cth: Restock supplier" : "cth: Terjual"}
          className={field}
        />
      </div>
      {state?.error && <p className="mt-2 text-sm font-bold text-red-600">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm font-bold text-slate-900">{state.ok}</p>}
      <button type="submit" disabled={pending} className={submitPink}>
        {pending ? "Menyimpan..." : "Catat mutasi"}
      </button>
    </form>
  );
}
