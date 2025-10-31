"use client";

import React, { useMemo } from "react";
import ActivityCalendar, { Activity } from "react-activity-calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface ActivityHeatmapProps {
  data: Array<{
    date: string; // YYYY-MM-DD format
    setCount: number;
    totalVolume: number;
  }>;
  isLoading?: boolean;
}

/**
 * Calculate activity level (0-4) based on set count
 * GitHub-style intensity levels for visual consistency
 */
function calculateLevel(setCount: number): number {
  if (setCount === 0) return 0;
  if (setCount <= 3) return 1;
  if (setCount <= 7) return 2;
  if (setCount <= 12) return 3;
  return 4;
}

export function ActivityHeatmap({
  data,
  isLoading = false,
}: ActivityHeatmapProps) {
  // Transform data to react-activity-calendar format
  const activityData: Activity[] = useMemo(() => {
    return data.map((item) => ({
      date: item.date,
      count: item.setCount,
      level: calculateLevel(item.setCount),
    }));
  }, [data]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Workout Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Workout Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No workout data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your activity will appear here as you log sets
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Workout Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: Allow horizontal scroll */}
        <div className="overflow-x-auto">
          <ActivityCalendar
            data={activityData}
            labels={{
              totalCount: "{{count}} sets in the last year",
            }}
            showWeekdayLabels
            theme={{
              light: [
                "hsl(var(--muted))",
                "hsl(var(--primary) / 0.2)",
                "hsl(var(--primary) / 0.4)",
                "hsl(var(--primary) / 0.6)",
                "hsl(var(--primary))",
              ],
              dark: [
                "hsl(var(--muted))",
                "hsl(var(--primary) / 0.2)",
                "hsl(var(--primary) / 0.4)",
                "hsl(var(--primary) / 0.6)",
                "hsl(var(--primary))",
              ],
            }}
            blockSize={12}
            blockMargin={4}
            fontSize={12}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    level === 0
                      ? "hsl(var(--muted))"
                      : `hsl(var(--primary) / ${0.2 * level})`,
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
