"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface Exercise {
  _id: Id<"exercises">;
  name: string;
  createdAt: number;
}

interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  performedAt: number;
}

interface ExerciseManagerProps {
  exercises: Exercise[];
  sets: Set[];
  expanded: boolean;
  onToggle: () => void;
}

export function ExerciseManager({
  exercises,
  sets,
  expanded,
  onToggle,
}: ExerciseManagerProps) {
  const [editingId, setEditingId] = useState<Id<"exercises"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const updateExercise = useMutation(api.exercises.updateExercise);
  const deleteExercise = useMutation(api.exercises.deleteExercise);

  // Calculate set count per exercise
  const setCountByExercise = sets.reduce((acc, set) => {
    acc[set.exerciseId] = (acc[set.exerciseId] || 0) + 1;
    return acc;
  }, {} as Record<Id<"exercises">, number>);

  const handleStartEdit = (exercise: Exercise) => {
    setEditingId(exercise._id);
    setEditingName(exercise.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (exerciseId: Id<"exercises">) => {
    if (!editingName.trim()) return;

    try {
      await updateExercise({ id: exerciseId, name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.error("Failed to update exercise:", error);
      alert("Failed to update exercise. Please try again.");
    }
  };

  const handleDelete = async (exercise: Exercise) => {
    const setCount = setCountByExercise[exercise._id] || 0;
    const message =
      setCount > 0
        ? `Delete "${exercise.name}"? This exercise has ${setCount} set${
            setCount === 1 ? "" : "s"
          }. Deleting will remove it from your exercise list.`
        : `Delete "${exercise.name}"? This cannot be undone.`;

    if (!confirm(message)) return;

    try {
      await deleteExercise({ id: exercise._id });
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      alert("Failed to delete exercise. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-expanded={expanded}
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Manage Exercises
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({exercises.length})
          </span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? "max-h-[600px] mt-4" : "max-h-0"
        }`}
      >
        {exercises.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No exercises yet. Create one using the form below!
          </p>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => {
              const isEditing = editingId === exercise._id;
              const setCount = setCountByExercise[exercise._id] || 0;

              return (
                <div
                  key={exercise._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit(exercise._id);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 px-3 py-1 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(exercise._id)}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Save"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {exercise.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created {new Date(exercise.createdAt).toLocaleDateString()}
                          {setCount > 0 && (
                            <span className="ml-2">
                              • Used in {setCount} set{setCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleStartEdit(exercise)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit exercise name"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exercise)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete exercise"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
