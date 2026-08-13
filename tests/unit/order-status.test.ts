import { describe, it, expect } from "vitest";
import {
  nextStatus,
  STATUS_LABEL,
  type OrderStatus,
} from "@/components/admin/order-status";

describe("nextStatus", () => {
  it("suit le chemin normal", () => {
    expect(nextStatus("pending")).toBe("confirmed");
    expect(nextStatus("confirmed")).toBe("preparing");
    expect(nextStatus("preparing")).toBe("shipped");
    expect(nextStatus("shipped")).toBe("delivered");
  });

  it("s'arrête à livrée", () => {
    expect(nextStatus("delivered")).toBeNull();
  });

  it("ne fait PAS avancer une commande annulée ou remboursée", () => {
    // Elles sont hors du chemin normal : proposer « suivant » sur une
    // commande annulée ferait revivre une commande morte.
    expect(nextStatus("cancelled")).toBeNull();
    expect(nextStatus("refunded")).toBeNull();
  });

  it("ne saute jamais d'étape", () => {
    let s: OrderStatus = "pending";
    const parcours: OrderStatus[] = [s];
    for (;;) {
      const n = nextStatus(s);
      if (!n) break;
      parcours.push(n);
      s = n;
    }
    expect(parcours).toEqual([
      "pending",
      "confirmed",
      "preparing",
      "shipped",
      "delivered",
    ]);
  });
});

describe("STATUS_LABEL", () => {
  it("couvre tous les statuts du schéma", () => {
    const duSchema: OrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    for (const s of duSchema) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });

  it("n'expose aucun terme technique au commerçant", () => {
    const libelles = Object.values(STATUS_LABEL).join(" ").toLowerCase();
    for (const technique of [
      "pending",
      "shipped",
      "draft",
      "sku",
      "variant",
      "status",
    ]) {
      expect(libelles).not.toContain(technique);
    }
  });
});
