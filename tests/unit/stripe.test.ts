import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PLANS, getPlanByPriceId } from "@/lib/stripe";

describe("stripe", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_starter_test";
    process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_test";
    process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY = "price_enterprise_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("PLANS", () => {
    it("has all required plans", () => {
      expect(PLANS.free).toBeDefined();
      expect(PLANS.starter).toBeDefined();
      expect(PLANS.pro).toBeDefined();
      expect(PLANS.enterprise).toBeDefined();
    });

    it("free plan has no price ID", () => {
      expect(PLANS.free.stripePriceId).toBeNull();
      expect(PLANS.free.priceId).toBeNull();
    });

    it("paid plans have price IDs from env or defaults", () => {
      expect(PLANS.starter.stripePriceId).toBe("price_starter_test");
      expect(PLANS.pro.stripePriceId).toBe("price_pro_test");
      expect(PLANS.enterprise.stripePriceId).toBe("price_enterprise_test");
    });

    it("all plans have features array", () => {
      Object.values(PLANS).forEach((plan) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it("all plans have limits object", () => {
      Object.values(PLANS).forEach((plan) => {
        expect(plan.limits).toBeDefined();
        expect(typeof plan.limits.projects).toBe("number");
        expect(typeof plan.limits.members).toBe("number");
        expect(typeof plan.limits.storage).toBe("number");
      });
    });
  });

  describe("getPlanByPriceId", () => {
    it("returns correct plan for starter price ID", () => {
      const plan = getPlanByPriceId("price_starter_test");
      expect(plan).toEqual(PLANS.starter);
    });

    it("returns correct plan for pro price ID", () => {
      const plan = getPlanByPriceId("price_pro_test");
      expect(plan).toEqual(PLANS.pro);
    });

    it("returns correct plan for enterprise price ID", () => {
      const plan = getPlanByPriceId("price_enterprise_test");
      expect(plan).toEqual(PLANS.enterprise);
    });

    it("returns null for unknown price ID", () => {
      const plan = getPlanByPriceId("price_unknown");
      expect(plan).toBeNull();
    });

    it("returns null for free plan price ID (null)", () => {
      const plan = getPlanByPriceId(null as unknown as string);
      expect(plan).toBeNull();
    });
  });

  describe("createCheckoutSession", () => {
    it("calls stripe.checkout.sessions.create with correct parameters", async () => {
      const mockCreate = vi
        .fn()
        .mockResolvedValue({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/...",
        });
      vi.mock("stripe", () => ({
        default: vi.fn().mockImplementation(() => ({
          checkout: {
            sessions: { create: mockCreate },
          },
        })),
      }));

      const { createCheckoutSession } = await import("@/lib/stripe");
      const session = await createCheckoutSession({
        customerId: "cus_test",
        priceId: "price_starter_test",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        metadata: { userId: "user_123" },
      });

      expect(session.id).toBe("cs_test_123");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_test",
          mode: "subscription",
          line_items: [{ price: "price_starter_test", quantity: 1 }],
          success_url: "https://example.com/success",
          cancel_url: "https://example.com/cancel",
          metadata: { userId: "user_123" },
          allow_promotion_codes: true,
          billing_address_collection: "required",
          tax_id_collection: { enabled: true },
        }),
      );
    });
  });

  describe("createPortalSession", () => {
    it("calls stripe.billingPortal.sessions.create with correct parameters", async () => {
      const mockCreate = vi
        .fn()
        .mockResolvedValue({ url: "https://billing.stripe.com/..." });
      vi.mock("stripe", () => ({
        default: vi.fn().mockImplementation(() => ({
          billingPortal: {
            sessions: { create: mockCreate },
          },
        })),
      }));

      const { createPortalSession } = await import("@/lib/stripe");
      const session = await createPortalSession({
        customerId: "cus_test",
        returnUrl: "https://example.com/billing",
      });

      expect(session.url).toBe("https://billing.stripe.com/...");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_test",
          return_url: "https://example.com/billing",
        }),
      );
    });
  });

  describe("getOrCreateCustomer", () => {
    it("returns existing customer if found", async () => {
      const existingCustomer = {
        id: "cus_existing",
        email: "test@example.com",
      };
      const mockList = vi.fn().mockResolvedValue({ data: [existingCustomer] });
      vi.mock("stripe", () => ({
        default: vi.fn().mockImplementation(() => ({
          customers: { list: mockList },
        })),
      }));

      const { getOrCreateCustomer } = await import("@/lib/stripe");
      const customer = await getOrCreateCustomer({
        userId: "user_123",
        email: "test@example.com",
        name: "Test User",
      });

      expect(customer).toEqual(existingCustomer);
      expect(mockList).toHaveBeenCalledWith({
        email: "test@example.com",
        limit: 1,
      });
    });

    it("creates new customer if none exists", async () => {
      const newCustomer = {
        id: "cus_new",
        email: "test@example.com",
        name: "Test User",
      };
      const mockList = vi.fn().mockResolvedValue({ data: [] });
      const mockCreate = vi.fn().mockResolvedValue(newCustomer);
      vi.mock("stripe", () => ({
        default: vi.fn().mockImplementation(() => ({
          customers: { list: mockList, create: mockCreate },
        })),
      }));

      const { getOrCreateCustomer } = await import("@/lib/stripe");
      const customer = await getOrCreateCustomer({
        userId: "user_123",
        email: "test@example.com",
        name: "Test User",
      });

      expect(customer).toEqual(newCustomer);
      expect(mockList).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          name: "Test User",
          metadata: { userId: "user_123" },
        }),
      );
    });
  });

  describe("verifyWebhookSignature", () => {
    it("verifies webhook signature correctly", async () => {
      const mockConstructEvent = vi
        .fn()
        .mockReturnValue({
          id: "evt_test",
          type: "checkout.session.completed",
        });
      vi.mock("stripe", () => ({
        default: vi.fn().mockImplementation(() => ({
          webhooks: { constructEvent: mockConstructEvent },
        })),
      }));

      const { verifyWebhookSignature } = await import("@/lib/stripe");
      const event = verifyWebhookSignature(
        "payload",
        "sig_header",
        "whsec_test",
      );

      expect(event.id).toBe("evt_test");
      expect(mockConstructEvent).toHaveBeenCalledWith(
        "payload",
        "sig_header",
        "whsec_test",
      );
    });
  });
});
