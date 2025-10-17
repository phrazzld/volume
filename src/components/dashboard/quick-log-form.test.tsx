import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickLogForm } from "./quick-log-form";
import type { Exercise } from "@/types/domain";
import type { Id } from "../../../convex/_generated/dataModel";
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogSet.mockResolvedValue("newSetId123");
    mockUseQuery.mockReturnValue([]);
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
  });

  describe("form state management", () => {
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

  describe("keyboard navigation", () => {
    it("pressing Enter in reps input focuses weight input", () => {
      renderWithContext(<QuickLogForm exercises={mockExercises} />);

      const repsInput = screen.getByLabelText(/REPS/i);
      const weightInput = screen.getByLabelText(/WEIGHT/i);

      fireEvent.keyDown(repsInput, { key: "Enter" });

      expect(weightInput).toHaveFocus();
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
  });
});
