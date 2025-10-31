/**
 * AI Report Generation and Retrieval
 *
 * Orchestrates the creation of AI-generated weekly workout reports by:
 * 1. Fetching analytics metrics for a given time period
 * 2. Formatting metrics into an AI prompt
 * 3. Calling OpenAI for analysis
 * 4. Storing the report in the database
 *
 * @module ai/reports
 */

import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { generateAnalysis } from "./openai";
import type { AnalyticsMetrics } from "./prompts";

/**
 * Calculate Monday 00:00 UTC for a given date
 *
 * @param date - Date to get week start for (defaults to now)
 * @returns Unix timestamp (ms) for Monday 00:00 UTC of that week
 */
function getWeekStartDate(date: Date = new Date()): number {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const dayOfWeek = d.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1, Sunday = 0
  d.setUTCDate(d.getUTCDate() + diff);
  return d.getTime();
}

/**
 * Generate AI workout analysis report
 *
 * Internal mutation (not exposed to client) that orchestrates the full report
 * generation workflow. Fetches analytics data, calls OpenAI, stores result.
 *
 * **Deduplication**: If a report already exists for the given week, returns
 * existing reportId instead of generating a new one.
 *
 * **Week Calculation**: weekStartDate is Monday 00:00 UTC. If not provided,
 * defaults to current week.
 *
 * @param userId - User to generate report for
 * @param weekStartDate - Optional Unix timestamp for week start (Monday 00:00 UTC)
 * @returns Report ID of newly generated or existing report
 *
 * @example
 * ```typescript
 * // Generate report for current week
 * const reportId = await ctx.runMutation(internal.ai.reports.generateReport, {
 *   userId: "user_123"
 * });
 *
 * // Generate report for specific week
 * const reportId = await ctx.runMutation(internal.ai.reports.generateReport, {
 *   userId: "user_123",
 *   weekStartDate: 1704067200000 // Jan 1, 2024 (Monday)
 * });
 * ```
 */
export const generateReport = internalMutation({
  args: {
    userId: v.string(),
    weekStartDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    const weekStartDate = args.weekStartDate ?? getWeekStartDate();

    console.log(
      `[AI Reports] Generating report for user ${userId}, week ${new Date(weekStartDate).toISOString()}`
    );

    // Check for existing report (deduplication)
    const existingReport = await ctx.db
      .query("aiReports")
      .withIndex("by_user_week", (q) =>
        q.eq("userId", userId).eq("weekStartDate", weekStartDate)
      )
      .first();

    if (existingReport) {
      console.log(
        `[AI Reports] Report already exists for this week: ${existingReport._id}`
      );
      return existingReport._id;
    }

    // Calculate date range for metrics (7 days ending on Sunday of week)
    const weekEndDate = weekStartDate + 7 * 24 * 60 * 60 * 1000;

    // Fetch analytics metrics for the week
    // Note: These queries don't take userId as they use auth context
    // For internal mutations, we need to fetch data directly with userId
    const [volumeData, recentPRs, allSets] = await Promise.all([
      // Volume by exercise
      ctx.db
        .query("sets")
        .withIndex("by_user_performed", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.gte(q.field("performedAt"), weekStartDate),
            q.lt(q.field("performedAt"), weekEndDate)
          )
        )
        .collect(),

      // Recent PRs (last 7 days)
      ctx.db
        .query("sets")
        .withIndex("by_user_performed", (q) => q.eq("userId", userId))
        .filter((q) => q.gte(q.field("performedAt"), weekStartDate))
        .collect(),

      // All sets for streak calculation
      ctx.db
        .query("sets")
        .withIndex("by_user_performed", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    // Get exercises for name lookup
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const exerciseMap = new Map(exercises.map((ex) => [ex._id, ex.name]));

    // Aggregate volume by exercise
    const volumeByExercise = new Map<
      string,
      { exerciseName: string; totalVolume: number; sets: number }
    >();

    for (const set of volumeData) {
      const exerciseName = exerciseMap.get(set.exerciseId);
      if (!exerciseName) continue;

      const current = volumeByExercise.get(set.exerciseId) || {
        exerciseName,
        totalVolume: 0,
        sets: 0,
      };

      const volume = set.reps * (set.weight || 0);
      volumeByExercise.set(set.exerciseId, {
        exerciseName: current.exerciseName,
        totalVolume: current.totalVolume + volume,
        sets: current.sets + 1,
      });
    }

    const volume = Array.from(volumeByExercise.values())
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .map((v) => ({
        exerciseName: v.exerciseName,
        totalVolume: v.totalVolume,
        sets: v.sets,
      }));

    // Calculate PRs (simplified - just count new PRs this week)
    const prs = recentPRs
      .filter((set) => set.performedAt >= weekStartDate)
      .slice(0, 5)
      .map((set) => ({
        exerciseName: exerciseMap.get(set.exerciseId) || "Unknown",
        prType: "weight" as const,
        improvement: set.weight || 0,
        performedAt: set.performedAt,
      }));

    // Calculate streak stats
    const workoutDays = new Set(
      allSets.map((s) => new Date(s.performedAt).toISOString().split("T")[0])
    );
    const currentStreak = calculateCurrentStreak(allSets);
    const longestStreak = calculateLongestStreak(allSets);

    // Calculate frequency metrics
    const workoutDaysInWeek = new Set(
      volumeData.map((s) => new Date(s.performedAt).toISOString().split("T")[0])
    ).size;
    const restDays = 7 - workoutDaysInWeek;
    const avgSetsPerDay =
      workoutDaysInWeek > 0 ? volumeData.length / workoutDaysInWeek : 0;

    // Build metrics object
    const metrics: AnalyticsMetrics = {
      volume,
      prs,
      streak: {
        currentStreak,
        longestStreak,
        totalWorkouts: workoutDays.size,
      },
      frequency: {
        workoutDays: workoutDaysInWeek,
        restDays,
        avgSetsPerDay,
      },
      weekStartDate,
    };

    console.log(
      `[AI Reports] Metrics collected: ${volume.length} exercises, ${prs.length} PRs`
    );

    // Generate AI analysis
    const analysis = await generateAnalysis(metrics);

    console.log(
      `[AI Reports] AI analysis generated: ${analysis.content.length} chars, $${analysis.tokenUsage.costUSD}`
    );

    // Store report in database
    const reportId = await ctx.db.insert("aiReports", {
      userId,
      weekStartDate,
      generatedAt: Date.now(),
      content: analysis.content,
      metricsSnapshot: {
        volume: metrics.volume,
        prs: metrics.prs.map((pr) => ({
          exerciseName: pr.exerciseName,
          prType: pr.prType,
          improvement: pr.improvement,
        })),
        streak: metrics.streak,
        frequency: metrics.frequency,
      },
      model: analysis.model,
      tokenUsage: {
        input: analysis.tokenUsage.input,
        output: analysis.tokenUsage.output,
        costUSD: analysis.tokenUsage.costUSD,
      },
    });

    console.log(`[AI Reports] Report saved: ${reportId}`);

    return reportId;
  },
});

/**
 * Calculate current workout streak
 *
 * @param sets - All user sets sorted by performedAt
 * @returns Number of consecutive days with workouts (including today if active)
 */
function calculateCurrentStreak(sets: Array<{ performedAt: number }>): number {
  if (sets.length === 0) return 0;

  const workoutDays = Array.from(
    new Set(
      sets.map((s) => new Date(s.performedAt).toISOString().split("T")[0])
    )
  ).sort();

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Check if streak is active (today or yesterday)
  const lastWorkout = workoutDays[workoutDays.length - 1];
  if (lastWorkout !== today && lastWorkout !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = workoutDays.length - 2; i >= 0; i--) {
    const current = new Date(workoutDays[i]);
    const next = new Date(workoutDays[i + 1]);
    const diffDays = Math.floor(
      (next.getTime() - current.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak in history
 *
 * @param sets - All user sets
 * @returns Maximum consecutive days with workouts ever achieved
 */
function calculateLongestStreak(sets: Array<{ performedAt: number }>): number {
  if (sets.length === 0) return 0;

  const workoutDays = Array.from(
    new Set(
      sets.map((s) => new Date(s.performedAt).toISOString().split("T")[0])
    )
  ).sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < workoutDays.length; i++) {
    const prev = new Date(workoutDays[i - 1]);
    const curr = new Date(workoutDays[i]);
    const diffDays = Math.floor(
      (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
