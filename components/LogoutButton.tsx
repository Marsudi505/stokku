"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-red-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
    >
      <LogOut size={18} /> {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
