"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { SettingsList } from "@/components/ui/settings-list";
import { SettingsListItem } from "@/components/ui/settings-list-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";
import { Exercise, Set } from "@/types/domain";

interface ExerciseManagerProps {
  exercises: Exercise[];
  sets: Set[];
}

export function ExerciseManager({ exercises, sets }: ExerciseManagerProps) {
  const [editingId, setEditingId] = useState<Id<"exercises"> | null>(null);
  const [editValue, setEditValue] = useState("");
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(
    null
  );
  const updateExercise = useMutation(api.exercises.updateExercise);
  const deleteExercise = useMutation(api.exercises.deleteExercise);

  // Calculate set count per exercise
  const setCountByExercise = sets.reduce(
    (acc, set) => {
      acc[set.exerciseId] = (acc[set.exerciseId] || 0) + 1;
      return acc;
    },
    {} as Record<Id<"exercises">, number>
  );

  const handleStartEdit = (exercise: Exercise) => {
    setEditingId(exercise._id);
    setEditValue(exercise.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (exerciseId: Id<"exercises">) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      toast.error("Exercise name cannot be empty");
      return;
    }

    try {
      await updateExercise({ id: exerciseId, name: trimmed });
      setEditingId(null);
      setEditValue("");
      toast.success("Exercise updated");
    } catch (error) {
      handleMutationError(error, "Update Exercise");
    }
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete) return;

    try {
      await deleteExercise({ id: exerciseToDelete._id });
      toast.success("Exercise deleted");
      setExerciseToDelete(null);
    } catch (error) {
      handleMutationError(error, "Delete Exercise");
    }
  };

  return (
    <>
      <SettingsList>
        {exercises.map((exercise) => {
          const isEditing = editingId === exercise._id;
          const setCount = setCountByExercise[exercise._id] || 0;
          const createdDate = new Date(exercise.createdAt).toLocaleDateString(
            "en-US",
            {
              month: "2-digit",
              day: "2-digit",
              year: "2-digit",
            }
          );

          return (
            <SettingsListItem
              key={exercise._id}
              title={
                isEditing ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveEdit(exercise._id)}
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
                    autoFocus
                    className="h-8 text-sm -my-1"
                  />
                ) : (
                  exercise.name
                )
              }
              subtitle={`${createdDate} • ${setCount} sets`}
              actions={
                !isEditing && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(exercise)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteClick(exercise)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </>
                )
              }
            />
          );
        })}
      </SettingsList>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!exerciseToDelete}
        onOpenChange={(open) => !open && setExerciseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              {exerciseToDelete && (
                <>
                  {setCountByExercise[exerciseToDelete._id] > 0 ? (
                    <>
                      Delete &quot;{exerciseToDelete.name}&quot;? This exercise
                      has {setCountByExercise[exerciseToDelete._id]} set
                      {setCountByExercise[exerciseToDelete._id] === 1
                        ? ""
                        : "s"}
                      . Deleting will remove it from your exercise list.
                    </>
                  ) : (
                    <>
                      Delete &quot;{exerciseToDelete.name}&quot;? This cannot be
                      undone.
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
