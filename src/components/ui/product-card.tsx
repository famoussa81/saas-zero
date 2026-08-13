import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ProductCard — la carte du catalogue.
 *
 * Composant serveur : aucune interactivité, donc aucun `"use client"`. Une
 * grille de cinquante cartes clientes coûte cinquante hydratations pour rien.
 *
 * Trois décisions, toutes prises contre le réflexe naturel :
 *
 *  1. **Le ratio d'image est fixé** (3/4, portrait). Sans ratio déclaré, la
 *     grille saute pendant le chargement des photos — c'est le CLS, et c'est
 *     ce qui fait cliquer à côté sur un téléphone.
 *
 *  2. **Le prix est en unité courante, jamais en centimes.** La conversion se
 *     fait ici, à l'affichage. `Intl.NumberFormat` gère la locale et les
 *     séparateurs de milliers : concaténer à la main produit « 15000F ».
 *
 *  3. **La rupture est signalée sur la carte**, pas découverte sur la fiche.
 *     Un client qui clique, choisit sa taille et apprend seulement là que tout
 *     est épuisé a perdu deux écrans pour rien.
 *
 * L'apparence vient intégralement des tokens. La photo porte la couleur,
 * la carte se tait — c'est la règle d'Apple España reprise dans le
 * UI-CONTRACT.
 */
export interface ProductCardProps {
  href: string;
  name: string;
  /** Prix en CENTIMES entiers, comme en base. Converti à l'affichage. */
  priceCents: number;
  currency?: string;
  locale?: string;
  imageUrl: string;
  /** Décrit le vêtement, pas « image produit ». */
  imageAlt: string;
  /** Deuxième photo, révélée au survol sur écran fin pointeur. */
  hoverImageUrl?: string;
  /** Somme des disponibilités de toutes les variantes. */
  totalAvailable?: number;
  /** « Nouveau », « Série limitée ». Une seule, sinon ça devient du bruit. */
  badge?: string;
  className?: string;
}

export function formatPrice(
  cents: number,
  currency = "XOF",
  locale = "fr-FR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    // XOF n'a pas de sous-unité ; forcer 0 décimale évite « 15 000,00 F ».
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(cents / 100);
}

export function ProductCard({
  href,
  name,
  priceCents,
  currency = "XOF",
  locale = "fr-FR",
  imageUrl,
  imageAlt,
  hoverImageUrl,
  totalAvailable,
  badge,
  className,
}: ProductCardProps) {
  const soldOut = totalAvailable !== undefined && totalAvailable <= 0;

  return (
    <a
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
        {/* <img> et non next/image : les URL viennent de Supabase Storage et
            de sources distantes propres à chaque boutique. next/image exige de
            déclarer chaque domaine dans next.config, ce que le socle ne peut
            pas faire pour des projets qu'il ne connaît pas encore. Un projet
            dont les domaines sont fixés a intérêt à basculer. */}
        <img
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            hoverImageUrl && "group-hover:opacity-0",
            soldOut && "opacity-60",
          )}
        />
        {hoverImageUrl ? (
          // aria-hidden : c'est la même chose sous un autre angle, l'annoncer
          // deux fois n'apporte rien.
          <img
            src={hoverImageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}

        {badge && !soldOut ? (
          <span className="absolute left-3 top-3 rounded-md bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm">
            {badge}
          </span>
        ) : null}

        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background">
            Épuisé
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {name}
        </h3>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatPrice(priceCents, currency, locale)}
        </p>
      </div>
    </a>
  );
}
