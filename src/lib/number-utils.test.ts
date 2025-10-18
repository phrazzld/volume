import { describe, it, expect } from "vitest";
import { formatNumber } from "./number-utils";

describe("formatNumber", () => {
  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats small numbers with commas", () => {
    expect(formatNumber(450)).toBe("450");
    expect(formatNumber(1_200)).toBe("1,200");
    expect(formatNumber(9_999)).toBe("9,999");
  });

  it("formats thousands with K suffix (≥10K)", () => {
    expect(formatNumber(10_000)).toBe("10.0K");
    expect(formatNumber(12_450)).toBe("12.4K"); // 12.45 rounds to 12.4
    expect(formatNumber(12_500)).toBe("12.5K");
    expect(formatNumber(99_999)).toBe("100.0K");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(1_234_567)).toBe("1.2M");
    expect(formatNumber(12_345_678)).toBe("12.3M");
  });

  it("handles negative numbers", () => {
    expect(formatNumber(-450)).toBe("-450");
    expect(formatNumber(-12_450)).toBe("-12.4K");
    expect(formatNumber(-1_234_567)).toBe("-1.2M");
  });

  it("handles edge cases", () => {
    expect(formatNumber(Infinity)).toBe("—");
    expect(formatNumber(-Infinity)).toBe("—");
    expect(formatNumber(NaN)).toBe("—");
  });

  it("rounds to one decimal place for K/M suffixes", () => {
    expect(formatNumber(12_449)).toBe("12.4K"); // Rounds down
    expect(formatNumber(12_451)).toBe("12.5K"); // Rounds up
  });
});
