import { Metadata } from "next";
import { getPageBySlug, getAllPages } from "@/lib/content";
import { MDXContent } from "@/components/MDXContent";
import Link from "next/link";

interface Props {
  params: { locale: string; slug: string[] };
}

export async function generateStaticParams() {
  const pages = await getAllPages();
  const params = [];
  for (const page of pages) {
    params.push({ locale: "fr", slug: page.slug.split("/") });
    params.push({ locale: "en", slug: page.slug.split("/") });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  const slug = params.slug.join("/");
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page non trouvée" };

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      images: page.heroImage ? [{ url: page.heroImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: page.heroImage ? [page.heroImage] : [],
    },
  };
}

export default async function PagePage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug.join("/");
  const page = await getPageBySlug(slug);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Page non trouvée</h1>
          <p className="text-muted-foreground mb-8">
            Cette page n&apos;existe pas ou a &eacute;t&eacute;
            supprim&eacute;e.
          </p>
          <Link href="/fr" className="text-primary hover:underline">
            Retour &agrave; l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
          {page.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">{page.description}</p>
        {page.heroImage && (
          <div className="mt-8 rounded-2xl overflow-hidden">
            <img
              src={page.heroImage}
              alt={page.title}
              className="w-full h-auto"
            />
          </div>
        )}
      </header>

      <div className="prose prose-lg max-w-none">
        <MDXContent source={page.body.raw} />
      </div>
    </article>
  );
}
