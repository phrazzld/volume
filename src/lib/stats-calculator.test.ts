import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateDailyStats,
  calculateDailyStatsByExercise,
} from "./stats-calculator";
import type { Set, Exercise } from "@/types/domain";
import type { Id } from "../../convex/_generated/dataModel";

describe("stats-calculator", () => {
  describe("calculateDailyStats", () => {
    const mockExerciseId = "exercise123" as Id<"exercises">;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-12T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns null for empty array", () => {
      expect(calculateDailyStats([])).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(calculateDailyStats(undefined)).toBeNull();
    });

    it("returns null when no sets are from today", () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: yesterday,
          _creationTime: yesterday,
        },
      ];

      expect(calculateDailyStats(sets)).toBeNull();
    });

    it("filters to today's sets only", () => {
      const today = Date.now();
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;

      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: today,
          _creationTime: today,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 8,
          performedAt: yesterday,
          _creationTime: yesterday,
        },
      ];

      const stats = calculateDailyStats(sets, "lbs");
      expect(stats?.totalSets).toBe(1);
      expect(stats?.totalReps).toBe(10);
    });

    it("calculates total sets and reps correctly", () => {
      const now = Date.now();
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 8,
          weight: 145,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
      ];

      const stats = calculateDailyStats(sets, "lbs");
      expect(stats?.totalSets).toBe(2);
      expect(stats?.totalReps).toBe(18);
      expect(stats?.totalVolume).toBeCloseTo(2510, 1); // 10*135 + 8*145
    });

    it("converts mixed units correctly before calculating volume", () => {
      const now = Date.now();
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 10,
          weight: 100,
          unit: "kg",
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 10,
          weight: 100,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
      ];

      const stats = calculateDailyStats(sets, "lbs");
      // 10 reps * 100kg (220.46 lbs) + 10 reps * 100 lbs = 2204.6 + 1000 = 3204.6
      expect(stats?.totalVolume).toBeCloseTo(3204.6, 1);
    });

    it("handles sets without weight (bodyweight exercises)", () => {
      const now = Date.now();
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 10,
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: mockExerciseId,
          reps: 8,
          weight: 100,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
      ];

      const stats = calculateDailyStats(sets, "lbs");
      expect(stats?.totalSets).toBe(2);
      expect(stats?.totalReps).toBe(18);
      expect(stats?.totalVolume).toBe(800); // Only weighted set counts
    });

    it("counts unique exercises correctly", () => {
      const now = Date.now();
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 8,
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set3" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex2" as Id<"exercises">,
          reps: 12,
          performedAt: now,
          _creationTime: now,
        },
      ];

      const stats = calculateDailyStats(sets);
      expect(stats?.exercisesWorked).toBe(2);
    });
  });

  describe("calculateDailyStatsByExercise", () => {
    const mockExercises: Exercise[] = [
      {
        _id: "ex1" as Id<"exercises">,
        userId: "user1",
        name: "Bench Press",
        createdAt: Date.now(),
        _creationTime: Date.now(),
      },
      {
        _id: "ex2" as Id<"exercises">,
        userId: "user1",
        name: "Squats",
        createdAt: Date.now(),
        _creationTime: Date.now(),
      },
    ];

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-12T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns empty array for undefined sets", () => {
      expect(calculateDailyStatsByExercise(undefined, mockExercises)).toEqual(
        []
      );
    });

    it("returns empty array for undefined exercises", () => {
      const now = Date.now();
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          performedAt: now,
          _creationTime: now,
        },
      ];
      expect(calculateDailyStatsByExercise(sets, undefined)).toEqual([]);
    });

    it("filters to today's sets only", () => {
      const today = Date.now();
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;

      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: today,
          _creationTime: today,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 8,
          weight: 145,
          unit: "lbs",
          performedAt: yesterday,
          _creationTime: yesterday,
        },
      ];

      const stats = calculateDailyStatsByExercise(sets, mockExercises, "lbs");
      expect(stats).toHaveLength(1);
      expect(stats[0].sets).toBe(1);
    });

    it("aggregates stats per exercise correctly", () => {
      const now = Date.now();
      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 8,
          weight: 145,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set3" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex2" as Id<"exercises">,
          reps: 5,
          weight: 225,
          unit: "lbs",
          performedAt: now,
          _creationTime: now,
        },
      ];

      const stats = calculateDailyStatsByExercise(sets, mockExercises, "lbs");
      expect(stats).toHaveLength(2);

      const benchStats = stats.find((s) => s.exerciseId === "ex1");
      expect(benchStats?.sets).toBe(2);
      expect(benchStats?.reps).toBe(18);
      expect(benchStats?.volume).toBeCloseTo(2510, 1); // 10*135 + 8*145

      const squatStats = stats.find((s) => s.exerciseId === "ex2");
      expect(squatStats?.sets).toBe(1);
      expect(squatStats?.reps).toBe(5);
      expect(squatStats?.volume).toBe(1125); // 5*225
    });

    it("sorts by most sets first, then alphabetical", () => {
      const now = Date.now();
      const exercises: Exercise[] = [
        {
          _id: "ex1" as Id<"exercises">,
          userId: "user1",
          name: "Zebra Exercise",
          createdAt: now,
          _creationTime: now,
        },
        {
          _id: "ex2" as Id<"exercises">,
          userId: "user1",
          name: "Apple Exercise",
          createdAt: now,
          _creationTime: now,
        },
      ];

      const sets: Set[] = [
        {
          _id: "set1" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex1" as Id<"exercises">,
          reps: 10,
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set2" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex2" as Id<"exercises">,
          reps: 10,
          performedAt: now,
          _creationTime: now,
        },
        {
          _id: "set3" as Id<"sets">,
          userId: "user1",
          exerciseId: "ex2" as Id<"exercises">,
          reps: 10,
          performedAt: now,
          _creationTime: now,
        },
      ];

      const stats = calculateDailyStatsByExercise(sets, exercises);
      // ex2 has 2 sets, ex1 has 1 set → ex2 first
      expect(stats[0].exerciseId).toBe("ex2");
      expect(stats[1].exerciseId).toBe("ex1");
    });
  });
});
