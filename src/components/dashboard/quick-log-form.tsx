"use client";

import { useMutation, useQuery } from "convex/react";
import {
  FormEvent,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  KeyboardEvent,
  useMemo,
} from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineExerciseCreator } from "./inline-exercise-creator";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";
import { Exercise, Set } from "@/types/domain";
import { z } from "zod";

// Validation schema for quick log form
const quickLogSchema = z.object({
  exerciseId: z.string().min(1, "Exercise is required"),
  reps: z.coerce.number().min(1, "Reps must be at least 1"),
  weight: z.coerce.number().optional(),
  unit: z.enum(["lbs", "kg"]).optional(),
});

type QuickLogFormValues = z.infer<typeof quickLogSchema>;

interface QuickLogFormProps {
  exercises: Exercise[];
  onSetLogged?: (setId: Id<"sets">) => void;
}

export interface QuickLogFormHandle {
  repeatSet: (set: Set) => void;
}

const QuickLogFormComponent = forwardRef<QuickLogFormHandle, QuickLogFormProps>(
  function QuickLogForm({ exercises, onSetLogged }, ref) {
    const [selectedExerciseId, setSelectedExerciseId] = useState<
      Id<"exercises"> | ""
    >("");
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInlineCreator, setShowInlineCreator] = useState(false);
    const repsInputRef = useRef<HTMLInputElement>(null);
    const weightInputRef = useRef<HTMLInputElement>(null);

    const logSet = useMutation(api.sets.logSet);
    const { unit, toggleUnit } = useWeightUnit();

    /*
     * Autofocus Flow:
     * 1. User selects exercise → auto-focus reps input (useEffect below)
     * 2. User enters reps, presses Enter → focus weight input (handleRepsKeyDown)
     * 3. User enters weight, presses Enter → submit form (handleWeightKeyDown)
     * 4. After successful submit → focus reps input for next set (handleSubmit)
     * Note: Exercise stays selected after submit for quick multi-set logging
     */

    /**
     * Robust focus helper for mobile Safari compatibility
     * Uses double requestAnimationFrame to ensure:
     * - All React re-renders complete before focusing
     * - Element is stable in the DOM
     * - iOS Safari security model is respected
     *
     * Research: setTimeout can fail on mobile due to:
     * 1. React re-render race conditions
     * 2. iOS focus security restrictions
     * 3. Virtual keyboard animation conflicts
     *
     * Double RAF is the most reliable pattern for mobile focus.
     */
    const focusElement = (ref: React.RefObject<HTMLInputElement | null>) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Defensive checks before focusing
          if (ref.current && document.contains(ref.current)) {
            try {
              ref.current.focus();
            } catch (e) {
              // Fail silently if focus is not possible
              console.warn("Focus failed:", e);
            }
          }
        });
      });
    };

    // Query last set for selected exercise
    const allSets = useQuery(api.sets.listSets, {});

    // Find last set for selected exercise
    const lastSet = useMemo(() => {
      if (!selectedExerciseId || !allSets) return null;
      const exerciseSets = allSets.filter(
        (s) => s.exerciseId === selectedExerciseId
      );
      if (exerciseSets.length === 0) return null;
      return exerciseSets[0]; // Already sorted by performedAt desc
    }, [selectedExerciseId, allSets]);

    // Format time ago
    const formatTimeAgo = (timestamp: number) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return `${seconds} SEC AGO`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} MIN AGO`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} HR AGO`;
      const days = Math.floor(hours / 24);
      return `${days} DAY${days === 1 ? "" : "S"} AGO`;
    };

    // Expose repeatSet method to parent via ref
    useImperativeHandle(ref, () => ({
      repeatSet: (set: Set) => {
        setSelectedExerciseId(set.exerciseId);
        setReps(set.reps.toString());
        setWeight(set.weight?.toString() || "");
        // Auto-focus reps input for quick edit
        focusElement(repsInputRef);
      },
    }));

    // Auto-focus flow: exercise selected → focus reps input
    useEffect(() => {
      if (selectedExerciseId) {
        focusElement(repsInputRef);
      }
    }, [selectedExerciseId]);

    // Extract submit logic to avoid type casting
    const submitForm = async () => {
      if (!selectedExerciseId || !reps || isSubmitting) return;

      setIsSubmitting(true);

      try {
        const setId = await logSet({
          exerciseId: selectedExerciseId as Id<"exercises">,
          reps: parseFloat(reps),
          weight: weight ? parseFloat(weight) : undefined,
          unit: weight ? unit : undefined, // Store unit with set for data integrity
        });

        // Clear form inputs (keep exercise selected for quick re-logging)
        setReps("");
        setWeight("");

        // Focus reps input for quick re-logging of same exercise
        focusElement(repsInputRef);

        // Show success toast
        toast.success("Set logged!");

        // Notify parent
        onSetLogged?.(setId);
      } catch (error) {
        handleMutationError(error, "Log Set");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      await submitForm();
    };

    // Handle Enter key in reps input - focus weight or submit
    const handleRepsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (weightInputRef.current) {
          weightInputRef.current.focus();
        }
      }
    };

    // Handle Enter key in weight input - submit form
    const handleWeightKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitForm();
      }
    };

    return (
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>Log Set</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Last Set Indicator */}
            {lastSet && (
              <div className="mb-4 p-2 bg-terminal-bgSecondary border border-terminal-border flex items-center justify-between">
                <p className="text-xs uppercase text-terminal-info font-mono">
                  LAST:{" "}
                  {exercises.find((e) => e._id === selectedExerciseId)?.name} •{" "}
                  {lastSet.reps} REPS
                  {lastSet.weight &&
                    ` @ ${lastSet.weight} ${(lastSet.unit || unit).toUpperCase()}`}{" "}
                  • {formatTimeAgo(lastSet.performedAt)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReps(lastSet.reps.toString());
                    setWeight(lastSet.weight?.toString() || "");
                    focusElement(repsInputRef);
                  }}
                  className="ml-2"
                >
                  Use
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 md:items-end">
              {/* Exercise Selector */}
              <div>
                <label
                  htmlFor="exercise"
                  className="block text-xs uppercase text-terminal-textSecondary mb-1 font-mono"
                >
                  EXERCISE *
                </label>
                <Select
                  value={selectedExerciseId}
                  onValueChange={(value) => {
                    if (value === "CREATE_NEW") {
                      setShowInlineCreator(true);
                      setSelectedExerciseId("");
                    } else {
                      setSelectedExerciseId(value as Id<"exercises">);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="exercise" className="h-[46px]">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise._id} value={exercise._id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="CREATE_NEW">+ CREATE NEW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reps Input */}
              <div className="md:w-32">
                <label
                  htmlFor="reps"
                  className="block text-xs uppercase text-terminal-textSecondary mb-1 font-mono"
                >
                  REPS *
                </label>
                <Input
                  ref={repsInputRef}
                  id="reps"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  onKeyDown={handleRepsKeyDown}
                  placeholder="How many?"
                  className="w-full h-[46px] tabular-nums"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Weight Input (with inline unit toggle) */}
              <div>
                <label
                  htmlFor="weight"
                  className="block text-xs uppercase text-terminal-textSecondary mb-1 font-mono"
                >
                  WEIGHT ({unit.toUpperCase()})
                </label>
                <div className="flex gap-1">
                  <Input
                    ref={weightInputRef}
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onKeyDown={handleWeightKeyDown}
                    placeholder="Optional"
                    className="w-full md:w-32 h-[46px] tabular-nums"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleUnit}
                    className="w-20 h-[46px]"
                    aria-label={`Switch to ${unit === "lbs" ? "kilograms" : "pounds"}`}
                    title={`Switch to ${unit === "lbs" ? "KG" : "LBS"}`}
                  >
                    ⟷ {unit === "lbs" ? "KG" : "LBS"}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <label
                  className="block text-xs mb-1 opacity-0 pointer-events-none"
                  aria-hidden="true"
                >
                  Submit
                </label>
                <Button
                  type="submit"
                  className="w-full h-[46px]"
                  disabled={!selectedExerciseId || !reps || isSubmitting}
                >
                  {isSubmitting ? "Logging..." : "Log Set"}
                </Button>
              </div>
            </div>

            {/* Inline Exercise Creator (conditional) */}
            {showInlineCreator && (
              <div className="mt-4">
                <InlineExerciseCreator
                  onCreated={(exerciseId) => {
                    setSelectedExerciseId(exerciseId);
                    setShowInlineCreator(false);
                  }}
                  onCancel={() => setShowInlineCreator(false)}
                />
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }
);

export const QuickLogForm = QuickLogFormComponent;
