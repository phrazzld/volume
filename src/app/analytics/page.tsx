"use client";

import { PageLayout } from "@/components/layout/page-layout";

export default function AnalyticsPage() {
  return (
    <PageLayout title="Your Analytics">
      <div className="space-y-6">
        {/* Page description */}
        <p className="text-sm text-muted-foreground">
          Track your progress and celebrate wins
        </p>

        {/* Placeholder sections for future metrics */}
        <div className="space-y-4">
          {/* Personal Records placeholder */}
          <div className="border rounded-md p-6">
            <h2 className="text-lg font-semibold mb-2">Recent PRs</h2>
            <p className="text-sm text-muted-foreground">
              Personal record tracking coming soon
            </p>
          </div>

          {/* Streak Stats placeholder */}
          <div className="border rounded-md p-6">
            <h2 className="text-lg font-semibold mb-2">Workout Streak</h2>
            <p className="text-sm text-muted-foreground">
              Streak statistics coming soon
            </p>
          </div>

          {/* Volume Chart placeholder */}
          <div className="border rounded-md p-6">
            <h2 className="text-lg font-semibold mb-2">Volume by Exercise</h2>
            <p className="text-sm text-muted-foreground">
              Volume charts coming soon
            </p>
          </div>

          {/* Activity Heatmap placeholder */}
          <div className="border rounded-md p-6">
            <h2 className="text-lg font-semibold mb-2">Workout Frequency</h2>
            <p className="text-sm text-muted-foreground">
              Activity heatmap coming soon
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
