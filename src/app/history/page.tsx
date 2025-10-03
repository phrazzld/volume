"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SetList } from "@/components/sets/set-list";
import Link from "next/link";

export default function HistoryPage() {
  const sets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          ← Back to home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Workout History</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        All your logged sets, newest first
      </p>

      {sets === undefined || exercises === undefined ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : (
        <SetList sets={sets} exercises={exercises} />
      )}

      <div className="mt-8 text-center">
        <Link
          href="/log"
          className="inline-block px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Log Another Set
        </Link>
      </div>
    </div>
  );
}
