import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("master_products")
    .select("id, min_stock, inventory(current_qty)");
  const critical = (data ?? []).filter((p) => {
    const inv = Array.isArray(p.inventory) ? p.inventory : [p.inventory];
    const total = inv.reduce((s, r) => s + (r?.current_qty ?? 0), 0);
    return total <= p.min_stock;
  }).length;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50 pb-28 text-slate-900">
      <AppHeader />
      {children}
      <BottomNav criticalCount={critical} />
    </div>
  );
}
