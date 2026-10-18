import { HeaderDateTime, HeaderGreeting } from "@/components/HeaderClock";
import Logo from "@/components/Logo";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import StoreSwitcher from "@/components/StoreSwitcher";

export default async function AppHeader() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const profile = await getProfile();
  const meta = (data.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const email = data.user?.email ?? "";
  const raw = profile.fullName || meta.full_name || meta.name || email.split("@")[0] || "Bos";
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  const { data: stores } =
    profile.role === "owner"
      ? await supabase
          .from("stores")
          .select("id, name")
          .eq("is_active", true)
          .order("name")
      : { data: [] };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-900 bg-amber-400 text-slate-900">
      <div className="mx-auto flex max-w-md items-start justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Logo className="h-10 w-10 rounded-lg text-xl" />
          <HeaderGreeting name={name} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <HeaderDateTime />
          {profile.role === "owner" && (stores?.length ?? 0) > 0 && (
            <StoreSwitcher stores={stores ?? []} defaultStore={profile.storeId} />
          )}
        </div>
      </div>
    </header>
  );
}
