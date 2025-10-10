import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireAuth,
  requireOwnership,
  validateExerciseName,
} from "./lib/validate";

// Create a new exercise
export const createExercise = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Validate and normalize exercise name
    const normalizedName = validateExerciseName(args.name);

    // Check for duplicate (including soft-deleted)
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", identity.subject).eq("name", normalizedName)
      )
      .first();

    if (existing) {
      // If soft-deleted, restore it instead of creating new
      if (existing.deletedAt !== undefined) {
        await ctx.db.patch(existing._id, { deletedAt: undefined });
        return existing._id; // Return restored exercise ID
      }

      // Active duplicate - still an error
      throw new Error("Exercise with this name already exists");
    }

    // No existing record - create new
    const exerciseId = await ctx.db.insert("exercises", {
      userId: identity.subject,
      name: normalizedName,
      createdAt: Date.now(),
    });

    return exerciseId;
  },
});

// List all exercises for the current user
export const listExercises = query({
  args: {
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let exercises;

    if (args.includeDeleted) {
      // Include all exercises (active + deleted)
      exercises = await ctx.db
        .query("exercises")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();
    } else {
      // Active exercises only (default)
      exercises = await ctx.db
        .query("exercises")
        .withIndex("by_user_deleted", (q) =>
          q.eq("userId", identity.subject).eq("deletedAt", undefined)
        )
        .collect();
      // Sort by createdAt descending (newest first)
      // Note: Cannot use .order("desc") on compound index as it sorts by index fields
      exercises.sort((a, b) => b.createdAt - a.createdAt);
    }

    return exercises;
  },
});

// Update an exercise
export const updateExercise = mutation({
  args: {
    id: v.id("exercises"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Validate and normalize exercise name
    const normalizedName = validateExerciseName(args.name);

    // Verify exercise exists and user owns it
    const exercise = await ctx.db.get(args.id);
    if (!exercise) {
      throw new Error("Exercise not found");
    }
    requireOwnership(exercise, identity.subject, "exercise");

    // Prevent editing deleted exercises
    if (exercise.deletedAt !== undefined) {
      throw new Error("Cannot update a deleted exercise");
    }

    // Check for duplicate (excluding current exercise)
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", identity.subject).eq("name", normalizedName)
      )
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("Exercise with this name already exists");
    }

    await ctx.db.patch(args.id, {
      name: normalizedName,
    });
  },
});

/**
 * Delete an exercise (soft delete)
 *
 * IMPORTANT: Always use this mutation instead of ctx.db.delete() to maintain
 * referential integrity. Hard deleting exercises orphans all associated sets,
 * causing "Unknown exercise" to appear in history. Soft delete preserves
 * exercise records for historical context while hiding them from active use.
 *
 * See also: createExercise (auto-restore logic), restoreExercise (explicit restore)
 */
export const deleteExercise = mutation({
  args: {
    id: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const exercise = await ctx.db.get(args.id);
    requireOwnership(exercise, identity.subject, "exercise");

    // Soft delete: Set deletedAt timestamp instead of removing record
    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
    });
  },
});

// Restore a soft-deleted exercise
export const restoreExercise = mutation({
  args: {
    id: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const exercise = await ctx.db.get(args.id);
    requireOwnership(exercise, identity.subject, "exercise");

    if (!exercise) {
      throw new Error("Exercise not found");
    }

    // Only restore if actually deleted
    if (exercise.deletedAt === undefined) {
      throw new Error("Exercise is not deleted");
    }

    // Clear deletedAt timestamp
    await ctx.db.patch(args.id, {
      deletedAt: undefined,
    });
  },
});
