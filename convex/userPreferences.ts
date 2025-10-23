import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/validate";

/**
 * Get user preferences, defaulting to "lbs" if not found.
 */
export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return default for unauthenticated users
      return { weightUnit: "lbs" as const };
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!existing) {
      // Return default for new users
      return { weightUnit: "lbs" as const };
    }

    return {
      weightUnit: existing.weightUnit,
    };
  },
});

/**
 * Update user preferences (upsert).
 * Creates new record if none exists, updates existing otherwise.
 */
export const updatePreferences = mutation({
  args: {
    weightUnit: v.union(v.literal("lbs"), v.literal("kg")),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Validate unit (redundant with args validation but defensive)
    if (args.weightUnit !== "lbs" && args.weightUnit !== "kg") {
      throw new Error("Weight unit must be 'lbs' or 'kg'");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing preference
      await ctx.db.patch(existing._id, {
        weightUnit: args.weightUnit,
        updatedAt: now,
      });
    } else {
      // Create new preference record
      await ctx.db.insert("userPreferences", {
        userId: identity.subject,
        weightUnit: args.weightUnit,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { weightUnit: args.weightUnit };
  },
});
