// Plausible analytics - lightweight wrapper
"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";

interface PlausibleContextType {
  event: (
    eventName: string,
    options?: { props?: Record<string, string | number | boolean> },
  ) => void;
  pageview: () => void;
}

const PlausibleContext = createContext<PlausibleContextType | null>(null);

export function PlausibleProvider({ children }: { children: ReactNode }) {
  return (
    <PlausibleContext.Provider
      value={{
        event: () => {},
        pageview: () => {},
      }}
    >
      {children}
    </PlausibleContext.Provider>
  );
}

export function usePlausibleTracker() {
  const context = useContext(PlausibleContext);
  if (!context) {
    throw new Error(
      "usePlausibleTracker must be used within a PlausibleProvider",
    );
  }
  return context;
}

export function usePageView() {
  const plausible = usePlausibleTracker();
  useEffect(() => {
    plausible.pageview();
  }, [plausible]);
}
