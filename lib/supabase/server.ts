import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value;
        },
        set(
          key: string,
          value: string,
          options: {
            maxAge?: number;
            domain?: string;
            path?: string;
            sameSite?: "lax" | "strict" | "none";
            secure?: boolean;
            httpOnly?: boolean;
          },
        ) {
          try {
            cookieStore.set(key, value, options);
          } catch {
            // `set` was called from a Server Component — safe to ignore
            // when middleware refreshes the session.
          }
        },
        remove(
          key: string,
          options: {
            maxAge?: number;
            domain?: string;
            path?: string;
            sameSite?: "lax" | "strict" | "none";
            secure?: boolean;
            httpOnly?: boolean;
          },
        ) {
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
