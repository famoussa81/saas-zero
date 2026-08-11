---
name: ns-sections
description: "Catalogue d'archétypes de sections marketing avec plusieurs variantes de mise en page chacune. Sert à composer une landing complète sans que deux projets se ressemblent : on choisit une variante par section selon le produit, jamais la même combinaison."
---

# Skill `ns-sections` — Catalogue de sections et variantes

> **But** : une landing = une suite de sections. Si on prend toujours la même variante de chaque section, tous les projets se ressemblent. Ce skill fournit **plusieurs formes par section** et la règle pour composer une combinaison unique.
>
> **Entrée** : `DESIGN-CHOICE.md` (direction artistique + palier motion).
> **Sortie** : sections dans `components/marketing/`, assemblées dans `app/[locale]/page.tsx`.

---

## Règle de composition (anti-répétition)

1. Une landing = **5 à 7 sections**. Au-delà, le lecteur décroche.
2. **Alterner les rythmes** : jamais deux grilles de cartes qui se suivent. Grille → liste → tableau → pleine largeur.
3. **Un seul moment fort** (cf. `ns-design-direction` §Règle 5). Les autres sections le servent.
4. Enregistrer la combinaison choisie dans `.claude/design-history.json` → le projet suivant doit différer sur au moins **3 sections**.

Ordre de référence (à adapter, pas à suivre aveuglément) :

```
Hero → Preuve → Problème/Solution → Features → Comment ça marche → Pricing → FAQ → CTA
```

---

## 1. Hero

Le hero porte la thèse. C'est le seul endroit où on a droit à l'audace maximale.

| Variante               | Quand                                  | Forme                                                    |
| ---------------------- | -------------------------------------- | -------------------------------------------------------- |
| **A. Démo vivante**    | Produit visuel ou en ligne de commande | Texte à gauche, produit qui tourne à droite              |
| **B. Typo massive**    | Positionnement fort, produit abstrait  | Titre plein écran, sous-titre minimal, 1 CTA             |
| **C. Capture produit** | UI riche, dashboard                    | Texte centré + screenshot large en dessous, ombre portée |
| **D. Interactif**      | Outil, calculateur                     | L'utilisateur essaie le produit **dans** le hero         |
| **E. Split diagonal**  | Créatif, agence                        | Coupe oblique, image pleine d'un côté                    |

**Ne jamais** : dégradé violet, orbes flous, "The #1 platform for...".

Référence variante A : `components/marketing/PipelineHero.tsx` (terminal qui exécute la vraie commande).

---

## 2. Preuve sociale

Placée **juste après** le hero. Sa fonction : lever le doute avant que le lecteur ne descende.

| Variante                     | Quand                    | Forme                                          |
| ---------------------------- | ------------------------ | ---------------------------------------------- |
| **A. Bandeau de logos**      | Clients connus           | Ligne de logos en niveaux de gris, opacité 60% |
| **B. Métriques**             | Pas encore de clients    | 3-4 chiffres qui comptent (compteurs animés)   |
| **C. Citation unique**       | Un témoignage fort       | Grande citation, photo, nom + rôle + société   |
| **D. Grille de témoignages** | Plusieurs avis           | 3-6 cartes, hauteurs variables (masonry)       |
| **E. Note agrégée**          | Présence G2/Product Hunt | Étoiles + note + lien vérifiable               |

**Honnêteté obligatoire** : sans clients réels, utiliser la variante B avec des métriques **vraies** sur le produit (tests, couverture, temps de build). Jamais de faux témoignages ni de logos non autorisés.

---

## 3. Problème / Solution

Souvent oubliée, pourtant c'est elle qui fait dire « c'est exactement mon problème ».

| Variante                     | Quand               | Forme                                                  |
| ---------------------------- | ------------------- | ------------------------------------------------------ |
| **A. Avant / Après**         | Douleur claire      | 2 colonnes, gauche terne (avant), droite vive (après)  |
| **B. Liste de douleurs**     | Plusieurs frictions | 3 douleurs ✗ puis 3 réponses ✓                         |
| **C. Narratif**              | Vente complexe      | Un paragraphe qui raconte la journée du persona        |
| **D. Comparatif concurrent** | Marché encombré     | Tableau nous / alternative (factuel, jamais dénigrant) |

---

## 4. Features

| Variante                | Quand                                  | Forme                                                |
| ----------------------- | -------------------------------------- | ---------------------------------------------------- |
| **A. Grille de cartes** | 3-6 features équivalentes              | 2-3 colonnes, icône + titre + description + bénéfice |
| **B. Alternance**       | 3-4 features à montrer                 | Texte/visuel alternés gauche-droite, pleine largeur  |
| **C. Onglets**          | Features par persona                   | Sélecteur en haut, panneau qui change                |
| **D. Bento**            | Features d'importances inégales        | Grille asymétrique, la principale occupe 2 cases     |
| **E. Liste dense**      | Beaucoup de features, public technique | 2 colonnes de lignes courtes ✓                       |

Référence variante A avec stagger : `components/marketing/FeatureGrid.tsx`.

**Règle de rédaction** : chaque feature dit un **bénéfice**, pas une spec. « Sécurité enterprise dès le jour 1 » et non « RLS Postgres ».

---

## 5. Comment ça marche

| Variante                  | Quand                | Forme                                                 |
| ------------------------- | -------------------- | ----------------------------------------------------- |
| **A. Timeline verticale** | Processus séquentiel | Ligne qui se dessine au scroll, étapes qui s'allument |
| **B. Étapes numérotées**  | 3 étapes simples     | Horizontal, 3 colonnes, numéros typés                 |
| **C. Schéma animé**       | Flux technique       | Diagramme, éléments révélés au scroll                 |
| **D. Vidéo / GIF**        | Démonstration        | Capture d'écran en boucle, sans son                   |

Référence variante A : `components/marketing/PipelineTimeline.tsx` (scrub GSAP + `onEnter`).

**Numéros** : n'utiliser 01/02/03 que si l'ordre porte vraiment de l'information (vraie séquence). Sinon c'est de la décoration.

---

## 6. Pricing

Voir `ns-setup-pricing` §Étape 4 pour les 5 variantes (cartes, tableau comparatif, curseur d'usage, deux colonnes, prix unique).

---

## 7. FAQ

Traite les objections restantes juste avant le CTA final. Ajoute du SEO (JSON-LD `FAQPage`).

| Variante             | Quand                 | Forme                                        |
| -------------------- | --------------------- | -------------------------------------------- |
| **A. Accordéon**     | 5-8 questions         | Une colonne, `<details>` ou Radix Accordion  |
| **B. Deux colonnes** | 6-10 questions        | Questions réparties, tout ouvert             |
| **C. Par catégorie** | Beaucoup de questions | Onglets (Facturation / Technique / Sécurité) |

**Les bonnes questions** = les vraies objections : « Et si je veux annuler ? », « Mes données sont où ? », « Ça marche avec X ? ». Pas « Qu'est-ce que le SaaS ? ».

Ajouter le JSON-LD :

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }),
  }}
/>
```

---

## 8. CTA final

| Variante                 | Quand           | Forme                                                  |
| ------------------------ | --------------- | ------------------------------------------------------ |
| **A. Bloc contrasté**    | Défaut          | Encart pleine largeur, fond différent, 1 CTA principal |
| **B. Rappel du hero**    | Page longue     | Reprend la promesse du hero, boucle la narration       |
| **C. Formulaire inline** | Capture d'email | Champ + bouton directement, pas de redirection         |
| **D. Minimal**           | Design sobre    | Une phrase, un lien souligné                           |

**Un seul CTA principal.** Un CTA secondaire max, visuellement discret.

---

## Sections optionnelles

| Section                   | Quand l'ajouter                             |
| ------------------------- | ------------------------------------------- |
| **Intégrations**          | Le produit se connecte à des outils connus  |
| **Sécurité / Conformité** | Vente B2B, données sensibles (SOC2, RGPD)   |
| **Changelog / Roadmap**   | Public technique, montre que le produit vit |
| **Comparatif**            | Marché encombré, on arrive en challenger    |

---

## Procédure

1. Lire `DISCOVERY.md` (persona, objections, preuves disponibles) + `DESIGN-CHOICE.md`.
2. Choisir les **5-7 sections** nécessaires — pas toutes.
3. Pour chacune, choisir **une variante**, en vérifiant la règle d'alternance des rythmes.
4. Vérifier contre `.claude/design-history.json` : au moins 3 sections doivent différer du projet précédent.
5. Un composant par section dans `components/marketing/`, données passées en props **sérialisables** (cf. `ns-motion` §piège RSC).
6. Assembler dans `app/[locale]/page.tsx` avec un `data-testid="landing-<nom>"` par section (les tests E2E s'appuient dessus).
7. `pnpm typecheck && pnpm lint && pnpm build`, puis vérifier dans un navigateur, onglet neuf.

---

## Liens

- `ns-design-direction` — direction artistique et interdits
- `ns-motion` — quelle animation par section
- `ns-setup-pricing` — variantes de la section pricing
- `ns-landing` — assemblage et SEO de la page
