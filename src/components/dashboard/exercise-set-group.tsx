"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
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
import { Exercise, Set, WeightUnit } from "@/types/domain";

interface ExerciseSetGroupProps {
  exercise: Exercise;
  sets: Set[];
  totalVolume: number;
  totalReps: number;
  preferredUnit: WeightUnit;
  onRepeat: (set: Set) => void;
  onDelete: (setId: Id<"sets">) => void;
}

export function ExerciseSetGroup({
  exercise,
  sets,
  totalVolume,
  totalReps,
  preferredUnit,
  onRepeat,
  onDelete,
}: ExerciseSetGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState<Id<"sets"> | null>(null);
  const [setToDelete, setSetToDelete] = useState<Set | null>(null);

  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US");
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    // Show relative time for sets within last 24 hours
    if (diffMins < 1) return "JUST NOW";
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;

    // Show absolute time for older sets
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleDeleteClick = (set: Set) => {
    setSetToDelete(set);
  };

  const confirmDelete = async () => {
    if (!setToDelete) return;

    setDeletingId(setToDelete._id);
    try {
      await onDelete(setToDelete._id);
      toast.success("Set deleted");
      setSetToDelete(null);
    } catch (error) {
      handleMutationError(error, "Delete Set");
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        {/* Header - Always visible, clickable to expand/collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-base">{exercise.name}</span>
            <span className="text-sm text-muted-foreground">
              {sets.length} set{sets.length === 1 ? "" : "s"} •{" "}
              {totalVolume > 0
                ? `${formatNumber(Math.round(totalVolume))} ${preferredUnit}`
                : `${totalReps} reps`}
            </span>
          </div>
        </button>

        {/* Expanded content - Set list */}
        {isExpanded && (
          <div className="divide-y">
            {sets.map((set) => {
              const isDeleting = deletingId === set._id;
              return (
                <div
                  key={set._id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  {/* Set details */}
                  <div className="flex items-center gap-6">
                    {/* Reps */}
                    <div className="w-16">
                      <span className="font-bold tabular-nums">{set.reps}</span>
                      <span className="text-muted-foreground text-sm ml-1">
                        reps
                      </span>
                    </div>

                    {/* Weight (if present) */}
                    <div className="w-32">
                      {set.weight ? (
                        <>
                          <span className="font-bold tabular-nums">
                            {set.weight}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">
                            {set.unit || preferredUnit}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-sm text-muted-foreground">
                      {formatTime(set.performedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRepeat(set)}
                      disabled={isDeleting}
                      aria-label="Repeat set"
                      className="h-8 w-8 p-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(set)}
                      disabled={isDeleting}
                      aria-label="Delete set"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={setToDelete !== null}
        onOpenChange={(open) => !open && setSetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete set?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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
