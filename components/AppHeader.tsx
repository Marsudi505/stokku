import Logo from "@/components/Logo";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-900 bg-amber-400">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2">
        <Logo className="h-9 w-9 rounded-lg text-lg" />
        <span className="font-display text-lg tracking-wide text-slate-900">STOKKU</span>
      </div>
    </header>
  );
}
