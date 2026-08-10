"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface MotDePasseOublieFormProps {
  locale: string;
  redirectTo: string;
  error?: string | null;
  message?: string | null;
}

export function MotDePasseOublieForm({
  locale,
  redirectTo,
  error,
  message,
}: MotDePasseOublieFormProps) {
  const commonMessages = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(error || "");
  const [successMessage, setSuccessMessage] = useState(message || "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/${locale}/mot-de-passe-oublie/confirmation`,
      },
    );

    if (authError) {
      setFormError(authError.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage(
      "Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.",
    );
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              Mot de passe oublié ?
            </h1>
            <p className="text-muted-foreground mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="redirect" value={redirectTo} />

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                {commonMessages("email")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground disabled:opacity-50"
                placeholder="vous@exemple.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              <Link
                href={`/${locale}/connexion`}
                className="text-primary hover:underline font-medium"
              >
                Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
