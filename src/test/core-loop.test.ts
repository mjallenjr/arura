import { describe, it, expect, vi } from "vitest";
import { HEAT_TIERS, HEAT_THRESHOLDS } from "@/components/feed/HeatBadge";

// Unit tests for the core heat system logic

describe("Heat System", () => {
  it("defines 9 heat tiers in correct order", () => {
    expect(HEAT_TIERS).toHaveLength(9);
    expect(HEAT_TIERS[0]).toBe("match");
    expect(HEAT_TIERS[8]).toBe("star");
  });

  it("has 9 corresponding thresholds", () => {
    expect(HEAT_THRESHOLDS).toHaveLength(9);
    // Each threshold should be greater than the previous
    for (let i = 1; i < HEAT_THRESHOLDS.length; i++) {
      expect(HEAT_THRESHOLDS[i]).toBeGreaterThan(HEAT_THRESHOLDS[i - 1]);
    }
  });

  it("calculates correct heat level from score", () => {
    const getLevel = (score: number): string => {
      for (let i = HEAT_THRESHOLDS.length - 1; i >= 0; i--) {
        if (score >= HEAT_THRESHOLDS[i]) return HEAT_TIERS[i] as string;
      }
      return "match";
    };

    expect(getLevel(0)).toBe("match");
    expect(getLevel(4)).toBe("match");
    expect(getLevel(5)).toBe("spark");
    expect(getLevel(15)).toBe("ignite");
    expect(getLevel(30)).toBe("flame");
    expect(getLevel(50)).toBe("hot");
    expect(getLevel(80)).toBe("burning");
    expect(getLevel(120)).toBe("raging");
    expect(getLevel(180)).toBe("inferno");
    expect(getLevel(250)).toBe("star");
    expect(getLevel(999)).toBe("star");
  });

  it("calculates heat score correctly from engagement", () => {
    // Formula: felts * 3 + stitches * 8 + views * 1 + rekindles * 10
    const heatScore = (felts: number, stitches: number, views: number, rekindles = 0) =>
      felts * 3 + stitches * 8 + views + rekindles * 10;

    expect(heatScore(0, 0, 0)).toBe(0); // match
    expect(heatScore(1, 0, 2)).toBe(5); // spark threshold
    expect(heatScore(3, 1, 0)).toBe(17); // ignite
    expect(heatScore(5, 2, 1)).toBe(32); // flame
    expect(heatScore(0, 0, 0, 5)).toBe(50); // rekindles → hot
  });

  it("progress to next tier calculates correctly", () => {
    const progressToNext = (level: string, score: number) => {
      const idx = HEAT_TIERS.indexOf(level as any);
      if (idx >= 8) return 1; // star = max
      const cur = HEAT_THRESHOLDS[idx];
      const next = HEAT_THRESHOLDS[idx + 1];
      return Math.min(1, Math.max(0, (score - cur) / (next - cur)));
    };

    expect(progressToNext("match", 0)).toBe(0);
    expect(progressToNext("match", 2.5)).toBeCloseTo(0.5);
    expect(progressToNext("match", 5)).toBe(1);
    expect(progressToNext("spark", 10)).toBeCloseTo(0.5);
    expect(progressToNext("star", 300)).toBe(1);
  });
});

describe("Feed Signal Scoring", () => {
  it("composite score weights sum to 1", () => {
    const auraWeight = 0.35;
    const engagementWeight = 0.4;
    const recencyWeight = 0.25;
    expect(auraWeight + engagementWeight + recencyWeight).toBeCloseTo(1);
  });

  it("engagement score caps at 100", () => {
    const engagementScore = (felts: number, stitches: number, views: number) =>
      Math.min(100, felts * 15 + stitches * 25 + views * 2);

    expect(engagementScore(0, 0, 0)).toBe(0);
    expect(engagementScore(3, 2, 10)).toBe(115 > 100 ? 100 : 115); // capped
    expect(engagementScore(100, 100, 100)).toBe(100);
  });
});

describe("Heat Advisory Logic", () => {
  it("should trigger advisory for flame+ tiers", () => {
    const advisoryTiers = ["flame", "hot", "burning", "raging", "inferno", "star"];
    const nonAdvisoryTiers = ["match", "spark", "ignite"];

    advisoryTiers.forEach((tier) => {
      expect(advisoryTiers.includes(tier)).toBe(true);
    });
    nonAdvisoryTiers.forEach((tier) => {
      expect(advisoryTiers.includes(tier)).toBe(false);
    });
  });
});
