# DISCOVERY.md — Décisions & Raisonnement (Carnet de Bord)

> **Généré par le skill `ns-discovery` (Phase 1 Discovery).**
> Ce document capture le **POURQUOI** de chaque décision produit/business/architecture/design.
> `SPEC.md` est le contrat exécutable ; `DISCOVERY.md` est le raisonnement qui le justifie.

---

## 1. Header

| Champ              | Valeur                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Projet**         | saas-zero — Pipeline SaaS Zero-Risk                                                                                                                                     |
| **Date**           | 2026-08-09                                                                                                                                                              |
| **Statut**         | Validé                                                                                                                                                                  |
| **Owner**          | Fondateur solo + agents Claude Code                                                                                                                                     |
| **Brief original** | "Reconstruire en gratuit la pipeline SaaS de Melvynx/NowStack : workflow commandé, complet, unifié. Chaque SaaS produit doit être complet, avec effet wow et zéro bug." |

---

## 2. Lean Canvas

| Bloc                                | Contenu                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Problème**                     | Lancer un SaaS complet prend des mois ; les starter kits sont génériques, incomplets ou payants ; NowStack est excellent mais cher. Alternatives actuelles : templates génériques, boilerplates payants, tout faire à la main. |
| **2. Segments clients**             | Fondateurs solo, petites équipes, développeurs qui veulent shipper vite sans refaire l'infra.                                                                                                                                  |
| **3. Proposition de valeur unique** | Une pipeline commandée qui produit un SaaS complet (marketing, auth, billing, design signature) en quelques heures, gratuitement, avec zéro bug.                                                                               |
| **4. Solution**                     | Pipeline `ns-ship` en 6 phases (Discovery → Deploy) avec 14 gates déterministes ; génère Next.js + Supabase + Stripe + Brevo.                                                                                                  |
| **5. Canaux**                       | SEO (docs + exemples), GitHub (open source), communautés dev, bouche-à-oreille.                                                                                                                                                |
| **6. Revenus**                      | Pipeline gratuite et open source ; chaque SaaS produit est monétisable (tiers Stripe).                                                                                                                                         |
| **7. Coûts**                        | Infra gratuite (Vercel + Supabase Free + Stripe), temps du fondateur, maintenance open source.                                                                                                                                 |
| **8. Métriques clés**               | SaaS créés via la pipeline, temps Discovery→Deploy, % gates verts, adoption.                                                                                                                                                   |
| **9. Avantage déloyal**             | Pipeline complète intégrée à Claude Code (agents + skills + gates), décisions verrouillées en Discovery, élément signature.                                                                                                    |

---

## 3. Personas / ICP

| Champ                   | Persona 1                                                             | Persona 2                                           |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| Rôle                    | Fondateur solo développeur                                            | Lead d'équipe produit                               |
| **Douleur**             | Pas le temps de tout builder ; peur des dettes techniques et des bugs | Équipe réduite, veut lancer plusieurs produits vite |
| **Budget**              | 0-50$ par mois                                                        | 100-500$ par mois                                   |
| **Tech-savviness**      | Haute                                                                 | Moyenne à haute                                     |
| **Déclencheur d'achat** | Voir un SaaS complet généré en 1 commande                             | Gagner des semaines sur l'infrastructure            |
| **ICP (idéal ou non)**  | ICP                                                                   | ICP                                                 |

---

## 4. Jobs-to-be-done

- Quand je veux lancer un SaaS sans refaire l'infra à chaque fois, je veux une pipeline qui scaffolde tout (marketing + app + billing) afin de shipper en heures.
- Quand j'ai une idée floue, je veux un entretien de Discovery qui me fait trancher (B2B/B2C, design, pricing) afin de ne pas gâcher du code.
- Quand je déploie, je veux 14 gates déterministes qui bloquent les régressions afin d'avoir zéro bug en production.

---

## 5. Matrice concurrentielle & Positionnement

| Concurrent                                     | Forces                                             | Faiblesses                                                     | Positionnement actuel     |
| ---------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| NowStack (Melvynx)                             | Pipeline commandée complète, 41 skills, très polie | Payant, fermé                                                  | Premium, intégré à Claude |
| Starter kits open source (create-t3-app, etc.) | Gratuits, populaires                               | Pas de pipeline produit, pas de design, pas de billing intégré | Simple scaffolding        |
| Boilerplates payants (ShipFast, etc.)          | Rapides, beau design                               | Payants, pas de Discovery, pas de gates qualité                | Templates préfaits        |

**Wedge d'entrée** : gratuit, open source, pipeline commandée complète avec Discovery maximisée et gates déterministes.

**Positionnement** : Pour les fondateurs qui veulent lancer un SaaS complet sans infrastructure, saas-zero est une pipeline commandée qui génère le produit entier (marketing, auth, billing, design signature). Contrairement aux starter kits, chaque décision est verrouillée en Discovery et chaque gate est déterministe.

---

## 6. Monétisation & Unit Economics

### Modèle & Pricing

La pipeline est gratuite et open source. Chaque SaaS produit est monétisable via ces tiers par défaut :

| Tier       | Prix mensuel | Prix annuel (-20%) | Features incluses                |
| ---------- | ------------ | ------------------ | -------------------------------- |
| Free       | 0$           | 0$                 | 1 projet, auth, communauté       |
| Starter    | 9$           | 86$                | 3 projets, équipe, support email |
| Pro        | 29$          | 278$               | Illimité, API, portail Stripe    |
| Enterprise | Custom       | Custom             | SSO, audit, support dédié        |

### Unit Economics (du SaaS produit type)

| Métrique                           | Cible       | Justification                               |
| ---------------------------------- | ----------- | ------------------------------------------- |
| **ACV** (revenu annuel par client) | 348$        | 29$/mois × 12 ou mix Starter/Pro            |
| **Marge brute**                    | 80%         | Infra cloud peu chère, coût variable faible |
| **Churn max acceptable**           | 3% par mois | Inférieur au prix d'acquisition amorti      |
| **LTV** (durée vie × ACV)          | 1160$       | 40 mois × 29$                               |
| **Payback** (LTV/CAC)              | 3x          | CAC max 386$                                |
| **MRR cible à 6 mois**             | 3000$       | ~100 clients Starter                        |
| **MRR cible à 12 mois**            | 10000$      | ~350 clients Starter                        |

---

## 7. Funnel Conversion & Rétention (doctrine utilisateur)

> _Attirer avec le wow → convaincre avec la qualité → rassurer avec le zéro bug._
> _S'inscrire → payer → RESTER._

| Étape funnel   | Ce qui convertit à cette étape                               | Métrique cible           |
| -------------- | ------------------------------------------------------------ | ------------------------ |
| **Attirer**    | Hero wow, élément signature (check émeraude), preuve sociale | 10000 visiteurs/mois     |
| **Convaincre** | Landing features-bénéfices, démo, tarifs clairs              | 30% taux scroll profond  |
| **Rassurer**   | Preuve sociale, garanties, sécurité, clients types           | 90% signaux de confiance |
| **S'inscrire** | Onboarding guidé, friction minimale                          | 25% taux d'inscription   |
| **Payer**      | Pricing clair, essai, portail self-service                   | 8% free→paid conversion  |
| **Rester**     | Valeur continue, habitude, notifications, emails             | 85% rétention M3         |

**Onboarding** : premier succès en moins de 5 minutes. Parcours : inscription → création du premier projet → première tâche complétée. Emails : welcome, activation, nudge.

**Boucle d'habitude** : déclencheur → action → récompense variable → investissement (ex : la tâche se met à jour, l'équipe est notifiée).

---

## 8. Décisions Verrouillées

| Décision       | Options considérées                 | Chois                                 | Raisonnement                                                      |
| -------------- | ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| B2B vs B2C     | B2B multi-tenant / B2C single-user  | Les deux (schémas séparés)            | Le Discovery de chaque SaaS tranche ; les deux schémas coexistent |
| Modèle pricing | tiers / usage / freemium            | Tiers (Free/Starter/Pro)              | Simple, prévisible, standard B2B                                  |
| Design system  | Linear/Vercel/Stripe/Framer/Custom  | ship-flow (shadcn + Radix + Tailwind) | Déjà en place, beau, accessible                                   |
| Motion tier    | Minimal/Moderate/Bold               | Modéré à Bold (GSAP + Framer Motion)  | Effet wow sans surcharge                                          |
| Auth           | email+password/magic link/OAuth/MFA | Email + OAuth + MFA optionnel         | Supabase Auth                                                     |
| Billing        | Stripe tiers/portail/webhooks       | Stripe Checkout + Portal + webhooks   | Standard, testable                                                |
| Email          | Brevo/Resend                        | Brevo                                 | Transactionnel + marketing gratuit                                |
| Stack          | Next.js 14 App Router               | Next.js 14 App Router                 | Code existant fonctionnel, déploiement Vercel                     |

---

## 9. Impact Traceability (feature → code / gates)

| Feature (MVP)     | Tables / RLS                                      | Pages                             | Gates impactés       |
| ----------------- | ------------------------------------------------- | --------------------------------- | -------------------- |
| Auth & onboarding | profiles, auth.users — RLS                        | /[locale]/connexion, /inscription | typecheck, e2e, a11y |
| Organisation      | organizations, org_members, invitations — RLS org | /(app)/equipe                     | rls, e2e             |
| Kanban produit    | projects, columns, tasks — RLS org                | /(app)/projets                    | test, e2e            |
| Billing           | stripe_customers, subscriptions                   | /(app)/facturation                | e2e, security        |
| Email             | Brevo externe                                     | —                                 | test                 |

---

## 10. Métriques de Succès

| Type            | Métrique                                          | Cible                |
| --------------- | ------------------------------------------------- | -------------------- |
| **North Star**  | SaaS créés par semaine via la pipeline            | 5 SaaS/semaine       |
| **Acquisition** | Trafic organique (docs + exemples)                | 10000 visiteurs/mois |
| **Activation**  | % découvertes qui atteignent discovery:check 100% | 80%                  |
| **Rétention**   | Utilisation répétée de la pipeline                | 60% M3               |
| **Revenu**      | MRR cumulé des SaaS produits                      | 10000$ à 12 mois     |
| **Qualité**     | Bugs critiques en production                      | 0                    |

---

## 11. Risques & Mitigation

| Risque                                                      | Likelihood | Impact | Mitigation                                 |
| ----------------------------------------------------------- | ---------- | ------ | ------------------------------------------ |
| Conflit de schémas B2B/B2C en prod                          | H          | H      | Migrations séparées + tests pgTAP en CI    |
| Gates bloquantes non exécutables localement (pas de Docker) | H          | M      | CI exécute supabase test db ; docs claires |
| Complexité du pipeline monolithique                         | M          | H      | Découpage par phases + gates par phase     |
| Billing fragile (webhooks)                                  | M          | H      | Tests Stripe en mode test, idempotence     |
| Dépendance à un seul fondateur                              | M          | M      | Documentation + agents automatisés         |

---

## 12. Questions Ouvertes

- [ ] Lancer un SaaS de démonstration complet pour valider la pipeline de bout en bout.
- [ ] Publier la pipeline en open source sur GitHub.

---

## Validation

| Gate                               | Statut   |
| ---------------------------------- | -------- |
| **Complétude** (`discovery:check`) | 100/100  |
| **Validation humaine**             | Approuvé |

> **Bloquant** : ne pas passer à la Phase 2 (scaffold) sans complétude 100% + approbation humaine.

---

_Généré par le skill `ns-discovery` — Pipeline saas-zero_
