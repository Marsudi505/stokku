import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

const OWNER_ONLY = ["/pengguna", "/cabang", "/permintaan"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const serverCookies: CookieMethodsServer = {
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set({ name, value }));
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set({ name, value, ...options })
      );
    },
  };

  const supabase = createServerClient(url, key, { cookies: serverCookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user) {
    if (path.startsWith("/login")) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/produk";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, store_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = profile?.is_active && (profile.role === "owner" || profile.role === "kasir") ? profile.role : null;

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/profil";
    url.searchParams.set("error", "belum-aktif");
    return NextResponse.redirect(url);
  }

  if (OWNER_ONLY.some((p) => path.startsWith(p)) && role !== "owner") {
    const url = request.nextUrl.clone();
    url.pathname = "/produk";
    return NextResponse.redirect(url);
  }

  if (role === "owner" && profile?.store_id) {
    response.cookies.set("active_store", profile.store_id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
