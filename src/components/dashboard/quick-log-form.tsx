"use client";

import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  KeyboardEvent,
} from "react";
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { InlineExerciseCreator } from "./inline-exercise-creator";
import { useWeightUnit } from "@/contexts/WeightUnitContext";
import { Exercise, Set } from "@/types/domain";
import { useQuickLogForm, QuickLogFormValues } from "@/hooks/useQuickLogForm";
import { useLastSet } from "@/hooks/useLastSet";

interface QuickLogFormProps {
  exercises: Exercise[];
  onSetLogged?: (setId: Id<"sets">) => void;
}

export interface QuickLogFormHandle {
  repeatSet: (set: Set) => void;
}

const QuickLogFormComponent = forwardRef<QuickLogFormHandle, QuickLogFormProps>(
  function QuickLogForm({ exercises, onSetLogged }, ref) {
    const [showInlineCreator, setShowInlineCreator] = useState(false);
    const repsInputRef = useRef<HTMLInputElement>(null);
    const weightInputRef = useRef<HTMLInputElement>(null);

    const { unit, toggleUnit } = useWeightUnit();

    const { form, onSubmit } = useQuickLogForm({
      unit,
      onSetLogged,
      onSuccess: () => {
        focusElement(repsInputRef);
      },
    });

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

    // Watch selected exercise for last set query
    const selectedExerciseId = form.watch("exerciseId");

    // Get last set and time formatter
    const { lastSet, formatTimeAgo } = useLastSet(selectedExerciseId);

    // Expose repeatSet method to parent via ref
    useImperativeHandle(ref, () => ({
      repeatSet: (set: Set) => {
        form.setValue("exerciseId", set.exerciseId);
        form.setValue("reps", set.reps);
        form.setValue("weight", set.weight ?? undefined);
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
        form.handleSubmit(onSubmit)();
      }
    };

    return (
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>Log Set</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Last Set Indicator */}
              {lastSet && (
                <div className="mb-4 p-3 bg-muted border rounded-md flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Last:</span>{" "}
                    {exercises.find((e) => e._id === selectedExerciseId)?.name}{" "}
                    • {lastSet.reps} reps
                    {lastSet.weight &&
                      ` @ ${lastSet.weight} ${lastSet.unit || unit}`}{" "}
                    • {formatTimeAgo(lastSet.performedAt)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue("reps", lastSet.reps);
                      form.setValue("weight", lastSet.weight ?? undefined);
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
                <FormField
                  control={form.control}
                  name="exerciseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value === "CREATE_NEW") {
                            setShowInlineCreator(true);
                            field.onChange("");
                          } else {
                            field.onChange(value);
                          }
                        }}
                        disabled={form.formState.isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="h-[46px]">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise._id} value={exercise._id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="CREATE_NEW">
                            + CREATE NEW
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reps Input */}
                <FormField
                  control={form.control}
                  name="reps"
                  render={({ field }) => (
                    <FormItem className="md:w-32">
                      <FormLabel>Reps *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          ref={repsInputRef}
                          type="number"
                          inputMode="numeric"
                          min="1"
                          onKeyDown={handleRepsKeyDown}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          value={field.value ?? ""}
                          placeholder="How many?"
                          className="w-full h-[46px] tabular-nums"
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Weight Input (with inline unit toggle) */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight ({unit.toUpperCase()})</FormLabel>
                      <div className="flex gap-1">
                        <FormControl>
                          <Input
                            {...field}
                            ref={weightInputRef}
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min="0"
                            onKeyDown={handleWeightKeyDown}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                            value={field.value ?? ""}
                            placeholder="Optional"
                            className="w-full md:w-32 h-[46px] tabular-nums"
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Logging..." : "Log Set"}
                  </Button>
                </div>
              </div>

              {/* Inline Exercise Creator (conditional) */}
              {showInlineCreator && (
                <div className="mt-4">
                  <InlineExerciseCreator
                    onCreated={(exerciseId) => {
                      form.setValue("exerciseId", exerciseId);
                      setShowInlineCreator(false);
                    }}
                    onCancel={() => setShowInlineCreator(false)}
                  />
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }
);

export const QuickLogForm = QuickLogFormComponent;
