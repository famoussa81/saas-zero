import { Metadata } from "next";
import { getPostBySlug } from "@/lib/content";
import { MDXComponents } from "@/components/MDXComponents";

interface Props {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  // This will be populated by the catch-all route
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // This is a catch-all for pages not in the content layer
  return {
    title: "Page non trouvée",
    description: "Cette page n&apos;existe pas.",
  };
}

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-muted-foreground/50 mb-4">
          404
        </h1>
        <h1 className="text-4xl font-bold mb-4">Page non trouvée</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Cette page n&apos;existe pas ou a &eacute;t&eacute;
          d&eacute;plac&eacute;e. V&eacute;rifiez l&apos;URL ou revenez &agrave;
          l&apos;accueil.
        </p>
        <a
          href="/fr"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-[0.98]"
        >
          Retour &agrave; l&apos;accueil
        </a>
      </div>
    </div>
  );
}
