import Link from "next/link";
import { Metadata } from "next";
import { getAllPosts } from "@/lib/content";
import { Search } from "@/components/ui/Search";

export const metadata: Metadata = {
  title: "Blog",
  description: "Nos derniers articles, guides et actualités.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
          Notre Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Découvrez nos derniers articles, guides et actualités.
        </p>
        <div className="max-w-md mx-auto mt-8 text-left">
          <Search />
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">
            Aucun article pour le moment
          </h2>
          <p className="text-muted-foreground mb-8">
            Revenez bientôt pour de nouveaux contenus.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/fr/blog/${post.slug}`}
              className="group block"
            >
              <article className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                {post.heroImage && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.heroImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      {post.author && <span>· {post.author}</span>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {post.readingTime}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
