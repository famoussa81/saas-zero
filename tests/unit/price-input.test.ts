import { describe, it, expect } from "vitest";
import {
  parseAmountToCents,
  centsToInput,
  decimalsFor,
} from "@/components/admin/price-input";

/**
 * La conversion francs ↔ centimes est le seul endroit du back-office où une
 * erreur coûte de l'argent réel. Un facteur 100 sur un prix, et le commerçant
 * vend à 150 F ce qu'il voulait vendre 15 000 F.
 *
 * D'où des tests sur les saisies réelles, pas sur les cas propres.
 */
describe("parseAmountToCents — devise sans sous-unité (XOF)", () => {
  it("convertit un montant simple", () => {
    expect(parseAmountToCents("15000", "XOF")).toBe(15000);
  });

  it("accepte les espaces de milliers, y compris insécables", () => {
    expect(parseAmountToCents("15 000", "XOF")).toBe(15000);
    expect(parseAmountToCents("15 000", "XOF")).toBe(15000);
  });

  it("traite un point ou une virgule comme séparateur de milliers", () => {
    // « 15.000 » veut dire quinze mille, jamais quinze et zéro centime :
    // XOF n'a pas de sous-unité.
    expect(parseAmountToCents("15.000", "XOF")).toBe(15000);
    expect(parseAmountToCents("15,000", "XOF")).toBe(15000);
  });

  it("refuse ce qui n'est pas un montant", () => {
    expect(parseAmountToCents("", "XOF")).toBeNull();
    expect(parseAmountToCents("abc", "XOF")).toBeNull();
    expect(parseAmountToCents("15 000 F", "XOF")).toBeNull();
  });
});

describe("parseAmountToCents — devise à deux décimales (EUR)", () => {
  it("convertit les unités en centimes", () => {
    expect(parseAmountToCents("45", "EUR")).toBe(4500);
  });

  it("gère les centimes", () => {
    expect(parseAmountToCents("45,90", "EUR")).toBe(4590);
    expect(parseAmountToCents("45.90", "EUR")).toBe(4590);
  });

  it("complète un seul chiffre décimal", () => {
    expect(parseAmountToCents("45,9", "EUR")).toBe(4590);
  });

  it("distingue milliers et centimes par la longueur du groupe", () => {
    // 3 chiffres après le séparateur = milliers.
    expect(parseAmountToCents("1.234", "EUR")).toBe(123400);
    // 2 chiffres = centimes.
    expect(parseAmountToCents("1,23", "EUR")).toBe(123);
    // Séparateurs mixtes : le dernier décide.
    expect(parseAmountToCents("1.234,56", "EUR")).toBe(123456);
    expect(parseAmountToCents("1,234.56", "EUR")).toBe(123456);
  });

  it("ne produit jamais d'erreur de flottant", () => {
    // parseFloat("1499.99") * 100 vaut 149998.99999999999.
    expect(parseAmountToCents("1499,99", "EUR")).toBe(149999);
    expect(Number.isInteger(parseAmountToCents("1499,99", "EUR")!)).toBe(true);
    // Cas historiquement piégeux en virgule flottante.
    expect(parseAmountToCents("0,29", "EUR")).toBe(29);
    expect(parseAmountToCents("1,10", "EUR")).toBe(110);
    expect(parseAmountToCents("8,15", "EUR")).toBe(815);
  });
});

describe("centsToInput", () => {
  it("n'affiche pas de décimale sur une devise qui n'en a pas", () => {
    expect(centsToInput(15000, "XOF")).toBe("15000");
  });

  it("affiche deux décimales sur EUR", () => {
    expect(centsToInput(4590, "EUR")).toBe("45,90");
    expect(centsToInput(4500, "EUR")).toBe("45,00");
    expect(centsToInput(29, "EUR")).toBe("0,29");
  });
});

describe("aller-retour", () => {
  it("est stable dans les deux devises", () => {
    for (const [cents, cur] of [
      [15000, "XOF"],
      [1, "XOF"],
      [4590, "EUR"],
      [29, "EUR"],
      [123456, "EUR"],
    ] as const) {
      expect(parseAmountToCents(centsToInput(cents, cur), cur)).toBe(cents);
    }
  });
});

describe("decimalsFor", () => {
  it("connaît les devises sans sous-unité", () => {
    expect(decimalsFor("XOF")).toBe(0);
    expect(decimalsFor("xof")).toBe(0);
    expect(decimalsFor("JPY")).toBe(0);
    expect(decimalsFor("EUR")).toBe(2);
    expect(decimalsFor("USD")).toBe(2);
  });
});
