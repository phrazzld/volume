import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuickLogForm } from "./quick-log-form";
import type { Exercise, Set } from "@/types/domain";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { WeightUnitProvider } from "@/contexts/WeightUnitContext";

// Mock Convex hooks
const mockLogSet = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockLogSet),
  useQuery: vi.fn((api, params) => mockUseQuery(api, params)),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock error handler
vi.mock("@/lib/error-handler", () => ({
  handleMutationError: vi.fn(),
}));

// Mock scrollIntoView for Radix Select
Element.prototype.scrollIntoView = vi.fn();

// Helper to render with WeightUnitContext
const renderWithContext = (
  ui: React.ReactElement,
  unit: "lbs" | "kg" = "lbs"
) => {
  // Mock localStorage for context
  const localStorageMock = {
    getItem: vi.fn(() => unit),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  vi.stubGlobal("localStorage", localStorageMock);

  return render(<WeightUnitProvider>{ui}</WeightUnitProvider>);
};

// Helper to select an exercise from Radix Select
const selectExercise = async (exerciseName: string) => {
  const selectTrigger = screen.getByRole("combobox", { name: /exercise/i });
  fireEvent.click(selectTrigger);

  await waitFor(() => {
    const option = screen.getByText(exerciseName);
    fireEvent.click(option);
  });
};

describe("QuickLogForm", () => {
  const mockExercises: Exercise[] = [
    {
      _id: "ex1abc123" as Id<"exercises">,
      userId: "user1",
      name: "Bench Press",
      createdAt: new Date("2025-10-01").getTime(),
      _creationTime: new Date("2025-10-01").getTime(),
    },
    {
      _id: "ex2def456" as Id<"exercises">,
      userId: "user1",
      name: "Squats",
      createdAt: new Date("2025-10-05").getTime(),
      _creationTime: new Date("2025-10-05").getTime(),
    },
  ];

  const mockSets: Set[] = [
    {
      _id: "set1" as Id<"sets">,
      userId: "user1",
      exerciseId: "ex1abc123" as Id<"exercises">,
      reps: 10,
      weight: 135,
      unit: "lbs",
      performedAt: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      _creationTime: Date.now() - 5 * 60 * 1000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogSet.mockResolvedValue("newSetId123");
    mockUseQuery.mockReturnValue(mockSets);
  });

  describe("rendering", () => {
    it("renders all form elements", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      expect(screen.getByLabelText(/EXERCISE/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/REPS/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/WEIGHT/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /LOG SET/i })
      ).toBeInTheDocument();
    });

    it("displays exercise selector", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      // Radix Select uses a button trigger instead of select element
      const selectTrigger = screen.getByRole("combobox", { name: /exercise/i });
      expect(selectTrigger).toBeInTheDocument();
    });
  });

  describe("form state management", () => {
    it("updates exercise selection", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const select = screen.getByLabelText(/EXERCISE/i) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "ex1abc123" } });

      expect(select.value).toBe("ex1abc123");
    });

    it("updates reps input", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const repsInput = screen.getByLabelText(/REPS/i) as HTMLInputElement;
      fireEvent.change(repsInput, { target: { value: "10" } });

      expect(repsInput.value).toBe("10");
    });

    it("updates weight input", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const weightInput = screen.getByLabelText(/WEIGHT/i) as HTMLInputElement;
      fireEvent.change(weightInput, { target: { value: "135.5" } });

      expect(weightInput.value).toBe("135.5");
    });

    it("accepts decimal weight values", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const weightInput = screen.getByLabelText(/WEIGHT/i) as HTMLInputElement;
      fireEvent.change(weightInput, { target: { value: "45.5" } });

      expect(weightInput).toHaveValue(45.5);
    });
  });

  describe("validation", () => {
    it("submit button is always enabled (validation happens on submit)", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      // React Hook Form validates on submit, not by disabling the button
      const submitButton = screen.getByRole("button", {
        name: /LOG SET/i,
      });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("last set indicator", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-10-13T14:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows last set when exercise selected", async () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: fiveMinutesAgo,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      // Last set indicator shows reps, weight, and time
      await waitFor(() => {
        expect(screen.getByText(/10 reps/i)).toBeInTheDocument();
        expect(screen.getByText(/135 lbs/i)).toBeInTheDocument();
      });
    });

    it('displays "5 MIN AGO" for recent set', async () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: fiveMinutesAgo,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      expect(screen.getByText(/5 MIN AGO/i)).toBeInTheDocument();
    });

    it('displays "30 SEC AGO" for very recent set', async () => {
      const thirtySecondsAgo = Date.now() - 30 * 1000;
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 10,
          performedAt: thirtySecondsAgo,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      expect(screen.getByText(/30 SEC AGO/i)).toBeInTheDocument();
    });

    it('displays "2 HR AGO" for sets from hours ago', async () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 10,
          performedAt: twoHoursAgo,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      expect(screen.getByText(/2 HR AGO/i)).toBeInTheDocument();
    });

    it('displays "3 DAYS AGO" for old sets', async () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 10,
          performedAt: threeDaysAgo,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      expect(screen.getByText(/3 DAYS AGO/i)).toBeInTheDocument();
    });

    it("hides last set indicator when no sets for exercise", () => {
      mockUseQuery.mockReturnValue([]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      fireEvent.change(screen.getByLabelText(/EXERCISE/i), {
        target: { value: "ex2def456" },
      });

      expect(screen.queryByText(/LAST:/i)).not.toBeInTheDocument();
    });
  });

  describe("USE button", () => {
    it("populates form with last set values", async () => {
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 10,
          weight: 135,
          unit: "lbs",
          performedAt: Date.now() - 5 * 60 * 1000,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      const useButton = screen.getByRole("button", { name: /Use/i });
      fireEvent.click(useButton);

      expect(screen.getByLabelText(/REPS/i)).toHaveValue(10);
      expect(screen.getByLabelText(/WEIGHT/i)).toHaveValue(135);
    });

    it("populates form with bodyweight set (no weight)", async () => {
      mockUseQuery.mockReturnValue([
        {
          _id: "set1",
          exerciseId: "ex1abc123",
          reps: 15,
          performedAt: Date.now() - 5 * 60 * 1000,
        },
      ]);

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");

      const useButton = screen.getByRole("button", { name: /Use/i });
      fireEvent.click(useButton);

      expect(screen.getByLabelText(/REPS/i)).toHaveValue(15);
      expect(screen.getByLabelText(/WEIGHT/i)).toHaveValue(null);
    });
  });

  describe("form submission", () => {
    it("calls logSet with correct params (with weight)", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByLabelText(/WEIGHT/i), {
        target: { value: "135" },
      });

      const submitButton = screen.getByRole("button", { name: /LOG SET/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalledWith({
          exerciseId: "ex1abc123",
          reps: 10,
          weight: 135,
          unit: "lbs",
        });
      });
    });

    it("calls logSet without weight when weight empty", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });
      // Don't fill weight

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalledWith({
          exerciseId: "ex1abc123",
          reps: 10,
          weight: undefined,
          unit: undefined,
        });
      });
    });

    it("shows loading state during submission", async () => {
      mockLogSet.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });

      const submitButton = screen.getByRole("button", { name: /LOG SET/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/LOGGING.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalled();
      });
    });

    it("clears reps and weight after successful submit", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByLabelText(/WEIGHT/i), {
        target: { value: "135" },
      });

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalled();
      });

      expect(screen.getByLabelText(/REPS/i)).toHaveValue(null);
      expect(screen.getByLabelText(/WEIGHT/i)).toHaveValue(null);
    });

    it("keeps exercise selected after submit", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const exerciseSelect = screen.getByLabelText(
        /EXERCISE/i
      ) as HTMLSelectElement;
      fireEvent.change(exerciseSelect, { target: { value: "ex1abc123" } });
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalled();
      });

      expect(exerciseSelect.value).toBe("ex1abc123");
    });

    it("shows success toast after submit", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Set logged!");
      });
    });

    it("calls onSetLogged callback with set ID", async () => {
      const onSetLogged = vi.fn();
      mockLogSet.mockResolvedValue("newSetId123");

      renderWithContext(
        <QuickLogForm exercises={mockExercises} onSetLogged={onSetLogged} />
      );

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(onSetLogged).toHaveBeenCalledWith("newSetId123");
      });
    });
  });

  describe("error handling", () => {
    it("calls handleMutationError on submission failure", async () => {
      const mockError = new Error("Network error");
      mockLogSet.mockRejectedValueOnce(mockError);

      const { handleMutationError } = await import("@/lib/error-handler");

      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(handleMutationError).toHaveBeenCalledWith(mockError, "Log Set");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("pressing Enter in reps input focuses weight input", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const repsInput = screen.getByLabelText(/REPS/i);
      const weightInput = screen.getByLabelText(/WEIGHT/i);

      fireEvent.keyDown(repsInput, { key: "Enter" });

      expect(weightInput).toHaveFocus();
    });

    it("pressing Enter in weight input submits form", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });

      const weightInput = screen.getByLabelText(/WEIGHT/i);
      fireEvent.keyDown(weightInput, { key: "Enter" });

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalled();
      });
    });
  });

  describe("unit toggle", () => {
    it("displays current unit in weight label", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />, "lbs");

      expect(screen.getByText(/WEIGHT \(LBS\)/i)).toBeInTheDocument();
    });

    it("shows kg unit when context set to kg", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />, "kg");

      expect(screen.getByText(/WEIGHT \(KG\)/i)).toBeInTheDocument();
    });

    it("toggles unit button switches between lbs and kg", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />, "lbs");

      const toggleButton = screen.getByRole("button", { name: /Switch to/i });

      // Initial state shows "KG" (switch to kg)
      expect(toggleButton).toHaveTextContent("KG");

      fireEvent.click(toggleButton);

      // After click, should show "LBS" (switch to lbs)
      expect(screen.getByText(/WEIGHT \(KG\)/i)).toBeInTheDocument();
    });

    it("sends correct unit with weight in submission", async () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />, "kg");

      await selectExercise("Bench Press");
      fireEvent.change(screen.getByLabelText(/REPS/i), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByLabelText(/WEIGHT/i), {
        target: { value: "60" },
      });

      fireEvent.click(screen.getByRole("button", { name: /LOG SET/i }));

      await waitFor(() => {
        expect(mockLogSet).toHaveBeenCalledWith({
          exerciseId: "ex1abc123",
          reps: 10,
          weight: 60,
          unit: "kg",
        });
      });
    });
  });
});
