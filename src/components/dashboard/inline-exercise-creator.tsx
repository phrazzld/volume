"use client";

import { useMutation } from "convex/react";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";

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
      toast.success("Exercise created");
      onCreated(exerciseId);
    } catch (error) {
      handleMutationError(error, "Create Exercise");
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
        <Button
          type="button"
          onClick={handleCreateExercise}
          disabled={!name.trim() || isCreating}
        >
          {isCreating ? "..." : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
