import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log a new set
export const logSet = mutation({
  args: {
    exerciseId: v.id("exercises"),
    reps: v.number(),
    weight: v.optional(v.number()),
    unit: v.optional(v.string()), // "lbs" or "kg" - required when weight is provided
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate reps
    if (args.reps <= 0) {
      throw new Error("Reps must be greater than 0");
    }

    // Validate unit is provided when weight is provided
    if (args.weight !== undefined && !args.unit) {
      throw new Error("Unit is required when weight is provided");
    }

    // Verify exercise exists and belongs to user
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }
    if (exercise.userId !== identity.subject) {
      throw new Error("Not authorized to log sets for this exercise");
    }

    const setId = await ctx.db.insert("sets", {
      userId: identity.subject,
      exerciseId: args.exerciseId,
      reps: args.reps,
      weight: args.weight,
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

// Delete a set
export const deleteSet = mutation({
  args: {
    id: v.id("sets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const set = await ctx.db.get(args.id);
    if (!set) {
      throw new Error("Set not found");
    }

    // Verify ownership
    if (set.userId !== identity.subject) {
      throw new Error("Not authorized to delete this set");
    }

    await ctx.db.delete(args.id);
  },
});
