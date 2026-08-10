# ADR 005 : B2B (Organisations) vs B2C (Utilisateur seul)

**Statut** : Accepted
**Date** : 2026-08-10

## Contexte

Deux schémas Supabase existaient en parallèle (`b2b_schema.sql`, `b2c_schema.sql`), tous deux appliqués dans le même dossier `supabase/migrations/`. Les deux augmentent la même table `user_profiles` (créée dans `20260802000001_initial_schema.sql`) avec des colonnes différentes (`organization_id` côté B2B, `role`/`status`/`last_login_at` côté B2C), et ajoutent chacun leurs policies RLS, triggers et fonctions helper (`get_my_organization_id` vs `get_my_role`, etc.).

Appliqués ensemble, les deux schémas cohabitent sans erreur SQL bloquante (les `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` sont idempotents), mais le résultat est incohérent : un modèle B2B pollué de colonnes/policies B2C inutiles (et vice-versa), triggers dupliqués sur `user_profiles`.

## Décision

Le pipeline (`/ns-discovery`) demande à chaque nouveau projet de choisir B2B ou B2C. **Un seul schéma est actif dans `supabase/migrations/` à la fois** — l'autre est conservé comme template dans `supabase/schema-variants/<variant>/`, jamais copié dans `migrations/` sauf si le projet choisit cette variante.

**Pour l'instance actuelle de saas-zero (dev/test local) : B2B est activé.**

- `supabase/migrations/20260802000002_b2b_schema.sql` reste actif (organizations, organization_members, organization_invites, `organization_id` sur `user_profiles`).
- `supabase/schema-variants/b2c/20260802000003_b2c_schema.sql.template` est le template B2C, désactivé, à copier dans `migrations/` uniquement si un futur projet choisit B2C via discovery (et alors le template B2B doit être retiré symétriquement).

## Conséquences

- Plus de double-application des deux schémas sur une même base.
- `saas-auth-builder` et les agents liés au dashboard équipe/invites restent alignés sur le modèle organisationnel (`organization_id`, `organization_members`, rôles owner/admin/member/viewer).
- `/ns-scaffold` (ou `/ns-discovery`) doit, pour un futur projet B2C, copier le template `schema-variants/b2c/` dans `migrations/` à la place de `b2b_schema.sql` — logique à implémenter dans le scaffold, pas encore automatisée.
- Fonctions helper actives : `get_my_organization_id`, `is_organization_owner`, `is_organization_admin`, `get_my_organization_role`. Les équivalents B2C (`get_my_role`, `is_admin`, `is_premium`) restent dans le template, inactifs.
