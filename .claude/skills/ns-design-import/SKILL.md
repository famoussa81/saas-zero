---
name: ns-design-import
description: "Importer un design system existant (artifact Claude, maquette HTML/CSS, Figma, captures) et le convertir en tokens du projet. À utiliser quand l'utilisateur arrive avec un design déjà fait — la pipeline s'y conforme au lieu d'en inventer un nouveau."
---

# Skill `ns-design-import` — Partir d'un design existant

> **But** : quand l'utilisateur a **déjà** un design (fait avec Claude, dans Figma, une maquette HTML, ou même des captures), la pipeline ne doit **rien réinventer**. Elle extrait, formalise en tokens, et s'y conforme.
>
> **Remplace** : `ns-design-direction` (on ne choisit pas de direction, elle existe déjà).
> **Sortie** : `src/styles/globals.css` + `tailwind.config.ts` alignés sur le design source, `DESIGN-CHOICE.md` documentant l'origine.

---

## Règle d'or

> **Le design de l'utilisateur fait autorité. En cas de doute, on lui demande — on n'improvise pas.**

Ordre de priorité, du plus fort au plus faible :

1. Ce que l'utilisateur dit explicitement
2. Ce que le design source montre
3. Les conventions du projet (`CLAUDE.md`)
4. Les défauts de la pipeline

---

## Étape 0 — Identifier la forme de la source

| Source                         | Extraction                                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| **`DESIGN.md`**                | **Chemin privilégié.** Format lisible par un agent, voir la convention ci-dessous.             |
| **Artifact Claude / HTML+CSS** | Lire le fichier, parser les `:root { --* }` et les valeurs récurrentes. Le plus fiable.        |
| **URL en ligne**               | `WebFetch` ou ouvrir dans le navigateur → lire les computed styles                             |
| **Figma**                      | Demander l'export des variables/tokens (JSON), ou les valeurs à la main                        |
| **Captures d'écran**           | Lire l'image, relever les couleurs dominantes → **faire valider chaque hex** par l'utilisateur |
| **Description orale**          | Reformuler en 2 propositions et faire choisir                                                  |

Si l'utilisateur mentionne un design sans fournir le fichier : **demander le fichier ou le lien avant de coder quoi que ce soit.**

---

## La convention `DESIGN.md`

C'est le format à privilégier : un agent le lit sans interprétation, il se
versionne, il se relit six mois plus tard. Un fichier `DESIGN.md` déposé à la
racine du projet est détecté et importé sans autre instruction.

Ce que le fichier doit contenir pour être exploitable **sans poser de
question** :

```markdown
# DESIGN — <nom du produit>

## Palette

| Rôle       | Clair     | Sombre    |
| ---------- | --------- | --------- |
| background | `#F7F6F4` | `#101015` |
| foreground | `#16181D` | `#E9EBEF` |
| primary    | `#4A2FD0` | `#A68BFA` |
| accent     | `#B45309` | `#F59E0B` |
| border     | `#E2E5EA` | `#262A33` |

## Typographie

- **Display** : Unbounded — titres uniquement
- **Corps** : Instrument Sans
- **Mono** : IBM Plex Mono — chiffres et code

## Rayons, ombres, espacement

- `--radius` : 10px
- Ombres : deux niveaux maximum, `sm` et `lg`
- Échelle d'espacement : celle de Tailwind, sans valeur arbitraire

## Élément signature

Ce qui rend le produit reconnaissable en moins de trois secondes, et où il
apparaît.

## Motion

Palier : Minimal | Moderate | Bold. Durées, easing.

## Interdits

Ce qu'on ne veut voir nulle part.
```

**Ce qui manque bloque, ce qui est ambigu se demande.** Une palette sans mode
sombre est acceptable — le skill dérive le second thème et le fait valider.
Une palette sans rôles nommés ne l'est pas : `#4A2FD0` sans savoir si c'est
la couleur d'action ou une couleur de marque ne se convertit pas en token.

**Le format compte moins que la complétude.** Un `DESIGN.md` écrit autrement
mais qui donne rôles, valeurs et interdits s'importe très bien. Cette
convention est un gabarit, pas une grammaire à respecter au caractère près.

Deux catalogues publics diffusent des `DESIGN.md` prêts à l'emploi —
[VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md)
et le catalogue de [nexu-io/open-design](https://github.com/nexu-io/open-design)
(151 paquets, chacun avec `manifest.json`, `DESIGN.md` et `tokens.css`). Les
deux sont sous licence MIT. Un fichier venu de là s'importe comme n'importe
quel autre — en vérifiant que la §« Ce qu'on ne reprend PAS » est appliquée,
sans quoi le projet hérite de l'identité d'une marque existante.

---

## Étape 1 — Extraire

### Depuis un artifact Claude / HTML

Ces pages déclarent presque toujours leurs tokens en clair :

```bash
# Repérer les custom properties
grep -oE '\-\-[a-z-]+:\s*[^;]+;' design-source.html | sort -u

# Repérer les couleurs en dur restantes
grep -oE '#[0-9a-fA-F]{3,8}' design-source.html | sort | uniq -c | sort -rn
```

Les valeurs les plus fréquentes sont les couleurs structurelles (fond, texte, bordure). L'accent est souvent rare mais présent aux endroits clés (CTA, liens).

### Grille d'extraction à remplir

```
Fond (clair)        : #______     Fond (sombre)      : #______
Texte principal     : #______     Texte secondaire   : #______
Bordure             : #______     Surface / carte    : #______
Accent principal    : #______     Accent secondaire  : #______
Success / Warning / Danger        : #______ / #______ / #______

Fonte display       : ____________  (poids utilisés : ___)
Fonte body          : ____________  (poids utilisés : ___)
Fonte mono          : ____________

Rayon de base       : ____px       Échelle typo (ratio) : ____
Ombres              : combien de niveaux ? ____
Élément signature   : ______________________________
```

Toute case vide = **question à l'utilisateur**, pas une invention.

---

## Étape 2 — Convertir en tokens du projet

Le starter utilise des couleurs HSL **sans fonction** (format Tailwind/shadcn) :

```css
/* globals.css — format attendu : "H S% L%" sans hsl() */
:root {
  --primary: 255 85% 45%; /* et non #6d5bd0 ni hsl(255 85% 45%) */
}
```

**Conversion hex → format attendu** :

```js
// Utilitaire ponctuel
const hexToHslParts = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};
```

**Mapping vers les variables du projet** :

| Rôle extrait             | Variable projet          |
| ------------------------ | ------------------------ |
| Fond                     | `--background`           |
| Texte principal          | `--foreground`           |
| Surface / carte          | `--card`, `--popover`    |
| Accent principal         | `--primary` (+ `--ring`) |
| Accent secondaire        | `--accent`               |
| Bordure                  | `--border`, `--input`    |
| Gris de texte secondaire | `--muted-foreground`     |

Les échelles (`--font-size-*`, `--shadow-*`, `--radius-*`) sont déjà câblées dans `tailwind.config.ts` → il suffit de changer les valeurs, pas la plomberie.

### Fontes

Si le design utilise des fontes Google :

```tsx
// app/[locale]/layout.tsx
import { Syne, DM_Sans } from "next/font/google";
const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
```

Si fonte custom (fichier fourni) → `public/fonts/` + `@font-face` dans `globals.css`, avec `font-display: swap`.

---

## Étape 3 — Ce qu'on ne reprend PAS

Un design source est souvent une **page unique**. Le SaaS a besoin de plus. Il faut donc **étendre** sans trahir :

| Manque fréquent                | Comment l'étendre                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Thème sombre absent            | Le dériver : inverser les luminosités, **pas** les teintes ; revérifier les contrastes               |
| États (hover/focus/disabled)   | Dériver de l'accent : `-10%` de luminosité au hover, ring visible au focus                           |
| Couleurs sémantiques           | Les choisir distinctes de l'accent, faire valider                                                    |
| Composants d'app (table, form) | Appliquer les tokens aux primitives shadcn existantes                                                |
| Densité dashboard              | Le design marketing est aéré ; l'app est dense → réduire l'échelle d'espacement, garder les couleurs |

**Faire valider ces extensions par l'utilisateur** — c'est là qu'on trahit un design sans s'en rendre compte.

---

## Étape 4 — Vérifier la fidélité

```bash
pnpm design:check        # 0 valeur hardcodée, coverage tokens ≥ 90%
pnpm build               # les classes Tailwind doivent survivre au purge
```

Puis **comparer visuellement** : ouvrir le design source et la page produite côte à côte. Vérifier dans cet ordre :

1. Les couleurs correspondent-elles (pas juste "proches") ?
2. La hiérarchie typographique est-elle la même (tailles relatives, poids) ?
3. Les rythmes d'espacement sont-ils respectés ?
4. Les rayons et ombres ?

**Contraste** : le design source n'est pas forcément accessible. Vérifier WCAG AA (4.5:1 texte courant). Si le source échoue → le signaler à l'utilisateur et **proposer** un ajustement, ne pas corriger en silence.

---

## Étape 5 — Documenter l'origine

Dans `DESIGN-CHOICE.md` :

```markdown
## Direction Artistique — IMPORTÉE

**Source** : artifact Claude fourni par l'utilisateur le AAAA-MM-JJ
**Fichier** : `design-source/landing.html`

### Tokens extraits

| Rôle   | Valeur source | Variable projet          |
| ------ | ------------- | ------------------------ |
| Accent | `#6d5bd0`     | `--primary: 255 85% 45%` |

### Extensions ajoutées (absentes de la source, validées le AAAA-MM-JJ)

- Thème sombre : dérivé par inversion de luminosité
- États focus : ring 2px sur `--ring`

### Écarts assumés

- Contraste du texte secondaire du source : 3.8:1 → relevé à 4.5:1 (WCAG AA)
```

Sans cette trace, personne ne saura plus tard ce qui vient du design d'origine et ce qui a été inventé.

---

## Cas particulier — design partiel

L'utilisateur fournit **seulement** une palette, ou seulement un hero. Alors :

- Ce qui est fourni → autorité absolue
- Le reste → dérivé par cohérence, puis **soumis à validation**
- On ne bascule **pas** sur `ns-design-direction` (ça produirait un design concurrent)

---

## Liens

- `ns-design-direction` — quand il n'y a PAS de design existant
- `ns-design-system` — structure des tokens
- `design-audit` — gate #14
