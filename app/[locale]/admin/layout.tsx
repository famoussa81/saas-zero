"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Users,
  CreditCard,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/sonner";

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  organization_id?: string;
  organization_name?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
}

const roleColors: Record<string, { bg: string; text: string }> = {
  owner: { bg: "bg-purple-100", text: "text-purple-700" },
  admin: { bg: "bg-blue-100", text: "text-blue-700" },
  member: { bg: "bg-green-100", text: "text-green-700" },
  viewer: { bg: "bg-gray-100", text: "text-gray-700" },
  user: { bg: "bg-gray-100", text: "text-gray-700" },
  premium: { bg: "bg-amber-100", text: "text-amber-700" },
};

const navItems = [
  { id: "users", label: "Utilisateurs", icon: Users, href: "/admin/users" },
  {
    id: "subscriptions",
    label: "Abonnements",
    icon: CreditCard,
    href: "/admin/subscriptions",
  },
  {
    id: "organizations",
    label: "Organisations",
    icon: Building2,
    href: "/admin/organizations",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/connexion`);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
        toast({ title: t("accessDenied"), variant: "destructive" });
        router.push(`/${locale}/tableau-de-bord`);
        return;
      }

      setCurrentUser({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || undefined,
        avatar_url: user.user_metadata?.avatar_url || undefined,
        role: profile.role,
        status: "active",
        created_at: user.created_at,
      });
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push(`/${locale}/connexion`);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, toast, t, locale]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link
              href={`/${locale}/admin`}
              className="font-display font-bold text-xl text-foreground"
            >
              <span className="gradient-text">SaaS</span> Zero Admin
            </Link>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`/${locale}${item.href}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={currentUser.avatar_url || undefined}
                  alt={currentUser.email}
                />
                <AvatarFallback>
                  {currentUser.full_name?.charAt(0).toUpperCase() ||
                    currentUser.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentUser.full_name || currentUser.email}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {roleColors[currentUser.role] ? (
                    <span
                      className={`${roleColors[currentUser.role].bg} ${roleColors[currentUser.role].text}`}
                    >
                      {currentUser.role}
                    </span>
                  ) : (
                    currentUser.role
                  )}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-3 py-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t("account")}</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/reglages`}
                    className="flex items-center gap-2 w-full"
                  >
                    <Settings className="w-4 h-4" />
                    {t("settingsLabel")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/tableau-de-bord`}
                    className="flex items-center gap-2 w-full"
                  >
                    <Activity className="w-4 h-4" />
                    {t("dashboard")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push(`/${locale}/connexion`);
                    router.refresh();
                  }}
                  className="text-red-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  className="w-64 pl-10 pr-4 py-2 text-sm bg-muted/50 border-border"
                />
              </div>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Filter className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
