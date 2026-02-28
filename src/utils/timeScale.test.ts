import { describe, it, expect } from "vitest";
import { formatYear, yearToPosition, positionToYear } from "./timeScale";

describe("formatYear", () => {
  it("formats billions of years", () => {
    expect(formatYear(-4_500_000_000)).toBe("4,5 Ga");
  });

  it("formats millions of years", () => {
    expect(formatYear(-540_000_000)).toBe("540 Ma");
  });

  it("formats BCE years", () => {
    expect(formatYear(-3000)).toContain("av. J.-C.");
  });

  it("formats CE years", () => {
    const result = formatYear(1687);
    expect(result).toContain("1");
  });
});

describe("yearToPosition / positionToYear", () => {
  it("returns 0 for the earliest year", () => {
    const pos = yearToPosition(-4_500_000_000);
    expect(pos).toBeCloseTo(0, 1);
  });

  it("returns ~1 for the latest year", () => {
    const pos = yearToPosition(2026);
    expect(pos).toBeCloseTo(1, 1);
  });

  it("round-trips approximately", () => {
    const year = 1500;
    const pos = yearToPosition(year);
    const back = positionToYear(pos);
    expect(back).toBeCloseTo(year, -1);
  });
});
