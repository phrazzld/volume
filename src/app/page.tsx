import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Volume</h1>
      <p className="text-gray-600 mb-8">Simple workout tracking</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/exercises"
          className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Exercises</h2>
          <p className="text-gray-600">Manage your exercises</p>
        </Link>

        <Link
          href="/log"
          className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Log Set</h2>
          <p className="text-gray-600">Record a workout set</p>
        </Link>

        <Link
          href="/history"
          className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">History</h2>
          <p className="text-gray-600">View past workouts</p>
        </Link>
      </div>
    </main>
  );
}
