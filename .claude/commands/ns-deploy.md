# `/ns-deploy` — Phase 6 : Deploy Production

> **Objectif** : Production live avec migrations, webhooks, smoke tests — 5 min.

---

## Usage

```bash
/ns-deploy
# ou
pnpm ns:deploy
# ou
./.claude/commands/ns-deploy.sh
```

> **Prérequis ABSOLU** : `/ns-qa` → **Tous les 13 gates passent** ✓

---

## Étapes de Déploiement

### 1. Supabase Migrations (Production)

```bash
# Via GitHub Action (recommandé) ou CLI
supabase db push --project-ref $SUPABASE_PROD_REF
```

**GitHub Action** (`.github/workflows/deploy.yml`) :

```yaml
- name: Supabase Migrations
  run: supabase db push --project-ref ${{ secrets.SUPABASE_PROD_REF }}
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 2. Cloudflare Pages Deploy

```bash
# Preview (chaque PR)
wrangler pages deploy --project-name=saas-zero --branch=preview

# Production (merge main)
wrangler pages deploy --project-name=saas-zero --branch=main
```

**wrangler.toml** :

```toml
name = "saas-zero"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".next"

[env.production]
branch = "main"
```

### 3. Stripe Webhooks Configuration

**Endpoint** : `https://saas-zero.pages.dev/api/webhooks/stripe`

**Events à configurer** (via Stripe CLI ou Dashboard) :

```bash
stripe webhook_endpoints create \
  --url=https://saas-zero.pages.dev/api/webhooks/stripe \
  --events=checkout.session.completed,invoice.paid,customer.subscription.updated,customer.subscription.deleted,payment_method.attached
```

**Secret** : `STRIPE_WEBHOOK_SECRET` dans Cloudflare Pages env vars

### 4. Brevo Webhooks Configuration

**Endpoint** : `https://saas-zero.pages.dev/api/webhooks/brevo`

**Events** :

- `delivered`, `opened`, `clicked`, `bounced`, `unsubscribed`

**Secret** : Configuré dans Brevo dashboard

### 5. Variables d'Environnement Production (Cloudflare Pages)

Dans **Cloudflare Dashboard → Pages → saas-zero → Settings → Environment variables** :

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (Workers only)
SUPABASE_DB_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brevo
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@votredomaine.com
BREVO_SENDER_NAME=Votre SaaS

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

### Cloudflare Pages

```bash
# Lister déploiements
wrangler pages deployment list --project-name=saas-zero

# Rollback vers déploiement précédent
wrangler pages deployment rollback <deployment-id> --project-name=saas-zero
```

### Supabase Migrations

```bash
# Migrations sont réversibles (DOWN dans chaque fichier .sql)
# En cas d'urgence : supabase db reset --project-ref $PROD_REF (DANGER: perte données)
# Mieux : migration corrective `supabase migration new fix_issue` → push
```

### DNS / Custom Domain

```bash
# Cloudflare Pages → Custom Domains → saas-zero.pages.dev → votre-domaine.com
# CNAME vers saas-zero.pages.dev (proxied)
```

---

## Checklist Pré-Deploy (Mental)

- [ ] `/ns-qa` → **13/13 gates PASS** ✓
- [ ] `.env.production` configuré dans Cloudflare Pages
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

# 3. Cloudflare Pages deploy
echo "☁️  Deploying to Cloudflare Pages..."
wrangler pages deploy --project-name=saas-zero --branch=main

# 4. Smoke tests
echo "🧪 Running smoke tests..."
pnpm test:e2e -- --config=playwright.smoke.config.ts

echo "✅ Deploy complete! 🎉"
echo "🌐 Live at: https://saas-zero.pages.dev"
```

---

## Monitoring Post-Deploy

| Outil                     | URL                           | Fréquence  |
| ------------------------- | ----------------------------- | ---------- |
| **Supabase Dashboard**    | Database → Logs, Auth → Users | Temps réel |
| **Stripe Dashboard**      | Webhooks → Logs, Payments     | Temps réel |
| **Brevo Dashboard**       | Transactional → Logs          | Temps réel |
| **Cloudflare Analytics**  | Pages → Analytics             | Quotidien  |
| **Plausible**             | plausible.io → votre-domaine  | Quotidien  |
| **Sentry** (si configuré) | Issues, Performance           | Temps réel |

---

## Commandes Utiles

```bash
# Deploy preview seulement
wrangler pages deploy --project-name=saas-zero --branch=preview

# Voir logs Cloudflare Workers
wrangler pages deployment tail --project-name=saas-zero

# Vérifier env vars prod
wrangler pages secret list --project-name=saas-zero

# Mettre à jour un secret
wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=saas-zero
```
