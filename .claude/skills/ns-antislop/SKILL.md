---
name: ns-antislop
description: "Filtre de livraison contre l'UI générée générique. 38 règles réparties en Hard Gate (absolu), Purpose-Gate (technique autorisée si la raison est écrite) et Quality Locks (cohérence). Applique aussi les cinq critères d'artisanat C-1 à C-5. À charger AVANT de livrer une page, et à repasser avant de déclarer terminé."
---

# ns-antislop — le filtre de livraison

> Complémentaire à `ns-design-direction`, qui **choisit** une identité. Celui-ci
> **refuse** ce qui trahit la génération automatique, quelle que soit
> l'identité choisie.
>
> Adapté du travail de la communauté anti-slop (licence MIT) :
> [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop),
> [awaken7050dev/anti-slop-ui](https://github.com/awaken7050dev/anti-slop-ui),
> [funboy322/avoid-ai-design](https://github.com/funboy322/avoid-ai-design).
> Les règles sont reformulées et reliées aux gates de cette pipeline ; la
> paternité de la grille revient à ces dépôts.

## Pourquoi ce skill existe

La première landing produite par la pipeline a passé le gate anti-générique
tout en affichant : six cartes de features rigoureusement identiques, trois
étapes numérotées, toutes les sections centrées sous un titre + sous-titre, et
trois statistiques inventées sur un produit sans un seul utilisateur.

Chacun de ces défauts a une règle ci-dessous. Aucune n'était écrite.

---

## Les trois niveaux

| Niveau           | Sens                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| **Hard Gate**    | Absolu. Aucune exception, aucune justification recevable.              |
| **Purpose-Gate** | Technique autorisée **si** la raison est écrite, en une ligne.         |
| **Quality Lock** | Cohérence. Se juge sur l'ensemble de la page, pas élément par élément. |

---

## Hard Gate — non négociable

**H-1 — Aucun chiffre sans source réelle.**
Une statistique affichée est vraie et vérifiable, ou elle n'existe pas. Pas de
« 2 481 clics mesurés » sur un produit à zéro utilisateur, pas de « 50 ms »
jamais mesuré. Si la donnée n'existe pas encore : supprimer le bloc, ou
afficher un placeholder honnête (`[DONNÉE RÉELLE]`).

**H-2 — Aucun témoignage fabriqué.**
Pas d'avatar généré, pas de nom inventé, pas de fonction plausible. Une preuve
sociale est vérifiable ou absente. Une section témoignages vide vaut mieux
qu'une section crédible et fausse.

**H-3 — Aucune revendication inventée.**
Sécurité, conformité, performance, nombre de clients : rien qui ne soit
démontrable. Le mensonge marketing se retourne au premier client sérieux.

**H-4 — Aucun contrôle mort.**
Chaque bouton, lien et formulaire fait quelque chose de réel : navigue, ouvre,
bascule, soumet avec retour visible. Un élément sans comportement se supprime,
il ne se laisse pas en décor.

**H-5 — Aucun lien de navigation vers le vide.**
Chaque entrée de menu mène à une destination qui existe. Un lien vers une
ancre absente est un bug, pas un détail.

**H-6 — Les cinq états existent.**
Vide, chargement, erreur, introuvable, sans droits. Une interface au seul
chemin nominal n'est pas livrable. Détail : `ns-error-states`.

**H-7 — Contraste WCAG AA.**
4,5:1 sur le texte courant, 3:1 sur le grand texte. Jamais de gris sur gris ni
de blanc sur dégradé clair. Vérifié par `pnpm gate:accessibility`.

**H-8 — Navigation clavier complète.**
Tab, Maj+Tab, Entrée, Espace, Échap. Indicateur de focus visible partout.
Jamais `outline: none` sans remplacement.

**H-9 — Les deux thèmes fonctionnent.**
Si un basculement clair/sombre existe, les deux sont vérifiés — contraste,
couleurs, composants. Un thème sombre approximatif est pire que pas de thème
sombre.

**H-10 — Mobile sans débordement.**
Aucun défilement horizontal, texte contenu, cibles tactiles ≥ 44 px, espacement
cohérent d'un point de rupture à l'autre.

**H-11 — Direction artistique chargée avant de coder.**
`DESIGN-CHOICE.md` lu, ou arrêt. Pas de repli silencieux sur le défaut stérile.
Si la direction n'existe pas et que l'utilisateur est injoignable : livrer en
annonçant explicitement « brouillon sans direction ».

**H-12 — La page a été ouverte.**
Build lancé, console vérifiée, chaque élément interactif essayé, les deux
thèmes et le mobile regardés. Un design jamais exécuté n'est pas fini.

---

## Purpose-Gate — autorisé si la raison est écrite

La raison tient en une ligne, dans `DESIGN-CHOICE.md` ou en commentaire du
composant. Si elle ne s'écrit pas en une ligne, la décision est invalide.

**P-1 — Dégradés.** Bleu-violet, bleu-cyan, violet-rose : interdits par défaut.
Autorisés si la marque les porte réellement.

**P-2 — Icônes clichés.** Étincelle, étoile, éclair, diamant, orbe, robot :
interdits par défaut. L'icône doit dire quelque chose du produit.

**P-3 — Typographie d'emprunt.** Grande monospace pour faire « terminal »,
majuscules à interlettrage extrême : seulement si le métier le justifie.

**P-4 — Fonds à motif.** Grille, papier millimétré, lignes de plan : décor sans
signification par défaut.

**P-5 — Flèches de bouton.** `→` sur chaque bouton n'est pas une identité.

**P-6 — Badges capsule.** « AI Powered », « Beta », « Nouveau » sans besoin
fonctionnel. Éviter surtout le combo capsule + bordure fine + halo + point +
majuscules.

**P-7 — Glassmorphism.** Deux surfaces au maximum. Jamais navbar + cartes +
modale + sidebar en même temps.

**P-8 — Ombres.** Servent la hiérarchie, ne font pas flotter tout l'écran.

**P-9 — Halos.** Deux éléments au maximum. Jamais carte + bouton + badge +
icône + fond simultanément.

**P-10 — Cartes de features identiques.** Même taille, même icône, même
gabarit sur toutes : interdit par défaut. La variation doit refléter la
hiérarchie du contenu.

**P-11 — Animations cumulées.** Fondu + flottement + zoom + rebond ensemble :
interdit. Le mouvement suit le palier déclaré dans `ns-motion`.

**P-12 — Illustrations génériques.** unDraw, Storyset, blobs 3D. Préférer une
capture réelle du produit, ou rien.

---

## Quality Locks — cohérence d'ensemble

**Q-1 — Structure dictée par le contenu.**
Interdits : « Comment ça marche » systématiquement en trois étapes, barre de
logos « Ils nous font confiance », pied de page à quatre colonnes par réflexe,
et surtout **toutes les sections bâties pareil** (titre centré + sous-titre +
grille de cartes). La composition suit le récit du produit.

**Q-2 — Rayons cohérents.**
Alignés sur le système. Jamais tout en pilule. La variation est un outil de
hiérarchie, pas un hasard.

**Q-3 — Libellés d'action spécifiques.**
Interdits : « Commencer », « En savoir plus », « Essayer », « Découvrir ». Le
libellé dit ce qui va se passer.

**Q-4 — Zéro mot creux.**
Interdits : « propulsé par l'IA », « nouvelle génération », « révolutionnaire »,
« fluide », « intelligent », « ultime », « puissant », « sans effort ». Dire le
bénéfice réel.

**Q-5 — Palette bornée.**
2 à 3 couleurs cœur plus 1 accent. Les neutres ne comptent pas. Au-delà, ce
n'est plus un système.

**Q-6 — Aucun clonage.**
Ne pas reproduire l'allure de Linear, Vercel, Stripe, Notion, Apple. Référence
oui, gabarit non.

**Q-7 — Identité qui survit au changement de logo.**
Si on remplace le nom et le logo par ceux d'un concurrent et que rien ne
choque, il n'y a pas d'identité.

**Q-8 — Chaque décision a sa raison, en une ligne.**
Règle de voûte : c'est elle qui rend le Purpose-Gate applicable. Couleur, mise
en page, typographie, espacement, cartes, illustration.

---

## Les cinq critères d'artisanat

Se jugent à la fin, sur l'ensemble.

| Critère | Question                                                      | Signal d'échec                        |
| ------- | ------------------------------------------------------------- | ------------------------------------- |
| **C-1** | Chaque décision est-elle justifiable ?                        | « c'est le défaut »                   |
| **C-2** | Chaque élément interactif fonctionne-t-il ?                   | un bouton sans comportement           |
| **C-3** | Chaque section existe-t-elle pour le contenu ?                | une section pour compléter un gabarit |
| **C-4** | Tient-elle dans tous les états, thèmes, tailles, au clavier ? | seul le chemin nominal a été regardé  |
| **C-5** | Tout ce qui est présenté comme un fait est-il vérifiable ?    | un chiffre qu'on ne peut pas sourcer  |

**C-3 est le plus souvent violé, et le plus coûteux.** Une page qui a toutes
ses sections mais rien à dire donne exactement la sensation de vide : chaque
bloc est là parce que le gabarit l'attendait, pas parce que le produit avait
quelque chose à y mettre.

---

## Procédure de livraison

Avant de déclarer une page terminée, produire ce rapport. PASS ou FAIL par
bloc, avec la preuve — pas une affirmation.

```
HARD GATE
  H-1 chiffres sourcés .......... PASS/FAIL  (preuve : … )
  H-4 contrôles vivants ......... PASS/FAIL  (n boutons essayés)
  H-6 cinq états ................ PASS/FAIL  (fichiers listés)
  …

PURPOSE-GATE
  P-10 cartes différenciées ..... PASS/FAIL  (raison écrite : … )
  …

QUALITY LOCKS
  Q-1 structure ................. PASS/FAIL
  Q-7 survit au logo swap ....... PASS/FAIL
  …

ARTISANAT
  C-1 … C-5 ..................... PASS/FAIL
```

Un FAIL sur le Hard Gate bloque la livraison. Un FAIL sur le Purpose-Gate se
lève en écrivant la raison, ou en retirant la technique.

## Vérifications automatisables

```bash
pnpm design:tokens:audit    # valeurs en dur
pnpm gate:accessibility     # H-7, H-8 (axe-core, WCAG AA)
pnpm design:check           # gate #14, inclut ns-anti-generic-audit
```

Le reste se lit. Aucun script ne détecte une statistique inventée ni une
section qui ne sert à rien — c'est précisément pourquoi ce filtre est écrit
pour être appliqué par un humain ou un agent qui relit, pas par un linter.

## Liens

- `ns-design-direction` — choisit l'identité (ce skill la protège)
- `ns-anti-generic-audit` — détection automatique, complémentaire
- `ns-sections` — variantes de mise en page, contre Q-1
- `ns-error-states` — H-6
- `ns-motion` — P-11
- `.claude/design/UI-CONTRACT.md` — densité, KPI, tables, formulaires
