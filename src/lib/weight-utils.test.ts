import { describe, it, expect } from "vitest";
import { convertWeight, LBS_PER_KG, normalizeWeightUnit } from "./weight-utils";

describe("weight-utils", () => {
  describe("LBS_PER_KG constant", () => {
    it("has correct conversion factor", () => {
      expect(LBS_PER_KG).toBe(2.20462);
    });
  });

  describe("convertWeight", () => {
    it("returns same weight if units are identical", () => {
      expect(convertWeight(100, "lbs", "lbs")).toBe(100);
      expect(convertWeight(50, "kg", "kg")).toBe(50);
    });

    it("converts lbs to kg accurately", () => {
      expect(convertWeight(220, "lbs", "kg")).toBeCloseTo(99.79, 2);
      expect(convertWeight(100, "lbs", "kg")).toBeCloseTo(45.36, 2);
    });

    it("converts kg to lbs accurately", () => {
      expect(convertWeight(100, "kg", "lbs")).toBeCloseTo(220.46, 2);
      expect(convertWeight(45.36, "kg", "lbs")).toBeCloseTo(100, 2);
    });

    it("handles edge cases", () => {
      expect(convertWeight(0, "lbs", "kg")).toBe(0);
      expect(convertWeight(0, "kg", "lbs")).toBe(0);
      expect(convertWeight(-10, "lbs", "kg")).toBeCloseTo(-4.54, 2);
    });

    it("handles very large weights", () => {
      expect(convertWeight(1000, "kg", "lbs")).toBeCloseTo(2204.62, 2);
    });
  });

  describe("normalizeWeightUnit", () => {
    it("returns lbs when unit is lbs", () => {
      expect(normalizeWeightUnit("lbs")).toBe("lbs");
    });

    it("returns kg when unit is kg", () => {
      expect(normalizeWeightUnit("kg")).toBe("kg");
    });

    it("returns lbs as fallback for undefined", () => {
      expect(normalizeWeightUnit(undefined)).toBe("lbs");
    });

    it("returns lbs as fallback for invalid units", () => {
      expect(normalizeWeightUnit("pounds")).toBe("lbs");
      expect(normalizeWeightUnit("kilograms")).toBe("lbs");
      expect(normalizeWeightUnit("")).toBe("lbs");
    });
  });
});
