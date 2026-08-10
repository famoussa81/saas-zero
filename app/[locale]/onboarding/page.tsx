"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Check,
  Sparkles,
  ArrowRight,
  Users,
  Settings,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/sonner";

const ONBOARDING_STEPS = [
  { id: "welcome", title: "Bienvenue", icon: Sparkles },
  { id: "profile", title: "Profil", icon: Users },
  { id: "organization", title: "Organisation", icon: Building2 },
  { id: "preferences", title: "Préférences", icon: Settings },
  { id: "complete", title: "C'est parti !", icon: Check },
];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    organization_name: "",
    organization_slug: "",
    role: "owner",
    notifications_email: true,
    notifications_in_app: true,
    theme: "system",
    language: "fr",
  });

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile?.onboarding_completed) {
          router.push("/fr/tableau-de-bord");
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  }, [supabase, router]);

  // Check if onboarding already completed
  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const handleNext = async () => {
    if (currentStep === ONBOARDING_STEPS.length - 2) {
      await completeOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          full_name: formData.full_name,
          onboarding_completed: true,
          theme: formData.theme,
          language: formData.language,
          notifications_email: formData.notifications_email,
          notifications_in_app: formData.notifications_in_app,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Create organization if provided
      if (formData.organization_name) {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: formData.organization_name,
            slug:
              formData.organization_slug ||
              formData.organization_name.toLowerCase().replace(/\s+/g, "-"),
            billing_email: user.email,
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // The creator is auto-added as owner by the
        // handle_organization_created_trigger (20260807000001) — no manual
        // membership insert needed (it would be blocked by RLS: the "add
        // members" policy requires an existing owner/admin membership).

        // Update user profile with organization_id
        await supabase
          .from("user_profiles")
          .update({ organization_id: org.id })
          .eq("id", user.id);
      }

      toast({ title: t("completed"), variant: "success" });
      router.push("/fr/tableau-de-bord");
      router.refresh();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step.id) {
      case "welcome":
        return (
          <div className="text-center space-y-8">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-display">
                {t("welcome.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("welcome.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: "🎯",
                  title: t("welcome.features.1.title"),
                  desc: t("welcome.features.1.desc"),
                },
                {
                  icon: "📊",
                  title: t("welcome.features.2.title"),
                  desc: t("welcome.features.2.desc"),
                },
                {
                  icon: "👥",
                  title: t("welcome.features.3.title"),
                  desc: t("welcome.features.3.desc"),
                },
              ].map((feature, i) => (
                <Card key={i} className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-2">{feature.icon}</div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-display">
              {t("profile.title")}
            </h2>
            <p className="text-muted-foreground">{t("profile.description")}</p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">{t("profile.fullName")}</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder={t("profile.fullNamePlaceholder")}
                  autoComplete="name"
                />
              </div>
            </div>
          </div>
        );

      case "organization":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-display">
              {t("organization.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("organization.description")}
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="organization_name">
                  {t("organization.name")}
                </Label>
                <Input
                  id="organization_name"
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organization_name: e.target.value,
                    })
                  }
                  placeholder={t("organization.namePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="organization_slug">
                  {t("organization.slug")}
                </Label>
                <Input
                  id="organization_slug"
                  value={formData.organization_slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organization_slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    })
                  }
                  placeholder={t("organization.slugPlaceholder")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.slugHelp")}
                </p>
              </div>
            </div>

            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("organization.optional")}
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-display">
              {t("preferences.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("preferences.description")}
            </p>

            <Card>
              <CardHeader>
                <CardTitle>{t("preferences.notifications")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications_email: e.target.checked,
                      })
                    }
                    className="rounded border-input bg-background h-4 w-4"
                  />
                  <span>{t("preferences.emailNotifications")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications_in_app}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications_in_app: e.target.checked,
                      })
                    }
                    className="rounded border-input bg-background h-4 w-4"
                  />
                  <span>{t("preferences.inAppNotifications")}</span>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("preferences.appearance")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("preferences.theme")}</Label>
                  <select
                    value={formData.theme}
                    onChange={(e) =>
                      setFormData({ ...formData, theme: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="system">
                      {t("preferences.themeSystem")}
                    </option>
                    <option value="light">{t("preferences.themeLight")}</option>
                    <option value="dark">{t("preferences.themeDark")}</option>
                  </select>
                </div>
                <div>
                  <Label>{t("preferences.language")}</Label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "complete":
        return (
          <div className="text-center space-y-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-display">
                {t("complete.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("complete.description")}
              </p>
            </div>
            <div className="space-y-4 text-left max-w-md mx-auto">
              {[
                t("complete.ready.1"),
                t("complete.ready.2"),
                t("complete.ready.3"),
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress indicator */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {ONBOARDING_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i < currentStep
                      ? "bg-primary text-white"
                      : i === currentStep
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : typeof s.icon === "function" ? (
                    <s.icon className="w-5 h-5" />
                  ) : (
                    <span>{s.icon}</span>
                  )}
                </div>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-all ${
                      i < currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl border border-border p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep || loading}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            {t("back")}
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading}
            className="gap-2"
            size="lg"
          >
            {isLastStep ? (
              <>
                {t("complete.action")}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                {t("next")}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
