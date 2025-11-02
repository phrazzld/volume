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
import { internalMutation, query, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
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
 * Calculate date range based on report type
 *
 * @param reportType - Type of report (daily/weekly/monthly)
 * @param customStart - Optional custom start timestamp (for weekly reports)
 * @returns Object with startDate and endDate timestamps
 */
function calculateDateRange(
  reportType: "daily" | "weekly" | "monthly",
  customStart?: number
): { startDate: number; endDate: number } {
  const now = new Date();
  let startDate: number;
  const endDate = now.getTime();

  switch (reportType) {
    case "daily":
      // Last 24 hours
      startDate = endDate - 24 * 60 * 60 * 1000;
      break;
    case "weekly":
      // Last 7 days (or custom start for Monday-based weeks)
      if (customStart) {
        startDate = customStart;
      } else {
        startDate = endDate - 7 * 24 * 60 * 60 * 1000;
      }
      break;
    case "monthly":
      // Last calendar month (1st to last day of previous month)
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);
      startDate = lastMonth.getTime();

      // End date is last day of that month
      const lastDayOfMonth = new Date(
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1,
        0
      );
      lastDayOfMonth.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastDayOfMonth.getTime() };
  }

  return { startDate, endDate };
}

/**
 * Generate AI workout analysis report
 *
 * Internal mutation (not exposed to client) that orchestrates the full report
 * generation workflow. Fetches analytics data, calls OpenAI, stores result.
 *
 * **Deduplication**: If a report already exists for the given period and type,
 * returns existing reportId instead of generating a new one.
 *
 * **Report Types**:
 * - daily: Last 24 hours
 * - weekly: Last 7 days (or custom weekStartDate for Monday-based weeks)
 * - monthly: Previous calendar month
 *
 * **Week Calculation**: weekStartDate is Monday 00:00 UTC. If not provided,
 * defaults to current week.
 *
 * @param userId - User to generate report for
 * @param reportType - Type of report (defaults to "weekly")
 * @param weekStartDate - Optional Unix timestamp for week start (Monday 00:00 UTC)
 * @returns Report ID of newly generated or existing report
 *
 * @example
 * ```typescript
 * // Generate weekly report for current week
 * const reportId = await ctx.runMutation(internal.ai.reports.generateReport, {
 *   userId: "user_123"
 * });
 *
 * // Generate daily report
 * const reportId = await ctx.runMutation(internal.ai.reports.generateReport, {
 *   userId: "user_123",
 *   reportType: "daily"
 * });
 *
 * // Generate monthly report
 * const reportId = await ctx.runMutation(internal.ai.reports.generateReport, {
 *   userId: "user_123",
 *   reportType: "monthly"
 * });
 * ```
 */
export const generateReport = internalMutation({
  args: {
    userId: v.string(),
    reportType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    weekStartDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    const reportType = args.reportType || "weekly";
    const weekStartDate = args.weekStartDate ?? getWeekStartDate();

    console.log(
      `[AI Reports] Generating ${reportType} report for user ${userId}, week ${new Date(weekStartDate).toISOString()}`
    );

    // Check for existing report (deduplication)
    const existingReport = await ctx.db
      .query("aiReports")
      .withIndex("by_user_type_date", (q) =>
        q
          .eq("userId", userId)
          .eq("reportType", reportType)
          .eq("weekStartDate", weekStartDate)
      )
      .first();

    if (existingReport) {
      console.log(
        `[AI Reports] ${reportType} report already exists for this period: ${existingReport._id}`
      );
      return existingReport._id;
    }

    // Calculate date range based on report type
    const { startDate, endDate } = calculateDateRange(
      reportType,
      weekStartDate
    );

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
            q.gte(q.field("performedAt"), startDate),
            q.lt(q.field("performedAt"), endDate)
          )
        )
        .collect(),

      // Recent PRs (for the report period)
      ctx.db
        .query("sets")
        .withIndex("by_user_performed", (q) => q.eq("userId", userId))
        .filter((q) => q.gte(q.field("performedAt"), startDate))
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
      reportType,
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

/**
 * Get latest AI report for authenticated user
 *
 * Returns the most recently generated report, or null if no reports exist.
 * Automatically filters by authenticated user. Optionally filter by report type.
 *
 * @param reportType - Optional filter for specific report type (daily/weekly/monthly)
 * @returns Most recent report (optionally filtered by type) or null
 *
 * @example
 * ```typescript
 * // Get latest report of any type
 * const latestReport = useQuery(api.ai.reports.getLatestReport, {});
 *
 * // Get latest weekly report specifically
 * const weeklyReport = useQuery(api.ai.reports.getLatestReport, {
 *   reportType: "weekly"
 * });
 *
 * // Get latest daily report
 * const dailyReport = useQuery(api.ai.reports.getLatestReport, {
 *   reportType: "daily"
 * });
 * ```
 */
export const getLatestReport = query({
  args: {
    reportType: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const query = ctx.db
      .query("aiReports")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc");

    const reports = await query.collect();

    // Filter by report type if specified
    if (args.reportType) {
      const filtered = reports.filter((r) => r.reportType === args.reportType);
      return filtered[0] || null;
    }

    return reports[0] || null;
  },
});

/**
 * Get report history for authenticated user
 *
 * Returns paginated list of reports sorted by generation date (newest first).
 * Includes full metricsSnapshot for transparency about what data was analyzed.
 *
 * @param limit - Maximum number of reports to return (default: 10)
 * @returns Array of reports sorted by generatedAt descending
 *
 * @example
 * ```typescript
 * // Get last 10 reports
 * const reports = useQuery(api.ai.reports.getReportHistory, {});
 *
 * // Get last 5 reports
 * const recentReports = useQuery(api.ai.reports.getReportHistory, {
 *   limit: 5
 * });
 * ```
 */
export const getReportHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const limit = args.limit ?? 10;

    const reports = await ctx.db
      .query("aiReports")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);

    return reports;
  },
});

/**
 * Get start of current day in UTC
 *
 * @returns Unix timestamp (ms) for 00:00:00 UTC today
 */
function getStartOfDayUTC(): number {
  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  return startOfDay.getTime();
}

/**
 * Generate AI report on-demand (user-triggered)
 *
 * User-facing mutation that generates a new AI workout analysis report.
 * Includes rate limiting to prevent abuse and manage API costs.
 *
 * **Rate Limiting**: 5 reports per user per day
 * - Counter resets at midnight UTC
 * - Prevents excessive API costs
 * - Clear error messages when limit reached
 *
 * **Process**:
 * 1. Verify user is authenticated
 * 2. Check daily generation count (last 24 hours)
 * 3. If under limit, call internal generateReport
 * 4. Return reportId or error
 *
 * @returns Report ID of generated report
 * @throws Error if daily limit exceeded or generation fails
 *
 * @example
 * ```typescript
 * const generateReport = useMutation(api.ai.reports.generateOnDemandReport);
 *
 * try {
 *   const reportId = await generateReport();
 *   // Report generated successfully
 * } catch (error) {
 *   // Handle error (e.g., "Daily limit reached (5/5)")
 * }
 * ```
 */
export const generateOnDemandReport = mutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to generate reports");
    }

    const userId = identity.subject;

    // Calculate start of current UTC day for rate limiting
    const startOfToday = getStartOfDayUTC();

    // Count reports generated today
    const reportsToday = await ctx.db
      .query("aiReports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("generatedAt"), startOfToday))
      .collect();

    // Rate limit: 5 reports per day
    const DAILY_LIMIT = 5;
    if (reportsToday.length >= DAILY_LIMIT) {
      throw new Error(
        `Daily limit reached (${reportsToday.length}/${DAILY_LIMIT}). Try again tomorrow.`
      );
    }

    console.log(
      `[On-Demand] User ${userId} generating report (${reportsToday.length + 1}/${DAILY_LIMIT} today)`
    );

    // Generate report via internal mutation
    try {
      const reportId = await ctx.runMutation(
        (internal as any).ai.reports.generateReport,
        {
          userId,
        }
      );

      console.log(`[On-Demand] Report generated: ${reportId}`);

      return reportId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[On-Demand] Failed to generate report:`, errorMessage);
      throw new Error(`Failed to generate report: ${errorMessage}`);
    }
  },
});
