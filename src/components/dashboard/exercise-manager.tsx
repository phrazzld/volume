"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";
import { Exercise, Set } from "@/types/domain";

// Validation schema for exercise name edit
const exerciseEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type ExerciseEditFormValues = z.infer<typeof exerciseEditSchema>;

interface ExerciseManagerProps {
  exercises: Exercise[];
  sets: Set[];
}

export function ExerciseManager({ exercises, sets }: ExerciseManagerProps) {
  const [editingId, setEditingId] = useState<Id<"exercises"> | null>(null);
  const updateExercise = useMutation(api.exercises.updateExercise);
  const deleteExercise = useMutation(api.exercises.deleteExercise);

  const editForm = useForm<ExerciseEditFormValues>({
    resolver: zodResolver(exerciseEditSchema),
    defaultValues: {
      name: "",
    },
  });

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
    editForm.reset({ name: exercise.name });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    editForm.reset({ name: "" });
  };

  const handleSaveEdit = async (
    exerciseId: Id<"exercises">,
    values: ExerciseEditFormValues
  ) => {
    try {
      await updateExercise({ id: exerciseId, name: values.name.trim() });
      setEditingId(null);
      editForm.reset({ name: "" });
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
                      <Form {...editForm}>
                        <form
                          onSubmit={editForm.handleSubmit((values) =>
                            handleSaveEdit(exercise._id, values)
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="text"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          editForm.handleSubmit((values) =>
                                            handleSaveEdit(exercise._id, values)
                                          )();
                                        }
                                        if (e.key === "Escape") {
                                          e.preventDefault();
                                          handleCancelEdit();
                                        }
                                      }}
                                      className="flex-1"
                                      autoFocus
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <button
                              type="submit"
                              className="p-2 hover:opacity-80"
                              title="Save"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-2 text-muted-foreground hover:opacity-80"
                              title="Cancel"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </form>
                      </Form>
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
