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
import { TrendingUp, Dumbbell, Repeat, Target } from "lucide-react";

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
  const [showBreakdown, setShowBreakdown] = useState(true);
  const { unit } = useWeightUnit();

  // Format number with commas for readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Today's Workout"}</CardTitle>
      </CardHeader>
      <CardContent>
        {stats && exerciseStats.length > 0 ? (
          <>
            {/* Hero Stats - PRIMARY (always visible, big numbers) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Total Volume */}
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-muted/50">
                <TrendingUp className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground mb-1">
                  Volume ({unit})
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats.totalVolume > 0
                    ? formatNumber(stats.totalVolume)
                    : "—"}
                </p>
              </div>

              {/* Total Sets */}
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-muted/50">
                <Repeat className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Sets</p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats.totalSets}
                </p>
              </div>

              {/* Total Reps */}
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-muted/50">
                <Target className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Reps</p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats.totalReps}
                </p>
              </div>

              {/* Exercises Worked */}
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-muted/50">
                <Dumbbell className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Exercises</p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats.exercisesWorked}
                </p>
              </div>
            </div>

            {/* Per-Exercise Breakdown - SECONDARY (collapsible) */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full px-3 py-2 border-y text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-center mb-4"
            >
              {showBreakdown
                ? "▲ Hide Exercise Breakdown"
                : "▼ Show Exercise Breakdown"}
            </button>

            {showBreakdown && (
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
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm mb-2">No sets today</p>
            <p className="text-lg font-medium">{"Let's get started! 💪"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
