---
name: ns-sentry
description: Triage et correction des erreurs de production via Sentry. Classe par coût réel (occurrences × utilisateurs), lit variables et stack, remonte au déploiement fautif, propose un correctif. Utiliser quand "qu'est-ce qui casse en prod".
---

# ns-sentry — "Qu'est-ce qui casse en production ?"

> Source : le kit charge-sentry. Transforme un flux d'erreurs en décision : quoi corriger d'abord,
> pourquoi ça casse, quel correctif. INDISPENSABLE pour tenir la promesse "zéro bug" EN PROD.

## Accès

- **MCP `sentry-mcp`** : conversation/exploration (subagent).
- **CLI `sentry`** (nouvelle, "for developers and agents") : output JSON, scripts/CI.
  - `sentry issue list` (détecte le projet depuis .env)
  - `sentry issue explain APP-QX` (cause racine)
  - `sentry issue plan` (correctif étape par étape)
  - ⚠️ ne pas confondre avec l'ancienne `sentry-cli` (releases/sourcemaps).

## Règles non négociables

1. **Ne jamais refermer une issue soi-même** → l'agent propose, l'humain tranche et ferme.
2. **Classer par coût** : occurrences × nombre d'utilisateurs, JAMAIS par date.
3. **Ne pas conclure sur le seul message d'erreur** → toujours ouvrir un événement réel, lire variables locales.
4. **Vérifier l'environnement** : dev mélangé aux erreurs des users fausse le classement.
5. **Ne pas inventer de correctif** : si la stack ne suffit pas, le dire et demander le contexte manquant.

## Procédure

1. **Lister + classer** les issues non résolues par coût. Écarter le bruit (extensions browser, robots, erreurs réseau client).
2. **Ouvrir la plus coûteuse** : stack trace + variables locales sur le dernier événement.
3. **Croiser avec le code** : remonter au fichier/ligne fautif, puis au **déploiement** qui a introduit le bug.
4. **Proposer un correctif** étape par étape (unit test qui reproduit → fix → PR).
5. **Laisser l'humain** approuver et fermer l'issue.

## Intégration au projet

- Installer Sentry SDK dans l'app Next.js : `@sentry/nextjs` (voir le guide du kit / setup-sentry-nextjs).
- DSN en env var (`SENTRY_DSN`), pas en clair.
- Coupler au load test (ns-load-test) pour distinguer erreurs de saturation vs erreurs de code.

## Checklist de sortie

- [ ] Sentry branché (+ DSN configuré)
- [ ] Issues triées par coût, jamais par date
- [ ] Boucle : renvoyer à l'humain pour fermer
- [ ] Procédure documentée pour "qu'est-ce qui casse en prod"
- [ ] Test de charge avant (ns-load-test) pour différencier saturation vs bug
