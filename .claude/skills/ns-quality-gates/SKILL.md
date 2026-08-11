---
name: ns-quality-gates
description: "Les quality gates du zéro bug, exécutés par un runner unique qui distingue PASS, FAIL et SKIP. Un prérequis absent donne un skip explicite avec la commande d'installation, jamais un échec dur ni un faux succès. Couvre typecheck, lint, tests, E2E, visuel, perf, bundle, RLS, sécurité, accessibilité, contrats, design."
---

# `ns-quality-gates` — Le « zéro bug » garanti mécaniquement

> **Principe** : les gates ne sont pas des intentions, ce sont des commandes déterministes qui bloquent la livraison.
>
> **Corollaire, tout aussi important** : un gate qui ne peut pas échouer n'est pas un gate. Et un gate qui échoue parce qu'un outil manque sur la machine n'est pas un gate non plus — c'est un obstacle.

---

## Les trois issues possibles

| Issue    | Sens                                                 | Bloquant |
| -------- | ---------------------------------------------------- | -------- |
| **PASS** | Le gate a tourné et réussi                           | —        |
| **FAIL** | Le gate a tourné et trouvé un vrai problème          | ✅ oui   |
| **SKIP** | Un prérequis manque, avec la commande d'installation | ❌ non   |

**Interdit** : le pattern `commande || echo 'skipping'`. Il produit un exit 0 quoi qu'il arrive — le gate passe même quand il échoue. C'est un faux succès, plus dangereux que pas de gate du tout, parce qu'il inspire confiance.

---

## Utilisation

```bash
pnpm gates:all              # tout
pnpm gates:fast             # saute les gates lents (build, lighthouse, hydration)
pnpm gates:list             # inventaire + capacités détectées, sans rien exécuter
pnpm gates:strict           # un SKIP devient bloquant (à réserver au CI de release)
node .claude/scripts/run-gates.js typecheck lint design   # sélection
```

`gates:list` avant toute chose : il montre ce qui est exécutable sur cette machine et pourquoi le reste ne l'est pas.

---

## Architecture

```
.claude/
├── gates.config.js              registre déclaratif : chaque gate déclare ses prérequis
├── scripts/
│   ├── run-gates.js             le runner (PASS / FAIL / SKIP)
│   └── lib/capabilities.js      source unique de vérité sur la machine et le projet
└── security-allowlist.json      dérogations de sécurité justifiées et datées
```

`capabilities.js` est partagé par `env-check.js` et le runner : les deux ne peuvent pas diverger sur « est-ce que Docker tourne » ou « est-ce que Supabase est configuré ».

### Ajouter un gate

```js
// .claude/gates.config.js
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

Types de prérequis : `bin` (binaire dans le PATH), `docker` (démon **réellement** démarré, pas juste installé), `playwright` (navigateurs téléchargés), `capability` (Supabase, billing, email… configurés).

---

## Les gates

| #   | Gate            | Prérequis             | Ce qu'il vérifie                                                 |
| --- | --------------- | --------------------- | ---------------------------------------------------------------- |
| 0   | `discovery`     | —                     | Les 4 documents de Discovery complets, sans placeholder          |
| 1   | `typecheck`     | —                     | `tsc --noEmit`, strict, 0 erreur                                 |
| 2   | `lint`          | —                     | ESLint + Prettier                                                |
| 3   | `test`          | Playwright            | Tests unitaires **et** stories Storybook                         |
| 4   | `build`         | —                     | Build de production (attrape aussi les erreurs de frontière RSC) |
| 5   | `e2e`           | Playwright + Supabase | Parcours auth, billing, cœur métier                              |
| 6   | `visual`        | Playwright            | Aucune régression vs baselines                                   |
| 7   | `lighthouse`    | Playwright            | ≥ 90 sur perf / a11y / bonnes pratiques / SEO                    |
| 8   | `cwv`           | Playwright            | LCP < 2,5 s · INP < 200 ms · CLS < 0,1                           |
| 9   | `hydration`     | —                     | Aucun mismatch d'hydratation dans la sortie du build             |
| 10  | `rls`           | Supabase CLI + Docker | Politiques RLS testées (pgTAP)                                   |
| 11  | `bundle`        | —                     | Plus gros chunk et chunks partagés sous budget                   |
| 12  | `accessibility` | Playwright            | axe-core, WCAG 2.1 AA                                            |
| 13  | `contracts`     | —                     | Contrats d'API                                                   |
| 14  | `design`        | —                     | Tokens, couverture, audit sémantique                             |
| 15  | `env`           | —                     | Variables d'environnement réellement utilisées                   |
| 16  | `security`      | —                     | Vulnérabilités, prod vs dev                                      |
| 17  | `load`          | k6                    | Tenue en charge (optionnel)                                      |

---

## Pièges corrigés — à ne pas réintroduire

Ces bugs ont réellement vécu dans ce repo. Ils ont un point commun : **le gate passait alors qu'il ne vérifiait rien**.

| Gate          | Bug                                                                                                                                        | Leçon                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `hydration`   | `findstr` (Windows seulement, cassé sur CI ubuntu) **et** logique inversée : trouver l'erreur sortait en code 0                            | Ne jamais utiliser d'outil spécifique à un OS. Vérifier le sens de sortie. |
| `bundle`      | `ANALYZE=true pnpm build` : ouvrait un rapport, ne comparait aucun seuil                                                                   | Un gate sans seuil ne peut pas échouer                                     |
| `bundle` (v2) | Sommait tous les chunks de toutes les routes ; motifs de détection ne matchant pas les noms hashés de Turbopack → mesurait 0 Ko en silence | Vérifier que la mesure **mesure quelque chose**                            |
| `security`    | CodeQL jamais configuré + `\|\| echo skipping`                                                                                             | Le pattern `\|\| echo` est interdit                                        |
| `env`         | `require("dotenv")` non installé, et validait trois variables que le code ne lit pas                                                       | Vérifier ce que le code utilise vraiment (`grep process.env`)              |
| `load`        | Paquet npm `k6` factice (types seulement), pointant vers un fichier `.js` renommé en `.ts`                                                 | Un paquet npm n'est pas toujours un binaire                                |
| `visual`      | Timeline GSAP en boucle : capture d'une frame différente à chaque exécution                                                                | Figer les animations avant capture (voir plus bas)                         |

### Rendre la régression visuelle déterministe

```ts
await page.emulateMedia({ reducedMotion: "reduce" }); // les composants rendent leur état final
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready); // sinon la capture part avant le swap
await expect(page).toHaveScreenshot("x.png", {
  fullPage: true,
  animations: "disabled",
  maxDiffPixelRatio: 0.01,
});
```

Le premier verrou fonctionne parce que les composants du projet respectent `prefers-reduced-motion` (cf. `ns-motion`) : l'accessibilité rend le test stable, gratuitement.

---

## Sécurité — prod et dev ne se traitent pas pareil

Une faille dans Storybook (jamais livré) n'est pas une faille dans le runtime de l'app.

- Vulnérabilité atteignant une **dependency de production** → **toujours bloquante**, aucune dérogation
- Vulnérabilité confinée aux **devDependencies** → dérogeable via `.claude/security-allowlist.json`, avec justification et date de réexamen
- Une dérogation **périmée** redevient bloquante
- Une faille dev **non déclarée** bloque aussi — c'est ce qui force à regarder les nouvelles

```json
{
  "module": "image-size",
  "reason": "Aucun correctif publié en amont. Chaîne Storybook, jamais dans le bundle applicatif.",
  "severity": "high",
  "acceptedOn": "2026-08-11",
  "reviewBy": "2026-11-11"
}
```

**Corriger d'abord ce qui est corrigeable** : les overrides pnpm ont ramené 13 vulnérabilités (dont 6 hautes) à 2, toutes dev. Attention — les overrides se déclarent dans `package.json > pnpm.overrides` pour pnpm 9 **et** dans `pnpm-workspace.yaml > overrides` pour pnpm 10. Les deux, sinon ils sont silencieusement ignorés selon la version installée.

---

## En CI

Les workflows GitHub Actions appellent les mêmes scripts npm : toute correction ici bénéficie automatiquement à la CI. Sur un runner, les prérequis sont généralement présents (Playwright installé, Docker en service), donc peu de SKIP.

Pour une release, utiliser `gates:strict` : un gate ignoré devient bloquant, ce qui interdit de livrer sans avoir tout vérifié.

---

## Liens

- `ns-doctor` — diagnostic de l'environnement
- `ns-visual-regression` — baselines
- `design-audit` — gate #14
