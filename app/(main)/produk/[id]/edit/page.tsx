import { notFound, redirect } from "next/navigation";
import EditForm from "@/components/EditForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  if ((await getRole()) !== "admin") redirect("/produk");
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("master_products")
    .select("id, plu_code, name, category, price, min_stock")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Ubah Produk</h1>
      <p className="text-sm font-medium text-slate-600">Kalau PLU diubah, cetak ulang label barcode-nya.</p>
      <EditForm
        product={{
          id: data.id,
          plu_code: data.plu_code,
          name: data.name,
          category: data.category,
          price: Number(data.price),
          min_stock: data.min_stock,
        }}
      />
    </main>
  );
}
