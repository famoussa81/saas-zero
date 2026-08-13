---
name: ns-ecommerce
description: "Domaine boutique — catalogue, variantes taille/couleur, stock, panier, commandes, encaissement Stripe ou WhatsApp. Le schéma est déjà écrit ; ce skill dit comment le consommer sans réintroduire les pièges classiques (survente, prix qui bouge après l'achat, panier perdu à la connexion)."
---

# ns-ecommerce — le domaine boutique

> Activé par `pnpm ns:new <nom> --variant=b2c --type=ecommerce`.
> Le schéma est posé par
> `supabase/schema-variants/ecommerce/20260813000001_ecommerce_schema.sql`.
>
> **Lire ce fichier SQL avant de coder.** Ses commentaires expliquent trois
> décisions qui paraissent bizarres et qui ne doivent pas être défaites.

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — les primitives déjà là. Ne pas les réécrire (et ne jamais en créer dans `components/ui/`).
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.
5. **`ns-antislop`** avant de livrer — sur une boutique, H-1 (aucun chiffre sans source) et H-2 (aucun avis fabriqué) sont les deux règles qui évitent une page qui ment.

Aucune valeur en dur. Avant de rendre la main : `pnpm design:tokens:audit`.

---

## Le modèle, en une lecture

```
categories ──< product_categories >── products ──< product_variants ──1:1── inventory
                                          │              │
                                          └─ product_images (fiche ou variante)
                                                         │
carts ──< cart_items ────────────────────────────────────┘
orders ──< order_items  (copie du nom, du SKU et du prix)
```

**Une variante est l'unité vendable.** Un t-shirt en 4 tailles et 3 couleurs,
c'est 1 produit, 12 variantes, 12 SKU, 12 lignes de stock. Le produit porte la
description et les photos ; la variante porte le prix, le stock et le code.

---

## Les trois pièges, et pourquoi le schéma est fait comme ça

### 1. Le prix qui change après l'achat

`order_items` copie `product_name`, `variant_label`, `sku` et
`unit_price_cents` **au moment de la commande**. Le `variant_id` reste, mais
seulement pour l'analyse.

Sans cette copie, augmenter un prix réécrit les factures déjà émises, et
supprimer un produit vide les commandes passées. C'est une faute comptable,
pas un détail technique.

```ts
// Correct : on fige ce qui a été acheté.
await supabase.from("order_items").insert({
  order_id: order.id,
  variant_id: v.id,
  product_name: v.product.name,
  variant_label: v.label,
  sku: v.sku,
  unit_price_cents: priceOf(v),
  quantity: qty,
  total_cents: priceOf(v) * qty,
});
```

**Jamais** afficher une commande passée en rejoignant `products` pour lire le
nom actuel. Lire les colonnes copiées.

### 2. La survente

`inventory` porte `quantity` et `reserved`. Ce qui est vendable est
`quantity - reserved`, exposé par la vue `variant_availability`.

Deux clients qui achètent le dernier article à trois secondes d'intervalle
passent tous les deux si on lit puis écrit sans verrou. Le décrément doit être
**atomique et conditionnel** :

```sql
UPDATE inventory
   SET quantity = quantity - $qty
 WHERE variant_id = $id
   AND quantity - reserved >= $qty
RETURNING quantity;
```

Zéro ligne retournée = stock insuffisant, la commande est refusée. La
contrainte `CHECK (quantity >= 0)` est la ceinture ; cette clause `WHERE` est
les bretelles.

Le passage en commande décrémente le stock et vide le panier **dans la même
transaction**. Une fonction Postgres (`rpc`) est le seul endroit où c'est
garanti — deux appels Supabase successifs ne le sont pas.

### 3. Le panier perdu à la connexion

`carts.user_id` est nullable et `session_token` prend le relais pour un
visiteur. Un client remplit son panier, se connecte pour payer, et **son
panier doit le suivre**. Sinon il abandonne — c'est la première cause de perte
au tunnel.

À la connexion : retrouver le panier `session_token`, le rattacher au
`user_id`, fusionner avec un éventuel panier existant (additionner les
quantités sur `UNIQUE (cart_id, variant_id)`).

---

## Les écrans, et ce qui les rate

| Écran              | Ce qui compte vraiment                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Liste produits** | Filtres qui tiennent l'URL (partageable, indexable). Image, nom, prix — pas dix informations.                                                       |
| **Fiche produit**  | Sélecteur de variante qui **désactive** les combinaisons en rupture au lieu de les cacher : voir « M épuisé » informe, faire disparaître M déroute. |
| **Panier**         | Total recalculé côté serveur à chaque affichage. Le prix du panier n'est jamais celui stocké au moment de l'ajout.                                  |
| **Commande**       | Un seul écran si possible. Chaque champ ajouté coûte des ventes.                                                                                    |
| **Confirmation**   | La référence lisible (`CMD-202608-1042`), pas l'UUID. Et ce qui se passe ensuite.                                                                   |
| **Admin**          | Alerte de stock bas (`is_low` de la vue), commandes du jour, changement de statut.                                                                  |

**Les images produit sont réelles.** `media-sourcing` va chercher sur Pexels
et Unsplash pour l'ambiance et les bannières — jamais pour la photo d'un
article vendu. Montrer un vêtement et en livrer un autre est une tromperie,
pas un raccourci. Une photo au téléphone sur fond blanc vend mieux qu'une
photo de stock qui ment.

---

## Encaisser

Le moyen de paiement se décide en **Discovery**, pas en phase build.

**Stripe** — voir `ns-billing` et `ns-setup-pricing`. Le webhook confirme la
commande ; ne jamais passer une commande en `paid` depuis le navigateur.

**WhatsApp** — pertinent là où la carte bancaire est rare. La commande part en
`pending`, un message part au propriétaire avec la référence, les lignes et le
total. Le passage en `confirmed` est manuel côté admin. Trois précautions :

- Le lien `wa.me` se construit **côté serveur** : la commande doit exister en
  base avant que le message parte, sinon un client peut envoyer un message
  pour une commande qui n'existe pas.
- Le message contient la **référence**, jamais l'UUID.
- Le numéro du propriétaire vient d'une variable d'environnement, pas du code.

**Paiement à la livraison** — `payment_method = 'cash_on_delivery'`,
`payment_status = 'unpaid'` jusqu'à la remise. Prévoir le taux d'annulation
dans le stock : réserver, pas décrémenter.

---

## Ce que le schéma ne fait pas

À décider en Discovery, et à ajouter seulement si le besoin est réel :

- **Livraison** : frais fixes, par zone, ou par poids. `shipping_cents` existe,
  le calcul non.
- **Taxes** : aucune table. Selon le pays, c'est un champ ou un moteur entier.
- **Remises et codes promo** : rien. Stripe les gère si tu passes par lui.
- **Retours** : `status = 'refunded'` existe, le flux non.
- **Multi-boutique** : le schéma est mono-vendeur. Une place de marché est un
  autre produit.

---

## Checklist de sortie

- [ ] Le décrément de stock est atomique et conditionnel, testé à deux achats simultanés
- [ ] `order_items` contient nom, SKU et prix copiés — vérifié en renommant un produit après commande
- [ ] Le panier invité survit à la connexion
- [ ] Les variantes en rupture sont désactivées, pas masquées
- [ ] Le total est recalculé côté serveur
- [ ] Aucune photo de stock sur un article réellement vendu
- [ ] RLS : un client ne lit pas la commande d'un autre (`pnpm gate:rls`)
- [ ] Les cinq états sur chaque écran (`ns-error-states`)
- [ ] `ns-antislop` repassé avant livraison

## Liens

- `ns-billing`, `ns-setup-pricing` — encaissement Stripe
- `ns-forms` — formulaire de contact et notifications Brevo
- `ns-dashboard` — l'admin de la boutique
- `ns-error-states`, `ns-antislop`, `media-sourcing`
