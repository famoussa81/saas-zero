# `/ns-review` — Relecture en contexte vierge (isolation)

> **Règle** : le contexte qui **écrit** ne se relit **jamais**. Cette commande lance un agent
> `ns-reviewer` **lecture seule** sur le travail courant et écrit un verdict.
> Utilisation : `/ns-review` après une story/tâche, avant push.

---

## Déclenchement

```bash
/ns-review
# ou, depuis un sous-agent (isolation):
ns-reviewer --scope="<ce qui a été fait>"
```

## Procédure

1. **Contexte vierge** : ne pas repartir du raisonnement de construction. Lire l'état réel.
2. **Lecture seule** : l'agent `ns-reviewer` n'a PAS les outils d'écriture — il vérifie et rapporte.
3. **Verdict** écrit dans `REVIEW.md` à la racine :
   - `## Verdict: PRÊT` → le push est autorisé
   - `## Verdict: À REVOIR` → le push est BLOQUÉ (fail-closed)

## Ce que vérifie l'agent (cf. `ns-reviewer`)

- TypeScript strict (pas de `any`, return types)
- RLS sur toute table utilisée (policies `auth.uid()` / `organization_id`)
- Pas de secret / `service_role` en client
- Tokens (pas de couleur/space en dur)
- Placeholders résiduels (Lorem, via.placeholder.com, TODO vague)
- Tests des chemins critiques
- `pnpm typecheck && pnpm lint` passent

## Le fail-closed

Le hook git `pre-push` lit `REVIEW.md`. S'il existe et dit `À REVOIR`, il bloque.
S'il est absent, le push passe les gates qualité mais **avertit** qu'une review est recommandée
avant de pousser sur la branche principale (configurable : strict sur la branche par défaut).

## Convention

- `REVIEW.md` = verdict du dernier travail (1 fichier, écrasé à chaque review).
- Pour les story-based : `docs/reviews/<id>.md` avec `Ship allowed: yes/no`.

---

_Isolation = zéro bug. Voir ns-quality-gates._
