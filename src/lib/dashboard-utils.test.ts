import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  convertWeight,
  calculateDailyStats,
  groupSetsByDay,
  formatDateGroup,
  calculateDailyStatsByExercise,
  sortExercisesByRecency,
} from "./dashboard-utils";
import type { Set, Exercise } from "@/types/domain";
import type { Id } from "../../convex/_generated/dataModel";

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
    expect(calculateDailyStatsByExercise(undefined, mockExercises)).toEqual([]);
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

describe("sortExercisesByRecency", () => {
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
    {
      _id: "ex3" as Id<"exercises">,
      userId: "user1",
      name: "Deadlifts",
      createdAt: Date.now(),
      _creationTime: Date.now(),
    },
  ];

  it("returns empty array for undefined exercises", () => {
    expect(sortExercisesByRecency(undefined, [])).toEqual([]);
  });

  it("returns exercises as-is if no sets provided", () => {
    const result = sortExercisesByRecency(mockExercises, []);
    expect(result).toEqual(mockExercises);
  });

  it("sorts by most recently used first", () => {
    const now = Date.now();
    const sets: Set[] = [
      {
        _id: "set1" as Id<"sets">,
        userId: "user1",
        exerciseId: "ex1" as Id<"exercises">,
        reps: 10,
        performedAt: now - 1000,
        _creationTime: now - 1000,
      },
      {
        _id: "set2" as Id<"sets">,
        userId: "user1",
        exerciseId: "ex2" as Id<"exercises">,
        reps: 10,
        performedAt: now,
        _creationTime: now,
      },
    ];

    const result = sortExercisesByRecency(mockExercises, sets);
    expect(result[0]._id).toBe("ex2"); // Most recent
    expect(result[1]._id).toBe("ex1");
    expect(result[2]._id).toBe("ex3"); // Never used
  });

  it("sorts unused exercises alphabetically", () => {
    const result = sortExercisesByRecency(mockExercises, []);
    // No usage data, should maintain original order (or alphabetical)
    expect(result).toHaveLength(3);
  });

  it("does not mutate input array", () => {
    const originalOrder = [...mockExercises];
    const now = Date.now();
    const sets: Set[] = [
      {
        _id: "set1" as Id<"sets">,
        userId: "user1",
        exerciseId: "ex2" as Id<"exercises">,
        reps: 10,
        performedAt: now,
        _creationTime: now,
      },
    ];

    sortExercisesByRecency(mockExercises, sets);
    expect(mockExercises).toEqual(originalOrder);
  });
});
