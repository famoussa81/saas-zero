import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Skeleton — l'espace réservé pendant le chargement.
 *
 * Il n'existait pas : chaque `loading.tsx` réinventait
 * `animate-pulse rounded-md bg-muted` à la main. Deux conséquences.
 *
 * D'abord `animate-pulse` nu ignore `prefers-reduced-motion` — une animation
 * en boucle sur toute la page est précisément ce que ce réglage existe pour
 * supprimer, et certains utilisateurs y réagissent physiquement. La variante
 * `motion-safe:` de Tailwind la supprime pour eux.
 *
 * Ensuite un squelette doit avoir LA FORME DU CONTENU (voir
 * `.claude/design/UI-CONTRACT.md` §3). Trois barres grises identiques à la
 * place d'une grille de cartes trahissent le générateur et provoquent un saut
 * de layout à l'arrivée des données. D'où des formes nommées plutôt qu'un
 * rectangle générique.
 */
const skeletonVariants = cva("bg-muted motion-safe:animate-pulse", {
  variants: {
    shape: {
      /** Bloc quelconque : donner sa taille via className. */
      block: "rounded-md",
      /**
       * Ligne de texte. `h-[1em]` est une valeur arbitraire, que le contrat UI
       * interdit d'ordinaire — exception assumée : `em` est *relatif*, la ligne
       * épouse donc la taille de police du contexte au lieu de la figer. Un
       * `h-4` en dur ferait sauter la mise en page dans un titre.
       */
      text: "h-[1em] rounded",
      /** Avatar, pastille, icône ronde. */
      circle: "rounded-full",
      /** Surface d'un graphique ou d'une image. */
      surface: "rounded-lg",
    },
  },
  defaultVariants: { shape: "block" },
});

export interface SkeletonProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Une forme. Toujours `aria-hidden` : c'est le conteneur `SkeletonGroup` qui
 * annonce le chargement, une seule fois. Sans ça un lecteur d'écran énumère
 * quinze éléments vides.
 */
export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  );
}

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre de lignes. */
  lines?: number;
  /**
   * Largeur de la dernière ligne. Un paragraphe réel ne se termine jamais pile
   * en bout de ligne ; sans ça le bloc ressemble à un tableau, pas à du texte.
   */
  lastLineWidth?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          shape="text"
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
          className={i === lines - 1 ? undefined : "w-full"}
        />
      ))}
    </div>
  );
}

export interface SkeletonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Annonce faite aux lecteurs d'écran pendant le chargement. */
  label?: string;
}

/**
 * Conteneur d'un écran en chargement.
 *
 * Porte `aria-busy` et une annonce unique. `role="status"` avec
 * `aria-live="polite"` fait lire le libellé sans interrompre l'utilisateur.
 */
export function SkeletonGroup({
  label = "Chargement…",
  className,
  children,
  ...props
}: SkeletonGroupProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={className}
      {...props}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/**
 * Squelette d'une carte KPI, aux proportions de la vraie (voir UI-CONTRACT §5 :
 * label discret, valeur dominante, variation).
 */
export function SkeletonKpiCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card p-6", className)}
      {...props}
    >
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-40" />
    </div>
  );
}

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
}

/** Squelette d'une liste : un en-tête plus N lignes de hauteur égale. */
export function SkeletonTable({
  rows = 5,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-border bg-card p-4",
        className,
      )}
      {...props}
    >
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export { skeletonVariants };
