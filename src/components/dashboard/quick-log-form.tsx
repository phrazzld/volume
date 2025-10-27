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
import { Loader2 } from "lucide-react";

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

    const { unit } = useWeightUnit();

    const { form, onSubmit } = useQuickLogForm({
      unit,
      exercises,
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
     * Autofocus pattern using Radix Select's onOpenChange event
     *
     * Why this approach?
     * - Event-driven: Focus triggered when dropdown animation completes
     * - Reliable: onOpenChange(false) fires after Radix closes dropdown
     * - Simple: Single RAF for browser render cycle, not timing hacks
     *
     * Focus flow:
     * 1. User selects exercise → dropdown closes → onOpenChange(false) fires
     * 2. Single RAF waits for React render cycle (DOM updates)
     * 3. Focus reps input → user types reps → Enter → focus weight → Enter → submit
     *
     * Why single RAF vs double RAF?
     * - onOpenChange guarantees dropdown animation complete
     * - Only need to wait for React render, not Radix animation
     * - Simpler, more maintainable pattern
     *
     * Reference: Radix UI Select guarantees onOpenChange fires after animation
     * https://www.radix-ui.com/primitives/docs/components/select#onOpenChange
     */
    const focusElement = (ref: React.RefObject<HTMLInputElement | null>) => {
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
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Log Set</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Last Set Indicator */}
              {lastSet && (
                <div className="mb-4 p-3 bg-muted border rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                    className="sm:ml-2"
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
                        onOpenChange={(open) => {
                          // When dropdown closes and exercise is selected, focus reps input
                          if (!open && field.value) {
                            focusElement(repsInputRef);
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
                            + Create New
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

                {/* Weight Input */}
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight ({unit})</FormLabel>
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
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Logging...
                      </>
                    ) : (
                      "Log Set"
                    )}
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
