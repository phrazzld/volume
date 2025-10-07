"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ExerciseManager } from "@/components/dashboard/exercise-manager";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { useWeightUnit } from "@/contexts/WeightUnitContext";

export default function SettingsPage() {
  const sets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises);
  const { unit, toggleUnit } = useWeightUnit();

  // Loading state
  if (sets === undefined || exercises === undefined) {
    return (
      <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="space-y-3">
          {/* Loading skeleton */}
          <div className="bg-terminal-bg border border-terminal-border p-4 animate-pulse">
            <div className="h-4 bg-terminal-bgSecondary w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-16 bg-terminal-bgSecondary" />
              <div className="h-16 bg-terminal-bgSecondary" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-terminal-text mb-4 font-mono uppercase">
          SETTINGS
        </h1>

        {/* Preferences Section */}
        <TerminalPanel
          title="PREFERENCES"
          titleColor="info"
          showCornerBrackets={true}
        >
          <div className="p-4 space-y-4">
            {/* Weight Unit Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono uppercase text-terminal-text mb-1">
                  WEIGHT UNIT
                </p>
                <p className="text-xs text-terminal-textSecondary font-mono">
                  DEFAULT UNIT FOR LOGGING WEIGHTS
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (unit !== "lbs") toggleUnit();
                  }}
                  className={`px-4 py-2 border font-mono uppercase text-sm transition-colors ${
                    unit === "lbs"
                      ? "bg-terminal-success text-terminal-bg border-terminal-success"
                      : "border-terminal-border text-terminal-textSecondary hover:text-terminal-text hover:border-terminal-text"
                  }`}
                >
                  LBS
                </button>
                <button
                  onClick={() => {
                    if (unit !== "kg") toggleUnit();
                  }}
                  className={`px-4 py-2 border font-mono uppercase text-sm transition-colors ${
                    unit === "kg"
                      ? "bg-terminal-success text-terminal-bg border-terminal-success"
                      : "border-terminal-border text-terminal-textSecondary hover:text-terminal-text hover:border-terminal-text"
                  }`}
                >
                  KG
                </button>
              </div>
            </div>
          </div>
        </TerminalPanel>

        {/* Exercise Management Section */}
        <ExerciseManager exercises={exercises || []} sets={sets || []} />
      </div>
    </main>
  );
}
