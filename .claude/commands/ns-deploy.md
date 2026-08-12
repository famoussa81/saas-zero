# `/ns-deploy` — Phase 6 : Deploy Production

> **Objectif** : Production live avec migrations, webhooks, smoke tests — 5 min.

---

## Usage

```bash
/ns-deploy
# ou
/ns-deploy
# ou
./.claude/commands/ns-deploy.sh
```

> **Prérequis ABSOLU** : `/ns-qa` → **Tous les 14 gates passent** ✓

---

## Étapes de Déploiement

### 1. Supabase Migrations (Production)

```bash
# Via GitHub Action (recommandé) ou CLI
supabase db push --project-ref $SUPABASE_PROD_REF
```

**GitHub Action** (`.github/workflows/ci.yml`) :

```yaml
- name: Supabase Migrations
  run: supabase db push --project-ref ${{ secrets.SUPABASE_PROD_REF }}
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 2. Vercel Deploy

```bash
# Preview (chaque PR) — via GitHub Action amondnet/vercel-action
npx vercel --preview

# Production (merge main)
npx vercel --prod
```

**vercel.json** (à la racine) :

```json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

Deploys automatiques dans CI : `.github/workflows/ci.yml` → jobs `deploy-preview` (PR) et `deploy-production` (merge main) via `amondnet/vercel-action@v20`.

### 3. Stripe Webhooks Configuration

> ⚠️ Le domaine ci-dessous vient de **ton** déploiement, jamais d'un exemple
> copié. `saas-zero.vercel.app` était écrit en dur ici : un agent qui suivait
> la consigne configurait les webhooks Stripe du client vers un domaine qui
> n'est pas le sien — paiements confirmés nulle part.

```bash
export APP_URL="https://<ton-projet>.vercel.app"   # ou ton domaine personnalisé
```

**Endpoint** : `$APP_URL/api/webhooks/stripe`

**Events à configurer** (via Stripe CLI ou Dashboard) :

```bash
stripe webhook_endpoints create \
  --url="$APP_URL/api/webhooks/stripe" \
  --events=checkout.session.completed,invoice.paid,customer.subscription.updated,customer.subscription.deleted,payment_method.attached
```

**Secret** : `STRIPE_WEBHOOK_SECRET` dans les env vars Vercel

### 4. Brevo Webhooks Configuration

**Endpoint** : `$APP_URL/api/webhooks/brevo`

**Events** :

- `delivered`, `opened`, `clicked`, `bounced`, `unsubscribed`

**Secret** : Configuré dans Brevo dashboard

### 5. Variables d'Environnement Production (Vercel)

Dans **Vercel Dashboard → Project → Settings → Environment Variables** (ou `npx vercel env add`) :

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (server-only)
SUPABASE_DB_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brevo
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@votredomaine.com
BREVO_SENDER_NAME=Votre SaaS

# Vercel
NEXT_PUBLIC_APP_URL=https://<ton-projet>.vercel.app

# Feature Flags
ENABLE_MFA=true
ENABLE_SSO=false
SSO_PROVIDERS=google,github
```

---

## Smoke Tests (Post-Deploy Validation)

Exécutés automatiquement via Playwright sur l'URL de preview :

```bash
pnpm test:e2e -- --config=playwright.smoke.config.ts
```

**Scénarios** :

1. ✅ **Home page loads** — `/fr` status 200, Hero visible
2. ✅ **Auth flow works** — `/fr/connexion` → login → redirect `/fr/tableau-de-bord`
3. ✅ **Checkout initiates** — `/fr/pricing` → click Pro → Stripe Checkout redirect
4. ✅ **Dashboard accessible** — User connecté → `/fr/tableau-de-bord` stats visibles
5. ✅ **Blog works** — `/fr/blog` → article → MDX rendering
6. ✅ **Search works** — `/fr/recherche?q=test` → résultats

---

## Gate Deploy

- ✅ **Smoke tests passent** (Playwright sur preview URL)
- ✅ **Preview URL accessible** (HTTPS, certificat valide)
- ✅ **Migrations appliquées** (Supabase dashboard → Table Editor)
- ✅ **Webhooks reçus** (Stripe/Brevo dashboard → logs webhook)

---

## Rollback (Si Échec)

### Vercel

```bash
# Lister les déploiements
npx vercel ls

# Rollback vers un déploiement précédent (Dashboard → Deployments → ⋯ → Promote)
npx vercel promote <deployment-url>
```

### Supabase Migrations

```bash
# Migrations sont réversibles (DOWN dans chaque fichier .sql)
# En cas d'urgence : supabase db reset --project-ref $PROD_REF (DANGER: perte données)
# Mieux : migration corrective `supabase migration new fix_issue` → push
```

### DNS / Custom Domain

```bash
# Vercel → Project → Settings → Domains → Ajouter votre-domaine.com
# Vercel fournit les enregistrements DNS (CNAME vers cname.vercel-dns.com)
```

---

## Checklist Pré-Deploy (Mental)

- [ ] `/ns-qa` → **14/14 gates PASS** ✓
- [ ] Env vars configurées dans Vercel
- [ ] `SUPABASE_PROD_REF` correct
- [ ] Stripe webhook endpoint mis à jour (prod URL)
- [ ] Brevo webhook endpoint mis à jour (prod URL)
- [ ] Domaine custom configuré (optionnel)
- [ ] Équipe notifiée du deploy

---

## Script Unifié : `ns-deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploy SaaS-Zero to Production"
echo "=================================="

# 1. Vérification gates
echo "📋 Checking quality gates..."
if ! ./.claude/commands/ns-verify.sh; then
  echo "❌ Gates failed. Deploy aborted."
  exit 1
fi

# 2. Supabase migrations
echo "🗄️  Applying Supabase migrations..."
supabase db push --project-ref $SUPABASE_PROD_REF

# 3. Vercel deploy
echo "▲  Deploying to Vercel..."
npx vercel --prod

# 4. Smoke tests — SMOKE_BASE_URL est obligatoire, la config échoue sans elle
echo "🧪 Running smoke tests..."
SMOKE_BASE_URL="$APP_URL" pnpm test:smoke

echo "✅ Deploy complete! 🎉"
echo "🌐 Live at: $APP_URL"
```

---

## Monitoring Post-Deploy

| Outil                     | URL                              | Fréquence  |
| ------------------------- | -------------------------------- | ---------- |
| **Supabase Dashboard**    | Database → Logs, Auth → Users    | Temps réel |
| **Stripe Dashboard**      | Webhooks → Logs, Payments        | Temps réel |
| **Brevo Dashboard**       | Transactional → Logs             | Temps réel |
| **Vercel Analytics**      | Project → Analytics (Web Vitals) | Temps réel |
| **Plausible**             | plausible.io → votre-domaine     | Quotidien  |
| **Sentry** (si configuré) | Issues, Performance              | Temps réel |

---

## Commandes Utiles

```bash
# Deploy preview seulement
npx vercel --preview

# Voir logs production
npx vercel logs --prod

# Lister / ajouter env vars
npx vercel env ls
npx vercel env add STRIPE_WEBHOOK_SECRET production
```
