---
name: ns-landing
description: Site de vente du SaaS — landing qui convertit (hero, preuve sociale, features, tarifs, FAQ, legal), avec l'effet wow et la rassurance "des pros". Utiliser pour la partie marketing/vente du SaaS.
---

# ns-landing — Le site de vente (qui convertit)

> **Ton pilier "effet wow qui fait acheter"** : la landing rassure ("des pros"), résout
> ("je vois que ça résout mon problème") et pousse à l'action (inscription → paiement).

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

## Sections de conversion (dans l'ordre)

1. **Hero** — promesse claire + élément signature (animation/motif) + CTA.
2. **Logo/Preuve sociale** — "Ils utilisent" + logos (les marques rassurent).
3. **Problème/Solution** — "tu as ce problème → voilà la solution" (texte direct, pas de jargon).
4. **Features** — 3-6 blocs, chaque feature = bénéfice pour le user, pas une fonctionnalité.
5. **Témoignages** — de vrais avis (identifiés), pas de phrases génériques.
6. **Tarifs** — 3 plans, toggle mensuel/annuel (voir ns-billing).
7. **FAQ** — objections : sécurité, annulation, support, migration.
8. **CTA final** — une dernière invitation à s'inscrire + éléments de confiance.
9. **Footer + legal** — mentions légales, confidentialité, CGU (pages dédiées).

## La rassurance "pros"

- Avoir l'air sérieux : typographie propre, cohérence, pas de fautes, pas de "Lorem ipsum".
- Chiffres concrets si dispo (utilisateurs, uptime, avis).
- Badges de confiance (paiement sécurisé, RGPD, support) — vrais, pas des images volées.

## L'effet wow (élément signature)

- Un hero qui bouge (GSAP/scroll-reveal/3D/vidéo) selon le niveau demandé (Minimal/Modérée/Bold).
- NE PAS surcharger : le wow au bon endroit (hero, une section, pricing) suffit.
- Dark mode cohérent avec l'app (mêmes tokens — voir ns-design-system).

## Implémentation (Next.js)

- Routes marketing : `/` (home), `/tarifs`, `/faq`, `/mentions-legales`, `/confidentialite`, `/cgv`.
- Layout marketing séparé du layout app.
- SEO : metadata, OG, sitemap (voir ns-next-sitemap, ns-json-ld).

## Checklist de sortie

- [ ] Hero avec promesse + élément signature
- [ ] Preuve sociale (logos/témoignages réels)
- [ ] Problème → Solution explicite
- [ ] Features = bénéfices, pas fonctions
- [ ] Tarifs + toggle + CTA → checkout
- [ ] FAQ qui répond aux objections
- [ ] Pages legal présentes
- [ ] LCP < 2,5s, mobile parfait
