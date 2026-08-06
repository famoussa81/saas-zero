---
name: ns-load-test
description: Test de charge k6 — vérifier que l'app tient la charge avant mise en prod. Faux positifs d'interprétation, seuils, scénario de pic. Utiliser avant déploiement.
---

# ns-load-test — "Est-ce que ça tient la charge ?"

> Source : le kit charge-sentry (faux positifs évités). L'objectif : monter jusqu'à la rupture,
> pas extrapoler depuis un petit test.

## Principe

Un test "0 erreur" peut être un **faux positif** (cache, p99 écarté du p95, erreurs dès le 1er palier).
On ne conclut jamais sur un seul graphique.

## Vocabulaire

| Terme     | Définition                                                                        |
| --------- | --------------------------------------------------------------------------------- |
| VU        | utilisateur virtuel = personne qui navigue, pas une requête                       |
| Palier    | marche de charge tenue qqs secondes → on cherche celle où ça casse                |
| p95 / p99 | 95/99 % des requêtes servies ; l'écart p95→p99 = indicateur précoce de saturation |
| Seuil     | limite déclarée AVANT le tir = ce qui transforme un graphe en test                |

## Règles d'interprétation (ne pas se faire piéger)

- Latence parfaitement plate → réponse par cache : vérifier `cache-control`, `age`.
- Résultats meilleurs à haute charge → montée en température : rejouer en inversant.
- Erreurs dès le premier palier → rate limiting / firewall, vérifier les codes.
- p99 très éloigné du p95 avec 0 % d'erreur = début de saturation, PAS un bon résultat.

## Scénario k6 (config)

```js
// tests/load/scenario.js
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // montée
    { duration: "1m", target: 200 }, // pic
    { duration: "20s", target: 0 }, // descente
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% d'erreurs
    http_req_duration: ["p(95)<800"], // p95 < 800ms
  },
};

export default function () {
  const res = http.get("https://<preview>.pages.dev/");
  check(res, { "status 200": (x) => x.status === 200 });
}
```

## Le pic instantané (envoi massif)

Pour un mailing : PAS de rampe — tous les VU arrivent en même temps sur les pages du lien de
l'email (pas la home). C'est le scénario le plus proche d'un lancement.

## Les pages OUBLIÉES

L'espace authentifié et l'admin sont les plus lourds et presque jamais testés.
Tester : login, dashboard, une action métier, après paiement.

## Rapport de charge

À écrire systématiquement :

- pages non testées
- métriques non collectées (état du pool)
- profil de montée utilisé
- durée (4 min ne révèle ni fuites mémoire ni dérive de pool)

## Checklist de sortie

- [ ] Scénario de charge (montée + pic + descente) avec seuils
- [ ] Un scénario de pic instantané (envoi massif)
- [ ] Pages authentifiées + admin testées
- [ ] Rapport conclu jusqu'à la rupture ou déclaré non-trouvée
