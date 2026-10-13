import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* STOKKU: halaman auth butuh render dinamis per-request */
  cacheComponents: false,
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
