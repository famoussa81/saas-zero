---
name: ns-anti-generic-audit
description: "Audit déterministe qui détecte les signes d'un design généré par IA : palettes clichés, fontes par défaut, patterns de mise en page répétés, copie générique. Complète le gate #14 (tokens) par une vérification du caractère distinctif, et compare le projet à l'historique des directions déjà produites."
---

# Skill `ns-anti-generic-audit` — Détecter le design « déjà vu »

> **But** : `design:check` (gate #14) vérifie que le design est **cohérent** (tokens, contraste, sémantique). Il ne vérifie pas qu'il est **distinctif**. Un projet peut avoir 100% de couverture de tokens et ressembler exactement au précédent.
>
> Ce skill audite ce que le gate ne voit pas.

---

## Trois niveaux de détection

| Niveau                      | Outil                         | Détecte                                                           |
| --------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| 1. Patterns de code         | `impeccable detect`           | Anti-patterns UI connus (barre d'accent latérale, easing bounce…) |
| 2. Clichés visuels          | greps ciblés                  | Combinaisons de couleurs/fontes signant l'IA                      |
| 3. Répétition inter-projets | `.claude/design-history.json` | Réutilisation d'une direction déjà produite                       |

---

## Niveau 1 — `impeccable detect`

L'outil est installé mais **sous-utilisé** : lancé sur un fichier isolé il ne trouve rien, il faut le lancer sur l'arborescence.

```bash
npx impeccable detect app components lib --json
```

Sortie : tableau de findings `{ antipattern, severity, file, line, snippet }`.

```bash
# Version lisible, triée par sévérité
npx impeccable detect app components lib --json \
  | node -e "const f=JSON.parse(require('fs').readFileSync(0,'utf8'));
      f.sort((a,b)=>(a.severity==='error'?-1:1))
       .forEach(x=>console.log(\`[\${x.severity}] \${x.antipattern} — \${x.file}:\${x.line}\`))"
```

**Exemple réel trouvé dans ce repo** :

```
[warning] side-tab — components/MDXComponents.tsx:69   (border-l-4)
"Thick colored border on one side of a card — the most recognizable tell of AI-generated UIs."
```

Options utiles : `--scope type,layout` pour cibler un domaine, `--no-advisory` pour masquer les findings non bloquants.

`design-check.js` l'intègre déjà (score dérivé : `100 − 15×erreurs − 5×warnings`, seuil 95).

---

## Niveau 2 — Clichés visuels (greps)

Ces combinaisons sont les signatures les plus reconnaissables. Chaque détection = à justifier ou à changer.

```bash
# Dégradé violet→bleu (le cliché n°1)
grep -rnE 'from-(purple|violet|indigo)-[0-9]+ to-(blue|indigo|purple)-[0-9]+' app/ components/

# Orbes floutés décoratifs
grep -rn 'blur(\(6\|7\|8\|9\|10\)[0-9]px)\|blur-3xl' app/ components/ src/styles/

# Fond crème du combo "serif + terracotta"
grep -rniE '#f4f1ea|#faf8f3|#f5f0e8' app/ components/ src/styles/

# Fontes par défaut de l'IA
grep -rnE '"(Inter|Space Grotesk)"' app/ src/styles/ tailwind.config.ts

# Emoji comme marqueur de section
grep -rnE 'icon:\s*"[\x{1F300}-\x{1FAFF}]"' app/ components/

# Marqueurs 01/02/03 décoratifs
grep -rnE '>0[1-9]<|"0[1-9]"' components/marketing/
```

> **Nuance importante** : ces patterns ne sont pas interdits _en soi_. Ils sont interdits **par défaut**. S'ils servent la direction artistique documentée dans `DESIGN-CHOICE.md`, ils sont légitimes — mais il faut que ce soit écrit.

Ce repo a par exemple des orbes floutés (`.signature-orb`) hérités du scaffold : détectés, non justifiés dans la direction artistique → candidats au remplacement.

---

## Niveau 3 — Répétition entre projets

```bash
node -e "
const h = require('./.claude/design-history.json');
const cur = { accentHue: 255, displayFont: 'Syne', signature: 'terminal' };
h.directions.forEach(d => {
  const dh = Math.min(Math.abs(d.accentHue - cur.accentHue), 360 - Math.abs(d.accentHue - cur.accentHue));
  if (dh < 30) console.log('COLLISION teinte avec ' + d.project + ' (' + dh + ' degres)');
  if (d.displayFont === cur.displayFont) console.log('COLLISION fonte avec ' + d.project);
  if (d.signature.toLowerCase().includes(cur.signature)) console.log('COLLISION signature avec ' + d.project);
});
console.log('verification historique terminee');
"
```

Une collision sur **un seul** des trois axes suffit à imposer un retour sur la direction (cf. `ns-design-direction`).

Comparer aussi la combinaison de sections : au moins **3 sections** doivent utiliser une variante différente du projet précédent (cf. `ns-sections`).

---

## Niveau 4 — Copie générique (lecture humaine)

Aucun script ne détecte le texte creux. Chercher à la main :

| Formule                                  | Problème                            |
| ---------------------------------------- | ----------------------------------- |
| « The #1 platform for… »                 | Non vérifiable, dit par tous        |
| « Supercharge / Unlock / Elevate your… » | Verbe marketing vide                |
| « Built for modern teams »               | Ne désigne personne                 |
| « Powerful yet simple »                  | Contradiction sans preuve           |
| « Trusted by thousands »                 | Sans chiffre ni logo, c'est du vent |

**Test** : remplacer le nom du produit par celui d'un concurrent. Si la phrase reste vraie, elle ne dit rien.

---

## Procédure d'audit

```bash
pnpm design:check                              # gate #14 : cohérence
npx impeccable detect app components lib --json # niveau 1
# puis greps niveau 2, script niveau 3, lecture niveau 4
```

Rapport dans `DESIGN-AUDIT.md`, section « Distinctivité » :

```markdown
## Distinctivité

| Niveau            | Résultat    | Détail                                        |
| ----------------- | ----------- | --------------------------------------------- |
| impeccable detect | 1 warning   | side-tab dans MDXComponents.tsx:69            |
| Clichés visuels   | 1 détection | .signature-orb (orbes floutés) — non justifié |
| Historique        | OK          | aucune collision                              |
| Copie             | OK          | aucune formule générique                      |

### Décisions

- `border-l-4` : remplacé par un fond différencié
- `.signature-orb` : conservé / remplacé (justification : …)
```

---

## Critère de sortie

- [ ] `impeccable detect` : 0 erreur (warnings justifiés par écrit)
- [ ] Aucun cliché du niveau 2 non justifié dans `DESIGN-CHOICE.md`
- [ ] Aucune collision avec `design-history.json`
- [ ] Aucune formule qui survit au test du remplacement de nom
- [ ] Entrée ajoutée à `design-history.json` une fois la direction figée

---

## Liens

- `ns-design-direction` — la liste rouge et la méthode
- `ns-sections` — variété des mises en page
- `design-audit` — gate #14 déterministe (cohérence)
