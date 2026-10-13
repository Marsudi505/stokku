import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "STOKKU",
  description: "Manajemen stok toko — mobile PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "STOKKU", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f472b6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        {children}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}`,
            }}
          />
        )}
      </body>
    </html>
  );
}
