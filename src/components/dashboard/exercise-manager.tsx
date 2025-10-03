"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { TerminalTable } from "@/components/ui/terminal-table";

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
}

export function ExerciseManager({ exercises, sets }: ExerciseManagerProps) {
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

  // Build table rows
  const rows = exercises.map((exercise) => {
    const isEditing = editingId === exercise._id;
    const setCount = setCountByExercise[exercise._id] || 0;
    const shortId = exercise._id.slice(0, 6);
    const createdDate = new Date(exercise.createdAt).toLocaleDateString(
      "en-US",
      { month: "2-digit", day: "2-digit", year: "2-digit" }
    );

    return [
      // ID
      <span className="text-terminal-textMuted">{shortId}</span>,

      // NAME (editable inline)
      isEditing ? (
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
            className="flex-1 px-2 py-1 bg-terminal-bgSecondary border border-terminal-info text-terminal-text font-mono focus:ring-1 focus:ring-terminal-info"
            autoFocus
          />
          <button
            onClick={() => handleSaveEdit(exercise._id)}
            className="p-1 text-terminal-success hover:opacity-80"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 text-terminal-textSecondary hover:opacity-80"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <span className="text-terminal-text font-medium">{exercise.name}</span>
      ),

      // CREATED
      <span className="text-terminal-textSecondary">{createdDate}</span>,

      // SETS
      <span className="text-terminal-info">{setCount}</span>,

      // ACTIONS
      !isEditing ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStartEdit(exercise)}
            className="p-1 text-terminal-info hover:opacity-80 transition-opacity"
            title="Edit exercise name"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(exercise)}
            className="p-1 text-terminal-danger hover:opacity-80 transition-opacity"
            title="Delete exercise"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="h-6"></div> // Spacer during edit
      ),
    ];
  });

  return (
    <TerminalPanel
      title="EXERCISE REGISTRY"
      titleColor="accent"
      className="mb-3"
    >
      <div className="p-4">
        <TerminalTable
          headers={["ID", "NAME", "CREATED", "SETS", "ACTIONS"]}
          rows={rows}
          columnWidths={["w-20", "", "w-28", "w-16", "w-24"]}
        />
      </div>
    </TerminalPanel>
  );
}
