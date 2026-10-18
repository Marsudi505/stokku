import { requireOwner } from "@/lib/auth";
import CabangManager from "@/components/CabangManager";

export const dynamic = "force-dynamic";

export default async function CabangPage() {
  await requireOwner();
  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl font-bold">Cabang</h1>
      <p className="text-sm font-medium text-slate-600">Kelola toko/cabang.</p>
      <CabangManager />
    </main>
  );
}
