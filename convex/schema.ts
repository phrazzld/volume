import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  exercises: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"])
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
});
