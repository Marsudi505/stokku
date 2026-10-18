import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";

export type Role = "owner" | "kasir";

export type Profile = {
  userId: string;
  username: string;
  fullName: string | null;
  role: Role | null;
  storeId: string | null;
  isActive: boolean;
};

const ANON: Profile = {
  userId: "",
  username: "",
  fullName: null,
  role: null,
  storeId: null,
  isActive: false,
};

export async function getProfile(): Promise<Profile> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return ANON;

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, role, store_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return {
      userId: user.id,
      username: profile?.username ?? "",
      fullName: profile?.full_name ?? null,
      role: null,
      storeId: profile?.store_id ?? null,
      isActive: false,
    };
  }

  return {
    userId: user.id,
    username: profile.username,
    fullName: profile.full_name,
    role: profile.role === "owner" || profile.role === "kasir" ? profile.role : null,
    storeId: profile.store_id,
    isActive: profile.is_active,
  };
}

export async function requireAuth(): Promise<Profile> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return getProfile();
}

export async function getRole(): Promise<Role> {
  const profile = await getProfile();
  return profile.role ?? "kasir";
}
