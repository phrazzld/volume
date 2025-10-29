import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Analytics queries for workout metrics
 *
 * These queries aggregate workout data to provide insights on volume,
 * frequency, streaks, and personal records.
 */

export interface VolumeByExercise {
  exerciseId: string;
  exerciseName: string;
  totalVolume: number;
  sets: number;
}

/**
 * Get total volume by exercise
 *
 * Calculates total volume (reps × weight) for each exercise within a date range.
 * Volume represents total work performed and is a key metric for tracking
 * progressive overload and training intensity.
 *
 * @param startDate - Optional Unix timestamp (ms) for range start
 * @param endDate - Optional Unix timestamp (ms) for range end
 * @returns Array of exercises with total volume and set count, sorted by volume descending
 *
 * @example
 * ```typescript
 * // Get all-time volume
 * const allTime = await ctx.query(api.analytics.getVolumeByExercise, {});
 *
 * // Get last 30 days
 * const last30Days = await ctx.query(api.analytics.getVolumeByExercise, {
 *   startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
 * });
 * ```
 */
export const getVolumeByExercise = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Query all user's sets using the by_user_performed index for efficient filtering
    let setsQuery = ctx.db
      .query("sets")
      .withIndex("by_user_performed", (q) => q.eq("userId", identity.subject));

    // Apply date range filters if provided
    if (args.startDate !== undefined) {
      setsQuery = setsQuery.filter((q) =>
        q.gte(q.field("performedAt"), args.startDate!)
      );
    }
    if (args.endDate !== undefined) {
      setsQuery = setsQuery.filter((q) =>
        q.lte(q.field("performedAt"), args.endDate!)
      );
    }

    const sets = await setsQuery.collect();

    // Fetch all exercises for the user (including deleted for history display)
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    // Create exercise lookup map
    const exerciseMap = new Map(
      exercises.map((ex) => [
        ex._id,
        { name: ex.name, deleted: ex.deletedAt !== undefined },
      ])
    );

    // Aggregate volume by exercise
    const volumeByExercise = new Map<
      string,
      { exerciseName: string; totalVolume: number; sets: number }
    >();

    for (const set of sets) {
      const exercise = exerciseMap.get(set.exerciseId);
      if (!exercise) continue; // Skip sets for non-existent exercises

      const exerciseId = set.exerciseId;
      const current = volumeByExercise.get(exerciseId) || {
        exerciseName: exercise.name,
        totalVolume: 0,
        sets: 0,
      };

      // Calculate volume: reps × weight (bodyweight exercises have weight=0 or undefined)
      const volume = set.reps * (set.weight || 0);

      volumeByExercise.set(exerciseId, {
        exerciseName: current.exerciseName,
        totalVolume: current.totalVolume + volume,
        sets: current.sets + 1,
      });
    }

    // Convert to array and sort by total volume descending
    const result: VolumeByExercise[] = Array.from(
      volumeByExercise.entries()
    ).map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.exerciseName,
      totalVolume: data.totalVolume,
      sets: data.sets,
    }));

    result.sort((a, b) => b.totalVolume - a.totalVolume);

    return result;
  },
});
