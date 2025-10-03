"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  performedAt: number;
}

interface Exercise {
  _id: Id<"exercises">;
  name: string;
}

interface SetListProps {
  sets: Set[];
  exercises: Exercise[];
}

export function SetList({ sets, exercises }: SetListProps) {
  const deleteSet = useMutation(api.sets.deleteSet);

  const handleDelete = async (id: Id<"sets">) => {
    if (!confirm("Delete this set? This cannot be undone.")) return;

    try {
      await deleteSet({ id });
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete set. Please try again.");
    }
  };

  const getExerciseName = (exerciseId: Id<"exercises">) => {
    const exercise = exercises.find((ex) => ex._id === exerciseId);
    return exercise?.name || "Unknown exercise";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (sets.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        No sets logged yet. Log your first set!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sets.map((set) => (
        <div
          key={set._id}
          className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {getExerciseName(set.exerciseId)}
              </h3>
              <div className="mt-1 flex gap-4 text-gray-600 dark:text-gray-300">
                <span className="font-medium">{set.reps} reps</span>
                {set.weight && <span>{set.weight} lbs</span>}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(set.performedAt)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(set._id)}
              className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Delete set"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
