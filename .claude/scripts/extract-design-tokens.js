/**
 * extract-design-tokens.js
 * ------------------------
 * Extrait le système de design d'une page web : couleurs réellement utilisées
 * (pondérées par surface), fontes, échelle typographique, rayons, ombres,
 * espacements, et les CSS custom properties déclarées.
 *
 * DEUX USAGES
 *
 * 1. Console du navigateur (le plus simple, marche sur n'importe quel site) :
 *    ouvrir DevTools sur la page cible, coller tout ce fichier, exécuter.
 *    Le résultat s'affiche et est copié via copy(window.__designTokens).
 *
 * 2. Depuis un agent avec un outil navigateur : injecter ce fichier puis lire
 *    window.__designTokens.
 *
 * NOTE JURIDIQUE — extraire des TOKENS (palette, échelle typo, rayons) pour
 * s'en inspirer est une pratique de design courante. Recopier une mise en page
 * complète, l'identité visuelle ou les contenus d'un concurrent ne l'est pas :
 * ça relève du parasitisme et, pour le logo/la marque, de la contrefaçon.
 * Extraire pour comprendre et s'inspirer, pas pour cloner.
 */

(function extractDesignTokens() {
  const MAX_NODES = 4000;
  const nodes = Array.from(document.querySelectorAll("body *")).slice(
    0,
    MAX_NODES,
  );

  // --- Utilitaires -----------------------------------------------------------

  const rgbToHex = (rgb) => {
    const m = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return null;
    return (
      "#" +
      [m[1], m[2], m[3]]
        .map((v) => Number(v).toString(16).padStart(2, "0"))
        .join("")
    );
  };

  const rgbToHsl = (rgb) => {
    const m = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return null;
    const [r, g, b] = [m[1], m[2], m[3]].map((v) => Number(v) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
      h =
        max === r
          ? ((g - b) / d) % 6
          : max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    // Format Tailwind/shadcn : "H S% L%" sans hsl()
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const isTransparent = (c) =>
    !c || c === "transparent" || /rgba\([^)]+,\s*0\s*\)/.test(c);

  // Compte pondéré : une couleur sur une grande surface compte plus qu'un liseré
  const tally = new Map();
  const bump = (key, weight = 1) =>
    tally.set(key, (tally.get(key) || 0) + weight);

  // --- Parcours du DOM -------------------------------------------------------

  const fonts = new Map();
  const fontSizes = new Map();
  const fontWeights = new Map();
  const radii = new Map();
  const shadows = new Map();
  const spacings = new Map();

  for (const el of nodes) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const area = Math.max(rect.width * rect.height, 0);

    // Couleurs de fond : pondérées par la surface occupée
    if (!isTransparent(cs.backgroundColor) && area > 0) {
      bump(`bg|${cs.backgroundColor}`, area);
    }
    // Couleurs de texte : pondérées par la quantité de texte
    const textLen = (el.textContent || "").trim().length;
    if (!isTransparent(cs.color) && textLen > 0 && el.children.length === 0) {
      bump(`text|${cs.color}`, textLen);
    }
    if (
      !isTransparent(cs.borderTopColor) &&
      parseFloat(cs.borderTopWidth) > 0
    ) {
      bump(`border|${cs.borderTopColor}`, 1);
    }

    // Typographie
    const family = cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
    if (family) fonts.set(family, (fonts.get(family) || 0) + 1);
    if (textLen > 0) {
      fontSizes.set(cs.fontSize, (fontSizes.get(cs.fontSize) || 0) + 1);
      fontWeights.set(cs.fontWeight, (fontWeights.get(cs.fontWeight) || 0) + 1);
    }

    // Formes
    if (cs.borderRadius && cs.borderRadius !== "0px") {
      radii.set(cs.borderRadius, (radii.get(cs.borderRadius) || 0) + 1);
    }
    if (cs.boxShadow && cs.boxShadow !== "none") {
      shadows.set(cs.boxShadow, (shadows.get(cs.boxShadow) || 0) + 1);
    }
    [cs.paddingTop, cs.paddingLeft, cs.gap].forEach((v) => {
      if (v && v !== "0px" && v !== "normal") {
        spacings.set(v, (spacings.get(v) || 0) + 1);
      }
    });
  }

  // --- Custom properties déclarées -------------------------------------------

  const customProps = {};
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules; // lève si feuille cross-origin
    } catch {
      continue;
    }
    for (const rule of Array.from(rules || [])) {
      if (!rule.style) continue;
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith("--")) {
          customProps[prop] = rule.style.getPropertyValue(prop).trim();
        }
      }
    }
  }

  // --- Mise en forme ---------------------------------------------------------

  const topOf = (map, n = 8) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  const colorsByRole = { bg: [], text: [], border: [] };
  for (const [key, weight] of [...tally.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    const [role, value] = key.split("|");
    if (colorsByRole[role].length < 6) {
      colorsByRole[role].push({
        rgb: value,
        hex: rgbToHex(value),
        hsl: rgbToHsl(value),
        weight: Math.round(weight),
      });
    }
  }

  const result = {
    url: location.href,
    extractedAt: new Date().toISOString(),
    colors: colorsByRole,
    fonts: topOf(fonts, 5).map(([f, n]) => ({ family: f, occurrences: n })),
    fontSizes: topOf(fontSizes, 10).map(([s, n]) => ({
      size: s,
      occurrences: n,
    })),
    fontWeights: topOf(fontWeights, 6).map(([w, n]) => ({
      weight: w,
      occurrences: n,
    })),
    radii: topOf(radii, 6).map(([r, n]) => ({ radius: r, occurrences: n })),
    shadows: topOf(shadows, 5).map(([s, n]) => ({ shadow: s, occurrences: n })),
    spacings: topOf(spacings, 10).map(([s, n]) => ({
      space: s,
      occurrences: n,
    })),
    cssCustomProperties: customProps,
    nodesScanned: nodes.length,
  };

  // Rendu console lisible
  console.log("%c=== TOKENS EXTRAITS ===", "font-weight:bold;font-size:14px");
  console.log("Fond (par surface) :", colorsByRole.bg);
  console.log("Texte (par volume) :", colorsByRole.text);
  console.log("Fontes :", result.fonts);
  console.log("Tailles :", result.fontSizes);
  console.log("Rayons :", result.radii);
  console.log(
    "Custom properties :",
    Object.keys(customProps).length
      ? customProps
      : "(aucune — site sans design tokens CSS, ou feuilles cross-origin illisibles)",
  );

  window.__designTokens = result;
  if (typeof copy === "function") {
    copy(result);
    console.log("%c✓ JSON copié dans le presse-papier", "color:green");
  }
  return result;
})();
