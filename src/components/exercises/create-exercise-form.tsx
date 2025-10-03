"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../../../convex/_generated/api";

export function CreateExerciseForm() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createExercise = useMutation(api.exercises.createExercise);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createExercise({ name: name.trim() });
      setName(""); // Clear form on success
    } catch (error) {
      console.error("Failed to create exercise:", error);
      alert("Failed to create exercise. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name (e.g., Push-ups)"
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isSubmitting}
        required
      />
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
