---
name: ns-error-states
description: "Gabarits pour tous les états non-nominaux d'une interface : vide, chargement, erreur, hors-ligne, permission refusée, résultat introuvable. Couvre les Error Boundaries React, les fichiers loading.tsx/error.tsx/not-found.tsx de Next.js, et la rédaction des messages."
---

# Skill `ns-error-states` — Les états que personne ne dessine

> **But** : un écran n'a pas un état, il en a six. La plupart des interfaces ne dessinent que le cas nominal — puis l'utilisateur tombe sur un écran blanc, un spinner infini, ou « Something went wrong ».
>
> `CLAUDE.md` liste « No error boundaries / loading states » comme anti-pattern. Ce skill est la réponse.

---

## Les 6 états de tout écran affichant des données

| État                     | Quand                          | Ce que l'utilisateur doit comprendre   |
| ------------------------ | ------------------------------ | -------------------------------------- |
| **Nominal**              | Données présentes              | —                                      |
| **Chargement**           | Requête en cours               | « ça arrive », pas « c'est cassé »     |
| **Vide (premier usage)** | Aucune donnée, normal          | Quoi faire pour démarrer               |
| **Vide (filtre)**        | Recherche/filtre sans résultat | Comment élargir                        |
| **Erreur**               | La requête a échoué            | Ce qui s'est passé + comment réessayer |
| **Interdit**             | Droits insuffisants            | Pourquoi, et à qui demander            |

**Règle** : ne pas livrer un écran tant que ses états applicables ne sont pas dessinés.

---

## Fichiers Next.js App Router

Le routeur fournit des conventions par segment. Les utiliser plutôt que de bricoler.

```
app/[locale]/(app)/projets/
├── page.tsx          # nominal
├── loading.tsx       # affiché pendant le chargement du segment
├── error.tsx         # Error Boundary du segment ("use client" obligatoire)
└── not-found.tsx     # notFound() appelé dans page.tsx
```

### `loading.tsx` — squelette, pas spinner

```tsx
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
```

Le squelette doit avoir **la forme du contenu réel** — sinon la page saute au chargement (CLS).

### `error.tsx` — Error Boundary de segment

```tsx
"use client"; // obligatoire

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error); // sinon l'erreur est invisible
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="font-display text-xl font-bold text-foreground">
        Impossible de charger vos projets
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        La connexion a échoué. Vos données sont intactes.
      </p>
      <Button onClick={reset} className="mt-6">
        Réessayer
      </Button>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Référence : {error.digest}
        </p>
      )}
    </div>
  );
}
```

Le `digest` est l'identifiant que l'utilisateur communique au support — il relie l'écran au log Sentry.

### `global-error.tsx` — filet de dernier recours

À la racine de `app/`. Remplace tout le layout (donc doit inclure `<html>` et `<body>`). Ne s'affiche que si le layout racine lui-même plante.

---

## Composant `EmptyState` réutilisable

```tsx
// components/ui/empty-state.tsx
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode; // ReactNode : passable depuis un Server Component
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

> `action` est un `ReactNode` (JSX déjà rendu) et non une fonction — cf. `ns-rsc-boundary`.

### Les deux vides ne se traitent pas pareil

```tsx
// Premier usage : c'est une OPPORTUNITÉ d'onboarding
<EmptyState
  title="Créez votre premier projet"
  description="Un projet regroupe vos tâches et votre équipe. Commencez par lui donner un nom."
  action={<Button>Nouveau projet</Button>}
/>

// Filtre sans résultat : c'est une IMPASSE, il faut une sortie
<EmptyState
  title={`Aucun résultat pour « ${query} »`}
  description="Vérifiez l'orthographe ou élargissez vos filtres."
  action={<Button variant="outline">Réinitialiser les filtres</Button>}
/>
```

Erreur classique : afficher « Aucune donnée » dans les deux cas. Le premier usage mérite un accueil, pas un constat.

---

## Rédaction des messages

| Interdit                              | Pourquoi                  | À la place                                     |
| ------------------------------------- | ------------------------- | ---------------------------------------------- |
| « Une erreur est survenue »           | N'informe de rien         | « Impossible d'enregistrer vos modifications » |
| « Error 500 »                         | Jargon serveur            | Ce que l'utilisateur ne peut pas faire         |
| « Oups ! 😅 »                         | Minimise un problème réel | Ton neutre et factuel                          |
| « Veuillez réessayer ultérieurement » | Passif, sans issue        | Un bouton « Réessayer »                        |
| « Invalid input »                     | Ne dit pas quoi corriger  | « L'email doit contenir un @ »                 |

**Structure** : _ce qui n'a pas marché_ → _ce qui est préservé_ → _quoi faire maintenant_.

> « Impossible d'enregistrer vos modifications. Votre texte est conservé dans cet onglet. Réessayez ou copiez-le ailleurs. »

---

## États des Server Actions

Les server actions du repo renvoient déjà `{ success, error }`. Côté client, exploiter `useFormStatus` / `useActionState` :

```tsx
"use client";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}
```

**Trois obligations** : bouton désactivé pendant l'envoi (double soumission), libellé qui change (le disabled seul ne dit rien), erreur affichée **près du champ** concerné.

---

## Accessibilité

- Chargement : `aria-busy="true"` + `aria-live="polite"`
- Erreur : `role="alert"` (annoncé immédiatement)
- Erreur de champ : `aria-invalid` + `aria-describedby` pointant sur le message
- Ne jamais signaler une erreur **par la couleur seule** — icône ou texte en plus

---

## Checklist par écran

- [ ] `loading.tsx` avec squelette à la forme du contenu
- [ ] `error.tsx` avec `reset()` et report Sentry
- [ ] Vide premier usage : titre + action qui démarre
- [ ] Vide après filtre : sortie pour élargir
- [ ] Interdit : explication + recours
- [ ] Messages : pas de jargon, pas d'emoji, une action possible
- [ ] Boutons de soumission : disabled + libellé qui change
- [ ] `role="alert"` sur les erreurs

---

## Liens

- `ns-sentry` — capture et triage des erreurs de production
- `ns-component-kit` — `EmptyState` et primitives associées
- `ns-forms` — validation et erreurs de champ
