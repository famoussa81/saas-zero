import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cn,
  formatDate,
  formatDateShort,
  formatReadingTime,
  truncate,
  slugify,
  debounce,
  throttle,
  generateId,
  classNames,
} from "@/lib/utils";

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

    it("handles undefined/null/false values", () => {
      expect(cn("base", undefined, null, false, "active")).toBe("base active");
    });
  });

  describe("formatDate", () => {
    it("formats date in French locale by default", () => {
      const date = new Date("2024-01-15");
      expect(formatDate(date)).toContain("15");
      expect(formatDate(date)).toContain("janvier");
      expect(formatDate(date)).toContain("2024");
    });

    it("formats date string input", () => {
      expect(formatDate("2024-01-15")).toContain("15 janvier 2024");
    });

    it("accepts custom locale", () => {
      const date = new Date("2024-01-15");
      expect(formatDate(date, "en-US")).toContain("January");
    });
  });

  describe("formatDateShort", () => {
    it("formats date with short month", () => {
      const date = new Date("2024-01-15");
      expect(formatDateShort(date)).toContain("15 janv. 2024");
    });

    it("accepts custom locale", () => {
      const date = new Date("2024-01-15");
      expect(formatDateShort(date, "en-US")).toContain("Jan");
    });
  });

  describe("formatReadingTime", () => {
    it("formats reading time in minutes", () => {
      expect(formatReadingTime(5)).toBe("5 min read");
      expect(formatReadingTime(1)).toBe("1 min read");
    });
  });

  describe("truncate", () => {
    it("returns original string if shorter than length", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("truncates and adds ellipsis", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    it("handles exact length", () => {
      expect(truncate("hello", 5)).toBe("hello");
    });
  });

  describe("slugify", () => {
    it("converts to lowercase and replaces spaces with hyphens", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes accents", () => {
      expect(slugify("café résumé")).toBe("cafe-resume");
    });

    it("removes special characters", () => {
      expect(slugify("Hello@World!")).toBe("hello-world");
    });

    it("removes leading/trailing hyphens", () => {
      expect(slugify("-hello-")).toBe("hello");
    });

    it("handles multiple consecutive spaces", () => {
      expect(slugify("a  b   c")).toBe("a-b-c");
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("delays function execution", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("arg1");
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith("arg1");
    });

    it("only calls last invocation within delay", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("arg1");
      debounced("arg2");
      debounced("arg3");

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("arg3");
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls function immediately on first call", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled("arg1");
      expect(fn).toHaveBeenCalledWith("arg1");
    });

    it("ignores calls within limit period", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled("arg1");
      throttled("arg2");
      throttled("arg3");

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled("arg4");
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith("arg4");
    });
  });

  describe("generateId", () => {
    it("generates a string", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("generates unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("classNames", () => {
    it("joins class names filtering falsy values", () => {
      expect(classNames("a", "b", "c")).toBe("a b c");
    });

    it("filters undefined, null, false", () => {
      expect(classNames("base", undefined, null, false, "active")).toBe(
        "base active",
      );
    });

    it("handles empty input", () => {
      expect(classNames()).toBe("");
    });
  });
});
