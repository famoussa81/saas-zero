import Link from "next/link";
import { cn } from "@/lib/utils";

// Layout de l'app protégée (TaskFlow). Sidebar + header.
// Les routes : tableau-de-bord, projets, equipe, facturation, reglages.

const NAV = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/projets", label: "Projets" },
  { href: "/equipe", label: "Équipe" },
  { href: "/facturation", label: "Facturation" },
  { href: "/reglages", label: "Réglages" },
] as const;

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AppLayout({ children, params }: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "fr";

  const hrefFor = (path: string) => `/${locale}${path}`;

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/40 p-4 md:block">
        <div className="mb-6 px-2 text-lg font-semibold">TaskFlow</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={hrefFor(item.href)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Header mobile simple */}
        <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <span className="font-semibold">TaskFlow</span>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
