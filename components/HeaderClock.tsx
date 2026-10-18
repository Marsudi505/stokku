"use client";
import { useEffect, useState } from "react";

function greeting(h: number): string {
  if (h >= 4 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 19) return "Selamat sore";
  return "Selamat malam";
}

export function HeaderGreeting({ name }: { name: string }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setHour(new Date().getHours());
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold">{hour === null ? "Halo," : `${greeting(hour)},`}</p>
      <p className="truncate font-display text-base leading-tight">{name}</p>
    </div>
  );
}

export function HeaderDateTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const dateStr =
    now === null
      ? "…"
      : new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now);
  const timeStr =
    now === null
      ? "--:--:--"
      : new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
          .format(now)
          .replace(/\./g, ":");
  return (
    <div className="shrink-0 text-right">
      <p className="text-[11px] font-bold capitalize">{dateStr}</p>
      <p className="font-display text-base tabular-nums leading-tight">{timeStr}</p>
    </div>
  );
}
