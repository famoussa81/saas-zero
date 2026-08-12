---
description: Lance les quality gates avec dégradation propre — PASS, FAIL ou SKIP
---

# `/ns-verify` — Vérification avant livraison

Phase 5 de la pipeline. Exécute les gates déterministes qui bloquent la livraison.

## Usage

```bash
pnpm gates:all        # tous les gates
pnpm gates:fast       # saute les lents (build, hydration, lighthouse, cwv)
pnpm gates:list       # inventaire + capacités de la machine, sans rien exécuter
pnpm gates:strict     # un SKIP devient bloquant — pour une release
```

Une sélection :

```bash
node .claude/scripts/run-gates.js typecheck lint design
```

**Commencer par `pnpm gates:list`** : il montre ce qui est exécutable ici et pourquoi le reste ne l'est pas, sans rien lancer.

## Les trois issues

| Issue    | Sens                                              | Bloquant |
| -------- | ------------------------------------------------- | -------- |
| **PASS** | A tourné, réussi                                  | —        |
| **FAIL** | A tourné, vrai problème                           | oui      |
| **SKIP** | Prérequis absent, avec la commande d'installation | non      |

Un outil manquant ne fait jamais échouer la vérification. Il produit un SKIP visible dans le résumé.

## Gates

Le registre fait foi : [`.claude/gates.config.js`](../gates.config.js). Chaque entrée déclare sa commande et ses prérequis.

| Sans prérequis                         | Playwright requis                  | Autres                        |
| -------------------------------------- | ---------------------------------- | ----------------------------- |
| `discovery` `typecheck` `lint` `build` | `test` `e2e` `visual`              | `rls` (Docker + Supabase CLI) |
| `hydration` `bundle` `contracts`       | `accessibility` `lighthouse` `cwv` | `load` (k6, optionnel)        |
| `design` `env` `security`              |                                    |                               |

Détail de chacun : skill [`ns-quality-gates`](../skills/ns-quality-gates/SKILL.md).

## Ajouter un gate

Dans `.claude/gates.config.js` :

```js
{
  id: "mon-gate",
  n: 18,
  name: "Description lisible",
  command: "node .claude/scripts/mon-check.js",
  requires: [{ kind: "docker" }],   // sondé AVANT exécution
  slow: true,                       // exclu de --fast
  optional: true,                   // un échec ne bloque pas
}
```

Prérequis possibles : `bin` (binaire dans le PATH), `docker` (démon réellement démarré), `playwright` (navigateurs téléchargés), `capability` (Supabase, billing, email configurés).

## Règle non négociable

Le pattern `commande || echo 'skipping'` est **interdit**. Il renvoie 0 quoi qu'il arrive : le gate passe même quand il échoue. C'est un faux succès, plus dangereux qu'aucun gate, parce qu'il inspire confiance.

Sept gates de ce dépôt passaient sans rien vérifier avant d'être corrigés — la liste et leurs causes sont dans `ns-quality-gates`, section « Pièges corrigés ».

## En CI

Les workflows GitHub Actions appellent les mêmes scripts npm : toute correction ici profite automatiquement à la CI. Sur un runner les prérequis sont généralement présents, donc peu de SKIP.

```yaml
- run: pnpm verify:ci # équivaut à gates:strict
```

## Liens

- `ns-quality-gates` — détail des gates et pièges à ne pas réintroduire
- `ns-doctor` — cohérence du dépôt (`pnpm doctor`)
- `/ns-ship` — la pipeline complète, dont cette phase
