---
name: ns-organizations
description: Comptes B2B multi-membres — organisations, équipes, rôles, invitations, RLS multi-tenant et passage B2B/B2C à la création. Utiliser pour la partie "organisation" du SaaS.
---

# ns-organizations — Comptes B2B multi-membres

> Le choix B2B / B2C se fait à la création (voir /ns-discovery). Ce skill couvre le cas B2B :
> un tenant = une organisation avec plusieurs membres et des rôles. (B2C = utilisateur seul, voir ns-auth.)
>
> 📌 **Skill officiel à référencer** : `supabase/postgres-best-practices` (registre VoltAgent)
> pour les bonnes pratiques RLS / PostgreSQL.

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 16 primitives Radix + CVA déjà là. Ne pas les réécrire.
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.

Si `DESIGN-CHOICE.md` est encore le template non rempli : s'arrêter et le signaler. Générer de l'UI sans direction artistique décidée produit exactement le générique que la pipeline existe pour éviter.

Aucune valeur en dur — couleur, espacement, rayon, ombre, taille de police. Avant de rendre la main :

```bash
pnpm design:tokens:audit
```

## Modèle de données (B2B)

```sql
organizations(id, name, slug UNIQUE, billing_email, settings JSONB, deleted_at)
organization_members(organization_id, user_id, role, status)  -- role: owner|admin|member|viewer
organization_invites(organization_id, email, role, token, expires_at)
user_profiles(id PK -> auth.users, organization_id, ...)       -- table partagée (voir migrations 01)
```

> ⚠️ Le `user_profiles` est créé UNE SEULE FOIS (migration 01, shared core). B2B y AJOUTE
> `organization_id` (migration 02) ; B2C y AJOUTE `role`/`status` (migration 03). Ne jamais recréer.

## RLS multi-tenant (obligatoire sur chaque table)

```sql
CREATE POLICY "Members can view org" ON public.organizations
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid() AND om.status = 'active')
  );

-- chaque table métier a une colonne organization_id + policy du même genre
CREATE POLICY "Org members can access their org data" ON public.<table_metier>
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = <table_metier>.organization_id
            AND om.user_id = auth.uid() AND om.status = 'active')
  );
```

**Règle d'or** : toute table d'un SaaS B2B a `organization_id` + une policy RLS qui vérifie
l'appartenance via `organization_members`. Testées en CI (gate:rls).

## Rôles

| Rôle     | Droits                                               |
| -------- | ---------------------------------------------------- |
| `owner`  | tout : gérer membres/rôles, supprimer l'org, billing |
| `admin`  | gérer membres/rôles, inviter, configurer             |
| `member` | utiliser le produit                                  |
| `viewer` | lecture seule (optionnel)                            |

## Invitations

1. Owner/admin crée une invite → token + email + expiration (7 j).
2. Envoi email (Brevo, via `lib/brevo.ts` — `sendTeamInvitationEmail`) avec lien `/invitations/:token`.
3. L'invité : session ou création → POST → `INSERT organization_members`.
4. Purge des invites expirées (job cron, voir migration pg_cron).

## Server actions (Next.js)

```ts
export async function createOrg(
  formData: FormData,
): Promise<{ success: boolean; orgId?: string; error?: string }>;
export async function inviteMember(orgId: string, email: string, role: string); // z.validation
export async function acceptInvitation(token: string);
export async function updateRole(memberId: string, role: string);
export async function removeMember(memberId: string);
```

## B2C (utilisateur seul)

Si la discovery a choisi **B2C** : pas d'orgs. `user_profiles` a `role`/`status`, RLS = `id = auth.uid()`.
Helper functions B2C : `get_my_role()`, `is_admin()`, `is_premium()`.

## Checklist de sortie

- [ ] Choix B2B/B2C acté dans /ns-discovery et reflété dans les tables
- [ ] RLS sur TOUTES les tables + testées (gate:rls)
- [ ] Invitations (créer, envoyer, accepter, expirer)
- [ ] Dashboard de gestion d'équipe (membres, rôles, retirer)
- [ ] Helper functions + org switcher dans le layout
