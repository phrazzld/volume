/**
 * OpenAI Integration Module
 *
 * Handles API communication with OpenAI for generating workout analysis.
 * Includes retry logic, error handling, token tracking, and cost calculation.
 *
 * @module ai/openai
 */

import OpenAI from "openai";
import { systemPrompt, formatMetricsPrompt } from "./prompts";
import type { AnalyticsMetrics } from "./prompts";

/**
 * OpenAI API configuration
 */
const CONFIG = {
  model: "gpt-4o-mini" as const,
  temperature: 0.7, // Creative but consistent
  maxTokens: 1000, // Cap output at ~800 words
  timeout: 30000, // 30 seconds
  maxRetries: 3,
} as const;

/**
 * Pricing per 1M tokens (as of 2024)
 * Source: https://openai.com/api/pricing/
 */
const PRICING = {
  inputPerMillion: 0.15, // $0.15 per 1M input tokens
  outputPerMillion: 0.6, // $0.60 per 1M output tokens
} as const;

/**
 * Token usage and cost information
 */
export interface TokenUsage {
  input: number;
  output: number;
  costUSD: number;
}

/**
 * Analysis result from OpenAI
 */
export interface AnalysisResult {
  content: string;
  tokenUsage: TokenUsage;
  model: string;
}

/**
 * Calculate cost in USD from token usage
 *
 * @param inputTokens - Number of input tokens consumed
 * @param outputTokens - Number of output tokens generated
 * @returns Cost in USD (to 4 decimal places)
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens * PRICING.inputPerMillion) / 1_000_000;
  const outputCost = (outputTokens * PRICING.outputPerMillion) / 1_000_000;
  return Number((inputCost + outputCost).toFixed(4));
}

/**
 * Sleep for exponential backoff retry logic
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @returns Promise that resolves after delay
 */
function sleep(attempt: number): Promise<void> {
  const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Generate workout analysis using OpenAI
 *
 * Sends analytics metrics to GPT-4o-mini for technical analysis and insights.
 * Includes automatic retry with exponential backoff for transient failures.
 *
 * @param metrics - Structured workout analytics data
 * @returns Analysis content, token usage, and cost information
 * @throws Error if API call fails after all retries
 *
 * @example
 * ```typescript
 * const metrics = {
 *   volume: [...],
 *   prs: [...],
 *   streak: {...},
 *   frequency: {...}
 * };
 * const result = await generateAnalysis(metrics);
 * console.log(result.content); // Markdown-formatted analysis
 * console.log(result.tokenUsage.costUSD); // e.g., 0.0023
 * ```
 */
export async function generateAnalysis(
  metrics: AnalyticsMetrics
): Promise<AnalysisResult> {
  // Initialize OpenAI client
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable not set. Add it to Convex environment variables."
    );
  }

  const openai = new OpenAI({
    apiKey,
    timeout: CONFIG.timeout,
  });

  // Format metrics into prompt
  const userPrompt = formatMetricsPrompt(metrics);

  // Retry loop with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
    try {
      console.log(
        `[OpenAI] Generating analysis (attempt ${attempt + 1}/${CONFIG.maxRetries})...`
      );

      const completion = await openai.chat.completions.create({
        model: CONFIG.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: CONFIG.temperature,
        max_tokens: CONFIG.maxTokens,
      });

      // Extract response content
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned empty response");
      }

      // Extract token usage
      const usage = completion.usage;
      if (!usage) {
        throw new Error("OpenAI did not return token usage information");
      }

      const tokenUsage: TokenUsage = {
        input: usage.prompt_tokens,
        output: usage.completion_tokens,
        costUSD: calculateCost(usage.prompt_tokens, usage.completion_tokens),
      };

      console.log(
        `[OpenAI] Success! Tokens: ${tokenUsage.input} in, ${tokenUsage.output} out, Cost: $${tokenUsage.costUSD}`
      );

      return {
        content: content.trim(),
        tokenUsage,
        model: CONFIG.model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log error details
      console.error(
        `[OpenAI] Attempt ${attempt + 1} failed:`,
        lastError.message
      );

      // Don't retry on certain error types
      if (
        lastError.message.includes("API key") ||
        lastError.message.includes("invalid_request")
      ) {
        console.error("[OpenAI] Non-retriable error detected, aborting");
        throw lastError;
      }

      // Sleep before retry (except on last attempt)
      if (attempt < CONFIG.maxRetries - 1) {
        await sleep(attempt);
      }
    }
  }

  // All retries exhausted
  console.error(`[OpenAI] All ${CONFIG.maxRetries} attempts failed`);
  throw new Error(
    `Failed to generate analysis after ${CONFIG.maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Check if OpenAI API is configured and accessible
 *
 * Useful for health checks and configuration validation.
 *
 * @returns True if API key is set, false otherwise
 */
export function isConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get current pricing configuration
 *
 * Useful for displaying cost estimates to users or admins.
 *
 * @returns Pricing structure in dollars per 1M tokens
 */
export function getPricing() {
  return PRICING;
}
