---
name: ns-discovery
description: "Framework d'interview guidée de la phase Discovery. Transforme un brief en plan produit exécutable (SPEC + ARCHITECTURE + DESIGN + DISCOVERY) via questions adaptatives. Le point de bascule où TOUT se décide."
---

# Skill `ns-discovery` — Discovery Produit Maximale

> **But** : La Discovery est le point de bascule de la pipeline — chaque décision prise ici engage les tables Supabase, les policies RLS, le billing, le design system, les pages et les 14 gates. Ce skill est le moteur de l'interview guidée qui collecte **toutes** les décisions, avec leur raisonnement et leur impact.
>
> **Destinataires** : l'agent `saas-project-compliance` (mode discovery) / la commande `/ns-discovery`.
> **Sorties** : `DISCOVERY.md` (carnet de bord) + `SPEC.md` (contrat) + `ARCHITECTURE-CHOICE.md` + `DESIGN-CHOICE.md`, puis score `discovery:check`.

---

## Règles d'interaction (obligatoires)

1. **Une question à la fois**, via `AskUserQuestion` (2-4 options) ou prompt. Jamais plusieurs thèmes d'un coup.
2. **Follow-up adaptatif** : chaque réponse déclenche 1-2 questions de suivi ciblées sur la zone ambiguë. Non-pertinent → on saute.
3. **Pas de questions techniques au démarrage** : on capture d'abord l'idée, le public, le problème — la vision.
4. **Chaque décision est enregistrée** avec son **raisonnement** (pourquoi) → section "Décisions verrouillées" de `DISCOVERY.md`.
5. **Impact mapping** : chaque décision produit → tables / RLS / pages / gates impactées.
6. **Durée cible 10-15 min** : si l'utilisateur est pressé, on solidifie les fondations (B, F, G) et on marque les réponses par défaut sensées pour le reste.
7. **MVP coupé** : on découpe explicitement ce qu'on NE construit PAS en v1 (le "20% qui compte", cf. killer-saas).

---

## Séquences de l'interview (8 dimensions)

### A. Capture du brief (entrée)

- Ouverture : _"Raconte-moi ton idée en qq lignes : pour qui, quel problème, quel résultat voulu."_
- Pas de questions techniques ici.

### B. Discovery Produit (le plus important — le "pourquoi")

- **Problème** : top 3 douleurs, qui les ressent, **alternatives actuelles** ("que font-ils aujourd'hui sans toi ?").
- **Persona / ICP** : rôle, taille d'équipe, budget, tech-savviness, déclencheur d'achat.
- **Jobs-to-be-done** : _"Quand [situation], je veux [motivation], afin de [résultat attendu]"._
- **Solution & MVP coupé** : top 3 features qui résolvent VRAIMENT ; must-have / should-have / nice-to-have avec coupe + explicite de ce qu'on ROINT pas.
- **Différenciation** : pourquoi ce produit vs l'alternative.

### C. Discovery Marché

- **Matrice concurrentielle** : 3-5 concurrents (forces/faiblesses/positionnement), le **wedge** d'entrée.
- **Segment** : marché visé, taille estimée, tendance.
- **Positionnement** : _"Pour [cible] qui [besoin], [produit] est une [catégorie] qui [bénéfice]. Contrairement à [alternative], [différenciateur]."_

### D. Discovery Business / Monétisation

- **Modèle** : abonnement tiers / usage-based / freemium / one-time.
- **Pricing** : tiers + prix + features par tier (annuel -20%), défaut si pas d'idée.
- **Unit economics** : ACV cible, marge brute, churn max, LTV, payback, **objectif MRR à 6 et 12 mois**.

### E. Discovery Conversion & Rétention (doctrine utilisateur)

- **Funnel** : attirer (wow) → convaincre (qualité/zéro bug) → rassurer → inscrire → payer → rester. Pour chaque étape : ce qui convertit *! métrique.
- **Onboarding** : premier succès en < X min, parcours guidé, emails d'activation.
- **Rétention** : boucle d'habitude, valeur continue, feature adoption, emails de segmentation.

### F. Discovery Architecture

- **B2B vs B2C** (choix fondateur — schémas Supabase séparés, jamais appliqués ensemble).
- **Multi-tenant** : org/team/user, rôles, invitations.
- **Tables & RLS** dérivés des features, **services** requis (Stripe, Brevo…), **env vars** requises.

### G. Discovery Design

- Design system (Linear/Vercel/Stripe/Framer/Custom via skill `design-system`), **motion tier** (Minimal/Moderate/Bold).
- **Élément signature** : le "wow" reconnaissable qui attire et pousse à l'achat (doctrine utilisateur).

### H. Métriques de succès & Risques

- **North Star metric**, KPIs d'entrée/sortie, cibles numériques.
- **Table des risques** : risque, likelihood, impact, mitigation.

---

## Règle : "Décisions verrouillées + Impact mapping"

Chaque décision va dans 2 tables de `DISCOVERY.md` :

**Décisions verrouillées**

| Décision | Options | Chois | Raisonnement |
| -------- | ------- | ----- | ------------ |

**Impact traceability** (feature → code/gates)
| Feature | Tables / RLS | Pages | Gates impactés |

---

## Génération des fichiers (depuis les templates)

Après l'interview, charge le `SPEC.md.template`, `ARCHITECTURE-CHOICE.md.template`, `DESIGN-CHOICE.md.template`, `DISCOVERY.md.template` (à la racine du repo) et remplis chaque section avec les réponses collectées + le raisonnement. Ne laisse **aucun placeholder** non résolu (`[...]`, `TBD`, `[e.g.`).

Puis exécute le gate : `node .claude/scripts/discovery-check.js` → affiche le score (0-100). **Bloquant** : si < 100% ou sections manquantes → complète avant Phase 2.

---

## Quick Reference pour les agents

```text
# saas-project-compliance (mode discovery)
"Exécute l'interview ns-discovery (A→H). Produis DISCOVERY.md + SPEC.md + ARCHITECTURE-CHOICE.md + DESIGN-CHOICE.md depuis les templates. Lance discovery:check → valide humainement → bloquant vers Phase 2."
```

---

## Related Skills

- `design-system` — tokens + élément signature
- `design-principles` — anti-générique (signature, motion)
- `media-sourcing` — images réelles (Pexels/Unsplash/Picsum)
- `ns-quality-gates` — les 14 gates + discovery:check

---

_Skill `ns-discovery` v1.0 — Pipeline saas-zero_
