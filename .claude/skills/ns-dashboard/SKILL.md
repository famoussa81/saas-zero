---
name: ns-dashboard
description: L'app produit protégée — layout (app), tableau de bord avec stats réelles, pages (tableau de bord, équipe, réglages, facturation, clés API). Utiliser pour le cœur de l'app après login.
---

# ns-dashboard — L'app produit (zone protégée)

> Layout `(app)` protégé par le middleware. C'est là que l'utilisateur "reste" : habitude, valeur, onboarding.
>
> La landing se visite une fois. Le dashboard se subit tous les jours. Un écran
> de travail médiocre coûte plus cher qu'une landing médiocre — il use le client
> déjà payant.

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 16 primitives Radix + CVA déjà là. Ne pas les réécrire.
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.

Si `DESIGN-CHOICE.md` est encore le template non rempli : s'arrêter et le signaler. Générer de l'UI sans direction artistique décidée produit exactement le générique que la pipeline existe pour éviter.

Aucune valeur en dur — couleur, espacement, rayon, ombre, taille de police. Avant de rendre la main :

```bash
pnpm design:tokens:audit
```

## Structure de routes (Next App Router)

```
app/[locale]/app/  (ou (app))
    tableau-de-bord/   → stats clés
    equipe/            → membres + invitations + rôles
    reglages/          → profil, notifications, sécurité (MFA/sessions), suppression compte
    facturation/       → plan, usage, factures, portal Stripe
    cles-api/          → CRUD API keys (si le SaaS en expose)
```

## Layout (app)

- **Sidebar** responsive (drawer mobile) : nav principale + org switcher (B2B).
- **Header** : user menu (avatar, nom, déconnexion), notifications.
- **Loading/Error boundaries** par route (`loading.tsx`, `error.tsx`).

### Détails qui font la différence

- **Item actif marqué autrement que par la couleur** : fond `bg-muted` + barre
  latérale ou `font-medium`. La couleur seule échoue au contraste et aux
  daltoniens.
- **`aria-current="page"`** sur l'item actif. Sans ça, un lecteur d'écran ne dit
  pas où on se trouve.
- **Largeur de contenu bornée** : `max-w-7xl mx-auto px-6`. Un tableau étalé sur
  un écran 32 pouces devient illisible.
- **Le layout ne refetch pas à chaque navigation** : user et org chargés dans
  `layout.tsx`, pas dans chaque page.
- **Skip link** vers le contenu principal, avant la sidebar.

## Dashboard avec stats réelles

> Pas de mock v1 permanent : de vraies données de la fonction produit + metrics utiles.
> Si certains chiffres n'existent pas encore, empty-states jolis, pas de fausses valeurs.

```tsx
// RSC serveur — fetch des stats
export default async function DashboardPage() {
  const supabase = createClient();
  const { data: stats } = await supabase.rpc("get_dashboard_stats"); // selon produit
  return <StatsGrid items={stats} />;
}
```

### Hiérarchie de la page — dans cet ordre

1. **Titre + sélecteur de période** (7/30/90 jours), pas un titre nu.
2. **Rangée de KPI** — 3 ou 4 maximum. Au-delà, plus personne ne lit.
3. **Un graphique principal** qui répond à la question centrale du produit.
4. **Une liste d'objets récents** avec action par ligne.

Pas de mur de cartes toutes identiques : c'est la signature du dashboard généré.

### Cartes KPI

Ordre de lecture : label discret, valeur dominante, variation qualifiée.

```tsx
<Card className="p-6">
  <p className="text-sm font-medium text-muted-foreground">Clics ce mois</p>
  <p className="mt-2 text-3xl font-semibold tabular-nums">
    {new Intl.NumberFormat(locale).format(value)}
  </p>
  <p className="mt-1 text-sm text-muted-foreground">
    <span className="text-emerald-600 dark:text-emerald-400">+12 %</span>
    {" vs mois précédent"}
  </p>
</Card>
```

- La **valeur domine**, le label est secondaire. L'inverse est le réflexe
  naturel, et il est faux.
- Une variation **sans référence temporelle** ne veut rien dire.
- **Pas de couleur sur la valeur** — seulement sur la variation, et seulement si
  le sens est univoque (une hausse de churn n'est pas verte).
- **`tabular-nums`** partout, sinon les chiffres dansent entre les lignes.

### Graphiques

`recharts` **n'est pas installé** dans ce dépôt :

```bash
pnpm add recharts
```

- **Couleurs depuis les tokens**, jamais la palette par défaut de la librairie —
  reconnaissable au premier regard et aveugle au dark mode.
- **Client Component** (`"use client"`), données fetchées côté serveur et
  passées en props sérialisables. Voir `ns-rsc-boundary` : c'est exactement la
  frontière où le rendu casse au runtime alors que typecheck reste vert.
- **Axe Y à zéro** pour toute comparaison de volumes.
- **Pas de camembert** au-delà de 3 parts.
- Charger le skill **`dataviz`** avant d'écrire le code du graphique — forme,
  palette catégorielle, tuiles de stat.

## Les cinq états, systématiquement

Un écran livré sans eux n'est pas fini.

| État            | Où              | Exigence                                |
| --------------- | --------------- | --------------------------------------- |
| **Chargement**  | `loading.tsx`   | Skeleton **à la forme du contenu réel** |
| **Vide**        | composant       | Icône + phrase de valeur + CTA          |
| **Erreur**      | `error.tsx`     | Cause lisible + « Réessayer »           |
| **Introuvable** | `not-found.tsx` | Retour vers un endroit utile            |
| **Sans droits** | garde serveur   | `notFound()`, jamais une page blanche   |

**Le skeleton doit avoir la forme du contenu.** Un spinner centré, ou trois
barres grises pour une grille de KPI, trahit le générateur. Le skeleton d'une
carte KPI est une carte de même taille, avec un bloc au gabarit du chiffre et un
au gabarit du label.

**L'état vide est un moment produit, pas un message d'échec.** « Aucune donnée »
est une capitulation. « Créez votre premier lien pour voir vos statistiques ici »
suivi d'un bouton, c'est un état vide qui travaille.

Première visite : état vide « wow » qui explique la valeur et renvoie vers
`ns-onboarding`. Détail complet : `ns-error-states`.

## Tables et listes

- **En-têtes collants** (`sticky top-0`) dès que la liste dépasse un écran.
- **Actions par ligne dans un `dropdown-menu`**, pas trois boutons qui saturent.
- **Pagination ou virtualisation au-delà de 50 lignes** — la démo cliente se
  passe toujours sur le compte qui a beaucoup de données.
- **Destructif = `dialog` de confirmation** avec le nom de l'objet dans le
  bouton (« Supprimer le lien `promo-ete` »), jamais « OK ».
- Colonnes numériques en `tabular-nums text-right`.

## Server actions / mutations

`createOrg`, `inviteMember`, `updateRole`, `createApiKey`, `updateProfile`…
→ validation Zod + RLS (voir ns-auth, ns-organizations).

- **Le même schéma Zod côté client et côté action.** Valider seulement côté
  client est une faille, pas une commodité.
- **`useFormStatus`** pour désactiver le submit pendant l'envoi : un double-clic
  sur un bouton actif crée deux enregistrements.
- **`revalidatePath`** après mutation, sinon l'utilisateur voit l'ancienne
  donnée et reclique.
- Erreur affichée **sous le champ**, pas seulement en toast — le toast disparaît
  avant d'être lu.

## Motion

Tier par défaut dans l'app protégée : **Minimal**. Une animation subie dix fois
par jour devient une nuisance — l'inverse du wow.

- Transitions d'état 150–200 ms, `ease-out`.
- **Aucune animation sur la donnée** : un chiffre qui compte à chaque
  rafraîchissement empêche de le lire.
- `prefers-reduced-motion` respecté. Recettes : `ns-motion`.

## Checklist de sortie

- [ ] Middleware protège `/app`
- [ ] Layout sidebar + header + org switcher + user menu
- [ ] Item de nav actif marqué autrement que par la couleur + `aria-current`
- [ ] Dashboard avec stats réelles (pas de mock éternel)
- [ ] 4 KPI maximum, valeur dominante, variation avec référence temporelle
- [ ] Graphique en Client Component, couleurs depuis les tokens, axe Y à zéro
- [ ] Les cinq états présents, skeleton à la forme du contenu
- [ ] Tables : actions groupées, pagination au-delà de 50 lignes, confirmation nommée
- [ ] Les deux thèmes vérifiés à l'œil
- [ ] `pnpm design:tokens:audit` et `pnpm gate:accessibility` passent
