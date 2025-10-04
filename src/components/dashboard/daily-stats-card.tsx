"use client";

import { useState } from "react";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { TerminalTable } from "@/components/ui/terminal-table";
import { ExerciseStats } from "@/lib/dashboard-utils";

interface DailyStatsCardProps {
  stats: {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    exercisesWorked: number;
  } | null;
  exerciseStats: ExerciseStats[];
}

export function DailyStatsCard({ stats, exerciseStats }: DailyStatsCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Build table rows for per-exercise breakdown
  const rows = exerciseStats.map((exercise) => [
    // EXERCISE
    <span key="exercise" className="text-terminal-text">
      {exercise.name}
    </span>,

    // SETS
    <span key="sets" className="text-terminal-info font-bold">
      {exercise.sets}
    </span>,

    // REPS
    <span key="reps" className="text-terminal-success font-bold">
      {exercise.reps}
    </span>,

    // VOLUME
    exercise.volume > 0 ? (
      <span key="volume" className="text-terminal-warning font-bold">
        {exercise.volume}
      </span>
    ) : (
      <span key="volume" className="text-terminal-textMuted">
        —
      </span>
    ),
  ]);

  return (
    <TerminalPanel
      title="DAILY METRICS"
      titleColor="info"
      showCornerBrackets={true}
      className="mb-3"
    >
      {stats ? (
        <>
          {/* Aggregate Totals - Compact Row */}
          <div className="grid grid-cols-4 border-b border-terminal-border">
            {/* Total Sets - Cyan */}
            <div className="p-2 border-r border-terminal-border">
              <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
                SETS
              </p>
              <p className="text-xl font-bold text-terminal-info tabular-nums font-mono">
                {stats.totalSets}
              </p>
            </div>

            {/* Total Reps - Green */}
            <div className="p-2 border-r border-terminal-border">
              <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
                REPS
              </p>
              <p className="text-xl font-bold text-terminal-success tabular-nums font-mono">
                {stats.totalReps}
              </p>
            </div>

            {/* Total Volume - Orange */}
            <div className="p-2 border-r border-terminal-border">
              <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
                VOLUME
              </p>
              <p className="text-xl font-bold text-terminal-warning tabular-nums font-mono">
                {stats.totalVolume > 0 ? `${stats.totalVolume}` : "—"}
              </p>
            </div>

            {/* Exercises Worked - Yellow */}
            <div className="p-2">
              <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
                EXERCISES
              </p>
              <p className="text-xl font-bold text-terminal-accent tabular-nums font-mono">
                {stats.exercisesWorked}
              </p>
            </div>
          </div>

          {/* Per-Exercise Breakdown - Collapsible */}
          {exerciseStats.length > 0 && (
            <>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full px-3 py-2 border-t border-terminal-border text-terminal-textSecondary hover:text-terminal-info hover:bg-terminal-bgSecondary transition-colors text-xs uppercase font-mono text-center"
              >
                {showBreakdown ? "▲ HIDE BREAKDOWN" : "▼ SHOW BREAKDOWN"}
              </button>
              {showBreakdown && (
                <div className="p-3 border-t border-terminal-border">
                  <TerminalTable
                    headers={["EXERCISE", "SETS", "REPS", "VOLUME"]}
                    rows={rows}
                    columnWidths={["", "w-16", "w-20", "w-24"]}
                  />
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-terminal-textSecondary text-center py-8 font-mono">
          NO SETS LOGGED TODAY
        </p>
      )}
    </TerminalPanel>
  );
}
