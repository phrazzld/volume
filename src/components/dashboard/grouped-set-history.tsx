"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { TerminalTable } from "@/components/ui/terminal-table";
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
  const [deletingId, setDeletingId] = useState<Id<"sets"> | null>(null);
  const { unit: preferredUnit } = useWeightUnit();

  const handleDelete = async (set: Set) => {
    if (!confirm("Delete this set? This cannot be undone.")) return;

    setDeletingId(set._id);
    try {
      await onDelete(set._id);
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete set. Please try again.");
      setDeletingId(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    // Show relative time for sets within last 24 hours
    if (diffMins < 1) return "JUST NOW";
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;

    // Show absolute time for older sets
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  if (groupedSets.length === 0) {
    return (
      <TerminalPanel
        title="SET HISTORY"
        titleColor="warning"
        showCornerBrackets={true}
        className="mb-3"
      >
        <div className="p-8 text-center">
          <p className="text-terminal-textSecondary uppercase font-mono text-sm mb-2">
            NO SETS LOGGED YET
          </p>
          <p className="text-terminal-info font-mono text-xs mb-1">
            START YOUR JOURNEY! 🚀
          </p>
          <p className="text-terminal-textMuted font-mono text-xs mt-2">
            Log your first set above
          </p>
        </div>
      </TerminalPanel>
    );
  }

  // Determine today's date for default expansion
  const todayDate = new Date().toDateString();

  return (
    <div className="space-y-3">
      {groupedSets.map((group) => {
        // Build table rows for this day
        const rows = group.sets.map((set) => {
          const exercise = exercises.find((ex) => ex._id === set.exerciseId);
          const isDeleting = deletingId === set._id;

          return [
            // TIME
            <span key="time" className="text-terminal-textSecondary">
              {formatTime(set.performedAt)}
            </span>,

            // EXERCISE
            <span key="exercise" className="text-terminal-text">
              {exercise?.name || "Unknown"}
            </span>,

            // REPS
            <span key="reps" className="text-terminal-success font-bold">
              {set.reps}
            </span>,

            // WEIGHT (with unit stored in set, fallback to user preference for legacy)
            set.weight ? (
              <span key="weight" className="text-terminal-warning font-bold">
                {set.weight} {(set.unit || preferredUnit).toUpperCase()}
              </span>
            ) : (
              <span key="weight" className="text-terminal-textMuted">-</span>
            ),

            // ACTIONS
            <div key="actions" className="flex items-center gap-1">
              <button
                onClick={() => onRepeat(set)}
                className="flex items-center gap-1 px-2 py-1 text-terminal-info hover:bg-terminal-info hover:bg-opacity-10 transition-colors rounded"
                aria-label="Repeat this set"
                title="Repeat this set"
                type="button"
                disabled={isDeleting}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs font-mono uppercase">REPEAT</span>
              </button>
              <button
                onClick={() => handleDelete(set)}
                className="p-2 text-terminal-danger hover:opacity-80 transition-opacity"
                aria-label="Delete this set"
                title="Delete this set"
                type="button"
                disabled={isDeleting}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>,
          ];
        });

        const isToday = group.date === todayDate;

        return (
          <TerminalPanel
            key={group.date}
            title={`${group.displayDate.toUpperCase()} (${group.sets.length} SET${group.sets.length === 1 ? '' : 'S'})`}
            titleColor="warning"
            showCornerBrackets={false}
            collapsible={true}
            defaultCollapsed={!isToday}
            storageKey={`history-day-${group.date}`}
            className=""
          >
            <div className="p-4">
              <TerminalTable
                headers={["TIME", "EXERCISE", "REPS", "WEIGHT", "ACTIONS"]}
                rows={rows}
                columnWidths={["w-20", "", "w-16", "w-20", "w-32"]}
              />
            </div>
          </TerminalPanel>
        );
      })}
    </div>
  );
}
