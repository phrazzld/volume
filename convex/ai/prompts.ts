/**
 * AI Prompt Templates for Workout Analysis
 *
 * This module handles prompt engineering for generating technical workout insights.
 * Prompts are versioned to enable A/B testing and quality improvements over time.
 *
 * @module ai/prompts
 */

/**
 * Current prompt version for tracking and A/B testing
 */
export const PROMPT_VERSION = "v1";

/**
 * System prompt defining AI role and behavior
 *
 * Role: Technical strength coach focused on data-driven analysis
 * Tone: Technical, actionable, evidence-based (not motivational fluff)
 * Output: 200-400 words of insights on trends, plateaus, recovery, optimization
 */
export const systemPrompt = `You are a technical strength coach analyzing workout data. Your role is to provide data-driven, actionable insights based on training metrics.

**Guidelines**:
- Focus on technical analysis: trends, plateaus, recovery patterns, optimization opportunities
- Be specific and evidence-based: cite actual numbers from the data
- Avoid generic motivation - users want technical insights, not cheerleading
- Identify: progressive overload signals, potential overtraining, recovery needs, volume distribution
- Suggest: programming adjustments, deload timing, exercise prioritization
- Keep analysis concise: 200-400 words maximum

**Output Structure**:
1. **Training Volume**: Assess overall volume and distribution across exercises
2. **Progress Indicators**: Highlight PRs and strength gains with context
3. **Recovery & Frequency**: Evaluate workout frequency and rest patterns
4. **Recommendations**: 2-3 specific, actionable adjustments

Use markdown formatting for readability. Be direct and technical.`;

/**
 * Metrics input for prompt generation
 */
export interface AnalyticsMetrics {
  volume: Array<{
    exerciseName: string;
    totalVolume: number;
    sets: number;
  }>;
  prs: Array<{
    exerciseName: string;
    prType: "weight" | "reps" | "volume";
    improvement: number;
    performedAt: number;
  }>;
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalWorkouts: number;
  };
  frequency: {
    workoutDays: number;
    restDays: number;
    avgSetsPerDay: number;
  };
  weekStartDate: number; // For week-over-week comparison (future enhancement)
}

/**
 * Format analytics metrics into a user prompt for AI analysis
 *
 * Converts structured workout data into a natural language prompt that provides
 * context for the AI to generate insights. Includes all relevant metrics in a
 * scannable format.
 *
 * @param metrics - Structured analytics data from the past week/period
 * @returns Formatted prompt string ready for AI consumption
 *
 * @example
 * ```typescript
 * const metrics = {
 *   volume: [{ exerciseName: "Bench Press", totalVolume: 4050, sets: 3 }],
 *   prs: [{ exerciseName: "Bench Press", prType: "weight", improvement: 10 }],
 *   streak: { currentStreak: 7, longestStreak: 30, totalWorkouts: 156 },
 *   frequency: { workoutDays: 5, restDays: 2, avgSetsPerDay: 12 }
 * };
 * const prompt = formatMetricsPrompt(metrics);
 * ```
 */
export function formatMetricsPrompt(metrics: AnalyticsMetrics): string {
  const { volume, prs, streak, frequency } = metrics;

  // Format volume data
  const volumeSection =
    volume.length > 0
      ? volume
          .slice(0, 10) // Top 10 exercises
          .map(
            (v) =>
              `- **${v.exerciseName}**: ${v.totalVolume.toLocaleString()} lbs total volume (${v.sets} sets)`
          )
          .join("\n")
      : "- No volume data recorded this period";

  // Format PRs
  const prsSection =
    prs.length > 0
      ? prs
          .slice(0, 5) // Top 5 recent PRs
          .map((pr) => {
            const date = new Date(pr.performedAt).toLocaleDateString();
            return `- **${pr.exerciseName}**: ${pr.prType.toUpperCase()} PR (+${pr.improvement}) on ${date}`;
          })
          .join("\n")
      : "- No personal records achieved this period";

  // Calculate workout consistency percentage
  const totalDays = frequency.workoutDays + frequency.restDays;
  const consistencyPct =
    totalDays > 0 ? ((frequency.workoutDays / totalDays) * 100).toFixed(0) : 0;

  return `Analyze this week's training data:

## Training Volume
${volumeSection}

**Total exercises tracked**: ${volume.length}

## Personal Records
${prsSection}

## Workout Frequency
- **Days trained**: ${frequency.workoutDays}
- **Rest days**: ${frequency.restDays}
- **Average sets per workout**: ${frequency.avgSetsPerDay.toFixed(1)}
- **Consistency**: ${consistencyPct}% of days with training

## Streak Status
- **Current streak**: ${streak.currentStreak} days
- **Longest streak**: ${streak.longestStreak} days
- **Total workouts**: ${streak.totalWorkouts} sessions

---

Provide technical analysis covering:
1. Volume distribution and exercise prioritization
2. Progress indicators (PRs, trends)
3. Recovery and frequency assessment
4. 2-3 specific, actionable recommendations for next week

Focus on data-driven insights, not generic motivation.`;
}

/**
 * Few-shot example of desired output quality
 *
 * These examples demonstrate the technical, actionable tone we want from the AI.
 * Not included in production prompts, but useful for testing and quality validation.
 */
export const exampleOutputs = {
  goodExample: `## Training Volume Analysis
Your volume is heavily concentrated in upper body (Bench Press: 4,050 lbs, Overhead Press: 2,100 lbs) with minimal lower body work. This 2:1 upper-to-lower ratio suggests potential imbalance.

## Progress Indicators
Strong weight PR on Bench Press (+10 lbs) indicates progressive overload is working. However, the 7-day gap between your last Squat session and recent PR suggests inconsistent lower body frequency.

## Recovery & Frequency
5 training days with 2 rest days shows good consistency (71%). Average of 12 sets per session is sustainable for most intermediate lifters. Current 7-day streak matches your training frequency well.

## Recommendations
1. **Rebalance volume**: Add 1-2 lower body sessions to match upper body frequency
2. **Maintain current recovery**: 2 rest days per week is appropriate for your volume
3. **Progressive overload**: Continue current progression on Bench - it's working`,

  poorExample: `Great job this week! 🎉 You're crushing it with those PRs! Keep up the amazing work and stay motivated! Your dedication is inspiring. Remember, consistency is key! You've got this! 💪

Looking at your numbers, everything looks good! Just keep doing what you're doing and you'll see results. Stay strong and keep pushing! 🔥`,
};

/**
 * Estimate token count for metrics prompt
 *
 * Rough estimate for cost calculation and rate limiting.
 * Actual tokens will vary based on tiktoken encoding.
 *
 * @param metrics - Metrics to estimate tokens for
 * @returns Approximate input token count (~400 typical)
 */
export function estimateTokenCount(metrics: AnalyticsMetrics): number {
  const prompt = formatMetricsPrompt(metrics);
  // Rough estimate: 1 token ≈ 4 characters
  // System prompt is ~250 tokens, user prompt varies
  const systemTokens = 250;
  const userTokens = Math.ceil(prompt.length / 4);
  return systemTokens + userTokens;
}
