import type { MetadataRoute } from "next";

/**
 * robots.txt natif Next.js.
 *
 * Les zones privées sont exclues explicitement. Ce n'est pas une mesure de
 * sécurité — un robots.txt n'empêche personne d'accéder à une URL, il demande
 * seulement aux moteurs bien élevés de ne pas l'indexer. La protection réelle
 * reste le middleware et la RLS.
 *
 * Ce qu'il évite concrètement : voir apparaître dans les résultats de
 * recherche une page de facturation ou un tableau de bord vide, ce qui est
 * mauvais pour l'image et inutile pour le référencement.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/fr/admin/", "/en/admin/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
