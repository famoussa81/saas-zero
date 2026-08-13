"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * VariantPicker — le sélecteur de taille et de couleur.
 *
 * C'est l'écran où l'amateurisme se voit le plus vite sur une boutique, pour
 * une raison précise : le réflexe naturel est de MASQUER les combinaisons en
 * rupture. C'est une faute.
 *
 * Voir « M — épuisé » informe : le client sait que sa taille existe, qu'elle
 * reviendra peut-être, et il peut demander. Faire disparaître M le laisse
 * croire que l'article n'est pas fait pour lui, ou que le site est cassé. Le
 * choix désactivé reste donc affiché, barré et non cliquable.
 *
 * Rendu en groupe de boutons radio ARIA : c'est ce qui fait annoncer « Taille,
 * M, 2 sur 4, sélectionné » au lecteur d'écran. Une grille de <div> avec un
 * onClick n'annonce rien et ne se parcourt pas aux flèches.
 *
 * Le stock affiché vient de la vue `variant_availability` — `quantity moins
 * reserved`. Afficher `quantity` seul promettrait des articles déjà retenus
 * par des paniers en cours de paiement.
 */
export interface VariantOption {
  /** Identifiant de la variante en base. */
  id: string;
  /** Libellé montré au client : « M », « Bleu marine ». */
  label: string;
  /** Réellement vendable : quantity - reserved. */
  available: number;
  /** Seuil en dessous duquel on signale la rareté. */
  lowThreshold?: number;
}

export interface VariantPickerProps {
  /** Nom de la dimension : « Taille », « Couleur ». */
  legend: string;
  options: VariantOption[];
  /** Variante choisie. `null` tant que rien n'est sélectionné. */
  value: string | null;
  onChange: (id: string) => void;
  /** Lien vers le guide des tailles, affiché à côté de la légende. */
  helpHref?: string;
  helpLabel?: string;
  className?: string;
}

export function VariantPicker({
  legend,
  options,
  value,
  onChange,
  helpHref,
  helpLabel = "Guide des tailles",
  className,
}: VariantPickerProps) {
  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <legend className="text-sm font-medium text-foreground">
          {legend}
        </legend>
        {helpHref ? (
          <a
            href={helpHref}
            className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {helpLabel}
          </a>
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label={legend}
        className="flex flex-wrap gap-2"
      >
        {options.map((opt) => {
          const soldOut = opt.available <= 0;
          const low = !soldOut && opt.available <= (opt.lowThreshold ?? 3);
          const selected = value === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={soldOut}
              onClick={() => onChange(opt.id)}
              className={cn(
                "relative min-w-[3rem] rounded-md border px-4 py-2.5 text-sm font-medium transition-colors",
                // 44px de haut : une cible tactile ratée une fois sur trois
                // est pire qu'un menu.
                "min-h-[2.75rem]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-foreground",
                soldOut &&
                  "cursor-not-allowed border-border bg-muted text-muted-foreground hover:border-border",
              )}
            >
              <span className={cn(soldOut && "line-through")}>{opt.label}</span>
              {/* L'état part aussi en texte : la barre oblique et la couleur
                  ne disent rien à un lecteur d'écran. */}
              {soldOut ? <span className="sr-only"> — épuisé</span> : null}
              {low ? (
                <span className="sr-only"> — il en reste {opt.available}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Le compte exact sous la grille, pour la variante choisie seulement :
          l'afficher sur chaque bouton sature la ligne. */}
      <VariantStockLine options={options} value={value} />
    </fieldset>
  );
}

function VariantStockLine({
  options,
  value,
}: {
  options: VariantOption[];
  value: string | null;
}) {
  const opt = options.find((o) => o.id === value);
  if (!opt) return null;

  if (opt.available <= 0) {
    return (
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {opt.label} — épuisé pour l&apos;instant.
      </p>
    );
  }
  if (opt.available <= (opt.lowThreshold ?? 3)) {
    return (
      // aria-live : le compte change quand on change de taille, sans que la
      // page navigue. Sans lui, l'information n'est jamais annoncée.
      <p aria-live="polite" className="text-sm font-medium text-foreground">
        Il en reste <span className="tabular-nums">{opt.available}</span> en{" "}
        {opt.label}.
      </p>
    );
  }
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      En stock en {opt.label}.
    </p>
  );
}
