/**
 * Muscle Group Mapping
 *
 * Maps exercise names to target muscle groups for recovery tracking
 * and training balance analysis.
 *
 * Matching Strategy:
 * 1. Normalize input (uppercase, trim)
 * 2. Check exact match
 * 3. Check partial matches (e.g., "BARBELL BENCH" contains "BENCH")
 * 4. Return ["Other"] if no match found
 */

/**
 * Supported muscle groups for exercise classification
 */
export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Other";

/**
 * Predefined exercise-to-muscle-group mapping
 *
 * Keys are normalized (uppercase) exercise names or keywords.
 * Values are arrays of muscle groups targeted by the exercise.
 *
 * For compound movements, multiple muscle groups are listed
 * (e.g., Bench Press targets Chest and Triceps).
 */
const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
  // Push movements (Chest, Shoulders, Triceps)
  "BENCH PRESS": ["Chest", "Triceps"],
  BENCH: ["Chest", "Triceps"],
  "PUSH UP": ["Chest", "Triceps"],
  PUSHUP: ["Chest", "Triceps"],
  "PUSH-UP": ["Chest", "Triceps"],
  "OVERHEAD PRESS": ["Shoulders", "Triceps"],
  "SHOULDER PRESS": ["Shoulders", "Triceps"],
  PRESS: ["Shoulders", "Triceps"], // Generic press (overhead)
  DIP: ["Chest", "Triceps"],
  "CHEST FLY": ["Chest"],
  FLY: ["Chest"],
  "INCLINE PRESS": ["Chest", "Triceps"],
  "DECLINE PRESS": ["Chest", "Triceps"],

  // Pull movements (Back, Biceps)
  "PULL UP": ["Back", "Biceps"],
  PULLUP: ["Back", "Biceps"],
  "PULL-UP": ["Back", "Biceps"],
  "CHIN UP": ["Back", "Biceps"],
  CHINUP: ["Back", "Biceps"],
  "CHIN-UP": ["Back", "Biceps"],
  ROW: ["Back", "Biceps"],
  DEADLIFT: ["Back", "Hamstrings", "Glutes"],
  "LAT PULLDOWN": ["Back", "Biceps"],
  PULLDOWN: ["Back", "Biceps"],
  "FACE PULL": ["Back", "Shoulders"],

  // Legs (Quads, Hamstrings, Glutes, Calves)
  SQUAT: ["Quads", "Glutes"],
  "LEG PRESS": ["Quads", "Glutes"],
  LUNGE: ["Quads", "Glutes"],
  "LEG CURL": ["Hamstrings"],
  "LEG EXTENSION": ["Quads"],
  "CALF RAISE": ["Calves"],
  "HIP THRUST": ["Glutes"],
  "ROMANIAN DEADLIFT": ["Hamstrings", "Glutes"],
  RDL: ["Hamstrings", "Glutes"],
  "GOOD MORNING": ["Hamstrings", "Back"],

  // Core
  PLANK: ["Core"],
  CRUNCH: ["Core"],
  "SIT UP": ["Core"],
  SITUP: ["Core"],
  "SIT-UP": ["Core"],
  "AB WHEEL": ["Core"],
  "HANGING LEG RAISE": ["Core"],
  "LEG RAISE": ["Core"],

  // Arms (Isolation)
  CURL: ["Biceps"],
  "BICEP CURL": ["Biceps"],
  "HAMMER CURL": ["Biceps"],
  TRICEP: ["Triceps"],
  "TRICEP EXTENSION": ["Triceps"],
  "SKULL CRUSHER": ["Triceps"],
  "OVERHEAD EXTENSION": ["Triceps"],

  // Shoulders (Isolation)
  "LATERAL RAISE": ["Shoulders"],
  "FRONT RAISE": ["Shoulders"],
  "REAR DELT": ["Shoulders"],
  SHRUG: ["Back"], // Traps (part of back)
};

/**
 * Get muscle groups targeted by an exercise
 *
 * Uses case-insensitive partial matching to identify muscle groups.
 * For example:
 * - "Bench Press" → exact match
 * - "Barbell Bench Press" → partial match on "BENCH"
 * - "Unknown Exercise" → returns ["Other"]
 *
 * @param exerciseName - Name of the exercise (any casing, spaces allowed)
 * @returns Array of muscle groups targeted by this exercise
 *
 * @example
 * ```typescript
 * getMuscleGroups("Bench Press") // ["Chest", "Triceps"]
 * getMuscleGroups("barbell bench press") // ["Chest", "Triceps"]
 * getMuscleGroups("Pull-ups") // ["Back", "Biceps"]
 * getMuscleGroups("Jumping Jacks") // ["Other"]
 * ```
 */
export function getMuscleGroups(exerciseName: string): MuscleGroup[] {
  // Normalize: uppercase, trim whitespace
  const normalized = exerciseName.trim().toUpperCase();

  // 1. Check for exact match
  if (EXERCISE_MUSCLE_MAP[normalized]) {
    return EXERCISE_MUSCLE_MAP[normalized];
  }

  // 2. Check for partial matches (keywords contained in exercise name)
  // Sort by keyword length descending to prefer longer matches
  // (e.g., "BENCH PRESS" before "BENCH")
  const keywords = Object.keys(EXERCISE_MUSCLE_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of keywords) {
    if (normalized.includes(keyword)) {
      return EXERCISE_MUSCLE_MAP[keyword];
    }
  }

  // 3. No match found - return "Other"
  return ["Other"];
}

/**
 * Get all supported muscle groups
 *
 * Useful for UI dropdowns or validation
 */
export function getAllMuscleGroups(): MuscleGroup[] {
  return [
    "Chest",
    "Back",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Quads",
    "Hamstrings",
    "Glutes",
    "Calves",
    "Core",
    "Other",
  ];
}
