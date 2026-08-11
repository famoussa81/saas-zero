---
name: ns-design-direction
description: "Moteur de direction artistique anti-générique. Choisit une identité visuelle DISTINCTE par projet (palette, typo, grille, élément signature) et interdit explicitement les patterns AI-générés reconnaissables. Garantit que deux SaaS produits par la pipeline ne se ressemblent jamais."
---

# Skill `ns-design-direction` — Direction Artistique Anti-Générique

> **But** : empêcher que chaque SaaS généré ressemble au précédent. Ce skill produit une **direction artistique unique et argumentée**, ancrée dans le métier du produit, pas dans les réflexes par défaut d'un LLM.
>
> **Entrée** : `DISCOVERY.md` (persona, positionnement, secteur, émotion cible).
> **Sortie** : section "Direction Artistique" de `DESIGN-CHOICE.md` + `tokens/` initialisés.
> **Phase** : 3 (Design), avant toute écriture de composant.

---

## Règle n°1 — La liste rouge (interdits par défaut)

Ces patterns sont les **tells** d'un design généré par IA. Ils sont **interdits** sauf si l'utilisateur les demande explicitement, ou si la direction artistique les justifie par écrit.

| Interdit                                            | Pourquoi                        | Alternative                                          |
| --------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| Crème `#F4F1EA` + serif display + accent terracotta | Combo n°1 des landing pages IA  | Neutre teinté vers l'accent réel du projet           |
| Near-black + un seul pop vert acide / vermillon     | Cliché "dark SaaS 2024"         | Palette à 2 accents liés, ou mono chaud              |
| Dégradé violet→bleu en hero sur fond blanc          | Le plus reconnaissable de tous  | Fond plat + une seule zone de couleur forte          |
| Orbes floutés en fond (`filter: blur(80px)`)        | Décor sans signification        | Élément signature qui **dit** ce que fait le produit |
| Inter / Space Grotesk par défaut                    | Choix "sûr" = choix invisible   | Voir §Typographie ci-dessous                         |
| Emoji comme marqueur de section                     | Amateur, casse le ton pro       | Numéros typés, règles, icônes dessinées              |
| Tout centré, `rounded-lg` partout                   | Absence de parti pris           | Asymétrie assumée, rayons variés selon le rôle       |
| Card + barre d'accent latérale (`border-l-4`)       | Détecté par `impeccable detect` | Fond différencié ou élévation                        |
| Glassmorphism sur tout                              | Effet de mode 2021              | Réserver à 1 surface max (nav ou modale)             |

**Vérification automatique** : `pnpm design:check` (gate #14) + `npx impeccable detect app components lib --json`.

---

## Règle n°2 — Ancrer dans le métier, pas dans le vide

La direction ne se choisit pas dans un catalogue. Elle se **dérive du monde du produit**.

Questions à se poser (dans cet ordre) :

1. **Quel est le matériau du métier ?** Un SaaS de compta → papier, tableur, tampon, colonne chiffrée. Un SaaS de musique → forme d'onde, piste, sillon. Un SaaS de logistique → conteneur, itinéraire, étiquette.
2. **Quel instrument utilise le persona ?** Terminal ? Presse-papier ? Tableau blanc ? Table de mixage ?
3. **Quelle émotion doit dominer à l'arrivée ?** Confiance froide (fintech), énergie (créatif), calme (santé), précision (dev tools).
4. **Que ferait le concurrent ?** → et on fait **délibérément autre chose** sur au moins un axe.

L'élément signature sort de là. Exemple réel dans ce repo : le produit vend une pipeline en ligne de commande → l'élément signature est un **terminal qui exécute la vraie commande** (`components/marketing/PipelineHero.tsx`), pas une forme abstraite.

---

## Règle n°3 — Palette (formule, pas inspiration)

```
1 neutre (fond)         ← teinté vers l'accent, jamais gris pur
1 neutre (texte)        ← contraste ≥ 7:1 sur le fond
1 accent principal      ← issu du métier (§Règle 2)
1 accent secondaire     ← analogue ou complémentaire décalé, PAS un 2e vif
3 sémantiques           ← success / warning / danger, distincts de l'accent
```

**Contraintes dures** :

- Gris pur (`#808080`, `hsl(0 0% 50%)`) interdit : le neutre porte une trace de teinte de l'accent.
- L'accent doit fonctionner sur fond clair **et** sombre → si non, désaturer plutôt que changer de teinte.
- Les couleurs sémantiques ne servent jamais de couleur de marque.
- Tout passe par les tokens CSS de `src/styles/globals.css` + `tailwind.config.ts`. Zéro hex en composant (gate #14 le vérifie).

---

## Règle n°4 — Typographie (2 rôles minimum, jamais le défaut)

| Rôle                      | Fonction                             | Critère de choix                                                    |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| **Display**               | Titres, hero, chiffres clés          | Doit avoir un caractère : une lettre reconnaissable (`g`, `a`, `R`) |
| **Body**                  | Texte courant, UI                    | Lisible à 15-16px, x-height généreuse                               |
| **Mono** _(si data/code)_ | Chiffres alignés, terminal, tableaux | `font-variant-numeric: tabular-nums` obligatoire                    |

**Interdits** : Inter en display, Space Grotesk sans justification, un seul font pour tout.

**Échelle** : fixer un ratio (1.2 / 1.25 / 1.333) et s'y tenir. Les tailles vivent dans `--font-size-*`, jamais en dur.

**Texte courant** : viser ~65 caractères par ligne (`max-w-[65ch]` ou équivalent token).

---

## Règle n°5 — Un seul endroit où on est audacieux

La règle qui sépare un design réussi d'un design chargé :

> **Une seule zone porte l'audace. Tout le reste est calme.**

Si le hero a un moment fort (animation, typo massive, couleur pleine), alors les sections suivantes sont sobres. Si c'est une section produit qui porte l'effet, le hero est calme.

Anti-pattern : chaque section essaie d'être la plus impressionnante → bruit, fatigue, aucun souvenir.

---

## Procédure

1. Lire `DISCOVERY.md` → secteur, persona, émotion cible, positionnement.
2. Répondre par écrit aux 4 questions de la §Règle 2.
3. Proposer **2 directions contrastées** à l'utilisateur via `AskUserQuestion` (pas 1 seule : le choix révèle le goût).
   - Chaque direction = 1 phrase d'intention + palette (4-6 hex) + paire typo + concept d'élément signature.
4. Direction retenue → écrire la section "Direction Artistique" dans `DESIGN-CHOICE.md`, avec **le raisonnement** (pourquoi ces choix pour CE produit).
5. Écrire les tokens dans `src/styles/globals.css` (+ mapper dans `tailwind.config.ts`, cf. `ns-design-system`).
6. Lancer `pnpm design:check` → doit passer avant tout composant.

---

## Anti-répétition entre projets

Avant de figer une direction, vérifier qu'elle **diffère des précédentes** :

```bash
# Directions déjà utilisées par la pipeline (à maintenir)
cat .claude/design-history.json 2>/dev/null || echo "[]"
```

Enregistrer chaque direction retenue :

```json
{
  "project": "nom-du-saas",
  "date": "2026-08-11",
  "accent": "#hex",
  "displayFont": "NomFonte",
  "signature": "description courte de l'élément signature",
  "mood": "3 mots"
}
```

**Règle** : une nouvelle direction ne doit partager avec une précédente ni la famille d'accent (±30° de teinte), ni la fonte display, ni le concept d'élément signature. Si collision → repartir sur la §Règle 2.

---

## Liens

- `ns-design-system` — implémentation des tokens
- `ns-motion` — paliers d'animation
- `ns-sections` — archétypes de sections et leurs variantes
- `ns-design-import` — quand un design system existe déjà
- `design-audit` — gate #14 déterministe
