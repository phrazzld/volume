"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState, useRef, useImperativeHandle, forwardRef, useEffect, KeyboardEvent } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { InlineExerciseCreator } from "./inline-exercise-creator";

interface Exercise {
  _id: Id<"exercises">;
  name: string;
}

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  performedAt: number;
}

interface QuickLogFormProps {
  exercises: Exercise[];
  onSetLogged?: (setId: Id<"sets">) => void;
}

export interface QuickLogFormHandle {
  repeatSet: (set: Set) => void;
}

const QuickLogFormComponent = forwardRef<QuickLogFormHandle, QuickLogFormProps>(
  function QuickLogForm({ exercises, onSetLogged }, ref) {
    const [selectedExerciseId, setSelectedExerciseId] = useState<Id<"exercises"> | "">("");
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInlineCreator, setShowInlineCreator] = useState(false);
    const exerciseSelectRef = useRef<HTMLSelectElement>(null);
    const repsInputRef = useRef<HTMLInputElement>(null);
    const weightInputRef = useRef<HTMLInputElement>(null);

    const logSet = useMutation(api.sets.logSet);

    // Expose repeatSet method to parent via ref
    useImperativeHandle(ref, () => ({
      repeatSet: (set: Set) => {
        setSelectedExerciseId(set.exerciseId);
        setReps(set.reps.toString());
        setWeight(set.weight?.toString() || "");
        // Auto-focus reps input for quick edit
        setTimeout(() => repsInputRef.current?.focus(), 100);
      },
    }));

    // Auto-focus reps when exercise is selected
    useEffect(() => {
      if (selectedExerciseId && repsInputRef.current) {
        repsInputRef.current.focus();
      }
    }, [selectedExerciseId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedExerciseId || !reps || isSubmitting) return;

    const repsNum = parseInt(reps, 10);
    if (repsNum <= 0) {
      alert("Reps must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const setId = await logSet({
        exerciseId: selectedExerciseId as Id<"exercises">,
        reps: repsNum,
        weight: weight ? parseFloat(weight) : undefined,
      });

      // Clear form inputs (keep exercise selected for quick re-logging)
      setReps("");
      setWeight("");

      // Focus exercise selector for quick re-logging
      setTimeout(() => exerciseSelectRef.current?.focus(), 100);

      // Notify parent
      onSetLogged?.(setId);
    } catch (error) {
      console.error("Failed to log set:", error);
      alert("Failed to log set. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key in reps input - focus weight or submit
  const handleRepsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (weightInputRef.current) {
        weightInputRef.current.focus();
      }
    }
  };

  // Handle Enter key in weight input - submit form
  const handleWeightKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <TerminalPanel title="LOG SET" titleColor="success" className="mb-3">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exercise Selector */}
          <div>
            <label
              htmlFor="exercise"
              className="block text-xs uppercase text-terminal-textSecondary mb-1 font-mono"
            >
              EXERCISE *
            </label>
            <select
              ref={exerciseSelectRef}
              id="exercise"
              value={selectedExerciseId}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "CREATE_NEW") {
                  setShowInlineCreator(true);
                  setSelectedExerciseId("");
                } else {
                  setSelectedExerciseId(value as Id<"exercises">);
                }
              }}
              className="w-full px-3 py-2 bg-terminal-bgSecondary border border-terminal-border text-terminal-text font-mono tabular-nums focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
              required
              disabled={isSubmitting}
            >
              <option value="">SELECT...</option>
              {exercises.map((exercise) => (
                <option key={exercise._id} value={exercise._id}>
                  {exercise.name}
                </option>
              ))}
              <option value="CREATE_NEW">+ CREATE NEW</option>
            </select>
          </div>

          {/* Reps Input */}
          <div>
            <label
              htmlFor="reps"
              className="block text-xs uppercase text-terminal-textSecondary mb-1 font-mono"
            >
              REPS *
            </label>
            <input
              ref={repsInputRef}
              id="reps"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onKeyDown={handleRepsKeyDown}
              placeholder="0"
              className="w-full px-3 py-2 bg-terminal-bgSecondary border border-terminal-border text-terminal-text font-mono tabular-nums placeholder-terminal-textMuted focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Weight Input */}
          <div>
            <label
              htmlFor="weight"
              className="block text-xs uppercase text-terminal-textSecondary mb-1 font-mono"
            >
              WEIGHT (LBS)
            </label>
            <input
              ref={weightInputRef}
              id="weight"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={handleWeightKeyDown}
              placeholder="0.0"
              className="w-full px-3 py-2 bg-terminal-bgSecondary border border-terminal-border text-terminal-text font-mono tabular-nums placeholder-terminal-textMuted focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-terminal-success text-terminal-bg font-bold uppercase font-mono text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              disabled={!selectedExerciseId || !reps || isSubmitting}
            >
              {isSubmitting ? "LOGGING..." : "LOG SET"}
            </button>
          </div>
        </div>

        {/* Inline Exercise Creator (conditional) */}
        {showInlineCreator && (
          <div className="mt-4">
            <InlineExerciseCreator
              onCreated={(exerciseId) => {
                setSelectedExerciseId(exerciseId);
                setShowInlineCreator(false);
              }}
              onCancel={() => setShowInlineCreator(false)}
            />
          </div>
        )}
      </form>
    </TerminalPanel>
  );
  }
);

export const QuickLogForm = QuickLogFormComponent;
