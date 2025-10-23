import { Id } from "../_generated/dataModel";

/**
 * Parse and validate exercise ID from HTTP request
 * Throws error if ID is missing or invalid format
 */
export function parseExerciseId(id: string | undefined): Id<"exercises"> {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid exercise ID");
  }
  // Convex IDs are opaque strings - runtime validation happens in mutations
  return id as Id<"exercises">;
}

/**
 * Parse and validate set ID from HTTP request
 * Throws error if ID is missing or invalid format
 */
export function parseSetId(id: string | undefined): Id<"sets"> {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid set ID");
  }
  return id as Id<"sets">;
}
