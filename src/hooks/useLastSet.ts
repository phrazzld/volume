import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Set } from "@/types/domain";

/**
 * Hook to find the last set logged for a given exercise
 * and format relative time strings for display
 */
export function useLastSet(exerciseId: string | null) {
  const allSets = useQuery(api.sets.listSets, {});

  const lastSet = useMemo(() => {
    if (!exerciseId || !allSets) return null;
    const exerciseSets = allSets.filter((s) => s.exerciseId === exerciseId);
    if (exerciseSets.length === 0) return null;
    return exerciseSets[0]; // Already sorted by performedAt desc
  }, [exerciseId, allSets]);

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

  return { lastSet, formatTimeAgo };
}

export type { Set };
