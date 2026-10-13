"use client";
import { useState } from "react";

const SRC = "/logo.png";

export default function Logo({ className }: { className?: string }) {
  const [dead, setDead] = useState(false);
  if (dead) {
    return (
      <span
        className={`flex items-center justify-center border-2 border-slate-900 bg-pink-400 font-display text-slate-900 ${className ?? ""}`}
      >
        S
      </span>
    );
  }
  return (
    <img
      src={SRC}
      alt="Logo STOKKU"
      onError={() => setDead(true)}
      className={`border-2 border-slate-900 bg-white ${className ?? ""}`}
    />
  );
}
