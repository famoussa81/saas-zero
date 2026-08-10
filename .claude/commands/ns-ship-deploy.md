---
name: ns-ship-deploy
description: Production deploy command - deploys to production assuming verify passed
aliases: [deploy]
---

# `/ns-ship-deploy` — Production Deploy

Deploys to production. **Assumes `/ns-verify` passed.**

## Prerequisites

- All 14 quality gates pass (`pnpm gates:all`)
- Production secrets configured in environment
- Manual confirmation required before production deploy

## Steps

### 1. Confirm Production Deploy

```bash
echo "⚠️  PRODUCTION DEPLOY - This will deploy to live Vercel + Supabase production"
read -p "Type 'deploy' to confirm: " confirm
if [ "$confirm" != "deploy" ]; then
  echo "❌ Aborted"
  exit 1
fi
```

### 2. Deploy to Vercel (Production)

```bash
npx vercel --prod
```

### 3. Apply Supabase Migrations to Production

```bash
supabase db push --linked
```

### 4. Update Stripe Webhook URL to Production Domain

```bash
# Get production domain from Vercel deployment
PROD_URL=${NEXT_PUBLIC_APP_URL:-"https://<projet>.vercel.app"}

# Update Stripe webhook endpoint
stripe webhook_endpoints update <WEBHOOK_ENDPOINT_ID> --url="${PROD_URL}/api/stripe/webhook"
```

### 5. Update Brevo Webhook URL (if needed)

```bash
# Update Brevo webhook to production domain
curl -X PUT "https://api.brevo.com/v3/webhooks/<WEBHOOK_ID>" \
  -H "api-key: ${BREVO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${PROD_URL}/api/brevo/webhook\", \"description\": \"Production webhook\"}"
```

### 6. Run Smoke Tests on Production URL

```bash
# Health check
curl -f "${PROD_URL}/api/health" || exit 1

# Auth flow smoke test
npx playwright test tests/e2e/smoke/production-auth.spec.ts --project=chromium

# Billing flow smoke test
npx playwright test tests/e2e/smoke/production-billing.spec.ts --project=chromium
```

### 7. Tag Release in Git

```bash
VERSION=$(node -p "require('./package.json').version")
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin "v${VERSION}"
```

## Environment Variables Required (Production)

```bash
# Supabase Production
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Stripe Production
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Brevo Production
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# Vercel Production
VERCEL_TOKEN=
NEXT_PUBLIC_APP_URL=https://<projet>.vercel.app
```

## Usage

```bash
/ns-ship-deploy
# or
/deploy
```

## Notes

- This command should ONLY be run after `/ns-verify` passes all gates
- Production secrets must be configured in Vercel dashboard (Project → Settings → Environment Variables) AND local environment
- Stripe/Brevo webhook IDs must be known/configured beforehand
- Rollback: `npx vercel ls` → Dashboard → Deployments → ⋯ → Promote previous deployment
