# TASK: Unified Dashboard UX Redesign

**Status:** Ready for Implementation
**Priority:** P0 - Critical UX Improvement
**Effort Estimate:** 2-3 days (phased rollout)
**Target:** v1.1

---

## Executive Summary

Complete redesign of the Volume workout tracker to eliminate unnecessary navigation, streamline the logging workflow, and provide immediate visual feedback. The current 4-page structure (Home → Log → History → Exercises) creates friction in the core user flow. This redesign consolidates everything into a single, powerful dashboard optimized for mobile-first logging with zero navigation required for 95% of use cases.

**Key Goals:**
1. Reduce time-to-log from 3 clicks + 2 page loads to 0 clicks
2. Provide immediate visual feedback (log → see result instantly)
3. Enable inline exercise creation without breaking flow
4. Display contextual daily analytics at a glance
5. Optimize for mobile thumb-zone interaction

---

## Problem Statement

### Current User Flow (Broken)
```
Open app → Home (useless splash)
         → Click "Log Set"
         → Navigate to /log
         → Select exercise
         → Enter reps/weight
         → Submit
         → Click "View history"
         → Navigate to /history
         → Finally see logged set
```

**Problems:**
- 🚫 **6 interactions** to complete one simple action
- 🚫 **2 page navigations** lose context
- 🚫 **No immediate feedback** - did it work? Must navigate to check
- 🚫 **Can't create exercises inline** - must exit form, navigate to /exercises, then come back
- 🚫 **Home page is useless** - just 3 cards that do nothing
- 🚫 **Context loss** - can't see recent sets while logging
- 🚫 **No analytics** - no idea how many sets logged today

### Ideal User Flow (Goal)
```
Open app → See dashboard with form + recent history
         → Select exercise (or create new inline)
         → Enter reps
         → Hit Enter
         → Set appears instantly in history below
         → Form clears, ready for next set
```

**Wins:**
- ✅ **1-2 interactions** to log a set
- ✅ **Zero navigation** for core workflow
- ✅ **Immediate feedback** - see logged set appear
- ✅ **Inline exercise creation** - never leave the form
- ✅ **Context preservation** - always see what you just did
- ✅ **Daily stats visible** - gamification & motivation

---

## User Personas & User Stories

### Primary Persona: "Quick Logger Quinn"
**Profile:** 28, uses phone at gym, logs 20-40 sets/week, has 5-10 favorite exercises
**Goal:** Log sets as fast as possible between workout sets (30-90 second rest periods)
**Pain Point:** Current app requires too much tapping and waiting

**User Stories:**
- "I want to log a set in under 3 seconds so I don't forget my rep count"
- "I want to see what I just logged so I know the app didn't glitch"
- "I want to repeat my last set without re-entering all the values"
- "I want to create a new exercise without leaving the log form"
- "I want to see how many sets I've done today for motivation"

### Secondary Persona: "Data-Driven Dana"
**Profile:** 35, tracks everything, reviews history weekly, uses desktop + mobile
**Goal:** Understand progress trends, maintain accurate records
**Pain Point:** No analytics, hard to see patterns

**User Stories:**
- "I want to see daily totals so I know if I'm hitting my volume goals"
- "I want to browse chronological history to remember what I did"
- "I want to delete mistakes easily"
- "I want keyboard shortcuts on desktop for speed"

### Tertiary Persona: "Newbie Noah"
**Profile:** 22, just started working out, only has 2-3 exercises
**Goal:** Build habit, don't get overwhelmed by complexity
**Pain Point:** Apps with too many features are intimidating

**User Stories:**
- "I want a simple interface that doesn't require reading docs"
- "I want empty states that guide me what to do first"
- "I want the app to work on my phone's small screen"

---

## Design Philosophy

### Core Principles

1. **Optimize for Frequency, Not Complexity**
   - Users log sets 20-40x/week but only create exercises 1-2x/month
   - Logging must be instant; exercise management can be separate

2. **Zero Navigation for Core Actions**
   - Everything you need on one page
   - Navigation is for power users only (bulk exercise management)

3. **Immediate Feedback Loop**
   - Log → See result instantly
   - No "did it work?" uncertainty
   - Optimistic UI updates

4. **Progressive Disclosure**
   - Simple by default, powerful when needed
   - Inline creation for exercises
   - Collapsible stats for focus

5. **Mobile-First, Desktop-Enhanced**
   - Thumb-zone optimized on mobile
   - Keyboard-optimized on desktop
   - Responsive, not just scaled

6. **Respect User's Context**
   - Always show recent history
   - Remember last exercise
   - Pre-fill common values

---

## Technical Architecture

### Component Hierarchy

```
app/
└── page.tsx (Unified Dashboard)
    ├── <DailyStatsCard />          [collapsible, top]
    ├── <QuickLogForm />             [sticky on mobile scroll]
    │   ├── <SmartExerciseSelector />
    │   ├── <InlineExerciseCreator /> [conditional]
    │   ├── <NumericInput name="reps" />
    │   ├── <NumericInput name="weight" />
    │   └── <RepeatLastButton />
    ├── <UndoToast />               [portal, fixed position]
    └── <GroupedSetHistory />        [infinite scroll later]
        └── <DayGroup date="today">
            ├── <SetCard set={...} />
            │   ├── <RepeatButton />
            │   └── <DeleteButton />
            └── ...
```

### State Management Strategy

**Convex Reactive Queries (Real-time, Server State):**
```typescript
// Auto-updates on any data change
const sets = useQuery(api.sets.listSets, {});
const exercises = useQuery(api.exercises.listExercises);
```

**Local Component State (Form Inputs, UI State):**
```typescript
// Quick log form
const [selectedExerciseId, setSelectedExerciseId] = useState<Id<"exercises"> | "">("");
const [reps, setReps] = useState("");
const [weight, setWeight] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

// Inline exercise creator
const [showInlineCreator, setShowInlineCreator] = useState(false);
const [newExerciseName, setNewExerciseName] = useState("");

// Daily stats card
const [statsExpanded, setStatsExpanded] = useState(true);

// Undo toast
const [undoToast, setUndoToast] = useState<{visible: boolean, setId?: Id<"sets">}>({visible: false});
```

**Derived State (Client-side Transformations):**
```typescript
// Calculate daily stats from sets array
const todayStats = useMemo(() => {
  if (!sets) return null;

  const today = new Date().toDateString();
  const todaySets = sets.filter(set =>
    new Date(set.performedAt).toDateString() === today
  );

  return {
    totalSets: todaySets.length,
    totalReps: todaySets.reduce((sum, set) => sum + set.reps, 0),
    totalVolume: todaySets.reduce((sum, set) =>
      sum + (set.weight ? set.reps * set.weight : 0), 0
    ),
    exercisesWorked: new Set(todaySets.map(s => s.exerciseId)).size,
  };
}, [sets]);

// Group sets by day
const groupedSets = useMemo(() => {
  if (!sets) return [];

  const groups: Map<string, typeof sets> = new Map();

  sets.forEach(set => {
    const date = new Date(set.performedAt);
    const dateKey = date.toDateString();

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(set);
  });

  return Array.from(groups.entries()).map(([date, sets]) => ({
    date,
    displayDate: formatDateGroup(date),
    sets: sets.sort((a, b) => b.performedAt - a.performedAt), // newest first
  }));
}, [sets]);

// Sort exercises by recent usage
const exercisesByRecency = useMemo(() => {
  if (!exercises || !sets) return exercises;

  // Count last usage timestamp per exercise
  const lastUsed = new Map<Id<"exercises">, number>();
  sets.forEach(set => {
    const current = lastUsed.get(set.exerciseId) || 0;
    if (set.performedAt > current) {
      lastUsed.set(set.exerciseId, set.performedAt);
    }
  });

  // Sort: most recently used first, then alphabetical
  return [...exercises].sort((a, b) => {
    const aUsed = lastUsed.get(a._id) || 0;
    const bUsed = lastUsed.get(b._id) || 0;

    if (aUsed !== bUsed) return bUsed - aUsed;
    return a.name.localeCompare(b.name);
  });
}, [exercises, sets]);
```

### Data Flow

**Logging a Set (Happy Path):**
```
User selects exercise in dropdown
  → selectedExerciseId state updates
  → Reps input auto-focuses (useEffect)

User types reps (e.g., "20")
  → reps state updates
  → Weight input auto-focuses on Tab/Enter

User submits form (Enter or click)
  → setIsSubmitting(true)
  → Call logSet mutation (Convex)
  → Optimistic update: immediately add temp card to UI
  → On success:
    - Clear form inputs
    - Auto-focus exercise selector
    - Show undo toast for 3s
    - Convex auto-updates sets query (reactive)
    - Temp card replaced by real card
  → On error:
    - Remove temp card
    - Show error toast
    - Keep form values for retry
  → setIsSubmitting(false)
```

**Creating Exercise Inline:**
```
User selects "+ Create new exercise" in dropdown
  → showInlineCreator = true
  → Inline form appears below dropdown
  → Auto-focus new exercise name input

User types exercise name
  → newExerciseName state updates

User clicks "Create" or hits Enter
  → Call createExercise mutation
  → On success:
    - Hide inline creator
    - Auto-select newly created exercise
    - Auto-focus reps input
    - Show success toast (brief)
  → On error:
    - Show error message
    - Keep inline form open for retry
```

**Repeating Last Set:**
```
User clicks "Repeat" button on a set card
  → Pre-fill form with that set's values:
    - selectedExerciseId = set.exerciseId
    - reps = set.reps.toString()
    - weight = set.weight?.toString() || ""
  → Auto-focus reps input (for quick edit)
  → Scroll form into view
```

**Deleting a Set:**
```
User clicks "Delete" button on set card
  → Confirm dialog (browser confirm for now)
  → If confirmed:
    - Call deleteSet mutation
    - Optimistic update: fade out card
    - On success: Convex auto-updates query
    - On error: Re-show card, display error toast
```

### Convex Integration

**Existing Queries (Keep As-Is):**
- `api.sets.listSets` - Returns all sets for user, desc order
- `api.exercises.listExercises` - Returns all exercises, desc order

**Existing Mutations (Keep As-Is):**
- `api.sets.logSet` - Creates new set
- `api.sets.deleteSet` - Deletes set by ID
- `api.exercises.createExercise` - Creates new exercise
- `api.exercises.deleteExercise` - Deletes exercise (unused on dashboard)

**New Queries (Optional, Phase 2):**
```typescript
// convex/sets.ts
export const getTodayStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const startOfDay = new Date().setHours(0, 0, 0, 0);

    const todaySets = await ctx.db
      .query("sets")
      .withIndex("by_user_performed", (q) =>
        q.eq("userId", identity.subject).gte("performedAt", startOfDay)
      )
      .collect();

    return {
      totalSets: todaySets.length,
      totalReps: todaySets.reduce((sum, set) => sum + set.reps, 0),
      totalVolume: todaySets.reduce((sum, set) =>
        sum + (set.weight ? set.reps * set.weight : 0), 0
      ),
      exercisesWorked: new Set(todaySets.map(s => s.exerciseId)).size,
    };
  },
});
```

**Decision:** Start with client-side calculation (simpler), add server-side aggregation if performance issues arise with large datasets.

---

## UI/UX Specifications

### Layout Responsive Breakpoints

**Mobile (< 640px):**
- Single column layout
- Stacked form fields (vertical)
- Sticky form header on scroll (optional)
- Bottom nav if needed
- 16px horizontal padding

**Tablet (640px - 1024px):**
- Max-width container (640px)
- 2-column form grid (exercise + reps / weight + button)
- Same vertical rhythm as mobile
- 24px horizontal padding

**Desktop (> 1024px):**
- Max-width container (896px for readability)
- Single-row form (all fields horizontal)
- Larger stats cards (more detail)
- 32px horizontal padding
- Keyboard shortcuts active

### Mobile Layout (Primary Focus)

```
┌─────────────────────────────────────┐
│  Volume              🌙 👤         │  ← Nav (existing)
├─────────────────────────────────────┤
│  📊 Today's Progress        ▲       │  ← Collapsible stats
│  ┌─────────────────────────────┐   │
│  │ 3 sets • 55 reps • 2 exercises │
│  │ 405 lbs total volume       │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Quick Log                          │  ← Section heading
│  ┌─────────────────────────────┐   │
│  │ Exercise                    │   │
│  │ [Push-ups            ▼]    │   │  ← Smart dropdown
│  │                             │   │
│  │ Reps *                      │   │
│  │ [           20           ]  │   │  ← inputMode numeric
│  │                             │   │
│  │ Weight (lbs)                │   │
│  │ [                        ]  │   │  ← optional
│  │                             │   │
│  │ [🔄 Repeat Last] [Log Set]  │   │  ← 2 buttons
│  └─────────────────────────────┘   │
│                                     │
│  [+ Create new exercise]            │  ← Inline expander
│                                     │
├─────────────────────────────────────┤
│  Recent Activity                    │  ← Section heading
│                                     │
│  📅 Today                           │  ← Day group
│  ┌─────────────────────────────┐   │
│  │ Push-ups                    │   │
│  │ 20 reps                     │   │
│  │ 2 hours ago      [↻] [❌]   │   │  ← Actions
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Squats                      │   │
│  │ 15 reps @ 135 lbs           │   │
│  │ 4 hours ago      [↻] [❌]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  📅 Yesterday                       │
│  ┌─────────────────────────────┐   │
│  │ Pull-ups                    │   │
│  │ 10 reps                     │   │
│  │ 7:30 PM          [↻] [❌]   │   │
│  └─────────────────────────────┘   │
│  ...                                │
└─────────────────────────────────────┘
     [Toast: Set logged! Undo]        ← Bottom toast (3s)
```

### Desktop Layout (One-Row Form)

```
┌───────────────────────────────────────────────────────┐
│  Volume                              🌙 👤           │
├───────────────────────────────────────────────────────┤
│                                                       │
│  📊 Today's Progress                          ▲       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  3 sets • 55 reps • 2 exercises • 405 lbs total│ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Quick Log                                            │
│  ┌─────────────────────────────────────────────────┐ │
│  │ [Exercise ▼] [Reps] [Weight] [🔄 Repeat] [Log] │ │
│  └─────────────────────────────────────────────────┘ │
│  [+ Create new exercise]                              │
│                                                       │
│  Recent Activity                                      │
│                                                       │
│  📅 Today                                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Push-ups • 20 reps              2h ago [↻] [❌] │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Squats • 15 reps @ 135 lbs      4h ago [↻] [❌] │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Color System & Visual Hierarchy

**Existing Tailwind Classes (Preserve):**
- Background: `bg-gray-50 dark:bg-gray-900`
- Cards: `bg-white dark:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- Text: `text-gray-900 dark:text-gray-100`
- Muted text: `text-gray-600 dark:text-gray-400`

**New Semantic Colors:**
- Primary action: `bg-blue-600 dark:bg-blue-500` (Log button)
- Success: `bg-green-50 dark:bg-green-900/20` (Success toast)
- Error: `bg-red-50 dark:bg-red-900/20` (Error messages)
- Warning: `bg-amber-50 dark:bg-amber-900/20` (Confirmations)
- Accent: `bg-purple-600` (Stats highlights, optional)

**Typography Hierarchy:**
- Page title: `text-3xl font-bold` (Volume in nav)
- Section heading: `text-xl font-semibold mb-4`
- Subsection: `text-lg font-medium mb-2`
- Card title: `text-base font-semibold`
- Body text: `text-base`
- Secondary text: `text-sm text-gray-600 dark:text-gray-400`
- Micro text: `text-xs text-gray-500 dark:text-gray-500`

### Spacing & Rhythm

**Vertical Spacing:**
- Between major sections: `mb-8` (32px)
- Between cards in list: `gap-3` (12px)
- Within cards: `p-4` (16px)
- Form field spacing: `space-y-4` (16px)

**Horizontal Spacing:**
- Page horizontal padding: `px-4 sm:px-6 lg:px-8`
- Form elements gap: `gap-2` (8px) on mobile, `gap-3` (12px) on desktop
- Button internal padding: `px-6 py-3`

---

## Component Specifications

### 1. DailyStatsCard

**Purpose:** Display motivational daily statistics in a collapsible card.

**Props:**
```typescript
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
```

**State:**
- Controlled by parent (expanded/collapsed)

**Layout:**
```tsx
<div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between"
    aria-expanded={expanded}
  >
    <div className="flex items-center gap-2">
      <span className="text-2xl">📊</span>
      <h2 className="text-lg font-semibold">Today's Progress</h2>
    </div>
    <ChevronDown className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
  </button>

  {expanded && stats && (
    <div className="mt-4 grid grid-cols-2 gap-4">
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
  )}

  {expanded && !stats && (
    <p className="mt-4 text-gray-500 dark:text-gray-400 text-center">
      No sets logged yet today. Get started! 💪
    </p>
  )}
</div>
```

**Interactions:**
- Click anywhere to toggle expand/collapse
- Animate height change (transition-all duration-200)
- ChevronDown icon rotates 180deg when expanded
- Persist expanded state to localStorage (optional)

**Accessibility:**
- `aria-expanded` on toggle button
- Semantic heading (`<h2>`)
- Sufficient color contrast
- Focus state on button

---

### 2. QuickLogForm

**Purpose:** Main form for logging sets. Must be fast, keyboard-friendly, and mobile-optimized.

**Props:**
```typescript
interface QuickLogFormProps {
  exercises: Exercise[];
  onSetLogged?: (setId: Id<"sets">) => void;
}
```

**State:**
```typescript
const [selectedExerciseId, setSelectedExerciseId] = useState<Id<"exercises"> | "">("");
const [reps, setReps] = useState("");
const [weight, setWeight] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [showInlineCreator, setShowInlineCreator] = useState(false);

// Refs for auto-focus
const exerciseRef = useRef<HTMLSelectElement>(null);
const repsRef = useRef<HTMLInputElement>(null);
const weightRef = useRef<HTMLInputElement>(null);
```

**Form Validation:**
```typescript
const isValid = useMemo(() => {
  return (
    selectedExerciseId !== "" &&
    reps !== "" &&
    parseInt(reps, 10) > 0
  );
}, [selectedExerciseId, reps]);
```

**Submit Handler:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!isValid || isSubmitting) return;

  setIsSubmitting(true);

  try {
    const setId = await logSet({
      exerciseId: selectedExerciseId as Id<"exercises">,
      reps: parseInt(reps, 10),
      weight: weight ? parseFloat(weight) : undefined,
    });

    // Clear form
    setReps("");
    setWeight("");
    // Keep selectedExerciseId for quick re-logging

    // Show undo toast
    onSetLogged?.(setId);

    // Auto-focus reps for next set
    setTimeout(() => repsRef.current?.focus(), 100);

  } catch (error) {
    console.error("Failed to log set:", error);
    alert("Failed to log set. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
```

**Auto-Focus Flow:**
```typescript
// When exercise selected, focus reps
useEffect(() => {
  if (selectedExerciseId && repsRef.current) {
    repsRef.current.focus();
  }
}, [selectedExerciseId]);

// When reps filled, on Enter, focus weight (or submit if no weight needed)
const handleRepsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    if (weightRef.current) {
      weightRef.current.focus();
    } else {
      handleSubmit(e as any);
    }
  }
};
```

**Layout (Mobile-First):**
```tsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
  <h2 className="text-xl font-semibold mb-4">Quick Log</h2>

  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Exercise Selector */}
    <div>
      <label htmlFor="exercise" className="block text-sm font-medium mb-2">
        Exercise <span className="text-red-500">*</span>
      </label>
      <select
        id="exercise"
        ref={exerciseRef}
        value={selectedExerciseId}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "CREATE_NEW") {
            setShowInlineCreator(true);
          } else {
            setSelectedExerciseId(value as Id<"exercises">);
          }
        }}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      >
        <option value="">Select an exercise...</option>
        {exercises.map((exercise) => (
          <option key={exercise._id} value={exercise._id}>
            {exercise.name}
          </option>
        ))}
        <option value="CREATE_NEW" className="border-t border-gray-300 dark:border-gray-600">
          + Create new exercise
        </option>
      </select>
    </div>

    {/* Inline Exercise Creator (conditional) */}
    {showInlineCreator && (
      <InlineExerciseCreator
        onCreated={(exerciseId) => {
          setSelectedExerciseId(exerciseId);
          setShowInlineCreator(false);
          setTimeout(() => repsRef.current?.focus(), 100);
        }}
        onCancel={() => setShowInlineCreator(false)}
      />
    )}

    {/* Reps Input */}
    <div>
      <label htmlFor="reps" className="block text-sm font-medium mb-2">
        Reps <span className="text-red-500">*</span>
      </label>
      <input
        id="reps"
        ref={repsRef}
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        min="1"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onKeyDown={handleRepsKeyDown}
        placeholder="How many reps?"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isSubmitting}
        required
      />
    </div>

    {/* Weight Input */}
    <div>
      <label htmlFor="weight" className="block text-sm font-medium mb-2">
        Weight (lbs)
      </label>
      <input
        id="weight"
        ref={weightRef}
        type="number"
        inputMode="decimal"
        step="0.5"
        min="0"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="Optional"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isSubmitting}
      />
    </div>

    {/* Buttons */}
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleRepeatLast}
        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting || !lastSet}
      >
        🔄 Repeat Last
      </button>

      <button
        type="submit"
        className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? "Logging..." : "Log Set"}
      </button>
    </div>
  </form>
</div>
```

**Desktop Optimization:**
```tsx
// On screens >= 1024px, use single-row layout
<form className="lg:grid lg:grid-cols-[2fr_1fr_1fr_auto_auto] lg:gap-3 lg:items-end space-y-4 lg:space-y-0">
  {/* Each field removes mb-2 on label, reduces padding */}
</form>
```

---

### 3. InlineExerciseCreator

**Purpose:** Inline form for creating exercises without navigation.

**Props:**
```typescript
interface InlineExerciseCreatorProps {
  onCreated: (exerciseId: Id<"exercises">) => void;
  onCancel: () => void;
}
```

**Implementation:**
```tsx
export function InlineExerciseCreator({ onCreated, onCancel }: InlineExerciseCreatorProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createExercise = useMutation(api.exercises.createExercise);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const exerciseId = await createExercise({ name: name.trim() });
      onCreated(exerciseId);
    } catch (error) {
      console.error("Failed to create exercise:", error);
      alert("Failed to create exercise. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New exercise name..."
          className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
          required
        />
        <button
          type="submit"
          disabled={!name.trim() || isCreating}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCreating ? "..." : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
```

**UX Notes:**
- Auto-focus name input on mount
- Enter to submit, Escape to cancel
- Disable form during creation
- Success → call onCreated with new ID
- Error → show alert, keep form open

---

### 4. GroupedSetHistory

**Purpose:** Display chronological set history grouped by day.

**Props:**
```typescript
interface GroupedSetHistoryProps {
  groupedSets: Array<{
    date: string;
    displayDate: string;
    sets: Set[];
  }>;
  exercises: Exercise[];
  onRepeat: (set: Set) => void;
  onDelete: (setId: Id<"sets">) => void;
}
```

**Implementation:**
```tsx
export function GroupedSetHistory({ groupedSets, exercises, onRepeat, onDelete }: GroupedSetHistoryProps) {
  if (groupedSets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-6xl mb-4">💪</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No sets logged yet
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Log your first set above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

      {groupedSets.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            <span>📅</span>
            <span>{group.displayDate}</span>
          </h3>

          <div className="space-y-3">
            {group.sets.map((set) => (
              <SetCard
                key={set._id}
                set={set}
                exercise={exercises.find(ex => ex._id === set.exerciseId)}
                onRepeat={() => onRepeat(set)}
                onDelete={() => onDelete(set._id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Date Formatting Helper:**
```typescript
function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateString === today) return "Today";
  if (dateString === yesterday.toDateString()) return "Yesterday";

  // Within last week: "Monday", "Tuesday", etc.
  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  // Older: "Jan 15", "Dec 3", etc.
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
```

---

### 5. SetCard

**Purpose:** Display individual set with repeat/delete actions.

**Props:**
```typescript
interface SetCardProps {
  set: Set;
  exercise: Exercise | undefined;
  onRepeat: () => void;
  onDelete: () => void;
}
```

**Implementation:**
```tsx
export function SetCard({ set, exercise, onRepeat, onDelete }: SetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this set? This cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete set:", error);
      alert("Failed to delete set. Please try again.");
      setIsDeleting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`
        p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        rounded-lg hover:shadow-md transition-all
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {exercise?.name || "Unknown exercise"}
          </h4>
          <div className="mt-1 flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <span className="font-medium">{set.reps} reps</span>
            {set.weight && (
              <>
                <span className="text-gray-400">•</span>
                <span>{set.weight} lbs</span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatTime(set.performedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onRepeat}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            aria-label="Repeat this set"
            title="Repeat this set"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            aria-label="Delete this set"
            title="Delete this set"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Lucide Icons Needed:**
```bash
import { RotateCcw, Trash2, ChevronDown } from "lucide-react";
```

---

### 6. UndoToast

**Purpose:** Brief confirmation toast with undo action after logging a set.

**Props:**
```typescript
interface UndoToastProps {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}
```

**Implementation:**
```tsx
export function UndoToast({ visible, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-green-600 dark:bg-green-700 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Set logged successfully!</span>
        </div>
        <button
          onClick={onUndo}
          className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded font-medium transition-colors"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
```

**Tailwind Animation (add to config):**
```typescript
// tailwind.config.ts
animation: {
  "slide-up": "slide-up 0.2s ease-out",
},
keyframes: {
  "slide-up": {
    "0%": { transform: "translateY(100%)", opacity: "0" },
    "100%": { transform: "translateY(0)", opacity: "1" },
  },
},
```

---

## Accessibility Requirements

### Keyboard Navigation

**Tab Order (Desktop):**
1. Theme toggle (nav)
2. User menu (nav)
3. Stats collapse button
4. Exercise dropdown
5. Reps input
6. Weight input
7. Repeat Last button
8. Log Set button
9. Set card repeat buttons (in order)
10. Set card delete buttons (in order)

**Keyboard Shortcuts:**
- `Enter` in reps → focus weight (or submit if weight empty)
- `Enter` in weight → submit form
- `Escape` in inline creator → cancel
- `Cmd/Ctrl + K` → focus exercise dropdown (optional, phase 2)

### Screen Reader Support

**Announcements:**
```typescript
// After logging set
const announce = (message: string) => {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};

// Usage
announce("Set logged: 20 push-ups");
announce("Exercise created: Squats");
announce("Set deleted");
```

**ARIA Labels:**
- Form inputs: Proper `<label>` associations
- Buttons: `aria-label` for icon-only buttons
- Stats card: `aria-expanded` on toggle
- Loading states: `aria-busy="true"`
- Required fields: `aria-required="true"` (implicit with `required` attr)

**Focus Management:**
- After logging set → focus reps input
- After creating exercise → focus reps input
- After opening inline creator → focus name input
- After deleting set → focus next set's repeat button (or form)

### Color Contrast

**WCAG AA Compliance:**
- Text on bg: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

**Test All Combinations:**
- Light mode: Gray text on white bg
- Dark mode: Gray text on dark bg
- Blue button text (white on blue-600)
- Error text (red-600 on red-50)

---

## Performance Considerations

### Optimistic Updates

**Pattern:**
```typescript
const logSetOptimistic = async (setData: SetInput) => {
  // Generate temporary ID
  const tempId = `temp_${Date.now()}` as Id<"sets">;

  // Create optimistic set object
  const optimisticSet: Set = {
    _id: tempId,
    ...setData,
    userId: currentUserId, // from auth
    performedAt: Date.now(),
  };

  // Immediately add to local state
  setOptimisticSets(prev => [optimisticSet, ...prev]);

  try {
    // Call real mutation
    const realSetId = await logSet(setData);

    // Replace temp with real
    setOptimisticSets(prev =>
      prev.map(s => s._id === tempId ? { ...s, _id: realSetId } : s)
    );

  } catch (error) {
    // Remove optimistic set on error
    setOptimisticSets(prev => prev.filter(s => s._id !== tempId));
    throw error;
  }
};
```

**Note:** Convex provides built-in optimistic updates. Use `useOptimisticMutation` if available, otherwise implement manually.

### Virtualization (Phase 3)

**When to Add:**
- User has > 100 sets (unlikely in first months)
- Scroll performance degrades

**Library:**
```bash
pnpm add react-window
```

**Implementation:**
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={sets.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <SetCard set={sets[index]} ... />
    </div>
  )}
</FixedSizeList>
```

### Bundle Size

**Current:** ~105 kB First Load JS
**Target:** < 120 kB after refactor

**Optimizations:**
- Code split by route (Next.js automatic)
- Lazy load heavy components (charts, later)
- Tree-shake Lucide icons (import individually)
- Minimize Tailwind purge (automatic)

### Loading States

**Skeleton Loaders:**
```tsx
function SetCardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
    </div>
  );
}
```

**Usage:**
```tsx
{sets === undefined ? (
  <>
    <SetCardSkeleton />
    <SetCardSkeleton />
    <SetCardSkeleton />
  </>
) : (
  <GroupedSetHistory sets={sets} ... />
)}
```

---

## Edge Cases & Error Handling

### Edge Case Matrix

| Scenario | Behavior |
|----------|----------|
| No exercises exist | Show "Create your first exercise" prompt instead of form |
| Exercise deleted while selected | Clear selection, show error toast |
| Network offline | Queue mutation, show "Offline" indicator, sync when online |
| Duplicate set (same exercise, reps, weight, time) | Allow (intentional supersets) |
| Non-integer reps (e.g., "20.5") | Allow (drop sets, partial reps) |
| Negative reps | Block with HTML5 validation (`min="1"`) |
| Zero reps | Block with validation |
| Extremely large numbers (999999) | Allow but validate on server |
| Form submission during mutation | Disable submit button |
| Double-click submit | Debounce or disable during submission |
| Browser back button | Should stay on dashboard (no navigation) |
| Deleted set still in local cache | Convex query updates automatically |
| Create exercise with duplicate name | Allow (user might want "Push-ups" and "Diamond Push-ups") |

### Error Messages

**User-Friendly Errors:**
```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Unable to connect. Check your internet connection.",
  INVALID_REPS: "Please enter a valid number of reps (1 or more).",
  EXERCISE_NOT_FOUND: "This exercise no longer exists. Please select another.",
  UNAUTHORIZED: "You're not logged in. Please refresh the page.",
  UNKNOWN: "Something went wrong. Please try again.",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Not authenticated")) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    if (error.message.includes("Exercise not found")) {
      return ERROR_MESSAGES.EXERCISE_NOT_FOUND;
    }
  }
  return ERROR_MESSAGES.UNKNOWN;
}
```

### Form Validation

**Client-Side:**
- HTML5 attributes: `required`, `min`, `max`, `pattern`
- Real-time validation feedback (optional, phase 2)
- Disable submit when invalid

**Server-Side (Convex):**
- Already implemented: auth checks, ownership verification
- Already implemented: reps > 0 validation
- Add: max reasonable values (e.g., reps < 1000)

---

## Implementation Phases

### Phase 1: Core Dashboard (Days 1-2)

**Goal:** Functional unified dashboard with feature parity to current app.

**Tasks:**
1. Create new `src/components/dashboard/` directory
2. Implement DailyStatsCard component
3. Implement QuickLogForm component
4. Implement GroupedSetHistory component
5. Implement SetCard component
6. Update `src/app/page.tsx` to use new dashboard
7. Add client-side data transformations (grouping, stats calculation)
8. Test on mobile and desktop
9. Fix any layout/spacing issues

**Success Criteria:**
- ✅ Can log sets from home page
- ✅ Sets appear immediately in history below
- ✅ Daily stats calculate correctly
- ✅ Mobile layout looks good (< 640px)
- ✅ Desktop layout looks good (> 1024px)
- ✅ No regressions (all existing features work)

**Files Modified:**
- `src/app/page.tsx` (complete rewrite)
- `src/components/dashboard/*.tsx` (new files)

**Files Unchanged (for now):**
- `src/app/exercises/page.tsx` (keep for power users)
- `src/app/history/page.tsx` (will delete in Phase 2)
- `src/app/log/page.tsx` (will delete in Phase 2)

---

### Phase 2: Smart Features (Day 3)

**Goal:** Add delightful interactions and smart defaults.

**Tasks:**
1. Implement InlineExerciseCreator component
2. Add "+ Create new exercise" option to dropdown
3. Implement "Repeat Last Set" button logic
4. Add auto-focus flow (exercise → reps → weight → submit)
5. Implement UndoToast component
6. Add keyboard shortcuts (Enter to submit, etc.)
7. Sort exercises by recent usage in dropdown
8. Add inputMode="numeric" and pattern for iOS

**Success Criteria:**
- ✅ Can create exercise inline without navigation
- ✅ Repeat button works (pre-fills form)
- ✅ Undo toast appears after logging
- ✅ Keyboard flow feels natural
- ✅ Mobile numeric keyboard appears for number inputs
- ✅ Most-used exercises appear first in dropdown

**Files Modified:**
- `src/app/page.tsx` (add inline creator, undo toast, repeat logic)
- `src/components/dashboard/quick-log-form.tsx` (add smart features)
- `src/components/dashboard/inline-exercise-creator.tsx` (new)
- `src/components/dashboard/undo-toast.tsx` (new)

---

### Phase 3: Polish & Cleanup (Day 3+)

**Goal:** Remove old code, add animations, final polish.

**Tasks:**
1. Delete `/history` page and route
2. Delete `/log` page and route
3. Update navigation (remove History and Log Set links)
4. Add animations (card slide-in, toast slide-up, stats expand)
5. Add loading skeletons for initial load
6. Add empty state illustrations (optional)
7. Add haptic feedback on mobile (optional)
8. Performance audit (bundle size, load time)
9. Accessibility audit (keyboard nav, screen reader testing)
10. Cross-browser testing (Safari, Chrome, Firefox)

**Success Criteria:**
- ✅ No dead links or 404s
- ✅ Navigation only shows: Home, Exercises, (Theme, User)
- ✅ Animations feel smooth (60fps)
- ✅ Loading states don't flash (min display time)
- ✅ Passes accessibility audit
- ✅ Bundle size < 120 kB

**Files Deleted:**
- `src/app/history/page.tsx`
- `src/app/log/page.tsx`
- `src/components/sets/log-set-form.tsx` (replaced)
- `src/components/sets/set-list.tsx` (replaced)

**Files Modified:**
- `src/components/layout/nav.tsx` (update links)
- `tailwind.config.ts` (add animations)

---

## Testing Strategy

### Manual Testing Checklist

**Mobile (iPhone/Android):**
- [ ] Numeric keyboard appears for reps/weight
- [ ] Touch targets are >= 44px
- [ ] Form fields don't zoom on focus (font-size >= 16px)
- [ ] Scrolling is smooth
- [ ] Buttons are thumb-reachable
- [ ] Dark mode looks good
- [ ] Landscape mode works

**Desktop (Chrome/Safari/Firefox):**
- [ ] Form layout is single-row
- [ ] Keyboard shortcuts work
- [ ] Tab order is logical
- [ ] Hover states work
- [ ] Dark mode looks good
- [ ] Window resize is smooth

**Functional Tests:**
- [ ] Log set → appears in history immediately
- [ ] Delete set → removes from list
- [ ] Repeat set → pre-fills form correctly
- [ ] Create exercise inline → adds to dropdown
- [ ] Stats update after logging set
- [ ] Undo toast appears and works
- [ ] Form clears after submit
- [ ] Auto-focus works correctly
- [ ] Collapsible stats persists state

**Edge Cases:**
- [ ] No exercises → shows create prompt
- [ ] No sets → shows empty state
- [ ] Network offline → error handling
- [ ] Very long exercise name → truncates nicely
- [ ] Many exercises (20+) → dropdown scrolls
- [ ] Many sets (100+) → scrolling performance OK

### Automated Testing (Future)

**Unit Tests (Vitest):**
```typescript
// Example: Daily stats calculation
describe('calculateDailyStats', () => {
  it('should count sets correctly', () => {
    const sets = [
      { performedAt: Date.now(), reps: 10, weight: 100 },
      { performedAt: Date.now(), reps: 15, weight: 50 },
    ];

    const stats = calculateDailyStats(sets);

    expect(stats.totalSets).toBe(2);
    expect(stats.totalReps).toBe(25);
    expect(stats.totalVolume).toBe(1750); // (10*100) + (15*50)
  });
});
```

**Integration Tests (Playwright):**
```typescript
test('can log a set end-to-end', async ({ page }) => {
  await page.goto('/');

  // Fill form
  await page.selectOption('select#exercise', 'Push-ups');
  await page.fill('input#reps', '20');
  await page.click('button[type="submit"]');

  // Verify appears in history
  await expect(page.locator('text=Push-ups')).toBeVisible();
  await expect(page.locator('text=20 reps')).toBeVisible();

  // Verify stats updated
  await expect(page.locator('text=1 set')).toBeVisible();
});
```

---

## Success Metrics

### Quantitative

**Performance:**
- Time to Interactive < 2s (on 3G)
- First Contentful Paint < 1s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Bundle size < 120 kB

**User Behavior (Analytics):**
- Average time to log set < 5 seconds
- Inline exercise creation usage > 50%
- Repeat button usage > 20%
- Daily active users retention +10%
- Sets logged per session +15%

### Qualitative

**User Feedback:**
- "Feels faster"
- "Love the inline exercise creation"
- "Can finally see what I just logged"
- "Mobile experience is great"
- "Don't miss the old navigation"

**Developer Experience:**
- Code is easier to maintain (fewer files)
- Component reusability improved
- State management is clearer
- Future features easier to add

---

## Future Enhancements (Post-v1.1)

### Quick Wins
- Swipe to delete on mobile
- Pull-to-refresh gesture
- Export data (CSV/JSON)
- Import data from other apps

### Medium Effort
- Charts & visualizations (progress over time)
- Personal records tracking (max reps, max weight)
- Workout sessions (group sets)
- Rest timer between sets

### Big Features
- Progressive Web App (install prompt)
- Offline-first with sync queue
- Multi-user (coach sharing)
- Social features (leaderboards)

---

## Migration Notes

### User Communication

**In-App Notice (Optional):**
```
🎉 Volume has a new home screen!

We've streamlined the app to make logging sets faster.
Everything you need is now on one page:
- Quick log form
- Daily stats
- Recent history

Your data is safe and unchanged. Happy lifting! 💪
```

**Changelog Entry:**
```markdown
## v1.1.0 - Unified Dashboard

### Changed
- Redesigned home page into unified dashboard
- Removed separate /log and /history pages
- All core features now accessible without navigation

### Added
- Daily stats card showing sets, reps, volume, exercises
- Inline exercise creation (no more navigation)
- "Repeat Last Set" quick action
- Undo toast after logging sets
- Smart exercise sorting (recent first)

### Improved
- Mobile input experience (numeric keyboards)
- Keyboard shortcuts and auto-focus flow
- Faster logging (3 clicks → 1 click)
- Immediate visual feedback
```

### Rollback Plan

**If critical issues found:**
1. Git revert to previous version
2. Redeploy old code
3. Fix issues in development
4. Re-release when stable

**Database Migration:** None required (no schema changes)

---

## Technical Debt & Cleanup

### After v1.1 Release

**Code Quality:**
- Add JSDoc comments to all components
- Extract magic numbers to constants
- Add PropTypes or Zod validation
- Improve error typing (no `any`)

**Testing:**
- Add Vitest unit tests for utilities
- Add Playwright E2E tests for critical paths
- Set up CI/CD testing pipeline

**Performance:**
- Analyze bundle with Next.js bundle analyzer
- Profile render performance with React DevTools
- Optimize images (if any added later)
- Add service worker (PWA, Phase 4)

**Accessibility:**
- Full WCAG 2.1 AA audit
- Test with screen readers (NVDA, VoiceOver)
- Test with keyboard only
- Add skip links

**Documentation:**
- Update CLAUDE.md with new architecture
- Add component documentation
- Create developer onboarding guide
- Document Convex query patterns

---

## Appendix: Design Mockups

### Mobile Mockup (Detailed)

```
┌─────────────────────────────────────┐
│  ≡ Volume              🌙 👤       │ ← 64px height nav
├─────────────────────────────────────┤
│                                     │ ← 16px top padding
│  📊 Today's Progress        ▲       │ ← 56px header
│  ┌─────────────────────────────┐   │
│  │ 3 sets • 55 reps • 2 exercises │ ← 20px font
│  │ 405 lbs total volume       │   │ ← 16px font
│  └─────────────────────────────┘   │ ← 80px total height
│                                     │
│  Quick Log                          │ ← 24px heading
│  ┌─────────────────────────────┐   │
│  │ Exercise                    │   │ ← 14px label
│  │ [Push-ups            ▼]    │   │ ← 48px select
│  │                             │   │ ← 16px gap
│  │ Reps *                      │   │
│  │ [           20           ]  │   │ ← 48px input
│  │                             │   │
│  │ Weight (lbs)                │   │
│  │ [                        ]  │   │ ← 48px input
│  │                             │   │ ← 16px gap
│  │ [🔄 Repeat] [Log Set]      │   │ ← 48px buttons
│  └─────────────────────────────┘   │ ← ~320px total
│                                     │
│  + Create new exercise              │ ← 44px link
│                                     │ ← 32px gap
│  Recent Activity                    │ ← 24px heading
│                                     │
│  📅 Today                           │ ← 18px subheading
│  ┌─────────────────────────────┐   │
│  │ Push-ups                    │   │ ← 18px title
│  │ 20 reps                     │   │ ← 16px meta
│  │ 2 hours ago      [↻] [❌]   │   │ ← 14px time, 40px buttons
│  └─────────────────────────────┘   │ ← ~88px card height
│  ┌─────────────────────────────┐   │
│  │ Squats                      │   │
│  │ 15 reps @ 135 lbs           │   │
│  │ 4 hours ago      [↻] [❌]   │   │
│  └─────────────────────────────┘   │
│                                     │
│  📅 Yesterday                       │
│  ┌─────────────────────────────┐   │
│  │ Pull-ups                    │   │
│  │ 10 reps                     │   │
│  │ 7:30 PM          [↻] [❌]   │   │
│  └─────────────────────────────┘   │
│  ...                                │
│                                     │ ← 16px bottom padding
└─────────────────────────────────────┘
```

**Dimensions:**
- Screen width: 375px (iPhone SE, smallest target)
- Content max-width: 100% - 32px padding
- Minimum touch target: 44px × 44px
- Comfortable thumb zone: Bottom 50% of screen

---

## Sign-Off

This PRD represents a complete redesign of the Volume workout tracker's core UX. Implementation should follow the phased approach to manage risk and ensure quality at each step.

**Approved by:** [Your Name]
**Date:** 2025-10-03
**Estimated Completion:** 2025-10-06

---

**End of Document**
