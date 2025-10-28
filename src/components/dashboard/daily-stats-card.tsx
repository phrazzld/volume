"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ExerciseStats } from "@/lib/stats-calculator";
import { Dumbbell } from "lucide-react";

interface DailyStatsCardProps {
  exerciseStats: ExerciseStats[];
}

export function DailyStatsCard({ exerciseStats }: DailyStatsCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{"Today's Progress"}</CardTitle>
      </CardHeader>
      <CardContent>
        {exerciseStats.length > 0 ? (
          <>
            {/* Desktop: Table layout */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead className="text-right">Reps</TableHead>
                    <TableHead className="text-right">Sets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exerciseStats.map((exercise, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{exercise.name}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {exercise.reps}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {exercise.sets}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: Card layout */}
            <div className="md:hidden space-y-2">
              {exerciseStats.map((exercise, idx) => (
                <div
                  key={idx}
                  className="border rounded-md p-3 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-bold tabular-nums">
                      {exercise.reps}
                    </span>{" "}
                    reps • <span className="tabular-nums">{exercise.sets}</span>{" "}
                    sets
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No sets logged yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
