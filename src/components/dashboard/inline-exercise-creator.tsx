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
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New exercise name..."
          className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
        />
        <button
          type="button"
          onClick={handleCreateExercise}
          disabled={!name.trim() || isCreating}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCreating ? "..." : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
