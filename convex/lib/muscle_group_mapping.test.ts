import { describe, it, expect } from "vitest";
import { getMuscleGroups, getAllMuscleGroups } from "./muscle_group_mapping";
import type { MuscleGroup } from "./muscle_group_mapping";

describe("getMuscleGroups", () => {
  describe("exact matches", () => {
    it('matches "BENCH PRESS" exactly', () => {
      const result = getMuscleGroups("BENCH PRESS");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('matches "SQUAT" exactly', () => {
      const result = getMuscleGroups("SQUAT");
      expect(result).toEqual(["Quads", "Glutes"]);
    });

    it('matches "DEADLIFT" with multiple muscle groups', () => {
      const result = getMuscleGroups("DEADLIFT");
      expect(result).toEqual(["Back", "Hamstrings", "Glutes"]);
    });

    it('matches "PLANK" for core', () => {
      const result = getMuscleGroups("PLANK");
      expect(result).toEqual(["Core"]);
    });
  });

  describe("case insensitive matching", () => {
    it('matches "bench press" (lowercase)', () => {
      const result = getMuscleGroups("bench press");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('matches "Bench Press" (title case)', () => {
      const result = getMuscleGroups("Bench Press");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('matches "BENCH PRESS" (uppercase)', () => {
      const result = getMuscleGroups("BENCH PRESS");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('matches "DeAdLiFt" (mixed case)', () => {
      const result = getMuscleGroups("DeAdLiFt");
      expect(result).toEqual(["Back", "Hamstrings", "Glutes"]);
    });
  });

  describe("partial matching", () => {
    it('matches "BARBELL BENCH PRESS" via "BENCH" keyword', () => {
      const result = getMuscleGroups("BARBELL BENCH PRESS");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('matches "DUMBBELL BENCH PRESS" via "BENCH" keyword', () => {
      const result = getMuscleGroups("DUMBBELL BENCH PRESS");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('matches "BARBELL SQUAT" via "SQUAT" keyword', () => {
      const result = getMuscleGroups("BARBELL SQUAT");
      expect(result).toEqual(["Quads", "Glutes"]);
    });

    it('matches "WIDE GRIP PULL UP" via "PULL UP" keyword', () => {
      const result = getMuscleGroups("WIDE GRIP PULL UP");
      expect(result).toEqual(["Back", "Biceps"]);
    });

    it('matches "WEIGHTED PULL-UPS" via "PULL-UP" keyword', () => {
      const result = getMuscleGroups("WEIGHTED PULL-UPS");
      expect(result).toEqual(["Back", "Biceps"]);
    });

    it('matches "BARBELL ROW" via "ROW" keyword', () => {
      const result = getMuscleGroups("BARBELL ROW");
      expect(result).toEqual(["Back", "Biceps"]);
    });

    it('matches "DUMBBELL ROW" via "ROW" keyword', () => {
      const result = getMuscleGroups("DUMBBELL ROW");
      expect(result).toEqual(["Back", "Biceps"]);
    });

    it('matches "CABLE ROW" via "ROW" keyword', () => {
      const result = getMuscleGroups("CABLE ROW");
      expect(result).toEqual(["Back", "Biceps"]);
    });
  });

  describe("compound movements with multiple muscle groups", () => {
    it('returns multiple groups for "DEADLIFT"', () => {
      const result = getMuscleGroups("DEADLIFT");
      expect(result).toHaveLength(3);
      expect(result).toContain("Back");
      expect(result).toContain("Hamstrings");
      expect(result).toContain("Glutes");
    });

    it('returns multiple groups for "OVERHEAD PRESS"', () => {
      const result = getMuscleGroups("OVERHEAD PRESS");
      expect(result).toEqual(["Shoulders", "Triceps"]);
    });

    it('returns multiple groups for "ROMANIAN DEADLIFT"', () => {
      const result = getMuscleGroups("ROMANIAN DEADLIFT");
      expect(result).toEqual(["Hamstrings", "Glutes"]);
    });
  });

  describe("isolation movements", () => {
    it('maps "BICEP CURL" to biceps only', () => {
      const result = getMuscleGroups("BICEP CURL");
      expect(result).toEqual(["Biceps"]);
    });

    it('maps "TRICEP EXTENSION" to triceps only', () => {
      const result = getMuscleGroups("TRICEP EXTENSION");
      expect(result).toEqual(["Triceps"]);
    });

    it('maps "LATERAL RAISE" to shoulders only', () => {
      const result = getMuscleGroups("LATERAL RAISE");
      expect(result).toEqual(["Shoulders"]);
    });

    it('maps "LEG CURL" to hamstrings only', () => {
      const result = getMuscleGroups("LEG CURL");
      expect(result).toEqual(["Hamstrings"]);
    });

    it('maps "LEG EXTENSION" to quads only', () => {
      const result = getMuscleGroups("LEG EXTENSION");
      expect(result).toEqual(["Quads"]);
    });

    it('maps "CALF RAISE" to calves only', () => {
      const result = getMuscleGroups("CALF RAISE");
      expect(result).toEqual(["Calves"]);
    });
  });

  describe("edge cases and variations", () => {
    it("handles extra whitespace", () => {
      const result = getMuscleGroups("  BENCH PRESS  ");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it("handles hyphenated variations", () => {
      const pushUp = getMuscleGroups("PUSH-UP");
      expect(pushUp).toEqual(["Chest", "Triceps"]);

      const chinUp = getMuscleGroups("CHIN-UP");
      expect(chinUp).toEqual(["Back", "Biceps"]);
    });

    it("handles single-word exercises", () => {
      const bench = getMuscleGroups("BENCH");
      expect(bench).toEqual(["Chest", "Triceps"]);

      const curl = getMuscleGroups("CURL");
      expect(curl).toEqual(["Biceps"]);
    });

    it("prefers longer matches over shorter ones", () => {
      // "BENCH PRESS" should match before "BENCH"
      const result = getMuscleGroups("BENCH PRESS");
      expect(result).toEqual(["Chest", "Triceps"]);
    });

    it('returns ["Other"] for completely unknown exercises', () => {
      const result = getMuscleGroups("JUMPING JACKS");
      expect(result).toEqual(["Other"]);
    });

    it('returns ["Other"] for empty string', () => {
      const result = getMuscleGroups("");
      expect(result).toEqual(["Other"]);
    });

    it('returns ["Other"] for nonsense input', () => {
      const result = getMuscleGroups("ASDFGHJKL");
      expect(result).toEqual(["Other"]);
    });
  });

  describe("comprehensive exercise coverage", () => {
    it("maps common push exercises", () => {
      expect(getMuscleGroups("Bench Press")).toEqual(["Chest", "Triceps"]);
      expect(getMuscleGroups("Push-ups")).toEqual(["Chest", "Triceps"]);
      expect(getMuscleGroups("Overhead Press")).toEqual([
        "Shoulders",
        "Triceps",
      ]);
      expect(getMuscleGroups("Dips")).toEqual(["Chest", "Triceps"]);
    });

    it("maps common pull exercises", () => {
      expect(getMuscleGroups("Pull-ups")).toEqual(["Back", "Biceps"]);
      expect(getMuscleGroups("Chin-ups")).toEqual(["Back", "Biceps"]);
      expect(getMuscleGroups("Barbell Row")).toEqual(["Back", "Biceps"]);
      expect(getMuscleGroups("Lat Pulldown")).toEqual(["Back", "Biceps"]);
    });

    it("maps common leg exercises", () => {
      expect(getMuscleGroups("Back Squat")).toEqual(["Quads", "Glutes"]);
      expect(getMuscleGroups("Front Squat")).toEqual(["Quads", "Glutes"]);
      expect(getMuscleGroups("Leg Press")).toEqual(["Quads", "Glutes"]);
      expect(getMuscleGroups("Walking Lunges")).toEqual(["Quads", "Glutes"]);
      expect(getMuscleGroups("Calf Raises")).toEqual(["Calves"]);
    });

    it("maps common core exercises", () => {
      expect(getMuscleGroups("Plank")).toEqual(["Core"]);
      expect(getMuscleGroups("Crunches")).toEqual(["Core"]);
      expect(getMuscleGroups("Sit-ups")).toEqual(["Core"]);
      expect(getMuscleGroups("Hanging Leg Raises")).toEqual(["Core"]);
    });
  });

  describe("real-world exercise names", () => {
    it("handles descriptive exercise names", () => {
      expect(getMuscleGroups("3x5 Barbell Bench Press")).toEqual([
        "Chest",
        "Triceps",
      ]);
      expect(getMuscleGroups("Heavy Deadlifts (5RM)")).toEqual([
        "Back",
        "Hamstrings",
        "Glutes",
      ]);
      expect(getMuscleGroups("Weighted Pull-ups +25lbs")).toEqual([
        "Back",
        "Biceps",
      ]);
    });

    it("handles equipment prefixes", () => {
      expect(getMuscleGroups("DB Bench Press")).toEqual(["Chest", "Triceps"]);
      expect(getMuscleGroups("BB Squat")).toEqual(["Quads", "Glutes"]);
      expect(getMuscleGroups("Cable Row")).toEqual(["Back", "Biceps"]);
    });
  });
});

describe("getAllMuscleGroups", () => {
  it("returns all 11 muscle groups", () => {
    const groups = getAllMuscleGroups();
    expect(groups).toHaveLength(11);
  });

  it("includes all expected muscle groups", () => {
    const groups = getAllMuscleGroups();
    const expected: MuscleGroup[] = [
      "Chest",
      "Back",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Quads",
      "Hamstrings",
      "Glutes",
      "Calves",
      "Core",
      "Other",
    ];

    for (const group of expected) {
      expect(groups).toContain(group);
    }
  });

  it("returns a new array each time (not mutating)", () => {
    const groups1 = getAllMuscleGroups();
    const groups2 = getAllMuscleGroups();
    expect(groups1).not.toBe(groups2); // Different array instances
    expect(groups1).toEqual(groups2); // Same contents
  });
});
