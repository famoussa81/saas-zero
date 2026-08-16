"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  VariantGrid,
  buildRows,
  type VariantRow,
} from "@/components/admin/variant-grid";
import { PriceInput } from "@/components/admin/price-input";
import { cn } from "@/lib/utils";
import {
  saveProductAction,
  setProductStatusAction,
} from "@/lib/actions/boutique-admin";

/**
 * Formulaire d'article — le plus difficile du back-office.
 *
 * Les déclinaisons y introduisent une complexité que le commerçant n'a pas
 * demandée. Le principe de `ns-boutique-admin` : **commencer simple, ouvrir
 * seulement si nécessaire.**
 *
 * Case décochée, il saisit un nom, un prix, un stock — et c'est fini. Une
 * seule déclinaison est créée en coulisse, avec un code généré. Le mot
 * « variante » n'apparaît jamais.
 *
 * Case cochée, la grille s'ouvre et se GÉNÈRE depuis les tailles et couleurs
 * saisies. On ne demande jamais de créer les combinaisons une par une : douze
 * lignes à remplir à la main font abandonner.
 *
 * Enregistrer crée un BROUILLON. « Mettre en vente » est un geste distinct —
 * sans cette séparation, un article à moitié saisi part en boutique.
 */
export interface ProductFormValues {
  id?: string;
  name: string;
  description: string;
  basePriceCents: number;
  currency: string;
  status: "draft" | "active" | "archived";
  sizes: string[];
  colors: string[];
  rows: VariantRow[];
}

export function ProductForm({ initial }: { initial?: ProductFormValues }) {
  const router = useRouter();

  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? "",
  );
  const [priceCents, setPriceCents] = React.useState<number | null>(
    initial?.basePriceCents ?? null,
  );
  const currency = initial?.currency ?? "XOF";

  // Décliné si l'article a déjà plus d'une combinaison, ou des couleurs.
  const [decline, setDecline] = React.useState(
    (initial?.rows.length ?? 0) > 1 || (initial?.colors.length ?? 0) > 0,
  );
  const [sizes, setSizes] = React.useState<string[]>(initial?.sizes ?? []);
  const [colors, setColors] = React.useState<string[]>(initial?.colors ?? []);
  const [rows, setRows] = React.useState<VariantRow[]>(initial?.rows ?? []);
  const [stockSimple, setStockSimple] = React.useState(
    initial && initial.rows.length === 1 ? initial.rows[0].stock : 0,
  );

  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  // La grille suit les dimensions saisies, en gardant les stocks déjà entrés.
  React.useEffect(() => {
    if (!decline) return;
    setRows((precedent) => buildRows(name || "ART", sizes, colors, precedent));
  }, [decline, name, sizes, colors]);

  async function enregistrer(publier: boolean) {
    setErreur(null);
    setEnCours(true);

    const variantes = decline
      ? rows
      : [
          {
            key: "unique",
            label: "Taille unique",
            sku: "",
            stock: stockSimple,
            priceCents: null,
          },
        ];

    const res = await saveProductAction({
      id: initial?.id,
      name,
      description,
      basePriceCents: priceCents ?? 0,
      currency,
      status: initial?.status ?? "draft",
      variants: variantes.map((v) => ({
        label: v.label,
        sku: v.sku,
        stock: v.stock,
        priceCents: v.priceCents,
      })),
    });

    if (!res.ok) {
      setEnCours(false);
      setErreur(res.error);
      return;
    }

    if (publier) {
      const p = await setProductStatusAction(res.id, "active");
      if (!p.ok) {
        setEnCours(false);
        setErreur(p.error);
        return;
      }
    }

    router.push("/fr/admin/boutique/articles");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enregistrer(false);
      }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-5">
        <Champ label="Nom de l'article" htmlFor="nom">
          <input
            id="nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T-shirt coton bio"
            className={saisie}
          />
        </Champ>

        <PriceInput
          label="Prix"
          currency={currency}
          valueCents={priceCents}
          onValueChange={setPriceCents}
        />

        <Champ label="Description" htmlFor="desc" optionnel>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Coupe droite, coton biologique. Lavable à 30°."
            className={cn(saisie, "min-h-[6rem] py-2")}
          />
        </Champ>
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-6">
        <label className="flex items-center gap-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={decline}
            onChange={(e) => setDecline(e.target.checked)}
            className="h-5 w-5 rounded border-border"
          />
          Cet article existe en plusieurs tailles ou couleurs
        </label>

        {decline ? (
          <VariantGrid
            productName={name || "Article"}
            sizes={sizes}
            colors={colors}
            onSizesChange={setSizes}
            onColorsChange={setColors}
            rows={rows}
            onRowsChange={setRows}
            currency={currency}
          />
        ) : (
          <Champ label="Stock" htmlFor="stock">
            <input
              id="stock"
              inputMode="numeric"
              value={stockSimple}
              onChange={(e) => {
                const n = Number.parseInt(
                  e.target.value.replace(/\D/g, ""),
                  10,
                );
                setStockSimple(Number.isNaN(n) ? 0 : n);
              }}
              className={cn(saisie, "w-32 tabular-nums")}
            />
          </Champ>
        )}
      </div>

      {erreur ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erreur}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={enCours}
          className="inline-flex min-h-[2.75rem] items-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer en brouillon"}
        </button>
        <button
          type="button"
          onClick={() => enregistrer(true)}
          disabled={enCours}
          className="inline-flex min-h-[2.75rem] items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          Mettre en vente
        </button>
      </div>
    </form>
  );
}

const saisie =
  "min-h-[2.75rem] w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Champ({
  label,
  htmlFor,
  optionnel,
  children,
}: {
  label: string;
  htmlFor: string;
  optionnel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {optionnel ? (
          <span className="ml-2 font-normal text-muted-foreground">
            facultatif
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
