---
name: ns-docs
description: Écrire la documentation produit canonique (README, guide, onboarding, API). Équivalent gratuit de NS Build Docs (NowStack). Utiliser pour documenter un SaaS.
---

# ns-docs — Documentation produit canonique

> Équivalent de "NS Build Docs" (NowStack). But : une doc claire qui rassure ("des pros")
> et guide l'utilisateur, plutôt qu'un README fourre-tout.

## Ce qui est "canonique"

1. **README.md** — 30 secondes pour comprendre : quoi, vite fait, install, commandes.
2. **Guide de début** (`docs/GETTING-STARTED.md`) — première utilisation pas-à-pas.
3. **Onboarding / usage** — complément du skill `ns-onboarding`.
4. **API** (si endpoint publics) — chaquerequest/resp, exemples, erreurs.
5. **FAQ support** — ce qui répond aux objections (relié à `ns-landing`).

## Principes d'écriture

- **Court d'abord, détail ensuite** : un paragraphe pour comprendre, puis les détails.
- **Actif et concret** : "tu crées X en 3 clics", pas de jargon flou.
- **Précis, jamais inventé** : chaque commande vérifiée (typecheck/lint passent), chaque route
  réelle. Si quelque chose n'existe pas, ne pas l'écrire.
- **La forme rassure** : pas de fautes, pas de "Lorem ipsum", cohérent avec la marque
  (mêmes tokens/branding, voir ns-design-system).

## Structure type d'un dossier docs/

```
README.md
docs/
  GETTING-STARTED.md
  ONBOARDING.md   (si différent du in-app)
  API.md          (si API publique)
  FAQ.md
  TROUBLESHOOTING.md
```

## Checklist de sortie

- [ ] README : 30 secondes pour comprendre
- [ ] GETTING-STARTED pas-à-pas vérifié
- [ ] FAQ qui répond aux objections clés
- [ ] Aucune commande inventée (toutes vérifiées)
- [ ] Ton "des pros", cohérent avec la marque
