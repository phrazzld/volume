"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";
import { Exercise, Set } from "@/types/domain";

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
  const setCountByExercise = sets.reduce(
    (acc, set) => {
      acc[set.exerciseId] = (acc[set.exerciseId] || 0) + 1;
      return acc;
    },
    {} as Record<Id<"exercises">, number>
  );

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
      toast.success("Exercise updated");
    } catch (error) {
      handleMutationError(error, "Update Exercise");
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
      toast.success("Exercise deleted");
    } catch (error) {
      handleMutationError(error, "Delete Exercise");
    }
  };

  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle>Exercise Registry ({exercises.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Created</TableHead>
              <TableHead className="w-16">Sets</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => {
              const isEditing = editingId === exercise._id;
              const setCount = setCountByExercise[exercise._id] || 0;
              const shortId = exercise._id.slice(0, 6);
              const createdDate = new Date(
                exercise.createdAt
              ).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              });

              return (
                <TableRow key={exercise._id}>
                  {/* ID */}
                  <TableCell className="text-muted-foreground">
                    {shortId}
                  </TableCell>

                  {/* NAME (editable inline) */}
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
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
                          className="flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(exercise._id)}
                          className="p-2 hover:opacity-80"
                          title="Save"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-muted-foreground hover:opacity-80"
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium">{exercise.name}</span>
                    )}
                  </TableCell>

                  {/* CREATED */}
                  <TableCell className="text-muted-foreground">
                    {createdDate}
                  </TableCell>

                  {/* SETS */}
                  <TableCell>{setCount}</TableCell>

                  {/* ACTIONS */}
                  <TableCell>
                    {!isEditing ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(exercise)}
                          className="p-2 hover:opacity-80 transition-opacity"
                          title="Edit exercise name"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exercise)}
                          className="p-2 text-destructive hover:opacity-80 transition-opacity"
                          title="Delete exercise"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-6"></div> // Spacer during edit
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
