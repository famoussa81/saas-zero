# UI-CONTRACT — le niveau d'exigence, opposable à tout skill

> Ce fichier est la **référence unique** de qualité d'interface. Tout skill qui
> produit du JSX s'y conforme : `ns-dashboard`, `ns-auth`, `ns-billing`,
> `ns-organizations`, `ns-onboarding`, `ns-admin`, `ns-retention`, `ns-forms`,
> `ns-landing`, `ns-setup-pricing`.
>
> Il existe parce que ces skills décrivaient quoi construire sans jamais dire à
> quel niveau. Un skill qui dit « dashboard avec stats » sans contrainte produit
> quatre cartes grises et un graphique par défaut — correct, et amateur.

---

## 0. Avant d'écrire la première ligne

Dans cet ordre, sans exception :

1. Lire **`DESIGN-CHOICE.md`** à la racine — palette, ambiance, élément
   signature, tier de motion. C'est la constitution ; elle prime sur ce fichier
   en cas de désaccord sur un choix esthétique.
2. Lire **`src/styles/globals.css`** — les tokens réellement définis. Ne jamais
   inventer un nom de token : utiliser ceux qui existent.
3. Lire **`src/components/ui/`** — les primitives déjà là (25 composants
   Radix + CVA). **Aucune raison d'en réécrire une.**

   Quatre portent du comportement, pas du style, et remplacent ce que chaque
   projet réécrivait : `Skeleton` (états de chargement à la forme du contenu),
   `DataTable` (tri clavier, `aria-sort`, vide, numérique), `Sheet` (panneau
   latéral — piège de focus, Échap, verrou du défilement) et `EmptyState`.

4. Si `DESIGN-CHOICE.md` est encore le template non rempli : **s'arrêter et le
   dire**. Générer de l'UI sans direction artistique décidée, c'est produire le
   générique que la pipeline existe pour éviter.

### Une seule maison pour les primitives

`src/components/ui/` est le **seul** emplacement des primitives. Ne jamais en
créer une dans `components/ui/`.

`tsconfig.json` mappe `@/components/*` sur deux dossiers :

```json
"@/components/*": ["./src/components/*", "./components/*"]
```

TypeScript retient le premier qui existe. Un même nom des deux côtés produit
donc un composant fantôme : celui de `components/` n'est jamais rendu, mais
reste modifiable, testable et documentable. On corrige alors un bouton que
personne ne voit.

Le dépôt a vécu avec onze doublons, dont neuf divergeaient — `select` faisait
159 lignes d'un côté (Radix, accessible) et 94 de l'autre (`<select>` natif) —
et deux stories Storybook documentaient la version morte.

`pnpm doctor` détecte désormais toute réapparition et échoue.

`components/` reste réservé aux composants **de domaine** : `marketing/`,
`forms/`, `links/`, `providers/`.

---

## 1. Tokens — la règle mécanique

Les tokens sont en format `H S% L%` **sans** wrapper `hsl()` :

```css
--primary: 255 85% 45%;
```

Donc en Tailwind : `bg-primary`, `text-primary-foreground`, `border-border`.
Jamais `bg-[#6d28d9]`, jamais `style={{ color: "#fff" }}`, jamais `p-[13px]`.

**Interdits, détectés par `pnpm design:tokens:audit` :**

| Interdit                | À la place                          |
| ----------------------- | ----------------------------------- |
| `#6366f1`, `rgb(...)`   | `bg-primary`, `text-accent`         |
| `p-[13px]`, `w-[347px]` | échelle Tailwind (`p-3`, `w-80`)    |
| `rounded-[10px]`        | `rounded-lg` (mappé sur `--radius`) |
| `shadow-[0_2px_...]`    | `shadow-sm` / `shadow-lg`           |
| `text-[15px]`           | `text-sm` / `text-base`             |
| `font-family` en dur    | `font-sans` / `font-display`        |

Deux exceptions, et deux seulement :

1. **Logos de marque tierce** (couleurs Google, etc.), déjà déclarés dans
   `allowedHardcoded` de `.design-auditrc.json`.
2. **Unités relatives dans une valeur arbitraire** — `h-[1em]`, `w-[50%]`. Ce
   qu'interdit la règle, c'est de _figer_ une mesure : `h-[17px]` casse
   l'échelle, `h-[1em]` la suit. Voir `Skeleton` variante `text`, qui doit
   épouser la taille de police du contexte.

Une dimension calculée au runtime (largeur d'une barre de progression, d'une
ligne de squelette) passe par `style={{ … }}` : ce n'est pas une décision
esthétique en dur, c'est de la donnée.

Vérification obligatoire avant de rendre la main :

```bash
pnpm design:tokens:audit
```

---

## 2. Densité et rythme — ce qui sépare le pro de l'amateur

L'erreur la plus visible d'une UI générée : **tout est espacé pareil**. Un
dashboard pro a un rythme vertical hiérarchisé.

**Échelle d'espacement, trois niveaux seulement :**

| Niveau          | Valeur            | Usage                           |
| --------------- | ----------------- | ------------------------------- |
| Intra-composant | `gap-2` / `gap-3` | label ↔ valeur, icône ↔ texte   |
| Inter-composant | `gap-4` / `gap-6` | entre cartes d'une même grille  |
| Inter-section   | `gap-10`/`gap-12` | entre blocs logiques d'une page |

**Largeur de contenu** : jamais pleine largeur brute. `max-w-7xl mx-auto px-6`
pour une page app, `max-w-prose` pour du texte long. Une ligne de texte au-delà
de ~75 caractères devient illisible.

**Hiérarchie typographique** : trois niveaux maximum par écran. Un titre de
page (`text-2xl font-semibold`), des titres de section (`text-sm font-medium
text-muted-foreground uppercase tracking-wide`), et le corps. Pas quatre tailles
qui se ressemblent.

**Alignement des nombres** : toute colonne numérique en `tabular-nums
text-right`. Sans ça les chiffres dansent d'une ligne à l'autre — signature
immédiate d'une table bâclée.

---

## 3. Les cinq états, systématiquement

Aucun écran n'est livré avec seulement l'état nominal. Cinq états, à chaque
fois, sinon l'écran n'est pas fini :

| État            | Où              | Exigence                                |
| --------------- | --------------- | --------------------------------------- |
| **Chargement**  | `loading.tsx`   | Skeleton **à la forme du contenu réel** |
| **Vide**        | composant       | Icône + phrase de valeur + CTA d'action |
| **Erreur**      | `error.tsx`     | Cause lisible + bouton « Réessayer »    |
| **Introuvable** | `not-found.tsx` | Retour vers un endroit utile            |
| **Sans droits** | garde serveur   | `notFound()`, jamais une page blanche   |

**Le skeleton doit avoir la forme du contenu.** Un spinner centré, ou trois
barres grises identiques pour une grille de KPI, trahit le générateur. Le
skeleton d'une carte KPI est une carte de la même taille, avec un bloc au
gabarit du chiffre et un au gabarit du label.

**L'état vide est un moment produit, pas un message d'échec.** « Aucune donnée »
est une capitulation. « Créez votre premier lien pour voir vos statistiques ici »
suivi d'un bouton, c'est un état vide qui travaille.

Détail complet : skill `ns-error-states`.

---

## 4. Data-viz — le piège numéro un du dashboard

`recharts` **n'est pas installé** dans ce dépôt. Avant tout graphique :

```bash
pnpm add recharts
```

Règles non négociables :

- **Couleurs depuis les tokens**, jamais la palette par défaut de la librairie.
  La palette par défaut de recharts est reconnaissable au premier coup d'œil et
  ignore ton dark mode.
- **Un graphique répond à une question.** Si tu ne peux pas écrire la question
  en une phrase, le graphique ne sert à rien — supprime-le.
- **Pas de camembert** au-delà de 3 parts. Barres horizontales à la place.
- **Axe Y qui commence à zéro** pour toute comparaison de volumes. Sinon le
  graphique ment visuellement.
- **Le graphique est un Client Component** (`"use client"`), les données sont
  fetchées côté serveur et passées en props sérialisables. Voir
  `ns-rsc-boundary` — c'est exactement la frontière où le rendu casse au
  runtime alors que typecheck reste vert.
- **Vide et chargement** : un graphique sans données affiche l'état vide de la
  §3, pas des axes nus.

Guidage complet sur le choix de forme, la palette catégorielle et les tuiles de
stat : charger le skill **`dataviz`** avant d'écrire du code de graphique.

---

## 5. Cartes KPI — le composant le plus souvent raté

Une carte KPI amateur affiche un nombre. Une carte KPI pro répond à « et
alors ? » :

```tsx
// Ordre de lecture : label discret → valeur dominante → variation qualifiée
<Card className="p-6">
  <p className="text-sm font-medium text-muted-foreground">Clics ce mois</p>
  <p className="mt-2 text-3xl font-semibold tabular-nums">12 480</p>
  <p className="mt-1 text-sm text-muted-foreground">
    <span className="text-emerald-600 dark:text-emerald-400">+12 %</span>
    {" vs mois précédent"}
  </p>
</Card>
```

- La **valeur domine**, le label est secondaire. L'inverse est le réflexe
  naturel et il est faux.
- Une variation **sans référence temporelle** ne veut rien dire : toujours
  « vs période ».
- **Pas de couleur sur la valeur elle-même** — seulement sur la variation, et
  seulement si le sens est univoque (une hausse de churn n'est pas verte).
- Quatre KPI maximum sur une ligne. Au-delà, plus personne ne lit.
- Les nombres en `tabular-nums`, formatés selon la locale
  (`Intl.NumberFormat`), pas concaténés à la main.

---

## 6. Tables et listes

**Utiliser `DataTable`** (`src/components/ui/data-table.tsx`) plutôt que de
repartir d'un `<table>`. Il porte le comportement que chaque écran oubliait :
tri au clavier via un vrai `<button>`, `aria-sort` qui fait annoncer le sens
du tri, squelette à la forme du contenu, état vide, colonnes numériques en
`tabular-nums text-right`, défilement horizontal confiné à son conteneur.

Le tri y est **contrôlé par l'appelant**, jamais interne : trier en mémoire ne
trierait que la page courante, ce qui est faux dès qu'il y a pagination. Le
composant signale l'intention, le serveur trie.

Il n'impose **aucune apparence** — tout vient des tokens. Deux projets aux
palettes différentes rendent des tableaux différents.

Les règles ci-dessous restent à la charge de l'appelant :

- **En-têtes collants** (`sticky top-0`) dès que la liste dépasse un écran.
- **Actions par ligne dans un menu** (`dropdown-menu`), pas trois boutons qui
  saturent la ligne.
- **Pagination ou virtualisation** au-delà de 50 lignes. Rendre 5 000 lignes
  d'un coup fait ramer le navigateur, et la démo cliente se passe toujours sur
  le compte qui a beaucoup de données.
- **Destructif = confirmation** via `dialog`, avec le nom de l'objet dans le
  texte du bouton (« Supprimer le lien `promo-ete` »), jamais « OK ».
- **Zebra striping : non.** Une bordure `border-border` suffit et vieillit
  mieux.

---

## 7. Formulaires

- `react-hook-form` + résolveur **Zod**, et **le même schéma Zod côté server
  action**. Valider seulement côté client est une faille, pas une commodité.
- **Erreur sous le champ**, jamais uniquement en toast — le toast disparaît
  avant d'être lu.
- **`aria-invalid` + `aria-describedby`** reliant le champ à son message. Sans
  ça un lecteur d'écran annonce l'erreur nulle part.
- **État `pending`** via `useFormStatus` : bouton désactivé + libellé qui change
  (« Envoi… »). Un double-clic sur un submit non désactivé crée deux
  enregistrements.
- **Autocomplete** renseigné (`email`, `current-password`, `new-password`) :
  gain réel pour l'utilisateur, coût nul.

---

## 8. Accessibilité — le plancher, pas l'option

Vérifié par `pnpm gate:accessibility` (axe-core, WCAG 2.1 AA) :

- **Contraste 4.5:1** sur le texte. `text-muted-foreground` sur `bg-muted` est
  le couple qui échoue le plus souvent — le tester, pas le supposer.
- **Focus visible** sur tout élément interactif. Ne jamais poser
  `outline-none` sans `focus-visible:ring-2 focus-visible:ring-ring` en face.
- **Cible tactile ≥ 44 px** sur mobile.
- **Un seul `<h1>` par page**, hiérarchie sans saut de niveau.
- **Icône seule ⇒ `aria-label`.** Un bouton avec juste une icône est muet pour
  un lecteur d'écran.
- **Couleur jamais seul porteur d'information** : ajouter texte ou icône.

---

## 9. Motion

Tier défini dans `DESIGN-CHOICE.md`. Par défaut, dans l'app protégée :
**Minimal**. Une animation qu'on subit dix fois par jour devient une nuisance —
c'est l'inverse du wow.

- Transitions d'état : **150–200 ms**, `ease-out`.
- **`prefers-reduced-motion` respecté** partout, sans exception.
- **Aucune animation sur la donnée** : un chiffre qui compte à chaque
  rafraîchissement empêche de le lire.
- L'élément signature vit sur la **landing** et les états vides, pas dans les
  écrans de travail quotidien.

Recettes : skill `ns-motion`.

---

## 10. Dark mode

Les deux thèmes sont livrés ensemble, jamais l'un « plus tard ».

- Toute couleur passe par un token qui a ses deux définitions dans
  `globals.css`.
- **Les ombres ne fonctionnent pas en sombre** : utiliser `border-border` pour
  détacher une surface, pas `shadow-lg`.
- Vérifier les deux thèmes **avant** de rendre la main — c'est deux captures,
  pas deux heures.

---

## 11. Ce qui interdit de considérer un écran comme livré

```bash
pnpm design:tokens:audit   # 0 valeur en dur
pnpm typecheck             # strict, aucun any
pnpm lint
pnpm gate:accessibility    # WCAG 2.1 AA
```

Plus, à l'œil : les cinq états de la §3 existent, les deux thèmes tiennent, et
l'écran ne pourrait pas être celui de n'importe quel autre SaaS.

Ce dernier point est vérifiable : `pnpm design:check` inclut
`ns-anti-generic-audit`, qui compare le rendu aux directions déjà produites.
