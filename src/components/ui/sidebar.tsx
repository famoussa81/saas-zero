"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Sidebar — la navigation de l'app protégée.
 *
 * Écrite une fois parce que chaque projet la refaisait en oubliant les mêmes
 * quatre choses :
 *
 *  1. `aria-current="page"` sur l'item actif. Sans lui, un lecteur d'écran ne
 *     dit pas où l'utilisateur se trouve.
 *  2. L'item actif marqué AUTREMENT que par la couleur — un fond et une
 *     graisse. La couleur seule échoue au contraste et aux daltonismes.
 *  3. Le lien d'évitement AVANT la navigation. Sans lui, un utilisateur au
 *     clavier traverse quinze liens à chaque page pour atteindre le contenu.
 *  4. Le repli mobile. Une sidebar fixe sur téléphone mange la moitié de
 *     l'écran ou disparaît sans remplaçant.
 *
 * Les liens sont passés en DONNÉES, pas en JSX : le layout est un Server
 * Component, cette barre est cliente, et seules des valeurs sérialisables
 * traversent la frontière (voir `ns-rsc-boundary`). D'où `href` en chaîne et
 * `icon` en nœud déjà rendu, jamais une fonction composant.
 */
export interface SidebarItem {
  href: string;
  label: string;
  /** Icône DÉJÀ rendue (`<Home className="h-4 w-4" />`), pas un composant. */
  icon?: React.ReactNode;
  /** Pastille de comptage — commandes en attente, invitations… */
  badge?: string | number;
}

export interface SidebarGroup {
  /** Titre de section. Omis, les items sont rendus sans en-tête. */
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  groups: SidebarGroup[];
  /** Chemin courant, fourni par l'appelant (`usePathname()` côté client). */
  currentPath: string;
  /** Marque du produit, en tête de la barre. */
  brand?: React.ReactNode;
  /** Bas de barre : menu utilisateur, sélecteur d'organisation… */
  footer?: React.ReactNode;
  /** Cible du lien d'évitement. */
  mainId?: string;
  className?: string;
}

/**
 * Actif si le chemin correspond exactement, ou s'il s'agit d'un sous-chemin.
 * `/app/commandes` doit rester actif sur `/app/commandes/CMD-1042`, sans que
 * `/app/commandes-archivees` s'allume pour autant — d'où le `/` exigé.
 */
function isActive(currentPath: string, href: string): boolean {
  if (currentPath === href) return true;
  return currentPath.startsWith(href.endsWith("/") ? href : `${href}/`);
}

function SidebarNav({
  groups,
  currentPath,
  onNavigate,
}: {
  groups: SidebarGroup[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-6">
      {groups.map((group, gi) => (
        <div
          key={group.label ?? `groupe-${gi}`}
          className="flex flex-col gap-1"
        >
          {group.label ? (
            <p className="px-3 pb-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(currentPath, item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  // Fond + graisse, jamais la couleur seule.
                  active
                    ? "bg-muted font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.icon ? (
                  <span className="shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge !== "" ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Barre fixe, à partir de `md`. Masquée en dessous : voir `SidebarMobile`. */
export function Sidebar({
  groups,
  currentPath,
  brand,
  footer,
  mainId = "contenu-principal",
  className,
}: SidebarProps) {
  return (
    <>
      {/* Visible uniquement au focus clavier, et placé AVANT la navigation :
          c'est ce qui le rend utile. */}
      <a
        href={`#${mainId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Aller au contenu
      </a>
      <aside
        className={cn(
          "hidden w-64 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 md:flex",
          className,
        )}
      >
        {brand ? <div className="px-3 py-2">{brand}</div> : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav groups={groups} currentPath={currentPath} />
        </div>
        {footer ? (
          <div className="border-t border-border pt-4">{footer}</div>
        ) : null}
      </aside>
    </>
  );
}

/**
 * Repli mobile : même navigation dans un `Sheet`, donc même piège de focus et
 * même fermeture par Échap. Le panneau se ferme à la navigation — sans ça
 * l'utilisateur arrive sur la nouvelle page avec le menu encore ouvert.
 */
export function SidebarMobile({
  groups,
  currentPath,
  brand,
  className,
}: Omit<SidebarProps, "footer" | "mainId">) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("md:hidden", className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Ouvrir la navigation"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          Menu
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{brand ?? "Navigation"}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <SidebarNav
              groups={groups}
              currentPath={currentPath}
              onNavigate={() => setOpen(false)}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
