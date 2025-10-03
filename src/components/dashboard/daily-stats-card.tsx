"use client";

import { ChevronDown } from "lucide-react";

interface DailyStatsCardProps {
  stats: {
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    exercisesWorked: number;
  } | null;
  expanded: boolean;
  onToggle: () => void;
}

export function DailyStatsCard({ stats, expanded, onToggle }: DailyStatsCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        aria-expanded={expanded}
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Today&apos;s Progress
          </h2>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? "max-h-96 mt-4" : "max-h-0"
        }`}
      >
        {stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalSets}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">sets</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalReps}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">reps</p>
            </div>
            {stats.totalVolume > 0 && (
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalVolume}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">lbs total</p>
              </div>
            )}
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.exercisesWorked}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">exercises</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No sets logged yet today. Get started! 💪
          </p>
        )}
      </div>
    </div>
  );
}
