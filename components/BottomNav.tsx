"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, FileText, Home, Package, ScanLine, type LucideIcon } from "lucide-react";

type Tab = { name: string; path: string; icon: LucideIcon };

const leftTabs: Tab[] = [
  { name: "Dasbor", path: "/dashboard", icon: Home },
  { name: "Produk", path: "/produk", icon: Package },
];
const rightTabs: Tab[] = [
  { name: "Laporan", path: "/laporan", icon: FileText },
  { name: "Profil", path: "/profil", icon: CircleUserRound },
];

function TabItem({ t, active, badge }: { t: Tab; active: boolean; badge?: number }) {
  const Icon = t.icon;
  return (
    <Link
      href={t.path}
      className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition-transform active:scale-90 ${
        active ? "text-pink-400" : "text-slate-900"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span>{t.name}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0 right-2 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full border-2 border-slate-900 bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function BottomNav({ criticalCount = 0 }: { criticalCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-slate-900 bg-white pb-safe">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1 pb-2">
        {leftTabs.map((t) => (
          <TabItem
            key={t.path}
            t={t}
            active={pathname.startsWith(t.path)}
            badge={t.path === "/produk" ? criticalCount : undefined}
          />
        ))}
        <Link href="/scan" className="flex flex-col items-center gap-1 text-[11px] font-bold text-slate-900 transition-transform active:scale-95">
          <span className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full border-2 border-slate-900 bg-pink-400 text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
            <ScanLine size={26} />
          </span>
          <span className="-mt-3">Scan</span>
        </Link>
        {rightTabs.map((t) => (
          <TabItem key={t.path} t={t} active={pathname.startsWith(t.path)} />
        ))}
      </div>
    </nav>
  );
}
