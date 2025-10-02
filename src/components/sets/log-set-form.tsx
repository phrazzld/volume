"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ExerciseSelector } from "../exercises/exercise-selector";

export function LogSetForm() {
  const [exerciseId, setExerciseId] = useState<Id<"exercises"> | "">("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const logSet = useMutation(api.sets.logSet);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!exerciseId || !reps || isSubmitting) return;

    const repsNum = parseInt(reps, 10);
    if (repsNum <= 0) {
      alert("Reps must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      await logSet({
        exerciseId: exerciseId as Id<"exercises">,
        reps: repsNum,
        weight: weight ? parseFloat(weight) : undefined,
      });

      // Clear form and show success
      setReps("");
      setWeight("");
      setSuccessMessage("Set logged successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to log set:", error);
      alert("Failed to log set. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Exercise</label>
        <ExerciseSelector
          onSelect={(id) => setExerciseId(id)}
          selectedId={exerciseId || undefined}
        />
      </div>

      <div>
        <label htmlFor="reps" className="block text-sm font-medium mb-2">
          Reps <span className="text-red-500">*</span>
        </label>
        <input
          id="reps"
          type="number"
          min="1"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Number of reps"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="weight" className="block text-sm font-medium mb-2">
          Weight (optional)
        </label>
        <input
          id="weight"
          type="number"
          step="0.5"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Weight in lbs/kg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !exerciseId || !reps}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Logging..." : "Log Set"}
      </button>
    </form>
  );
}
