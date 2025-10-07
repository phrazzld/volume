import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTodayRange } from "./date-utils";

describe("date-utils", () => {
  describe("getTodayRange", () => {
    beforeEach(() => {
      // Set a fixed time for testing: 2025-10-07 14:30:00 UTC
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-07T14:30:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns midnight to midnight timestamps for today", () => {
      const { start, end } = getTodayRange();

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Start should be at midnight (00:00:00.000)
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getMilliseconds()).toBe(0);

      // End should be at 23:59:59.999
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
      expect(endDate.getMilliseconds()).toBe(999);

      // Start and end should be on the same date
      expect(startDate.getDate()).toBe(endDate.getDate());
      expect(startDate.getMonth()).toBe(endDate.getMonth());
      expect(startDate.getFullYear()).toBe(endDate.getFullYear());
    });

    it("returns timestamps that span exactly 24 hours minus 1ms", () => {
      const { start, end } = getTodayRange();

      const duration = end - start;
      const expectedDuration = 24 * 60 * 60 * 1000 - 1; // 24 hours - 1ms

      expect(duration).toBe(expectedDuration);
    });

    it("filters sets correctly using the range", () => {
      const { start, end } = getTodayRange();

      // Mock sets with different timestamps
      const yesterday = start - 1000; // 1 second before midnight
      const todayMorning = start + 1000; // 1 second after midnight
      const todayNoon = start + 12 * 60 * 60 * 1000; // Noon
      const todayEvening = end - 1000; // 1 second before midnight
      const tomorrow = end + 1000; // 1 second after midnight

      const mockSets = [
        { performedAt: yesterday },
        { performedAt: todayMorning },
        { performedAt: todayNoon },
        { performedAt: todayEvening },
        { performedAt: tomorrow },
      ];

      const todaysSets = mockSets.filter(
        (s) => s.performedAt >= start && s.performedAt <= end
      );

      // Should only include the 3 sets from today
      expect(todaysSets).toHaveLength(3);
      expect(todaysSets.map((s) => s.performedAt)).toEqual([
        todayMorning,
        todayNoon,
        todayEvening,
      ]);
    });

    it("handles edge case at midnight boundary", () => {
      // Set time to exactly midnight
      vi.setSystemTime(new Date("2025-10-07T00:00:00Z"));

      const { start, end } = getTodayRange();

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Should still be the same day
      expect(startDate.getDate()).toBe(endDate.getDate());
      expect(start).toBeLessThan(end);
    });

    it("handles edge case at end of day", () => {
      // Set time to 23:59:59
      vi.setSystemTime(new Date("2025-10-07T23:59:59Z"));

      const { start, end } = getTodayRange();

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Should still be the same day
      expect(startDate.getDate()).toBe(endDate.getDate());
      expect(start).toBeLessThan(end);
    });
  });
});
