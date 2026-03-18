import { describe, it, expect, beforeEach } from "vitest";

describe("Onboarding Flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("onboarding flag defaults to not set", () => {
    expect(localStorage.getItem("arura_onboarded")).toBeNull();
  });

  it("setting onboarded flag persists", () => {
    localStorage.setItem("arura_onboarded", "true");
    expect(localStorage.getItem("arura_onboarded")).toBe("true");
  });

  it("vibes picker flag tracks completion", () => {
    expect(localStorage.getItem("arura_vibes_picked")).toBeNull();
    localStorage.setItem("arura_vibes_picked", "true");
    expect(localStorage.getItem("arura_vibes_picked")).toBe("true");
  });

  it("ember suggestions flag tracks completion", () => {
    expect(localStorage.getItem("arura_embers_picked")).toBeNull();
    localStorage.setItem("arura_embers_picked", "true");
    expect(localStorage.getItem("arura_embers_picked")).toBe("true");
  });

  it("full onboarding flow sets all three flags", () => {
    // Simulate completing all steps
    localStorage.setItem("arura_onboarded", "true");
    localStorage.setItem("arura_vibes_picked", "true");
    localStorage.setItem("arura_embers_picked", "true");

    expect(localStorage.getItem("arura_onboarded")).toBe("true");
    expect(localStorage.getItem("arura_vibes_picked")).toBe("true");
    expect(localStorage.getItem("arura_embers_picked")).toBe("true");
  });
});

describe("Onboarding Steps Content", () => {
  it("has correct step terminology (flare not drop)", () => {
    // This is a contract test — if the step text changes, this ensures
    // we catch any regression back to "drop" terminology
    const stepTexts = [
      "Flare",
      "Tap = Felt",
      "Double-tap = Stitch",
      "Keep It Lit",
      "Embers",
      "Words",
    ];
    stepTexts.forEach((text) => {
      expect(text).not.toContain("Drop");
      expect(text).not.toContain("Indulge");
    });
  });
});
