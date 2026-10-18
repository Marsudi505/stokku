"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Search } from "lucide-react";
import {
  Html5QrcodeScanner,
  Html5QrcodeScanType,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { createClient } from "@/lib/supabase/client";
import { idr, toProductRow, type ProductRow } from "@/lib/types";

const field =
  "h-12 rounded-lg border-2 border-slate-900 bg-white px-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400";

export default function ScanPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<ProductRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [looking, setLooking] = useState(false);

  async function lookup(plu: string) {
    const c = plu.trim();
    if (!c) return;
    setLooking(true);
    setError("");
    setResult(null);
    setNotFound(false);
    setCode(c);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("master_products")
        .select("id, plu_code, name, category, price, min_stock, inventory(current_qty, store_id, stores(name))")
        .eq("plu_code", c)
        .maybeSingle();
      if (error) throw error;
      if (!data) setNotFound(true);
      else {
        setResult(toProductRow(data));
        await stop();
      }
    } catch {
      setError("Gagal mencari produk. Coba lagi.");
    } finally {
      setLooking(false);
    }
  }

  async function stop() {
    try {
      await scannerRef.current?.clear();
    } catch {
      /* abaikan */
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  async function start() {
    setError("");
    setResult(null);
    setNotFound(false);
    try {
      const scanner = new Html5QrcodeScanner(
        "stokku-reader",
        {
          fps: 10,
          qrbox: { width: 260, height: 160 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        },
        false
      );
      scannerRef.current = scanner;
      setScanning(true);
      scanner.render(
        (decoded) => void lookup(decoded),
        undefined
      );
    } catch {
      setError("Kamera tidak tersedia. Pakai input manual di bawah.");
      setScanning(false);
    }
  }

  useEffect(() => () => void stop(), []);

  return (
    <main className="p-4 text-slate-900">
      <h1 className="text-xl">Scan</h1>
      <p className="text-sm font-medium text-slate-600">Arahkan kamera ke barcode, atau ketik PLU manual.</p>

      <div className="mt-4 overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-900 shadow-[4px_4px_0_0_#0f172a]">
        <div id="stokku-reader" className="min-h-[120px] bg-white" />
      </div>

      {!scanning ? (
        <button
          onClick={start}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-pink-400 font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Camera size={18} /> {result || code ? "Scan lagi" : "Mulai scan"}
        </button>
      ) : (
        <button
          onClick={stop}
          className="mt-3 h-12 w-full rounded-lg border-2 border-slate-900 bg-white font-bold shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Berhenti
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Ketik PLU manual..."
          className={`${field} w-full`}
        />
        <button
          onClick={() => void lookup(manual)}
          disabled={looking}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_0_#0f172a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          aria-label="Cari"
        >
          <Search size={18} />
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      {looking && <p className="mt-3 text-sm font-medium text-slate-600">Mencari...</p>}
      {notFound && (
        <div className="mt-3 rounded-xl border-2 border-slate-900 bg-white p-4 text-center shadow-[4px_4px_0_0_#0f172a]">
          <p className="font-bold">PLU {code} tidak terdaftar.</p>
          <Link href="/produk/tambah" className="mt-1 inline-block text-sm font-bold text-pink-600">
            Daftarkan sebagai produk baru →
          </Link>
        </div>
      )}
      {result && (
        <Link href={`/produk/${result.id}`} className="mt-3 block rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_0_#0f172a]">
          <p className="text-xs font-medium text-slate-600">{result.plu_code} • {result.location ?? "-"}</p>
          <p className="font-bold">{result.name}</p>
          <p className="mt-1 text-sm font-medium">
            Stok <span className="font-display">{result.current_qty}</span> • {idr(result.price)}
          </p>
          <p className="mt-1 text-sm font-bold text-pink-600">Buka detail →</p>
        </Link>
      )}
    </main>
  );
}
