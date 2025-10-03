import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Volume</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Simple workout tracking</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/exercises"
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Exercises</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your exercises</p>
        </Link>

        <Link
          href="/log"
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Log Set</h2>
          <p className="text-gray-600 dark:text-gray-400">Record a workout set</p>
        </Link>

        <Link
          href="/history"
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">History</h2>
          <p className="text-gray-600 dark:text-gray-400">View past workouts</p>
        </Link>
      </div>
    </main>
  );
}
