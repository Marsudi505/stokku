"use client";
import { deleteProduct } from "@/lib/actions";

export default function DeleteProduct({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProduct}
      onSubmit={(e) => {
        if (!window.confirm(`Hapus ${name}? Stok dan riwayatnya ikut terhapus.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="h-12 w-full rounded-lg border-2 border-slate-900 bg-red-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        Hapus produk
      </button>
    </form>
  );
}
