import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { handleMutationError } from "@/lib/error-handler";

// Validation schema for quick log form
const quickLogSchema = z.object({
  exerciseId: z.string().min(1, "Exercise is required"),
  reps: z.number().min(1, "Reps must be at least 1"),
  weight: z.number().optional(),
  unit: z.enum(["lbs", "kg"]).optional(),
});

export type QuickLogFormValues = z.infer<typeof quickLogSchema>;

export interface UseQuickLogFormOptions {
  unit: "lbs" | "kg";
  onSetLogged?: (setId: Id<"sets">) => void;
  onSuccess?: () => void;
}

export function useQuickLogForm({
  unit,
  onSetLogged,
  onSuccess,
}: UseQuickLogFormOptions) {
  const logSet = useMutation(api.sets.logSet);

  const form = useForm<QuickLogFormValues>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: {
      exerciseId: "",
      reps: undefined,
      weight: undefined,
      unit: unit,
    },
  });

  const onSubmit = async (values: QuickLogFormValues) => {
    try {
      const setId = await logSet({
        exerciseId: values.exerciseId as Id<"exercises">,
        reps: values.reps!,
        weight: values.weight,
        unit: values.weight ? values.unit : undefined,
      });

      // Keep exercise selected, clear reps/weight
      form.reset({
        exerciseId: values.exerciseId, // CRITICAL: Preserve selection
        reps: undefined,
        weight: undefined,
        unit: values.unit,
      });

      toast.success("Set logged!");
      onSetLogged?.(setId);
      onSuccess?.();
    } catch (error) {
      handleMutationError(error, "Log Set");
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}
