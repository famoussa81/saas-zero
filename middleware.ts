import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getLocale(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] || "fr";
}

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  // Treat placeholder values as unconfigured to avoid network errors in dev.
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const locale = getLocale(request);

  // If Supabase env vars are missing/placeholder, skip auth entirely.
  // This lets the dev server boot and serve the marketing site without
  // requiring a configured Supabase project.
  if (!hasSupabaseConfig()) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return request.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          supabaseResponse.cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptions) {
          supabaseResponse.cookies.set(key, "", { ...options, maxAge: 0 });
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple await supabase.auth.getUser() is fine.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/billing",
    "/team",
    "/tableau-de-bord",
    "/reglages",
    "/facturation",
    "/equipe",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(`/${locale}${path}`),
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/connexion`;
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/connexion", "/inscription", "/mot-de-passe-oublie"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(`/${locale}${path}`),
  );

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/tableau-de-bord`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export default updateSession;
