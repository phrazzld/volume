"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useWeightUnit } from "@/contexts/WeightUnitContext";

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  unit?: string; // "lbs" or "kg" - stored with set for data integrity
  performedAt: number;
}

interface Exercise {
  _id: Id<"exercises">;
  name: string;
}

interface SetCardProps {
  set: Set;
  exercise: Exercise | undefined;
  onRepeat: () => void;
  onDelete: () => void;
}

export function SetCard({ set, exercise, onRepeat, onDelete }: SetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { unit: preferredUnit } = useWeightUnit();
  // Use the unit stored with the set, fallback to user preference for legacy sets
  const displayUnit = set.unit || preferredUnit;

  const handleDelete = async () => {
    if (!confirm("Delete this set? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete set. Please try again.");
      setIsDeleting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`
        p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        rounded-lg hover:shadow-md transition-all
        ${isDeleting ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {exercise?.name || "Unknown exercise"}
          </h4>
          <div className="mt-1 flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="font-medium">{set.reps} reps</span>
            {set.weight && (
              <>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span>{set.weight} {displayUnit}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatTime(set.performedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onRepeat}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Repeat this set"
            title="Repeat this set"
            type="button"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete this set"
            title="Delete this set"
            type="button"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
