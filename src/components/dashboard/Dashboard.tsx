"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo, useState, useRef } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DailyStatsCard } from "@/components/dashboard/daily-stats-card";
import { QuickLogForm, QuickLogFormHandle } from "@/components/dashboard/quick-log-form";
import { GroupedSetHistory } from "@/components/dashboard/grouped-set-history";
import { UndoToast } from "@/components/dashboard/undo-toast";
import { FirstRunExperience } from "@/components/dashboard/first-run-experience";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { handleMutationError } from "@/lib/error-handler";
import {
  calculateDailyStats,
  calculateDailyStatsByExercise,
  groupSetsByDay,
  sortExercisesByRecency,
} from "@/lib/dashboard-utils";
import { getTodayRange } from "@/lib/date-utils";

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  unit?: string;
  performedAt: number;
}

export function Dashboard() {
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastLoggedSetId, setLastLoggedSetId] = useState<Id<"sets"> | null>(null);
  const formRef = useRef<QuickLogFormHandle>(null);
  const { unit } = useWeightUnit();

  // Fetch data from Convex
  const allSets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises);

  // Delete set mutation
  const deleteSet = useMutation(api.sets.deleteSet);

  // Filter sets to today only (midnight to midnight in user's timezone)
  const todaysSets = useMemo(() => {
    if (!allSets) return undefined;
    const { start, end } = getTodayRange();
    return allSets.filter((set) => set.performedAt >= start && set.performedAt <= end);
  }, [allSets]);

  // Calculate daily stats (convert all volumes to user's preferred unit)
  const dailyStats = useMemo(() => calculateDailyStats(todaysSets, unit), [todaysSets, unit]);

  // Calculate per-exercise daily stats (convert all volumes to user's preferred unit)
  const exerciseStats = useMemo(
    () => calculateDailyStatsByExercise(todaysSets, exercises, unit),
    [todaysSets, exercises, unit]
  );

  // Group today's sets by time
  const groupedSets = useMemo(() => groupSetsByDay(todaysSets), [todaysSets]);

  // Sort exercises by recency (most recently used first)
  const exercisesByRecency = useMemo(
    () => sortExercisesByRecency(exercises, allSets),
    [exercises, allSets]
  );

  // Handle delete set
  const handleDeleteSet = async (setId: Id<"sets">) => {
    try {
      await deleteSet({ id: setId });
    } catch (error) {
      handleMutationError(error, "Delete Set");
    }
  };

  // Handle repeat set
  const handleRepeatSet = (set: Set) => {
    formRef.current?.repeatSet(set);
  };

  // Handle set logged - show undo toast
  const handleSetLogged = (setId: Id<"sets">) => {
    setLastLoggedSetId(setId);
    setUndoToastVisible(true);
  };

  // Handle undo - delete the last logged set
  const handleUndo = async () => {
    if (lastLoggedSetId) {
      try {
        await deleteSet({ id: lastLoggedSetId });
        setUndoToastVisible(false);
        setLastLoggedSetId(null);
      } catch (error) {
        handleMutationError(error, "Undo Set");
      }
    }
  };

  // Handle dismiss toast
  const handleDismissToast = () => {
    setUndoToastVisible(false);
    setLastLoggedSetId(null);
  };

  // Loading state
  if (allSets === undefined || exercises === undefined) {
    return (
      <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="space-y-3">
          {/* Stats skeleton */}
          <div className="bg-terminal-bg border border-terminal-border p-3 animate-pulse">
            <div className="h-4 bg-terminal-bgSecondary w-32 mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px">
              <div className="h-16 bg-terminal-bgSecondary" />
              <div className="h-16 bg-terminal-bgSecondary" />
              <div className="h-16 bg-terminal-bgSecondary" />
              <div className="h-16 bg-terminal-bgSecondary" />
            </div>
          </div>

          {/* Form skeleton */}
          <div className="bg-terminal-bg border border-terminal-border p-4 animate-pulse">
            <div className="h-4 bg-terminal-bgSecondary w-24 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-terminal-bgSecondary" />
              <div className="h-10 bg-terminal-bgSecondary" />
              <div className="h-10 bg-terminal-bgSecondary" />
              <div className="h-10 bg-terminal-bgSecondary" />
            </div>
          </div>

          {/* History skeleton */}
          <div className="bg-terminal-bg border border-terminal-border p-4 animate-pulse">
            <div className="h-4 bg-terminal-bgSecondary w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-20 bg-terminal-bgSecondary" />
              <div className="h-20 bg-terminal-bgSecondary" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Handle first exercise created - auto-select it and focus form
  const handleFirstExerciseCreated = (exerciseId: Id<"exercises">) => {
    // The exercise will appear in the list on next render
    // Auto-select it by calling repeatSet with a dummy set
    setTimeout(() => {
      formRef.current?.repeatSet({
        _id: "" as Id<"sets">,
        exerciseId,
        reps: 0,
        performedAt: Date.now(),
      });
    }, 100);
  };

  return (
    <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="space-y-3">
        {exercises.length === 0 ? (
          /* First Run Experience - Show when no exercises exist */
          <FirstRunExperience onExerciseCreated={handleFirstExerciseCreated} />
        ) : (
          <>
            {/* Daily Stats Card */}
            <DailyStatsCard stats={dailyStats} exerciseStats={exerciseStats} />

            {/* Quick Log Form - MOVED TO PRIME POSITION */}
            <QuickLogForm
              ref={formRef}
              exercises={exercisesByRecency}
              onSetLogged={handleSetLogged}
            />

            {/* Today's Set History */}
            <GroupedSetHistory
              groupedSets={groupedSets}
              exercises={exercisesByRecency}
              onRepeat={handleRepeatSet}
              onDelete={handleDeleteSet}
            />
          </>
        )}

        {/* Undo Toast */}
        <UndoToast
          visible={undoToastVisible}
          onUndo={handleUndo}
          onDismiss={handleDismissToast}
        />
      </div>
    </main>
  );
}
