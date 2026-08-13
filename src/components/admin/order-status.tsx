"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * OrderStatus — faire avancer une commande d'un seul geste.
 *
 * Le réflexe est de poser un menu déroulant avec les sept statuts. Il oblige
 * le commerçant à réfléchir à chaque commande, et il rend possible de sauter
 * une étape ou de revenir en arrière par erreur.
 *
 * Ici, un bouton unique dit l'action suivante — « Marquer comme expédiée » —
 * et les statuts exceptionnels (annulée, remboursée) vivent ailleurs, dans le
 * menu secondaire de la fiche. Le chemin courant ne demande aucune décision.
 *
 * Le libellé est à l'IMPÉRATIF et nomme le résultat. « Suivant » ne dit pas
 * ce qui va se passer, et sur une commande, ce qui va se passer engage le
 * commerçant vis-à-vis de son client.
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Le chemin normal, dans l'ordre. Annulée et remboursée n'en font pas partie. */
const FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

/** Vocabulaire du commerçant, jamais celui de la base. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

/** Ce que le bouton propose de faire, à l'impératif. */
const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Confirmer la commande",
  confirmed: "Mettre en préparation",
  preparing: "Marquer comme expédiée",
  shipped: "Marquer comme livrée",
};

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const i = FLOW.indexOf(current);
  if (i < 0 || i === FLOW.length - 1) return null;
  return FLOW[i + 1];
}

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        // La forme et le texte portent l'état ; la couleur ne fait que
        // renforcer. Un daltonien lit le libellé, qui suffit.
        status === "delivered" &&
          "border-transparent bg-primary/10 text-primary",
        status === "cancelled" || status === "refunded"
          ? "border-transparent bg-muted text-muted-foreground"
          : null,
        status === "pending" && "border-border bg-card text-foreground",
        (status === "confirmed" ||
          status === "preparing" ||
          status === "shipped") &&
          "border-border bg-muted text-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export interface OrderAdvanceButtonProps {
  status: OrderStatus;
  /** Référence lisible, reprise dans la confirmation. Jamais l'UUID. */
  reference: string;
  onAdvance: (next: OrderStatus) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function OrderAdvanceButton({
  status,
  reference,
  onAdvance,
  disabled,
  className,
}: OrderAdvanceButtonProps) {
  const [pending, setPending] = React.useState(false);
  const next = nextStatus(status);
  const label = NEXT_ACTION[status];

  if (!next || !label) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {status === "delivered"
          ? "Commande livrée."
          : `Commande ${STATUS_LABEL[status].toLowerCase()}.`}
      </p>
    );
  }

  async function handle() {
    if (pending || !next) return;
    setPending(true);
    try {
      await onAdvance(next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <button
        type="button"
        onClick={handle}
        disabled={disabled || pending}
        className={cn(
          "inline-flex min-h-[2.75rem] items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors",
          "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {pending ? "Enregistrement…" : label}
      </button>
      {/* La référence sous le bouton : sur un téléphone, le commerçant traite
          plusieurs commandes de suite et doit voir laquelle il fait avancer. */}
      <p className="text-xs text-muted-foreground">
        Commande <span className="font-mono">{reference}</span>
      </p>
    </div>
  );
}
