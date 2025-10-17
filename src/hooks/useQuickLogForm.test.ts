import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useQuickLogForm } from "./useQuickLogForm";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/error-handler";
import * as convexReact from "convex/react";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("@/lib/error-handler", () => ({
  handleMutationError: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
}));

describe("useQuickLogForm", () => {
  const mockLogSet = vi.fn();
  const mockOnSetLogged = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(convexReact.useMutation).mockReturnValue(mockLogSet);
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    expect(result.current.form.getValues()).toEqual({
      exerciseId: "",
      reps: undefined,
      weight: undefined,
      unit: "lbs",
    });
  });

  it("initializes with kg unit when specified", () => {
    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "kg",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    expect(result.current.form.getValues().unit).toBe("kg");
  });

  it("validates exerciseId is required", async () => {
    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    // Try to submit without exerciseId
    await result.current.form.handleSubmit(result.current.onSubmit)();

    await waitFor(() => {
      expect(result.current.form.formState.errors.exerciseId).toBeDefined();
      expect(result.current.form.formState.errors.exerciseId?.message).toBe(
        "Exercise is required"
      );
    });

    expect(mockLogSet).not.toHaveBeenCalled();
  });

  it("validates reps minimum value", async () => {
    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    // Set invalid data
    result.current.form.setValue("exerciseId", "exercise123");
    result.current.form.setValue("reps", 0); // Invalid: below minimum

    await result.current.form.handleSubmit(result.current.onSubmit)();

    await waitFor(() => {
      expect(result.current.form.formState.errors.reps).toBeDefined();
      expect(result.current.form.formState.errors.reps?.message).toBe(
        "Reps must be at least 1"
      );
    });

    expect(mockLogSet).not.toHaveBeenCalled();
  });

  it("submits with correct data structure (with weight)", async () => {
    mockLogSet.mockResolvedValue("set123");

    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    // Set valid data with weight
    result.current.form.setValue("exerciseId", "exercise123");
    result.current.form.setValue("reps", 10);
    result.current.form.setValue("weight", 135);

    await result.current.onSubmit(result.current.form.getValues());

    await waitFor(() => {
      expect(mockLogSet).toHaveBeenCalledWith({
        exerciseId: "exercise123",
        reps: 10,
        weight: 135,
        unit: "lbs",
      });
      expect(mockOnSetLogged).toHaveBeenCalledWith("set123");
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Set logged!");
    });
  });

  it("submits with correct data structure (without weight)", async () => {
    mockLogSet.mockResolvedValue("set456");

    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "kg",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    // Set valid data without weight (bodyweight exercise)
    result.current.form.setValue("exerciseId", "exercise456");
    result.current.form.setValue("reps", 20);

    await result.current.onSubmit(result.current.form.getValues());

    await waitFor(() => {
      expect(mockLogSet).toHaveBeenCalledWith({
        exerciseId: "exercise456",
        reps: 20,
        weight: undefined,
        unit: undefined, // No unit when no weight
      });
      expect(mockOnSetLogged).toHaveBeenCalledWith("set456");
      expect(toast.success).toHaveBeenCalledWith("Set logged!");
    });
  });

  it("includes unit when weight provided", async () => {
    mockLogSet.mockResolvedValue("set789");

    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "kg",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    result.current.form.setValue("exerciseId", "exercise789");
    result.current.form.setValue("reps", 5);
    result.current.form.setValue("weight", 100);

    await result.current.onSubmit(result.current.form.getValues());

    await waitFor(() => {
      expect(mockLogSet).toHaveBeenCalledWith(
        expect.objectContaining({
          unit: "kg",
        })
      );
    });
  });

  it("clears reps and weight after submit", async () => {
    mockLogSet.mockResolvedValue("set999");

    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    result.current.form.setValue("exerciseId", "exercise999");
    result.current.form.setValue("reps", 12);
    result.current.form.setValue("weight", 200);

    await result.current.onSubmit(result.current.form.getValues());

    await waitFor(() => {
      const values = result.current.form.getValues();
      expect(values.reps).toBeUndefined();
      expect(values.weight).toBeUndefined();
    });
  });

  it("preserves exerciseId after submit", async () => {
    mockLogSet.mockResolvedValue("set111");

    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    const exerciseId = "exercise111";
    result.current.form.setValue("exerciseId", exerciseId);
    result.current.form.setValue("reps", 8);

    await result.current.onSubmit(result.current.form.getValues());

    await waitFor(() => {
      expect(result.current.form.getValues().exerciseId).toBe(exerciseId);
    });
  });

  it("calls error handler on submission failure", async () => {
    const mockError = new Error("Network error");
    mockLogSet.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    result.current.form.setValue("exerciseId", "exercise222");
    result.current.form.setValue("reps", 15);

    await result.current.onSubmit(result.current.form.getValues());

    await waitFor(() => {
      expect(handleMutationError).toHaveBeenCalledWith(mockError, "Log Set");
      expect(mockOnSetLogged).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it("exposes isSubmitting state from form", () => {
    const { result } = renderHook(() =>
      useQuickLogForm({
        unit: "lbs",
        onSetLogged: mockOnSetLogged,
        onSuccess: mockOnSuccess,
      })
    );

    // Initially not submitting
    expect(result.current.isSubmitting).toBe(false);

    // isSubmitting is derived from form state
    expect(result.current.isSubmitting).toBe(
      result.current.form.formState.isSubmitting
    );
  });
});
