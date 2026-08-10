import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(key, value, options);
          } catch {
            // `set` was called from a Server Component — safe to ignore
            // when middleware refreshes the session.
          }
        },
        remove(key: string, options: CookieOptions) {
          try {
            cookieStore.set(key, "", { ...options, maxAge: 0 });
          } catch {
            // Same as above.
          }
        },
      },
    },
  );
}
