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

# 4. Smoke tests
echo "🧪 Running smoke tests..."
pnpm test:e2e -- --config=playwright.smoke.config.ts

echo "✅ Deploy complete! 🎉"
echo "🌐 Live at: https://saas-zero.vercel.app"