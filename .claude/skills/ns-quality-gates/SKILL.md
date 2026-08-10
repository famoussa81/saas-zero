---
name: ns-quality-gates
description: Les 14 quality gates du "zéro bug" — typecheck, lint, tests, E2E, visual, perf, RLS, sécurité, accessibilité, contracts, design audit. Le zéro bug doit être garanti mécaniquement, pas par intention.
---

# ns-quality-gates — Le "zéro bug" garanti

> **Ton pilier "zéro bug, tout fonctionnel"**. Ces gates ne sont pas des souhaits :
> ce sont des commandes déterministes qui BLOQUENT la livraison si elles échouent.
>
> 📌 **Skill officiel à référencer** : nthropics/webapp-testing (Playwright, registre VoltAgent)
> pour les tests d'app web sans tout réinventer.

## Les 14 gates (package.json)

| #                         | Gate            | Commande                                   | Critère                        |
| ------------------------- | --------------- | ------------------------------------------ | ------------------------------ |
| 1                         | typecheck       | sc --noEmit                                | 0 erreurs strict               |
| 2                         | lint            |
| ext lint --max-warnings=0 | 0 warnings      |
| 3                         | test            | itest run                                  | unités passent                 |
| 4                         | e2e             | playwright test                            | auth, billing, core passent    |
| 5                         | visual          | playwright.test --config=playwright.visual | 0 régression vs baselines      |
| 6                         | lighthouse      | lhci autorun                               | ≥ 90 perf/a11y/BP/SEO          |
| 7                         | bundle          | ANALYZE=true pnpm build                    | < budget gzip                  |
| 8                         | cwv             | lhci                                       | LCP<2,5s, INP<200ms, CLS<0,1   |
| 9                         | hydration       | build + grep                               | 0 mismatch                     |
| 10                        | rls             | supabase test db                           | policies passent               |
| 11                        | security        |
| pm audit + codeql         | 0 high/critical |
| 12                        | accessibility   | axe-core                                   | WCAG 2.1 AA                    |
| 13                        | contracts       | openapi/pact                               | API conforme                   |
| 14                        | design          | pnpm design:check                          | Tokens, couverture, Impeccable |

Exécution : pnpm gates:all (ou /ns-verify).

## Les 3 règles d'or du zéro bug

1. **Fail-closed** : un gate qui échoue = pas de push, pas de deploy. Pas d'exception silencieuse.
2. **Testé, pas jurament** : le LLM ne "décide" pas que c'est bon — la commande le prouve.
3. **Portes git** : hooks pre-commit (rapide : lint+typecheck) + pre-push (gates:all).
   → si un gate casse, git refuse. Voir
   s-git-gates.

## Isolation écrivain ≠ relecteur

- Celui qui **écrit** le code n'a pas les outils d'écriture (ou se fait reviewer en contexte vierge).
- Les reviews tournent en lecture seule dans un contexte neuf (voir plan / Étape C).
- Objectif : attraper les trous aveugles que l'auteur ne voit pas.

## K6 (load) + Sentry (errors)

- Load test **avant** mise en prod (voir ns-load-test) : vérifier que l'app tient la charge.
- Sentry branché (voir ns-sentry) : les erreurs de prod sont visibles et triées par coût.
- Le "zéro bug" en prod = gates + load + monitoring ensemble.

## Checklist de sortie

- [ ] pnpm gates:all passe sur le SaaS
- [ ] Hooks git actifs (pre-commit rapide + pre-push complet)
- [ ] Review en contexte vierge (isolation)
- [ ] k6 : un scénario de charge passe avant deploy
- [ ] Sentry actif + issues triées par coût
