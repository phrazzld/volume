"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { handleMutationError } from "@/lib/error-handler";

interface FirstRunExperienceProps {
  onExerciseCreated: (exerciseId: Id<"exercises">) => void;
}

const POPULAR_EXERCISES = [
  "Push-ups",
  "Pull-ups",
  "Squats",
  "Bench Press",
  "Deadlift",
  "Rows",
];

export function FirstRunExperience({
  onExerciseCreated,
}: FirstRunExperienceProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createExercise = useMutation(api.exercises.createExercise);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreateExercise = async (exerciseName: string) => {
    if (!exerciseName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const exerciseId = await createExercise({ name: exerciseName.trim() });
      onExerciseCreated(exerciseId);
    } catch (error) {
      handleMutationError(error, "Create Exercise");
      setIsCreating(false);
    }
  };

  const handleQuickCreate = (exerciseName: string) => {
    handleCreateExercise(exerciseName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateExercise(name);
    }
  };

  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle>Welcome to Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-sm mb-4">
            Create your first exercise to begin tracking
          </p>
        </div>

        {/* Inline Exercise Creator */}
        <div className="mb-6 p-4 border rounded-md">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Exercise name (e.g., Push-ups)"
              className="flex-1 px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isCreating}
            />
            <button
              type="button"
              onClick={() => handleCreateExercise(name)}
              disabled={!name.trim() || isCreating}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isCreating ? "..." : "Create"}
            </button>
          </div>
        </div>

        {/* Popular Exercises Quick Create */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-3">
            Or select popular exercise:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_EXERCISES.map((exercise) => (
              <button
                key={exercise}
                type="button"
                onClick={() => handleQuickCreate(exercise)}
                disabled={isCreating}
                className="px-4 py-3 text-sm border rounded-md hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exercise}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
