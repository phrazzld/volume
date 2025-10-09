import { Id } from "../../convex/_generated/dataModel";

export type WeightUnit = "lbs" | "kg";

export interface Exercise {
  _id: Id<"exercises">;
  name: string;
  createdAt: number;
  deletedAt?: number;
}

export interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  unit?: string; // "lbs" or "kg" - stored with set for data integrity
  performedAt: number;
}
