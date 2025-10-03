"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CreateExerciseForm } from "@/components/exercises/create-exercise-form";
import { Id } from "../../../convex/_generated/dataModel";

export default function ExercisesPage() {
  const exercises = useQuery(api.exercises.listExercises);
  const deleteExercise = useMutation(api.exercises.deleteExercise);

  const handleDelete = async (id: Id<"exercises">) => {
    if (!confirm("Delete this exercise? This cannot be undone.")) return;

    try {
      await deleteExercise({ id });
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      alert("Failed to delete exercise. Please try again.");
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Exercises</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Create New Exercise</h2>
        <CreateExerciseForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Your Exercises</h2>

        {exercises === undefined ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : exercises.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No exercises yet. Create your first one above!
          </p>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <div
                key={exercise._id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created {new Date(exercise.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(exercise._id)}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
