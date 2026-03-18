import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrandFlame, BrandStar, BrandSpark, BrandStitch, BrandEye, BrandEmber, BrandShatter, HeatIcon, heatTierIndex } from "@/components/BrandIcons";

describe("BrandIcons", () => {
  it("renders BrandFlame without crashing", () => {
    const { container } = render(<BrandFlame />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders BrandFlame with higher tier detail", () => {
    const { container } = render(<BrandFlame tier={5} size={20} />);
    const paths = container.querySelectorAll("path");
    // Higher tiers have more paths (inner fire + horns)
    expect(paths.length).toBeGreaterThan(2);
  });

  it("renders BrandStar", () => {
    const { container } = render(<BrandStar />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders BrandSpark", () => {
    const { container } = render(<BrandSpark />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders BrandStitch", () => {
    const { container } = render(<BrandStitch />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders BrandEye", () => {
    const { container } = render(<BrandEye />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders BrandEmber", () => {
    const { container } = render(<BrandEmber />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders BrandShatter", () => {
    const { container } = render(<BrandShatter />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("heatTierIndex returns correct indices", () => {
    expect(heatTierIndex("match")).toBe(0);
    expect(heatTierIndex("spark")).toBe(1);
    expect(heatTierIndex("star")).toBe(8);
    expect(heatTierIndex("unknown")).toBe(0);
  });

  it("HeatIcon renders star for tier 8+", () => {
    const { container } = render(<HeatIcon level="star" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // Star has a specific filter style
    expect(svg?.style.filter).toContain("drop-shadow");
  });

  it("HeatIcon renders flame for lower tiers", () => {
    const { container } = render(<HeatIcon level="match" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
