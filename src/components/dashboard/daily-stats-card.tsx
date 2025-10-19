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
import { ExerciseStats } from "@/lib/dashboard-utils";
import { Dumbbell } from "lucide-react";

interface DailyStatsCardProps {
  exerciseStats: ExerciseStats[];
}

export function DailyStatsCard({ exerciseStats }: DailyStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Today's Progress"}</CardTitle>
      </CardHeader>
      <CardContent>
        {exerciseStats.length > 0 ? (
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
