import { BrevoClient } from "@getbrevo/brevo";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  console.warn("BREVO_API_KEY not set — Brevo email functions will fail");
}

const brevoClient = new BrevoClient({ apiKey: apiKey || "" });

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, string>;
}

interface SendTransacEmailRequest {
  sender: { email: string; name?: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
}

export async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  textContent,
  templateId,
  params,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!apiKey) {
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const sender = {
      email: process.env.BREVO_SENDER_EMAIL || "noreply@localhost",
      name: process.env.BREVO_SENDER_NAME || "SaaS Zero",
    };

    const request: SendTransacEmailRequest = {
      sender,
      to,
      subject,
      htmlContent,
    };

    if (textContent) request.textContent = textContent;
    if (templateId) request.templateId = templateId;
    if (params) request.params = params;

    await brevoClient.transactionalEmails.sendTransacEmail(request);
    return { success: true };
  } catch (error) {
    console.error("Brevo send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Brevo error",
    };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: "Bienvenue sur SaaS Zero ! 🎉",
    htmlContent: `
      <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-family: 'Syne', sans-serif; font-size: 28px;">Bienvenue ${name} !</h1>
        </div>
        <div style="background: #1a1a26; padding: 32px; border-radius: 0 0 16px 16px; color: #e2e8f0;">
          <p style="font-size: 16px; line-height: 1.6;">Merci de rejoindre SaaS Zero. Tu as maintenant accès à ton tableau de bord.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/fr/tableau-de-bord" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Accéder au tableau de bord</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">Si tu as des questions, réponds simplement à cet email — on est là pour t'aider.</p>
        </div>
      </div>
    `,
    textContent: `Bienvenue ${name} ! Merci de rejoindre SaaS Zero. Accède à ton tableau de bord : ${process.env.NEXT_PUBLIC_APP_URL}/fr/tableau-de-bord`,
  });
}

export async function sendInvoiceEmail(
  email: string,
  name: string,
  invoiceUrl: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> {
  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `Facture SaaS Zero - ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)}`,
    htmlContent: `
      <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-family: 'Syne', sans-serif; font-size: 28px;">Nouvelle facture disponible</h1>
        </div>
        <div style="background: #1a1a26; padding: 32px; border-radius: 0 0 16px 16px; color: #e2e8f0;">
          <p style="font-size: 16px; line-height: 1.6;">Bonjour ${name},</p>
          <p style="font-size: 16px; line-height: 1.6;">Ta facture de <strong>${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)}</strong> est prête.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${invoiceUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Voir la facture</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">Tu peux aussi la retrouver dans ton espace facturation.</p>
        </div>
      </div>
    `,
    textContent: `Bonjour ${name}, ta facture de ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)} est prête : ${invoiceUrl}`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<{ success: boolean; error?: string }> {
  return sendTransactionalEmail({
    to: [{ email }],
    subject: "Réinitialisation de ton mot de passe SaaS Zero",
    htmlContent: `
      <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-family: 'Syne', sans-serif; font-size: 28px;">Réinitialiser ton mot de passe</h1>
        </div>
        <div style="background: #1a1a26; padding: 32px; border-radius: 0 0 16px 16px; color: #e2e8f0;">
          <p style="font-size: 16px; line-height: 1.6;">Tu as demandé la réinitialisation de ton mot de passe.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">Ce lien expire dans 1 heure. Si ce n'est pas toi, ignore cet email.</p>
        </div>
      </div>
    `,
    textContent: `Réinitialise ton mot de passe : ${resetUrl} (expire dans 1h)`,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  inviterName: string,
  organizationName: string,
  invitationUrl: string,
): Promise<{ success: boolean; error?: string }> {
  return sendTransactionalEmail({
    to: [{ email }],
    subject: `${inviterName} t'invite à rejoindre ${organizationName} sur SaaS Zero`,
    htmlContent: `
      <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-family: 'Syne', sans-serif; font-size: 28px;">Invitation d'équipe</h1>
        </div>
        <div style="background: #1a1a26; padding: 32px; border-radius: 0 0 16px 16px; color: #e2e8f0;">
          <p style="font-size: 16px; line-height: 1.6;"><strong>${inviterName}</strong> t'invite à rejoindre l'organisation <strong>${organizationName}</strong> sur SaaS Zero.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${invitationUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">Accepter l'invitation</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">Cette invitation expire dans 7 jours.</p>
        </div>
      </div>
    `,
    textContent: `${inviterName} t'invite à rejoindre ${organizationName} : ${invitationUrl} (expire dans 7 jours)`,
  });
}
