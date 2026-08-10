# Reference — Le "SaaS complet et beau" (produit-type) + carte des skills officiels

> **Définition (alignement utilisateur)** : le "SaaS complet et beau" n'est pas un démo à choisir,
> c'est **le produit fini que la pipeline doit savoir produire** — le modèle de référence auquel on
> compare chaque SaaS créé. Toutes les briques sont présentes, finies, belles, zéro bug.

---

## 1. LE PRODUIT-TYPE : les briques d'un SaaS complet (modèle de référence)

### A. Site de vente (conversion)

- Landing (hero + preuve sociale + problème/solution + features-bénéfices)
- Page tarifs (3 plans, toggle mois/annuel) → checkout
- FAQ (répond aux objections), mentions légales, CGU, confidentialité
- Preuve sociale : logos, témoignages identifiés, chiffres concrets

### B. Comptes & identité

- Inscription / connexion (email+mdp, magic link, OAuth) + reset
- Profil + sessions + sécurité (MFA si activé)
- B2B : organisation + membres + rôles + invitations (ou B2C utilisateur seul)

### C. L'app produit (le cœur)

- Onboarding guidé ("wow" à la première connexion, 3-5 étapes)
- Dashboard avec stats réelles + la fonction qui résout le problème
- (si B2B) dashboard des clients finaux

### D. Monétisation

- Stripe : checkout, abonnement, customer portal, webhooks
- Factures/reçus, quotas selon plan (usage-based en v2)

### E. Rétention

- Emails transactionnels (bienvenue, reset, facture, fin d'essai, réactivation)
- Notifications in-app + realtime, séquences J1/J3/J7

### F. Support / Opérations

- Page contact / FAQ
- Panneau admin (users, abonnements, stats)
- Analytics d'usage + Sentry + load testing

### G. Qualité (le "zéro bug")

- 14 gates + review en contexte vierge (isolation) + fail-closed
- k6 (charge) + Sentry (erreurs prod)

---

## 2. SKILLS OFFICIELS à référencer (surveillance du terrain, registre VoltAgent)

Nos skills `ns-*` sont les templates de méthode. On peut les **enrichir** en pointant vers les
skills officiels correspondants (gratuits, au même format SKILL.md) au lieu de tout réécrire :

| Notre skill                | Skills officiels existants                                            | Brique       |
| -------------------------- | --------------------------------------------------------------------- | ------------ |
| `ns-auth`                  | better-auth/create-auth, organization, twoFactor, providers           | comptes      |
| `ns-animations` (à relier) | greensock/gsap-core, gsap-scrolltrigger, gsap-react, gsap-performance | effet wow    |
| `ns-email`                 | resend (email), react-email, email-best-practices                     | rétention    |
| `ns-billing`               | stripe/stripe-best-practices                                          | monétisation |
| `ns-organizations`         | supabase/postgres-best-practices (RLS)                                | comptes B2B  |
| `ns-dashboard` / UI        | anthropics/frontend-design, google-labs design-md                     | app produit  |
| `ns-qa` / e2e              | anthropics/webapp-testing (Playwright)                                | zéro bug     |
| `ns-cloud` / deploy        | cloudflare/cloudflare, wrangler                                       | hébergement  |
| `ns-sentry`                | sentry (skills de triage)                                             | monitoring   |
| `ns-seo`                   | sanity seo-aeo-best-practices                                         | landing      |

> ⚠️ Certaines équipes (Better Auth, Resend, Cloudflare…) sont compatibles avec notre stack
> (Next.js + Supabase). D'autres (sanity, netlify, clickhouse) ne le sont pas — à ignorer,
> on garde notre stack (voir [[vision-pipeline-unifiee]]).

---

## 3. Ce que ça change concrètement pour notre pipeline

1. _*Les ns-* sont la bonne architecture_* (portables, nommés ns-<fonction>) — on reste dessus.
2. **On enrichit** chaque skill ns-* d'un lien/ad notifyé vers le skill officiel correspondant
   (ex : ns-auth → better-auth, ns-design → gsap) pour que le builder ne réinvente pas la roue.
3. **Le produit-type sert de barème** : à chaque SaaS produit par /ns-ship, on vérifie la
   checklist §1 (toutes les briques présentes) — c'est le critère "complet et beau".

---

_Etabli via la surveillance des registres de skills (une partie reservée), 2026-08-06._
