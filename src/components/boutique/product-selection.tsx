"use client";

import * as React from "react";
import {
  VariantPicker,
  type VariantOption,
} from "@/components/ui/variant-picker";
import {
  effectivePriceCents,
  type Product,
  type VariantWithStock,
} from "@/lib/db/ecommerce";
import { formatPrice } from "@/components/ui/product-card";
import { cn } from "@/lib/utils";

/**
 * ProductSelection — la partie interactive de la fiche produit.
 *
 * Elle existe pour une raison précise, et c'est la frontière RSC.
 *
 * Le réflexe, quand on a besoin d'un `useState` pour la taille choisie, est
 * d'ajouter `"use client"` en tête de la PAGE. La page importe alors le
 * client Supabase serveur, qui appelle `cookies()` de `next/headers` — et le
 * build casse sur :
 *
 *   You're importing a module that depends on "next/headers"
 *
 * Le motif correct : la page reste serveur et lit la base ; l'interactivité
 * descend dans cet enfant client, qui ne reçoit que des données
 * sérialisables. Voir le skill `ns-rsc-boundary`.
 *
 * Aucune requête ici. Ce composant ne sait pas d'où viennent les données.
 */
export interface ProductSelectionProps {
  product: Product;
  variants: VariantWithStock[];
  /** Lien WhatsApp construit CÔTÉ SERVEUR, après écriture de la commande. */
  orderHref?: string;
  sizeGuideHref?: string;
}

export function ProductSelection({
  product,
  variants,
  orderHref,
  sizeGuideHref,
}: ProductSelectionProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(() => {
    // Présélectionne la première taille RÉELLEMENT disponible : ouvrir la
    // fiche sur une taille épuisée donne une première impression de rupture.
    const first = variants.find((v) => v.available > 0);
    return first ? first.id : null;
  });

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const priceCents = selected
    ? effectivePriceCents(selected, product)
    : Math.min(
        ...variants.map((v) => effectivePriceCents(v, product)),
        product.base_price_cents,
      );

  const options: VariantOption[] = variants.map((v) => ({
    id: v.id,
    label: v.label,
    available: v.available,
  }));

  const allSoldOut = variants.every((v) => v.available <= 0);
  const canOrder = selected !== null && selected.available > 0 && !!orderHref;

  return (
    <div className="flex flex-col gap-6">
      <p
        className="text-2xl font-semibold tabular-nums text-foreground"
        aria-live="polite"
      >
        {formatPrice(priceCents, product.currency)}
        {!selected && variants.length > 1 ? (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            à partir de
          </span>
        ) : null}
      </p>

      <VariantPicker
        legend="Taille"
        options={options}
        value={selectedId}
        onChange={setSelectedId}
        helpHref={sizeGuideHref}
      />

      {allSoldOut ? (
        <p className="rounded-lg border border-border bg-muted p-4 text-sm text-foreground">
          Toutes les tailles sont épuisées pour l&apos;instant. Écrivez-nous
          pour être prévenu du réassort.
        </p>
      ) : (
        <a
          href={canOrder ? orderHref : undefined}
          aria-disabled={!canOrder}
          onClick={(e) => {
            if (!canOrder) e.preventDefault();
          }}
          className={cn(
            "inline-flex min-h-[3rem] items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            canOrder
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {selected ? "Commander sur WhatsApp" : "Choisissez une taille"}
        </a>
      )}
    </div>
  );
}
