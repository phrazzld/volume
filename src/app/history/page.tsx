"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { GroupedSetHistory } from "@/components/dashboard/grouped-set-history";
import { groupSetsByDay } from "@/lib/dashboard-utils";
import { PageLayout } from "@/components/layout/page-layout";
import { Id } from "../../../convex/_generated/dataModel";

const PAGINATION_PAGE_SIZE = 25;

export default function HistoryPage() {
  // Fetch paginated sets
  const { results, status, loadMore } = usePaginatedQuery(
    api.sets.listSetsPaginated,
    {},
    { initialNumItems: PAGINATION_PAGE_SIZE }
  );

  // Fetch exercises for names
  const exercises = useQuery(api.exercises.listExercises);

  // Delete mutation
  const deleteSetMutation = useMutation(api.sets.deleteSet);

  // Group sets by day
  const groupedSets = useMemo(() => groupSetsByDay(results), [results]);

  // No-op: Repeat functionality not applicable in history view
  const handleRepeat = () => {};

  // Handle delete set
  const handleDelete = async (setId: Id<"sets">) => {
    await deleteSetMutation({ id: setId });
  };

  // Loading state (first page)
  if (status === "LoadingFirstPage") {
    return (
      <PageLayout title="WORKOUT HISTORY">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-terminal-border bg-terminal-bg p-4 rounded"
            >
              <div className="h-6 bg-terminal-bgSecondary w-1/3 mb-3 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-terminal-bgSecondary w-full rounded" />
                <div className="h-4 bg-terminal-bgSecondary w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </PageLayout>
    );
  }

  // Empty state
  if (results.length === 0) {
    return (
      <PageLayout title="WORKOUT HISTORY">
        <div className="border border-terminal-border bg-terminal-bg p-12 text-center rounded">
          <p className="text-terminal-textSecondary uppercase font-mono text-sm mb-2">
            NO WORKOUT HISTORY YET
          </p>
          <p className="text-terminal-info font-mono text-xs mb-1">
            START YOUR JOURNEY! 🚀
          </p>
          <p className="text-terminal-textMuted font-mono text-xs mt-2">
            Log your first set on the{" "}
            <Link href="/" className="text-terminal-success hover:underline">
              Dashboard
            </Link>
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="WORKOUT HISTORY">
      <GroupedSetHistory
        groupedSets={groupedSets}
        exercises={exercises || []}
        onRepeat={handleRepeat}
        onDelete={handleDelete}
      />

      {/* Load More button */}
      {status === "CanLoadMore" && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => loadMore(PAGINATION_PAGE_SIZE)}
            className="px-6 py-2 bg-terminal-success text-terminal-bg font-mono uppercase text-sm hover:opacity-90 transition-opacity border border-terminal-success"
            type="button"
          >
            LOAD MORE
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {status === "LoadingMore" && (
        <div className="flex justify-center mt-6">
          <div className="animate-pulse">
            <div className="px-6 py-2 bg-terminal-bgSecondary text-terminal-textMuted font-mono uppercase text-sm border border-terminal-border">
              LOADING...
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
