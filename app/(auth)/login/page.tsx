"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Periksa email & password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-slate-50 p-6 text-slate-900">
      <Logo className="mx-auto h-20 w-20 rounded-2xl text-3xl shadow-[4px_4px_0_0_#0f172a]" />
      <h1 className="mt-4 text-center font-display text-3xl">STOKKU</h1>
      <p className="mt-1 text-center text-sm font-medium text-slate-600">Masuk untuk kelola stok toko.</p>
      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]"
      >
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg border-2 border-slate-900 bg-pink-400 font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}
