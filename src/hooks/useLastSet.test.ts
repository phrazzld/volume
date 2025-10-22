import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLastSet } from "./useLastSet";
import * as convexReact from "convex/react";
import type { Set } from "@/types/domain";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

describe("useLastSet", () => {
  const mockSets: Set[] = [
    {
      _id: "set1" as any,
      _creationTime: 1000,
      userId: "user1",
      exerciseId: "exercise1" as any,
      reps: 10,
      weight: 135,
      unit: "lbs",
      performedAt: Date.now() - 60000, // 1 minute ago
    },
    {
      _id: "set2" as any,
      _creationTime: 2000,
      userId: "user1",
      exerciseId: "exercise2" as any,
      reps: 20,
      weight: undefined,
      unit: undefined,
      performedAt: Date.now() - 3600000, // 1 hour ago
    },
    {
      _id: "set3" as any,
      _creationTime: 3000,
      userId: "user1",
      exerciseId: "exercise1" as any,
      reps: 8,
      weight: 140,
      unit: "lbs",
      performedAt: Date.now() - 7200000, // 2 hours ago
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no exercise selected", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result } = renderHook(() => useLastSet(null));

    expect(result.current.lastSet).toBeNull();
  });

  it("returns null when no sets exist", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue([]);

    const { result } = renderHook(() => useLastSet("exercise1"));

    expect(result.current.lastSet).toBeNull();
  });

  it("returns null when query is undefined", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(undefined);

    const { result } = renderHook(() => useLastSet("exercise1"));

    expect(result.current.lastSet).toBeNull();
  });

  it("returns most recent set for exercise", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result } = renderHook(() => useLastSet("exercise1"));

    // Should return set1 (most recent for exercise1)
    expect(result.current.lastSet).toEqual(mockSets[0]);
    expect(result.current.lastSet?.performedAt).toBe(mockSets[0].performedAt);
  });

  it("filters sets by exerciseId correctly", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result } = renderHook(() => useLastSet("exercise2"));

    // Should return set2 (only set for exercise2)
    expect(result.current.lastSet).toEqual(mockSets[1]);
    expect(result.current.lastSet?.exerciseId).toBe("exercise2");
  });

  it("handles sets without weight", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result } = renderHook(() => useLastSet("exercise2"));

    expect(result.current.lastSet?.weight).toBeUndefined();
    expect(result.current.lastSet?.unit).toBeUndefined();
  });

  it("returns null when no sets match exerciseId", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result } = renderHook(() => useLastSet("nonexistent"));

    expect(result.current.lastSet).toBeNull();
  });

  describe("formatTimeAgo", () => {
    it("formats seconds as 'X SEC AGO'", () => {
      vi.mocked(convexReact.useQuery).mockReturnValue([]);

      const { result } = renderHook(() => useLastSet(null));

      const now = Date.now();
      expect(result.current.formatTimeAgo(now - 5000)).toBe("5 SEC AGO");
      expect(result.current.formatTimeAgo(now - 30000)).toBe("30 SEC AGO");
      expect(result.current.formatTimeAgo(now - 59000)).toBe("59 SEC AGO");
    });

    it("formats minutes as 'X MIN AGO'", () => {
      vi.mocked(convexReact.useQuery).mockReturnValue([]);

      const { result } = renderHook(() => useLastSet(null));

      const now = Date.now();
      expect(result.current.formatTimeAgo(now - 60000)).toBe("1 MIN AGO");
      expect(result.current.formatTimeAgo(now - 120000)).toBe("2 MIN AGO");
      expect(result.current.formatTimeAgo(now - 1800000)).toBe("30 MIN AGO");
      expect(result.current.formatTimeAgo(now - 3599000)).toBe("59 MIN AGO");
    });

    it("formats hours as 'X HR AGO'", () => {
      vi.mocked(convexReact.useQuery).mockReturnValue([]);

      const { result } = renderHook(() => useLastSet(null));

      const now = Date.now();
      expect(result.current.formatTimeAgo(now - 3600000)).toBe("1 HR AGO");
      expect(result.current.formatTimeAgo(now - 7200000)).toBe("2 HR AGO");
      expect(result.current.formatTimeAgo(now - 18000000)).toBe("5 HR AGO");
      expect(result.current.formatTimeAgo(now - 86399000)).toBe("23 HR AGO");
    });

    it("formats days as 'X DAY(S) AGO'", () => {
      vi.mocked(convexReact.useQuery).mockReturnValue([]);

      const { result } = renderHook(() => useLastSet(null));

      const now = Date.now();
      expect(result.current.formatTimeAgo(now - 86400000)).toBe("1 DAY AGO");
      expect(result.current.formatTimeAgo(now - 172800000)).toBe("2 DAYS AGO");
      expect(result.current.formatTimeAgo(now - 604800000)).toBe("7 DAYS AGO");
      expect(result.current.formatTimeAgo(now - 2592000000)).toBe(
        "30 DAYS AGO"
      );
    });

    it("handles edge case of 0 seconds", () => {
      vi.mocked(convexReact.useQuery).mockReturnValue([]);

      const { result } = renderHook(() => useLastSet(null));

      const now = Date.now();
      expect(result.current.formatTimeAgo(now)).toBe("0 SEC AGO");
    });
  });

  it("recalculates lastSet when exerciseId changes", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result, rerender } = renderHook(
      ({ exerciseId }) => useLastSet(exerciseId),
      { initialProps: { exerciseId: "exercise1" } }
    );

    // Initially returns last set for exercise1
    expect(result.current.lastSet?.exerciseId).toBe("exercise1");

    // Change to exercise2
    rerender({ exerciseId: "exercise2" });

    // Should now return last set for exercise2
    expect(result.current.lastSet?.exerciseId).toBe("exercise2");
  });

  it("recalculates lastSet when sets data changes", () => {
    vi.mocked(convexReact.useQuery).mockReturnValue(mockSets);

    const { result, rerender } = renderHook(() => useLastSet("exercise1"));

    const initialSet = result.current.lastSet;

    // Simulate new data from server
    const newSets = [
      {
        _id: "set4" as any,
        _creationTime: 4000,
        userId: "user1",
        exerciseId: "exercise1" as any,
        reps: 12,
        weight: 145,
        unit: "lbs",
        performedAt: Date.now() - 1000, // Just now
      },
      ...mockSets,
    ];
    vi.mocked(convexReact.useQuery).mockReturnValue(newSets);

    rerender();

    // Should return the new most recent set
    expect(result.current.lastSet).not.toEqual(initialSet);
    expect(result.current.lastSet?._id).toBe("set4");
  });
});
