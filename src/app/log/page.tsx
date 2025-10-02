"use client";

import { LogSetForm } from "@/components/sets/log-set-form";
import Link from "next/link";

export default function LogPage() {
  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          ← Back to home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Log Set</h1>
      <p className="text-gray-600 mb-8">
        Record your workout set with reps and optional weight
      </p>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <LogSetForm />
      </div>

      <div className="mt-6 text-center">
        <Link href="/history" className="text-blue-600 hover:underline">
          View workout history →
        </Link>
      </div>
    </div>
  );
}
