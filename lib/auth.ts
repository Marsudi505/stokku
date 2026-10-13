import { createServerSupabase } from "./supabase/server";

export type Role = "admin" | "kasir";

export async function getRole(): Promise<Role> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const role = (data.user?.app_metadata as { role?: string } | null)?.role;
  return role === "kasir" ? "kasir" : "admin";
}
