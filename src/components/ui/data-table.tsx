"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * DataTable — le tableau que chaque projet réécrivait.
 *
 * Il n'existait pas, donc chaque écran de liste repartait de `<table>` et
 * oubliait à chaque fois les mêmes choses : le tri au clavier, l'annonce du
 * sens du tri, l'état vide, l'état de chargement à la forme du contenu, et
 * l'alignement des nombres.
 *
 * Ce qu'il apporte est **du comportement, pas du style**. L'apparence vient
 * intégralement des tokens du projet ; deux boutiques avec des palettes
 * différentes rendent des tableaux différents. C'est la distinction posée
 * dans `.claude/design/UI-CONTRACT.md` : ce qui est dur et invisible se
 * partage, ce qui est visible reste propre au projet.
 *
 * Le tri est **contrôlé par l'appelant**. La donnée vit côté serveur dans
 * l'App Router : trier en mémoire côté client ne trierait que la page
 * courante, ce qui est faux dès qu'il y a de la pagination. Le composant
 * signale l'intention, le serveur trie.
 */
export interface DataTableColumn<T> {
  /** Clé stable — sert de `key` React et d'identifiant de tri. */
  id: string;
  header: React.ReactNode;
  /** Rendu d'une cellule. Reçoit la ligne entière. */
  cell: (row: T) => React.ReactNode;
  /** Le serveur sait-il trier sur cette colonne ? */
  sortable?: boolean;
  /**
   * Colonne numérique : alignée à droite et en `tabular-nums`. Sans ça les
   * chiffres dansent d'une ligne à l'autre — signature d'un tableau bâclé.
   */
  numeric?: boolean;
  /** Masquée sous `md`. Pour les colonnes secondaires sur mobile. */
  hideBelowMd?: boolean;
  className?: string;
}

export type SortDirection = "asc" | "desc";

export interface DataTableSort {
  columnId: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Identifiant stable d'une ligne. Jamais l'index : il casse au tri. */
  rowKey: (row: T) => string;
  /** Décrit le tableau pour les lecteurs d'écran. Obligatoire. */
  caption: string;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  isLoading?: boolean;
  /** Affiché quand `rows` est vide et qu'on ne charge pas. */
  empty?: React.ReactNode;
  /** Nombre de lignes du squelette. Caler sur la taille de page. */
  skeletonRows?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  onSortChange,
  isLoading = false,
  empty,
  skeletonRows = 5,
  className,
}: DataTableProps<T>) {
  const visible = columns;

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortable || !onSortChange) return;
    const next: SortDirection =
      sort?.columnId === col.id && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ columnId: col.id, direction: next });
  }

  if (isLoading) {
    return (
      <SkeletonGroup
        className={cn("rounded-xl border border-border bg-card p-4", className)}
        label={`Chargement : ${caption}`}
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: skeletonRows }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </SkeletonGroup>
    );
  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    // Le tableau défile dans SON conteneur : le corps de page ne part jamais
    // en défilement horizontal.
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border bg-card",
        className,
      )}
    >
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            {visible.map((col) => {
              const active = sort?.columnId === col.id;
              const Icon = !col.sortable
                ? null
                : !active
                  ? ChevronsUpDown
                  : sort.direction === "asc"
                    ? ArrowUp
                    : ArrowDown;
              return (
                <TableHead
                  key={col.id}
                  // `aria-sort` est ce qui fait annoncer « trié par ordre
                  // croissant » ; une flèche dessinée ne dit rien.
                  aria-sort={
                    !col.sortable
                      ? undefined
                      : active
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                  }
                  className={cn(
                    col.numeric && "text-right",
                    col.hideBelowMd && "hidden md:table-cell",
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    // Un <button> : accessible au clavier par construction,
                    // là où un <th onClick> ne l'est pas.
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors",
                        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        col.numeric && "flex-row-reverse",
                      )}
                    >
                      {col.header}
                      {Icon ? (
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {visible.map((col) => (
                <TableCell
                  key={col.id}
                  className={cn(
                    col.numeric && "text-right tabular-nums",
                    col.hideBelowMd && "hidden md:table-cell",
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
