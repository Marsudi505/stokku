"use client";
import { useActionState, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { adjustStock, requestStockChange } from "@/lib/actions";
import type { StoreRow } from "@/lib/types";

const field =
  "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";
const submitPink =
  "mt-3 h-12 w-full rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60";

export default function StockAdjust({
  productId,
  stores,
  role,
  defaultStoreId,
}: {
  productId: string;
  stores: StoreRow[];
  role: "owner" | "kasir";
  defaultStoreId: string | null;
}) {
  const [kind, setKind] = useState<"IN" | "OUT">("IN");
  const [storePick, setStorePick] = useState(defaultStoreId ?? stores[0]?.id ?? "");
  const [adjustState, adjustAction, adjustPending] = useActionState(adjustStock, {});
  const [reqState, reqAction, reqPending] = useActionState(requestStockChange, {});

  const base =
    "flex h-12 items-center justify-center gap-1 rounded-lg border-2 border-slate-900 font-bold transition-all";
  const on = "shadow-[2px_2px_0_0_#0f172a]";
  const off = "bg-white text-slate-900";

  if (role === "kasir") {
    return (
      <form
        action={reqAction}
        className="mt-4 rounded-xl border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-[4px_4px_0_0_#0f172a]"
      >
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="store_id" value={storePick} />
        <p className="font-bold">Ajukan penyesuaian stok</p>
        <p className="mt-1 text-xs text-slate-600">Menunggu persetujuan owner.</p>
        <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
          <input name="delta" type="number" defaultValue={1} required className={field} placeholder="± selisih" />
          <input name="reason" required placeholder="cth: rusak, hilang" className={field} />
        </div>
        {reqState?.error && <p className="mt-2 text-sm font-bold text-red-600">{reqState.error}</p>}
        {reqState?.ok && <p className="mt-2 text-sm font-bold text-slate-900">{reqState.ok}</p>}
        <button type="submit" disabled={reqPending} className={submitPink}>
          {reqPending ? "Mengirim..." : "Ajukan"}
        </button>
      </form>
    );
  }

  return (
    <form
      action={adjustAction}
      className="mt-4 rounded-xl border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-[4px_4px_0_0_#0f172a]"
    >
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="store_id" value={storePick} />
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
        Cabang
        <select
          name="store_id"
          value={storePick}
          onChange={(e) => setStorePick(e.target.value)}
          className={field}
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3 grid grid-cols-[1fr_2fr] gap-2">
        <input name="qty" type="number" min={1} defaultValue={1} required className={field} />
        <input
          name="reason"
          placeholder={kind === "IN" ? "cth: Restock supplier" : "cth: Terjual"}
          className={field}
        />
      </div>
      {adjustState?.error && <p className="mt-2 text-sm font-bold text-red-600">{adjustState.error}</p>}
      {adjustState?.ok && <p className="mt-2 text-sm font-bold text-slate-900">{adjustState.ok}</p>}
      <button type="submit" disabled={adjustPending} className={submitPink}>
        {adjustPending ? "Menyimpan..." : "Catat mutasi"}
      </button>
    </form>
  );
}
