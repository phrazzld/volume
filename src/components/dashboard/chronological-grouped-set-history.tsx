"use client";

import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { Exercise, Set } from "@/types/domain";
import { ExerciseSetGroup } from "./exercise-set-group";
import { groupSetsByExercise } from "@/lib/dashboard-utils";

interface DayGroup {
  date: string;
  displayDate: string;
  sets: Set[];
}

interface ChronologicalGroupedSetHistoryProps {
  groupedSets: DayGroup[];
  exerciseMap: Map<Id<"exercises">, Exercise>;
  onRepeat: (set: Set) => void;
  onDelete: (setId: Id<"sets">) => void;
  showRepeat?: boolean;
}

/**
 * Displays workout history grouped chronologically by day,
 * with exercise groups within each day using collapsible UI.
 *
 * Combines the chronological mental model (day-by-day timeline)
 * with the modern collapsible exercise group pattern.
 */
export function ChronologicalGroupedSetHistory({
  groupedSets,
  exerciseMap,
  onRepeat,
  onDelete,
  showRepeat = false,
}: ChronologicalGroupedSetHistoryProps) {
  const { unit: preferredUnit } = useWeightUnit();

  // Empty state
  if (groupedSets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              No sets logged yet
            </p>
            <p className="text-sm mb-1">Start your journey! 🚀</p>
            <p className="text-muted-foreground text-xs mt-2">
              Log your first set above
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groupedSets.map((dayGroup) => {
        // Transform day's sets into exercise groups
        const exerciseGroups = groupSetsByExercise(
          dayGroup.sets,
          preferredUnit
        );

        return (
          <Card key={dayGroup.date} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {dayGroup.displayDate} ({dayGroup.sets.length} set
                {dayGroup.sets.length === 1 ? "" : "s"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exerciseGroups.map((group) => {
                  const exercise = exerciseMap.get(group.exerciseId);
                  if (!exercise) return null;

                  return (
                    <ExerciseSetGroup
                      key={group.exerciseId}
                      exercise={exercise}
                      sets={group.sets}
                      totalVolume={group.totalVolume}
                      totalReps={group.totalReps}
                      preferredUnit={preferredUnit}
                      onRepeat={onRepeat}
                      onDelete={onDelete}
                      showRepeat={showRepeat}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
