"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { GroupedSetHistory } from "@/components/dashboard/grouped-set-history";
import { groupSetsByDay } from "@/lib/dashboard-utils";
import { handleMutationError } from "@/lib/error-handler";

export default function HistoryPage() {
  // Fetch all sets (unpaginated for now - will add pagination in next iteration)
  const sets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises);
  const deleteSet = useMutation(api.sets.deleteSet);

  const [deletingId, setDeletingId] = useState<Id<"sets"> | null>(null);

  // Group sets by day
  const groupedSets = useMemo(() => {
    if (!sets) return [];
    return groupSetsByDay(sets);
  }, [sets]);

  // Handle delete set
  const handleDeleteSet = async (setId: Id<"sets">) => {
    setDeletingId(setId);
    try {
      await deleteSet({ id: setId });
    } catch (error) {
      handleMutationError(error, "Delete Set");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle repeat set - navigate to dashboard with set data
  // For now, just a placeholder - will implement proper repeat later
  const handleRepeatSet = (set: any) => {
    // TODO: Implement repeat functionality
    console.log("Repeat set:", set);
  };

  // Loading state
  if (sets === undefined || exercises === undefined) {
    return (
      <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="space-y-3">
          {/* Loading skeleton */}
          <div className="bg-terminal-bg border border-terminal-border p-4 animate-pulse">
            <div className="h-4 bg-terminal-bgSecondary w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-20 bg-terminal-bgSecondary" />
              <div className="h-20 bg-terminal-bgSecondary" />
              <div className="h-20 bg-terminal-bgSecondary" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Empty state
  if (sets.length === 0) {
    return (
      <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="bg-terminal-bg border border-terminal-border p-8 text-center">
          <p className="text-terminal-textSecondary uppercase font-mono text-sm mb-2">
            NO WORKOUT HISTORY YET
          </p>
          <p className="text-terminal-info font-mono text-xs">
            LOG YOUR FIRST SET ON THE DASHBOARD!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-terminal-text mb-4 font-mono uppercase">
          WORKOUT HISTORY
        </h1>
        <GroupedSetHistory
          groupedSets={groupedSets}
          exercises={exercises || []}
          onRepeat={handleRepeatSet}
          onDelete={handleDeleteSet}
        />
      </div>
    </main>
  );
}
