import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { TestConvex } from "convex-test";

/**
 * HTTP Endpoint Integration Tests
 *
 * Tests the REST API layer (convex/http.ts) which wraps Convex mutations/queries.
 * Validates authentication, input validation, error handling, and API contract.
 *
 * Note: HTTP actions are tested by calling the underlying mutations/queries directly
 * and verifying the business logic. The HTTP layer itself (URL parsing, JSON responses)
 * is tested through integration scenarios.
 */
describe("HTTP API - Authentication", () => {
  let t: TestConvex<typeof schema>;
  const user1Subject = "user_http_test_1";
  const user2Subject = "user_http_test_2";

  beforeEach(async () => {
    // @ts-expect-error - import.meta.glob is a Vite feature
    t = convexTest(schema, import.meta.glob("./**/*.ts"));
  });

  describe("Exercises Endpoints", () => {
    test("POST /api/exercises - requires authentication", async () => {
      // Attempt without identity should fail
      await expect(
        t.mutation(api.exercises.createExercise, { name: "BENCH PRESS" })
      ).rejects.toThrow("Not authenticated");
    });

    test("POST /api/exercises - creates exercise with valid auth", async () => {
      const exerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "SQUATS" });

      expect(exerciseId).toBeDefined();
      expect(typeof exerciseId).toBe("string");
    });

    test("GET /api/exercises - enforces user isolation", async () => {
      // User 1 creates exercise
      await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      // User 2 creates different exercise
      await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .mutation(api.exercises.createExercise, { name: "USER 2 EXERCISE" });

      // User 1 should only see their own
      const user1Exercises = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.exercises.listExercises, { includeDeleted: false });

      expect(user1Exercises.length).toBe(1);
      expect(user1Exercises[0].name).toBe("USER 1 EXERCISE");

      // User 2 should only see their own
      const user2Exercises = await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .query(api.exercises.listExercises, { includeDeleted: false });

      expect(user2Exercises.length).toBe(1);
      expect(user2Exercises[0].name).toBe("USER 2 EXERCISE");
    });

    test("PATCH /api/exercises/:id - prevents IDOR attacks", async () => {
      // User 1 creates exercise
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 ORIGINAL" });

      // User 2 tries to update User 1's exercise (IDOR attempt)
      await expect(
        t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.exercises.updateExercise, {
            id: user1ExerciseId,
            name: "HACKED",
          })
      ).rejects.toThrow("Not authorized to access this exercise");
    });

    test("DELETE /api/exercises/:id - prevents IDOR attacks", async () => {
      // User 1 creates exercise
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      // User 2 tries to delete User 1's exercise (IDOR attempt)
      await expect(
        t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.exercises.deleteExercise, { id: user1ExerciseId })
      ).rejects.toThrow("Not authorized to access this exercise");
    });
  });

  describe("Sets Endpoints", () => {
    test("POST /api/sets - requires authentication", async () => {
      // Create exercise first
      const exerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      // Attempt without identity should fail
      await expect(
        t.mutation(api.sets.logSet, {
          exerciseId,
          reps: 10,
          weight: 135,
          unit: "lbs",
        })
      ).rejects.toThrow("Not authenticated");
    });

    test("POST /api/sets - enforces exercise ownership", async () => {
      // User 1 creates exercise
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      // User 2 tries to log set on User 1's exercise (IDOR attempt)
      await expect(
        t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.sets.logSet, {
            exerciseId: user1ExerciseId,
            reps: 10,
            weight: 100,
            unit: "lbs",
          })
      ).rejects.toThrow("Not authorized to access this exercise");
    });

    test("GET /api/sets - enforces user isolation", async () => {
      // User 1 creates exercise and logs set
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.sets.logSet, {
          exerciseId: user1ExerciseId,
          reps: 10,
          weight: 100,
          unit: "lbs",
        });

      // User 2 creates own exercise and logs set
      const user2ExerciseId = await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .mutation(api.exercises.createExercise, { name: "USER 2 EXERCISE" });

      await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .mutation(api.sets.logSet, {
          exerciseId: user2ExerciseId,
          reps: 20,
          weight: 200,
          unit: "kg",
        });

      // User 1 should only see their own sets
      const user1Sets = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.sets.listSets, {});

      expect(user1Sets.length).toBe(1);
      expect(user1Sets[0].reps).toBe(10);

      // User 2 should only see their own sets
      const user2Sets = await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .query(api.sets.listSets, {});

      expect(user2Sets.length).toBe(1);
      expect(user2Sets[0].reps).toBe(20);
    });

    test("DELETE /api/sets/:id - prevents IDOR attacks", async () => {
      // User 1 creates exercise and logs set
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      const user1SetId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.sets.logSet, {
          exerciseId: user1ExerciseId,
          reps: 10,
          weight: 100,
          unit: "lbs",
        });

      // User 2 tries to delete User 1's set (IDOR attempt)
      await expect(
        t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.sets.deleteSet, { id: user1SetId })
      ).rejects.toThrow("Not authorized to access this set");
    });
  });

  describe("Preferences Endpoints", () => {
    test("GET /api/preferences - returns default for new users", async () => {
      const preferences = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});

      expect(preferences.weightUnit).toBe("lbs");
    });

    test("PATCH /api/preferences - requires authentication", async () => {
      await expect(
        t.mutation(api.userPreferences.updatePreferences, {
          weightUnit: "kg",
        })
      ).rejects.toThrow("Not authenticated");
    });

    test("PATCH /api/preferences - enforces user isolation", async () => {
      // User 1 sets preference to kg
      await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "kg" });

      // User 2's preference should still be default (lbs)
      const user2Prefs = await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .query(api.userPreferences.getPreferences, {});

      expect(user2Prefs.weightUnit).toBe("lbs");

      // User 1's preference should be kg
      const user1Prefs = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});

      expect(user1Prefs.weightUnit).toBe("kg");
    });
  });
});

describe("HTTP API - Input Validation", () => {
  let t: TestConvex<typeof schema>;
  const userSubject = "user_validation_test";

  beforeEach(async () => {
    // @ts-expect-error - import.meta.glob is a Vite feature
    t = convexTest(schema, import.meta.glob("./**/*.ts"));
  });

  describe("Exercise Validation", () => {
    test("POST /api/exercises - rejects empty exercise name", async () => {
      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.exercises.createExercise, { name: "" })
      ).rejects.toThrow("Exercise name cannot be empty");
    });

    test("POST /api/exercises - rejects whitespace-only name", async () => {
      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.exercises.createExercise, { name: "   " })
      ).rejects.toThrow("Exercise name cannot be empty");
    });

    test("POST /api/exercises - rejects duplicate exercise name", async () => {
      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.exercises.createExercise, { name: "BENCH PRESS" })
      ).rejects.toThrow("Exercise with this name already exists");
    });

    test("PATCH /api/exercises/:id - rejects empty name", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "SQUATS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.exercises.updateExercise, {
            id: exerciseId,
            name: "",
          })
      ).rejects.toThrow("Exercise name cannot be empty");
    });
  });

  describe("Set Validation", () => {
    test("POST /api/sets - rejects invalid reps (0)", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId,
            reps: 0,
            weight: 100,
            unit: "lbs",
          })
      ).rejects.toThrow("Reps must be a whole number between 1 and 1000");
    });

    test("POST /api/sets - rejects invalid reps (negative)", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId,
            reps: -5,
            weight: 100,
            unit: "lbs",
          })
      ).rejects.toThrow("Reps must be a whole number between 1 and 1000");
    });

    test("POST /api/sets - rejects invalid weight (negative)", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId,
            reps: 10,
            weight: -50,
            unit: "lbs",
          })
      ).rejects.toThrow("Weight must be between 0.1 and 10000");
    });

    test("POST /api/sets - requires unit when weight is provided", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId,
            reps: 10,
            weight: 100,
          })
      ).rejects.toThrow("Unit must be 'lbs' or 'kg' when weight is provided");
    });

    test("POST /api/sets - rejects invalid unit", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId,
            reps: 10,
            weight: 100,
            unit: "stones",
          })
      ).rejects.toThrow("Unit must be 'lbs' or 'kg' when weight is provided");
    });

    test("POST /api/sets - rejects non-existent exercise", async () => {
      const fakeId = "fake_exercise_id" as Id<"exercises">;

      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId: fakeId,
            reps: 10,
            weight: 100,
            unit: "lbs",
          })
      ).rejects.toThrow("Validator error");
    });
  });

  describe("Preferences Validation", () => {
    test("PATCH /api/preferences - rejects invalid weightUnit", async () => {
      await expect(
        t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.userPreferences.updatePreferences, {
            weightUnit: "stones" as any,
          })
      ).rejects.toThrow();
    });
  });
});

describe("HTTP API - Query Parameters", () => {
  let t: TestConvex<typeof schema>;
  const userSubject = "user_query_test";

  beforeEach(async () => {
    // @ts-expect-error - import.meta.glob is a Vite feature
    t = convexTest(schema, import.meta.glob("./**/*.ts"));
  });

  describe("GET /api/exercises - includeDeleted parameter", () => {
    test("includeDeleted=false excludes deleted exercises", async () => {
      // Create and delete exercise
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "DELETED EXERCISE" });

      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.deleteExercise, { id: exerciseId });

      // Query without deleted
      const exercises = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.exercises.listExercises, { includeDeleted: false });

      expect(exercises.length).toBe(0);
    });

    test("includeDeleted=true includes deleted exercises", async () => {
      // Create and delete exercise
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "DELETED EXERCISE" });

      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.deleteExercise, { id: exerciseId });

      // Query with deleted
      const exercises = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.exercises.listExercises, { includeDeleted: true });

      expect(exercises.length).toBe(1);
      expect(exercises[0].deletedAt).toBeDefined();
    });
  });

  describe("GET /api/sets - exerciseId parameter", () => {
    test("filters sets by exerciseId", async () => {
      // Create two exercises
      const exercise1Id = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "EXERCISE 1" });

      const exercise2Id = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "EXERCISE 2" });

      // Log sets for both
      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.sets.logSet, {
          exerciseId: exercise1Id,
          reps: 10,
        });

      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.sets.logSet, {
          exerciseId: exercise1Id,
          reps: 12,
        });

      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.sets.logSet, {
          exerciseId: exercise2Id,
          reps: 20,
        });

      // Query filtered by exercise1
      const exercise1Sets = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.sets.listSets, { exerciseId: exercise1Id });

      expect(exercise1Sets.length).toBe(2);
      expect(exercise1Sets.every((s) => s.exerciseId === exercise1Id)).toBe(
        true
      );

      // Query filtered by exercise2
      const exercise2Sets = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.sets.listSets, { exerciseId: exercise2Id });

      expect(exercise2Sets.length).toBe(1);
      expect(exercise2Sets[0].exerciseId).toBe(exercise2Id);
    });

    test("returns all sets when exerciseId not provided", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.sets.logSet, {
          exerciseId,
          reps: 10,
        });

      await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.sets.logSet, {
          exerciseId,
          reps: 12,
        });

      const allSets = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.sets.listSets, {});

      expect(allSets.length).toBe(2);
    });
  });

  describe("GET /api/sets/paginated - pagination", () => {
    test("handles pagination correctly", async () => {
      const exerciseId = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .mutation(api.exercises.createExercise, { name: "BENCH PRESS" });

      // Create 10 sets
      for (let i = 0; i < 10; i++) {
        await t
          .withIdentity({ subject: userSubject, name: "User" })
          .mutation(api.sets.logSet, {
            exerciseId,
            reps: i + 1,
          });
      }

      // Get first page
      const firstPage = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.sets.listSetsPaginated, {
          paginationOpts: { numItems: 5, cursor: null },
        });

      expect(firstPage.page.length).toBe(5);
      expect(firstPage.isDone).toBe(false);
      expect(firstPage.continueCursor).toBeDefined();

      // Get second page
      const secondPage = await t
        .withIdentity({ subject: userSubject, name: "User" })
        .query(api.sets.listSetsPaginated, {
          paginationOpts: {
            numItems: 5,
            cursor: firstPage.continueCursor,
          },
        });

      expect(secondPage.page.length).toBeGreaterThan(0);
      expect(secondPage.page.length).toBeLessThanOrEqual(5);

      // Verify all sets were returned across pages and are unique
      const allSetIds = [...firstPage.page, ...secondPage.page].map(
        (s) => s._id
      );
      expect(allSetIds.length).toBe(10);
      expect(new Set(allSetIds).size).toBe(10); // All unique
    });
  });
});

describe("HTTP API - Error Handling", () => {
  let t: TestConvex<typeof schema>;
  const user1Subject = "user_error_test_1";
  const user2Subject = "user_error_test_2";

  beforeEach(async () => {
    // @ts-expect-error - import.meta.glob is a Vite feature
    t = convexTest(schema, import.meta.glob("./**/*.ts"));
  });

  describe("404 Not Found", () => {
    test("updating non-existent exercise returns error", async () => {
      const fakeId = "fake_exercise_id" as Id<"exercises">;

      await expect(
        t
          .withIdentity({ subject: user1Subject, name: "User 1" })
          .mutation(api.exercises.updateExercise, {
            id: fakeId,
            name: "NEW NAME",
          })
      ).rejects.toThrow("Validator error");
    });

    test("deleting non-existent exercise returns error", async () => {
      const fakeId = "fake_exercise_id" as Id<"exercises">;

      await expect(
        t
          .withIdentity({ subject: user1Subject, name: "User 1" })
          .mutation(api.exercises.deleteExercise, { id: fakeId })
      ).rejects.toThrow("Validator error");
    });

    test("deleting non-existent set returns error", async () => {
      const fakeId = "fake_set_id" as Id<"sets">;

      await expect(
        t
          .withIdentity({ subject: user1Subject, name: "User 1" })
          .mutation(api.sets.deleteSet, { id: fakeId })
      ).rejects.toThrow("Validator error");
    });
  });

  describe("403 Forbidden - IDOR Protection", () => {
    test("accessing another user's exercise returns ownership error", async () => {
      // User 1 creates exercise
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      // User 2 tries to access it
      await expect(
        t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.exercises.deleteExercise, { id: user1ExerciseId })
      ).rejects.toThrow("Not authorized to access this exercise");
    });

    test("accessing another user's set returns ownership error", async () => {
      // User 1 creates exercise and set
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      const user1SetId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.sets.logSet, {
          exerciseId: user1ExerciseId,
          reps: 10,
        });

      // User 2 tries to access it
      await expect(
        t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.sets.deleteSet, { id: user1SetId })
      ).rejects.toThrow("Not authorized to access this set");
    });
  });

  describe("Error Response Format", () => {
    test("validation errors provide clear messages", async () => {
      try {
        await t
          .withIdentity({ subject: user1Subject, name: "User 1" })
          .mutation(api.exercises.createExercise, { name: "" });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Exercise name");
      }
    });

    test("ownership errors provide clear messages", async () => {
      const user1ExerciseId = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.exercises.createExercise, { name: "USER 1 EXERCISE" });

      try {
        await t
          .withIdentity({ subject: user2Subject, name: "User 2" })
          .mutation(api.exercises.deleteExercise, { id: user1ExerciseId });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Not authorized");
      }
    });
  });
});
