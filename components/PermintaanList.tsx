"use client";
import { useState } from "react";
import { approveRequest, rejectRequest } from "@/lib/actions";
import type { StockRequestRow } from "@/lib/types";

type Row = StockRequestRow & {
  master_products?: { name: string; plu_code: string } | { name: string; plu_code: string }[];
  stores?: { name: string } | { name: string }[];
};

export default function PermintaanList({ rows }: { rows: Row[] }) {
  const [msg, setMsg] = useState("");

  async function onApprove(id: string) {
    const res = await approveRequest(id);
    setMsg(res.ok ?? res.error ?? "");
  }
  async function onReject(id: string) {
    const note = prompt("Alasan penolakan (opsional):") ?? undefined;
    const res = await rejectRequest(id, note);
    setMsg(res.ok ?? res.error ?? "");
  }

  if (rows.length === 0)
    return <p className="mt-4 text-sm text-slate-600">Belum ada permintaan.</p>;

  return (
    <div className="mt-4 flex flex-col gap-3">
      {msg && <p className="text-sm font-bold">{msg}</p>}
      {rows.map((r) => {
        const prod = Array.isArray(r.master_products) ? r.master_products[0] : r.master_products;
        const store = Array.isArray(r.stores) ? r.stores[0] : r.stores;
        return (
          <div key={r.id}
            className="rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_0_#0f172a]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold">{prod?.name ?? "-"}</p>
                <p className="text-xs text-slate-600">
                  {prod?.plu_code} • {store?.name ?? "-"} •{" "}
                  {r.requested_delta > 0 ? `+${r.requested_delta}` : r.requested_delta} •{" "}
                  {r.request_type}
                </p>
                <p className="mt-1 text-xs italic">{r.reason ?? "-"}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border-2 border-slate-900 px-2 py-0.5 text-[11px] font-bold ${
                  r.status === "pending" ? "bg-amber-300"
                    : r.status === "approved" ? "bg-green-300" : "bg-red-300"
                }`}
              >
                {r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => onApprove(r.id)}
                  className="flex-1 rounded-lg border-2 border-slate-900 bg-green-400 px-3 py-2 text-xs font-bold">
                  Setujui
                </button>
                <button onClick={() => onReject(r.id)}
                  className="flex-1 rounded-lg border-2 border-slate-900 bg-red-400 px-3 py-2 text-xs font-bold">
                  Tolak
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
