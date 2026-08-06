import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "next-intl/server";
import { InscriptionForm } from "./InscriptionForm";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const messages = await getMessages({ locale: resolvedParams.locale });
  const authMessages = messages.auth as Record<string, string>;
  return {
    title: authMessages.signUp,
    description: "Créez votre compte",
  };
}

export default async function InscriptionPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    resolvedSearchParams.redirect ||
    `/${resolvedParams.locale}/tableau-de-bord`;
  const error = resolvedSearchParams.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <InscriptionForm
      locale={resolvedParams.locale}
      redirectTo={redirectTo}
      error={error}
    />
  );
}
