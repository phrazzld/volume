"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ExerciseManager } from "@/components/dashboard/exercise-manager";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { PageLayout } from "@/components/layout/page-layout";

export default function SettingsPage() {
  // Fetch exercises and sets for ExerciseManager
  const exercises = useQuery(api.exercises.listExercises);
  const sets = useQuery(api.sets.listSets, {});

  // Weight unit preference
  const { unit, setUnit } = useWeightUnit();

  // Loading state
  if (exercises === undefined || sets === undefined) {
    return (
      <PageLayout title="SETTINGS">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="border border-terminal-border bg-terminal-bg p-4 rounded"
            >
              <div className="h-6 bg-terminal-bgSecondary w-1/3 mb-3 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-terminal-bgSecondary w-full rounded" />
                <div className="h-4 bg-terminal-bgSecondary w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="SETTINGS">
      {/* Exercise Management Section */}
      <ExerciseManager exercises={exercises} sets={sets} />

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
              <h3 className="font-mono text-sm text-terminal-text uppercase mb-1">
                WEIGHT UNIT
              </h3>
              <p className="font-mono text-xs text-terminal-textSecondary">
                Default unit for logging weights
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUnit("lbs")}
                className={`px-4 py-2 font-mono text-sm uppercase transition-colors border ${
                  unit === "lbs"
                    ? "bg-terminal-success text-terminal-bg border-terminal-success"
                    : "bg-terminal-bg text-terminal-text border-terminal-border hover:bg-terminal-bgSecondary"
                }`}
                type="button"
              >
                LBS
              </button>
              <button
                onClick={() => setUnit("kg")}
                className={`px-4 py-2 font-mono text-sm uppercase transition-colors border ${
                  unit === "kg"
                    ? "bg-terminal-success text-terminal-bg border-terminal-success"
                    : "bg-terminal-bg text-terminal-text border-terminal-border hover:bg-terminal-bgSecondary"
                }`}
                type="button"
              >
                KG
              </button>
            </div>
          </div>
        </div>
      </TerminalPanel>
    </PageLayout>
  );
}
