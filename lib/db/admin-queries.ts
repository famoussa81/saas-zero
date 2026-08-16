import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductVariant,
  VariantAvailability,
} from "@/lib/db/ecommerce";

/**
 * Requêtes du back-office — SERVEUR uniquement.
 *
 * Elles passent par la service-role, qui contourne la RLS. Deux règles en
 * découlent, et elles ne sont pas négociables :
 *
 *  1. Ce module ne doit JAMAIS être importé depuis un Client Component. La
 *     clé fuiterait dans le bundle du navigateur.
 *  2. Chaque fonction qui écrit vérifie le rôle AVANT d'agir. Masquer un
 *     bouton ne protège rien : l'action serveur reste appelable.
 *
 * La lecture des commandes passe aussi par la service-role : les policies
 * n'exposent au client que ses propres commandes, ce qui est correct pour la
 * vitrine et inutilisable pour le commerçant.
 */

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY absente : le back-office ne peut pas fonctionner.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Garde d'accès. Retourne l'identifiant du commerçant, ou `null`.
 *
 * Volontairement séparée des requêtes : une action d'écriture l'appelle en
 * premier, et le fait de devoir écrire la ligne rend l'oubli visible en
 * relecture.
 */
export async function requireShopAdmin(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (data as { role?: string } | null)?.role;
  return role === "admin" || role === "owner" ? user.id : null;
}

// --- Tableau de bord --------------------------------------------------------

export interface ShopSummary {
  /** Commandes qui attendent une action. C'est de l'argent en attente. */
  pendingOrders: number;
  /** Variantes au niveau ou sous le seuil d'alerte. */
  lowStock: VariantAvailability[];
  /** Chiffre du jour, en centimes. */
  todayRevenueCents: number;
}

export async function getShopSummary(): Promise<ShopSummary> {
  const db = adminClient();
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);

  const [pending, low, today] = await Promise.all([
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db.from("variant_availability").select("*").eq("is_low", true),
    db
      .from("orders")
      .select("total_cents")
      .gte("created_at", debutJour.toISOString())
      .neq("status", "cancelled"),
  ]);

  const lignes = (today.data ?? []) as Pick<Order, "total_cents">[];

  return {
    pendingOrders: pending.count ?? 0,
    lowStock: (low.data ?? []) as VariantAvailability[],
    todayRevenueCents: lignes.reduce((s, o) => s + o.total_cents, 0),
  };
}

// --- Commandes --------------------------------------------------------------

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export async function listOrders(limit = 50): Promise<OrderWithItems[]> {
  const db = adminClient();
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Commandes indisponibles : ${error.message}`);

  return ((data ?? []) as (Order & { order_items: OrderItem[] })[]).map(
    ({ order_items, ...o }) => ({ ...o, items: order_items }),
  );
}

/**
 * Fait avancer une commande d'un cran.
 *
 * Le passage en `confirmed` transforme la réservation en décrément réel :
 * jusque-là le stock était seulement RETENU, parce qu'une commande WhatsApp
 * peut être annulée après un appel.
 */
export async function advanceOrder(
  orderId: string,
  next: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireShopAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };

  const db = adminClient();
  const { data: current } = await db
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  const statut = (current as Pick<Order, "status"> | null)?.status;
  if (!statut) return { ok: false, error: "Commande introuvable" };

  if (statut === "pending" && next === "confirmed") {
    const { data: items } = await db
      .from("order_items")
      .select("variant_id, quantity")
      .eq("order_id", orderId);

    for (const l of (items ?? []) as Pick<
      OrderItem,
      "variant_id" | "quantity"
    >[]) {
      if (!l.variant_id) continue;
      // Réservation transformée en sortie de stock. `rpc` serait préférable
      // pour l'atomicité ; à défaut on lit puis on écrit de façon bornée.
      const { data: inv } = await db
        .from("inventory")
        .select("quantity, reserved")
        .eq("variant_id", l.variant_id)
        .maybeSingle();
      const stock = inv as { quantity: number; reserved: number } | null;
      if (!stock) continue;
      await db
        .from("inventory")
        .update({
          quantity: Math.max(0, stock.quantity - l.quantity),
          reserved: Math.max(0, stock.reserved - l.quantity),
        })
        .eq("variant_id", l.variant_id);
    }
  }

  const { error } = await db
    .from("orders")
    .update({ status: next })
    .eq("id", orderId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

// --- Articles ---------------------------------------------------------------

export interface AdminProductRow extends Product {
  variants: (ProductVariant & { available: number })[];
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const db = adminClient();
  const { data, error } = await db
    .from("products")
    .select("*, product_variants(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Articles indisponibles : ${error.message}`);

  const rows = (data ?? []) as (Product & {
    product_variants: ProductVariant[];
  })[];
  const ids = rows.flatMap((p) => p.product_variants.map((v) => v.id));

  const { data: dispo } = ids.length
    ? await db.from("variant_availability").select("*").in("variant_id", ids)
    : { data: [] };

  const parVariante = new Map(
    ((dispo ?? []) as VariantAvailability[]).map((d) => [d.variant_id, d]),
  );

  return rows.map(({ product_variants, ...p }) => ({
    ...p,
    variants: product_variants.map((v) => ({
      ...v,
      available: parVariante.get(v.id)?.available ?? 0,
    })),
  }));
}

/**
 * Retire un article de la vente.
 *
 * PAS de suppression : le schéma protège la donnée
 * (`ON DELETE SET NULL` sur `order_items.variant_id`), mais l'interface doit
 * protéger l'intention. Un article archivé disparaît de la vitrine et reste
 * dans l'historique des commandes.
 */
export async function archiveProduct(
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireShopAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };

  const db = adminClient();
  const { error } = await db
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Ajustement manuel du stock — casse, inventaire, retour. */
export async function adjustStock(
  variantId: string,
  quantity: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireShopAdmin();
  if (!admin) return { ok: false, error: "Non autorisé" };
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { ok: false, error: "Quantité invalide" };
  }

  const db = adminClient();
  const { error } = await db
    .from("inventory")
    .update({ quantity })
    .eq("variant_id", variantId);

  return error ? { ok: false, error: error.message } : { ok: true };
}
