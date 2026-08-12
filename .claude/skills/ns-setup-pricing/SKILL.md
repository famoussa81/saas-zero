---
name: ns-setup-pricing
description: "Chaîne complète du pricing : stratégie de tiers depuis la Discovery, création des produits/prix Stripe, configuration PLANS source unique, section pricing sur la landing (5 variantes de mise en page), branchement checkout + portail. Du prix décidé au paiement encaissé."
---

# Skill `ns-setup-pricing` — Du prix décidé au paiement encaissé

> **But** : le pricing est la seule partie du SaaS qui transforme l'usage en revenu. Ce skill couvre la chaîne entière — stratégie → Stripe → config → UI → checkout — avec **une source de vérité unique**.
>
> **Prérequis** : `DISCOVERY.md` section D (Monétisation) remplie.
> **Sortie** : produits Stripe créés, `lib/stripe.ts` configuré, section pricing en ligne, checkout fonctionnel.

---

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 21 primitives Radix + CVA déjà là. Ne pas les réécrire (et ne jamais en créer dans `components/ui/`).
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.

Si `DESIGN-CHOICE.md` est encore le template non rempli : s'arrêter et le signaler. Générer de l'UI sans direction artistique décidée produit exactement le générique que la pipeline existe pour éviter.

Aucune valeur en dur — couleur, espacement, rayon, ombre, taille de police. Avant de rendre la main :

```bash
pnpm design:tokens:audit
```

## Principe fondateur — une seule source de vérité

Les prix apparaissent à **3 endroits** : la landing publique, la page facturation connectée, et Stripe. S'ils divergent, le client voit un prix et paie l'autre. Inacceptable.

```
lib/stripe.ts  ──PLANS──┬──► section Pricing (landing publique)
       │                ├──► page /facturation (connecté)
       │                └──► createCheckoutSession(priceId)
       │
       └── stripePriceId lu depuis process.env ──► Stripe (prix réels)
```

**Règle** : aucun prix écrit en dur dans un composant. Jamais. Le composant lit `PLANS`.

---

## Étape 1 — Stratégie des tiers (depuis la Discovery)

### Nombre de tiers

| Tiers             | Quand                                            |
| ----------------- | ------------------------------------------------ |
| 2 (Free + Pro)    | Produit simple, une seule proposition de valeur  |
| 3 (Free/Pro/Team) | **Défaut recommandé** — permet l'effet d'ancrage |
| 4 (+ Enterprise)  | Si vente B2B avec devis / SSO / contrat          |

Au-delà de 4 : paralysie du choix.

### Axe de scaling — choisir UN axe

Le prix doit monter avec **une** métrique que le client comprend et qui suit sa valeur reçue :

- **Sièges** (membres) → collaboratif, B2B
- **Usage** (requêtes, Go, exécutions) → API, infra
- **Projets / ressources** → outils de création
- **Fonctionnalités** → le plus faible, à éviter seul

Anti-pattern : scaler sur 3 axes à la fois → le client ne peut pas prévoir sa facture.

### Ancrage

Le tier du milieu est celui qu'on veut vendre → il est mis en avant (`highlight`). Le tier haut existe en partie pour rendre le tier du milieu raisonnable.

### Annuel

Remise standard **-20%** (2 mois offerts). Améliore la trésorerie et le churn. À implémenter comme prix Stripe séparés (`STRIPE_PRICE_PRO_YEARLY`).

---

## Étape 2 — Créer les produits dans Stripe

**Mode test d'abord** (`sk_test_...`). Ne jamais toucher le live avant que tout le flux soit vérifié.

### Via Dashboard (recommandé pour démarrer)

1. Stripe Dashboard → Products → **+ Add product**
2. Un produit par tier payant (Starter, Pro, Enterprise)
3. Pour chacun : prix récurrent mensuel → copier le `price_...`
4. Optionnel : ajouter un 2ᵉ prix annuel au **même** produit

### Via CLI (reproductible)

```bash
stripe products create --name="Pro" --description="Pour les équipes qui scalent"
stripe prices create --product=prod_XXX --unit-amount=4900 --currency=eur \
  --recurring[interval]=month
```

> `unit-amount` est en **centimes**. 4900 = 49,00 €.

### Renseigner l'environnement

```bash
# .env.local — les noms doivent correspondre à lib/stripe.ts
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
```

---

## Étape 3 — Configurer `PLANS`

`lib/stripe.ts` porte la définition unique :

```ts
export const PLANS: Record<"free" | "starter" | "pro" | "enterprise", Plan> = {
  free: plan("Free", null, 0, ["1 projet", "Auth", "Communauté"], {
    projects: 1,
    members: 1,
    storage: 1,
  }),
  pro: plan(
    "Pro",
    process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_default",
    49,
    ["Projets illimités", "20 membres", "Support prioritaire"],
    { projects: -1, members: 20, storage: 100 },
  ),
  // ...
};
```

**Conventions** :

- `-1` = illimité dans `limits`
- `price` = montant en **euros entiers** (affichage), `stripePriceId` = l'ID Stripe (paiement)
- `features` = 3-4 lignes max par tier, formulées en **bénéfice**, pas en spec technique
- Le tier gratuit a `stripePriceId: null`

### Gating (appliquer les limites)

Les `limits` ne servent à rien si rien ne les vérifie. Créer un helper serveur :

```ts
// lib/plan-limits.ts
export async function assertWithinLimit(
  orgId: string,
  resource: "projects" | "members",
): Promise<void> {
  const plan = await getPlanForOrg(orgId);
  const max = plan.limits[resource];
  if (max === -1) return; // illimité
  const current = await countResource(orgId, resource);
  if (current >= max) {
    throw new Error(
      `Limite ${resource} atteinte (${max}). Passez au plan supérieur.`,
    );
  }
}
```

Appelé dans les server actions de création. Sinon le pricing est décoratif.

---

## Étape 4 — La section Pricing (5 variantes)

**Anti-répétition** : ne pas reprendre la même grille de cartes sur chaque projet. Choisir la variante selon le produit (cf. `ns-design-direction`).

| Variante                  | Quand                                    | Forme                                       |
| ------------------------- | ---------------------------------------- | ------------------------------------------- |
| **A. Cartes côte à côte** | 3-4 tiers, features courtes              | Grille, tier milieu surélevé + badge        |
| **B. Tableau comparatif** | Features nombreuses, achat rationnel B2B | Lignes = features, colonnes = tiers, ✓/—    |
| **C. Curseur d'usage**    | Pricing à l'usage                        | Slider → prix calculé en direct             |
| **D. Deux colonnes**      | 1 seul tier payant                       | Free à gauche, Pro à droite, contraste fort |
| **E. Un seul prix**       | Produit à proposition unique             | Grand chiffre, liste centrée, un CTA        |

### Implémentation variante A (référence dans ce repo)

```tsx
{
  (
    [
      { key: "free", plan: PLANS.free, highlight: false },
      { key: "pro", plan: PLANS.pro, highlight: true },
    ] as const
  ).map(({ key, plan, highlight }) => (
    <div
      key={key}
      data-testid={`pricing-${key}`}
      className={
        highlight
          ? "border-primary shadow-xl scale-[1.03]"
          : "border-border/50 hover-lift"
      }
    >
      {highlight && <span className="...">Populaire</span>}
      <span>{plan.price === 0 ? "0€" : `${plan.price}€`}</span>
      {plan.features.map((f) => (
        <li key={f}>{f}</li>
      ))}
    </div>
  ));
}
```

Référence complète : section `data-testid="landing-pricing"` dans `app/[locale]/page.tsx`.

### Règles de rédaction

- Le CTA du tier gratuit dit ce qu'il fait (« Commencer gratuitement »), pas « Choisir »
- Pas de « Contactez-nous » sauf pour Enterprise réel
- Afficher TTC/HT explicitement si B2C européen
- Mentionner « annulable à tout moment » sous les CTA → lève l'objection n°1

---

## Étape 5 — Brancher le checkout

Le CTA d'un tier payant mène à `/inscription` (compte requis avant paiement), puis la page facturation déclenche le checkout.

```ts
// lib/actions/billing.ts — déjà implémenté dans ce repo
const customer = await getOrCreateCustomer({ userId, email, name });
await supabase.from("stripe_customers").upsert(
  {
    user_id: user.id,
    stripe_customer_id: customer.id,
    email,
  },
  { onConflict: "stripe_customer_id" },
);

const session = await createCheckoutSession({
  customerId: customer.id,
  priceId: plan.stripePriceId,
  successUrl: `${appUrl}/fr/facturation?checkout=success`,
  cancelUrl: `${appUrl}/fr/facturation?checkout=canceled`,
  metadata: { userId: user.id },
});
redirect(session.url);
```

**Le webhook est obligatoire** — sans lui, le paiement réussit mais l'app ne le sait jamais. Voir `app/api/webhooks/stripe/route.ts` (vérification de signature + idempotence via `stripe_webhook_events` + sync `stripe_subscriptions`).

---

## Étape 6 — Vérifier pour de vrai

```bash
# 1. Webhook en local, événements réels (pas des mocks)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 2. Dans un autre terminal : parcours complet
#    landing → inscription → facturation → checkout → carte test 4242 4242 4242 4242

# 3. Vérifier que la souscription est bien arrivée en base
#    (stripe_subscriptions doit avoir une ligne 'active')
```

**Checklist de sortie** :

- [ ] Les prix de la landing == ceux de Stripe (les deux lisent `PLANS`)
- [ ] Checkout redirige vers Stripe et revient sur `?checkout=success`
- [ ] `stripe_subscriptions` contient la ligne après paiement (webhook OK)
- [ ] Le portail client ouvre et permet l'annulation
- [ ] Les `limits` sont réellement appliquées côté serveur
- [ ] `pnpm typecheck && pnpm lint && pnpm test` verts
- [ ] Vérifié dans un navigateur, onglet neuf, 0 erreur console

---

## Passage en production

1. Recréer les produits/prix en **mode live** (les IDs test ne fonctionnent pas en live)
2. Mettre les `price_...` live dans les variables d'environnement Vercel
3. Créer l'endpoint webhook live dans Stripe Dashboard → copier le `whsec_...` live
4. `STRIPE_SECRET_KEY` live côté serveur uniquement, jamais exposée

---

## Liens

- `ns-billing` — abonnements, portail, webhooks en profondeur
- `ns-design-direction` — quelle variante de section pricing
- `ns-sections` — les autres archétypes de la landing
- ADR-004 — Stripe pour le billing
