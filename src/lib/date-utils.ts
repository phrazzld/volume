import { startOfDay, endOfDay } from "date-fns";

/**
 * Get the start and end timestamps for today in the user's local timezone.
 *
 * "Today" is defined as midnight-to-midnight in the user's current timezone,
 * determined by the browser's Intl.DateTimeFormat API. This handles:
 * - Users in different timezones
 * - DST transitions (date-fns handles automatically)
 * - Users traveling across timezones (uses current device timezone)
 *
 * @returns Object with start (midnight) and end (23:59:59.999) timestamps in milliseconds
 *
 * @example
 * const { start, end } = getTodayRange();
 * const todaysSets = sets.filter(s => s.performedAt >= start && s.performedAt <= end);
 */
export function getTodayRange(): { start: number; end: number } {
  const now = new Date();

  return {
    start: startOfDay(now).getTime(),
    end: endOfDay(now).getTime(),
  };
}

/**
 * Format timestamp as time only (12-hour format with am/pm)
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "2:30 PM")
 *
 * @example
 * formatTime(1697734800000) // => "2:30 PM"
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format timestamp as date + time (12-hour format)
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date/time string (e.g., "Oct 19, 2:30 PM")
 *
 * @example
 * formatDateTime(1697734800000) // => "Oct 19, 2:30 PM"
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format timestamp intelligently:
 * - Today's timestamps: show time only ("2:30 PM")
 * - Older timestamps: show date + time ("Oct 19, 2:30 PM")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string appropriate for recency
 *
 * @example
 * formatTimestamp(todayTimestamp) // => "2:30 PM"
 * formatTimestamp(yesterdayTimestamp) // => "Oct 19, 2:30 PM"
 */
export function formatTimestamp(timestamp: number): string {
  const { start, end } = getTodayRange();
  const isToday = timestamp >= start && timestamp <= end;

  return isToday ? formatTime(timestamp) : formatDateTime(timestamp);
}
