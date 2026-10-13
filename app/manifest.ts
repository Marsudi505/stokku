import type { MetadataRoute } from "next";

// Taruh file PNG di /public: icon-192x192.png & icon-512x512.png
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "STOKKU by INDC",
    short_name: "STOKKU",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#f472b6",
    start_url: "/dashboard",
    scope: "/",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
