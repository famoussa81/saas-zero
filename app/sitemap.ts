import type { MetadataRoute } from "next";
// Le projet expose ses collections via lib/content, jamais directement depuis
// le paquet : c'est là que le filtrage des brouillons et le tri sont définis.
import { getAllPosts, getAllPages } from "@/lib/content";
import { locales, defaultLocale } from "../i18n/request";

/**
 * Sitemap natif Next.js.
 *
 * Le dépôt documentait `next-sitemap` sur 391 lignes de skill — un paquet
 * qui n'a jamais été installé. Résultat : aucun sitemap, aucun robots.txt,
 * et un moteur de recherche qui découvrait le site au hasard des liens.
 *
 * L'App Router génère les deux nativement depuis `app/sitemap.ts` et
 * `app/robots.ts`. Zéro dépendance, et les URL viennent des collections de
 * contenu réelles plutôt que d'une configuration à tenir à jour à la main.
 *
 * Les articles en brouillon (`draft`) sont exclus : les référencer enverrait
 * les moteurs sur des pages qui n'existent pas en production.
 */
function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

/**
 * Chaque URL déclare ses équivalents dans les autres langues. Sans ces
 * alternates, Google traite les versions française et anglaise comme du
 * contenu dupliqué au lieu de servir la bonne selon le visiteur.
 */
function withAlternates(
  path: string,
): MetadataRoute.Sitemap[number]["alternates"] {
  const base = baseUrl();
  return {
    languages: Object.fromEntries(
      locales.map((l: string) => [l, `${base}/${l}${path}`]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const staticPaths = ["", "/blog", "/connexion", "/inscription"];

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}/${defaultLocale}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
    alternates: withAlternates(path),
  }));

  // getAllPosts filtre déjà les brouillons — d'où l'usage du helper plutôt
  // que de la collection brute.
  const [posts, pages] = await Promise.all([getAllPosts(), getAllPages()]);

  for (const post of posts) {
    entries.push({
      url: `${base}/${defaultLocale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly",
      priority: 0.6,
      alternates: withAlternates(`/blog/${post.slug}`),
    });
  }

  for (const page of pages) {
    entries.push({
      url: `${base}/${defaultLocale}/${page.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: withAlternates(`/${page.slug}`),
    });
  }

  return entries;
}
