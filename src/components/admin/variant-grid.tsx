"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceInput } from "@/components/admin/price-input";

/**
 * VariantGrid — la grille de déclinaisons, GÉNÉRÉE et non saisie.
 *
 * C'est le cœur du formulaire produit, et l'endroit où un back-office
 * ordinaire perd le commerçant. Le réflexe est de faire créer les
 * combinaisons une par une : douze formulaires pour un t-shirt en quatre
 * tailles et trois couleurs. Personne ne le fait deux fois.
 *
 * Ici, il saisit ses tailles, ses couleurs, et la grille apparaît. Il ne
 * remplit que le stock.
 *
 * Trois règles qui découlent de `ns-boutique-admin` :
 *
 *  - Le mot « variante » n'apparaît jamais à l'écran. On dit taille, couleur,
 *    déclinaison.
 *  - Le prix par ligne est FACULTATIF. Vide = le prix de l'article, ce qui
 *    est le cas courant ; l'exception est le XL plus cher.
 *  - Le code article est généré et masqué par défaut. Il ne sert qu'à
 *    l'étiquetage et à l'inventaire.
 */
export interface VariantRow {
  /** Clé stable de la combinaison, ex. « M|noir ». */
  key: string;
  /** Ce que voit le commerçant : « M / Noir ». */
  label: string;
  /** Code article généré. */
  sku: string;
  stock: number;
  /** `null` = hérite du prix de l'article. */
  priceCents: number | null;
}

export interface VariantGridProps {
  /** Nom de l'article, sert à générer les codes. */
  productName: string;
  sizes: string[];
  colors: string[];
  onSizesChange: (next: string[]) => void;
  onColorsChange: (next: string[]) => void;
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
  currency?: string;
  className?: string;
}

/** Code article lisible : PRODUIT-TAILLE-COULEUR, sans accent ni espace. */
export function buildSku(productName: string, parts: string[]): string {
  // NFD décompose « É » en « E » + accent combinant ; le filtre [^A-Z0-9] qui
  // suit retire l'accent au même titre que les espaces et la ponctuation. Pas
  // besoin d'une passe dédiée sur la plage des diacritiques — et une classe de
  // caractères combinants écrite en clair dans un fichier source est un piège :
  // ils sont invisibles dans un éditeur.
  const slug = (s: string) =>
    s
      .normalize("NFD")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 6);
  return [slug(productName), ...parts.map(slug)].filter(Boolean).join("-");
}

/**
 * Produit toutes les combinaisons, en PRÉSERVANT le stock et le prix déjà
 * saisis. Ajouter une couleur ne doit pas effacer les stocks des autres.
 */
export function buildRows(
  productName: string,
  sizes: string[],
  colors: string[],
  existing: VariantRow[],
): VariantRow[] {
  const dims: string[][] = [];
  if (sizes.length > 0) dims.push(sizes);
  if (colors.length > 0) dims.push(colors);
  if (dims.length === 0) return [];

  const combos = dims.reduce<string[][]>(
    (acc, dim) => acc.flatMap((prefix) => dim.map((v) => [...prefix, v])),
    [[]],
  );

  const byKey = new Map(existing.map((r) => [r.key, r]));
  return combos.map((parts) => {
    const key = parts.join("|");
    const kept = byKey.get(key);
    return {
      key,
      label: parts.join(" / "),
      sku: buildSku(productName, parts),
      stock: kept?.stock ?? 0,
      priceCents: kept?.priceCents ?? null,
    };
  });
}

function TokenField({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function add() {
    const v = draft.trim();
    if (v === "" || values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-sm text-foreground"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Retirer ${v}`}
              className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Entrée ET virgule : le commerçant tape « S, M, L » d'un trait.
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          aria-label={label}
          className="min-h-[2.75rem] min-w-[8rem] flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

export function VariantGrid({
  productName,
  sizes,
  colors,
  onSizesChange,
  onColorsChange,
  rows,
  onRowsChange,
  currency = "XOF",
  className,
}: VariantGridProps) {
  const [showSkus, setShowSkus] = React.useState(false);

  function update(key: string, patch: Partial<VariantRow>) {
    onRowsChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function setSizes(next: string[]) {
    onSizesChange(next);
    onRowsChange(buildRows(productName, next, colors, rows));
  }
  function setColors(next: string[]) {
    onColorsChange(next);
    onRowsChange(buildRows(productName, sizes, next, rows));
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TokenField
          label="Tailles"
          placeholder="S, M, L…"
          values={sizes}
          onChange={setSizes}
        />
        <TokenField
          label="Couleurs"
          placeholder="Noir, Écru…"
          values={colors}
          onChange={setColors}
        />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Ajoutez au moins une taille ou une couleur : les déclinaisons
          apparaîtront ici automatiquement.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums">{rows.length}</span> déclinaison
              {rows.length > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => setShowSkus((v) => !v)}
              className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showSkus ? "Masquer les codes" : "Voir les codes article"}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_7rem_1fr] sm:items-end"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.label}
                  </p>
                  {showSkus ? (
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {row.sku}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`stock-${row.key}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Stock
                  </label>
                  <input
                    id={`stock-${row.key}`}
                    inputMode="numeric"
                    value={row.stock}
                    onChange={(e) => {
                      const n = Number.parseInt(
                        e.target.value.replace(/\D/g, ""),
                        10,
                      );
                      update(row.key, { stock: Number.isNaN(n) ? 0 : n });
                    }}
                    className="min-h-[2.75rem] w-full rounded-md border border-border bg-card px-3 text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <PriceInput
                  label="Prix (si différent)"
                  hint="Vide = prix de l'article"
                  currency={currency}
                  valueCents={row.priceCents}
                  onValueChange={(c) => update(row.key, { priceCents: c })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
