"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PageLayout } from "@/components/layout/page-layout";
import { VolumeChart } from "@/components/analytics/volume-chart";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { PRCard } from "@/components/analytics/pr-card";
import { StreakCard } from "@/components/analytics/streak-card";
import { AIInsightsCard } from "@/components/analytics/ai-insights-card";
import { Dumbbell } from "lucide-react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  // Fetch analytics data using Convex queries
  const volumeData = useQuery(api.analytics.getVolumeByExercise, {});
  const frequencyData = useQuery(api.analytics.getWorkoutFrequency, {
    days: 365,
  });
  const streakStats = useQuery(api.analytics.getStreakStats, {});
  const recentPRs = useQuery(api.analytics.getRecentPRs, { days: 30 });

  // Fetch AI report data
  const latestReport = useQuery((api as any).ai.reports.getLatestReport, {});

  // AI report generation mutation
  const generateReport = useMutation(
    (api as any).ai.reports.generateOnDemandReport
  );

  // Local state for generation loading/error
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Determine loading state (any query undefined = still loading)
  const isLoading =
    volumeData === undefined ||
    frequencyData === undefined ||
    streakStats === undefined ||
    recentPRs === undefined;

  // Count days with workout activity for new user detection
  const workoutDaysCount = frequencyData
    ? frequencyData.filter((day: any) => day.setCount > 0).length
    : 0;

  // Show empty state for users with <7 days of data
  const isNewUser = !isLoading && workoutDaysCount < 7;

  // Handle AI report generation
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      await generateReport();
      toast.success("Analysis complete!", {
        description: "Your AI coach insights are ready",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate report";
      setGenerationError(errorMessage);
      toast.error("Failed to generate analysis", {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Empty state for new users
  if (isNewUser) {
    return (
      <PageLayout title="Your Analytics">
        <div className="space-y-6">
          {/* Page description */}
          <p className="text-sm text-muted-foreground">
            Track your progress and celebrate wins
          </p>

          {/* New User Onboarding */}
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Welcome to Analytics!
            </h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              Log 7 days of workouts to unlock detailed analytics and insights.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Every champion started somewhere. Keep going!
            </p>
            {workoutDaysCount > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Progress: {workoutDaysCount} / 7 days
                </p>
                <div className="mt-2 w-48 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(workoutDaysCount / 7) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Show partial data if available (progressive disclosure) */}
          {workoutDaysCount > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Here&apos;s what we have so far:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StreakCard
                  currentStreak={streakStats?.currentStreak || 0}
                  longestStreak={streakStats?.longestStreak || 0}
                  totalWorkouts={streakStats?.totalWorkouts || 0}
                  isLoading={false}
                />
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Your Analytics" maxWidth={false}>
      <div className="space-y-6">
        {/* Page description */}
        <p className="text-sm text-muted-foreground">
          Track your progress and celebrate wins
        </p>

        {/* AI Coach Insights - Featured at top */}
        <AIInsightsCard
          report={latestReport}
          onGenerateNew={handleGenerateReport}
          isGenerating={isGenerating}
          error={generationError}
        />

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
