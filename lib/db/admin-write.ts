import { createClient } from "@supabase/supabase-js";
import { requireShopAdmin } from "@/lib/db/admin-queries";
import type { ProductStatus } from "@/lib/db/ecommerce";

/**
 * Écritures du catalogue — SERVEUR uniquement, via service-role.
 *
 * Séparé de `admin-queries.ts` pour une raison de relecture : ce fichier
 * CRÉE et MODIFIE. Toute revue de sécurité commence ici, et chaque fonction
 * doit ouvrir par `requireShopAdmin()`. Le regroupement rend l'oubli visible.
 *
 * Ne jamais importer depuis un Client Component : la clé service-role
 * entrerait dans le bundle du navigateur.
 */

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY absente : le back-office ne peut pas écrire.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Une déclinaison telle que le formulaire la produit. */
export interface VariantInput {
  /** Identifiant en base. Absent = à créer. */
  id?: string;
  label: string;
  sku: string;
  stock: number;
  /** `null` = hérite du prix de l'article. */
  priceCents: number | null;
}

export interface ProductInput {
  name: string;
  description: string;
  basePriceCents: number;
  currency: string;
  status: ProductStatus;
  variants: VariantInput[];
}

export type WriteResult =
  { ok: true; id: string } | { ok: false; error: string };

/**
 * Slug dérivé du nom : le commerçant ne le voit ni ne le saisit jamais.
 * Accents retirés, tout ce qui n'est pas alphanumérique devient un tiret.
 */
function slugify(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function validate(input: ProductInput): string | null {
  if (!input.name.trim()) return "Le nom de l'article est obligatoire.";
  if (!Number.isInteger(input.basePriceCents) || input.basePriceCents < 0) {
    return "Le prix est invalide.";
  }
  if (input.variants.length === 0) {
    return "Il faut au moins une déclinaison.";
  }
  for (const v of input.variants) {
    if (!Number.isInteger(v.stock) || v.stock < 0) {
      return `Stock invalide pour « ${v.label} ».`;
    }
  }
  // Deux déclinaisons au même code rendraient l'inventaire ambigu.
  const codes = input.variants.map((v) => v.sku);
  if (new Set(codes).size !== codes.length) {
    return "Deux déclinaisons portent le même code article.";
  }
  return null;
}

/**
 * Crée un article et ses déclinaisons.
 *
 * Toujours en BROUILLON, quel que soit le statut demandé à la création :
 * séparer « enregistrer » de « mettre en vente » évite qu'un article à
 * moitié saisi se retrouve en boutique — l'erreur la plus coûteuse de cet
 * écran (`ns-boutique-admin`).
 */
export async function createProduct(input: ProductInput): Promise<WriteResult> {
  const admin = await requireShopAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };

  const invalide = validate(input);
  if (invalide) return { ok: false, error: invalide };

  const db = adminClient();
  const base = slugify(input.name);
  // Un nom repris donnerait un slug déjà pris ; le suffixe court évite
  // l'échec sur la contrainte d'unicité sans demander quoi que ce soit.
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await db
    .from("products")
    .insert({
      slug,
      name: input.name.trim(),
      description: input.description.trim() || null,
      base_price_cents: input.basePriceCents,
      currency: input.currency,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  const productId = (data as { id: string }).id;

  const res = await replaceVariants(productId, input.variants);
  if (!res.ok) return res;

  return { ok: true, id: productId };
}

/** Modifie un article existant et remplace ses déclinaisons. */
export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<WriteResult> {
  const admin = await requireShopAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };

  const invalide = validate(input);
  if (invalide) return { ok: false, error: invalide };

  const db = adminClient();
  const { error } = await db
    .from("products")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      base_price_cents: input.basePriceCents,
      currency: input.currency,
      status: input.status,
    })
    .eq("id", productId);

  if (error) return { ok: false, error: error.message };

  const res = await replaceVariants(productId, input.variants);
  if (!res.ok) return res;

  return { ok: true, id: productId };
}

/** Bascule brouillon ↔ en vente. Geste distinct de l'enregistrement. */
export async function setProductStatus(
  productId: string,
  status: ProductStatus,
): Promise<WriteResult> {
  const admin = await requireShopAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };

  const db = adminClient();
  const { error } = await db
    .from("products")
    .update({ status })
    .eq("id", productId);

  return error
    ? { ok: false, error: error.message }
    : { ok: true, id: productId };
}

/**
 * Aligne les déclinaisons sur ce que le formulaire décrit.
 *
 * Les absentes sont DÉSACTIVÉES, jamais supprimées : une variante peut
 * figurer dans une commande passée, et `order_items.variant_id` doit rester
 * exploitable pour l'analyse. `is_active = false` la retire de la vitrine
 * sans toucher à l'historique.
 */
async function replaceVariants(
  productId: string,
  variants: VariantInput[],
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const db = adminClient();

  const { data: existantes } = await db
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId);

  const parSku = new Map(
    ((existantes ?? []) as { id: string; sku: string }[]).map((v) => [
      v.sku,
      v.id,
    ]),
  );
  const skusVoulus = new Set(variants.map((v) => v.sku));

  for (const [sku, id] of parSku) {
    if (!skusVoulus.has(sku)) {
      await db
        .from("product_variants")
        .update({ is_active: false })
        .eq("id", id);
    }
  }

  for (const [i, v] of variants.entries()) {
    const existant = parSku.get(v.sku);
    let variantId = existant;

    if (existant) {
      const { error } = await db
        .from("product_variants")
        .update({
          label: v.label,
          price_cents: v.priceCents,
          position: i,
          is_active: true,
        })
        .eq("id", existant);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await db
        .from("product_variants")
        .insert({
          product_id: productId,
          sku: v.sku,
          label: v.label,
          price_cents: v.priceCents,
          position: i,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      variantId = (data as { id: string }).id;
    }

    if (!variantId) continue;
    // `upsert` : la ligne d'inventaire peut ne pas exister pour une variante
    // qui vient d'être créée.
    const { error: errStock } = await db
      .from("inventory")
      .upsert(
        { variant_id: variantId, quantity: v.stock },
        { onConflict: "variant_id" },
      );
    if (errStock) return { ok: false, error: errStock.message };
  }

  return { ok: true, id: productId };
}
