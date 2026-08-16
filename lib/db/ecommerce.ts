/**
 * Types du domaine boutique.
 *
 * Écrits à la main plutôt que générés, pour deux raisons :
 *
 *  - `supabase gen types` échoue sur certaines configurations de projet
 *    (`ProjectConfigParseError`), et une pipeline qui dépend d'un outil
 *    capricieux bloque au pire moment.
 *  - Ces types SUIVENT le schéma de
 *    `supabase/migrations/20260813000001_ecommerce_schema.sql`. Toute
 *    divergence est un bug : la migration fait foi.
 *
 * Ils existent pour supprimer les `any` des pages boutique. `CLAUDE.md`
 * interdit `any`, et sur un domaine où circulent des prix et des stocks, un
 * `any` masque exactement les erreurs qui coûtent de l'argent.
 *
 * Convention : les montants portent le suffixe `_cents` et sont des ENTIERS.
 * Voir la décision 1 du schéma.
 */

export type ProductStatus = "draft" | "active" | "archived";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price_cents: number;
  currency: string;
  status: ProductStatus;
  /** Attributs libres : matière, coupe, saison, genre. */
  attributes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  /** Libellé lisible : « M / Bleu marine ». */
  label: string;
  options: Record<string, string>;
  /** `null` = hérite de `Product.base_price_cents`. */
  price_cents: number | null;
  position: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt: string;
  position: number;
}

export interface Inventory {
  variant_id: string;
  quantity: number;
  /** Retenu par des paniers en cours de paiement. */
  reserved: number;
  low_stock_threshold: number;
}

/**
 * Vue `variant_availability`. `available` vaut `quantity - reserved` :
 * c'est le seul nombre affichable au client. Montrer `quantity` seul
 * promettrait des articles déjà retenus.
 */
export interface VariantAvailability {
  variant_id: string;
  product_id: string;
  sku: string;
  label: string;
  available: number;
  is_low: boolean;
}

export interface Order {
  id: string;
  /** Numéro lisible donné au client. Jamais l'UUID. */
  reference: string;
  user_id: string | null;
  status: OrderStatus;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: Record<string, string>;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  payment_method: string;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

/**
 * Ligne de commande, DÉNORMALISÉE volontairement : nom, libellé, SKU et prix
 * sont copiés à l'achat. Lire ces colonnes, jamais rejoindre `products` pour
 * afficher une commande passée — un produit renommé réécrirait l'historique.
 */
export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string;
  sku: string;
  unit_price_cents: number;
  quantity: number;
  total_cents: number;
}

// --- Formes composées, telles que les pages les consomment -----------------

/** Une variante enrichie de sa disponibilité réelle. */
export interface VariantWithStock extends ProductVariant {
  available: number;
  is_low: boolean;
}

/** Un produit prêt à afficher en fiche. */
export interface ProductDetail extends Product {
  variants: VariantWithStock[];
  images: ProductImage[];
}

/** Un produit tel qu'il apparaît dans la grille du catalogue. */
export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  /** Prix le plus bas parmi les variantes actives, en centimes. */
  from_price_cents: number;
  currency: string;
  image_url: string | null;
  image_alt: string;
  /** Somme des disponibilités. 0 = épuisé, signalé dès le catalogue. */
  total_available: number;
}

/**
 * Prix effectif d'une variante : le sien s'il existe, sinon celui du produit.
 * Fonction plutôt que valeur dupliquée — le prix du produit peut changer sans
 * qu'on veuille toucher aux variantes qui l'héritent.
 */
export function effectivePriceCents(
  variant: Pick<ProductVariant, "price_cents">,
  product: Pick<Product, "base_price_cents">,
): number {
  return variant.price_cents ?? product.base_price_cents;
}
