import { HeaderDateTime, HeaderGreeting } from "@/components/HeaderClock";
import Logo from "@/components/Logo";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AppHeader() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const meta = (data.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const email = data.user?.email ?? "";
  const raw = meta.full_name || meta.name || email.split("@")[0] || "Bos";
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-900 bg-amber-400 text-slate-900">
      <div className="mx-auto flex max-w-md items-start justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Logo className="h-10 w-10 rounded-lg text-xl" />
          <HeaderGreeting name={name} />
        </div>
        <HeaderDateTime />
      </div>
    </header>
  );
}
