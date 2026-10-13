"use client";
import { useActionState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { transferStock } from "@/lib/actions";

const field =
  "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export default function TransferForm({
  productId,
  locations,
}: {
  productId: string;
  locations: string[];
}) {
  const [state, action, pending] = useActionState(transferStock, {});

  return (
    <form action={action} className="mt-4 rounded-xl border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-[4px_4px_0_0_#0f172a]">
      <input type="hidden" name="product_id" value={productId} />
      <p className="flex items-center gap-2 font-bold">
        <ArrowRightLeft size={18} /> Transfer lokasi
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-bold">
          Dari
          <select name="from_loc" required defaultValue={locations[0] ?? ""} className={field}>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Ke (bisa baru)
          <input name="to_loc" required placeholder="cth: Rak A2" className={field} />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_2fr] gap-2">
        <input name="qty" type="number" min={1} defaultValue={1} required className={field} />
        <input name="reason" placeholder="cth: Re-layout rak" className={field} />
      </div>
      {state?.error && <p className="mt-2 text-sm font-bold text-red-600">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm font-bold text-slate-900">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-12 w-full rounded-lg border-2 border-slate-900 bg-amber-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Pindahkan"}
      </button>
    </form>
  );
}
