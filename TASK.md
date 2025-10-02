# Workout Tracker — PRD v1.0

## 1) Summary

A simple, fast, offline‑first workout logger that lets you:

* Create arbitrary exercises.
* Log sets (reps, optional weight, optional notes, optional RPE), all timestamped.
* View history and simple analytics (e.g., “How many push‑ups this week?” “Average push‑ups/day?” “Best set ever?”).
* Sync across devices without breaking the offline flow.

**Opinionated stance:** keep the raw data granular (event‑sourced “Set” records). Derive analytics on‑demand or via background aggregation. This maximizes future flexibility (e.g., additional metrics, PRs, streaks) without changing the core model.

---

## 2) Goals & Non‑Goals

**Goals**

1. **Instant log UX:** one tap to add a set; keypad for reps/weight; undo within 5s.
2. **Arbitrary exercises:** user‑defined names + type (bodyweight vs weighted) + default unit (kg/lb/none).
3. **Offline‑first:** logs work without network; sync later.
4. **Simple analytics:** totals by period, moving averages, PRs, streaks, recent trends per exercise.
5. **Data sovereignty:** export (CSV/JSON); easy import/merge.

**Non‑Goals (v1.0)**

* Social feeds, coaching, programs.
* Auto‑timers, heart‑rate, GPS, HealthKit write (see roadmap).
* Barbell calc plates, 1RM test protocols (beyond simple e1RM formulas).

---

## 3) Success Metrics

* **TTV (time‑to‑value) < 10s**: new user can create first exercise & log a set.
* **Median log latency < 150ms** (local): keystroke→set saved (offline).
* **7‑day retention**: ≥ 40% of first‑week users return twice.
* **Data export NPS**: ≥ 60% of surveyed users rate export as “easy”.

---

## 4) Platform Options & Recommendation

**A. Web PWA (Next.js / TS) — recommended for v1.0**

* **Pros:** you have deep web/TS experience; fastest to ship; works on any device; installable; offline (Service Worker + IndexedDB). Easy to deploy (Vercel). Can wrap later in a native shell.
* **Cons:** no HealthKit; iOS PWAs have background limits; no true native widgets/Live Activities.

**B. iOS Native (SwiftUI + SwiftData/CloudKit)**

* **Pros:** best native UX; HealthKit; widgets; Live Activities; App Intents.
* **Cons:** slower for you; Swift/Apple stack overhead; App Store overhead.

**C. Cross‑platform Native (Expo/React Native)**

* **Pros:** TS/JS across platforms; native modules possible (HealthKit via plugins); publish to App Store/Play later.
* **Cons:** more infra than PWA; plugin complexity; still an app‑store pipeline.

**Recommendation:** Ship **Web PWA** first, with a clean architecture so we can later: (1) keep the same backend, (2) reuse UI/logic in Expo if desired, or (3) port to SwiftUI if HealthKit becomes must‑have.

---

## 5) Architecture (PWA path)

**Client**: Next.js (App Router), TypeScript, Tailwind, Zustand (or Redux Toolkit) for UI state, **Dexie** for IndexedDB. Service Worker for offline caching & background sync (when available).

**Sync/Backend**: **Convex** (fits your stack) or **Supabase**. Use ULIDs for IDs, server issues authoritative `serverTimestamp`. Conflict strategy: last‑write‑wins at the field level; edits recorded as new versions.

**Derived Data**: On‑device and server‑side aggregation tables:

* `daily_exercise_stats`: (user_id, exercise_id, date, total_sets, total_reps, total_weight, max_weight, max_reps, est_1rm_max)
* Optional rolling caches: weekly/monthly rollups.

**Security**: Clerk auth; per‑user row security; encrypted at rest (server) + optional local passcode to lock app.

**Data export**: client‑side CSV/JSON dump; server endpoint for full export.

---

## 6) Data Model (canonical v1)

```ts
// IDs are ULIDs; timestamps ISO 8601 in UTC.

// Exercises are user-defined and mutable (rename safe).
// Avoid hard deletion; keep is_deleted for referential integrity.
export type Unit = 'none' | 'lb' | 'kg';
export type ExerciseType = 'bodyweight' | 'weighted' | 'time' | 'distance'; // v1 focuses on bodyweight/weighted

export interface Exercise {
  id: string;
  user_id: string;
  name: string;           // e.g., "Push-up"
  type: ExerciseType;     // 'bodyweight'|'weighted'
  default_unit: Unit;     // 'none'|'lb'|'kg'
  tags?: string[];        // e.g., ['upper','push']
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Core event; everything derives from Sets
export interface SetEvent {
  id: string;
  user_id: string;
  exercise_id: string;
  reps: number;           // integer >= 0
  weight?: number;        // nullable if bodyweight; stored in base unit
  unit?: Unit;            // present if weight is set; defaults to exercise.default_unit
  rpe?: number;           // 1-10
  notes?: string;
  performed_at: string;   // timestamp (UTC)
  created_at: string;     // timestamp (UTC)
  updated_at: string;     // timestamp (UTC)
  source: 'manual'|'import'|'api';
  is_deleted: boolean;
}

export interface WorkoutSession { // optional grouping
  id: string;
  user_id: string;
  name?: string;          // e.g., "Upper Body A"
  started_at: string;
  ended_at?: string;      // null if still in progress
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SetToSession {
  set_id: string;
  session_id: string;
}

export interface DailyExerciseStats {
  id: string;             // user_id + exercise_id + date
  user_id: string;
  exercise_id: string;
  date: string;           // YYYY-MM-DD (UTC day)
  total_sets: number;
  total_reps: number;
  total_weight: number;   // sum(weight*reps) for weighted exercises
  max_weight?: number;
  max_reps?: number;
  est_1rm_max?: number;   // best estimated 1RM that day
  updated_at: string;
}
```

**Notes**

* Keep **raw `SetEvent` immutable** (edits create a new version with `updated_at`; we can soft-delete prior). This preserves history and makes analytics trustworthy.
* **Units:** store weight in a base unit (kg) and convert at the edge; show user‑preferred unit.
* **e1RM formula:** use Epley (1RM = w * (1 + reps/30)) or Brzycki; configurable later.

---

## 7) Core User Flows (PWA)

1. **Create Exercise** → name → type → default unit → (optional tags) → done.
2. **Quick Log Set** → select exercise (recent pinned at top) → keypad modal → reps (required) → weight (optional) → save → toast with Undo.
3. **History** → reverse‑chron timeline grouped by day; tap to edit/delete; long‑press to duplicate.
4. **Analytics** →

   * (a) per‑exercise chart: daily/weekly totals, moving 7‑day avg, best set.
   * (b) query builder: “push‑ups this week”, “avg/day last 30 days”, “total volume by exercise this month”.
5. **Search & Pins** → global search across exercises; pin favorites.
6. **Export/Import** → CSV/JSON export; import merges by ULID + timestamp heuristic.

---

## 8) Screens & Components

* **Home / Today**: pinned exercises, one‑tap “+ Set”, recent history of today.
* **Add Set Modal**: numeric keypad (0–9), quick +5 reps, weight field with unit toggle, RPE slider, timestamp adjuster.
* **Exercise Detail**: header stats (7‑day total, 30‑day trend), chart, last 10 sets, PR highlights.
* **Analytics**:

  * Quick filters: Today / 7D / 30D / 12W / YTD / Custom.
  * Cards: Total reps, Total sets, Total volume, Avg/day, Streak, Best set.
* **Library**: exercises list with tags & usage counts.
* **Settings**: units (kg/lb), export/import, theme, account, data wipe.

**Design Language**: minimalist, large tap targets, 1‑handed keypad, high contrast; persistent bottom bar (Today / Exercises / Analytics / Settings).

---

## 9) Analytics Spec

**Event semantics:**

* Total reps (bodyweight): `Σ reps`.
* Volume (weighted): `Σ (reps * weight_kg)`.
* Best set (weighted): max weight; (bodyweight): max reps.
* e1RM (if weighted): choose formula; default Epley.
* Streak: consecutive days with ≥1 set (any exercise) or per exercise.

**Example queries (server-side pseudo‑TS with Convex):**

```ts
// total reps for an exercise in a date range
function totalReps(userId: string, exerciseId: string, from: Date, to: Date) {
  return db.setEvents
    .where({ user_id: userId, exercise_id: exerciseId, performed_at: { $gte: from, $lt: to }, is_deleted: false })
    .reduce((sum, s) => sum + (s.reps ?? 0), 0);
}

// daily breakdown for charting
function dailyStats(userId: string, exerciseId: string, from: Date, to: Date) {
  // group by YYYY-MM-DD UTC
}

// average per day over a period
avgPerDay = totalReps / numberOfDays(from..to);
```

**Aggregation job** (runs on sync / cron):

* Recompute `daily_exercise_stats` for any date windows touched by new/edited sets.
* Maintain rolling caches (7D/30D) per exercise to render charts instantly.

---

## 10) Sync & Offline Strategy

* **Local‑first writes** to IndexedDB (Dexie). Enqueue for sync.
* **Background sync** when online; resolve conflicts by `updated_at`.
* Force a **monotonic `performed_at`** constraint per user to avoid future timestamps.
* **Clock drift handling:** client sends local time + offset; server stores canonical UTC; UI displays local zone.

---

## 11) Privacy, Security, Safety

* Single‑tenant user data partitioning; access scoped by `user_id`.
* PII minimal: email for login; no health data (v1).
* Export/Import requires explicit user action; confirm before overwriting.

---

## 12) Backlog & Phased Scope

**MVP**

* Create/edit/delete exercises.
* Log/edit/undo sets; timestamp adjustment.
* Today timeline & Exercise detail.
* Analytics: totals by period, average/day, best set, simple charts.
* Export CSV/JSON.
* Offline‑first; sign‑in with Clerk; basic sync with Convex.

**v1.1**

* Streaks; PR detection; pinning; tags & filters; rest timer.
* Saved queries (e.g., “Push‑ups this week”).
* Import from CSV (FitNotes/Strong formats).

**v1.2**

* iOS install guide, PWA polish (splash, icons, app manifest); share sheet deep links.
* Aggregation performance work; background jobs; cache charts.

**v2.0 (native‑adjacent)**

* Expo wrapper or SwiftUI port; widgets; Siri/App Intents; HealthKit write for workouts (session‑level aggregates only, keep SetEvents as app‑internal source of truth).

---

## 13) Acceptance Criteria (samples)

1. From a fresh account, user creates an exercise and logs a set **in ≤ 10 seconds** of first load.
2. With network off, user logs sets; on reconnect, server reflects them and analytics update.
3. “Push‑ups this week” returns total reps matching the 7D chart sum.
4. Editing a set updates `updated_at`, triggers re‑aggregation for that day only.
5. CSV export contains all raw SetEvents and Exercises with stable IDs.

---

## 14) Risks & Mitigations

* **Clock/timezone bugs** → always store UTC; display in local; deterministic day bucketing.
* **iOS PWA constraints** → keep app fast without background tasks; plan a native path later.
* **User data loss fear** → auto backups server‑side; explicit export; soft delete everywhere; versioned edits.
* **Schema drift** → include `schema_version` in exports; write migrators.

---

## 15) Implementation Notes (PWA)

* **Stack**: Next.js (App Router), Tailwind, Radix UI, Zustand, Dexie, Convex, Clerk.
* **ID strategy**: ULID client‑side to enable optimistic UI; server validates.
* **Number keypad**: custom component; supports long‑press repeat; haptic on mobile.
* **Charts**: Lightweight (e.g., Recharts or Chart.js); preformat data client‑side.
* **Testing**: Vitest + Playwright; seed demo data for e2e.

---

## 16) Example UI Copy

* Empty state (Today): “No sets yet. Tap an exercise to log your first set.”
* Undo toast: “Set saved. Undo?”
* Export: “Your data is yours. Download CSV/JSON.”

---

## 17) Open Extensions (later)

* Program builder; superset/AMRAP/EMOM templates.
* Plate math; timed sets; interval sessions.
* Coach share links; privacy scopes.
* AI summaries (“Your volume is up 14% vs last week”).

---

## 18) Minimal API Sketch (Convex‑style)

```ts
// /api/exercises.create
// body: { name, type, default_unit, tags }
// returns: Exercise

// /api/sets.create
// body: { exercise_id, reps, weight?, unit?, rpe?, notes?, performed_at }
// returns: SetEvent

// /api/sets.update
// body: { id, ...fields }

// /api/sets.listByRange
// query: { exercise_id?, from, to }

// /api/stats.exerciseDaily
// query: { exercise_id, from, to }

// /api/export
// returns: { exercises: Exercise[], sets: SetEvent[] }
```

---

## 19) Visual QA Checklist

* Big tap targets (≥48px) on keypad & primary buttons.
* Dark/light themes; high contrast; screen reader labels.
* Zero‑layout shift during typing; fixed keypad avoids scroll jumps.

---

## 20) Default Decisions (so we don’t block)

* Base unit = **kg**; display in user‑preferred (kg/lb).
* e1RM = **Epley** by default.
* Conflict = **last‑write‑wins** on fields; maintain edit history via versions.
* Day window = **UTC date** for storage; display local day in UI.

---

### That’s the v1.0 PRD skeleton

Concrete next step: start a repo with the stack above, scaffold the data model, seed a few exercises (Push‑up, Pull‑up, Squat), and implement the **Quick Log → Today Timeline** loop before any analytics. Analytics comes second once the set pipeline feels instant.

