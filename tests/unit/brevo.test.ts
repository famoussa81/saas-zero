import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("brevo", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.BREVO_API_KEY = "test-api-key";
    process.env.BREVO_SENDER_EMAIL = "test@example.com";
    process.env.BREVO_SENDER_NAME = "Test Sender";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("sendTransactionalEmail", () => {
    it("returns error when API key is not configured", async () => {
      process.env.BREVO_API_KEY = "";
      const { sendTransactionalEmail } = await import("@/lib/brevo");
      const result = await sendTransactionalEmail({
        to: [{ email: "test@example.com" }],
        subject: "Test",
        htmlContent: "<p>Test</p>",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("BREVO_API_KEY not configured");
    });

    it("sends email successfully with all parameters", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mock("@getbrevo/brevo", () => ({
        BrevoClient: vi.fn().mockImplementation(() => ({
          transactionalEmails: { sendTransacEmail: mockSend },
        })),
      }));

      const { sendTransactionalEmail } = await import("@/lib/brevo");
      const result = await sendTransactionalEmail({
        to: [{ email: "test@example.com", name: "Test User" }],
        subject: "Test Subject",
        htmlContent: "<p>Test Content</p>",
        textContent: "Test Content",
        templateId: 123,
        params: { key: "value" },
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: { email: "test@example.com", name: "Test Sender" },
          to: [{ email: "test@example.com", name: "Test User" }],
          subject: "Test Subject",
          htmlContent: "<p>Test Content</p>",
          textContent: "Test Content",
          templateId: 123,
          params: { key: "value" },
        }),
      );
    });

    it("handles Brevo API error", async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error("API Error"));
      vi.mock("@getbrevo/brevo", () => ({
        BrevoClient: vi.fn().mockImplementation(() => ({
          transactionalEmails: { sendTransacEmail: mockSend },
        })),
      }));

      const { sendTransactionalEmail } = await import("@/lib/brevo");
      const result = await sendTransactionalEmail({
        to: [{ email: "test@example.com" }],
        subject: "Test",
        htmlContent: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("API Error");
    });
  });

  describe("sendWelcomeEmail", () => {
    it("sends welcome email with correct content", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mock("@getbrevo/brevo", () => ({
        BrevoClient: vi.fn().mockImplementation(() => ({
          transactionalEmails: { sendTransacEmail: mockSend },
        })),
      }));

      const { sendWelcomeEmail } = await import("@/lib/brevo");
      const result = await sendWelcomeEmail("user@example.com", "John");

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: "user@example.com", name: "John" }],
          subject: "Bienvenue sur SaaS Zero ! 🎉",
          htmlContent: expect.stringContaining("Bienvenue John"),
        }),
      );
    });
  });

  describe("sendInvoiceEmail", () => {
    it("sends invoice email with formatted amount", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mock("@getbrevo/brevo", () => ({
        BrevoClient: vi.fn().mockImplementation(() => ({
          transactionalEmails: { sendTransacEmail: mockSend },
        })),
      }));

      const { sendInvoiceEmail } = await import("@/lib/brevo");
      const result = await sendInvoiceEmail(
        "user@example.com",
        "John",
        "http://invoice.url",
        49.99,
      );

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: "user@example.com", name: "John" }],
          subject: expect.stringContaining("49,99"),
          htmlContent: expect.stringContaining("49,99"),
        }),
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("sends password reset email with reset URL", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mock("@getbrevo/brevo", () => ({
        BrevoClient: vi.fn().mockImplementation(() => ({
          transactionalEmails: { sendTransacEmail: mockSend },
        })),
      }));

      const { sendPasswordResetEmail } = await import("@/lib/brevo");
      const result = await sendPasswordResetEmail(
        "user@example.com",
        "http://reset.url",
      );

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: "user@example.com" }],
          subject: "Réinitialisation de ton mot de passe SaaS Zero",
          htmlContent: expect.stringContaining("http://reset.url"),
        }),
      );
    });
  });

  describe("sendTeamInvitationEmail", () => {
    it("sends team invitation email with correct content", async () => {
      const mockSend = vi.fn().mockResolvedValue({});
      vi.mock("@getbrevo/brevo", () => ({
        BrevoClient: vi.fn().mockImplementation(() => ({
          transactionalEmails: { sendTransacEmail: mockSend },
        })),
      }));

      const { sendTeamInvitationEmail } = await import("@/lib/brevo");
      const result = await sendTeamInvitationEmail(
        "invitee@example.com",
        "Alice",
        "Acme Corp",
        "http://invite.url",
      );

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: "invitee@example.com" }],
          subject: "Alice t'invite à rejoindre Acme Corp sur SaaS Zero",
          htmlContent: expect.stringContaining("Alice"),
        }),
      );
    });
  });
});
