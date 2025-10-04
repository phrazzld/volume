"use client";

import { TerminalPanel } from "@/components/ui/terminal-panel";

interface DailyStatsCardProps {
  stats: {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    exercisesWorked: number;
  } | null;
}

export function DailyStatsCard({ stats }: DailyStatsCardProps) {
  return (
    <TerminalPanel
      title="DAILY METRICS"
      titleColor="info"
      showCornerBrackets={true}
      className="mb-3"
    >
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4">
          {/* Total Sets - Cyan */}
          <div className="p-3 border-r border-b md:border-b-0 border-terminal-border">
            <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
              SETS
            </p>
            <p className="text-2xl font-bold text-terminal-info tabular-nums font-mono">
              {stats.totalSets}
            </p>
          </div>

          {/* Total Reps - Green */}
          <div className="p-3 border-b md:border-b-0 md:border-r border-terminal-border">
            <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
              REPS
            </p>
            <p className="text-2xl font-bold text-terminal-success tabular-nums font-mono">
              {stats.totalReps}
            </p>
          </div>

          {/* Total Volume - Orange */}
          <div className="p-3 border-r border-terminal-border">
            <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
              VOLUME
            </p>
            <p className="text-2xl font-bold text-terminal-warning tabular-nums font-mono">
              {stats.totalVolume > 0 ? `${stats.totalVolume} LBS` : "—"}
            </p>
          </div>

          {/* Exercises Worked - Yellow */}
          <div className="p-3">
            <p className="text-xs uppercase text-terminal-textSecondary mb-1 font-mono">
              EXERCISES
            </p>
            <p className="text-2xl font-bold text-terminal-accent tabular-nums font-mono">
              {stats.exercisesWorked}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-terminal-textSecondary text-center py-8 font-mono">
          NO SETS LOGGED TODAY
        </p>
      )}
    </TerminalPanel>
  );
}
