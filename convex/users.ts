import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create user record
 *
 * Creates a new user record if one doesn't exist for the authenticated Clerk user.
 * If user already exists, returns their user ID.
 *
 * @param timezone - Optional IANA timezone string (e.g., "America/New_York")
 * @returns User ID (_id from users table)
 */
export const getOrCreateUser = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existing) return existing._id;

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      timezone: args.timezone,
      dailyReportsEnabled: false, // Opt-in (future paywall)
      weeklyReportsEnabled: true, // Default on
      monthlyReportsEnabled: false, // Opt-in
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user timezone
 *
 * Updates the timezone for the authenticated user. If user doesn't exist,
 * creates a new user record with the provided timezone.
 *
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 */
export const updateUserTimezone = mutation({
  args: { timezone: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return; // Silent return for unauthenticated users (e.g., during auth loading)

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      // Create user if doesn't exist
      await ctx.db.insert("users", {
        clerkUserId: identity.subject,
        timezone: args.timezone,
        dailyReportsEnabled: false,
        weeklyReportsEnabled: true,
        monthlyReportsEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.patch(user._id, {
      timezone: args.timezone,
      updatedAt: Date.now(),
    });
  },
});
