# Agent: `saas-auth-builder`

> **Rôle** : Auth flows complets, Supabase Auth, RLS policies, organisations/teams, MFA, SSO, invitations, sessions.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-SPEC.md)$(cat ARCHITECTURE-CHOICE.md)"
```

---

## Responsabilités

### 1. Tables Supabase + RLS (Migrations)

```sql
-- organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- org_members (RLS: user ne voit que ses orgs)
create table org_members (
  org_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- teams (optionnel v1)
create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- team_members
create table team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('lead','member')),
  primary key (team_id, user_id)
);

-- invitations
create table invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','member')),
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- subscriptions (billing)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade unique,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- api_keys
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  key_hash text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

### 2. RLS Policies (Obligatoires — testées en CI)

```sql
-- organizations : owner/admin voient, owner gère
alter table organizations enable row level security;

create policy "org_select" on organizations
  for select using (
    id in (select org_id from org_members where user_id = auth.uid())
  );

create policy "org_insert" on organizations
  for insert with check (true); -- via server action createOrg

create policy "org_update" on organizations
  for update using (
    id in (select org_id from org_members where user_id = auth.uid() and role in ('owner','admin'))
  );

-- org_members : members voient, owner/admin gèrent
alter table org_members enable row level security;

create policy "member_select" on org_members
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid())
  );

create policy "member_insert" on org_members
  for insert with check (
    org_id in (select org_id from org_members where user_id = auth.uid() and role = 'owner')
  );

create policy "member_update" on org_members
  for update using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role in ('owner','admin'))
  );

create policy "member_delete" on org_members
  for delete using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role = 'owner')
  );

-- invitations : owner/admin gèrent, invited user accepte
alter table invitations enable row level security;

create policy "invite_select" on invitations
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role in ('owner','admin'))
    or email = (select email from auth.users where id = auth.uid())
  );

create policy "invite_insert" on invitations
  for insert with check (
    org_id in (select org_id from org_members where user_id = auth.uid() and role in ('owner','admin'))
  );

-- subscriptions : owner/admin voient
alter table subscriptions enable row level security;

create policy "sub_select" on subscriptions
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role in ('owner','admin'))
  );
```

### 3. Auth UI Pages (`app/[locale]/(auth)/`)

| Page                                  | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `connexion/page.tsx`                  | Email/password + magic link + OAuth buttons    |
| `inscription/page.tsx`                | Register + email verification flow             |
| `mot-de-passe-oublie/page.tsx`        | Forgot password → reset email                  |
| `reinitialiser-mot-de-passe/page.tsx` | Reset password (token from email)              |
| `magie/page.tsx`                      | Magic link sent confirmation                   |
| `verification/page.tsx`               | Email verification (token from email)          |
| `mfa/page.tsx`                        | MFA TOTP setup/verify/disable + recovery codes |

### 4. Middleware Auth (`lib/supabase/middleware.ts`)

```typescript
// Protège routes (app) et redirige vers /connexion
// Gère locale dans pathname
// Refresh session automatique
// Supabase SSR v0.3.0 : get/set/remove cookies
```

### 5. MFA TOTP (Optionnel - `ENABLE_MFA=true`)

**Flow** :

1. `/reglages/securite/mfa` → Setup : QR code + secret
2. Verify : Code 6 chiffres → enable
3. Recovery codes : 10 codes à usage unique
4. Disable : Confirmation + code

**Tables** :

```sql
alter table auth.users add column if not exists mfa_secret text;
alter table auth.users add column if not exists mfa_enabled boolean default false;
alter table auth.users add column if not exists recovery_codes text[];
```

### 6. SSO (Configurable - `ENABLE_SSO=true`, `SSO_PROVIDERS=google,github`)

**Providers** : GitHub, Google, Microsoft
**Config** : Supabase Dashboard → Authentication → Providers
**Callback** : `/auth/callback` (géré par Supabase SSR)

### 7. Invitations Flow

```
1. Owner/Admin → /equipe → "Inviter" → email + role
2. Server Action inviteMember → insert invitations + send email (Brevo)
3. User reçoit email → lien /accepter-invitation?token=xxx
4. Page acceptation → verify token → insert org_members → delete invitation
5. Redirect → /tableau-de-bord
```

### 8. Sessions Management

- Liste appareils : `auth.sessions()` via Supabase Admin API
- Révocation individuelle / toutes
- Device tracking : user agent, IP, last seen

---

## Server Actions Auth (`app/(app)/actions/auth.ts`)

```typescript
// MFA
setupMFA(userId: string): Promise<{ secret: string; qrCode: string }>
verifyMFA(userId: string, code: string): Promise<boolean>
disableMFA(userId: string, code: string): Promise<boolean>
generateRecoveryCodes(userId: string): Promise<string[]>

// Invitations
inviteMember(orgId: string, email: string, role: string): Promise<{ token: string }>
acceptInvitation(token: string): Promise<{ orgId: string }>
resendInvitation(invitationId: string): Promise<void>
cancelInvitation(invitationId: string): Promise<void>

// Sessions
listSessions(userId: string): Promise<Session[]>
revokeSession(sessionId: string): Promise<void>
revokeAllSessions(userId: string): Promise<void>
```

---

## Email Templates (Brevo)

| Template         | Trigger               | Variables                                                      |
| ---------------- | --------------------- | -------------------------------------------------------------- |
| `welcome`        | Inscription confirmée | `{{firstName}}`, `{{loginUrl}}`                                |
| `magic_link`     | Demande magic link    | `{{magicLink}}`, `{{expiresIn}}`                               |
| `password_reset` | Mot de passe oublié   | `{{resetLink}}`, `{{expiresIn}}`                               |
| `invitation`     | Invitation équipe     | `{{inviterName}}`, `{{orgName}}`, `{{acceptLink}}`, `{{role}}` |
| `mfa_enabled`    | MFA activé            | `{{recoveryCodes}}`                                            |

---

## Gate Auth (Phase 2 Scaffold)

- ✓ Migrations SQL créées + appliquées local
- ✓ RLS policies sur TOUTES les tables
- ✓ `supabase test db` passe
- ✓ Pages auth rendues (connexion, inscription, mdp oublié)
- ✓ Middleware protège routes `(app)`
- ✓ Types DB générés (`src/lib/db/types.ts`)

## Gate Auth (Phase 4 Build)

- ✓ MFA TOTP complet (setup, verify, disable, recovery)
- ✓ SSO providers configurés + testés
- ✓ Invitations flow end-to-end
- ✓ Sessions list + revoke
- ✓ Unit tests sur actions auth
- ✓ E2E tests : login, register, magic link, reset, MFA, invite

---

## Patterns Obligatoires

### RLS First

```sql
-- CHAQUE table a RLS enabled + policies
-- Testé via `supabase test db` en CI
```

### Server Actions pour Mutations

```typescript
// Jamais de supabase.from().insert() dans composants
// Toujours via Server Action validée Zod
```

### Type-Safe Auth

```typescript
// Utiliser types générés
import type { Database } from "@/lib/db/types";
type OrgMember = Database["public"]["Tables"]["org_members"]["Row"];
```

### Error Handling Auth

```typescript
// Erreurs Supabase Auth mappées vers messages i18n
const authErrorMessages: Record<string, string> = {
  email_not_confirmed: "auth.verifyError",
  invalid_credentials: "auth.invalidCredentials",
  weak_password: "auth.weakPassword",
  // ...
};
```

---

## Checklist Qualité

- [ ] `pnpm typecheck` — 0 erreurs
- [ ] `pnpm lint` — 0 warnings
- [ ] `supabase test db` — 0 policy failures
- [ ] Pas de `service_role` key côté client
- [ ] RLS sur 100% tables
- [ ] Server Actions Zod-validées
- [ ] Emails via Brevo (pas console.log)
- [ ] MFA/SSO gérés par feature flags
