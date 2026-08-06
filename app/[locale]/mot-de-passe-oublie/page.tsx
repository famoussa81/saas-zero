import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "next-intl/server";
import { MotDePasseOublieForm } from "./MotDePasseOublieForm";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    redirect?: string;
    error?: string;
    message?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const messages = await getMessages({ locale: resolvedParams.locale });
  const authMessages = messages.auth as Record<string, string>;
  return {
    title: authMessages.forgotPassword,
    description: "Réinitialisez votre mot de passe",
  };
}

export default async function MotDePasseOubliePage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    resolvedSearchParams.redirect || `/${resolvedParams.locale}/connexion`;
  const error = resolvedSearchParams.error;
  const message = resolvedSearchParams.message;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <MotDePasseOublieForm
      locale={resolvedParams.locale}
      redirectTo={redirectTo}
      error={error}
      message={message}
    />
  );
}
