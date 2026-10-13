import TambahForm from "@/components/TambahForm";

export default function TambahPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Tambah Produk</h1>
      <p className="text-sm text-slate-600">Daftarkan SKU baru beserta stok awalnya.</p>
      <TambahForm />
    </main>
  );
}
