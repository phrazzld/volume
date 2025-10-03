"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo, useState, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { DailyStatsCard } from "@/components/dashboard/daily-stats-card";
import { QuickLogForm, QuickLogFormHandle } from "@/components/dashboard/quick-log-form";
import { GroupedSetHistory } from "@/components/dashboard/grouped-set-history";
import { UndoToast } from "@/components/dashboard/undo-toast";
import {
  calculateDailyStats,
  groupSetsByDay,
} from "@/lib/dashboard-utils";

export default function Home() {
  const [statsExpanded, setStatsExpanded] = useState(true);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastLoggedSetId, setLastLoggedSetId] = useState<Id<"sets"> | null>(null);
  const formRef = useRef<QuickLogFormHandle>(null);

  // Fetch data from Convex
  const sets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises);

  // Delete set mutation
  const deleteSet = useMutation(api.sets.deleteSet);

  // Calculate daily stats
  const dailyStats = useMemo(() => calculateDailyStats(sets), [sets]);

  // Group sets by day
  const groupedSets = useMemo(() => groupSetsByDay(sets), [sets]);

  // Handle delete set
  const handleDeleteSet = async (setId: Id<"sets">) => {
    try {
      await deleteSet({ id: setId });
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete set. Please try again.");
    }
  };

  // Handle repeat set
  const handleRepeatSet = (set: any) => {
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
        console.error("Failed to undo set:", error);
        alert("Failed to undo set. Please try again.");
      }
    }
  };

  // Handle dismiss toast
  const handleDismissToast = () => {
    setUndoToastVisible(false);
    setLastLoggedSetId(null);
  };

  // Loading state
  if (sets === undefined || exercises === undefined) {
    return (
      <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Stats skeleton */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* Form skeleton */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* History skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Daily Stats Card */}
        <DailyStatsCard
          stats={dailyStats}
          expanded={statsExpanded}
          onToggle={() => setStatsExpanded(!statsExpanded)}
        />

        {/* Quick Log Form */}
        <QuickLogForm
          ref={formRef}
          exercises={exercises}
          onSetLogged={handleSetLogged}
        />

        {/* Grouped Set History */}
        <GroupedSetHistory
          groupedSets={groupedSets}
          exercises={exercises}
          onRepeat={handleRepeatSet}
          onDelete={handleDeleteSet}
        />

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
