import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import {
  OrganizationJsonLd,
  WebsiteJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/ui/JsonLd";

/**
 * Page d'accueil du SOCLE — volontairement minimale.
 *
 * Elle contenait auparavant la landing qui vendait saas-zero lui-même :
 * 445 lignes, un hero animé, une grille de six features, une timeline de
 * pipeline et une grille tarifaire. Or `pnpm ns:new` copie le dépôt entier,
 * si bien que chaque projet client héritait de la page marketing d'un autre
 * produit, avec ses arguments et ses chiffres.
 *
 * Ce qui reste ici est une page de départ honnête : la coquille (métadonnées,
 * JSON-LD, en-tête, pied de page) que tout projet garde, et un contenu qui dit
 * ce qu'il est — un point de départ à remplacer, pas une démo à imiter.
 *
 * Pour construire la vraie page : `/ns-design`, skills `ns-landing` et
 * `ns-sections`, puis `ns-antislop` avant de livrer.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Accueil",
    description:
      "Point de départ du projet. Remplacez cette page par la landing issue de votre Discovery.",
  };
}

const nextSteps = [
  {
    command: "/ns-discovery",
    label: "Décider le produit",
    detail:
      "Interview guidée : problème, personas, message, preuve, architecture. Produit SPEC.md et DESIGN-CHOICE.md.",
  },
  {
    command: "/ns-design",
    label: "Décider l'identité",
    detail:
      "Direction artistique distincte, tokens, sections de la landing, palier de motion.",
  },
  {
    command: "/ns-build",
    label: "Construire le domaine",
    detail:
      "Server actions, RLS, états non nominaux. La logique propre au produit.",
  },
  {
    command: "pnpm gates:all",
    label: "Vérifier",
    detail:
      "18 gates déterministes. Un prérequis absent donne un SKIP explicite, jamais un faux succès.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <SoftwareApplicationJsonLd />

      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/fr"
            className="font-display text-lg font-bold focus-visible-ring rounded-md"
          >
            Nouveau projet
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/fr/blog"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible-ring rounded-md px-1"
            >
              Blog
            </Link>
            <Link
              href="/fr/connexion"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible-ring rounded-md px-1"
            >
              Connexion
            </Link>
            <Link
              href="/fr/inscription"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible-ring"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="section">
          <div className="container">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-primary">
                  Socle
                </span>
                <span aria-hidden="true" className="h-px w-16 bg-border" />
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                Le projet est en place. Le produit reste à décider.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Cette page est un point de départ, pas une démonstration.
                L&apos;authentification, le tableau de bord, l&apos;espace
                d&apos;administration, les primitives d&apos;interface et les
                migrations sont déjà là. Ce qui manque, c&apos;est votre
                produit.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/fr/inscription"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible-ring"
                >
                  Essayer le parcours d&apos;inscription
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/fr/blog"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:bg-muted focus-visible-ring"
                >
                  Voir le blog
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-muted/30">
          <div className="container">
            <div className="mb-10 max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Les quatre commandes qui suivent
              </h2>
              <p className="mt-3 text-muted-foreground">
                Dans cet ordre. Chacune produit des fichiers que la suivante
                lit.
              </p>
            </div>
            <ol className="grid gap-4 md:grid-cols-2">
              {nextSteps.map((step, index) => (
                <li
                  key={step.command}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <code className="font-mono text-sm font-semibold text-primary">
                      {step.command}
                    </code>
                  </div>
                  <h3 className="mt-3 font-display font-bold">{step.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="container text-sm text-muted-foreground">
          <p>
            Remplacez cet en-tête, cette page et ce pied de page par les vôtres.
            Aucun chiffre ni témoignage n&apos;est affiché ici : il n&apos;y a
            rien à prouver tant que le produit n&apos;existe pas (
            <code className="font-mono text-xs">ns-antislop</code> H-1 à H-3).
          </p>
        </div>
      </footer>
    </div>
  );
}
