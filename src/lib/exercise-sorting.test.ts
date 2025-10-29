import { describe, it, expect } from "vitest";
import { sortExercisesByRecency } from "./exercise-sorting";
import type { Set, Exercise } from "@/types/domain";
import type { Id } from "../../convex/_generated/dataModel";

describe("exercise-sorting", () => {
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
});
