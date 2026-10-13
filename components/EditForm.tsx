"use client";
import { useActionState } from "react";
import { updateProduct } from "@/lib/actions";

const inputCls = "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export default function EditForm({
  product,
}: {
  product: { id: string; plu_code: string; name: string; category: string | null; price: number; min_stock: number };
}) {
  const [state, action, pending] = useActionState(updateProduct, {});

  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="id" value={product.id} />
      <input name="plu_code" required defaultValue={product.plu_code} placeholder="PLU / kode barcode *" className={inputCls} />
      <input name="name" required defaultValue={product.name} placeholder="Nama produk *" className={inputCls} />
      <input name="category" defaultValue={product.category ?? ""} placeholder="Kategori" className={inputCls} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Harga (Rp)
          <input name="price" type="number" min={0} defaultValue={product.price} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Min. stok
          <input name="min_stock" type="number" min={0} defaultValue={product.min_stock} className={inputCls} />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan perubahan"}
      </button>
    </form>
  );
}
