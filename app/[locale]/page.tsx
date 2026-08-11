import Link from "next/link";
import { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
} from "lucide-react";
import Script from "next/script";
import {
  OrganizationJsonLd,
  WebsiteJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/ui/JsonLd";
import { PipelineHero } from "@/components/marketing/PipelineHero";
import { PipelineTimeline } from "@/components/marketing/PipelineTimeline";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Accueil",
    description: "SaaS Zero - Build SaaS Faster",
  };
}

const features = [
  {
    icon: Shield,
    title: "Authentification complète",
    description:
      "Supabase Auth avec email/password, OAuth, MFA, magic links. RLS activé sur toutes les tables.",
    benefit: "Sécurité enterprise dès le jour 1",
  },
  {
    icon: Zap,
    title: "Billing Stripe natif",
    description:
      "Abonnements, paiements uniques, portail client, webhooks, gestion des factures.",
    benefit: "Monétisation prête en minutes",
  },
  {
    icon: BarChart3,
    title: "Dashboard temps réel",
    description:
      "Interface admin avec paramètres, facturation, équipe, analytics en temps réel.",
    benefit: "Visibilité totale sur votre business",
  },
  {
    icon: Users,
    title: "Gestion d'équipe B2B",
    description:
      "Organisations, invitations, rôles, permissions granulaires, audit logs.",
    benefit: "Collaboration sans friction",
  },
  {
    icon: Globe,
    title: "i18n & SEO optimisés",
    description:
      "Next-intl, sitemap, JSON-LD, Open Graph, Pagefind search, performance 90+.",
    benefit: "Visibilité mondiale automatique",
  },
  {
    icon: Check,
    title: "Quality gates intégrés",
    description:
      "14 gates déterministes : typecheck, lint, tests, a11y, visual regression, perf, design.",
    benefit: "Confiance totale à chaque deploy",
  },
];

const socialProof = [
  { metric: "14", label: "Quality Gates" },
  { metric: "6", label: "Agents parallèles" },
  { metric: "100%", label: "TypeScript strict" },
  { metric: "0", label: "Dettes techniques" },
];

const pipelineSteps = [
  {
    phase: 1,
    title: "Discovery",
    desc: "Clarification B2B/B2C, design system, motion tier. Génère SPEC + ARCHITECTURE + DESIGN",
    duration: "15-30 min",
    icon: "🔍",
  },
  {
    phase: 2,
    title: "Scaffold",
    desc: "Structure repo, deps, Supabase, Cloudflare, env, types. Agents core + auth en parallèle",
    duration: "5-10 min",
    icon: "🏗️",
  },
  {
    phase: 3,
    title: "Design",
    desc: "Design system complet, composants, Storybook, baselines visuels",
    duration: "15-30 min",
    icon: "🎨",
  },
  {
    phase: 4,
    title: "Build",
    desc: "6 agents parallèles : core, auth, billing, CMS, forms, search",
    duration: "30-60 min",
    icon: "⚙️",
  },
  {
    phase: 5,
    title: "Verify",
    desc: "14 gates déterministes : typecheck, lint, test, e2e, visual, lighthouse, CWV, RLS, security, a11y, contracts, design",
    duration: "10-20 min",
    icon: "✅",
  },
  {
    phase: 6,
    title: "Deploy",
    desc: "Migrations Supabase, Vercel, webhooks Stripe/Brevo, smoke tests",
    duration: "5 min",
    icon: "🚀",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <SoftwareApplicationJsonLd />

      {/* Signature animated orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="signature-orb signature-orb-1" />
        <div className="signature-orb signature-orb-2" />
        <div className="signature-orb signature-orb-3" />
      </div>

      <header className="relative z-10 border-b border-border/50 glass sticky top-0">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <Link
            href="/fr"
            className="font-display font-bold text-xl md:text-2xl text-foreground flex items-center gap-2"
          >
            <span className="gradient-text">SaaS</span> Zero
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/fr/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/fr/connexion"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/fr/inscription"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all hover-lift active-scale focus-visible-ring"
            >
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10">
        {/* Hero Section */}
        <section
          className="section relative pt-28 md:pt-36"
          data-testid="landing-hero"
        >
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
              <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                <div className="scroll-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/50 mb-8">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Nouveau : Pipeline SaaS complète en 2h
                  </span>
                </div>

                <h1 className="scroll-reveal font-display font-bold tracking-tight text-5xl md:text-6xl lg:text-7xl text-foreground mb-8 leading-[1.1]">
                  Build <span className="gradient-text">SaaS</span> Faster
                </h1>

                <p className="scroll-reveal scroll-reveal-delay-1 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-12 leading-relaxed">
                  La pipeline{" "}
                  <span className="font-medium text-foreground">/ns-ship</span>{" "}
                  g&eacute;n&egrave;re un SaaS production-ready avec auth,
                  billing, dashboard, équipe et API keys — en une seule
                  commande.
                </p>

                <div className="scroll-reveal scroll-reveal-delay-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-16">
                  <Link
                    href="/fr/inscription"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-semibold hover:bg-primary/90 transition-all hover-lift active-scale focus-visible-ring"
                  >
                    Commencer gratuitement
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/fr/blog"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-border text-foreground rounded-full text-lg font-semibold hover:bg-muted transition-all hover-lift active-scale focus-visible-ring"
                  >
                    Voir la documentation
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="scroll-reveal scroll-reveal-delay-3 flex flex-wrap items-center justify-center lg:justify-start gap-8 md:gap-12 text-center lg:text-left">
                  {socialProof.map((item, i) => (
                    <div
                      key={item.label}
                      className={`scroll-reveal-delay-${i + 4}`}
                    >
                      <div className="font-display font-bold text-3xl md:text-4xl text-foreground gradient-text">
                        {item.metric}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="scroll-reveal scroll-reveal-delay-2">
                <PipelineHero />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section relative" data-testid="landing-features">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="scroll-reveal inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
                Fonctionnalités clés
              </span>
              <h2 className="scroll-reveal scroll-reveal-delay-1 font-display font-bold tracking-tight text-4xl md:text-5xl text-foreground mb-4">
                Tout ce qu&apos;il faut pour{" "}
                <span className="gradient-text">lancer</span> et{" "}
                <span className="gradient-text">scaler</span>
              </h2>
              <p className="scroll-reveal scroll-reveal-delay-2 text-lg text-muted-foreground">
                Pas de boilerplate, pas de configuration. Juste du code qui
                marche.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="scroll-reveal scroll-reveal-delay-{index + 1} group relative p-6 md:p-8 bg-card/50 border border-border/50 rounded-2xl hover-lift glass transition-all duration-300 hover:border-primary/20"
                  data-testid={`feature-${index}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{feature.benefit}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline Section */}
        <section
          className="section relative bg-muted/30"
          data-testid="landing-pipeline"
        >
          <div className="container">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="scroll-reveal inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
                La pipeline /ns-ship
              </span>
              <h2 className="scroll-reveal scroll-reveal-delay-1 font-display font-bold tracking-tight text-4xl md:text-5xl text-foreground mb-4">
                De l&apos;id&eacute;e au SaaS d&eacute;ploy&eacute;{" "}
                <span className="gradient-text">en 6 phases</span>
              </h2>
              <p className="scroll-reveal scroll-reveal-delay-2 text-lg text-muted-foreground">
                Zéro décision humaine après le lancement. Gates déterministes,
                agents parallèles.
              </p>
            </div>

            <PipelineTimeline steps={pipelineSteps} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="section relative" data-testid="landing-cta">
          <div className="container">
            <div className="relative rounded-3xl overflow-hidden glass-dark p-8 md:p-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="scroll-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  Prêt à commencer ?
                </div>
                <h2 className="scroll-reveal scroll-reveal-delay-1 font-display font-bold tracking-tight text-4xl md:text-5xl text-foreground mb-6">
                  Lancez votre SaaS{" "}
                  <span className="gradient-text">aujourd&apos;hui</span>
                </h2>
                <p className="scroll-reveal scroll-reveal-delay-2 text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Rejoignez des d&eacute;veloppeurs qui construisent des SaaS
                  plus vite avec SaaS Zero. Une commande. Production en 2h.
                </p>
                <div className="scroll-reveal scroll-reveal-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/fr/inscription"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-semibold hover:bg-primary/90 transition-all hover-lift active-scale focus-visible-ring"
                  >
                    Créer mon compte
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/fr/blog"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-border text-foreground rounded-full text-lg font-semibold hover:bg-muted transition-all hover-lift active-scale focus-visible-ring"
                  >
                    Voir la doc
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="container text-center">
          <Link
            href="/fr"
            className="font-display font-bold text-xl text-foreground mb-4 inline-block"
          >
            <span className="gradient-text">SaaS</span> Zero
          </Link>
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} SaaS Zero. Construit avec Next.js
            14, Supabase, Stripe, Vercel.
          </p>
        </div>
      </footer>

      {/* Scroll reveal observer */}
      <Script
        id="scroll-reveal-observer"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('visible'));
                return;
              }
              const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                  }
                });
              }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
              document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
            })();
          `,
        }}
      />
    </div>
  );
}
