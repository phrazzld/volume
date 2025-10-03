"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

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

export function FirstRunExperience({ onExerciseCreated }: FirstRunExperienceProps) {
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
      console.error("Failed to create exercise:", error);
      alert("Failed to create exercise. Please try again.");
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
      <div className="text-center mb-6">
        <p className="text-6xl mb-4">🏋️</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome to Volume!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Let&apos;s create your first exercise to start tracking
        </p>
      </div>

      {/* Inline Exercise Creator */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Exercise name (e.g., Push-ups)"
            className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isCreating}
          />
          <button
            type="button"
            onClick={() => handleCreateExercise(name)}
            disabled={!name.trim() || isCreating}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? "..." : "Create"}
          </button>
        </div>
      </div>

      {/* Popular Exercises Quick Create */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Or choose a popular exercise:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPULAR_EXERCISES.map((exercise) => (
            <button
              key={exercise}
              type="button"
              onClick={() => handleQuickCreate(exercise)}
              disabled={isCreating}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exercise}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
