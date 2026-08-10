"use client";

import { usePageTracking } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  usePageTracking();

  return <>{children}</>;
}
