---
name: ns-boutique-admin
description: "Back-office de boutique pour un commerçant qui ne code pas — ajouter et modifier des produits, gérer les variantes et le stock, traiter les commandes du jour. Écrit pour quelqu'un qui n'a jamais entendu les mots SKU, variante ou slug, et qui gère sa boutique depuis son téléphone."
---

# ns-boutique-admin — le back-office du commerçant

> Pour `--type=ecommerce`. Complète `ns-ecommerce` (le domaine) et
> `ns-dashboard` (les règles d'écran).
>
> **La différence tient en une phrase** : celui qui utilise cet écran n'est
> pas le développeur, ni le fondateur du SaaS. C'est un commerçant. Il vend
> des vêtements, pas des bases de données. S'il ne comprend pas comment
> ajouter un article en trente secondes, il ne s'en servira pas — et la
> boutique mourra faute d'être tenue à jour.

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 28 primitives Radix + CVA déjà là. Ne pas les réécrire.
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires.
5. **`ns-antislop`** avant de livrer.

Aucune valeur en dur. Avant de rendre la main : `pnpm design:tokens:audit`.

---

## Règle n°1 — le vocabulaire du métier, jamais celui de la base

C'est la règle qui décide de tout le reste. Chaque mot technique affiché à
l'écran est une occasion de perdre l'utilisateur.

| Ce que dit la base   | Ce qu'affiche l'écran                   |
| -------------------- | --------------------------------------- |
| `sku`                | **Code article**                        |
| `variant`            | **Taille / couleur** (ou déclinaison)   |
| `slug`               | rien — généré, jamais montré            |
| `status: draft`      | **Brouillon** (non visible en boutique) |
| `status: active`     | **En vente**                            |
| `status: archived`   | **Retiré de la vente**                  |
| `inventory.quantity` | **Stock**                               |
| `reserved`           | **Réservé (commandes en cours)**        |
| `base_price_cents`   | **Prix**, en francs, pas en centimes    |
| `order.reference`    | **N° de commande**                      |
| `payment_status`     | **Payé / Pas encore payé**              |

**Les prix se saisissent et s'affichent en unité courante.** La base stocke
des centimes ; la conversion se fait à l'entrée et à la sortie, jamais dans la
tête du commerçant. Un champ qui demande `1500000` pour 15 000 F est une faute
d'interface, pas une contrainte technique.

---

## Les trois écrans qui comptent

Un commerçant ouvre son back-office pour trois raisons, dans cet ordre de
fréquence. L'écran d'accueil doit répondre à la première sans un clic.

### 1. « Qu'est-ce que j'ai à faire aujourd'hui ? »

L'accueil n'est pas une page de statistiques. C'est une **liste de tâches**.

```
Commandes à traiter          3     ← le plus gros, en premier
Stock bas                    2 articles
Ventes du jour          45 000 F
```

- **Les commandes en attente d'abord.** C'est de l'argent qui attend d'être
  livré. Un lien direct, pas un chemin par un menu.
- **Le stock bas ensuite**, avec le nom des articles concernés — pas un
  compteur qu'il faut aller déchiffrer ailleurs. La vue
  `variant_availability` expose déjà `is_low`.
- **Le chiffre du jour en dernier.** C'est agréable, ce n'est pas une action.

Trois chiffres, pas huit. Au-delà, plus personne ne lit
(`.claude/design/UI-CONTRACT.md` §5).

### 2. « J'ai reçu une commande »

La liste des commandes se lit du plus récent au plus ancien, et chaque ligne
donne ce qu'il faut pour agir **sans ouvrir la fiche** : numéro, client,
montant, statut.

L'action principale est **un seul bouton qui fait avancer la commande d'un
cran** :

```
En attente  →  Confirmée  →  En préparation  →  Expédiée  →  Livrée
```

Un menu déroulant à sept statuts oblige à réfléchir à chaque fois. Un bouton
« Marquer comme expédiée » ne demande aucune décision. Les statuts inhabituels
(annulée, remboursée) vivent dans le menu secondaire, pas dans le chemin
principal.

**Le téléphone du client est cliquable** (`tel:` et lien WhatsApp) : la
première chose qu'un commerçant fait en recevant une commande, c'est appeler
pour confirmer.

### 3. « Je veux ajouter un article »

Le formulaire produit est l'écran le plus difficile à bien faire, parce que
les variantes y introduisent une complexité que le commerçant n'a pas demandée.

**Le principe : commencer simple, ouvrir seulement si nécessaire.**

```
Nom de l'article          [ T-shirt coton bio        ]
Prix                      [ 15 000        ] F
Photos                    [ + Ajouter des photos     ]
Description               [                          ]
Catégorie                 [ Hauts              ▾     ]

☐ Cet article existe en plusieurs tailles ou couleurs
```

Tant que la case est décochée : **une seule variante est créée en coulisse**,
avec un code article généré. Le commerçant ne voit jamais le mot « variante ».
Il saisit un stock, un prix, et c'est fini.

Case cochée, le formulaire ouvre une grille :

```
Tailles     [S] [M] [L] [+ ajouter]
Couleurs    [Noir] [Écru] [+ ajouter]

           Stock    Prix (si différent)
S / Noir   [ 24 ]   [        ]
M / Noir   [ 12 ]   [        ]
L / Noir   [  2 ]   [        ]
S / Écru   [  8 ]   [        ]
…
```

- **La grille est générée** depuis les tailles et les couleurs saisies. On ne
  demande jamais de créer les combinaisons une par une.
- **Le prix par ligne est facultatif.** Vide = le prix de l'article. C'est le
  cas courant ; l'exception est le XL plus cher.
- **Le code article est généré et masqué** par défaut, révélé par un petit
  « voir les codes » pour qui en a besoin (étiquettes, inventaire).

**Enregistrer crée l'article en Brouillon.** Un bouton distinct, « Mettre en
vente », le rend visible. Séparer les deux évite qu'un article à moitié saisi
se retrouve en boutique — l'erreur la plus coûteuse de cet écran.

---

## Ce qu'il ne faut jamais permettre

**Supprimer un produit qui a des commandes.** Le schéma protège la donnée
(`ON DELETE SET NULL` sur `order_items.variant_id`), mais l'interface doit
protéger l'intention : proposer **« Retirer de la vente »** (archived), pas
« Supprimer ». La suppression définitive n'est offerte que sur un article
sans aucune commande, et avec le nom dans le bouton de confirmation :

> Supprimer définitivement « T-shirt coton bio » ?

Jamais « Êtes-vous sûr ? » avec OK/Annuler — personne ne lit ces boîtes.

**Modifier le prix d'une commande passée.** Les lignes de commande sont
figées, c'est le principe même du schéma. L'écran de commande affiche les
prix, il ne les édite pas.

**Toucher au stock sans trace.** Un ajustement manuel (casse, inventaire,
retour) mérite un motif. Sans ça, un écart inexpliqué est impossible à
retrouver trois mois plus tard.

---

## Ergonomie : c'est un téléphone, pas un poste de travail

Beaucoup de commerçants n'ont pas d'ordinateur. Le back-office se conçoit
**mobile d'abord**, ce qui change trois choses :

- **La liste des commandes est une pile de cartes** sur petit écran, pas un
  tableau qui déborde. `DataTable` masque les colonnes secondaires sous `md`
  via `hideBelowMd`, mais au-delà de trois colonnes il vaut mieux une carte.
- **Les cibles tactiles font 44 px minimum.** Un bouton « Expédiée » qu'on
  rate une fois sur trois est pire qu'un menu.
- **Les photos se prennent au téléphone.** Le champ d'ajout accepte la
  capture directe (`<input type="file" accept="image/*" capture>`), pas
  seulement un glisser-déposer venu d'un bureau.

Et une contrainte qu'on oublie depuis une connexion de bureau : **la
sauvegarde doit survivre à une coupure réseau**. Un formulaire produit long,
perdu parce que la 3G a lâché, ne sera pas ressaisi. Enregistrer en brouillon
au fil de l'eau, ou au minimum prévenir avant de quitter.

---

## Les écrans, au complet

| Écran                          | Contenu                                                     | Priorité |
| ------------------------------ | ----------------------------------------------------------- | -------- |
| **Accueil**                    | 3 tâches du jour, commandes en attente en tête              | P0       |
| **Commandes**                  | Liste + fiche, avancement en un bouton, téléphone cliquable | P0       |
| **Articles**                   | Liste avec photo, prix, stock, statut ; recherche par nom   | P0       |
| **Article (création/édition)** | Formulaire progressif décrit plus haut                      | P0       |
| **Stock**                      | Tous les articles en rupture ou bas, ajustement rapide      | P1       |
| **Catégories**                 | Créer, renommer, ordonner                                   | P1       |
| **Réglages**                   | Nom de la boutique, numéro WhatsApp, frais de livraison     | P1       |

Les cinq états sur chacun (`ns-error-states`). L'état vide de la liste
d'articles est le premier écran que verra le commerçant : il doit expliquer et
proposer, pas afficher « Aucune donnée ».

---

## Sécurité — ce que la RLS ne fait pas toute seule

Le back-office lit et écrit des tables dont les policies publiques
n'autorisent que la **lecture du catalogue actif**. Toute écriture passe donc
par une server action qui vérifie le rôle **avant** d'utiliser la
service-role.

```ts
// Toute action d'administration commence par ça.
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user || !(await isShopAdmin(user.id))) {
  return { success: false, error: "Non autorisé" };
}
```

- Vérification du rôle **côté serveur**, jamais un simple masquage de bouton.
- La service-role ne quitte jamais le serveur (`ns-auth`).
- Les actions destructives et les changements de statut sont journalisés :
  qui, quoi, quand.

---

## Checklist de sortie

- [ ] Aucun mot technique à l'écran — ni SKU, ni variante, ni slug, ni centime
- [ ] Ajouter un article simple prend moins de 30 secondes, sans cocher la case variantes
- [ ] La grille de variantes est générée, jamais saisie ligne par ligne
- [ ] Un article s'enregistre en brouillon ; la mise en vente est un geste distinct
- [ ] « Retirer de la vente » proposé avant toute suppression
- [ ] La confirmation de suppression nomme l'article
- [ ] Le téléphone du client est cliquable depuis la commande
- [ ] L'avancement d'une commande tient en un bouton
- [ ] Testé sur un écran de téléphone, cibles ≥ 44 px
- [ ] Rôle vérifié côté serveur sur chaque action d'écriture
- [ ] `pnpm gate:accessibility` et `pnpm design:tokens:audit` passent

## Liens

- `ns-ecommerce` — le domaine et ses trois pièges
- `ns-whatsapp` — prévenir le commerçant d'une nouvelle commande
- `ns-dashboard` — règles générales d'écran d'application
- `ns-error-states`, `ns-antislop`
