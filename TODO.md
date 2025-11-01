# TODO: Analytics "War Room" Dashboard Redesign

**Branch**: `feature/analytics-ai-insights`
**Goal**: Transform analytics page into data-dense, actionable dashboard with automated AI insights

## Phase 1: Layout Foundation & Quick Fixes

### 1.1 Full-Width Layout

- [x] Remove max-width constraint from analytics page by setting `maxWidth={false}` on PageLayout component in `src/app/analytics/page.tsx:134`
  - Success criteria: Analytics page uses full viewport width on desktop (verify in browser at 1920px)

### 1.2 Activity Heatmap Fixes

- [x] Remove duplicate "Less to More" legend from ActivityHeatmap component in `src/components/analytics/activity-heatmap.tsx:115-132`
  - Delete the custom legend div (lines 115-132)
  - The `react-activity-calendar` library already provides its own legend
  - Success criteria: Only one legend visible, positioned by library default

- [x] Verify date hover tooltips are working in ActivityHeatmap
  - Test `react-activity-calendar` library's built-in tooltip shows dates on hover
  - If not working, investigate library props for enabling tooltips
  - Success criteria: Hovering over heatmap cell shows "Oct 31, 2025: 12 sets" or similar
  ```
  Work Log:
  - Verified react-activity-calendar provides tooltips by default (no config needed)
  - Library automatically shows date and count on hover
  - Current implementation already working - no changes required
  ```

### 1.3 Remove VolumeChart Component

- [x] Remove VolumeChart import and component usage from `src/app/analytics/page.tsx`
  - Delete line 7: `import { VolumeChart } from "@/components/analytics/volume-chart";`
  - Delete line 17: `const volumeData = useQuery(api.analytics.getVolumeByExercise, {});`
  - Remove volumeData from isLoading check (line 37-41)
  - Delete line 164: `<VolumeChart data={volumeData || []} isLoading={isLoading} />`
  - Keep the file `volume-chart.tsx` for potential future use (muscle group volume widget)
  - Success criteria: Analytics page renders without VolumeChart, no console errors

### 1.4 Implement Dashboard Grid Layout

- [x] Replace current grid structure with 12-column Tailwind grid in `src/app/analytics/page.tsx:133-169`
  - Replace div with class `space-y-6` with proper grid container
  - Desktop layout (lg breakpoint): 12-column grid
  - Tablet layout (md breakpoint): 6-column grid (2 widgets side-by-side)
  - Mobile layout (default): Single column stack
  - Grid template:

    ```tsx
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">
      {/* AI Insights: 12 cols full width */}
      <div className="md:col-span-6 lg:col-span-12">
        <AIInsightsCard ... />
      </div>

      {/* Progressive Overload: Will be 8 cols, Focus: 4 cols */}
      {/* Recovery: 6 cols, Heatmap: 6 cols */}
      {/* Streak: 4 cols, PRs: 8 cols */}
    </div>
    ```

  - Success criteria: Grid responds correctly at mobile (360px), tablet (768px), desktop (1440px)

## Phase 2: Progressive Overload Widget

### 2.1 Backend Query for Exercise Progression

- [x] Create `convex/analytics-progressive-overload.ts` with `getProgressiveOverloadData` query

  ```
  Work Log:
  - Implemented query with proper Id<"exercises"> typing
  - Groups sets by date to identify distinct workouts
  - Calculates max weight, max reps, volume per workout
  - Trend detection: last 3 vs previous 3 workouts (5% threshold)
  - Returns top N exercises by most recent activity
  - Helper function calculateTrend() encapsulates trend logic
  ```

  - Function signature:
    ```typescript
    export const getProgressiveOverloadData = query({
      args: { exerciseCount: v.optional(v.number()) },
      handler: async (ctx, args) => {
        // Implementation
      },
    });
    ```
  - Query logic:
    1. Get authenticated user's identity
    2. Fetch all user sets sorted by performedAt desc
    3. Group sets by exerciseId, track last 10 workouts per exercise
    4. For each exercise:
       - Get exercise name from exercises table
       - Extract last 10 distinct workout dates
       - For each workout date, calculate max weight and max reps
       - Calculate trend direction (improving/plateau/declining)
    5. Return top N exercises (default 5) by most recent activity
  - Return type:
    ```typescript
    {
      exerciseId: string,
      exerciseName: string,
      dataPoints: Array<{
        date: string, // YYYY-MM-DD
        maxWeight: number | null,
        maxReps: number,
        volume: number
      }>,
      trend: "improving" | "plateau" | "declining"
    }
    ```
  - Trend calculation logic:
    - Compare last 3 workouts vs previous 3 workouts
    - Improving: avg weight/volume increased >5%
    - Declining: avg weight/volume decreased >5%
    - Plateau: within ±5%
  - Success criteria: Query returns correct progression data for test user with 20+ sets across 3+ exercises

- [x] Write tests for `getProgressiveOverloadData` in `convex/analyticsProgressiveOverload.test.ts`

  ```
  Work Log:
  - Created 16 comprehensive test cases covering all functionality
  - Tests verify max weight/reps calculations, volume aggregation
  - Trend detection tested (improving/plateau/declining with proper thresholds)
  - Edge cases covered: no auth, no sets, <6 workouts, data isolation
  - Renamed file to camelCase (analyticsProgressiveOverload.ts) for Convex API compatibility
  - All 16 tests passing, total test suite: 301 tests passing
  ```

  - Test cases:
    1. Returns top 5 exercises by recent activity ✓
    2. Correctly calculates max weight per workout ✓
    3. Correctly calculates max reps per workout ✓
    4. Limits to last 10 workouts per exercise ✓
    5. Trend detection: improving (weight increased) ✓
    6. Trend detection: plateau (no change) ✓
    7. Trend detection: declining (weight decreased) ✓
    8. Returns empty array for unauthenticated user ✓
    9. Returns empty array for user with no sets ✓
    10. Handles bodyweight exercises (null weight) ✓
    11. Handles multiple sets on same day correctly ✓
    12. DataPoints sorted chronologically ✓
    13. Data isolation between users ✓
    14. Respects custom exerciseCount parameter ✓
    15. Correctly calculates volume per workout ✓
    16. Defaults to plateau with <6 workouts ✓
  - Success criteria: All tests pass, edge cases covered ✓

### 2.2 Progressive Overload Frontend Widget

- [x] Create `src/components/analytics/progressive-overload-widget.tsx` component

  ```
  Work Log:
  - Implemented widget with Recharts LineChart for visualization
  - Shows top 5 exercises with last 10 workouts per exercise
  - Trend indicators with color coding (green/yellow/red)
  - Handles both weighted and bodyweight exercises elegantly
  - Mini charts (80px height) with weight and reps lines
  - Interactive tooltips showing exact values and dates
  - Loading skeleton with 5 placeholders
  - Empty state with helpful messaging
  - TypeScript fully typed with ProgressiveOverloadData interface
  ```

  - Props interface: ✓
  - Query progressive overload data using Convex hook ✓
  - Component structure:
    - Card with header "Progressive Overload" + TrendingUp icon ✓
    - For each exercise:
      - Exercise name with trend indicator (↗️ ↔️ ↘️) ✓
      - Mini Recharts LineChart (height: 80px) ✓
      - X-axis: Workout dates (last 10) ✓
      - Y-axis: Weight OR reps (show both series with different colors) ✓
      - Tooltip on hover showing exact values + date ✓
      - Color coding: Green (improving), Yellow (plateau), Red (declining) ✓
  - Empty state: "Log more sets to see progression trends" ✓
  - Loading skeleton: 5 animated placeholders ✓
  - Success criteria: Charts render correctly, hover shows tooltips, trends color-coded properly ✓

- [x] Add progressive overload widget to analytics page grid in `src/app/analytics/page.tsx`

  ```
  Work Log:
  - Imported ProgressiveOverloadWidget component
  - Added to grid with md:col-span-6 lg:col-span-8 classes
  - Positioned after AI Insights, before Activity Heatmap
  - Passes isLoading prop from parent analytics queries
  - Maintains responsive behavior across all breakpoints
  ```

  - Import widget component ✓
  - Add to grid with `lg:col-span-8` class (8 columns on desktop) ✓
  - Position after AI Insights card ✓
  - Pass isLoading prop based on query state ✓
  - Success criteria: Widget renders in correct grid position, responds to loading state ✓

## Phase 3: Muscle Group System & Recovery Dashboard

### 3.1 Muscle Group Mapping Module

- [x] Create `convex/lib/muscle-group-mapping.ts` with predefined exercise-to-muscle-group map

  ```
  Work Log:
  - Created MuscleGroup type with 11 categories (Chest, Back, Shoulders, etc.)
  - Implemented EXERCISE_MUSCLE_MAP with 50+ exercise patterns
  - Developed intelligent matching algorithm (exact → partial → "Other")
  - Added keyword sorting by length to prefer longer matches
  - Included getAllMuscleGroups() utility function
  - Covers push/pull/legs/core/isolation movements
  - Handles real-world variations (equipment prefixes, hyphens, descriptive names)
  ```

  - Define MuscleGroup enum:
    ```typescript
    export type MuscleGroup =
      | "Chest"
      | "Back"
      | "Shoulders"
      | "Biceps"
      | "Triceps"
      | "Quads"
      | "Hamstrings"
      | "Glutes"
      | "Calves"
      | "Core"
      | "Other";
    ```
  - Create exercise name mapping (case-insensitive, partial match):

    ```typescript
    const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
      // Push
      "BENCH PRESS": ["Chest", "Triceps"],
      BENCH: ["Chest", "Triceps"],
      "PUSH UP": ["Chest", "Triceps"],
      PUSHUP: ["Chest", "Triceps"],
      "OVERHEAD PRESS": ["Shoulders", "Triceps"],
      "SHOULDER PRESS": ["Shoulders", "Triceps"],
      DIP: ["Chest", "Triceps"],

      // Pull
      "PULL UP": ["Back", "Biceps"],
      PULLUP: ["Back", "Biceps"],
      "CHIN UP": ["Back", "Biceps"],
      CHINUP: ["Back", "Biceps"],
      ROW: ["Back", "Biceps"],
      DEADLIFT: ["Back", "Hamstrings", "Glutes"],
      "LAT PULLDOWN": ["Back", "Biceps"],

      // Legs
      SQUAT: ["Quads", "Glutes"],
      "LEG PRESS": ["Quads", "Glutes"],
      LUNGE: ["Quads", "Glutes"],
      "LEG CURL": ["Hamstrings"],
      "LEG EXTENSION": ["Quads"],
      "CALF RAISE": ["Calves"],

      // Core
      PLANK: ["Core"],
      CRUNCH: ["Core"],
      "SIT UP": ["Core"],
      SITUP: ["Core"],

      // Arms
      CURL: ["Biceps"],
      TRICEP: ["Triceps"],
    };
    ```

  - Export `getMuscleGroups(exerciseName: string): MuscleGroup[]` function:
    - Normalize exercise name (uppercase, trim)
    - Check for exact match first
    - If no exact match, check for partial matches (e.g., "BARBELL BENCH PRESS" contains "BENCH")
    - Return muscle groups or ["Other"] if no match
  - Success criteria: Function correctly maps 20+ common exercise variations, returns "Other" for unmapped

- [x] Write tests for muscle group mapping in `convex/lib/muscle-group-mapping.test.ts`

  ```
  Work Log:
  - Created 41 comprehensive test cases covering all functionality
  - Tests organized by: exact match, case insensitive, partial match, compound movements, isolation, edge cases
  - Validates real-world exercise names with equipment prefixes
  - Tests getAllMuscleGroups() utility function
  - Edge cases: whitespace, hyphens, empty strings, nonsense input
  - All 41 tests passing, total suite: 342 tests passing
  ```

  - Test cases:
    1. Exact match: "BENCH PRESS" → ["Chest", "Triceps"] ✓
    2. Partial match: "BARBELL BENCH PRESS" → ["Chest", "Triceps"] ✓
    3. Case insensitive: "bench press" → ["Chest", "Triceps"] ✓
    4. Multiple matches: "DEADLIFT" → ["Back", "Hamstrings", "Glutes"] ✓
    5. No match: "UNKNOWN EXERCISE" → ["Other"] ✓
    6. Ambiguous: "ROW" → ["Back", "Biceps"] (matches BARBELL ROW, DUMBBELL ROW, etc.) ✓
  - Success criteria: All tests pass, edge cases handled ✓

### 3.2 Recovery Status Backend Query

- [x] Create `convex/analyticsRecovery.ts` with `getRecoveryStatus` query

  ```
  Work Log:
  - Implemented getRecoveryStatus query with muscle group aggregation
  - Calculates days since last trained per muscle group
  - Tracks volume and frequency metrics for last 7 days
  - Assigns recovery status (fresh/recovering/ready/overdue) based on days
  - Handles compound exercises (maps to multiple muscle groups)
  - Sorts results by days since descending (most rested first)
  - Returns all 10 muscle groups (excluding "Other")
  - Proper handling of never-trained groups (daysSince: 999)
  ```

  - Function signature:
    ```typescript
    export const getRecoveryStatus = query({
      args: {},
      handler: async (ctx) => {
        // Implementation
      },
    });
    ```
  - Query logic:
    1. Get authenticated user's identity
    2. Fetch all user exercises (including deleted for history)
    3. Fetch all user sets sorted by performedAt desc
    4. For each set:
       - Get exercise name
       - Map to muscle groups using `getMuscleGroups()`
       - Track last trained date per muscle group
    5. Calculate recovery metrics per muscle group:
       - Last trained date
       - Days since last trained (today - last trained)
       - Total volume in last 7 days
       - Frequency (workouts in last 7 days)
    6. Sort by days since last trained descending (most rested first)
  - Return type:
    ```typescript
    {
      muscleGroup: MuscleGroup,
      lastTrainedDate: string | null, // YYYY-MM-DD
      daysSince: number,
      volumeLast7Days: number,
      frequencyLast7Days: number,
      status: "fresh" | "recovering" | "ready" | "overdue"
    }
    ```
  - Status calculation:
    - fresh (0-2 days): Recently trained
    - recovering (3-4 days): Optimal recovery window
    - ready (5-7 days): Ready to train
    - overdue (8+ days): Needs attention
  - Success criteria: Query correctly aggregates sets by muscle groups, calculates days since, handles unmapped exercises

- [x] Write tests for `getRecoveryStatus` in `convex/analyticsRecovery.test.ts`

  ```
  Work Log:
  - Created 17 comprehensive test cases covering all functionality
  - Tests validate muscle group mapping, days calculation, volume aggregation
  - Frequency counting with distinct workout dates
  - Status assignment for all four categories
  - Edge cases: never trained, bodyweight exercises, multi-muscle exercises
  - Data isolation between users
  - Timezone-tolerant assertions (using ranges instead of exact values)
  - All 17 tests passing, total suite: 359 tests passing
  ```

  - Test cases:
    1. Correctly maps exercises to muscle groups ✓
    2. Calculates days since last trained ✓
    3. Aggregates volume across multiple exercises for same muscle group ✓
    4. Counts frequency (distinct workout days) in last 7 days ✓
    5. Assigns correct status based on days since ✓
    6. Handles muscle groups never trained (null lastTrainedDate) ✓
    7. Returns empty array for unauthenticated user ✓
    8. Handles exercises mapped to multiple muscle groups ✓
  - Success criteria: All tests pass, edge cases covered ✓

### 3.3 Recovery Dashboard Frontend Widget

- [x] Create `src/components/analytics/recovery-dashboard-widget.tsx` component

  ```
  Work Log:
  - Implemented color-coded muscle group cards with recovery status
  - Responsive grid (3 cols desktop, 2 tablet, 1 mobile)
  - Color scheme: green (fresh), yellow (recovering), orange (ready), red (overdue), gray (never trained)
  - Each card shows: name, status badge, days since, last date, volume/frequency badges
  - Loading skeleton with 6 animated placeholders
  - Empty state with Heart icon and helpful text
  - Footer legend explaining color coding
  - Handles never-trained muscles gracefully (shows "—" instead of days)
  - TypeScript fully typed with RecoveryData interface
  ```

  - Props interface:
    ```typescript
    interface RecoveryDashboardWidgetProps {
      isLoading?: boolean;
    }
    ```
  - Query recovery status data using Convex hook
  - Component structure:
    - Card with header "Recovery Status" + Heart icon
    - Grid of muscle group cards (3 cols desktop, 2 cols tablet, 1 col mobile)
    - Each muscle group card:
      - Muscle group name
      - Days since last trained (large number)
      - Last workout date (small text)
      - Color-coded background/border:
        - Green: fresh (0-2 days)
        - Yellow: recovering (3-4 days)
        - Orange: ready (5-7 days)
        - Red: overdue (8+ days)
        - Gray: never trained
      - Volume badge (last 7 days)
  - Empty state: "Log sets to see muscle group recovery"
  - Loading skeleton: Grid of animated placeholders
  - Success criteria: Color coding correct, responsive grid, clear visual hierarchy

- [x] Add recovery dashboard widget to analytics page grid in `src/app/analytics/page.tsx`

  ```
  Work Log:
  - Imported RecoveryDashboardWidget component
  - Added to grid with md:col-span-3 lg:col-span-6 classes
  - Positioned alongside Activity Heatmap (both 6 cols on desktop)
  - Passes isLoading prop from parent analytics queries
  - Maintains responsive behavior (3 cols tablet, full width mobile)
  ```

  - Import widget component ✓
  - Add to grid with `lg:col-span-6` class (6 columns on desktop) ✓
  - Position alongside heatmap (both 6 cols) ✓
  - Pass isLoading prop based on query state ✓
  - Success criteria: Widget renders in correct grid position, responsive layout works ✓

## Phase 4: Focus Suggestions Widget

### 4.1 Focus Suggestions Backend Query

- [x] Create `convex/analyticsFocus.ts` with `getFocusSuggestions` query

  ```
  Work Log:
  - Implemented getFocusSuggestions query with rule-based logic
  - Identifies exercises not trained in 7+ days (high priority)
  - Detects push/pull imbalance (ratio > 2:1)
  - Detects upper/lower imbalance
  - Identifies undertrained muscle groups (no volume in 7 days)
  - Returns max 5 suggestions sorted by priority
  - Handles compound exercises mapping to multiple muscle groups
  - Provides suggested exercises for muscle group and balance types
  - All 14 tests passing, total suite: 373 tests passing
  ```

  - Function signature:
    ```typescript
    export const getFocusSuggestions = query({
      args: {},
      handler: async (ctx) => {
        // Implementation
      },
    });
    ```
  - Query logic (rule-based V1):
    1. Get authenticated user's identity
    2. Fetch all user exercises and sets
    3. Identify exercises not trained in 7+ days (priority: high)
    4. Use recovery status data to find muscle groups with longest rest
    5. Detect training imbalances:
       - Compare push (Chest, Shoulders, Triceps) vs pull (Back, Biceps) volume
       - Compare upper body vs legs volume
       - If ratio > 2:1, flag as imbalance (priority: medium)
    6. Generate 3-5 specific suggestions
    7. Sort by priority (high → medium → low)
  - Return type:
    ```typescript
    {
      type: "exercise" | "muscle_group" | "balance",
      priority: "high" | "medium" | "low",
      title: string, // "Train Squats"
      reason: string, // "Haven't trained in 9 days"
      suggestedExercises?: string[], // For muscle_group type
      exerciseId?: string // For exercise type (deep link)
    }
    ```
  - Suggestion types:
    - Exercise: Specific exercise not trained in 7+ days
    - Muscle group: Muscle group undertrained (recommend 2-3 exercises)
    - Balance: Training imbalance detected (recommend opposing muscle group)
  - Success criteria: Query generates relevant suggestions, prioritizes correctly, handles edge cases

- [x] Write tests for `getFocusSuggestions` in `convex/analyticsFocus.test.ts`

  ```
  Work Log:
  - Created 14 comprehensive test cases covering all functionality
  - Tests verify exercise neglect detection (7+ days high priority)
  - Untrained muscle group suggestions with sample exercises
  - Push/pull imbalance detection (both directions)
  - Upper/lower imbalance detection
  - Max 5 suggestions truncation, priority sorting
  - Edge cases: new user, unauthenticated, no sets, deleted exercises
  - Data isolation between users
  - Balanced training (no false positives)
  - Timezone-tolerant assertions (regex for days, weights for volume)
  - All 14 tests passing
  ```

  - Test cases:
    1. Suggests exercise not trained in 7+ days (high priority) ✓
    2. Suggests muscle group with longest rest (medium priority) ✓
    3. Detects push/pull imbalance (too much push, not enough pull) ✓
    4. Detects upper/lower imbalance (too much upper, not enough legs) ✓
    5. Detects pull/push imbalance (too much pull, not enough push) ✓
    6. Returns max 5 suggestions (truncates if more) ✓
    7. Returns empty array for brand new user ✓
    8. Returns empty array for user with exercises but no sets ✓
    9. Returns empty array for unauthenticated user ✓
    10. Prioritizes high before medium before low ✓
    11. Does not suggest exercises trained recently (within 7 days) ✓
    12. Only returns data for authenticated user (data isolation) ✓
    13. Ignores deleted exercises from suggestions ✓
    14. Handles balanced training (no imbalance suggestions) ✓
  - Success criteria: All tests pass, suggestions are actionable ✓

### 4.2 Focus Suggestions Frontend Widget

- [x] Create `src/components/analytics/focus-suggestions-widget.tsx` component

  ```
  Work Log:
  - Implemented widget with color-coded priority badges
  - Shows up to 5 suggestions with title, reason, suggested exercises
  - Priority colors: red (high), yellow (medium), gray (low)
  - Deep linking for exercise type suggestions to log page
  - Suggested exercises displayed as chips for muscle_group/balance types
  - Loading skeleton with 5 animated placeholders
  - Empty state: "You're training everything well! 💪"
  - Footer hint about automatic updates
  - TypeScript fully typed with FocusSuggestion interface
  ```

  - Props interface: ✓
  - Query focus suggestions data using Convex hook ✓
  - Component structure:
    - Card with header "Focus Suggestions" + Target icon ✓
    - List of suggestions (max 5):
      - Priority badge (high: red, medium: yellow, low: gray) ✓
      - Title (bold) ✓
      - Reason (muted text) ✓
      - For muscle_group type: show suggested exercises as chips ✓
      - For exercise type: "Log workout" button → deep link to log page with exerciseId ✓
    - Empty state: "You're training everything well! 💪" ✓
    - Loading skeleton: List of animated placeholders ✓
  - Success criteria: Suggestions render correctly, priority badges color-coded, deep links work ✓

- [x] Add focus suggestions widget to analytics page grid in `src/app/analytics/page.tsx`

  ```
  Work Log:
  - Imported FocusSuggestionsWidget component
  - Added to grid with md:col-span-3 lg:col-span-4 classes
  - Positioned before progressive overload widget (4 cols + 8 cols = 12 cols)
  - Passes isLoading prop from parent analytics queries
  - Maintains responsive behavior (3 cols tablet, full width mobile)
  ```

  - Import widget component ✓
  - Add to grid with `lg:col-span-4` class (4 columns on desktop) ✓
  - Position next to progressive overload widget (8 cols) ✓
  - Pass isLoading prop based on query state ✓
  - Success criteria: Widget renders in correct grid position, layout responsive ✓

## Phase 5: Enhanced AI Insights Card

### 5.1 Remove Manual Report Generation

- [x] Remove manual generation UI from `src/components/analytics/ai-insights-card.tsx`

  ```
  Work Log:
  - Removed onGenerateNew, isGenerating, and error props from AIInsightsCardProps
  - Deleted "Generate Your First Analysis" button from empty state
  - Deleted "Regenerate" button from card header
  - Deleted loading state (Loader2 spinner and "Analyzing your training..." text)
  - Deleted error state (Try Again button)
  - Replaced empty state with automated report placeholder messaging
  - Updated analytics page to remove useState, useMutation, toast imports
  - Removed generateReport mutation and handleGenerateReport function
  - Removed isGenerating and generationError state
  - Simplified AIInsightsCard usage to only pass report prop
  - Net reduction: 128 lines of code removed, 21 lines added
  ```

  - Delete "Generate Your First Analysis" button (lines 64-67) ✓
  - Delete "Regenerate" button (lines 137-146) ✓
  - Delete empty state component (lines 49-72) ✓
  - Replace empty state with "automated report" placeholder ✓
  - Remove `onGenerateNew` prop from interface (no longer needed) ✓
  - Remove `isGenerating` and `error` props (no manual generation = no loading/error states) ✓
  - Success criteria: No manual generation buttons visible, clear messaging about automated reports ✓

### 5.2 Add Report Type Indicators

- [x] Add report type badge to AI insights card in `src/components/analytics/ai-insights-card.tsx`
  ```
  Work Log:
  - Added optional reportType field to AIReport interface (backward compatible)
  - Implemented getReportTypeBadgeColor() helper function with switch statement
  - Added conditional badge rendering in card header (only shows if reportType present)
  - Badge displays report type in uppercase with color coding
  - Dark mode support with appropriate color adjustments
  - Colors: Daily (blue), Weekly (purple), Monthly (green)
  ```

  - Modify AIReport interface to include `reportType: "daily" | "weekly" | "monthly"` ✓
  - Add badge component next to card title ✓
  - Badge colors:
    - Daily: bg-blue-500/10 text-blue-700 ✓
    - Weekly: bg-purple-500/10 text-purple-700 ✓
    - Monthly: bg-green-500/10 text-green-700 ✓
  - Success criteria: Badge displays correctly with proper color coding ✓

### 5.3 Update Analytics Page for New AI Insights UI

- [x] Remove AI report generation mutation and state from `src/app/analytics/page.tsx`
  ```
  Work Log:
  - Already completed in Phase 5.1 refactoring
  - Removed generateReport mutation, isGenerating, and generationError state
  - Removed handleGenerateReport function
  - Updated AIInsightsCard to only pass report prop
  - Removed unused imports: useState, useMutation, toast
  ```

  - Delete line 27-30: `generateReport` mutation ✓
  - Delete line 32-34: `isGenerating` and `generationError` state ✓
  - Delete line 51-71: `handleGenerateReport` function ✓
  - Update AIInsightsCard props (remove `onGenerateNew`, `isGenerating`, `error`) ✓
  - Success criteria: No TypeScript errors, component still renders ✓

## Phase 6: Schema Changes for Users & Timezone

### 6.1 Add Users Table to Schema

- [ ] Add `users` table definition to `convex/schema.ts`
  - Insert after `sets` table definition:
    ```typescript
    users: defineTable({
      clerkUserId: v.string(),
      timezone: v.optional(v.string()), // IANA timezone (e.g., "America/New_York")
      dailyReportsEnabled: v.optional(v.boolean()), // Default: false (opt-in)
      weeklyReportsEnabled: v.optional(v.boolean()), // Default: true
      monthlyReportsEnabled: v.optional(v.boolean()), // Default: false
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_clerk_id", ["clerkUserId"])
      .index("by_daily_enabled", ["dailyReportsEnabled"])
      .index("by_timezone", ["timezone"]),
    ```
  - Success criteria: Schema compiles without errors, indexes defined correctly

### 6.2 User Management Mutations

- [ ] Create `convex/users.ts` with user management functions
  - Implement `getOrCreateUser` mutation:

    ```typescript
    export const getOrCreateUser = mutation({
      args: {
        timezone: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Check if user exists
        const existing = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkUserId", identity.subject)
          )
          .first();

        if (existing) return existing._id;

        // Create new user
        const userId = await ctx.db.insert("users", {
          clerkUserId: identity.subject,
          timezone: args.timezone,
          dailyReportsEnabled: false, // Opt-in (future paywall)
          weeklyReportsEnabled: true, // Default on
          monthlyReportsEnabled: false, // Opt-in
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        return userId;
      },
    });
    ```

  - Implement `updateUserTimezone` mutation:

    ```typescript
    export const updateUserTimezone = mutation({
      args: { timezone: v.string() },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) =>
            q.eq("clerkUserId", identity.subject)
          )
          .first();

        if (!user) {
          // Create user if doesn't exist
          return await ctx.runMutation(internal.users.getOrCreateUser, {
            timezone: args.timezone,
          });
        }

        await ctx.db.patch(user._id, {
          timezone: args.timezone,
          updatedAt: Date.now(),
        });
      },
    });
    ```

  - Success criteria: Mutations create and update users correctly, handle edge cases

- [ ] Write tests for user management in `convex/users.test.ts`
  - Test cases:
    1. `getOrCreateUser`: Creates new user with default settings
    2. `getOrCreateUser`: Returns existing user if already exists
    3. `updateUserTimezone`: Updates timezone for existing user
    4. `updateUserTimezone`: Creates user if doesn't exist
    5. Both functions throw error for unauthenticated requests
  - Success criteria: All tests pass

## Phase 7: Client-Side Timezone Detection

### 7.1 Timezone Detection Hook

- [ ] Create `src/hooks/useTimezoneSync.ts` hook for timezone detection
  - Hook implementation:

    ```typescript
    import { useEffect } from "react";
    import { useMutation } from "convex/react";
    import { api } from "../../convex/_generated/api";

    export function useTimezoneSync() {
      const updateTimezone = useMutation(api.users.updateUserTimezone);

      useEffect(() => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Only update if we have a valid timezone
        if (timezone) {
          updateTimezone({ timezone }).catch((error) => {
            console.warn("Failed to sync timezone:", error);
          });
        }
      }, [updateTimezone]);
    }
    ```

  - Success criteria: Hook detects timezone correctly, calls mutation once on mount

### 7.2 Integrate Timezone Sync in App

- [ ] Add timezone sync to root layout in `src/app/layout.tsx` or `ConvexClientProvider.tsx`
  - Import and call `useTimezoneSync()` hook in client component
  - Ensure it runs after user authentication (inside ClerkProvider context)
  - Add to `ConvexClientProvider.tsx` after `useUser()` hook:

    ```tsx
    const { isSignedIn } = useUser();

    // Sync timezone when user signs in
    useEffect(() => {
      if (isSignedIn) {
        useTimezoneSync();
      }
    }, [isSignedIn]);
    ```

  - Success criteria: Timezone saved to users table on first login, no errors in console

## Phase 8: Automated Report Generation System

### 8.1 Modify Report Schema for Report Types

- [ ] Update `aiReports` table schema in `convex/schema.ts` to include `reportType`
  - Add `reportType` field:
    ```typescript
    aiReports: defineTable({
      userId: v.string(),
      reportType: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      content: v.string(),
      // ... existing fields
    }).index("by_user_type_date", ["userId", "reportType", "weekStartDate"]);
    ```
  - Update index to support querying by report type
  - Success criteria: Schema compiles, new index supports efficient queries

### 8.2 Update Report Generation Logic

- [ ] Modify `convex/ai/reports.ts` to support multiple report types
  - Update `generateReport` internal mutation to accept `reportType` parameter:

    ```typescript
    export const generateReport = internalMutation({
      args: {
        userId: v.string(),
        reportType: v.optional(
          v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
        ),
        weekStartDate: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        const reportType = args.reportType || "weekly";

        // Calculate date range based on report type
        let { startDate, endDate } = calculateDateRange(
          reportType,
          args.weekStartDate
        );

        // ... rest of generation logic

        // Update deduplication check to include reportType
        const existingReport = await ctx.db
          .query("aiReports")
          .withIndex("by_user_type_date", (q) =>
            q
              .eq("userId", args.userId)
              .eq("reportType", reportType)
              .eq("weekStartDate", startDate)
          )
          .first();

        if (existingReport) {
          console.log(
            `[AI Reports] Report already exists for ${reportType} ${startDate}`
          );
          return existingReport._id;
        }

        // ... generate report with OpenAI

        // Insert with reportType
        const reportId = await ctx.db.insert("aiReports", {
          userId: args.userId,
          reportType,
          weekStartDate: startDate,
          content: report.content,
          // ... other fields
        });
      },
    });
    ```

  - Add `calculateDateRange` helper function:

    ```typescript
    function calculateDateRange(
      reportType: "daily" | "weekly" | "monthly",
      customStart?: number
    ) {
      const now = new Date();
      let startDate: number;
      let endDate = now.getTime();

      switch (reportType) {
        case "daily":
          // Last 24 hours
          startDate = endDate - 24 * 60 * 60 * 1000;
          break;
        case "weekly":
          // Last 7 days (or custom start)
          if (customStart) {
            startDate = customStart;
          } else {
            startDate = endDate - 7 * 24 * 60 * 60 * 1000;
          }
          break;
        case "monthly":
          // Last calendar month
          const lastMonth = new Date(now);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          lastMonth.setDate(1);
          lastMonth.setHours(0, 0, 0, 0);
          startDate = lastMonth.getTime();
          break;
      }

      return { startDate, endDate };
    }
    ```

  - Success criteria: Function generates reports for all three types, date ranges calculated correctly

### 8.3 Hourly Cron for Daily Reports

- [ ] Add hourly cron job for daily reports in `convex/crons.ts`
  - Implement `getEligibleUsersForDailyReports` internal query:

    ```typescript
    export const getEligibleUsersForDailyReports = internalQuery({
      args: { currentHourUTC: v.number() },
      handler: async (ctx, args) => {
        // Get all users with dailyReportsEnabled = true
        const users = await ctx.db
          .query("users")
          .withIndex("by_daily_enabled", (q) =>
            q.eq("dailyReportsEnabled", true)
          )
          .collect();

        // Filter users whose local time is midnight (based on timezone)
        const eligibleUsers = users.filter((user) => {
          if (!user.timezone) return false;

          // Calculate local hour for user's timezone
          const localHour = getLocalHourFromUTC(
            args.currentHourUTC,
            user.timezone
          );

          // Check if local time is midnight (hour 0)
          return localHour === 0;
        });

        return eligibleUsers.map((u) => u.clerkUserId);
      },
    });
    ```

  - Helper function for timezone conversion:

    ```typescript
    function getLocalHourFromUTC(utcHour: number, timezone: string): number {
      const now = new Date();
      now.setUTCHours(utcHour, 0, 0, 0);

      // Use Intl.DateTimeFormat to convert to local timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      });

      const localHour = parseInt(formatter.format(now));
      return localHour;
    }
    ```

  - Implement `generateDailyReports` internal action:

    ```typescript
    export const generateDailyReports = internalAction({
      args: {},
      handler: async (ctx): Promise<any> => {
        console.log("[Cron] Starting daily AI report generation...");
        const startTime = Date.now();

        const currentHourUTC = new Date().getUTCHours();

        // Get eligible users for this hour
        const eligibleUserIds = await ctx.runQuery(
          (internal as any).crons.getEligibleUsersForDailyReports,
          { currentHourUTC }
        );

        console.log(
          `[Cron] Found ${eligibleUserIds.length} users eligible for daily reports`
        );

        // Generate reports
        let successCount = 0;
        let errorCount = 0;
        const errors: Array<{ userId: string; error: string }> = [];

        for (const userId of eligibleUserIds) {
          try {
            await ctx.runMutation((internal as any).ai.reports.generateReport, {
              userId,
              reportType: "daily",
            });
            successCount++;
          } catch (error: unknown) {
            errorCount++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push({ userId, error: errorMessage });
            console.error(
              `[Cron] Failed to generate daily report for ${userId}: ${errorMessage}`
            );
          }
        }

        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron] Daily report generation complete!`);
        console.log(`[Cron] Duration: ${duration}s`);
        console.log(`[Cron] Reports generated: ${successCount}`);
        console.log(`[Cron] Errors: ${errorCount}`);

        return {
          success: true,
          processed: eligibleUserIds.length,
          succeeded: successCount,
          failed: errorCount,
          durationSeconds: Number(duration),
          errors: errors.slice(0, 10),
        };
      },
    });
    ```

  - Add cron schedule:
    ```typescript
    crons.hourly(
      "generate-daily-reports",
      { minuteUTC: 0 },
      (internal as any).crons.generateDailyReports
    );
    ```
  - Success criteria: Cron runs every hour, generates reports for users whose local time is midnight

### 8.4 Monthly Cron for Monthly Reports

- [ ] Add monthly cron job for monthly reports in `convex/crons.ts`
  - Implement `generateMonthlyReports` internal action:

    ```typescript
    export const generateMonthlyReports = internalAction({
      args: {},
      handler: async (ctx): Promise<any> => {
        console.log("[Cron] Starting monthly AI report generation...");
        const startTime = Date.now();

        // Get all users with monthlyReportsEnabled = true
        const users = await ctx.runQuery(
          (internal as any).crons.getActiveUsersWithMonthlyReports,
          {}
        );

        console.log(
          `[Cron] Found ${users.length} users eligible for monthly reports`
        );

        // Generate reports
        let successCount = 0;
        let errorCount = 0;
        const errors: Array<{ userId: string; error: string }> = [];

        for (const userId of users) {
          try {
            await ctx.runMutation((internal as any).ai.reports.generateReport, {
              userId,
              reportType: "monthly",
            });
            successCount++;
          } catch (error: unknown) {
            errorCount++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push({ userId, error: errorMessage });
            console.error(
              `[Cron] Failed to generate monthly report for ${userId}: ${errorMessage}`
            );
          }
        }

        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Cron] Monthly report generation complete!`);

        return {
          success: true,
          processed: users.length,
          succeeded: successCount,
          failed: errorCount,
          durationSeconds: Number(duration),
          errors: errors.slice(0, 10),
        };
      },
    });
    ```

  - Add helper query:

    ```typescript
    export const getActiveUsersWithMonthlyReports = internalQuery({
      args: {},
      handler: async (ctx) => {
        const users = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("monthlyReportsEnabled"), true))
          .collect();

        return users.map((u) => u.clerkUserId);
      },
    });
    ```

  - Add cron schedule (runs first day of month at midnight UTC):
    ```typescript
    crons.monthly(
      "generate-monthly-reports",
      {
        day: 1,
        hourUTC: 0,
        minuteUTC: 0,
      },
      (internal as any).crons.generateMonthlyReports
    );
    ```
  - Success criteria: Cron runs on first day of month, generates reports for opted-in users

### 8.5 Update Latest Report Query

- [ ] Modify `getLatestReport` query in `convex/ai/reports.ts` to support filtering by report type
  - Update query to accept optional `reportType` parameter:

    ```typescript
    export const getLatestReport = query({
      args: {
        reportType: v.optional(
          v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
        ),
      },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        let query = ctx.db
          .query("aiReports")
          .withIndex("by_user", (q) => q.eq("userId", identity.subject))
          .order("desc");

        const reports = await query.collect();

        // Filter by report type if specified
        if (args.reportType) {
          const filtered = reports.filter(
            (r) => r.reportType === args.reportType
          );
          return filtered[0] || null;
        }

        return reports[0] || null;
      },
    });
    ```

  - Success criteria: Query returns correct report type when filtered

## Phase 9: Final Integration & Testing

### 9.1 Update Analytics Page with All New Widgets

- [ ] Finalize analytics page grid layout in `src/app/analytics/page.tsx` with all widgets
  - Final grid structure:

    ```tsx
    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">
      {/* AI Insights: 12 cols full width */}
      <div className="md:col-span-6 lg:col-span-12">
        <AIInsightsCard report={latestReport} />
      </div>

      {/* Focus Suggestions: 4 cols, Progressive Overload: 8 cols */}
      <div className="md:col-span-3 lg:col-span-4">
        <FocusSuggestionsWidget isLoading={isLoading} />
      </div>
      <div className="md:col-span-3 lg:col-span-8">
        <ProgressiveOverloadWidget isLoading={isLoading} />
      </div>

      {/* Recovery Dashboard: 6 cols, Activity Heatmap: 6 cols */}
      <div className="md:col-span-3 lg:col-span-6">
        <RecoveryDashboardWidget isLoading={isLoading} />
      </div>
      <div className="md:col-span-3 lg:col-span-6">
        <ActivityHeatmap data={frequencyData || []} isLoading={isLoading} />
      </div>

      {/* Streak Card: 4 cols, PR Card: 8 cols */}
      <div className="md:col-span-2 lg:col-span-4">
        <StreakCard
          currentStreak={streakStats?.currentStreak || 0}
          longestStreak={streakStats?.longestStreak || 0}
          totalWorkouts={streakStats?.totalWorkouts || 0}
          isLoading={isLoading}
        />
      </div>
      <div className="md:col-span-4 lg:col-span-8">
        <PRCard prs={recentPRs || []} isLoading={isLoading} />
      </div>
    </div>
    ```

  - Add all necessary imports
  - Update isLoading check to include new queries
  - Success criteria: All widgets render in correct positions, responsive at all breakpoints

### 9.2 Manual Testing Checklist

- [ ] Test full-width layout at multiple screen sizes
  - Mobile (360px): Single column stack, no horizontal scroll
  - Tablet (768px): 2-column layout, proper spacing
  - Desktop (1440px): 12-column grid, full width utilization
  - Ultra-wide (1920px+): Content spreads to edges, no awkward gaps

- [ ] Test progressive overload widget with real data
  - Create test user with 20+ sets across 3+ exercises
  - Verify mini charts render correctly
  - Test hover tooltips show dates and values
  - Verify trend indicators (↗️ ↔️ ↘️) match actual progression

- [ ] Test recovery dashboard with various scenarios
  - User with balanced training: All muscle groups green/yellow
  - User with imbalanced training: Some muscle groups red (8+ days)
  - Brand new user: All muscle groups gray (never trained)
  - Verify color coding matches days since last trained

- [ ] Test focus suggestions accuracy
  - Create scenario: Haven't trained legs in 10 days
  - Verify suggestion appears with high priority
  - Create scenario: Too much push, not enough pull
  - Verify balance suggestion appears
  - Test deep link to log page works

- [ ] Test AI insights automated reporting
  - Verify no manual generation buttons visible
  - Check placeholder text for new users
  - Verify report type badge displays correctly
  - Test with daily, weekly, monthly reports

- [ ] Test timezone detection and storage
  - Check browser console for timezone detection
  - Verify timezone saved to users table in Convex dashboard
  - Test with different timezones (mock system timezone)

- [ ] Test activity heatmap fixes
  - Verify only one legend visible
  - Test hover shows date and set count
  - Verify GitHub-style color scheme matches theme

- [ ] Test all loading states
  - Verify skeleton loaders render correctly
  - Test all widgets handle undefined/null data gracefully
  - Ensure no console errors during loading

- [ ] Test empty states for all widgets
  - New user with no data: All empty states visible
  - User with minimal data: Partial empty states
  - Verify empty state messages are helpful and actionable

### 9.3 Type Safety Verification

- [ ] Run TypeScript type check: `pnpm typecheck`
  - Fix any type errors introduced by new components
  - Ensure all props are properly typed
  - Verify no `any` types in new code
  - Success criteria: `pnpm typecheck` passes with 0 errors

### 9.4 Test Suite Execution

- [ ] Run full test suite: `pnpm test --run`
  - Verify all existing tests still pass
  - Verify all new backend query tests pass
  - Verify muscle group mapping tests pass
  - Success criteria: All tests pass (currently 285 tests, expecting 300+ after additions)

### 9.5 Build Verification

- [ ] Run production build: `pnpm build`
  - Ensure Next.js builds without errors
  - Verify bundle size is reasonable (no massive increases)
  - Check for any build warnings
  - Success criteria: Build completes successfully

---

## Post-Implementation Validation

After completing all tasks:

1. **Visual QA**: Screenshots at mobile, tablet, desktop showing full dashboard
2. **Performance**: Check page load time, query response times in Convex dashboard
3. **Accessibility**: Keyboard navigation works, screen reader compatibility
4. **Data Accuracy**: Verify calculations (progressive overload trends, recovery days, suggestions)
5. **Cron Jobs**: Monitor Convex logs for successful hourly/weekly/monthly report generation

---

## Notes

- **Muscle Groups**: Using 11 categories (Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core, Other)
- **Daily Reports**: Opt-in only (default OFF) - future paywall feature
- **No Manual Generation**: AI controls all report timing via cron jobs
- **Timezone Handling**: Client-side detection, stored per-user, hourly cron checks for midnight
- **Progressive Overload**: Top 5 exercises by recent activity, last 10 workouts per exercise
- **Recovery Status**: Color-coded by days since last trained (0-2: fresh, 3-4: recovering, 5-7: ready, 8+: overdue)
- **Focus Suggestions**: Rule-based V1 (3-5 suggestions max, sorted by priority)

---

**Total Tasks**: 54 atomic, actionable tasks
**Estimated Effort**: 20-25 hours
**Success Criteria**: Analytics page is a comprehensive "war room" dashboard with automated AI insights, no manual report generation, full-width responsive layout
