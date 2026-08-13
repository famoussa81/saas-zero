---
name: ns-whatsapp
description: "Encaissement et notification par WhatsApp — la commande part en attente, un message structuré arrive au commerçant, la confirmation est manuelle. Pour les marchés où la carte bancaire est rare et où WhatsApp est le canal commercial réel."
---

# ns-whatsapp — commander sans carte bancaire

> Le schéma boutique prévoit `payment_method = 'whatsapp'`, mais rien ne
> construisait le message. Ce skill comble ce trou.
>
> **Ce n'est pas un pis-aller.** Sur beaucoup de marchés — Afrique de l'Ouest
> notamment — imposer une carte bancaire ne convertit pas moins, il ne
> convertit **pas du tout**. WhatsApp y est le canal commercial réel : le
> client négocie, demande une photo, confirme une taille. Le tunnel doit
> l'épouser, pas le contourner.

## Le flux, et l'ordre qui compte

```
1. Le client valide son panier
2. Le SERVEUR crée la commande en base       ← statut pending, payment unpaid
3. Le SERVEUR construit le lien wa.me        ← avec la référence de la commande
4. Le client est redirigé vers WhatsApp, message pré-rempli
5. Le commerçant reçoit, appelle, confirme
6. Le commerçant passe la commande en confirmed depuis son back-office
```

**L'étape 2 précède l'étape 3, et ce n'est pas négociable.** Construire le
lien côté client permettrait d'envoyer un message pour une commande qui
n'existe pas : le commerçant reçoit une demande introuvable dans son
back-office, et personne ne sait quoi en faire. Le message ne se fabrique
qu'après l'écriture en base, et il porte la référence de cette écriture.

## Construire le lien

```ts
// lib/whatsapp.ts — SERVEUR uniquement
const money = (cents: number, currency = "XOF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function buildOrderMessage(order: {
  reference: string;
  customerName: string;
  customerPhone: string;
  items: {
    productName: string;
    variantLabel: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  totalCents: number;
  shippingAddress?: string;
}): string {
  const lines = order.items.map(
    (i) =>
      `• ${i.quantity} × ${i.productName} (${i.variantLabel}) — ${money(i.unitPriceCents * i.quantity)}`,
  );
  return [
    `Nouvelle commande ${order.reference}`,
    "",
    ...lines,
    "",
    `Total : ${money(order.totalCents)}`,
    `Client : ${order.customerName} — ${order.customerPhone}`,
    order.shippingAddress ? `Livraison : ${order.shippingAddress}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppLink(phoneE164: string, message: string): string {
  // wa.me exige un numéro SANS + ni espaces ni tirets.
  const digits = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
```

Quatre pièges dans ces vingt lignes :

- **`encodeURIComponent`, pas de concaténation brute.** Un nom avec une
  apostrophe ou un retour à la ligne casse le lien sans que rien ne le
  signale.
- **Le numéro se nettoie de tout sauf les chiffres.** `+223 76 12 34 56`
  passé tel quel donne un lien mort.
- **La référence, jamais l'UUID.** `CMD-202608-1042` se lit au téléphone ;
  `44444444-4444-…` ne se lit pas.
- **Le numéro du commerçant vient de l'environnement**, jamais du code :
  `SHOP_WHATSAPP_PHONE`. Il change quand le client change de téléphone.

## Ce qu'il faut afficher au client

Le client quitte votre site pour WhatsApp. **Il faut lui dire ce qui se passe
ensuite**, sinon il croit avoir échoué :

> **Commande CMD-202608-1042 enregistrée.**
> Nous vous répondons sur WhatsApp pour confirmer la disponibilité et convenir
> du paiement. Gardez ce numéro de commande.

Et prévoir le cas où WhatsApp ne s'ouvre pas — application absente, ordinateur
sans compte lié. La page de confirmation affiche **le message en clair, avec
un bouton copier**, et le numéro du commerçant. Un tunnel qui suppose que
WhatsApp s'ouvre toujours perd les clients pour qui il ne s'ouvre pas.

## Le stock, cas particulier

Une commande WhatsApp n'est **pas payée** au moment où elle est créée. Elle
peut être annulée après un appel : taille indisponible, client injoignable,
prix négocié.

Donc **réserver, ne pas décrémenter** :

```sql
UPDATE inventory
   SET reserved = reserved + $qty
 WHERE variant_id = $id
   AND quantity - reserved >= $qty
RETURNING reserved;
```

Le décrément réel (`quantity`) intervient au passage en `confirmed`. Une
commande annulée relâche simplement la réservation. Décrémenter tout de suite
ferait disparaître du stock qui n'a jamais été vendu — et sur un article à
deux exemplaires, c'est une vente perdue par annulation.

Prévoir une **expiration des réservations** : une commande `pending` depuis
48 h libère son stock. Sans ça, quelques abandons suffisent à rendre la
boutique vide alors que les articles sont en rayon.

## Variables d'environnement

```bash
SHOP_WHATSAPP_PHONE=22376123456   # E.164 sans le +, numéro du commerçant
SHOP_NAME="Boutique Diallo"       # apparaît dans le message
```

`pnpm env:check` doit les réclamer dès que `payment_method` par défaut vaut
`whatsapp`.

## Ce que ce skill ne fait pas

- **Aucun paiement n'est encaissé.** WhatsApp est un canal de confirmation,
  pas un processeur. L'argent se règle en espèces, par mobile money ou par
  virement, hors du système.
- **Pas de WhatsApp Business API.** Le lien `wa.me` ouvre l'application, il
  n'envoie rien automatiquement. Envoyer sans intervention humaine demande un
  compte Business vérifié et un fournisseur — autre chantier, autre budget.
- **Pas d'accusé de réception.** Personne ne sait si le commerçant a lu. D'où
  l'importance du back-office : la commande y est visible même si le message
  se perd.

## Checklist de sortie

- [ ] La commande est écrite en base AVANT que le lien soit construit
- [ ] `encodeURIComponent` sur le message, numéro réduit aux chiffres
- [ ] La référence lisible figure dans le message, jamais l'UUID
- [ ] Le numéro du commerçant vient de `SHOP_WHATSAPP_PHONE`
- [ ] La page de confirmation affiche le message en clair, avec bouton copier
- [ ] Le stock est RÉSERVÉ, pas décrémenté, tant que la commande est en attente
- [ ] Les réservations de plus de 48 h sont libérées
- [ ] `pnpm env:check` réclame les deux variables

## Liens

- `ns-ecommerce` — le domaine, dont la réservation de stock
- `ns-boutique-admin` — là où le commerçant confirme la commande
- `ns-billing` — l'alternative Stripe, quand la carte est courante
