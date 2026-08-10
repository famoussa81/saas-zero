"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Save,
  Shield,
  Mail,
  CreditCard,
  Plug,
  Settings as SettingsIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/sonner";

export function AdminSettingsPage() {
  const t = useTranslations("admin.settings");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({
    platformName: "SaaS Zero",
    platformUrl: "https://saas-zero.com",
    supportEmail: "support@saas-zero.com",
    defaultLanguage: "en",
    timezone: "UTC",
  });

  const [security, setSecurity] = useState({
    maintenanceMode: false,
    enableRegistration: true,
    enableEmailVerification: true,
    passwordMinLength: 8,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  });

  const [email, setEmail] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
  });

  const [billing, setBilling] = useState({
    stripePublicKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    enableStripePortal: true,
  });

  const update = <T extends object>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    key: keyof T,
    value: string | boolean,
  ) => setter((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist platform settings (e.g. to a "platform_settings" table or local storage for now)
      localStorage.setItem(
        "admin_platform_settings",
        JSON.stringify({ general, security, email, billing }),
      );
      toast({ title: t("saved"), variant: "success" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full sm:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="general">
            <SettingsIcon className="w-4 h-4 mr-2" />
            {t("general")}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            {t("security")}
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            {t("email")}
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-4 h-4 mr-2" />
            {t("billing")}
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="w-4 h-4 mr-2" />
            {t("integrations")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("general")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platformName">{t("platformName")}</Label>
                <Input
                  id="platformName"
                  value={general.platformName}
                  onChange={(e) =>
                    update(setGeneral, "platformName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformUrl">{t("platformUrl")}</Label>
                <Input
                  id="platformUrl"
                  value={general.platformUrl}
                  onChange={(e) =>
                    update(setGeneral, "platformUrl", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={general.supportEmail}
                  onChange={(e) =>
                    update(setGeneral, "supportEmail", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">{t("defaultLanguage")}</Label>
                <Input
                  id="defaultLanguage"
                  value={general.defaultLanguage}
                  onChange={(e) =>
                    update(setGeneral, "defaultLanguage", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">{t("timezone")}</Label>
                <Input
                  id="timezone"
                  value={general.timezone}
                  onChange={(e) =>
                    update(setGeneral, "timezone", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("security")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>{t("maintenanceMode")}</Label>
                </div>
                <Switch
                  checked={security.maintenanceMode}
                  onCheckedChange={(v) =>
                    update(setSecurity, "maintenanceMode", v)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>{t("enableRegistration")}</Label>
                </div>
                <Switch
                  checked={security.enableRegistration}
                  onCheckedChange={(v) =>
                    update(setSecurity, "enableRegistration", v)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>{t("enableEmailVerification")}</Label>
                </div>
                <Switch
                  checked={security.enableEmailVerification}
                  onCheckedChange={(v) =>
                    update(setSecurity, "enableEmailVerification", v)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">
                  {t("passwordMinLength")}
                </Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={security.passwordMinLength}
                  onChange={(e) =>
                    update(setSecurity, "passwordMinLength", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">{t("sessionTimeout")}</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) =>
                    update(setSecurity, "sessionTimeout", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">
                  {t("maxLoginAttempts")}
                </Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={security.maxLoginAttempts}
                  onChange={(e) =>
                    update(setSecurity, "maxLoginAttempts", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">{t("lockoutDuration")}</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  value={security.lockoutDuration}
                  onChange={(e) =>
                    update(setSecurity, "lockoutDuration", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("email")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">{t("smtpHost")}</Label>
                <Input
                  id="smtpHost"
                  value={email.smtpHost}
                  onChange={(e) => update(setEmail, "smtpHost", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">{t("smtpPort")}</Label>
                <Input
                  id="smtpPort"
                  value={email.smtpPort}
                  onChange={(e) => update(setEmail, "smtpPort", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">{t("smtpUser")}</Label>
                <Input
                  id="smtpUser"
                  value={email.smtpUser}
                  onChange={(e) => update(setEmail, "smtpUser", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">{t("smtpPassword")}</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={email.smtpPassword}
                  onChange={(e) =>
                    update(setEmail, "smtpPassword", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">{t("fromEmail")}</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={email.fromEmail}
                  onChange={(e) =>
                    update(setEmail, "fromEmail", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName">{t("fromName")}</Label>
                <Input
                  id="fromName"
                  value={email.fromName}
                  onChange={(e) => update(setEmail, "fromName", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("billing")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey">{t("stripePublicKey")}</Label>
                <Input
                  id="stripePublicKey"
                  type="password"
                  value={billing.stripePublicKey}
                  onChange={(e) =>
                    update(setBilling, "stripePublicKey", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">{t("stripeSecretKey")}</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  value={billing.stripeSecretKey}
                  onChange={(e) =>
                    update(setBilling, "stripeSecretKey", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeWebhookSecret">
                  {t("stripeWebhookSecret")}
                </Label>
                <Input
                  id="stripeWebhookSecret"
                  type="password"
                  value={billing.stripeWebhookSecret}
                  onChange={(e) =>
                    update(setBilling, "stripeWebhookSecret", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>{t("enableStripePortal")}</Label>
                </div>
                <Switch
                  checked={billing.enableStripePortal}
                  onCheckedChange={(v) =>
                    update(setBilling, "enableStripePortal", v)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("integrations")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Integrations (Brevo, Sentry, analytics, etc.) can be configured
                here in a production build.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
