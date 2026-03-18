import { describe, it, expect } from "vitest";
import { VIBE_CATEGORIES, ALL_VIBES, searchVibes, FEATURED_VIBES } from "@/lib/vibes";

describe("Vibes System", () => {
  it("has no emoji prefixes in category names", () => {
    Object.keys(VIBE_CATEGORIES).forEach((cat) => {
      // No emoji characters (basic check: no chars outside ASCII printable + common unicode letters)
      expect(cat).not.toMatch(/[\u{1F000}-\u{1FFFF}]/u);
    });
  });

  it("ALL_VIBES contains all category vibes", () => {
    const total = Object.values(VIBE_CATEGORIES).reduce((sum, v) => sum + v.length, 0);
    expect(ALL_VIBES).toHaveLength(total);
  });

  it("FEATURED_VIBES are non-empty strings", () => {
    expect(FEATURED_VIBES.length).toBeGreaterThan(10);
    FEATURED_VIBES.forEach((v) => {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    });
  });

  it("searchVibes finds matches", () => {
    const results = searchVibes("guitar", 10);
    expect(results).toContain("guitar");
  });

  it("searchVibes prioritizes starts-with", () => {
    const results = searchVibes("mus", 10);
    expect(results[0]).toBe("music");
  });

  it("searchVibes returns empty for empty query", () => {
    expect(searchVibes("", 10)).toEqual([]);
  });

  it("fly fishing exists in vibes", () => {
    expect(ALL_VIBES).toContain("fly fishing");
  });

  it("has at least 400 vibes total", () => {
    expect(ALL_VIBES.length).toBeGreaterThanOrEqual(400);
  });
});
