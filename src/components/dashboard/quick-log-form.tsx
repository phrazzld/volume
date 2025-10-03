"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
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
    const repsInputRef = useRef<HTMLInputElement>(null);

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

      // Notify parent
      onSetLogged?.(setId);
    } catch (error) {
      console.error("Failed to log set:", error);
      alert("Failed to log set. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Quick Log
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Exercise Selector */}
        <div>
          <label
            htmlFor="exercise"
            className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100"
          >
            Exercise <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            id="exercise"
            value={selectedExerciseId}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "CREATE_NEW") {
                setShowInlineCreator(true);
                setSelectedExerciseId(""); // Clear selection when creating
              } else {
                setSelectedExerciseId(value as Id<"exercises">);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          >
            <option value="">Select an exercise...</option>
            {exercises.map((exercise) => (
              <option key={exercise._id} value={exercise._id}>
                {exercise.name}
              </option>
            ))}
            <option value="CREATE_NEW">+ Create new exercise</option>
          </select>
        </div>

        {/* Inline Exercise Creator (conditional) */}
        {showInlineCreator && (
          <InlineExerciseCreator
            onCreated={(exerciseId) => {
              setSelectedExerciseId(exerciseId);
              setShowInlineCreator(false);
            }}
            onCancel={() => setShowInlineCreator(false)}
          />
        )}

        {/* Reps Input */}
        <div>
          <label
            htmlFor="reps"
            className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100"
          >
            Reps <span className="text-red-500 dark:text-red-400">*</span>
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
            placeholder="How many reps?"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Weight Input */}
        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100"
          >
            Weight (lbs)
          </label>
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={!selectedExerciseId || !reps || isSubmitting}
        >
          {isSubmitting ? "Logging..." : "Log Set"}
        </button>
      </form>
    </div>
  );
  }
);

export const QuickLogForm = QuickLogFormComponent;
