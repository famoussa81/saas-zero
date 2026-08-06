---
name: ns-onboarding
description: Onboarding guidé "wow" à la première connexion — guide pas-à-pas, état configuré, première valeur le plus tôt possible. Utiliser pour la rétention dès l'arrivée.
---

# ns-onboarding — Le "wow" à la première connexion

> Ton pilier **rétention** : l'utilisateur doit s'installer, comprendre la valeur et **rester**.
> Un bon onboarding = moins d'abandon = plus de clients payants qui restent.

## Objectifs

1. Montrer la valeur **le plus tôt possible** (a-ha moment).
2. Rassurer et guider, pas assommer de formulaires.
3. Aboutir à "tout est configuré / première tâche réussie" en 3-5 étapes max.

## Pattern : progressif, une étape à la fois

```
00 Bienvenue (why)        → message court + CTA
01 Profil / Organisation  → prénom, nom de l'org (B2B), rôle
02 Connexion des sources  → première donnée/tâche (selon produit)
03 Configurer / Personaliser → settings clés
04 "Vive la première action" → CTA "Terminer" + state vide rempli
```

## Implémentation

- **Table `onboarding_step`** dans `user_profiles` (déjà prévu en migration shared core).
- Roué: `onboarding_completed BOOLEAN`, `onboarding_step TEXT`.
- Composant multi-étapes `app/[locale]/app/bienvenue` + progress bar.
- Enregistrer chaque étape franchie (`updateProfile` → server action).

```ts
// exemple de progression
const steps = ["welcome", "profile", "connect", "done"];
// GET current step depuis user_profiles.onboarding_step
// POST met à jour + redirige vers l'étape suivante
```

## Après "done"

- Rediriger vers `/app/tableau-de-bord`.
- Envoyer un email de bienvenue / de suite (voir ns-email, ns-retention).
- Marquer `onboarding_completed = true`.

## Empty state de l'app

- Le dashboard doit guider si rien n'est encore configuré (voir ns-dashboard).

## Checklist de sortie

- [ ] Parcours guidé 3-5 étapes, une à la fois
- [ ] Progression stockée en DB + reprise possible
- [ ] Aya sur milestone (first data, first action)
- [ ] Redirection après completion + email bienvenue
- [ ] L'utilisateur atteint la valeur < 5 minis
