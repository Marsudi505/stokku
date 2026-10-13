import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductSearch from "@/components/ProductSearch";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { toProductRow } from "@/lib/types";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function ProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const query = q.trim().replace(/[%_,()]/g, "").slice(0, 50);
  const current = Math.max(1, parseInt(page, 10) || 1);
  const isAdmin = (await getRole()) === "admin";
  const supabase = await createServerSupabase();

  let req = supabase
    .from("master_products")
    .select("id, plu_code, name, category, price, min_stock, inventory(current_qty, location)", {
      count: "exact",
    })
    .order("name");
  if (query) req = req.or(`plu_code.ilike.%${query}%,name.ilike.%${query}%`);
  const from = (current - 1) * PAGE_SIZE;
  const { data: raw, count } = await req.range(from, from + PAGE_SIZE - 1);
  const products = (raw ?? []).map(toProductRow);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/produk?${qs}` : "/produk";
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Produk</h1>
      <p className="text-sm text-slate-600">
        {query ? `${total} hasil untuk "${query}".` : `${total} SKU terdaftar.`}
      </p>
      <ProductSearch initial={query} />
      <div className="mt-2 flex flex-col gap-2">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
        {products.length === 0 && <p className="py-8 text-center text-sm text-slate-600">Tidak ditemukan.</p>}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          {current > 1 ? (
            <Link href={pageHref(current - 1)} className="flex h-11 items-center gap-1 rounded-xl border-2 border-slate-900 bg-white px-4 text-sm font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              <ChevronLeft size={16} /> Sebelumnya
            </Link>
          ) : <div />}
          <p className="text-sm text-slate-600">{current} / {totalPages}</p>
          {current < totalPages ? (
            <Link href={pageHref(current + 1)} className="flex h-11 items-center gap-1 rounded-xl border-2 border-slate-900 bg-white px-4 text-sm font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Berikutnya <ChevronRight size={16} />
            </Link>
          ) : <div />}
        </div>
      )}
      {isAdmin && (
        <Link
          href="/produk/tambah"
          aria-label="Tambah produk"
          className="fixed right-4 bottom-24 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-pink-400 text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Plus size={26} />
        </Link>
      )}
    </main>
  );
}
