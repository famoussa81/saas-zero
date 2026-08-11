---
description: Crée un nouveau projet à partir du socle, dans un dossier séparé, avec la variante B2B ou B2C verrouillée
---

# `/ns-new` — Créer un projet client

Point d'entrée de la pipeline. **À lancer avant `/ns-discovery` et `/ns-ship`.**

Jusqu'ici la pipeline travaillait **en place** : `/ns-ship` lancé dans le socle modifiait le socle. Impossible de livrer à un client. `/ns-new` génère un projet autonome dans son propre dossier, avec son propre dépôt git.

## Usage

```bash
pnpm ns:new <nom> --variant=b2b|b2c
pnpm ns:new boutique-diallo --variant=b2c
pnpm ns:new --dry-run mon-saas --variant=b2b     # simulation
pnpm ns:new mon-saas --variant=b2b --target=D:/projets/mon-saas
```

Par défaut le projet est créé **à côté** du socle : `../<nom>`.

Le nom sert de nom de paquet npm : minuscules, chiffres et tirets uniquement.

## Le choix de variante est bloquant

| Variante | Modèle                                     | Pour qui                                    |
| -------- | ------------------------------------------ | ------------------------------------------- |
| `b2b`    | organisations, membres, invitations, rôles | outils d'équipe, plateformes collaboratives |
| `b2c`    | utilisateur seul, pas d'organisation       | commerce, outils personnels, communautés    |

Ce choix engage le schéma Supabase, les 45 policies RLS et les pages générées. **Il ne se change pas après coup sans migration** (voir ADR-005). C'est pourquoi il est exigé à la création, et non laissé à une copie manuelle.

## Ce que fait la commande

1. **Copie le socle** — code, composants, configuration, `.claude/` complet (44 skills, agents, gates, scripts).
2. **Écarte les migrations de l'autre variante** — par analyse du **contenu SQL**, commentaires retirés. Une migration comme `fix_org_owner_membership` référence `organization_members` sans le dire dans son nom : en B2C elle échouerait sur `relation "organizations" does not exist`. Le socle commun (`initial_schema`) n'est jamais écarté.
3. **Repart d'une Discovery vierge** — `DISCOVERY.md`, `SPEC.md`, `ARCHITECTURE-CHOICE.md`, `DESIGN-CHOICE.md` régénérés depuis leurs templates. Les copier tels quels ferait passer `discovery:check` à 100/100 **en décrivant le mauvais produit** — le faux succès que la pipeline combat.
4. **Renomme `package.json`**, version `0.1.0`.
5. **Crée `.env.local` depuis `.env.example`** — jamais depuis le socle, donc aucun secret ne voyage.
6. **Initialise un dépôt git vierge** sur `main`, sans aucun historique du socle.

## Jamais copiés

Secrets (`.env.local`, `.env`, `.mcp.json`), `node_modules`, artefacts de build (`.next`, `storybook-static`, rapports Playwright/Lighthouse), historique git, symlinks de skills tiers (chemins absolus, cassés ailleurs), et les rapports générés qui décrivent le socle (`DESIGN-AUDIT.md`, `discovery-check.json`…).

## Après

```bash
cd ../<nom>
pnpm install
pnpm env:check      # liste exactement les variables à renseigner
```

Puis `/ns-discovery`, qui remplit les 4 documents et débloque `/ns-ship`.

Sur un projet neuf `discovery:check` **échoue** — c'est voulu : il force à faire la Discovery au lieu d'hériter de celle d'un autre produit.

## Liens

- `ns-discovery` — l'interview qui remplit les 4 documents
- ADR-005 — B2B vs B2C
- `ns-quality-gates` — les gates disponibles dans le projet généré
