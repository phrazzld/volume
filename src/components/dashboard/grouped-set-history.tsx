"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
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
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";
import { Exercise, Set } from "@/types/domain";

interface GroupedSetHistoryProps {
  groupedSets: Array<{
    date: string;
    displayDate: string;
    sets: Set[];
  }>;
  exerciseMap: Map<Id<"exercises">, Exercise>;
  onRepeat: (set: Set) => void;
  onDelete: (setId: Id<"sets">) => void;
}

export function GroupedSetHistory({
  groupedSets,
  exerciseMap,
  onRepeat,
  onDelete,
}: GroupedSetHistoryProps) {
  const [deletingId, setDeletingId] = useState<Id<"sets"> | null>(null);
  const [setToDelete, setSetToDelete] = useState<Set | null>(null);
  const { unit: preferredUnit } = useWeightUnit();

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

  if (groupedSets.length === 0) {
    return (
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>Set History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              No sets logged yet
            </p>
            <p className="text-sm mb-1">Start your journey! 🚀</p>
            <p className="text-muted-foreground text-xs mt-2">
              Log your first set above
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine today's date for default expansion
  const todayDate = new Date().toDateString();

  return (
    <div className="space-y-3">
      {groupedSets.map((group) => {
        return (
          <Card key={group.date}>
            <CardHeader>
              <CardTitle>
                {group.displayDate} ({group.sets.length} set
                {group.sets.length === 1 ? "" : "s"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Time</TableHead>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="w-16">Reps</TableHead>
                    <TableHead className="w-20">Weight</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.sets.map((set) => {
                    const exercise = exerciseMap.get(set.exerciseId); // O(1) lookup
                    const isDeleting = deletingId === set._id;

                    return (
                      <TableRow key={set._id}>
                        {/* TIME */}
                        <TableCell className="text-muted-foreground">
                          {formatTime(set.performedAt)}
                        </TableCell>

                        {/* EXERCISE */}
                        <TableCell>{exercise?.name || "Unknown"}</TableCell>

                        {/* REPS */}
                        <TableCell className="font-bold">{set.reps}</TableCell>

                        {/* WEIGHT */}
                        <TableCell className="font-bold">
                          {set.weight
                            ? `${set.weight} ${set.unit || preferredUnit}`
                            : "-"}
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onRepeat(set)}
                              className="flex items-center gap-1 px-2 py-1 hover:bg-muted transition-colors rounded"
                              aria-label="Repeat this set"
                              title="Repeat this set"
                              type="button"
                              disabled={isDeleting}
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span className="text-xs">Repeat</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(set)}
                              className="p-2 text-destructive hover:opacity-80 transition-opacity"
                              aria-label="Delete this set"
                              title="Delete this set"
                              type="button"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!setToDelete}
        onOpenChange={(open) => !open && setSetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Set</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this set? This cannot be undone.
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
    </div>
  );
}
