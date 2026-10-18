"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function ProductSearch({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (value === initial) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="sticky top-[98px] z-10 -mx-4 bg-slate-50 px-4 pt-2 pb-2">
      <label className="flex h-12 items-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-4 shadow-[2px_2px_0_0_#0f172a]">
        <Search size={18} className="shrink-0 text-slate-900" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cari PLU atau nama..."
          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"
        />
      </label>
    </div>
  );
}
