import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Jika env belum diisi (tahap dummy), lewati cek auth agar localhost bisa dilihat.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return res;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (all) => {
          all.forEach((c) => res.cookies.set(c));
        },
      },
    }
  );
  const { data } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
  if (!data.user && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (data.user && isLogin) return NextResponse.redirect(new URL("/dashboard", req.url));
  const role = (data.user?.app_metadata as { role?: string } | undefined)?.role;
  const adminOnly = path === "/produk/tambah" || /\/produk\/.+\/edit$/.test(path);
  if (data.user && role === "kasir" && adminOnly)
    return NextResponse.redirect(new URL("/produk", req.url));
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/produk/:path*", "/scan/:path*", "/laporan/:path*", "/opname/:path*", "/profil/:path*", "/login"],
};
