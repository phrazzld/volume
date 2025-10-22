"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ExerciseManager } from "@/components/dashboard/exercise-manager";
import { InlineExerciseCreator } from "@/components/dashboard/inline-exercise-creator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeightUnit, WeightUnit } from "@/contexts/WeightUnitContext";
import { PageLayout } from "@/components/layout/page-layout";
import { Plus } from "lucide-react";

// Helper to generate unit button classes
const getUnitButtonClasses = (isActive: boolean) =>
  `px-4 py-2 text-sm transition-colors border rounded ${
    isActive
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-background border-border hover:bg-muted"
  }`;

export default function SettingsPage() {
  const [showCreator, setShowCreator] = useState(false);

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
      <PageLayout title="Settings">
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="h-6 bg-muted w-1/3 mb-3 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-muted w-full rounded" />
                <div className="h-4 bg-muted w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings">
      {/* Exercise Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Create Exercise Section */}
          {!showCreator ? (
            <Button
              onClick={() => setShowCreator(true)}
              className="w-full mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          ) : (
            <div className="mb-4">
              <InlineExerciseCreator
                onCreated={() => setShowCreator(false)}
                onCancel={() => setShowCreator(false)}
              />
            </div>
          )}

          {/* Exercise List */}
          <ExerciseManager exercises={exercises} sets={sets} />
        </CardContent>
      </Card>

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
