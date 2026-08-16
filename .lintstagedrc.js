/**
 * Configuration lint-staged — découpée en lots.
 *
 * L'ancienne version était un JSON qui laissait lint-staged concaténer TOUS
 * les fichiers en une seule ligne de commande :
 *
 *   { "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"] }
 *
 * Sur Windows, la ligne de commande est plafonnée à 8191 caractères. Un
 * commit initial de 306 fichiers, avec des chemins absolus longs, dépasse ce
 * plafond et échoue sur
 *
 *   La ligne de commande est trop longue.
 *
 * Le hook pre-commit devenait alors impossible à franchir — précisément sur le
 * premier commit, celui qui donne le point de retour dont on a le plus besoin.
 *
 * On découpe donc en lots de 40 fichiers. Le nombre n'a rien de sacré : 40
 * chemins Windows longs restent très en dessous du plafond, tout en gardant
 * peu d'invocations.
 */

const TAILLE_LOT = 40;

function enLots(fichiers, commande) {
  const lots = [];
  for (let i = 0; i < fichiers.length; i += TAILLE_LOT) {
    const lot = fichiers.slice(i, i + TAILLE_LOT);
    // Les chemins sont cités : un dossier comme `[locale]` ou un nom avec
    // espace casse la commande sans guillemets.
    lots.push(`${commande} ${lot.map((f) => JSON.stringify(f)).join(" ")}`);
  }
  return lots;
}

module.exports = {
  "*.{js,jsx,ts,tsx}": (fichiers) => [
    ...enLots(fichiers, "eslint --fix"),
    ...enLots(fichiers, "prettier --write"),
  ],
  "*.{json,md,css,yml,yaml}": (fichiers) =>
    enLots(fichiers, "prettier --write"),
};
