"use server";

import { revalidatePath } from "next/cache";
import {
  advanceOrder,
  archiveProduct,
  adjustStock,
} from "@/lib/db/admin-queries";
import type { OrderStatus } from "@/lib/db/ecommerce";

/**
 * Server actions du back-office.
 *
 * Seule porte d'entrée pour écrire depuis l'interface. Chaque fonction
 * sous-jacente vérifie le rôle avant d'agir : masquer un bouton ne protège
 * rien, l'action reste appelable par quiconque connaît son identifiant.
 *
 * Le retour est un objet `{ ok }` plutôt qu'une exception — une erreur doit
 * s'afficher dans l'écran du commerçant, pas produire une page blanche.
 */

export async function advanceOrderAction(
  orderId: string,
  next: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await advanceOrder(orderId, next);
  if (res.ok) {
    // Deux écrans montrent ce chiffre : la liste, et l'accueil dont le
    // compteur « commandes à traiter » vient de changer.
    revalidatePath("/[locale]/admin/boutique/commandes", "page");
    revalidatePath("/[locale]/admin/boutique", "page");
  }
  return res;
}

export async function archiveProductAction(
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await archiveProduct(productId);
  if (res.ok) {
    revalidatePath("/[locale]/admin/boutique/articles", "page");
    // La vitrine aussi : l'article ne doit plus y apparaître.
    revalidatePath("/[locale]/(boutique)/produits", "page");
  }
  return res;
}

export async function adjustStockAction(
  variantId: string,
  quantity: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await adjustStock(variantId, quantity);
  if (res.ok) {
    revalidatePath("/[locale]/admin/boutique/articles", "page");
    revalidatePath("/[locale]/admin/boutique", "page");
  }
  return res;
}
