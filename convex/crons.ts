/**
 * Scheduled Tasks (Cron Jobs)
 *
 * Defines automated background jobs that run on a schedule.
 * Currently: Weekly AI report generation for active users.
 *
 * @module crons
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get active user IDs
 *
 * Returns list of user IDs who logged a workout in the last N days.
 * Used by cron job to identify eligible users for report generation.
 *
 * @param days - Number of days to look back (default: 14)
 * @returns Array of unique user IDs
 */
export const getActiveUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const recentSets = await ctx.db
      .query("sets")
      .withIndex("by_user_performed")
      .filter((q) => q.gte(q.field("performedAt"), fourteenDaysAgo))
      .collect();

    const activeUserIds = Array.from(
      new Set(recentSets.map((set) => set.userId))
    );

    return activeUserIds;
  },
});

/**
 * Weekly AI Report Generation Action
 *
 * Internal action that generates weekly workout analysis reports for
 * all active users (those who logged a workout in the last 14 days).
 *
 * **Process**:
 * 1. Query active users (workout in last 14 days)
 * 2. Generate report for each user via internal mutation
 * 3. Deduplication handled by generateReport (checks existing reports)
 * 4. Error logging for individual failures (doesn't crash batch)
 *
 * **Rate Limiting**: Max 100 users per run
 * - Prevents long-running jobs and API rate limits
 * - Typical runtime: ~5 min for 100 users (OpenAI latency ~3s/user)
 *
 * **Cost Management**:
 * - Only generates for active users (not entire user base)
 * - Deduplication prevents duplicate API calls
 * - ~$0.002 per report × active users
 */
export const generateWeeklyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Cron] Starting weekly AI report generation...");
    const startTime = Date.now();

    try {
      // Query active users (workout in last 14 days)
      const activeUserIds = await ctx.runQuery(
        (internal as any).crons.getActiveUserIds,
        {}
      );

      console.log(
        `[Cron] Found ${activeUserIds.length} active users (logged workout in last 14 days)`
      );

      // Rate limit: Max 100 users per run
      const MAX_USERS_PER_RUN = 100;
      const usersToProcess = activeUserIds.slice(0, MAX_USERS_PER_RUN);

      if (activeUserIds.length > MAX_USERS_PER_RUN) {
        console.warn(
          `[Cron] Rate limiting: Processing ${MAX_USERS_PER_RUN} of ${activeUserIds.length} active users`
        );
      }

      // Track results
      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ userId: string; error: string }> = [];

      // Generate reports for each active user
      for (const userId of usersToProcess) {
        try {
          console.log(`[Cron] Generating report for user: ${userId}`);

          await ctx.runMutation((internal as any).ai.reports.generateReport, {
            userId,
            // weekStartDate will default to current week in generateReport
          });

          successCount++;
          console.log(
            `[Cron] ✓ Report generated for ${userId} (${successCount}/${usersToProcess.length})`
          );
        } catch (error: unknown) {
          errorCount++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push({ userId, error: errorMessage });

          console.error(
            `[Cron] ✗ Failed to generate report for ${userId}: ${errorMessage}`
          );

          // Continue processing other users (don't crash entire batch)
          continue;
        }
      }

      // Summary
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Cron] Weekly report generation complete!`);
      console.log(`[Cron] Duration: ${duration}s`);
      console.log(`[Cron] Total active users: ${activeUserIds.length}`);
      console.log(`[Cron] Users processed: ${usersToProcess.length}`);
      console.log(`[Cron] Reports generated: ${successCount}`);
      console.log(`[Cron] Errors: ${errorCount}`);

      if (errors.length > 0) {
        console.error(`[Cron] Failed users:`, errors);
      }

      // Log final metrics for monitoring
      return {
        success: true,
        activeUsers: activeUserIds.length,
        processed: usersToProcess.length,
        succeeded: successCount,
        failed: errorCount,
        durationSeconds: Number(duration),
        errors: errors.slice(0, 10), // Log first 10 errors only
      };
    } catch (error: unknown) {
      // Fatal error (e.g., database unavailable)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[Cron] FATAL ERROR in weekly report generation:`,
        errorMessage
      );

      return {
        success: false,
        error: errorMessage,
        durationSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
      };
    }
  },
});

/**
 * Cron Schedule Configuration
 *
 * Runs every Sunday at 9 PM UTC to trigger weekly report generation.
 * - Sunday chosen as typical end-of-week reflection time
 * - 9 PM allows international users to see reports Monday morning
 */
const crons = cronJobs();

crons.weekly(
  "generate-weekly-reports",
  {
    hourUTC: 21, // 9 PM UTC
    minuteUTC: 0,
    dayOfWeek: "sunday",
  },
  (internal as any).crons.generateWeeklyReports
);

export default crons;
