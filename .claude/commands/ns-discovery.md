# `/ns-discovery` — Phase 1 : Discovery & Specs

> **Objectif** : Produire `SPEC.md` + `ARCHITECTURE-CHOICE.md` + `DESIGN-CHOICE.md` validés humainement.

---

## Usage

```bash
/ns-discovery "SaaS de facturation pour freelances avec Stripe, équipe, API keys"
# ou
pnpm ns:discovery "votre description"
```

---

## Étapes

### 1. Clarification Produit (Agent `saas-project-compliance` mode discovery)

| Question          | Impact                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **B2B vs B2C**    | Détermine : RLS org vs user, dashboard, billing seats                                                                        |
| **Design System** | `ns-design-system` skill → palette, ambiance, élément signature (Linear, Vercel, Stripe, Framer ou Custom comme inspiration) |
| **Motion Tier**   | Minimal / Moderate / Bold → GSAP / Motion One / HyperFrames                                                                  |
| **Features MVP**  | Liste priorisée (core vs v2)                                                                                                 |

**Délégation (Claude Code)** :

Invoque le sous-agent `saas-project-compliance` (défini dans `.claude/agents/saas-project-compliance.md`),
en mode `discovery`, dans le contexte courant (Claude Code lit CLAUDE.md). Pas de CLI externe.

### 2. Génération des Spécs (3 fichiers)

#### `SPEC.md`

- Vision, public cible
- Features MVP (marketing, auth, app, billing, email, CMS)
- Non-fonctionnels (perf, bundle, CWV, a11y, RLS, i18n)
- 13 Quality Gates
- Déploiement (preview/prod)
- Out of scope (v2+)

#### `ARCHITECTURE-CHOICE.md`

- Stack decisions (tableau layer/choix/raison)
- Architecture B2B multi-tenant (orgs, teams, users, RLS)
- Tables Supabase (migrations existantes + à créer)
- Pipeline 6 phases
- Variables d'environnement requises

#### `DESIGN-CHOICE.md`

- Design system choisi (via `ns-design-system`, inspiré Linear/Vercel/Stripe/Framer ou Custom)
- Tokens : colors, spacing, radii, shadows, fonts
- Semantic aliases (primary, muted, destructive, etc.)
- Dark mode strategy
- Motion tier + exemples
- Composants requis (shadcn primitives + forms + sections + MDX)

### 3. Gate Discovery — Validation Humaine Obligatoire

```bash
cat SPEC.md ARCHITECTURE-CHOICE.md DESIGN-CHOICE.md
# → HUMAIN : "Approuver" ou "Modifier"
```

**Ne pas passer à la Phase 2 sans validation explicite.**

---

## Sorties

- `SPEC.md` ✓
- `ARCHITECTURE-CHOICE.md` ✓
- `DESIGN-CHOICE.md` ✓
- `DISCOVERY.md` (log complet questions/réponses)

---

## Règles

1. **Une seule commande** : `/ns-discovery` lance tout
2. **Interaction humaine** : Questions via `AskUserQuestion` ou prompt
3. **Pas de code** : Phase purement spécification
4. **ADR si modification** : Toute décision architecture = ADR documenté
