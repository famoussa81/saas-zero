# Installer saas-zero dans un espace de travail

Guide destiné à un agent (ou un humain) qui récupère ce dépôt pour la première fois.

---

## Installation

```bash
git clone https://github.com/famoussa81/saas-zero.git <dossier>
cd <dossier>
pnpm install
```

C'est tout. `.claude/` voyage avec le dépôt : 44 skills, 17 agents, les commandes `/ns-*`, les quality gates et leurs scripts sont immédiatement disponibles. Aucune installation externe n'est nécessaire pour que la pipeline fonctionne.

> **Le dépôt est privé.** Un agent doit disposer d'un accès en lecture — soit une session `gh` authentifiée, soit un token dans l'URL de clone. Sans cela, `git clone` échoue sur une erreur d'authentification, pas sur un problème de configuration.

### Vérifier que l'installation est saine

```bash
pnpm gates:list      # ce qui est exécutable sur cette machine, et pourquoi le reste ne l'est pas
pnpm env:check       # quelles variables d'environnement renseigner
```

`gates:list` ne lance rien : il montre l'état. Un prérequis absent donne un `SKIP` avec la commande d'installation, jamais un échec.

---

## Deux usages, à ne pas confondre

### A. Travailler sur la pipeline elle-même

Le dépôt cloné **est** le socle. On y modifie les skills, les agents, les gates.

```bash
pnpm gates:fast      # vérifier qu'on n'a rien cassé
```

### B. Créer un projet client

On ne travaille **pas** dans le socle : on en génère un projet autonome, ailleurs.

```bash
pnpm ns:new boutique-diallo --variant=b2c
cd ../boutique-diallo
pnpm install
```

Le projet obtenu a son propre dépôt git vierge, sa Discovery à zéro, et le schéma de la variante choisie. Voir `.claude/commands/ns-new.md`.

**Choisir la variante :**

|                 | Pour qui                                       |
| --------------- | ---------------------------------------------- |
| `--variant=b2b` | organisations, équipes, invitations, rôles     |
| `--variant=b2c` | utilisateur seul — commerce, outils personnels |

Ce choix engage le schéma Supabase et les policies RLS. Il ne se change pas après coup sans migration (ADR-005).

---

## Ce qu'il faut renseigner pour aller plus loin

`pnpm env:check` dit exactement lesquelles. Trois niveaux :

- **Requis** : URL et clés Supabase, URL publique de l'app
- **Conditionnel** : Stripe seulement si `ENABLE_BILLING=true`, Brevo seulement si une vraie clé est présente
- **Optionnel** : Sentry

Une variable renseignée avec une valeur factice (`placeholder`, `your-…`) est traitée comme absente — elle est plus dangereuse qu'une variable vide, parce qu'elle passe silencieusement et casse au runtime.

---

## Outils facultatifs

Aucun n'est nécessaire pour installer ou faire tourner la pipeline. Leur absence produit un `SKIP` explicite sur les gates concernés.

| Outil                  | Débloque                                            | Installation                                        |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Docker + Supabase CLI  | `gate:rls` (tests pgTAP des policies)               | Docker Desktop, puis `pnpm exec supabase`           |
| Navigateurs Playwright | `gate:e2e`, `visual`, `accessibility`, `lighthouse` | `pnpm exec playwright install --with-deps chromium` |
| k6                     | `gate:load`                                         | `winget install k6` · `brew install k6`             |

---

## Historique

Ce fichier remplace `install-saas-zero.sh` et `install-saas-zero.ps1` (45 Ko), retirés parce qu'ils décrivaient un projet qui n'existe plus : ils installaient Cloudflare Wrangler et créaient un dossier `workers/`, alors que les workers Cloudflare ont été supprimés du projet. Ils n'étaient référencés nulle part et auraient envoyé un agent installer des outils inutilisés.
