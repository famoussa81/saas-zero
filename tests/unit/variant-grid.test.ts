import { describe, it, expect } from "vitest";
import { buildRows, buildSku } from "@/components/admin/variant-grid";

/**
 * La génération des déclinaisons est ce qui évite au commerçant de saisir
 * douze formulaires. Sa propriété critique n'est pas de produire les bonnes
 * combinaisons — c'est de PRÉSERVER ce qui a déjà été saisi quand il ajoute
 * une taille. Sans ça, ajouter « XL » en dernier remet tous les stocks à zéro,
 * et l'erreur ne se voit qu'après enregistrement.
 */
describe("buildRows", () => {
  it("croise tailles et couleurs", () => {
    const rows = buildRows("T-shirt", ["S", "M"], ["Noir", "Écru"], []);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.label)).toEqual([
      "S / Noir",
      "S / Écru",
      "M / Noir",
      "M / Écru",
    ]);
  });

  it("accepte une seule dimension", () => {
    expect(buildRows("Pantalon", ["40", "42"], [], [])).toHaveLength(2);
    expect(buildRows("Bonnet", [], ["Noir"], [])).toHaveLength(1);
  });

  it("ne produit rien sans dimension", () => {
    expect(buildRows("Article", [], [], [])).toEqual([]);
  });

  it("PRÉSERVE le stock et le prix quand on ajoute une taille", () => {
    const initial = buildRows("T-shirt", ["S", "M"], ["Noir"], []);
    initial[0].stock = 12;
    initial[1].stock = 7;
    initial[1].priceCents = 1800000;

    const after = buildRows("T-shirt", ["S", "M", "L"], ["Noir"], initial);

    expect(after).toHaveLength(3);
    expect(after.find((r) => r.label === "S / Noir")?.stock).toBe(12);
    expect(after.find((r) => r.label === "M / Noir")?.stock).toBe(7);
    expect(after.find((r) => r.label === "M / Noir")?.priceCents).toBe(1800000);
    // La nouvelle ligne part à zéro, pas à undefined.
    expect(after.find((r) => r.label === "L / Noir")?.stock).toBe(0);
    expect(after.find((r) => r.label === "L / Noir")?.priceCents).toBeNull();
  });

  it("PRÉSERVE le stock quand on retire puis remet une couleur", () => {
    const withTwo = buildRows("T-shirt", ["M"], ["Noir", "Écru"], []);
    withTwo[0].stock = 5;
    withTwo[1].stock = 9;

    const removed = buildRows("T-shirt", ["M"], ["Noir"], withTwo);
    expect(removed).toHaveLength(1);

    // Écru revient : son stock est perdu, ce qui est correct — il n'était
    // plus dans la grille. Noir, lui, doit avoir survécu au passage.
    const back = buildRows("T-shirt", ["M"], ["Noir", "Écru"], removed);
    expect(back.find((r) => r.label === "M / Noir")?.stock).toBe(5);
    expect(back.find((r) => r.label === "M / Écru")?.stock).toBe(0);
  });

  it("garde des clés stables entre deux générations", () => {
    const a = buildRows("T-shirt", ["S", "M"], ["Noir"], []);
    const b = buildRows("T-shirt", ["S", "M"], ["Noir"], a);
    expect(b.map((r) => r.key)).toEqual(a.map((r) => r.key));
  });
});

describe("buildSku", () => {
  it("retire accents, espaces et ponctuation", () => {
    expect(buildSku("T-shirt coton bio", ["M", "Écru"])).toBe("TSHIRT-M-ECRU");
  });

  it("tronque pour rester lisible sur une étiquette", () => {
    expect(buildSku("Chemise en lin lavé premium", ["XL"])).toBe("CHEMIS-XL");
  });

  it("ignore les segments vides", () => {
    expect(buildSku("Bonnet", ["", "Noir"])).toBe("BONNET-NOIR");
  });

  it("produit des codes distincts pour des combinaisons distinctes", () => {
    const rows = buildRows("T-shirt", ["S", "M"], ["Noir", "Écru"], []);
    const skus = new Set(rows.map((r) => r.sku));
    expect(skus.size).toBe(rows.length);
  });
});
