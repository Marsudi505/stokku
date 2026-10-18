import type { Profile } from "@/lib/auth";

export function assertCanAdjust(profile: Profile, storeId: string): string | null {
  if (!profile.role) return "Akun belum aktif.";
  if (profile.role === "owner") return null;
  if (profile.storeId !== storeId) return "Hanya bisa di cabang Anda sendiri.";
  return null;
}

export function assertOwner(profile: Profile): string | null {
  if (profile.role !== "owner") return "Hanya owner yang boleh.";
  return null;
}
