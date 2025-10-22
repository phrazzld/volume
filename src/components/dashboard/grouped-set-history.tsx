"use client";

import { forwardRef } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { Exercise, Set } from "@/types/domain";
import { ExerciseSetGroup } from "./exercise-set-group";
import { Dumbbell } from "lucide-react";

interface ExerciseGroup {
  exerciseId: Id<"exercises">;
  sets: Set[];
  totalVolume: number;
  totalReps: number;
}

interface GroupedSetHistoryProps {
  exerciseGroups: ExerciseGroup[];
  exerciseMap: Map<Id<"exercises">, Exercise>;
  onRepeat: (set: Set) => void;
  onDelete: (setId: Id<"sets">) => void;
  isLoading?: boolean;
}

export const GroupedSetHistory = forwardRef<
  HTMLDivElement,
  GroupedSetHistoryProps
>(function GroupedSetHistory(
  { exerciseGroups, exerciseMap, onRepeat, onDelete, isLoading = false },
  ref
) {
  const { unit: preferredUnit } = useWeightUnit();

  // Loading state - show skeleton while data is fetching
  if (isLoading) {
    return (
      <Card ref={ref} className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="border rounded-lg p-4">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - user has no sets logged today
  if (exerciseGroups.length === 0) {
    return (
      <Card ref={ref} className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm mb-2">
              No sets logged yet
            </p>
            <p className="text-lg font-medium">{"Start logging above! 💪"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSets = exerciseGroups.reduce(
    (sum, group) => sum + group.sets.length,
    0
  );

  return (
    <Card ref={ref} className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground font-normal">
          Today ({exerciseGroups.length} exercise
          {exerciseGroups.length === 1 ? "" : "s"}, {totalSets} set
          {totalSets === 1 ? "" : "s"})
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
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
