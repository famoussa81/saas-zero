"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { SupabaseProvider } from "./supabase-provider";
import { PlausibleProvider } from "./plausible-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SupabaseProvider>
        <PlausibleProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "bg-background text-foreground border-border",
            }}
          />
        </PlausibleProvider>
      </SupabaseProvider>
    </SessionProvider>
  );
}
