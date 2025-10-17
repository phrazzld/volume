"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ExerciseStats } from "@/lib/dashboard-utils";
import { useWeightUnit } from "@/contexts/WeightUnitContext";

interface DailyStatsCardProps {
  stats: {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    exercisesWorked: number;
  } | null;
  exerciseStats: ExerciseStats[];
}

export function DailyStatsCard({ stats, exerciseStats }: DailyStatsCardProps) {
  const [showTotals, setShowTotals] = useState(false);
  const { unit } = useWeightUnit();

  // Format number with commas for readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US");
  };

  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle>Daily Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <>
            {/* Per-Exercise Breakdown - PRIMARY (always visible) */}
            {exerciseStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="w-16">Sets</TableHead>
                    <TableHead className="w-20">Reps</TableHead>
                    <TableHead className="w-32">Volume ({unit})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exerciseStats.map((exercise, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{exercise.name}</TableCell>
                      <TableCell className="font-bold">
                        {exercise.sets}
                      </TableCell>
                      <TableCell className="font-bold">
                        {exercise.reps}
                      </TableCell>
                      <TableCell className="font-bold">
                        {exercise.volume > 0
                          ? `${formatNumber(exercise.volume)} ${unit}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm mb-2">
                  No sets today
                </p>
                <p className="text-sm">{"Let's go! 💪"}</p>
              </div>
            )}

            {/* Aggregate Totals - SECONDARY (collapsible) */}
            {exerciseStats.length > 0 && (
              <>
                <button
                  onClick={() => setShowTotals(!showTotals)}
                  className="w-full px-3 py-2 border-t text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs text-center"
                >
                  {showTotals ? "▲ Hide Totals" : "▼ Show Totals"}
                </button>
                {showTotals && (
                  <div className="grid grid-cols-4 border-t">
                    {/* Total Sets */}
                    <div className="p-3 border-r">
                      <p className="text-xs text-muted-foreground mb-2">Sets</p>
                      <p className="text-xl font-bold tabular-nums">
                        {stats.totalSets}
                      </p>
                    </div>

                    {/* Total Reps */}
                    <div className="p-3 border-r">
                      <p className="text-xs text-muted-foreground mb-2">Reps</p>
                      <p className="text-xl font-bold tabular-nums">
                        {stats.totalReps}
                      </p>
                    </div>

                    {/* Total Volume */}
                    <div className="p-3 border-r">
                      <p className="text-xs text-muted-foreground mb-2">
                        Volume ({unit})
                      </p>
                      <p className="text-xl font-bold tabular-nums">
                        {stats.totalVolume > 0
                          ? formatNumber(stats.totalVolume)
                          : "—"}
                      </p>
                    </div>

                    {/* Exercises Worked */}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Exercises
                      </p>
                      <p className="text-xl font-bold tabular-nums">
                        {stats.exercisesWorked}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">No sets today</p>
            <p className="text-sm">{"Let's go! 💪"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
