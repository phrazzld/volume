"use client";

import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState, useRef, useImperativeHandle, forwardRef, useEffect, KeyboardEvent, useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { InlineExerciseCreator } from "./inline-exercise-creator";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";

interface Exercise {
  _id: Id<"exercises">;
  name: string;
}

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  unit?: string; // "lbs" or "kg" - stored with set for data integrity
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
    const { unit, toggleUnit } = useWeightUnit();

    /*
     * Autofocus Flow:
     * 1. User selects exercise → auto-focus reps input (useEffect below)
     * 2. User enters reps, presses Enter → focus weight input (handleRepsKeyDown)
     * 3. User enters weight, presses Enter → submit form (handleWeightKeyDown)
     * 4. After successful submit → focus reps input for next set (handleSubmit)
     * Note: Exercise stays selected after submit for quick multi-set logging
     */

    // Query last set for selected exercise
    const allSets = useQuery(api.sets.listSets, {});

    // Find last set for selected exercise
    const lastSet = useMemo(() => {
      if (!selectedExerciseId || !allSets) return null;
      const exerciseSets = allSets.filter(s => s.exerciseId === selectedExerciseId);
      if (exerciseSets.length === 0) return null;
      return exerciseSets[0]; // Already sorted by performedAt desc
    }, [selectedExerciseId, allSets]);

    // Format time ago
    const formatTimeAgo = (timestamp: number) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return `${seconds} SEC AGO`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} MIN AGO`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} HR AGO`;
      const days = Math.floor(hours / 24);
      return `${days} DAY${days === 1 ? '' : 'S'} AGO`;
    };

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

    // Auto-focus flow: exercise selected → focus reps input
    useEffect(() => {
      if (selectedExerciseId && repsInputRef.current) {
        repsInputRef.current.focus();
      }
    }, [selectedExerciseId]);

  // Extract submit logic to avoid type casting
  const submitForm = async () => {
    if (!selectedExerciseId || !reps || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const setId = await logSet({
        exerciseId: selectedExerciseId as Id<"exercises">,
        reps: parseFloat(reps),
        weight: weight ? parseFloat(weight) : undefined,
        unit: weight ? unit : undefined, // Store unit with set for data integrity
      });

      // Clear form inputs (keep exercise selected for quick re-logging)
      setReps("");
      setWeight("");

      // Focus reps input for quick re-logging of same exercise
      setTimeout(() => repsInputRef.current?.focus(), 100);

      // Show success toast
      toast.success("Set logged!");

      // Notify parent
      onSetLogged?.(setId);
    } catch (error) {
      handleMutationError(error, "Log Set");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm();
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
      submitForm();
    }
  };

  return (
    <TerminalPanel
      title="LOG SET"
      titleColor="success"
      showCornerBrackets={true}
      className="mb-3"
    >
      <form onSubmit={handleSubmit} className="p-4">
        {/* Last Set Indicator */}
        {lastSet && (
          <div className="mb-4 p-2 bg-terminal-bgSecondary border border-terminal-border flex items-center justify-between">
            <p className="text-xs uppercase text-terminal-info font-mono">
              LAST: {exercises.find(e => e._id === selectedExerciseId)?.name} • {lastSet.reps} REPS
              {lastSet.weight && ` @ ${lastSet.weight} ${(lastSet.unit || unit).toUpperCase()}`} • {formatTimeAgo(lastSet.performedAt)}
            </p>
            <button
              type="button"
              onClick={() => {
                setReps(lastSet.reps.toString());
                setWeight(lastSet.weight?.toString() || "");
                repsInputRef.current?.focus();
              }}
              className="ml-2 px-2 py-1 text-xs uppercase font-mono border border-terminal-info text-terminal-info hover:bg-terminal-info hover:bg-opacity-10 transition-colors"
            >
              USE
            </button>
          </div>
        )}

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
              className="w-full px-3 py-3 bg-terminal-bgSecondary border border-terminal-border text-terminal-text font-mono tabular-nums focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
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
              placeholder="HOW MANY?"
              className="w-full px-3 py-3 bg-terminal-bgSecondary border border-terminal-border text-terminal-text font-mono tabular-nums placeholder-terminal-textMuted focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Weight Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="weight"
                className="text-xs uppercase text-terminal-textSecondary font-mono"
              >
                WEIGHT ({unit.toUpperCase()})
              </label>
              <button
                type="button"
                onClick={toggleUnit}
                className="text-xs uppercase font-mono text-terminal-info hover:text-terminal-accent transition-colors border border-terminal-info px-2 py-0.5 hover:bg-terminal-info hover:bg-opacity-10"
                aria-label="Toggle weight unit"
              >
                {unit === "lbs" ? "→ KG" : "→ LBS"}
              </button>
            </div>
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
              placeholder="OPTIONAL"
              className="w-full px-3 py-3 bg-terminal-bgSecondary border border-terminal-border text-terminal-text font-mono tabular-nums placeholder-terminal-textMuted focus:border-terminal-info focus:ring-1 focus:ring-terminal-info"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-3 bg-terminal-success text-terminal-bg font-bold uppercase font-mono text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
