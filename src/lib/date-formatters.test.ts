import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { groupSetsByDay, formatDateGroup } from "./date-formatters";
import type { Set } from "@/types/domain";
import type { Id } from "../../convex/_generated/dataModel";

describe("date-formatters", () => {
  describe("groupSetsByDay", () => {
    it("returns empty array for undefined input", () => {
      expect(groupSetsByDay(undefined)).toEqual([]);
    });

    it("groups sets by calendar day", () => {
      const today = new Date("2025-10-12T10:00:00Z").getTime();
      const yesterday = new Date("2025-10-11T22:00:00Z").getTime();

      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          performedAt: today,
          _creationTime: today,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 8,
          performedAt: yesterday,
          _creationTime: yesterday,
        },
      ];

      const groups = groupSetsByDay(sets);
      expect(groups).toHaveLength(2);
    });

    it("sorts groups by date (newest first)", () => {
      const day1 = new Date("2025-10-10T10:00:00Z").getTime();
      const day2 = new Date("2025-10-11T10:00:00Z").getTime();
      const day3 = new Date("2025-10-12T10:00:00Z").getTime();

      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          performedAt: day1,
          _creationTime: day1,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 8,
          performedAt: day3,
          _creationTime: day3,
        },
        {
          _id: "set3" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 12,
          performedAt: day2,
          _creationTime: day2,
        },
      ];

      const groups = groupSetsByDay(sets);
      expect(groups[0].date).toBe(new Date(day3).toDateString());
      expect(groups[1].date).toBe(new Date(day2).toDateString());
      expect(groups[2].date).toBe(new Date(day1).toDateString());
    });

    it("sorts sets within day (newest first)", () => {
      const morning = new Date("2025-10-12T08:00:00Z").getTime();
      const afternoon = new Date("2025-10-12T14:00:00Z").getTime();

      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          performedAt: morning,
          _creationTime: morning,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 8,
          performedAt: afternoon,
          _creationTime: afternoon,
        },
      ];

      const groups = groupSetsByDay(sets);
      expect(groups[0].sets[0].performedAt).toBe(afternoon);
      expect(groups[0].sets[1].performedAt).toBe(morning);
    });
  });

  describe("formatDateGroup", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-12T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Today" for today\'s date', () => {
      const today = new Date().toDateString();
      expect(formatDateGroup(today)).toBe("Today");
    });

    it('returns "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDateGroup(yesterday.toDateString())).toBe("Yesterday");
    });

    it("returns weekday name for dates within last 7 days", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = formatDateGroup(threeDaysAgo.toDateString());
      // Should be a weekday name (Wednesday for Oct 9, 2025)
      expect(result).toMatch(
        /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/
      );
    });

    it('returns "Month Day" format for older dates', () => {
      const oldDate = new Date("2025-09-15T12:00:00Z");
      expect(formatDateGroup(oldDate.toDateString())).toMatch(/Sep 15/);
    });
  });
});
