import { Id } from "../../convex/_generated/dataModel";

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  unit?: string; // "lbs" or "kg" - stored with set for data integrity
  performedAt: number;
}

/**
 * Convert weight from one unit to another.
 * @param weight - Weight value to convert
 * @param fromUnit - Source unit ("lbs" or "kg")
 * @param toUnit - Target unit ("lbs" or "kg")
 * @returns Converted weight value
 */
export function convertWeight(weight: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return weight;

  // Convert lbs to kg: divide by 2.20462
  if (fromUnit === "lbs" && toUnit === "kg") {
    return weight / 2.20462;
  }

  // Convert kg to lbs: multiply by 2.20462
  if (fromUnit === "kg" && toUnit === "lbs") {
    return weight * 2.20462;
  }

  // Unknown units, return as-is
  return weight;
}

interface Exercise {
  _id: Id<"exercises">;
  name: string;
}

interface DailyStats {
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  exercisesWorked: number;
}

export interface ExerciseStats {
  exerciseId: Id<"exercises">;
  name: string;
  sets: number;
  reps: number;
  volume: number;
}

/**
 * Calculate daily statistics from a set of workout sets.
 * Filters to today's sets and aggregates totals.
 * Converts all weights to the target unit for accurate volume calculations.
 *
 * @param sets - Array of sets to analyze
 * @param targetUnit - Unit to convert all weights to (e.g., "lbs" or "kg")
 * @returns Daily statistics or null if no sets
 */
export function calculateDailyStats(
  sets: Set[] | undefined,
  targetUnit: string = "lbs"
): DailyStats | null {
  if (!sets || sets.length === 0) return null;

  const today = new Date().toDateString();
  const todaySets = sets.filter(
    (set) => new Date(set.performedAt).toDateString() === today
  );

  if (todaySets.length === 0) return null;

  return {
    totalSets: todaySets.length,
    totalReps: todaySets.reduce((sum, set) => sum + set.reps, 0),
    totalVolume: todaySets.reduce((sum, set) => {
      if (!set.weight) return sum;
      // Convert weight to target unit before calculating volume
      const setUnit = set.unit || "lbs"; // fallback for legacy sets
      const convertedWeight = convertWeight(set.weight, setUnit, targetUnit);
      return sum + (set.reps * convertedWeight);
    }, 0),
    exercisesWorked: new Set(todaySets.map((s) => s.exerciseId)).size,
  };
}

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

/**
 * Calculate per-exercise statistics for today's sets.
 * Groups sets by exercise and aggregates totals.
 * Converts all weights to the target unit for accurate volume calculations.
 *
 * @param sets - Array of sets to analyze
 * @param exercises - Array of exercises for name lookup
 * @param targetUnit - Unit to convert all weights to (e.g., "lbs" or "kg")
 * @returns Array of exercise statistics sorted by most sets first
 */
export function calculateDailyStatsByExercise(
  sets: Set[] | undefined,
  exercises: Exercise[] | undefined,
  targetUnit: string = "lbs"
): ExerciseStats[] {
  if (!sets || !exercises) return [];

  const today = new Date().toDateString();
  const todaySets = sets.filter(
    (set) => new Date(set.performedAt).toDateString() === today
  );

  if (todaySets.length === 0) return [];

  // Group by exercise
  const exerciseMap = new Map<Id<"exercises">, ExerciseStats>();

  todaySets.forEach((set) => {
    const exercise = exercises.find((ex) => ex._id === set.exerciseId);
    if (!exercise) return;

    if (!exerciseMap.has(set.exerciseId)) {
      exerciseMap.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        name: exercise.name,
        sets: 0,
        reps: 0,
        volume: 0,
      });
    }

    const stats = exerciseMap.get(set.exerciseId)!;
    stats.sets += 1;
    stats.reps += set.reps;

    // Convert weight to target unit before calculating volume
    if (set.weight) {
      const setUnit = set.unit || "lbs"; // fallback for legacy sets
      const convertedWeight = convertWeight(set.weight, setUnit, targetUnit);
      stats.volume += set.reps * convertedWeight;
    }
  });

  // Sort by most sets first, then alphabetical
  return Array.from(exerciseMap.values()).sort((a, b) => {
    if (a.sets !== b.sets) return b.sets - a.sets;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort exercises by recent usage.
 * Most recently used exercises first, then alphabetical.
 *
 * @param exercises - Array of exercises to sort
 * @param sets - Array of sets to determine usage
 * @returns Sorted array of exercises (does not mutate input)
 */
export function sortExercisesByRecency(
  exercises: Exercise[] | undefined,
  sets: Set[] | undefined
): Exercise[] {
  if (!exercises) return [];
  if (!sets || sets.length === 0) return exercises;

  // Build map of exerciseId -> last used timestamp
  const lastUsed = new Map<Id<"exercises">, number>();
  sets.forEach((set) => {
    const current = lastUsed.get(set.exerciseId) || 0;
    if (set.performedAt > current) {
      lastUsed.set(set.exerciseId, set.performedAt);
    }
  });

  // Sort: most recently used first, then alphabetical
  return [...exercises].sort((a, b) => {
    const aUsed = lastUsed.get(a._id) || 0;
    const bUsed = lastUsed.get(b._id) || 0;

    if (aUsed !== bUsed) return bUsed - aUsed;
    return a.name.localeCompare(b.name);
  });
}
