import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  exercises: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  sets: defineTable({
    userId: v.string(),
    exerciseId: v.id("exercises"),
    reps: v.number(),
    weight: v.optional(v.number()),
    performedAt: v.number(), // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_exercise", ["exerciseId", "performedAt"])
    .index("by_user_performed", ["userId", "performedAt"]),
});
