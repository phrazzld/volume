"use client";

import { SetCard } from "./set-card";
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

interface GroupedSetHistoryProps {
  groupedSets: Array<{
    date: string;
    displayDate: string;
    sets: Set[];
  }>;
  exercises: Exercise[];
  onRepeat: (set: Set) => void;
  onDelete: (setId: Id<"sets">) => void;
}

export function GroupedSetHistory({
  groupedSets,
  exercises,
  onRepeat,
  onDelete,
}: GroupedSetHistoryProps) {
  if (groupedSets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-6xl mb-4">💪</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No sets logged yet
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Log your first set above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Recent Activity
      </h2>

      {groupedSets.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            <span>📅</span>
            <span>{group.displayDate}</span>
          </h3>

          <div className="space-y-3">
            {group.sets.map((set) => (
              <SetCard
                key={set._id}
                set={set}
                exercise={exercises.find((ex) => ex._id === set.exerciseId)}
                onRepeat={() => onRepeat(set)}
                onDelete={() => onDelete(set._id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
