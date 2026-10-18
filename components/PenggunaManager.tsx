"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Prof = {
  user_id: string;
  username: string;
  full_name: string | null;
  role: "owner" | "kasir";
  store_id: string | null;
  is_active: boolean;
};
type Store = { id: string; name: string };

const field =
  "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export default function PenggunaManager() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Prof[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "kasir",
    store_id: "",
  });

  const load = useCallback(async () => {
    const { data: tok } = await supabase.auth.getSession();
    const token = tok?.session?.access_token;
    if (!token) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-users`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      }
    );
    const json = await res.json();
    if (json.data) setProfiles(json.data);
    else setErr(json.error ?? "gagal memuat");
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await load();
      const { data } = await supabase.from("stores").select("id, name").eq("is_active", true);
      if (!cancelled && data) setStores(data);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [load, supabase]);

  async function call(action: string, extra: Record<string, unknown>) {
    setErr("");
    setMsg("");
    const { data: tok } = await supabase.auth.getSession();
    const token = tok?.session?.access_token;
    if (!token) return setErr("sesi berakhir");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-users`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      }
    );
    const json = await res.json();
    if (json.error) setErr(json.error);
    else setMsg("Berhasil.");
    await load();
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9]{3,30}$/.test(form.username)) {
      setErr("username 3-30 karakter, huruf kecil/angka");
      return;
    }
    if (form.password.length < 6) {
      setErr("password minimal 6 karakter");
      return;
    }
    if (!form.store_id) {
      setErr("pilih cabang");
      return;
    }
    call("create", form);
    setForm({ username: "", password: "", full_name: "", role: "kasir", store_id: "" });
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <form
        onSubmit={submitCreate}
        className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]"
      >
        <p className="font-bold">Tambah karyawan</p>
        <div className="mt-3 grid gap-2">
          <input
            className={field}
            placeholder="username (huruf kecil/angka)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            className={field}
            type="password"
            placeholder="password (min 6)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            className={field}
            placeholder="nama lengkap"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <select
            className={field}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="kasir">Kasir</option>
            <option value="owner">Owner</option>
          </select>
          <select
            className={field}
            value={form.store_id}
            onChange={(e) => setForm({ ...form, store_id: e.target.value })}
            required
          >
            <option value="">— pilih cabang —</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {err && <p className="mt-2 text-sm font-bold text-red-600">{err}</p>}
        {msg && <p className="mt-2 text-sm font-bold text-slate-900">{msg}</p>}
        <button
          type="submit"
          className="mt-3 h-12 w-full rounded-lg border-2 border-slate-900 bg-pink-400 font-bold text-slate-900 shadow-[2px_2px_0_0_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Buat akun
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {profiles.map((p) => (
          <div
            key={p.user_id}
            className="rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[4px_4px_0_0_#0f172a]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold">{p.username}</p>
                <p className="text-xs text-slate-600">
                  {p.full_name ?? "-"} • {p.role} •{" "}
                  {stores.find((s) => s.id === p.store_id)?.name ?? "-"}
                </p>
              </div>
              <span
                className={`rounded-full border-2 border-slate-900 px-2 py-0.5 text-[11px] font-bold ${
                  p.is_active ? "bg-amber-400" : "bg-slate-200"
                }`}
              >
                {p.is_active ? "aktif" : "nonaktif"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  call("deactivate", { user_id: p.user_id })
                }
                className="rounded-lg border-2 border-slate-900 bg-white px-3 py-1 text-xs font-bold"
              >
                Nonaktifkan
              </button>
              <button
                onClick={() => call("reactivate", { user_id: p.user_id })}
                className="rounded-lg border-2 border-slate-900 bg-white px-3 py-1 text-xs font-bold"
              >
                Aktifkan
              </button>
              <button
                onClick={() => {
                  const pw = prompt(`Password baru untuk ${p.username} (min 6):`);
                  if (pw && pw.length >= 6) call("password", { user_id: p.user_id, password: pw });
                }}
                className="rounded-lg border-2 border-slate-900 bg-white px-3 py-1 text-xs font-bold"
              >
                Ganti sandi
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus akun ${p.username}?`)) call("delete", { user_id: p.user_id });
                }}
                className="rounded-lg border-2 border-slate-900 bg-red-400 px-3 py-1 text-xs font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
