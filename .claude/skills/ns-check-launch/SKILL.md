---
name: ns-check-launch
description: Émettre un verdict de lancement evidence-backed (prêt à lancer ou non) en vérifiant les preuves : gates, load test, Sentry, env, legal, onboarding. Équivalent gratuit de NS Check Launch (NowStack).
---

# ns-check-launch — Verdict de lancement (evidence-backed)

> Équivalent de "NS Check Launch" (NowStack). But : dire NON avec preuves, pas "on y va".
> Un SaaS "complet et beau" n'est lancé que si TOUTES les preuves sont réunies.

## Les preuves (évidence) à réunir avant "Prêt à lancer"

| Domaine        | Vérif                            | Preuve                     |
| -------------- | -------------------------------- | -------------------------- |
| Qualité        | `pnpm gates:all`                 | 14 gates passent           |
| Chargement     | `k6 run tests/load/scenario.js`  | tient le pic, p95 < seuil  |
| Monitoring     | Sentry branché + DSN             | les erreurs sont visibles  |
| Auth / billing | E2E auth + Stripe                | les flux critiques passent |
| Sécurité       | audit + RLS testées              | 0 high/critical, RLS OK    |
| Accessibilité  | axe-core                         | WCAG 2.1 AA                |
| Legal          | mentions + CGU + confidentialité | présents                   |
| Contenu        | pas de placeholder/Lorem         | pages réelles              |

## Méthode

1. **Gather** : lancer chaque vérif, collecter les résultats FACTUELS (markdown checklist).
2. **Classer** : chaque item = ✅ OK / ❌ bloquant / 🟡 non bloquant.
3. **Verdict** `LAUNCH.md` :

```
## Verdict: PRÊT À LANCER | PAS ENCORE PRÊT
### Bloquants
- [...] (rien → Prêt)
### Non-bloquants / à suivre
- [...]
### Preuves (liens/logs)
- gates:all ✅ · load: 🟢 · sentry: ✅ ...
```

## Règle d'or

**Une seule preuve manquante bloquante = "PAS ENCORE PRÊT"**. On ne lance pas sur l'espoir.
Si une vérif ne peut pas tourner (k6 absent), le signaler comme non-vérité, pas la masquer.

## Checklist de sortie

- [ ] Toutes les vérifs §preuves exécutées (ou blocus explicites)
- [ ] Verdict écrit dans LAUNCH_CHECK.md
- [ ] Aucune preuve ignorée silencieusement
- [ ] Synthèse lisible (humain, pas de baratin)
