"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ExerciseManager } from "@/components/dashboard/exercise-manager";
import { InlineExerciseCreator } from "@/components/dashboard/inline-exercise-creator";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ExercisesPage() {
  const [showCreator, setShowCreator] = useState(false);
  const exercises = useQuery(api.exercises.listExercises, {
    includeDeleted: false,
  });
  const allSets = useQuery(api.sets.listSets, {});

  // Loading state
  if (exercises === undefined || allSets === undefined) {
    return (
      <PageLayout title="Exercises">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Exercises">
      <Card>
        <CardHeader>
          <CardTitle>Create Exercise</CardTitle>
        </CardHeader>
        <CardContent>
          {!showCreator ? (
            <Button onClick={() => setShowCreator(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          ) : (
            <InlineExerciseCreator
              onCreated={() => setShowCreator(false)}
              onCancel={() => setShowCreator(false)}
            />
          )}
        </CardContent>
      </Card>

      <ExerciseManager exercises={exercises} sets={allSets} />
    </PageLayout>
  );
}
