import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("joins class names", () => {
      expect(cn("a", "b", "c")).toBe("a b c");
    });

    it("handles conditional classes", () => {
      expect(cn("base", true && "active", false && "disabled")).toBe(
        "base active",
      );
    });

    it("handles Tailwind merge conflicts", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });
  });
});
