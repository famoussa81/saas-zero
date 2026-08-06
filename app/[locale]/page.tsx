import Link from "next/link";
import { Metadata } from "next";
import { getAllPosts, getAllPages } from "@/lib/content";

interface Props {
  params: { locale: string };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Accueil",
    description: "SaaS Zero - Build SaaS Faster",
  };
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-foreground">
            SaaS Zero
          </h1>
          <nav className="flex items-center gap-6">
            <Link
              href="/fr/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/fr/connexion"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/fr/inscription"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-6">
            Build SaaS Faster
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Un starter kit complet avec Next.js 14, Supabase, Stripe, et plus
            encore. Tout ce qu&apos;il faut pour lancer votre SaaS en
            production.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/fr/inscription"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/fr/blog"
              className="border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Voir la documentation
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-display font-bold text-center mb-12">
            Fonctionnalités
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h4 className="text-xl font-bold mb-3">
                Authentification complète
              </h4>
              <p className="text-muted-foreground">
                Supabase Auth avec email/password, OAuth, MFA, magic links. RLS
                activé sur toutes les tables.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h4 className="text-xl font-bold mb-3">Billing Stripe</h4>
              <p className="text-muted-foreground">
                Abonnements, paiements uniques, portail client, webhooks,
                gestion des factures.
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-2xl">
              <h4 className="text-xl font-bold mb-3">Dashboard protégé</h4>
              <p className="text-muted-foreground">
                Interface admin avec paramètres, facturation, équipe, analytics
                en temps réel.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-display font-bold">
              Derniers articles
            </h3>
            <Link href="/fr/blog" className="text-primary hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8" id="latest-posts">
            {/* Posts will be loaded via CMS */}
          </div>
        </section>

        <section className="border-t border-border pt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Prêt à commencer ?</h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Rejoignez des développeurs qui construisent des SaaS plus vite avec
            SaaS Zero.
          </p>
          <Link
            href="/fr/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Créer mon compte
          </Link>
        </section>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <p>
            &copy; 2024 SaaS Zero. Construit avec Next.js 14, Supabase, Stripe.
          </p>
        </div>
      </footer>
    </div>
  );
}
