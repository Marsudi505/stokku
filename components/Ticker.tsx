const TEXT = "SELAMAT DATANG DI STOKKU ★ STOK RAPI ★ TOKO HAPPY ★ ";

export default function Ticker() {
  const row = TEXT.repeat(6);
  return (
    <div className="overflow-hidden border-b-2 border-slate-900 bg-pink-400 py-1" aria-hidden>
      <div className="flex w-max animate-marquee whitespace-nowrap font-display text-xs text-slate-900">
        <span className="pr-2">{row}</span>
        <span className="pr-2">{row}</span>
      </div>
    </div>
  );
}
