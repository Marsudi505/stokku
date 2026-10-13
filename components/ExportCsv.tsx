"use client";
import { Download } from "lucide-react";

export type CsvRow = { tanggal: string; produk: string; tipe: string; qty: number; alasan: string };

export default function ExportCsv({ rows }: { rows: CsvRow[] }) {
  function download() {
    const esc = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
    const body = rows
      .map((r) => [r.tanggal, r.produk, r.tipe, r.qty, r.alasan].map(esc).join(","))
      .join("\n");
    const blob = new Blob([`tanggal,produk,tipe,qty,alasan\n${body}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-stok-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={rows.length === 0}
      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-white text-sm font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
    >
      <Download size={16} /> CSV
    </button>
  );
}
