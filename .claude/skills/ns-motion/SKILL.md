---
name: ns-motion
description: "Système d'animation en 3 paliers (Minimal / Moderate / Bold) avec recettes GSAP éprouvées. Couvre le choix du palier, les patterns par type de section, les pièges Next.js App Router (RSC, hydratation) et l'accessibilité prefers-reduced-motion."
---

# Skill `ns-motion` — Animation en 3 paliers

> **But** : produire du mouvement qui **sert le propos** du produit, jamais de la décoration. Le palier se décide en Discovery (ADR-007) et engage tout le reste.
>
> **Stack** : `gsap` + `@gsap/react` (`useGSAP`). Déjà en dépendances du starter.
> **Sortie** : composants dans `components/marketing/`, palier consigné dans `DESIGN-CHOICE.md`.

---

## Les 3 paliers

| Palier       | Quand                                                         | Ce qui bouge                                                            | Budget                                 |
| ------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| **Minimal**  | Outils métier, dashboards, B2B sérieux, santé/finance         | Transitions d'état (hover, focus), fade d'entrée. Rien en boucle.       | < 10 lignes de JS d'anim               |
| **Moderate** | Défaut pour la majorité des SaaS                              | Reveal au scroll, stagger de listes, 1 élément signature animé          | GSAP + ScrollTrigger                   |
| **Bold**     | Produits créatifs, early-adopters, différenciation par le wow | Timeline orchestrée au chargement, scroll scrub, morphing, canvas/WebGL | GSAP complet, budget perf à surveiller |

**Règle transverse** : quel que soit le palier, **un seul moment fort** par page (cf. `ns-design-direction` §Règle 5).

---

## Contrat non-négociable — `prefers-reduced-motion`

Chaque composant animé rend un **état final statique** si l'utilisateur a désactivé les animations. Jamais "animation plus courte" : pas d'animation du tout.

```tsx
useGSAP(
  () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      gsap.set(elements, { opacity: 1, y: 0 }); // état final, immédiat
      return; // et on sort
    }
    // ... timeline normale
  },
  { scope: root },
);
```

`globals.css` porte déjà le garde-fou global (`@media (prefers-reduced-motion: reduce)`), mais il ne couvre **pas** GSAP (qui anime en JS, pas en CSS) — d'où le check explicite dans chaque composant.

---

## Pièges Next.js App Router (vécus, pas théoriques)

### 1. Les composants animés sont des Client Components

`useGSAP` = hook → `"use client"` obligatoire en tête de fichier.

### 2. Ne jamais passer une fonction du Server au Client Component

**Ce bug a cassé la homepage de ce repo.** Passer une icône (`icon: Shield`) depuis une page Server vers un composant Client fait planter le rendu :

```
Functions cannot be passed directly to Client Components
```

**Solution** : passer une clé sérialisable, résoudre côté client.

```tsx
// page.tsx (Server) — données sérialisables uniquement
const features = [{ icon: "shield" as const, title: "..." }];

// FeatureGrid.tsx (Client) — la map vit ici
const ICONS = { shield: Shield, zap: Zap } as const;
const Icon = ICONS[feature.icon];
```

### 3. Enregistrer les plugins côté client seulement

```tsx
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
```

### 4. Toujours scoper

`useGSAP(fn, { scope: root })` → le cleanup est automatique au démontage. Sans scope, les ScrollTrigger fuient entre navigations.

---

## Recettes par type de section

### A. Élément signature (hero) — palier Moderate/Bold

Le hero ne doit pas contenir "une animation" mais **une démonstration du produit**. Exemple éprouvé : un terminal qui tape la vraie commande du produit et déroule ses étapes.

```tsx
const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });

// Frappe du texte, caractère par caractère
tl.to(
  { chars: 0 },
  {
    chars: COMMAND.length,
    duration: 0.9,
    ease: "none",
    onUpdate: function () {
      el.textContent = COMMAND.slice(0, Math.round(this.targets()[0].chars));
    },
  },
  0,
);

// Puis chaque étape, séquentiellement
STEPS.forEach((_, i) => {
  tl.call(() => rows[i].classList.add("is-active"))
    .to(bars[i], { scaleX: 1, duration: 0.55, ease: "power2.out" })
    .to(
      checks[i],
      { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" },
      "-=0.15",
    );
});
```

Référence complète : `components/marketing/PipelineHero.tsx`.

### B. Reveal au scroll (stagger de cartes) — palier Moderate

```tsx
gsap.set(cards, { opacity: 0, y: 28 });
gsap.to(cards, {
  opacity: 1,
  y: 0,
  duration: 0.6,
  ease: "power2.out",
  stagger: 0.08, // 60-100ms : au-delà ça traîne
  scrollTrigger: { trigger: root.current, start: "top 80%" },
});
```

Référence : `components/marketing/FeatureGrid.tsx`.

**Piège** : ne pas faire ça en CSS avec des classes `delay-${i}` construites en template string dans `className` — Tailwind purge les classes non littérales. (Bug réel corrigé dans ce repo.)

### C. Scroll scrub (progression liée au scroll) — palier Moderate/Bold

Pour une timeline verticale dont la ligne se dessine :

```tsx
gsap.set(line, { scaleY: 0, transformOrigin: "top" });
gsap.to(line, {
  scaleY: 1,
  ease: "none", // scrub → jamais d'easing
  scrollTrigger: {
    trigger: root.current,
    start: "top 70%",
    end: "bottom 60%",
    scrub: 0.5, // 0.3-1 : lissage du suivi
  },
});
```

Et pour allumer chaque étape au passage :

```tsx
ScrollTrigger.create({
  trigger: el,
  start: "top 75%",
  onEnter: () => el.classList.add("is-reached"),
  onLeaveBack: () => el.classList.remove("is-reached"),
});
```

Référence : `components/marketing/PipelineTimeline.tsx`.

### D. Micro-interactions — tous paliers

Restent en CSS (pas de JS) : hover, focus, active. Déjà dans `globals.css` (`.hover-lift`, `.active-scale`, `.focus-visible-ring`).

---

## Réglages qui font la différence

| Paramètre               | Valeur qui marche     | À éviter                            |
| ----------------------- | --------------------- | ----------------------------------- |
| Durée entrée            | 0.5 – 0.7s            | > 1s (le lecteur attend)            |
| Stagger                 | 0.06 – 0.1s           | > 0.15s (ça traîne)                 |
| Ease entrée             | `power2.out`          | `linear`, `bounce` (sauf intention) |
| Ease scrub              | `none`                | tout easing (double le lissage)     |
| Start ScrollTrigger     | `top 75%` / `top 80%` | `top top` (déclenche trop tard)     |
| Distance de translation | 20 – 32px             | > 60px (donne le mal de mer)        |

**Ease `back.out(3)`** : réservé aux confirmations (checkmark qui apparaît). Jamais sur du texte.

---

## Vérification

1. `pnpm typecheck && pnpm lint`
2. **Tester dans un navigateur, onglet neuf** — les erreurs RSC n'apparaissent qu'au runtime, pas au typecheck.
3. `pnpm build` — une erreur de frontière RSC fait échouer le build de production (filet de sécurité).
4. Vérifier l'état `prefers-reduced-motion` (DevTools → Rendering → Emulate CSS media).
5. `pnpm design:check` — gate #14.

---

## Liens

- `ns-design-direction` — le palier découle de la direction artistique
- `ns-sections` — quelle animation pour quel archétype de section
- ADR-007 — Motion tier system
