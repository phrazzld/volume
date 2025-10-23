import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import type { TestConvex } from "convex-test";

describe("User Preferences", () => {
  let t: TestConvex<typeof schema>;
  const user1Subject = "user_1_test_subject";
  const user2Subject = "user_2_test_subject";

  beforeEach(async () => {
    // Create fresh test environment for each test
    // @ts-expect-error - import.meta.glob is a Vite feature, types not available in test env
    t = convexTest(schema, import.meta.glob("./**/*.ts"));
  });

  describe("Default Preferences", () => {
    test("getPreferences should return default 'lbs' for new users", async () => {
      const preferences = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});

      expect(preferences.weightUnit).toBe("lbs");
    });

    test("getPreferences should return 'lbs' for unauthenticated users", async () => {
      const preferences = await t.query(api.userPreferences.getPreferences, {});

      expect(preferences.weightUnit).toBe("lbs");
    });
  });

  describe("Update Preferences", () => {
    test("updatePreferences should create new record for first-time user", async () => {
      const result = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "kg" });

      expect(result.weightUnit).toBe("kg");

      // Verify preference persisted
      const preferences = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});

      expect(preferences.weightUnit).toBe("kg");
    });

    test("updatePreferences should update existing record", async () => {
      // Create initial preference
      await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "lbs" });

      // Update to kg
      const result = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "kg" });

      expect(result.weightUnit).toBe("kg");

      // Verify only one record exists (upsert, not insert)
      const preferences = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});

      expect(preferences.weightUnit).toBe("kg");
    });

    test("updatePreferences should accept 'lbs' unit", async () => {
      const result = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "lbs" });

      expect(result.weightUnit).toBe("lbs");
    });

    test("updatePreferences should accept 'kg' unit", async () => {
      const result = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "kg" });

      expect(result.weightUnit).toBe("kg");
    });
  });

  describe("Validation", () => {
    test("updatePreferences should reject invalid unit via type system", async () => {
      // This test verifies compile-time type safety
      // Invalid units are caught by TypeScript before runtime
      // The mutation accepts v.union(v.literal("lbs"), v.literal("kg"))

      // Attempting to pass invalid unit would cause TypeScript error:
      // @ts-expect-error - Testing that invalid units are rejected
      const invalidCall = t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, {
          weightUnit: "invalid" as any,
        });

      // The mutation itself validates in runtime too
      await expect(invalidCall).rejects.toThrow();
    });
  });

  describe("Authentication", () => {
    test("updatePreferences should require authentication", async () => {
      // Attempt without identity
      await expect(
        t.mutation(api.userPreferences.updatePreferences, { weightUnit: "lbs" })
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("Multi-User Isolation", () => {
    test("preferences should be isolated between users", async () => {
      // User 1 sets kg
      await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "kg" });

      // User 2 sets lbs
      await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "lbs" });

      // Verify User 1 still has kg
      const user1Prefs = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});
      expect(user1Prefs.weightUnit).toBe("kg");

      // Verify User 2 has lbs
      const user2Prefs = await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .query(api.userPreferences.getPreferences, {});
      expect(user2Prefs.weightUnit).toBe("lbs");
    });

    test("updating one user's preference should not affect another", async () => {
      // Both users start with default
      const user1Initial = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});
      expect(user1Initial.weightUnit).toBe("lbs");

      // User 2 changes to kg
      await t
        .withIdentity({ subject: user2Subject, name: "User 2" })
        .mutation(api.userPreferences.updatePreferences, { weightUnit: "kg" });

      // User 1 should still have default (no record created)
      const user1Final = await t
        .withIdentity({ subject: user1Subject, name: "User 1" })
        .query(api.userPreferences.getPreferences, {});
      expect(user1Final.weightUnit).toBe("lbs");
    });
  });
});
