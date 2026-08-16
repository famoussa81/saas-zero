"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/components/ui/product-card";
import {
  adjustStockAction,
  archiveProductAction,
} from "@/lib/actions/boutique-admin";
import type { AdminProductRow } from "@/lib/db/admin-queries";
import { cn } from "@/lib/utils";

/**
 * Une ligne d'article dans le back-office.
 *
 * Client Component parce qu'elle édite. Elle ne reçoit que des données
 * sérialisables et deux server actions : la clé service-role reste au
 * serveur. L'importer depuis un composant client ferait entrer cette clé
 * dans le bundle du navigateur.
 *
 * Deux règles de `ns-boutique-admin` sont appliquées ici :
 *
 *  - Le vocabulaire du métier. `active` devient « En vente », `draft`
 *    « Brouillon », `archived` « Retiré de la vente ». Le commerçant ne voit
 *    jamais le mot de la base.
 *  - Retirer de la vente, pas supprimer. La suppression définitive n'est pas
 *    offerte : un article a pu être commandé, et les lignes de commande
 *    doivent rester lisibles.
 */
const LIBELLE_STATUT: Record<string, string> = {
  active: "En vente",
  draft: "Brouillon",
  archived: "Retiré de la vente",
};

export function ArticleRow({ article }: { article: AdminProductRow }) {
  const router = useRouter();
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const stockTotal = article.variants.reduce((s, v) => s + v.available, 0);

  async function retirer() {
    // Le nom dans la confirmation, jamais « Êtes-vous sûr ? » : personne ne
    // lit une boîte qui ne dit pas de quoi elle parle.
    const ok = window.confirm(
      `Retirer « ${article.name} » de la vente ?\n\nIl disparaîtra de la boutique mais restera dans l'historique des commandes.`,
    );
    if (!ok) return;
    setEnCours(true);
    setErreur(null);
    const res = await archiveProductAction(article.id);
    setEnCours(false);
    if (res.ok) router.refresh();
    else setErreur(res.error);
  }

  async function majStock(variantId: string, valeur: string) {
    const n = Number.parseInt(valeur.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return;
    setErreur(null);
    const res = await adjustStockAction(variantId, n);
    if (res.ok) router.refresh();
    else setErreur(res.error);
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-base font-medium text-foreground">
            {article.name}
          </span>
          <span className="text-sm text-muted-foreground">
            {LIBELLE_STATUT[article.status] ?? article.status} ·{" "}
            {formatPrice(article.base_price_cents, article.currency)} ·{" "}
            <span className="tabular-nums">{stockTotal}</span> en stock
          </span>
        </div>
        {article.status !== "archived" ? (
          <button
            type="button"
            onClick={retirer}
            disabled={enCours}
            className="inline-flex min-h-[2.75rem] shrink-0 items-center rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            Retirer de la vente
          </button>
        ) : null}
      </div>

      <ul className="flex flex-col gap-2 border-t border-border pt-3">
        {article.variants.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {v.label}
            </span>
            <label
              htmlFor={`stock-${v.id}`}
              className="shrink-0 text-sm text-muted-foreground"
            >
              Stock
            </label>
            <input
              id={`stock-${v.id}`}
              inputMode="numeric"
              defaultValue={v.available}
              onBlur={(e) => majStock(v.id, e.target.value)}
              className={cn(
                "min-h-[2.75rem] w-20 shrink-0 rounded-md border border-border bg-background px-3 text-sm tabular-nums text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </li>
        ))}
      </ul>

      {erreur ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
    </li>
  );
}
