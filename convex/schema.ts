import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  exercises: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
    /**
     * Soft delete timestamp (Unix ms). When set, exercise is "deleted" but preserved
     * for history display. Use deleteExercise mutation (not ctx.db.delete) to maintain
     * data integrity. See convex/exercises.ts for auto-restore logic.
     */
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"])
    // Index for efficient active-only queries (deletedAt === undefined)
    .index("by_user_deleted", ["userId", "deletedAt"]),

  sets: defineTable({
    userId: v.string(),
    exerciseId: v.id("exercises"),
    reps: v.number(),
    weight: v.optional(v.number()),
    unit: v.optional(v.string()), // "lbs" or "kg" - stored with each set for data integrity
    performedAt: v.number(), // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_exercise", ["exerciseId", "performedAt"])
    .index("by_user_performed", ["userId", "performedAt"]),

  aiReports: defineTable({
    userId: v.string(),
    weekStartDate: v.number(), // Unix timestamp for Monday 00:00
    generatedAt: v.number(), // Unix timestamp of generation
    content: v.string(), // Markdown-formatted AI response
    metricsSnapshot: v.object({
      volume: v.array(
        v.object({
          exerciseName: v.string(),
          totalVolume: v.number(),
          sets: v.number(),
        })
      ),
      prs: v.array(
        v.object({
          exerciseName: v.string(),
          prType: v.string(),
          improvement: v.number(),
        })
      ),
      streak: v.object({
        currentStreak: v.number(),
        longestStreak: v.number(),
        totalWorkouts: v.number(),
      }),
      frequency: v.object({
        workoutDays: v.number(),
        avgSetsPerDay: v.number(),
      }),
    }),
    model: v.string(), // e.g., "gpt-4o-mini"
    tokenUsage: v.object({
      input: v.number(),
      output: v.number(),
      costUSD: v.number(),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_user_week", ["userId", "weekStartDate"]),
});
