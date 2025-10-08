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
