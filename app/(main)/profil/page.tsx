import LogoutButton from "@/components/LogoutButton";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? "-";
  const profile = await getProfile();
  const initial = (profile.fullName ?? profile.username ?? email).charAt(0).toUpperCase();

  const roleLabel = profile.role === "owner" ? "Owner" : profile.role === "kasir" ? "Kasir" : "Belum aktif";
  const roleBg = profile.role === "owner" ? "bg-amber-400" : "bg-white";

  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl">Profil</h1>
      <p className="text-sm font-medium text-slate-600">Akun yang sedang masuk.</p>

      <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-pink-400 font-display text-xl">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">{profile.username || email}</p>
          <p className="truncate text-xs text-slate-600">{email}</p>
          <span
            className={`mt-1 inline-block rounded-full border-2 border-slate-900 px-2 py-0.5 text-[11px] font-bold ${roleBg}`}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border-2 border-slate-900 bg-amber-400 p-4 shadow-[4px_4px_0_0_#0f172a]">
        <p className="text-sm font-bold">STOKKU v1</p>
        <p className="mt-1 text-xs font-medium">Manajemen stok toko — mobile PWA.</p>
      </div>

      <div className="mt-4">
        <LogoutButton />
      </div>
    </main>
  );
}
