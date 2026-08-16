import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductDetail,
  ProductImage,
  ProductListItem,
  ProductVariant,
  VariantAvailability,
  VariantWithStock,
} from "@/lib/db/ecommerce";
import { effectivePriceCents } from "@/lib/db/ecommerce";

/**
 * Requêtes du catalogue — SERVEUR uniquement.
 *
 * Elles vivent ici plutôt que dans les pages pour trois raisons :
 *
 *  1. Les pages restent des Server Components minces. Mélanger requête et
 *     rendu pousse à ajouter `"use client"` dès qu'un `useState` apparaît, ce
 *     qui casse le build sur `next/headers`.
 *  2. Le typage est fait UNE fois. Les pages ne manipulent plus de `any` —
 *     interdit par CLAUDE.md, et particulièrement dangereux sur un domaine où
 *     circulent des prix et des stocks.
 *  3. La disponibilité vient toujours de la vue `variant_availability`
 *     (`quantity - reserved`). Lire `inventory.quantity` promettrait des
 *     articles déjà retenus par des paniers en cours.
 *
 * La clé anon suffit : les policies RLS n'exposent que le catalogue actif.
 */

/** Rangée de jointure telle que PostgREST la renvoie pour le catalogue. */
interface CatalogRow extends Product {
  product_variants: Pick<ProductVariant, "id" | "price_cents" | "is_active">[];
  product_images: Pick<ProductImage, "url" | "alt" | "position">[];
}

export interface CatalogFilters {
  /** Slug de catégorie. Absent = tout le catalogue. */
  category?: string;
  /** Recherche sur le nom. */
  q?: string;
}

export async function listProducts(
  filters: CatalogFilters = {},
): Promise<ProductListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "*, product_variants(id, price_cents, is_active), product_images(url, alt, position)",
    )
    // Redondant avec la policy RLS, et volontairement : si la policy change,
    // la vitrine ne se met pas à exposer les brouillons en silence.
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters.q) query = query.ilike("name", `%${filters.q}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Catalogue indisponible : ${error.message}`);

  const rows = (data ?? []) as CatalogRow[];
  if (rows.length === 0) return [];

  // Une seule requête pour toutes les disponibilités, plutôt qu'une par
  // produit : la grille en afficherait vingt, et vingt allers-retours se
  // voient sur une connexion mobile.
  const variantIds = rows.flatMap((p) =>
    p.product_variants.filter((v) => v.is_active).map((v) => v.id),
  );
  const stockByVariant = await availabilityFor(variantIds);

  return rows.map((p) => {
    const actives = p.product_variants.filter((v) => v.is_active);
    const prices = actives.map((v) => effectivePriceCents(v, p));
    const images = [...p.product_images].sort(
      (a, b) => a.position - b.position,
    );
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      from_price_cents: prices.length
        ? Math.min(...prices)
        : p.base_price_cents,
      currency: p.currency,
      image_url: images[0]?.url ?? null,
      image_alt: images[0]?.alt ?? p.name,
      total_available: actives.reduce(
        (sum, v) => sum + (stockByVariant.get(v.id)?.available ?? 0),
        0,
      ),
    };
  });
}

/** Rangée de jointure pour la fiche produit. */
interface DetailRow extends Product {
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*), product_images(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(`Produit indisponible : ${error.message}`);
  if (!data) return null;

  const row = data as DetailRow;
  const actives = row.product_variants
    .filter((v) => v.is_active)
    .sort((a, b) => a.position - b.position);

  const stock = await availabilityFor(actives.map((v) => v.id));

  const variants: VariantWithStock[] = actives.map((v) => ({
    ...v,
    available: stock.get(v.id)?.available ?? 0,
    is_low: stock.get(v.id)?.is_low ?? false,
  }));

  return {
    ...row,
    variants,
    images: [...row.product_images].sort((a, b) => a.position - b.position),
  };
}

/** Disponibilités depuis la vue, indexées par variante. */
async function availabilityFor(
  variantIds: string[],
): Promise<Map<string, VariantAvailability>> {
  if (variantIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("variant_availability")
    .select("*")
    .in("variant_id", variantIds);

  // Une disponibilité manquante ne doit pas faire tomber la page : on
  // dégrade en « épuisé », ce qui est le côté prudent de l'erreur.
  if (error) return new Map();

  return new Map(
    ((data ?? []) as VariantAvailability[]).map((v) => [v.variant_id, v]),
  );
}
