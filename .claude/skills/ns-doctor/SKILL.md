---
name: ns-doctor
description: Diagnostiquer la toolchain de dev (env, CLI, credentials, services) et lister les blocus. Équivalent gratuit de NS Setup Tools (NowStack). Utiliser quand l'env ne tourne pas.
---

# ns-doctor — Diagnostiquer la toolchain

> Équivalent de "NS Setup Tools" (NowStack). But : en 1 commande, dire ce qui bloque le dev
> (outils manquants, credentials absents, services éteints) et comment le corriger.

## Commandes de diagnostic

```bash
#!/usr/bin/env bash
echo "=== Node/pnpm ==="
node -v 2>&1; pnpm -v 2>&1

echo "=== CLI ==="
command -v supabase && supabase --version || echo "supabase MANQUANT"
command -v vercel && vercel --version || echo "vercel MANQUANT (requis pour déploiement)"

echo "=== Env (.env.local) ==="
[ -f .env.local ] && echo ".env.local présent" || echo ".env.local ABSENT → copier .env.example"
# vérifier présence des clés requises (sans les afficher)
node -e "const e=require('fs').readFileSync('.env.local','utf8'); ['SUPABASE_URL','SUPABASE_ANON_KEY','STRIPE_SECRET_KEY'].forEach(k=>console.log((e.includes(k)?'OK ':'MANQUANT ')+k))"

echo "=== Services (si local) ==="
# supabase status 2>&1 | head -5 || echo "supabase local non lancé (optionnel)"
```

## Trois catégories d'issues

| Niveau     | Exemple                                | Action                 |
| ---------- | -------------------------------------- | ---------------------- |
| Bloquant   | supabase CLI absent, .env.local absent | installer / copier env |
| À vérifier | Docker pas lancé pour supabase start   | démarrer Docker        |
| Cosmétique | vercel absent (si déploie via GitHub)  | optionnel, installable |

## Rapport

`ns-doctor` rend une liste triée : 🔴 bloquant / 🟡 à vérifier / 🟢 ok.
Ne jamais inventer un "tout va bien" : si une vérif ne peut pas tourner, le dire.

## Checklist de sortie

- [ ] CLI scrutées (node/pnpm/supabase/vercel)
- [ ] .env.local vérifié (présence + clés clés)
- [ ] Services (supabase local si applicable)
- [ ] Rapport trié par sévérité
