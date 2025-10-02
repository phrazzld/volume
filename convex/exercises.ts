import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new exercise
export const createExercise = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Basic validation
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Exercise name is required");
    }

    const exerciseId = await ctx.db.insert("exercises", {
      userId: identity.subject,
      name: args.name.trim(),
      createdAt: Date.now(),
    });

    return exerciseId;
  },
});

// List all exercises for the current user
export const listExercises = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return exercises;
  },
});

// Delete an exercise
export const deleteExercise = mutation({
  args: {
    id: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const exercise = await ctx.db.get(args.id);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    // Verify ownership
    if (exercise.userId !== identity.subject) {
      throw new Error("Not authorized to delete this exercise");
    }

    await ctx.db.delete(args.id);
  },
});
