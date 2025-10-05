"use client";

import { useMutation } from "convex/react";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface InlineExerciseCreatorProps {
  onCreated: (exerciseId: Id<"exercises">) => void;
  onCancel: () => void;
}

export function InlineExerciseCreator({
  onCreated,
  onCancel,
}: InlineExerciseCreatorProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createExercise = useMutation(api.exercises.createExercise);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreateExercise = async () => {
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const exerciseId = await createExercise({ name: name.trim() });
      onCreated(exerciseId);
    } catch (error) {
      console.error("Failed to create exercise:", error);
      alert("Failed to create exercise. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateExercise();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="p-3 bg-terminal-bgSecondary border border-terminal-border">
      <p className="text-xs uppercase text-terminal-textSecondary mb-2 font-mono">
        CREATE NEW EXERCISE
      </p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="EXERCISE NAME..."
          className="flex-1 px-3 py-3 bg-terminal-bg border border-terminal-border text-terminal-text font-mono placeholder-terminal-textMuted focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
          disabled={isCreating}
        />
        <button
          type="button"
          onClick={handleCreateExercise}
          disabled={!name.trim() || isCreating}
          className="px-4 py-3 bg-terminal-success text-terminal-bg font-bold uppercase font-mono text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "..." : "CREATE"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 bg-terminal-bgSecondary border border-terminal-border text-terminal-textSecondary font-mono text-sm uppercase hover:text-terminal-text hover:border-terminal-borderLight"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
