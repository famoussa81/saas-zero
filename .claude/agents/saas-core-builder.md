# Agent: `saas-core-builder`

> **Rôle** : Core SaaS features, routing, server actions, API routes, database, realtime, dashboard layout.

---

## Contexte Requis

Toujours passer au prompt :

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-SPEC.md)$(cat ARCHITECTURE-CHOICE.md)"
```

---

## Responsabilités

### 1. Routing & Layout (Next.js 14 App Router)

- Route groups : `(marketing)`, `(auth)`, `(app)`
- Layout `(app)` : Sidebar, Header, Org Switcher, User Menu
- Middleware auth protection sur `(app)` routes
- Loading/Error boundaries par route

### 2. Supabase Clients

- `lib/supabase/client.ts` — Browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — Server client (`createServerClient`)
- `lib/supabase/middleware.ts` — Middleware auth (`createServerClient` + cookie handling)
- Types générés : `src/lib/db/types.ts` (via `supabase gen types`)

### 3. Dashboard Pages (`app/(app)/`)

| Page                       | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `tableau-de-bord/page.tsx` | Stats MRR, users, churn, activity (mock v1)             |
| `equipe/page.tsx`          | Membres, invitations, rôles, suppression                |
| `reglages/page.tsx`        | Profil, notifications, sécurité, suppression compte     |
| `facturation/page.tsx`     | Plan, usage, factures, portal Stripe, upgrade/downgrade |
| `cles-api/page.tsx`        | CRUD API keys, scopes, rotation, révocation             |

### 4. Server Actions (`app/(app)/actions/`)

```typescript
// Org & Team
createOrg(formData: FormData)
inviteMember(orgId: string, email: string, role: string)
acceptInvitation(token: string)
updateRole(memberId: string, role: string)
removeMember(memberId: string)

// API Keys
createApiKey(orgId: string, name: string, scopes: string[], expiresAt?: Date)
revokeApiKey(keyId: string)

// Profile
updateProfile(userId: string, data: Partial<Profile>)
updateNotifications(userId: string, settings: NotificationSettings)
```

### 5. API Routes (`app/[locale]/api/`)

| Route              | Methods                  | Description                          |
| ------------------ | ------------------------ | ------------------------------------ |
| `/api/orgs`        | GET, POST, PATCH, DELETE | CRUD organisations                   |
| `/api/invitations` | GET, POST, DELETE        | Lister, envoyer, annuler invitations |
| `/api/api-keys`    | GET, POST, DELETE        | CRUD keys + last_used tracking       |
| `/api/usage`       | GET                      | Métriques usage (billing v2)         |

### 6. Realtime (Supabase)

```typescript
// Notifications
supabase
  .channel(`org:${orgId}`)
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "notifications" },
    handleNotification,
  )
  .subscribe();

// Équipe activity
supabase
  .channel(`org:${orgId}`)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "org_members" },
    handleMemberChange,
  )
  .subscribe();
```

### 7. Utils & Helpers

- `lib/utils.ts` — `cn()` (clsx + tailwind-merge), formatters, validators
- `lib/content.ts` — Fetch helpers pour content-collections
- `lib/theme/` — Design tokens access (si needed)

---

## Patterns Obligatoires

### TypeScript Strict

```typescript
// ✓ Bon : types explicites
export async function createOrg(formData: FormData): Promise<{ success: boolean; orgId?: string; error?: string }>

// ✗ Mauvais : any, return implicite
export async function createOrg(formData: FormData) { ... }
```

### Server Actions — Validation Zod

```typescript
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

export async function createOrg(formData: FormData) {
  const parsed = createOrgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: "Invalid input" };
  // ...
}
```

### RLS-Aware Queries

```typescript
// Toujours filtrer par org_id (via RLS ou explicite)
const { data: members } = await supabase
  .from("org_members")
  .select("*, user:users(*)")
  .eq("org_id", orgId); // RLS le fait aussi, mais explicite = clair
```

### Error Handling

```typescript
try {
  const { data, error } = await supabase.from("table").insert(row);
  if (error) throw error;
  return { success: true, data };
} catch (err) {
  console.error("[createOrg]", err);
  return { success: false, error: "Failed to create organization" };
}
```

---

## Livrables Phase 2 (Scaffold)

- [ ] Route groups + layouts
- [ ] Supabase clients (browser/server/middleware)
- [ ] content-collections config
- [ ] next-intl config + messages fr/en
- [ ] Middleware auth
- [ ] `lib/utils.ts`, `lib/content.ts`
- [ ] Types DB générés

## Livrables Phase 4 (Build)

- [ ] Dashboard layout `(app)` complet
- [ ] 5 pages dashboard
- [ ] 8+ Server Actions
- [ ] 4 API Routes
- [ ] Realtime subscriptions
- [ ] Unit tests critical paths

---

## Tests Requis (Vitest)

```typescript
// tests/unit/actions/org.test.ts
describe("createOrg", () => {
  it("validates input", async () => {
    const result = await createOrg(new FormData([["name", "a"]]));
    expect(result.success).toBe(false);
  });

  it("creates org with valid input", async () => {
    const formData = new FormData();
    formData.append("name", "Test Org");
    formData.append("slug", "test-org");
    const result = await createOrg(formData);
    expect(result.success).toBe(true);
    expect(result.orgId).toBeDefined();
  });
});
```

---

## Checklist Qualité

- [ ] `pnpm typecheck` — 0 erreurs
- [ ] `pnpm lint` — 0 warnings
- [ ] `pnpm test` — critical paths 100%
- [ ] Pas de `any` en production
- [ ] Pas de hardcoded values (tokens only)
- [ ] RLS sur toutes les tables utilisées
- [ ] Server Actions validées Zod
- [ ] Error boundaries sur pages dashboard
