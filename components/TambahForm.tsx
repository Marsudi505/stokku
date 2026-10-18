"use client";
import { useActionState } from "react";
import { addProduct } from "@/lib/actions";
import type { StoreRow } from "@/lib/types";

const inputCls = "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export default function TambahForm({ stores, defaultStoreId }: { stores: StoreRow[]; defaultStoreId: string | null }) {
  const [state, action, pending] = useActionState(addProduct, {});

  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <input name="plu_code" required placeholder="PLU / kode barcode *" className={inputCls} />
      <input name="name" required placeholder="Nama produk *" className={inputCls} />
      <div className="grid grid-cols-2 gap-3">
        <input name="category" placeholder="Kategori" className={inputCls} />
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Cabang *
          <select
            name="store_id"
            required
            defaultValue={defaultStoreId ?? stores[0]?.id ?? ""}
            className={inputCls}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Harga (Rp)
          <input name="price" type="number" min={0} defaultValue={0} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Min. stok
          <input name="min_stock" type="number" min={0} defaultValue={5} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Stok awal
          <input name="qty" type="number" min={0} defaultValue={0} className={inputCls} />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan produk"}
      </button>
    </form>
  );
}
