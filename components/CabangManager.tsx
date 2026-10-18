"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StoreRow } from "@/lib/types";

const field =
  "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export default function CabangManager() {
  const supabase = createClient();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", code: "", address: "" });

  async function load() {
    const { data } = await supabase
      .from("stores")
      .select("id, name, code, address, is_active")
      .order("name");
    if (data) setStores(data as StoreRow[]);
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data } = await supabase
        .from("stores")
        .select("id, name, code, address, is_active")
        .order("name");
      if (!cancelled && data) setStores(data as StoreRow[]);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const { error } = await supabase
      .from("stores")
      .insert({ name: form.name, code: form.code, address: form.address || null });
    if (error) setErr(error.message);
    else setForm({ name: "", code: "", address: "" });
    load();
  }

  async function toggle(s: StoreRow) {
    await supabase.from("stores").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <form
        onSubmit={add}
        className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]"
      >
        <p className="font-bold">Tambah cabang</p>
        <div className="mt-3 grid gap-2">
          <input className={field} placeholder="Nama (cth: Toko Utama)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={field} placeholder="Kode (cth: UTAMA)" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <input className={field} placeholder="Alamat (opsional)" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        {err && <p className="mt-2 text-sm font-bold text-red-600">{err}</p>}
        <button type="submit"
          className="mt-3 h-12 w-full rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          Simpan
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {stores.map((s) => (
          <div key={s.id}
            className="flex items-center justify-between gap-2 rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_0_#0f172a]">
            <div className="min-w-0">
              <p className="truncate font-bold">{s.name}</p>
              <p className="text-xs text-slate-600">{s.code} • {s.address ?? "-"}</p>
            </div>
            <button onClick={() => toggle(s)}
              className={`rounded-lg border-2 border-slate-900 px-3 py-1 text-xs font-bold ${
                s.is_active ? "bg-amber-400" : "bg-slate-200"}`}>
              {s.is_active ? "aktif" : "nonaktif"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
