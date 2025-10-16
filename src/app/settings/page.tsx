"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ExerciseManager } from "@/components/dashboard/exercise-manager";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWeightUnit, WeightUnit } from "@/contexts/WeightUnitContext";
import { PageLayout } from "@/components/layout/page-layout";

// Helper to generate unit button classes
const getUnitButtonClasses = (isActive: boolean) =>
  `px-4 py-2 text-sm transition-colors border rounded ${
    isActive
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-background border-border hover:bg-muted"
  }`;

export default function SettingsPage() {
  // Fetch exercises and sets for ExerciseManager (active only)
  const exercises = useQuery(api.exercises.listExercises, {
    includeDeleted: false,
  });
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
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Weight Unit Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium mb-1">Weight Unit</h3>
              <p className="text-xs text-muted-foreground">
                Default unit for logging weights
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUnit("lbs")}
                className={getUnitButtonClasses(unit === "lbs")}
                type="button"
              >
                LBS
              </button>
              <button
                onClick={() => setUnit("kg")}
                className={getUnitButtonClasses(unit === "kg")}
                type="button"
              >
                KG
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
