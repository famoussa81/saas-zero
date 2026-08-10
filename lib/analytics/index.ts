"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  userId?: string;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled =
      typeof window !== "undefined" && process.env.NODE_ENV === "production";
    this.flushQueue();
  }

  private flushQueue() {
    if (!this.isEnabled) return;

    // In production, send to your analytics provider (PostHog, Mixpanel, etc.)
    // For now, we'll use console.log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Queue:", this.queue);
    }

    this.queue = [];
  }

  track(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics]", event.name, event.properties);
      }
      return;
    }

    this.queue.push(event);

    // Flush immediately for important events
    if (
      event.name === "signup" ||
      event.name === "purchase" ||
      event.name === "error"
    ) {
      this.flushQueue();
    }
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    this.track({
      name: "identify",
      properties: { userId, ...traits },
      userId,
    });
  }

  page(pathname: string, searchParams: URLSearchParams) {
    this.track({
      name: "page_view",
      properties: {
        path: pathname,
        search: searchParams.toString(),
        title: document.title,
        referrer: document.referrer,
      },
    });
  }
}

export const analytics = new Analytics();

// React hook for page tracking
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    analytics.page(pathname, searchParams);
  }, [pathname, searchParams]);
}

// Predefined event helpers
export const events = {
  signup: (
    method: "email" | "oauth" | "magic_link",
    metadata?: Record<string, unknown>,
  ) => analytics.track({ name: "signup", properties: { method, ...metadata } }),

  login: (method: "email" | "oauth" | "magic_link") =>
    analytics.track({ name: "login", properties: { method } }),

  logout: () => analytics.track({ name: "logout" }),

  onboardingStart: () => analytics.track({ name: "onboarding_start" }),

  onboardingStep: (step: string, completed: boolean) =>
    analytics.track({
      name: "onboarding_step",
      properties: { step, completed },
    }),

  onboardingComplete: (hasOrganization: boolean) =>
    analytics.track({
      name: "onboarding_complete",
      properties: { hasOrganization },
    }),

  subscriptionStart: (plan: string, billingCycle: "monthly" | "yearly") =>
    analytics.track({
      name: "subscription_start",
      properties: { plan, billingCycle },
    }),

  subscriptionCancel: (plan: string, reason?: string) =>
    analytics.track({
      name: "subscription_cancel",
      properties: reason ? { plan, reason } : { plan },
    }),

  subscriptionUpgrade: (fromPlan: string, toPlan: string) =>
    analytics.track({
      name: "subscription_upgrade",
      properties: { fromPlan, toPlan },
    }),

  trialStart: (plan: string, trialDays: number) =>
    analytics.track({ name: "trial_start", properties: { plan, trialDays } }),

  featureUse: (
    feature: string,
    action: string,
    metadata?: Record<string, unknown>,
  ) =>
    analytics.track({
      name: "feature_use",
      properties: { feature, action, ...metadata },
    }),

  dashboardView: (section: string) =>
    analytics.track({ name: "dashboard_view", properties: { section } }),

  inviteSent: (role: string) =>
    analytics.track({ name: "invite_sent", properties: { role } }),

  inviteAccepted: () => analytics.track({ name: "invite_accepted" }),

  contactFormSubmit: (subject: string) =>
    analytics.track({ name: "contact_form_submit", properties: { subject } }),

  newsletterSubscribe: (source: string) =>
    analytics.track({ name: "newsletter_subscribe", properties: { source } }),

  search: (query: string, resultsCount: number) =>
    analytics.track({ name: "search", properties: { query, resultsCount } }),

  error: (message: string, context?: Record<string, unknown>) =>
    analytics.track({ name: "error", properties: { message, ...context } }),
};
