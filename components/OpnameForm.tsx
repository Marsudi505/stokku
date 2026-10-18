"use client";
import { useActionState, useState } from "react";
import { submitOpname } from "@/lib/actions";

type Row = { id: string; plu: string; name: string; loc: string; sys: number };

export default function OpnameForm({
  rows,
  role,
  storeId,
}: {
  rows: Row[];
  role: "owner" | "kasir";
  storeId: string | null;
}) {
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(submitOpname, {});

  const key = (r: Row) => `${r.id}::${r.loc}`;
  const getCount = (r: Row) => {
    const v = counts[key(r)];
    return v === undefined || v === "" ? r.sys : Math.max(0, Math.floor(Number(v)));
  };

  return (
    <form action={action} className="mt-4 flex flex-col gap-2">
      <input type="hidden" name="store_id" value={storeId ?? ""} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(rows.map((r) => ({ id: r.id, counted: getCount(r) })))}
      />
      {role === "kasir" && (
        <p className="rounded-lg border-2 border-slate-900 bg-amber-200 p-2 text-xs font-bold">
          Hasil opname dikirim ke owner untuk disetujui.
        </p>
      )}
      {rows.map((r) => {
        const counted = getCount(r);
        const diff = counted - r.sys;
        return (
          <div
            key={key(r)}
            className="rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_0_#0f172a]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-slate-600">
                  {r.plu} • {r.loc} • sistem: {r.sys}
                </p>
              </div>
              <input
                type="number"
                min={0}
                value={counts[key(r)] ?? r.sys}
                onChange={(e) => setCounts((c) => ({ ...c, [key(r)]: e.target.value }))}
                className="h-12 w-24 shrink-0 rounded-lg border-2 border-slate-900 bg-white px-3 text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            {diff !== 0 && (
              <p className={`mt-1 text-xs font-semibold ${diff > 0 ? "text-pink-600" : "text-red-700"}`}>
                Selisih {diff > 0 ? `+${diff}` : diff} →{" "}
                {role === "owner" ? "jadi ADJUSTMENT" : "menunggu persetujuan"}
              </p>
            )}
          </div>
        );
      })}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm font-semibold text-pink-600">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className="sticky bottom-24 mt-2 h-12 rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : role === "owner" ? "Terapkan opname" : "Kirim hasil opname"}
      </button>
    </form>
  );
}
