import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExerciseManager } from "./exercise-manager";
import type { Exercise, Set } from "@/types/domain";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// Mock Convex hooks
const mockUpdateExercise = vi.fn();
const mockDeleteExercise = vi.fn();

vi.mock("convex/react", () => {
  let callCount = 0;
  return {
    useMutation: vi.fn(() => {
      // Component calls useMutation twice per render: update, then delete
      // Return mocks in order
      callCount++;
      return callCount % 2 === 1 ? mockUpdateExercise : mockDeleteExercise;
    }),
  };
});

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

describe("ExerciseManager", () => {
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
      performedAt: Date.now(),
      _creationTime: Date.now(),
    },
    {
      _id: "set2" as Id<"sets">,
      userId: "user1",
      exerciseId: "ex1abc123" as Id<"exercises">,
      reps: 8,
      performedAt: Date.now(),
      _creationTime: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateExercise.mockResolvedValue(undefined);
    mockDeleteExercise.mockResolvedValue(undefined);

    // Mock localStorage globally for all tests
    const localStorageMock = {
      getItem: vi.fn(() => "false"), // Panel not collapsed
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal("localStorage", localStorageMock);
  });

  describe("rendering", () => {
    it("renders exercise list with correct data", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      // Both desktop and mobile layouts render, so use getAllByText
      expect(screen.getAllByText("Bench Press")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Squats")[0]).toBeInTheDocument();
    });

    it("displays exercise count in title", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      expect(screen.getByText(/Exercise Registry \(2\)/)).toBeInTheDocument();
    });

    it("shows set count per exercise", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      // Bench Press has 2 sets
      const rows = screen.getAllByText("2");
      expect(rows.length).toBeGreaterThan(0);
    });

    it("displays short IDs", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      expect(screen.getByText("ex1abc")).toBeInTheDocument();
      expect(screen.getByText("ex2def")).toBeInTheDocument();
    });
  });

  describe("edit exercise", () => {
    it("enters edit mode when edit button clicked", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      // Input should appear with current name
      const input = screen.getAllByDisplayValue("Bench Press")[0];
      expect(input).toBeInTheDocument();
    });

    it("saves updated exercise name on save button click", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const input = screen.getAllByDisplayValue("Bench Press")[0];
      fireEvent.change(input, { target: { value: "Incline Bench Press" } });

      const saveButton = screen.getAllByTitle("Save")[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateExercise).toHaveBeenCalledWith({
          id: "ex1abc123",
          name: "Incline Bench Press",
        });
        expect(toast.success).toHaveBeenCalledWith("Exercise updated");
      });
    });

    it("saves on Enter key press", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const input = screen.getAllByDisplayValue("Bench Press")[0];
      fireEvent.change(input, { target: { value: "Updated Name" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(mockUpdateExercise).toHaveBeenCalledWith({
          id: "ex1abc123",
          name: "Updated Name",
        });
      });
    });

    it("cancels edit on cancel button click", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const cancelButton = screen.getAllByTitle("Cancel")[0];
      fireEvent.click(cancelButton);

      // Input should be gone
      expect(screen.queryByDisplayValue("Bench Press")).not.toBeInTheDocument();
      expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it("cancels edit on Escape key press", () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const input = screen.getAllByDisplayValue("Bench Press")[0];
      fireEvent.keyDown(input, { key: "Escape" });

      expect(screen.queryByDisplayValue("Bench Press")).not.toBeInTheDocument();
      expect(mockUpdateExercise).not.toHaveBeenCalled();
    });

    it("does not save if name is empty", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const input = screen.getAllByDisplayValue("Bench Press")[0];
      fireEvent.change(input, { target: { value: "   " } });

      const saveButton = screen.getAllByTitle("Save")[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateExercise).not.toHaveBeenCalled();
      });
    });

    it("trims whitespace from exercise name", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const input = screen.getAllByDisplayValue("Bench Press")[0];
      fireEvent.change(input, { target: { value: "  Spaced Name  " } });

      const saveButton = screen.getAllByTitle("Save")[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateExercise).toHaveBeenCalledWith({
          id: "ex1abc123",
          name: "Spaced Name",
        });
      });
    });
  });

  describe("delete exercise", () => {
    beforeEach(() => {
      // Mock window.confirm
      vi.stubGlobal(
        "confirm",
        vi.fn(() => true)
      );
    });

    it("shows confirmation dialog before deleting", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const deleteButtons = screen.getAllByTitle("Delete exercise");
      fireEvent.click(deleteButtons[0]);

      // AlertDialog should be visible
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("deletes exercise when confirmed", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const deleteButtons = screen.getAllByTitle("Delete exercise");
      fireEvent.click(deleteButtons[0]);

      // Wait for AlertDialog to appear and click Delete
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteExercise).toHaveBeenCalledWith({
          id: "ex1abc123",
        });
        expect(toast.success).toHaveBeenCalledWith("Exercise deleted");
      });
    });

    it("does not delete if cancelled", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const deleteButtons = screen.getAllByTitle("Delete exercise");
      fireEvent.click(deleteButtons[0]);

      // Wait for AlertDialog and click Cancel
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockDeleteExercise).not.toHaveBeenCalled();
      });
    });

    it("shows set count in confirmation for exercises with sets", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const deleteButtons = screen.getAllByTitle("Delete exercise");
      fireEvent.click(deleteButtons[0]); // Bench Press has 2 sets

      // Check AlertDialog shows set count
      await waitFor(() => {
        expect(screen.getAllByText(/2 sets/i)[0]).toBeInTheDocument();
      });
    });

    it("shows different message for exercises without sets", async () => {
      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const deleteButtons = screen.getAllByTitle("Delete exercise");
      fireEvent.click(deleteButtons[1]); // Squats has 0 sets

      // Check AlertDialog shows warning message
      await waitFor(() => {
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toBeInTheDocument();
        // Should NOT show "X sets" for exercise with no sets
        expect(dialog.textContent).not.toMatch(/\d+\s+sets/i);
      });
    });
  });

  describe("error handling", () => {
    it("handles update errors with error handler", async () => {
      const mockError = new Error("Update failed");
      mockUpdateExercise.mockRejectedValueOnce(mockError);

      const { handleMutationError } = await import("@/lib/error-handler");

      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const editButtons = screen.getAllByTitle("Edit exercise name");
      fireEvent.click(editButtons[0]);

      const input = screen.getAllByDisplayValue("Bench Press")[0];
      fireEvent.change(input, { target: { value: "Updated" } });

      const saveButton = screen.getAllByTitle("Save")[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(handleMutationError).toHaveBeenCalledWith(
          mockError,
          "Update Exercise"
        );
      });
    });

    it("handles delete errors with error handler", async () => {
      const mockError = new Error("Delete failed");
      mockDeleteExercise.mockRejectedValueOnce(mockError);

      const { handleMutationError } = await import("@/lib/error-handler");

      render(<ExerciseManager exercises={mockExercises} sets={mockSets} />);

      const deleteButtons = screen.getAllByTitle("Delete exercise");
      fireEvent.click(deleteButtons[0]);

      // Wait for AlertDialog and click Delete
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(handleMutationError).toHaveBeenCalledWith(
          mockError,
          "Delete Exercise"
        );
      });
    });
  });
});
