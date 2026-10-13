"use client";
import { useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BackupButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function backup() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const [prod, inv, mov] = await Promise.all([
        supabase.from("master_products").select("*"),
        supabase.from("inventory").select("*"),
        supabase.from("stock_movements").select("*"),
      ]);
      if (prod.error || inv.error || mov.error) throw new Error("query");
      const dump = {
        exported_at: new Date().toISOString(),
        master_products: prod.data,
        inventory: inv.data,
        stock_movements: mov.data,
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-stokku-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Backup gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        onClick={backup}
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-white text-sm font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
      >
        <DatabaseBackup size={16} /> {busy ? "Menyiapkan..." : "Backup"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
