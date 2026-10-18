import { requireOwner } from "@/lib/auth";
import PenggunaManager from "@/components/PenggunaManager";

export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  await requireOwner();
  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl font-bold">Pengguna</h1>
      <p className="text-sm font-medium text-slate-600">Kelola akun karyawan & role.</p>
      <PenggunaManager />
    </main>
  );
}
