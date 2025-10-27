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
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(
    null
  );
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
    <Card>
      <CardHeader>
        <CardTitle>Exercise Registry ({exercises.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop: Table layout */}
        <div className="hidden md:block">
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
                                              handleSaveEdit(
                                                exercise._id,
                                                values
                                              )
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
                            onClick={() => handleDeleteClick(exercise)}
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
        </div>

        {/* Mobile: Card layout */}
        <div className="md:hidden space-y-3">
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
              <div
                key={exercise._id}
                className="border rounded-md p-4 space-y-3 bg-card"
              >
                {/* Name (editable) */}
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
                  <div className="font-medium text-lg">{exercise.name}</div>
                )}

                {/* Metadata */}
                {!isEditing && (
                  <div className="text-sm text-muted-foreground">
                    {createdDate} • {setCount} sets
                  </div>
                )}

                {/* Actions */}
                {!isEditing && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(exercise)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(exercise)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
                        Delete &quot;{exerciseToDelete.name}&quot;? This
                        exercise has {setCountByExercise[exerciseToDelete._id]}{" "}
                        set
                        {setCountByExercise[exerciseToDelete._id] === 1
                          ? ""
                          : "s"}
                        . Deleting will remove it from your exercise list.
                      </>
                    ) : (
                      <>
                        Delete &quot;{exerciseToDelete.name}&quot;? This cannot
                        be undone.
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
      </CardContent>
    </Card>
  );
}
