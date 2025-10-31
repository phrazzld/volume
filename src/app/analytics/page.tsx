"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageLayout } from "@/components/layout/page-layout";
import { VolumeChart } from "@/components/analytics/volume-chart";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { PRCard } from "@/components/analytics/pr-card";
import { StreakCard } from "@/components/analytics/streak-card";

export default function AnalyticsPage() {
  // Fetch analytics data using Convex queries
  const volumeData = useQuery(api.analytics.getVolumeByExercise, {});
  const frequencyData = useQuery(api.analytics.getWorkoutFrequency, {
    days: 365,
  });
  const streakStats = useQuery(api.analytics.getStreakStats, {});
  const recentPRs = useQuery(api.analytics.getRecentPRs, { days: 30 });

  // Determine loading state (any query undefined = still loading)
  const isLoading =
    volumeData === undefined ||
    frequencyData === undefined ||
    streakStats === undefined ||
    recentPRs === undefined;

  return (
    <PageLayout title="Your Analytics">
      <div className="space-y-6">
        {/* Page description */}
        <p className="text-sm text-muted-foreground">
          Track your progress and celebrate wins
        </p>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PRCard - Top priority (most motivating) */}
          <PRCard prs={recentPRs || []} isLoading={isLoading} />

          {/* StreakCard - Gamification element */}
          <StreakCard
            currentStreak={streakStats?.currentStreak || 0}
            longestStreak={streakStats?.longestStreak || 0}
            totalWorkouts={streakStats?.totalWorkouts || 0}
            isLoading={isLoading}
          />
        </div>

        {/* Full-width charts */}
        <VolumeChart data={volumeData || []} isLoading={isLoading} />

        <ActivityHeatmap data={frequencyData || []} isLoading={isLoading} />
      </div>
    </PageLayout>
  );
}
