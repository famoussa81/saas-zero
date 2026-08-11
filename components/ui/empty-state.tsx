import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  /**
   * JSX déjà rendu (bouton, lien…), pas une fonction : les props traversant
   * la frontière Server → Client doivent être sérialisables.
   * Voir le skill ns-rsc-boundary.
   */
  action?: ReactNode;
  icon?: ReactNode;
  /**
   * "first-run" : aucune donnée, c'est normal — on accueille et on amorce.
   * "no-results" : un filtre/recherche ne renvoie rien — on offre une sortie.
   * La distinction compte : afficher « Aucune donnée » dans les deux cas
   * transforme un premier usage en constat d'échec.
   */
  variant?: "first-run" | "no-results";
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  variant = "first-run",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center",
        variant === "first-run"
          ? "border border-dashed border-border"
          : "bg-muted/40",
        className,
      )}
      data-testid={`empty-state-${variant}`}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
