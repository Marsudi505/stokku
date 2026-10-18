import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* STOKKU: halaman auth butuh render dinamis per-request */
  cacheComponents: false,
  /* Deploy mandiri ke Pterodactyl: bundel server.js + node_modules minimal */
  output: "standalone",
  /* Tanpa next/image; matikan optimizer agar bundel tak butuh sharp (multi-arch) */
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
