import type { Set } from "@/types/domain";

/**
 * Group sets by day (dateString).
 * Returns array of groups sorted by date (newest first).
 *
 * @param sets - Array of sets to group
 * @returns Array of day groups with formatted display dates
 */
export function groupSetsByDay(
  sets: Set[] | undefined
): Array<{ date: string; displayDate: string; sets: Set[] }> {
  if (!sets) return [];

  const groups: Map<string, Set[]> = new Map();

  sets.forEach((set) => {
    const date = new Date(set.performedAt);
    const dateKey = date.toDateString();

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(set);
  });

  return Array.from(groups.entries())
    .map(([date, sets]) => ({
      date,
      displayDate: formatDateGroup(date),
      sets: sets.sort((a, b) => b.performedAt - a.performedAt), // newest first within day
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest day first
}

/**
 * Format a date string for display in group headers.
 * - "Today" for today's date
 * - "Yesterday" for yesterday
 * - Weekday name for last 7 days
 * - "Jan 15" style for older dates
 *
 * @param dateString - Date in toDateString() format
 * @returns Formatted display string
 */
export function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateString === today) return "Today";
  if (dateString === yesterday.toDateString()) return "Yesterday";

  // Within last week: "Monday", "Tuesday", etc.
  const daysAgo = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysAgo < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }

  // Older: "Jan 15", "Dec 3", etc.
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
