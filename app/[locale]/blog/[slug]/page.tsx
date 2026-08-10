import { Metadata } from "next";
import { getPostBySlug, getAllPosts } from "@/lib/content";
import { MDXContent } from "@/components/MDXContent";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const params = [];
  for (const post of posts) {
    params.push({ locale: "fr", slug: post.slug });
    params.push({ locale: "en", slug: post.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Article non trouvé" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: post.heroImage ? [{ url: post.heroImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.heroImage ? [post.heroImage] : [],
    },
    other: {
      "article:published_time": post.date,
      "article:author": post.author || "",
      "article:tag": post.tags?.join(",") || "",
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article non trouvé</h1>
          <p className="text-muted-foreground mb-8">
            Cet article n&apos;existe pas ou a &eacute;t&eacute;
            supprim&eacute;.
          </p>
          <a href="/fr/blog" className="text-primary hover:underline">
            Retour au blog
          </a>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
          {post.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">{post.description}</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          {post.author && <span>par {post.author}</span>}
          <span>{post.readingTime}</span>
        </div>
        {post.heroImage && (
          <div className="mt-8 rounded-2xl overflow-hidden">
            <img
              src={post.heroImage}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}
      </header>

      <div className="prose prose-lg max-w-none">
        <MDXContent source={post.body.raw} />
      </div>

      <footer className="mt-16 pt-8 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Partager cet article
            </p>
            <div className="flex gap-2 mt-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25h8.084l3.476 4.687L21.592 3.53 15.832 1.786l-.99 7.525 4.95-1.754-2.25 2.25-1.68-.847L3.576 12.52l7.436 5.23-.48 7.042h4.193l-6.14-5.515 2.28-4.54h2.77l-2.487 7.268 3.311.976.798-7.87H23.97l-7.944-5.06 3.115-7.327-7.56-2.754L11.62 2.25z" />
                </svg>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors ml-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.64-1.22 2.2-2.555 4.54-2.555 4.852 0 5.726 3.193 5.726 7.355V20.452zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.141-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.642v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </article>
  );
}
