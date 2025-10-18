"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo, useState, useRef } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DailyStatsCard } from "@/components/dashboard/daily-stats-card";
import {
  QuickLogForm,
  QuickLogFormHandle,
} from "@/components/dashboard/quick-log-form";
import { GroupedSetHistory } from "@/components/dashboard/grouped-set-history";
import { UndoToast } from "@/components/dashboard/undo-toast";
import { FirstRunExperience } from "@/components/dashboard/first-run-experience";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { handleMutationError } from "@/lib/error-handler";
import { PageLayout } from "@/components/layout/page-layout";
import { LAYOUT } from "@/lib/layout-constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  calculateDailyStats,
  calculateDailyStatsByExercise,
  groupSetsByExercise,
  sortExercisesByRecency,
} from "@/lib/dashboard-utils";
import { getTodayRange } from "@/lib/date-utils";
import type { Exercise, Set } from "@/types/domain";

export function Dashboard() {
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastLoggedSetId, setLastLoggedSetId] = useState<Id<"sets"> | null>(
    null
  );
  const formRef = useRef<QuickLogFormHandle>(null);
  const { unit } = useWeightUnit();

  // Fetch data from Convex
  const allSets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises, {
    includeDeleted: true,
  });

  // Delete set mutation
  const deleteSet = useMutation(api.sets.deleteSet);

  // Filter sets to today only (midnight to midnight in user's timezone)
  const todaysSets = useMemo(() => {
    if (!allSets) return undefined;
    const { start, end } = getTodayRange();
    return allSets.filter(
      (set) => set.performedAt >= start && set.performedAt <= end
    );
  }, [allSets]);

  // Calculate daily stats (convert all volumes to user's preferred unit)
  const dailyStats = useMemo(
    () => calculateDailyStats(todaysSets, unit),
    [todaysSets, unit]
  );

  // Calculate per-exercise daily stats (convert all volumes to user's preferred unit)
  const exerciseStats = useMemo(
    () => calculateDailyStatsByExercise(todaysSets, exercises, unit),
    [todaysSets, exercises, unit]
  );

  // Group today's sets by exercise for workout view
  const exerciseGroups = useMemo(
    () => groupSetsByExercise(todaysSets, unit),
    [todaysSets, unit]
  );

  // Build exercise Map for O(1) lookups (fixes BACKLOG #11)
  const exerciseMap = useMemo(
    () => new Map((exercises ?? []).map((ex) => [ex._id, ex])),
    [exercises]
  );

  // Sort exercises by recency (most recently used first)
  const exercisesByRecency = useMemo(
    () => sortExercisesByRecency(exercises, allSets),
    [exercises, allSets]
  );

  // Filter to active exercises only for QuickLogForm
  const activeExercisesByRecency = useMemo(
    () => exercisesByRecency?.filter((ex) => ex.deletedAt === undefined),
    [exercisesByRecency]
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
      <PageLayout title="Dashboard">
        {/* Stats skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </CardContent>
        </Card>

        {/* Form skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>

        {/* History skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className={LAYOUT.section.spacing}>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </CardContent>
        </Card>
      </PageLayout>
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
    <PageLayout title="Today">
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
            exercises={activeExercisesByRecency}
            onSetLogged={handleSetLogged}
          />

          {/* Today's Set History */}
          <GroupedSetHistory
            exerciseGroups={exerciseGroups}
            exerciseMap={exerciseMap}
            onRepeat={handleRepeatSet}
            onDelete={handleDeleteSet}
          />
        </>
      )}

      {/* Undo Toast - Fixed position overlay, not affected by spacing */}
      <UndoToast
        visible={undoToastVisible}
        onUndo={handleUndo}
        onDismiss={handleDismissToast}
      />
    </PageLayout>
  );
}
