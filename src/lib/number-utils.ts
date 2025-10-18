/**
 * Number formatting utilities for display
 */

/**
 * Format large numbers with K/M suffix for readability
 *
 * Examples:
 * - 450 → "450"
 * - 1,200 → "1.2K"
 * - 12,450 → "12.5K"
 * - 1,234,567 → "1.2M"
 *
 * @param num - Number to format
 * @returns Formatted string with K/M suffix if applicable
 */
export function formatNumber(num: number): string {
  // Handle edge cases
  if (num === 0) return "0";
  if (!isFinite(num)) return "—";

  const absNum = Math.abs(num);

  // Millions (≥1,000,000)
  if (absNum >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }

  // Thousands (≥10,000)
  // Only round to K for numbers ≥10K to avoid "1.2K" looking weird for small numbers
  if (absNum >= 10_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }

  // Small numbers: Use locale string with commas
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}
