"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import { resolveLoginIdentifier } from "@/lib/login";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const identifier = resolveLoginIdentifier(String(fd.get("identifier") ?? ""));
    const password = String(fd.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      if (signInError) throw signInError;
      router.replace("/produk");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal masuk. Periksa username & password.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-slate-50 p-6 text-slate-900">
      <Logo className="mx-auto h-20 w-20 rounded-2xl text-3xl shadow-[4px_4px_0_0_#0f172a]" />
      <h1 className="mt-4 text-center font-display text-3xl">STOKKU</h1>
      <p className="mt-1 text-center text-sm font-medium text-slate-600">Masuk untuk kelola stok toko.</p>
      <form
        onSubmit={signIn}
        className="mt-6 flex flex-col gap-3 rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]"
      >
        <label className="flex flex-col gap-1 text-sm font-bold text-slate-900">
          Username
          <div className="relative">
            <UserRound
              size={20}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-900"
            />
            <input
              name="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="cth: budi"
              className="h-14 w-full rounded-lg border-2 border-slate-900 bg-white pr-4 pl-11 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm font-bold text-slate-900">
          Kata Sandi
          <div className="relative">
            <LockKeyhole
              size={20}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-900"
            />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-14 w-full rounded-lg border-2 border-slate-900 bg-white pr-12 pl-11 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-slate-900 transition-transform active:scale-90"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-lg border-2 border-slate-900 bg-red-100 p-2 text-sm font-bold text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-14 w-full rounded-lg border-2 border-slate-900 bg-pink-400 text-lg font-bold text-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60"
        >
          {pending ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}
