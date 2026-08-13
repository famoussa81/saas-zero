"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PriceInput — saisir un prix en francs, stocker des centimes.
 *
 * La base stocke des centimes entiers (voir le schéma ecommerce, décision 1).
 * Le commerçant, lui, pense en francs. Un champ qui demande `1500000` pour
 * 15 000 F est une faute d'interface, pas une contrainte technique.
 *
 * Toute la difficulté tient dans la conversion, et elle est piégeuse :
 *
 *  - `parseFloat("15000") * 100` donne parfois 1499999.9999999998. On ne
 *    multiplie donc JAMAIS un flottant. On travaille sur la chaîne, on sépare
 *    la partie entière de la partie décimale, et on recompose en entier.
 *  - Le commerçant tape « 15 000 », « 15.000 » ou « 15,000 » selon son
 *    clavier et son habitude. Les trois veulent dire quinze mille.
 *  - XOF n'a pas de sous-unité : afficher « 15 000,00 F » est faux, et laisser
 *    saisir des centimes invite à une erreur d'un facteur 100.
 */

/** Devises sans sous-unité — la saisie décimale y est refusée. */
const ZERO_DECIMAL = new Set(["XOF", "XAF", "JPY", "KRW", "CLP", "VND"]);

export function decimalsFor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Convertit une saisie humaine en centimes entiers.
 * Retourne `null` si la saisie n'est pas un montant exploitable.
 *
 * Volontairement tolérante à l'entrée, stricte à la sortie : « 15 000 »,
 * « 15.000 » et « 15,000 » donnent tous 1500000 en XOF.
 */
export function parseAmountToCents(
  raw: string,
  currency = "XOF",
): number | null {
  const decimals = decimalsFor(currency);
  const cleaned = raw.trim().replace(/\s| /g, "");
  if (cleaned === "") return null;

  let intPart = cleaned;
  let fracPart = "";

  if (decimals > 0) {
    // Le DERNIER séparateur est le décimal ; les précédents sont des
    // séparateurs de milliers. « 1.234,56 » et « 1,234.56 » marchent tous deux.
    const lastSep = Math.max(
      cleaned.lastIndexOf(","),
      cleaned.lastIndexOf("."),
    );
    const tail = lastSep >= 0 ? cleaned.slice(lastSep + 1) : "";
    // Un groupe de 3 chiffres après le séparateur est un millier, pas des
    // centimes : « 15.000 » vaut quinze mille, jamais quinze et zéro centime.
    if (lastSep >= 0 && tail.length > 0 && tail.length <= decimals) {
      intPart = cleaned.slice(0, lastSep);
      fracPart = tail;
    }
  }

  const digitsInt = intPart.replace(/[.,]/g, "");
  if (!/^\d*$/.test(digitsInt) || !/^\d*$/.test(fracPart)) return null;
  if (digitsInt === "" && fracPart === "") return null;

  const units = digitsInt === "" ? 0 : Number.parseInt(digitsInt, 10);
  const frac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  const sub = frac === "" ? 0 : Number.parseInt(frac, 10);

  return units * 10 ** decimals + sub;
}

/** Centimes entiers vers une chaîne saisissable (sans symbole de devise). */
export function centsToInput(cents: number, currency = "XOF"): string {
  const decimals = decimalsFor(currency);
  if (decimals === 0) return String(Math.round(cents));
  const units = Math.floor(cents / 10 ** decimals);
  const sub = cents % 10 ** decimals;
  return `${units},${String(sub).padStart(decimals, "0")}`;
}

export interface PriceInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> {
  /** Valeur en CENTIMES. `null` = champ vide. */
  valueCents: number | null;
  onValueChange: (cents: number | null) => void;
  currency?: string;
  label: string;
  /** Message d'erreur, lié au champ par aria-describedby. */
  error?: string;
  hint?: string;
}

export function PriceInput({
  valueCents,
  onValueChange,
  currency = "XOF",
  label,
  error,
  hint,
  id,
  className,
  ...props
}: PriceInputProps) {
  const generated = React.useId();
  const inputId = id ?? generated;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  // On garde la frappe brute en état local : réécrire le champ à chaque
  // touche empêcherait de taper « 15 0 » puis « 15 00 ».
  const [raw, setRaw] = React.useState(() =>
    valueCents === null ? "" : centsToInput(valueCents, currency),
  );

  React.useEffect(() => {
    const asCents = parseAmountToCents(raw, currency);
    if (asCents !== valueCents) {
      setRaw(valueCents === null ? "" : centsToInput(valueCents, currency));
    }
    // Ne resynchronise que sur un changement venu du PARENT.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueCents, currency]);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setRaw(next);
    onValueChange(
      next.trim() === "" ? null : parseAmountToCents(next, currency),
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-stretch">
        <input
          {...props}
          id={inputId}
          // `inputMode` fait apparaître le pavé numérique sur téléphone sans
          // les contraintes de type="number" (molette, flèches, locale).
          inputMode={decimalsFor(currency) === 0 ? "numeric" : "decimal"}
          value={raw}
          onChange={handle}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint ? hintId : null, error ? errorId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={cn(
            "min-h-[2.75rem] w-full rounded-l-md border border-r-0 border-border bg-card px-3 text-sm tabular-nums text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error && "border-destructive",
            className,
          )}
        />
        <span className="inline-flex select-none items-center rounded-r-md border border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
          {currency === "XOF" ? "F" : currency}
        </span>
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
