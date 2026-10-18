"use client";
import { useState } from "react";

export default function StoreSwitcher({
  stores,
  defaultStore,
}: {
  stores: { id: string; name: string }[];
  defaultStore: string | null;
}) {
  const [pick, setPick] = useState(defaultStore ?? stores[0]?.id ?? "");

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setPick(v);
    document.cookie = `active_store=${v}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }

  return (
    <select
      value={pick}
      onChange={onChange}
      aria-label="Pilih cabang"
      className="h-8 rounded-lg border-2 border-slate-900 bg-white px-2 text-xs font-bold text-slate-900"
    >
      {stores.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
