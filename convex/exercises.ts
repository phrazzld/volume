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

    // Check for duplicate (case-insensitive)
    const existing = await ctx.db
      .query("exercises")
      .withIndex("by_user_name", (q) =>
        q.eq("userId", identity.subject).eq("name", normalizedName)
      )
      .first();

    if (existing) {
      throw new Error("Exercise with this name already exists");
    }

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
    requireOwnership(exercise, identity.subject, "exercise");

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

// Delete an exercise
export const deleteExercise = mutation({
  args: {
    id: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const exercise = await ctx.db.get(args.id);
    requireOwnership(exercise, identity.subject, "exercise");

    await ctx.db.delete(args.id);
  },
});
