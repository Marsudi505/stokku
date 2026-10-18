import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import Ticker from "@/components/Ticker";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const profile = await getProfile();
  const { data } = await supabase
    .from("master_products")
    .select("id, min_stock, inventory(current_qty)");
  const critical = (data ?? []).filter((p) => {
    const inv = Array.isArray(p.inventory) ? p.inventory : [p.inventory];
    const total = inv.reduce((s, r) => s + (r?.current_qty ?? 0), 0);
    return total <= p.min_stock;
  }).length;

  let pending = 0;
  if (profile.role === "owner") {
    const { count } = await supabase
      .from("stock_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pending = count ?? 0;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50 pb-28 text-slate-900">
      <AppHeader />
      <Ticker />
      {children}
      <BottomNav criticalCount={critical} pendingCount={pending} isOwner={profile.role === "owner"} />
    </div>
  );
}
