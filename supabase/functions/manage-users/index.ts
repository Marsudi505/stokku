import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERNAME_RE = /^[a-z0-9]{3,30}$/;
const INTERNAL_DOMAIN = "stokku.local";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Auto-provided by Supabase. Prefer the new secret-key model, fall back to legacy.
    const secretKeysEnv = Deno.env.get("SUPABASE_SECRET_KEYS");
    const serviceKey = secretKeysEnv
      ? (JSON.parse(secretKeysEnv) as Record<string, string>).default
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return json({ error: "token tidak valid" }, 401);
    }
    const callerId = userData.user.id;

    const { data: profile } = await admin
      .from("profiles")
      .select("role, is_active")
      .eq("user_id", callerId)
      .maybeSingle();

    if (!profile || profile.role !== "owner" || !profile.is_active) {
      return json({ error: "hanya owner" }, 403);
    }

    const body = await req.json();
    const action = String(body.action ?? "");

    switch (action) {
      case "list": {
        const { data, error } = await admin
          .from("profiles")
          .select("user_id, username, full_name, role, store_id, is_active, created_at")
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json({ data });
      }

      case "create": {
        const username = String(body.username ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const full_name = String(body.full_name ?? "").trim() || null;
        const role = String(body.role ?? "");
        const store_id = String(body.store_id ?? "");

        if (!USERNAME_RE.test(username))
          return json({ error: "username 3-30 karakter, huruf kecil/angka" }, 400);
        if (password.length < 6)
          return json({ error: "password minimal 6 karakter" }, 400);
        if (role !== "owner" && role !== "kasir")
          return json({ error: "role harus owner atau kasir" }, 400);
        if (!store_id) return json({ error: "cabang wajib diisi" }, 400);

        const email = `${username}@${INTERNAL_DOMAIN}`;

        const { data: created, error: createErr } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: { role, store_id, full_name },
            user_metadata: { full_name },
          });
        if (createErr) return json({ error: createErr.message }, 400);

        const { error: profErr } = await admin.from("profiles").insert({
          user_id: created.user.id,
          username,
          full_name,
          role,
          store_id,
          is_active: true,
        });
        if (profErr) {
          await admin.auth.admin.deleteUser(created.user.id);
          return json({ error: profErr.message }, 400);
        }
        return json({ data: { user_id: created.user.id, username } });
      }

      case "update": {
        const user_id = String(body.user_id ?? "");
        const full_name = String(body.full_name ?? "").trim() || null;
        const role = String(body.role ?? "");
        const store_id = String(body.store_id ?? "");

        if (role !== "owner" && role !== "kasir")
          return json({ error: "role harus owner atau kasir" }, 400);

        const { error } = await admin
          .from("profiles")
          .update({ full_name, role, store_id })
          .eq("user_id", user_id);
        if (error) return json({ error: error.message }, 400);

        await admin.auth.admin.updateUserById(user_id, {
          app_metadata: { role, store_id, full_name },
        });
        return json({ ok: true });
      }

      case "password": {
        const user_id = String(body.user_id ?? "");
        const password = String(body.password ?? "");
        if (password.length < 6)
          return json({ error: "password minimal 6 karakter" }, 400);
        const { error } = await admin.auth.admin.updateUserById(user_id, { password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "deactivate": {
        const user_id = String(body.user_id ?? "");
        const { error } = await admin
          .from("profiles")
          .update({ is_active: false })
          .eq("user_id", user_id);
        if (error) return json({ error: error.message }, 400);
        await admin.auth.admin.updateUserById(user_id, { ban_duration: "87600h" });
        return json({ ok: true });
      }

      case "reactivate": {
        const user_id = String(body.user_id ?? "");
        const { error } = await admin
          .from("profiles")
          .update({ is_active: true })
          .eq("user_id", user_id);
        if (error) return json({ error: error.message }, 400);
        await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" });
        return json({ ok: true });
      }

      case "delete": {
        const user_id = String(body.user_id ?? "");
        if (user_id === callerId)
          return json({ error: "tidak bisa menghapus akun sendiri" }, 400);
        const { error } = await admin.from("profiles").delete().eq("user_id", user_id);
        if (error) return json({ error: error.message }, 400);
        await admin.auth.admin.deleteUser(user_id);
        return json({ ok: true });
      }

      default:
        return json({ error: "action tidak dikenal" }, 400);
    }
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
