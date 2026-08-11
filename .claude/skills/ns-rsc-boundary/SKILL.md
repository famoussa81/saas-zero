---
name: ns-rsc-boundary
description: "Règles et vérifications de la frontière Server/Client Components (Next.js App Router). Prévient la classe de bugs où une valeur non sérialisable passée en prop fait planter le rendu au runtime alors que typecheck et lint restent verts."
---

# Skill `ns-rsc-boundary` — Frontière Server / Client

> **But** : éviter une classe de bugs qui **passe le typecheck et le lint** mais casse la page au runtime. Vécu dans ce repo : la homepage entière plantait alors que `tsc --noEmit` et `eslint .` étaient verts.

---

## Le bug de référence

```tsx
// page.tsx — Server Component
import { Shield } from "lucide-react";
const features = [{ icon: Shield, title: "..." }]; // Shield = fonction React
return <FeatureGrid features={features} />; // FeatureGrid = "use client"
```

Runtime :

```
Functions cannot be passed directly to Client Components unless you explicitly
expose it by marking it with "use server".
```

**Pourquoi** : entre Server et Client Components, React **sérialise** les props. Une fonction n'est pas sérialisable. TypeScript ne le voit pas (le type est valide), ESLint non plus.

---

## Ce qui passe la frontière

| Sérialisable (OK)                        | Non sérialisable (casse)     |
| ---------------------------------------- | ---------------------------- |
| string, number, boolean, null, undefined | fonctions, méthodes          |
| Array, objets simples                    | composants React (référence) |
| Date, Map, Set, BigInt                   | classes, instances           |
| JSX déjà rendu (`children`)              | Symbol, getters/setters      |
| Promise                                  | closures                     |
| Server Actions (`"use server"`)          | clients Supabase / Stripe    |

---

## Les 5 règles

### 1. Icônes et composants : passer une clé, résoudre côté client

```tsx
// Server — donnée sérialisable
const features = [{ icon: "shield" as const, title: "Sécurité" }];

// Client — la map vit ici
const ICONS = { shield: Shield, zap: Zap } as const;
export interface Feature {
  icon: keyof typeof ICONS;
  title: string;
}
const Icon = ICONS[feature.icon];
```

Bonus : `keyof typeof ICONS` fait échouer le typecheck sur une clé inconnue.

### 2. `children` plutôt que des props composants

```tsx
// Marche : le JSX est rendu côté serveur, puis passé
<ClientWrapper><ServerContent /></ClientWrapper>

// Casse : on passe une référence de composant
<ClientWrapper content={ServerContent} />
```

### 3. Handlers : définis dans le Client Component

Un `onClick` ne se passe jamais depuis un Server Component. Soit le handler vit dans le composant client, soit c'est une Server Action.

### 4. Server Actions : marquées explicitement

```tsx
async function handleCheckout(formData: FormData) {
  "use server";
  const result = await startCheckout(formData);
  if (result.success && result.url) redirect(result.url);
}
<form action={handleCheckout}>   {/* OK : c'est une Server Action */}
```

### 5. `"use client"` le plus bas possible

Ne pas marquer une page entière client pour une animation. Isoler le composant animé, garder la page en Server Component (données, SEO, perf).

---

## Détection

### Grep — repérer les props suspectes

```bash
# Composants clients du projet
grep -rl '"use client"' components/ app/ --include=*.tsx

# Import d'icônes dans des fichiers page/layout (Server par défaut)
grep -rn 'from "lucide-react"' app/ --include=page.tsx
```

Une icône importée dans un `page.tsx` et passée en prop = signal fort.

### `next build` = le vrai filet

Une erreur de frontière RSC **fait échouer le build de production**. C'est la vérification décisive, plus fiable que typecheck et lint.

```bash
pnpm build   # doit passer avant tout commit d'un composant client
```

### Navigateur, onglet neuf

L'erreur apparaît dans la console **au runtime**. Attention : un onglet déjà ouvert garde son buffer de console et son overlay HMR — des erreurs déjà corrigées y restent affichées. Toujours vérifier dans un onglet neuf avant de conclure.

---

## Checklist avant de committer un Client Component

- [ ] `"use client"` en première ligne
- [ ] Toutes les props sont sérialisables (tableau ci-dessus)
- [ ] Aucun composant/fonction reçu en prop depuis un Server Component
- [ ] Les plugins GSAP sont enregistrés sous `typeof window !== "undefined"`
- [ ] `pnpm build` passe
- [ ] Page ouverte dans un **onglet neuf**, console vide

---

## Liens

- `ns-motion` — les composants animés sont tous des Client Components
- `ns-sections` — les sections reçoivent leurs données en props sérialisables
