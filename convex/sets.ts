import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import {
  requireAuth,
  requireOwnership,
  validateReps,
  validateWeight,
  validateUnit,
} from "./lib/validate";

// Log a new set
export const logSet = mutation({
  args: {
    exerciseId: v.id("exercises"),
    reps: v.number(),
    weight: v.optional(v.number()),
    unit: v.optional(v.string()), // "lbs" or "kg" - required when weight is provided
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Validate inputs
    validateReps(args.reps);
    const weight = validateWeight(args.weight);
    validateUnit(args.unit, weight);

    // Verify exercise exists and belongs to user
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }
    requireOwnership(exercise, identity.subject, "exercise");

    // Block logging sets for soft-deleted exercises
    if (exercise.deletedAt !== undefined) {
      throw new Error("Cannot log sets for a deleted exercise");
    }

    const setId = await ctx.db.insert("sets", {
      userId: identity.subject,
      exerciseId: args.exerciseId,
      reps: args.reps,
      weight, // Use validated/rounded weight
      unit: args.unit, // Store the unit with the set for data integrity
      performedAt: Date.now(),
    });

    return setId;
  },
});

// List all sets, optionally filtered by exercise
export const listSets = query({
  args: {
    exerciseId: v.optional(v.id("exercises")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    let sets;

    if (args.exerciseId) {
      // Verify exercise ownership before querying sets (IDOR vulnerability fix)
      // This prevents users from accessing other users' sets by guessing exercise IDs
      const exercise = await ctx.db.get(args.exerciseId);
      requireOwnership(exercise, identity.subject, "exercise");

      // Filter by exercise
      sets = await ctx.db
        .query("sets")
        .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId!))
        .order("desc")
        .collect();
    } else {
      // Get all sets for user
      sets = await ctx.db
        .query("sets")
        .withIndex("by_user_performed", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();
    }

    return sets;
  },
});

// List all sets with pagination (for history page)
export const listSetsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("sets")
      .withIndex("by_user_performed", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Get a single set by ID
export const getSet = query({
  args: { id: v.id("sets") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const set = await ctx.db.get(args.id);

    if (!set) {
      throw new Error("Set not found");
    }

    if (set.userId !== identity.subject) {
      throw new Error("You do not own this set");
    }

    return set;
  },
});

// Delete a set
export const deleteSet = mutation({
  args: {
    id: v.id("sets"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const set = await ctx.db.get(args.id);
    requireOwnership(set, identity.subject, "set");

    await ctx.db.delete(args.id);
  },
});
