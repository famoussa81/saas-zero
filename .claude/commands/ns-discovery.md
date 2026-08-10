# `/ns-discovery` — Phase 1 : Discovery Produit Maximale

> **Objectif** : Transformer un brief en plan produit exécutable — `DISCOVERY.md` + `SPEC.md` + `ARCHITECTURE-CHOICE.md` + `DESIGN-CHOICE.md` — via l'interview guidée du skill `ns-discovery`, validés humainement et score `discovery:check` ≥ 100%.

---

## Usage

```bash
/ns-discovery "SaaS de facturation pour freelances avec Stripe, équipe, API keys"
# ou
pnpm ns:discovery "votre description"
```

---

## Étapes

### 1. Charger le skill `ns-discovery`

Invoque le skill **`ns-discovery`** (`.claude/skills/ns-discovery/SKILL.md`) — le moteur de l'interview guidée.

> Le skill définit les **8 dimensions (A→H)** à couvrir, une question à la fois, avec follow-ups adaptatifs :
>
> | Dim   | Thème                           | Décisions clés capturées                                 |
> | ----- | ------------------------------- | -------------------------------------------------------- |
> | **A** | Capture du brief                | L'idée, le public, le problème, le résultat voulu        |
> | **B** | Discovery Produit (le POURQUOI) | Problème, personas/ICP, JTBD, MVP coupé, différenciation |
> | **C** | Discovery Marché                | Matrice concurrentielle, wedge, positionnement           |
> | **D** | Discovery Business              | Modèle, pricing, unit economics (ACV, churn, LTV, MRR)   |
> | **E** | Conversion & Rétention          | Funnel, onboarding, boucle d'habitude                    |
> | **F** | Discovery Architecture          | B2B/B2C, multi-tenant, tables/RLS, services, env vars    |
> | **G** | Discovery Design                | Design system, motion tier, élément signature            |
> | **H** | Métriques & Risques             | North Star, KPIs, table des risques                      |

**Règles d'interaction** (obligatoires) :

- **Une question à la fois** via `AskUserQuestion` (2-4 options) ou prompt
- **Follow-up adaptatif** : chaque réponse déclenche 1-2 questions ciblées sur la zone ambiguë
- **Chaque décision est enregistrée avec son raisonnement** → section "Décisions verrouillées" de `DISCOVERY.md`
- **Impact mapping** : chaque décision → tables / RLS / pages / gates impactées
- **Durée cible 10-15 min** : si l'utilisateur est pressé, on solidifie les fondations (B, F, G) et on marque les réponses par défaut sensées
- **MVP coupé** : on découpe explicitement ce qu'on NE construit PAS en v1

**Délégation (Claude Code)** : l'interview est conduite par Claude Code dans le contexte courant,
guidé par le skill. Optionnellement le sous-agent `saas-project-compliance` (mode discovery)
peut être invoqué pour la partie checklist de complétude (voir `.claude/agents/saas-project-compliance.md`).
Pas de CLI externe.

### 2. Génération des 4 fichiers (depuis les templates)

Charge les templates et remplis **toutes** les sections avec les réponses collectées + le raisonnement.
**Aucun placeholder non résolu** (`[...]`, `TBD`, `TODO`, `[e.g.`, `à compléter`).

| Fichier                  | Template                          | Contenu                                                                                                                                                                                                                                        |
| ------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DISCOVERY.md`           | `DISCOVERY.md.template`           | **Carnet de bord des décisions** : Lean Canvas, personas/ICP, JTBD, concurrence, positionnement, pricing, unit economics, funnel, décisions verrouillées, impact traceability, métriques, risques, questions ouvertes                          |
| `SPEC.md`                | `SPEC.md.template`                | **Contrat exécutable** : identité produit, business model, audience + personas, positionnement, funnel, features (P0/P1/P2) + MVP coupé, auth, billing, email, design, technique, routes, critères d'acceptation (14 gates), risques, sign-off |
| `ARCHITECTURE-CHOICE.md` | `ARCHITECTURE-CHOICE.md.template` | **ADRs** : 10 ADRs pré-remplis (Next.js 14 + Supabase + Vercel + Stripe + Brevo), impact traceability (feature → tables/RLS/pages/gates), checklist env vars, diagramme Mermaid                                                                |
| `DESIGN-CHOICE.md`       | `DESIGN-CHOICE.md.template`       | **Constitution design** : philosophie, élément signature, conversion design, couleurs, typo, spacing, radii, composants, motion, icônes, dark mode, responsive, a11y, tokens, decision log                                                     |

### 3. Gate Discovery — `discovery:check` (déterministe)

```bash
pnpm discovery:check
# → node .claude/scripts/discovery-check.js
```

Le gate vérifie (score 0-100, exit 0/1) :

- Les 4 fichiers existent
- Sections obligatoires présentes (parse headers markdown)
- **Aucun placeholder non résolu** (`[...]`, `TBD`, `TODO`, `[e.g.`, `à compléter`, `xxxx`)
- Pricing avec des nombres
- Au moins 1 persona rempli
- Tables ≥ 1 dans ARCHITECTURE
- Design system choisi (pas "Custom" seul)
- Racine Positionnement rempli
- Unit economics avec des nombres

Sorties : `DISCOVERY-CHECK.md` (lisible) + `discovery-check.json` (CI).

**Bloquant** : si score < 100 → on complète les sections manquantes et on relance.

### 4. Validation Humaine Obligatoire

```bash
cat DISCOVERY.md SPEC.md ARCHITECTURE-CHOICE.md DESIGN-CHOICE.md
# → HUMAIN : "Approuver" ou "Modifier"
```

**Ne pas passer à la Phase 2 sans validation explicite.**

---

## Sorties

- `DISCOVERY.md` ✓ (carnet de bord des décisions + raisonnement)
- `SPEC.md` ✓ (contrat exécutable)
- `ARCHITECTURE-CHOICE.md` ✓ (ADRs + impact traceability)
- `DESIGN-CHOICE.md` ✓ (constitution design)
- `DISCOVERY-CHECK.md` ✓ (rapport gate) + `discovery-check.json`

---

## Règles

1. **Une seule commande** : `/ns-discovery` lance tout
2. **Interaction humaine** : une question à la fois, via `AskUserQuestion`
3. **Pas de code** : Phase purement spécification
4. **ADR si modification** : Toute décision architecture = ADR documenté
5. **Gate bloquant** : `discovery:check` = 100% + validation humaine requise avant Phase 2

---

_Réécrit par le skill `ns-discovery` — Pipeline saas-zero_
