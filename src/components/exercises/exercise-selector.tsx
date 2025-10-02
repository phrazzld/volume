"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ExerciseSelectorProps {
  onSelect: (exerciseId: Id<"exercises">) => void;
  selectedId?: Id<"exercises">;
}

export function ExerciseSelector({
  onSelect,
  selectedId,
}: ExerciseSelectorProps) {
  const exercises = useQuery(api.exercises.listExercises);

  if (exercises === undefined) {
    return (
      <select
        disabled
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
      >
        <option>Loading exercises...</option>
      </select>
    );
  }

  if (exercises.length === 0) {
    return (
      <select
        disabled
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
      >
        <option>No exercises yet - create one first</option>
      </select>
    );
  }

  return (
    <select
      value={selectedId || ""}
      onChange={(e) => {
        const value = e.target.value;
        if (value) {
          onSelect(value as Id<"exercises">);
        }
      }}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    >
      <option value="">Select an exercise...</option>
      {exercises.map((exercise) => (
        <option key={exercise._id} value={exercise._id}>
          {exercise.name}
        </option>
      ))}
    </select>
  );
}
