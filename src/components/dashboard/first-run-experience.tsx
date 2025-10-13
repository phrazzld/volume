"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TerminalPanel } from "@/components/ui/terminal-panel";
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
    <TerminalPanel
      title="SYSTEM INITIALIZATION"
      titleColor="info"
      showCornerBrackets={true}
      className="mb-3"
    >
      <div className="p-6">
        {/* ASCII Art Box */}
        <div className="text-center mb-6">
          <pre className="text-terminal-info font-mono text-xs mb-4 inline-block">
            {`┌─────────────────┐
│   VOLUME  v0.1  │
│  WORKOUT TRACKER│
└─────────────────┘`}
          </pre>
          <h2 className="text-lg font-bold uppercase text-terminal-text mb-2 font-mono tracking-wider">
            WELCOME TO VOLUME
          </h2>
          <p className="text-terminal-textSecondary font-mono text-sm">
            CREATE YOUR FIRST EXERCISE TO BEGIN TRACKING
          </p>
        </div>

        {/* Inline Exercise Creator */}
        <div className="mb-6 p-4 bg-terminal-bgSecondary border border-terminal-info">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="EXERCISE NAME (e.g., PUSH-UPS)"
              className="flex-1 px-3 py-3 bg-terminal-bg border border-terminal-border text-terminal-text font-mono placeholder-terminal-textMuted focus:border-terminal-info focus:ring-1 focus:ring-terminal-info uppercase"
              disabled={isCreating}
            />
            <button
              type="button"
              onClick={() => handleCreateExercise(name)}
              disabled={!name.trim() || isCreating}
              className="px-6 py-3 bg-terminal-info text-terminal-bg font-bold uppercase font-mono text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isCreating ? "..." : "CREATE"}
            </button>
          </div>
        </div>

        {/* Popular Exercises Quick Create */}
        <div>
          <p className="text-xs font-bold uppercase text-terminal-textSecondary mb-3 font-mono">
            OR SELECT POPULAR EXERCISE:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_EXERCISES.map((exercise) => (
              <button
                key={exercise}
                type="button"
                onClick={() => handleQuickCreate(exercise)}
                disabled={isCreating}
                className="px-4 py-3 text-sm border border-terminal-border text-terminal-text font-mono hover:border-terminal-info hover:text-terminal-info transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                {exercise}
              </button>
            ))}
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}
