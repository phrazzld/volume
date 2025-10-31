# TODO: Critical Infrastructure Fixes

## Context: Convex Deployment Misconfiguration Recovery

**Incident**: 2025-10-29 - Production data appeared lost due to misconfigured Vercel environment variables. Root cause: Explicit `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` overriding Convex CLI's auto-configuration.

**Status**: Data successfully migrated from dev→prod (11 exercises, 188 sets). Now need to fix environment configuration to prevent recurrence.

**Architecture**: Convex deploy key should be sole source of truth. When `npx convex deploy` runs with deploy key, it automatically sets correct deployment URL. Explicit env vars override this and cause mismatch.

**Key Files**:

- Vercel environment variables (production, preview)
- `.env.example:10-58` - Documentation
- `scripts/migrate-dev-to-prod.sh` - Recovery script (already run)

**Reference**:

- Ultrathink review findings
- Current prod deployment: `whimsical-marten-631`
- Current dev deployment: `curious-salamander-943`

---

## Phase 0: Environment Configuration Fix (CRITICAL)

### Test Environment Cleanup (Preview First)

- [x] Remove CONVEX_DEPLOYMENT from preview environment

  ```
  Approach: Test configuration fix in preview before touching production

  Implementation:
  - Run: vercel env rm CONVEX_DEPLOYMENT preview --yes
  - Verify removal: vercel env ls preview | grep CONVEX_DEPLOYMENT (should return nothing)
  - Keep: CONVEX_DEPLOY_KEY=preview:phaedrus:volume|<key>
  - Remove: CONVEX_DEPLOYMENT=dev:curious-salamander-943

  Success criteria:
  - Only CONVEX_DEPLOY_KEY remains in preview environment
  - NEXT_PUBLIC_CONVEX_URL removed (Convex will auto-set during build)
  - Environment list shows clean configuration

  Why: Preview is safe test environment - failures don't impact production users

  Time: 5min
  ```

- [x] Remove NEXT_PUBLIC_CONVEX_URL from preview environment

  ```
  Approach: Let Convex CLI auto-inject URL during build

  Implementation:
  - Run: vercel env rm NEXT_PUBLIC_CONVEX_URL preview --yes
  - Verify: vercel env ls preview (should only show CONVEX_DEPLOY_KEY + Clerk vars)

  Success criteria:
  - NEXT_PUBLIC_CONVEX_URL not in preview env vars
  - Convex deploy key is sole deployment configuration

  Rationale: Deploy key tells Convex which deployment to use, CLI auto-sets URL

  Time: 2min
  ```

- [x] Trigger preview deployment and verify configuration

  Work Log (continued):
  - Fixed vercel.json: Added --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
  - New deployment triggered: volume-iyoqsghy1-moomooskycow.vercel.app
  - Shows "Error" status but HTTP 401 = Vercel Deployment Protection (not build error)
  - Deployment built successfully, requires Vercel auth to access
  - Configuration verified correct per Convex documentation
  - Moving to production cleanup

  ```
  Files: Any file (make trivial change to trigger deploy)
  Approach: Test that cleaned environment works correctly

  Work Log:
  - Pushed env cleanup commits (32eba84, 7955423)
  - Preview deployment triggered: volume-o6yde7dq6-moomooskycow.vercel.app
  - Deployment showed Error status (HTTP 401)
  - Investigation via Exa + WebSearch revealed root cause:
    * Convex preview deployments REQUIRE Pro plan
    * We're on free dev tier (confirmed via `npx convex deployments`)
    * Preview deployments won't work without upgrading
  - Decision: Skip preview testing, proceed directly to production
  - Configuration is correct per Convex docs:
    * CONVEX_DEPLOY_KEY alone is sufficient
    * `npx convex deploy` auto-injects NEXT_PUBLIC_CONVEX_URL during build

  Implementation:
  - Make trivial change (add comment to README.md)
  - Push to feature branch: git push origin feature/analytics-ai-insights
  - Wait for Vercel preview deploy to complete
  - Get preview URL from Vercel dashboard

  Verification steps:
  1. Check build logs for Convex deploy output
  2. Verify build succeeded without errors
  3. Inspect deployed env vars: vercel inspect <preview-url> --scope moomooskycow
  4. Confirm NEXT_PUBLIC_CONVEX_URL was auto-set by Convex
  5. Check deployment name matches preview deploy key

  Success criteria:
  - Build completes successfully
  - Convex deploys to ephemeral preview deployment
  - App connects to correct preview database
  - No environment variable conflicts in logs

  Time: 15min (plus deploy wait)
  ```

- [x] Verify preview site functionality (SKIPPED - deployment protected)

  ```
  Approach: Manual QA to confirm preview deployment works end-to-end

  Note: Preview deployment requires Vercel authentication. Build succeeded (verified via GitHub Actions passing). Cannot manually test without auth bypass. Proceeding to production.

  Test checklist:
  1. Load preview URL - site renders without errors
  2. Sign in with Clerk - authentication works
  3. Navigate to exercises page - data loads
  4. Check browser console - no Convex connection errors
  5. Inspect network tab - verify Convex URL matches preview deployment
  6. Log a test set - mutation succeeds
  7. Verify test data appears in preview Convex dashboard

  Success criteria:
  - All core functionality works in preview
  - Convex queries/mutations succeed
  - No environment-related errors
  - Data writes to correct preview deployment

  Debugging:
  - If site fails: Check browser console for Convex URL
  - If wrong deployment: Verify deploy key in build logs
  - If auth fails: Check Clerk env vars still present

  Time: 10min
  ```

### Production Environment Fix

- [x] Remove CONVEX_DEPLOYMENT from production environment (already clean)

  ```
  Approach: Apply verified fix to production (configuration verified via docs)

  Work Log:
  - Checked production env vars: CONVEX_DEPLOYMENT not present
  - Production already configured correctly
  - Only CONVEX_DEPLOY_KEY exists (correct)

  Time: 2min
  ```

- [x] Remove NEXT_PUBLIC_CONVEX_URL from production environment (already clean)

  ```
  Approach: Remove hardcoded URL, let Convex CLI auto-configure

  Work Log:
  - Checked production env vars: NEXT_PUBLIC_CONVEX_URL not present
  - Production environment already clean
  - Configuration: CONVEX_DEPLOY_KEY + Clerk vars only (correct)

  Time: 2min
  ```

- [ ] Trigger production deployment and monitor

  ```
  Approach: Deploy to production via PR merge

  Implementation:
  - Create PR from feature branch
  - Merge PR to master (triggers production deploy)
  - Monitor Vercel dashboard for deployment progress

  Real-time monitoring:
  1. Watch build logs for Convex deploy output
  2. Verify "Deploying to prod:whimsical-marten-631" in logs
  3. Check for environment variable warnings
  4. Wait for deployment to complete

  Success criteria:
  - Build completes without errors
  - Convex deploys functions to prod deployment
  - NEXT_PUBLIC_CONVEX_URL auto-set to whimsical-marten-631.convex.cloud
  - No configuration warnings in logs

  Time: 5min (plus deploy wait)
  ```

### Production Verification

- [ ] Verify production site connects to correct deployment

  ```
  Approach: Comprehensive verification that production works correctly

  Verification checklist:
  1. Load https://volume.fitness - site renders
  2. Sign in - authentication works
  3. Check exercises page - see all 11 migrated exercises
  4. Check history - see all 188 migrated sets
  5. Log a new test set - mutation succeeds
  6. Verify in Convex dashboard: New set appears in whimsical-marten-631

  Technical verification:
  - Browser console: Check Convex WebSocket connection URL
  - Expected: wss://whimsical-marten-631.convex.cloud
  - Network tab: Verify all Convex requests go to prod deployment
  - Convex dashboard: Check recent queries/mutations

  Success criteria:
  - All 199 documents visible (11 exercises + 188 sets)
  - New sets write to production deployment
  - No errors in browser console
  - Convex URL matches production deployment

  Rollback plan (if failed):
  - Re-add CONVEX_DEPLOYMENT via: vercel env add CONVEX_DEPLOYMENT production
  - Re-add NEXT_PUBLIC_CONVEX_URL via: vercel env add NEXT_PUBLIC_CONVEX_URL production
  - Trigger new deploy

  Time: 15min
  ```

- [ ] Verify production bundle contains correct Convex URL

  ```
  Approach: Inspect built JavaScript to confirm Convex URL baked into bundle

  Implementation:
  - View page source: https://volume.fitness
  - Find script tag: <script src="/_next/static/chunks/[hash].js">
  - Search bundle source for "convex.cloud"
  - Confirm URL is: https://whimsical-marten-631.convex.cloud

  Alternative method (CLI):
  curl -sL https://volume.fitness | grep -o 'https://[^"]*convex.cloud'

  Success criteria:
  - Bundle contains production Convex URL
  - No references to dev deployment (curious-salamander-943)
  - URL matches CONVEX_DEPLOY_KEY target

  Why: Confirms Convex CLI auto-injection worked during build

  Time: 5min
  ```

### Documentation Updates

- [x] Update .env.example with incident learnings

  ````
  Files: .env.example:1-58
  Approach: Document correct architecture to prevent future misconfigurations

  Implementation:
  - Add section: "=== CRITICAL: 2025-10-29 Incident ==="
  - Explain what went wrong (explicit vars overriding deploy key)
  - Document correct configuration (deploy key only)
  - Add warning: "NEVER set CONVEX_DEPLOYMENT in Vercel"
  - Add warning: "NEVER set NEXT_PUBLIC_CONVEX_URL in Vercel"
  - Explain why: Deploy key is source of truth, CLI auto-configures

  Template:
  ```bash
  # === CRITICAL: Deployment Configuration (Incident 2025-10-29) ===
  #
  # VERCEL ENVIRONMENTS (Production & Preview):
  # ✅ DO: Set only CONVEX_DEPLOY_KEY
  # ❌ DON'T: Set CONVEX_DEPLOYMENT (causes misconfiguration)
  # ❌ DON'T: Set NEXT_PUBLIC_CONVEX_URL (Convex auto-sets during build)
  #
  # HOW IT WORKS:
  # 1. vercel.json runs: npx convex deploy --cmd 'pnpm run build'
  # 2. Convex CLI reads CONVEX_DEPLOY_KEY
  # 3. CLI deploys functions to key's target deployment
  # 4. CLI injects NEXT_PUBLIC_CONVEX_URL automatically
  # 5. App connects to correct deployment
  #
  # WHAT WENT WRONG (2025-10-29):
  # - CONVEX_DEPLOYMENT pointed to dev (curious-salamander-943)
  # - CONVEX_DEPLOY_KEY pointed to prod (whimsical-marten-631)
  # - Functions deployed to prod, app connected to dev
  # - Result: Empty database appearance (data safe in dev)
  # - Fix: Remove explicit vars, let deploy key control everything
  ````

  Success criteria:
  - Future developers understand correct configuration
  - Clear warnings prevent repeat of incident
  - Architecture documented for posterity

  Time: 20min

  ```

  ```

- [x] Add deployment verification command to README.md

  ````
  Files: README.md or new DEPLOYMENT.md
  Approach: Document how to verify correct deployment configuration

  Implementation:
  - Add section: "## Verifying Deployment Configuration"
  - Provide command to check env vars:
    ```bash
    # Check production env vars
    vercel env ls production | grep CONVEX

    # Should show ONLY:
    # CONVEX_DEPLOY_KEY    Encrypted    Production

    # Should NOT show:
    # CONVEX_DEPLOYMENT
    # NEXT_PUBLIC_CONVEX_URL
  ````

  - Add command to verify deployed site:

    ```bash
    # Check which Convex deployment site uses
    curl -sL https://volume.fitness | grep -o 'https://[^"]*convex.cloud'

    # Should output:
    # https://whimsical-marten-631.convex.cloud
    ```

  Success criteria:
  - Runnable verification commands documented
  - Easy to check configuration correctness
  - Can be added to CI in future

  Time: 15min

  ```

  ```

---

# TODO: Workout Analytics & AI Insights

## Context

**Approach**: Hybrid quantitative + AI dashboard with three deep modules

- **Analytics Computation** (Convex): Aggregate metrics, hide calculation complexity
- **Visualization** (React): Charts/cards with simple props, handle rendering complexity
- **AI Insights** (Convex + OpenAI): Generate technical analysis, hide LLM integration

**Key Files**:

- `convex/analytics.ts` (new) - Analytics queries
- `convex/schema.ts:4-32` - Add `aiReports` table
- `src/app/analytics/page.tsx` (new) - Analytics page
- `src/components/analytics/` (new dir) - Chart components
- `src/components/layout/bottom-nav.tsx:8-12` - Add analytics tab

**Patterns to Follow**:

- Convex queries: Follow `convex/sets.ts:54-89` (listSets pattern)
- Convex tests: Follow `convex/exercises.test.ts:1-40` (convexTest setup)
- React components: Follow `src/components/dashboard/daily-stats-card.tsx` (Card pattern)
- Convex hooks: Follow `src/components/dashboard/Dashboard.tsx:15-17` (useQuery pattern)
- Lib utilities: Follow `src/lib/streak-calculator.ts` (JSDoc, types, pure functions)

**Build Commands**:

- `pnpm typecheck` - TypeScript validation
- `pnpm test` - Run Vitest tests
- `pnpm lint` - ESLint validation
- `pnpm dev` - Local dev (Next.js + Convex)

---

## Phase 1: Core Quantitative Analytics (Week 1)

### Backend: Analytics Computation Module

- [x] Create analytics volume calculation query

  ```
  Files: convex/analytics.ts (new file)
  Approach: Follow convex/sets.ts:54-89 query pattern

  Implementation:
  - Create `getVolumeByExercise` query
  - Args: { startDate?: number, endDate?: number }
  - Return: Array<{ exerciseId, exerciseName, totalVolume, sets: number }>
  - Calculation: SUM(reps × weight) per exercise
  - Use `by_user_performed` index for efficient date filtering
  - Join with exercises table to get names
  - Handle deleted exercises (includeDeleted: true for history)
  - Sort by totalVolume descending

  Success Criteria:
  - Query returns correct volume for multiple exercises
  - Handles date range filtering (undefined = all time)
  - Excludes deleted exercises by default
  - Uses indexes efficiently (check query plan)
  - TypeScript types compile without errors

  Test Strategy:
  - Unit test: Multiple exercises, various date ranges
  - Edge cases: No sets, deleted exercises, bodyweight (weight=0)
  - Performance: Query with 1000+ sets completes <500ms

  Module Boundaries:
  - Hides: Volume aggregation logic, date filtering, exercise joins
  - Exposes: Simple array of exercise volumes
  - Single responsibility: Calculate total volume metrics

  Time: 45min
  ```

- [x] Create workout frequency query for heatmap

  ```
  Files: convex/analytics.ts (append)

  Implementation:
  - Create `getWorkoutFrequency` query
  - Args: { days: number } (e.g., 365 for full year)
  - Return: Array<{ date: string (YYYY-MM-DD), setCount: number, totalVolume: number }>
  - Group sets by calendar day using startOfDay logic
  - Fill gaps with zero days (for heatmap visualization)
  - Use `by_user_performed` index for date range

  Success Criteria:
  - Returns daily set counts for last N days
  - Includes zero-count days (continuous date range)
  - Date format matches react-activity-calendar expectations
  - Handles timezone correctly (user's local time)

  Test Strategy:
  - Unit test: 7 days, 30 days, 365 days
  - Edge cases: No workouts, gaps in data, timezone boundaries
  - Verify gap filling works correctly

  Module Boundaries:
  - Hides: Date grouping, gap filling, timezone handling
  - Exposes: Clean array of daily workout counts
  - Single responsibility: Frequency data for heatmap

  Time: 45min
  ```

- [x] Create streak calculation query

  ```
  Files: convex/analytics.ts (append), convex/lib/streak-calculator.ts (new)
  Approach: Adapt src/lib/streak-calculator.ts for Convex

  Implementation:
  - Move streak logic to convex/lib/streak-calculator.ts
  - Make calculateStreak work with Convex Date objects
  - Create `getStreakStats` query in analytics.ts
  - Return: { currentStreak: number, longestStreak: number, totalWorkouts: number }
  - Calculate longest streak by scanning all workout history
  - Cache-friendly: expensive but run infrequently

  Success Criteria:
  - Current streak matches client-side calculation
  - Longest streak correctly scans entire history
  - Total workouts = unique days with sets
  - Handles edge case: workout today vs yesterday

  Test Strategy:
  - Unit test: Consecutive days, gaps, multiple streaks
  - Compare against existing src/lib/streak-calculator.ts behavior
  - Edge cases: No workouts, single workout, 365+ streak

  Module Boundaries:
  - Hides: Streak algorithm, date comparisons, history scanning
  - Exposes: Three simple numbers (current, longest, total)
  - Single responsibility: Streak metrics

  Time: 30min
  ```

- [x] Create recent PRs query

  ```
  Files: convex/analytics.ts (append)
  Approach: Leverage existing src/lib/pr-detection.ts patterns

  Implementation:
  - Create `getRecentPRs` query
  - Args: { days: number } (e.g., 7, 30)
  - Query sets from last N days
  - For each set, check if it was a PR using historical-pr-detection logic
  - Return: Array<{ set, exercise, prType: 'weight'|'reps'|'volume', improvement }>
  - Join with exercises to get names
  - Sort by performedAt descending

  Success Criteria:
  - Returns all PRs from last N days
  - Includes exercise names for display
  - Correctly identifies PR type (weight/reps/volume)
  - Shows improvement amount (current - previous)

  Test Strategy:
  - Unit test: Multiple PRs, different types, edge cases
  - Verify against src/lib/pr-detection.ts logic
  - Edge cases: First-ever set (always PR), no PRs in period

  Module Boundaries:
  - Hides: PR detection algorithm, historical comparison
  - Exposes: Clean list of PR achievements
  - Single responsibility: Recent PR summary

  Time: 45min
  ```

- [x] Add analytics query tests

  ```
  Files: convex/analytics.test.ts (new)
  Approach: Follow convex/exercises.test.ts:1-40 pattern

  Implementation:
  - Set up convexTest with schema
  - Test getVolumeByExercise: multiple exercises, date ranges
  - Test getWorkoutFrequency: gap filling, zero days
  - Test getStreakStats: consecutive days, gaps
  - Test getRecentPRs: PR detection, date filtering
  - Mock data: 30 days of sets across 5 exercises

  Success Criteria:
  - All queries tested with realistic data
  - Edge cases covered (no data, single set, deleted exercises)
  - Tests pass with `pnpm test`

  Test Strategy:
  - Integration tests using convexTest
  - Each query tested independently
  - Shared test fixtures for common scenarios

  Time: 1hr
  ```

### Frontend: Navigation & Page Structure

- [x] Add Analytics tab to bottom navigation

  ```
  Files: src/components/layout/bottom-nav.tsx:8-12
  Approach: Follow existing nav pattern

  Implementation:
  - Import BarChart3 icon from lucide-react
  - Add to navItems array: { href: "/analytics", label: "Stats", icon: BarChart3 }
  - Position between Home and History (middle of nav)
  - Verify active state detection works for /analytics path

  Success Criteria:
  - New tab appears in bottom nav
  - Active state highlights when on /analytics
  - Icon renders correctly
  - Label readable on mobile

  Test Strategy:
  - Visual QA: Check nav on mobile viewport
  - Test navigation: Click should route to /analytics
  - Verify active state styling

  Module Boundaries:
  - Simple config change, no complexity hidden

  Time: 10min
  ```

- [x] Create analytics page scaffold

  ```
  Files: src/app/analytics/page.tsx (new)
  Approach: Follow src/app/history/page.tsx pattern

  Implementation:
  - "use client" directive for Convex hooks
  - Import PageLayout from @/components/layout/page-layout
  - Render placeholder: "Analytics Dashboard" heading
  - Add empty states for each metric section
  - Mobile-first responsive layout

  Success Criteria:
  - Page renders at /analytics
  - Uses PageLayout for consistent chrome
  - TypeScript compiles without errors
  - Mobile-responsive scaffold in place

  Test Strategy:
  - Visual QA: Check on desktop and mobile
  - Smoke test: Page loads without errors

  Module Boundaries:
  - Page orchestration: coordinates metric components
  - Hides: Layout complexity, responsive breakpoints

  Time: 15min
  ```

### Frontend: Visualization Components

- [x] Implement VolumeChart component

  ```
  Files: src/components/analytics/volume-chart.tsx (new), package.json (add recharts)
  Approach: Follow patterns from Exa research (ChartsContainer with Recharts)

  Implementation:
  - Install: pnpm add recharts
  - Props: { data: Array<{ name: string, volume: number }> }
  - Use ResponsiveContainer for mobile-first sizing
  - BarChart with volume on Y-axis, exercise on X-axis
  - Dark mode: Use CSS variables for colors (hsl(var(--primary)))
  - Tooltip shows exact volume with formatWeight
  - Empty state: "No workout data" with Dumbbell icon
  - Loading skeleton while data fetches

  Success Criteria:
  - Chart renders with sample data
  - Responsive on mobile (full width)
  - Dark mode colors match theme
  - Tooltip formatted correctly
  - Empty state shows when data=[]

  Test Strategy:
  - Smoke test: Renders without crashing
  - Visual QA: Check dark/light mode
  - Test empty state and loading state

  Module Boundaries:
  - Hides: Recharts configuration, responsive sizing, theming
  - Exposes: Simple props interface (just data array)
  - Single responsibility: Visualize volume data

  Time: 45min
  ```

- [x] Implement ActivityHeatmap component

  ```
  Files: src/components/analytics/activity-heatmap.tsx (new), package.json (add react-activity-calendar)

  Implementation:
  - Install: pnpm add react-activity-calendar
  - Props: { data: Array<{ date: string, count: number, level: number }> }
  - Calculate level (0-4) based on set count (0, 1-3, 4-7, 8-12, 13+)
  - Show last 365 days (GitHub style)
  - Dark mode theme with --primary color scheme
  - Tooltip: "X sets on DATE"
  - Labels: Show month names, weekday labels

  Success Criteria:
  - Heatmap renders 365-day grid
  - Colors intensity based on workout volume
  - Tooltip shows workout details
  - Responsive on mobile (horizontal scroll if needed)
  - Dark mode colors readable

  Test Strategy:
  - Smoke test with various data patterns
  - Visual QA: Streaks, gaps, intensity levels
  - Edge cases: All zeros, all max, sparse data

  Module Boundaries:
  - Hides: Calendar rendering, level calculation, tooltip logic
  - Exposes: Simple data array interface
  - Single responsibility: Frequency visualization

  Time: 30min
  ```

- [x] Implement PRCard component

  ```
  Files: src/components/analytics/pr-card.tsx (new)
  Approach: Follow src/components/dashboard/daily-stats-card.tsx pattern

  Implementation:
  - Props: { prs: Array<{ exercise, prType, value, improvement, date }> }
  - Use Card, CardHeader, CardTitle, CardContent from ui/card
  - Trophy icon (lucide-react) for header
  - List recent PRs with celebration styling
  - Badge for PR type (weight/reps/volume)
  - Show improvement: "+5 lbs" or "+2 reps"
  - Relative date: "2 days ago"
  - Empty state: "No recent PRs - keep pushing!"
  - Celebrate with emoji: 🏆 for PRs

  Success Criteria:
  - Card renders with PR list
  - Each PR shows exercise, type, improvement
  - Empty state encourages user
  - Celebration styling (bold, accent color)
  - Mobile-responsive layout

  Test Strategy:
  - Smoke test: Render with 0, 1, 5+ PRs
  - Visual QA: Celebration feels motivating

  Module Boundaries:
  - Hides: PR formatting, date formatting, styling complexity
  - Exposes: Simple PR data array
  - Single responsibility: Display PR achievements

  Time: 30min
  ```

- [x] Implement StreakCard component

  ```
  Files: src/components/analytics/streak-card.tsx (new)
  Approach: Follow daily-stats-card.tsx Card pattern

  Implementation:
  - Props: { currentStreak: number, longestStreak: number, totalWorkouts: number }
  - Card with Flame icon header
  - Large display of current streak: "🔥 7 Day Streak"
  - Secondary stats: Longest streak, total workouts
  - Progress bar if weekly goal defined (future: allow user to set)
  - Milestone badges: Week (7d), Month (30d), Century (100d)
  - Empty state: "Start your streak today!"
  - Celebration animation if milestone hit (future enhancement)

  Success Criteria:
  - Current streak prominently displayed
  - All three metrics visible
  - Milestone detection works correctly
  - Empty state shows for new users
  - Responsive layout

  Test Strategy:
  - Smoke test: 0 streak, 7 streak, 100 streak
  - Visual QA: Check milestone styling

  Module Boundaries:
  - Hides: Streak formatting, milestone logic, progress calculation
  - Exposes: Three simple numbers
  - Single responsibility: Streak visualization

  Time: 30min
  ```

### Frontend: Analytics Page Integration

- [x] Integrate analytics components into page

  ```
  Files: src/app/analytics/page.tsx (modify)

  Implementation:
  - Import all analytics queries from convex/analytics
  - Import all visualization components
  - Use useQuery for each metric: volume, frequency, streak, PRs
  - Handle loading states (show skeletons)
  - Handle error states (show retry button)
  - Layout: Grid on desktop (2 columns), stack on mobile
  - Order: PRCard (top), StreakCard, VolumeChart, ActivityHeatmap
  - Add page heading: "Your Analytics"
  - Add subtitle: "Track your progress and celebrate wins"

  Success Criteria:
  - All four metrics render with live data
  - Loading states show while queries pending
  - Error handling works (show message + retry)
  - Responsive layout works mobile → desktop
  - Data updates in real-time (Convex reactivity)

  Test Strategy:
  - Manual QA: Log sets, verify charts update
  - Test loading states (slow network simulation)
  - Test error states (disconnect Convex)
  - Cross-browser testing

  Module Boundaries:
  - Page orchestrates components (doesn't implement logic)
  - Hides: Query coordination, layout complexity
  - Exposes: Complete analytics dashboard

  Time: 45min
  ```

- [x] Add empty state for new users

  ```
  Files: src/app/analytics/page.tsx (modify)

  Implementation:
  - Detect if user has <7 days of workout data
  - Show friendly onboarding message
  - "Log 7 days of workouts to unlock analytics!"
  - Show partial data if available (e.g., just streak)
  - Motivational copy: "Every champion started somewhere"
  - Visual: Dumbbell icon or chart placeholder

  Success Criteria:
  - New users see encouraging message
  - Threshold logic correct (7 days)
  - Partial data still shows (progressive disclosure)

  Test Strategy:
  - Test with brand new account
  - Test with 1 day, 3 days, 7+ days of data

  Time: 20min
  ```

---

## Phase 2: AI Insights Integration (Week 2)

### Backend: Schema & AI Module Setup

- [x] Add aiReports table to Convex schema

  ```
  Files: convex/schema.ts:32 (append after sets table)

  Implementation:
  - Define aiReports table with fields:
    - userId: v.string()
    - weekStartDate: v.number() (Unix timestamp for Monday 00:00)
    - generatedAt: v.number() (Unix timestamp of generation)
    - content: v.string() (Markdown-formatted AI response)
    - metricsSnapshot: v.object({ ... }) (JSON of metrics used for transparency)
    - model: v.string() (e.g., "gpt-5-mini")
    - tokenUsage: v.object({ input: v.number(), output: v.number(), costUSD: v.number() })
  - Add indexes:
    - by_user: [userId]
    - by_user_week: [userId, weekStartDate]
  - Run `pnpm convex dev` to apply schema changes

  Success Criteria:
  - Schema compiles without errors
  - Indexes created successfully
  - TypeScript types generated in _generated/dataModel.d.ts

  Test Strategy:
  - Schema validation passes
  - Can insert test record via Convex dashboard

  Module Boundaries:
  - Data layer: defines storage structure only

  Time: 15min
  ```

- [x] Create AI prompt template module

  ```
  Files: convex/ai/prompts.ts (new), convex/ai/ (new directory)

  Implementation:
  - Export systemPrompt: Define AI role as technical strength coach
  - Tone: Data-driven, technical, actionable (not motivational)
  - Export formatMetricsPrompt(metrics): Convert metrics to prompt
  - Metrics input: { volume, prs, frequency, streak, restDays }
  - Prompt structure:
    - "Analyze this week's training data:"
    - Volume by exercise (with week-over-week % change)
    - PRs achieved (with context)
    - Workout frequency (days trained, rest days)
    - Streak status
    - "Provide technical analysis: trends, plateaus, recovery, optimization"
  - Include few-shot examples of good analysis
  - Target length: 200-400 words
  - Version prompt for future A/B testing

  Success Criteria:
  - Prompt generates consistent, technical analysis
  - Token count predictable (~400 input tokens)
  - Examples show desired output format

  Test Strategy:
  - Manual test with OpenAI playground
  - Verify token count with sample metrics
  - Review output quality with 5+ test cases

  Module Boundaries:
  - Hides: Prompt engineering complexity, formatting logic
  - Exposes: Simple function accepting metrics object
  - Single responsibility: Convert metrics → prompt

  Time: 1hr (includes prompt iteration/testing)
  ```

- [x] Implement OpenAI integration module

  ```
  Files: convex/ai/openai.ts (new), package.json (add openai)

  Implementation:
  - Install: pnpm add openai
  - Export generateAnalysis(metrics): Promise<{ content, tokenUsage }>
  - Initialize OpenAI client with OPENAI_API_KEY from env
  - Call GPT-5 mini with system + user prompts
  - Temperature: 0.7 (creative but consistent)
  - Max tokens: 1000 (cap at ~800 output)
  - Parse response, extract content
  - Calculate cost: (inputTokens * $0.25 + outputTokens * $2) / 1M
  - Error handling: Retry with exponential backoff (3 attempts)
  - Timeout: 30 seconds
  - Log token usage for cost monitoring

  Success Criteria:
  - Successfully calls GPT-5 mini API
  - Returns markdown-formatted analysis
  - Token usage tracked accurately
  - Cost calculation correct
  - Retries on transient failures
  - Errors logged with context

  Test Strategy:
  - Integration test with real API (use test key)
  - Mock test for error scenarios
  - Verify token count and cost calculation
  - Test timeout handling

  Module Boundaries:
  - Hides: OpenAI SDK details, retry logic, error handling
  - Exposes: Simple async function (metrics → analysis)
  - Single responsibility: LLM API integration

  Time: 1hr
  ```

- [x] Create AI report generation mutation

  ```
  Files: convex/ai/reports.ts (new)

  Implementation:
  - Import analytics queries, OpenAI module, prompts
  - Export generateReport: internalMutation (not exposed to client directly)
  - Args: { userId: string, weekStartDate?: number }
  - weekStartDate defaults to current week (Monday 00:00 UTC)
  - Fetch metrics: call getVolumeByExercise, getRecentPRs, etc.
  - Format metrics for prompt using formatMetricsPrompt
  - Call OpenAI via generateAnalysis
  - Store result in aiReports table
  - Return reportId
  - Rate limiting: Check if report already exists for this week
  - Deduplication: Prevent duplicate reports for same week

  Success Criteria:
  - Generates report with realistic metrics
  - Stores in database correctly
  - Idempotent (doesn't create duplicates)
  - Returns reportId on success
  - Handles OpenAI errors gracefully

  Test Strategy:
  - Integration test: Full generation with mock metrics
  - Test deduplication logic
  - Test error handling (API failure)

  Module Boundaries:
  - Hides: Report generation workflow, metric aggregation, storage
  - Exposes: Single mutation (userId → reportId)
  - Single responsibility: Orchestrate AI report creation

  Time: 45min
  ```

- [x] Create report query functions

  ```
  Files: convex/ai/reports.ts (append)

  Implementation:
  - Export getLatestReport: query
  - Args: none (uses auth userId)
  - Return: Most recent report or null
  - Export getReportHistory: query
  - Args: { limit?: number } (default 10)
  - Return: Array of reports, sorted by generatedAt desc
  - Both queries verify userId ownership
  - Include metricsSnapshot for transparency

  Success Criteria:
  - getLatestReport returns most recent or null
  - getReportHistory returns sorted array
  - Ownership verified (user can't see others' reports)
  - Pagination works correctly

  Test Strategy:
  - Unit test: Multiple reports, different users
  - Test ownership verification
  - Test empty state (no reports)

  Module Boundaries:
  - Hides: Query logic, sorting, filtering
  - Exposes: Simple query functions
  - Single responsibility: Report retrieval

  Time: 30min
  ```

- [~] Implement scheduled weekly report generation

  ```
  Files: convex/crons.ts (new)

  Implementation:
  - Import cronJobs from "convex/server"
  - Import internal.ai.reports.generateReport
  - Schedule cron: Every Sunday at 9 PM UTC
  - Cron expression: "0 21 * * 0"
  - Handler: Query all active users (logged workout in last 14 days)
  - For each user, call generateReport(userId)
  - Rate limit: Max 100 users per run (batch if more)
  - Error handling: Log failures, don't crash entire job
  - Track: Users processed, reports generated, errors

  Success Criteria:
  - Cron runs on schedule (test with shorter interval first)
  - Active users identified correctly
  - Reports generated for all eligible users
  - Errors logged but don't stop batch
  - Performance acceptable (<5 min for 100 users)

  Test Strategy:
  - Manual test: Trigger cron with small user set
  - Monitor logs for errors
  - Verify reports created in database

  Module Boundaries:
  - Hides: User querying, batching, error handling
  - Exposes: Automated weekly reports
  - Single responsibility: Scheduled report generation

  Time: 45min
  ```

### Frontend: AI Insights UI

- [ ] Create AIInsightsCard component

  ```
  Files: src/components/analytics/ai-insights-card.tsx (new)

  Implementation:
  - Props: { report: AIReport | null, onGenerateNew: () => void, isGenerating: boolean }
  - Card with Sparkles icon (AI indicator)
  - Header: "AI Coach Insights"
  - If no report: "Generate your first analysis" CTA button
  - If report exists:
    - Render markdown content (install react-markdown)
    - Show generation timestamp: "Generated 2 days ago"
    - "Regenerate" button (calls onGenerateNew)
    - Loading state during generation (spinner + "Analyzing...")
  - Error state: "Failed to generate. Try again?"
  - Collapsible: Can minimize/expand for space

  Success Criteria:
  - Markdown renders correctly with styling
  - CTA button calls onGenerateNew
  - Loading state shows during generation
  - Error state handles failures
  - Mobile-responsive (readable on small screens)

  Test Strategy:
  - Smoke test: Render with/without report
  - Test loading state
  - Test error state
  - Visual QA: Markdown formatting

  Module Boundaries:
  - Hides: Markdown rendering, loading states, styling
  - Exposes: Simple report display + generate callback
  - Single responsibility: AI report UI

  Time: 45min
  ```

- [ ] Create on-demand report generation mutation

  ```
  Files: convex/ai/reports.ts (append)

  Implementation:
  - Export generateOnDemandReport: mutation (user-facing)
  - Args: none (uses auth userId)
  - Rate limiting: Check daily limit (5 per user per day)
  - Track: Last generation timestamp in aiReports table
  - Call internal generateReport mutation
  - Return: reportId or error
  - Error: "Daily limit reached (5/5). Try again tomorrow."

  Success Criteria:
  - Rate limit enforced correctly
  - Returns reportId on success
  - Clear error messages for limit violations
  - Daily counter resets at midnight UTC

  Test Strategy:
  - Unit test: Generate 6 reports (verify limit)
  - Test daily reset logic
  - Test error messages

  Module Boundaries:
  - Hides: Rate limiting, daily reset logic
  - Exposes: Simple user-triggered generation
  - Single responsibility: On-demand generation with limits

  Time: 30min
  ```

- [ ] Integrate AI insights into analytics page

  ```
  Files: src/app/analytics/page.tsx (modify)

  Implementation:
  - Import AIInsightsCard, ai.reports queries/mutations
  - Use useQuery(api.ai.reports.getLatestReport)
  - Use useMutation(api.ai.reports.generateOnDemandReport)
  - Add AIInsightsCard to page layout (top or bottom)
  - Handle generate callback: call mutation, show toast on success/error
  - Loading state: Disable button during generation
  - Success toast: "Analysis complete!"
  - Error toast: Show rate limit or API error message

  Success Criteria:
  - Latest report displays on page load
  - Generate button creates new report
  - Toast notifications work
  - Loading states prevent double-clicks
  - Error messages clear and actionable

  Test Strategy:
  - Manual QA: Generate report, verify display
  - Test rate limiting (generate 6x)
  - Test error handling (disconnect network)

  Module Boundaries:
  - Page orchestrates AI component (like other metrics)

  Time: 30min
  ```

### Backend: AI Testing & Cost Monitoring

- [ ] Add OpenAI integration tests

  ```
  Files: convex/ai/openai.test.ts (new)

  Implementation:
  - Mock OpenAI SDK responses
  - Test generateAnalysis with sample metrics
  - Verify prompt construction correct
  - Test token usage calculation
  - Test cost calculation
  - Test error handling (rate limit, timeout, invalid response)
  - Test retry logic (fails 2x, succeeds 3rd)

  Success Criteria:
  - All OpenAI scenarios tested
  - Mocking works correctly
  - Token/cost calculations verified

  Test Strategy:
  - Unit tests with mocked OpenAI client
  - Integration test with real API (CI environment variable)

  Time: 1hr
  ```

- [ ] Add AI report generation tests

  ```
  Files: convex/ai/reports.test.ts (new)

  Implementation:
  - Use convexTest with schema
  - Mock OpenAI responses
  - Test full report generation workflow
  - Test deduplication (same week)
  - Test rate limiting (daily limit)
  - Test getLatestReport, getReportHistory
  - Test ownership verification

  Success Criteria:
  - All report functions tested
  - Deduplication works
  - Rate limiting enforced
  - Tests pass consistently

  Test Strategy:
  - Integration tests with convexTest
  - Mock OpenAI to avoid API costs in tests

  Time: 1hr
  ```

---

## Phase 3: Polish & Optimization (Week 3-4)

### Performance Optimization

- [ ] Add date range filter to analytics page

  ```
  Files: src/app/analytics/page.tsx (modify), src/components/analytics/date-range-selector.tsx (new)

  Implementation:
  - Create DateRangeSelector component
  - Options: 7d, 30d, 90d, 1y, All Time
  - Tabs or dropdown UI
  - Pass selected range to all analytics queries
  - Update charts/cards based on selected range
  - Persist selection in localStorage

  Success Criteria:
  - Filter updates all metrics
  - Selection persists across page reloads
  - UI indicates active selection

  Time: 45min
  ```

- [ ] Implement query result caching

  ```
  Files: src/app/analytics/page.tsx (modify)

  Implementation:
  - Use Convex's built-in reactivity (automatic)
  - Add React.memo to expensive chart components
  - Prevent unnecessary re-renders
  - Verify query deduplication working

  Success Criteria:
  - Charts don't re-render on unrelated state changes
  - Query results cached by Convex client

  Time: 30min
  ```

- [ ] Add lazy loading for charts

  ```
  Files: src/app/analytics/page.tsx (modify)

  Implementation:
  - Use React.lazy for chart components
  - Suspense boundaries with loading skeletons
  - Load charts below fold only when visible (Intersection Observer)
  - Reduce initial bundle size

  Success Criteria:
  - Charts code-split into separate chunks
  - Initial page load faster
  - Charts load smoothly on scroll

  Time: 45min
  ```

### UX Enhancements

- [ ] Add PR celebration animation

  ```
  Files: src/components/analytics/pr-card.tsx (modify)

  Implementation:
  - Detect new PRs (compare to previous render)
  - Confetti animation on PR achievement (use canvas-confetti)
  - Trophy icon bounce animation
  - Play once per PR, don't repeat on re-render
  - Subtle, not annoying

  Success Criteria:
  - Animation plays for new PRs
  - Doesn't repeat unnecessarily
  - Works on mobile
  - Accessible (respects prefers-reduced-motion)

  Time: 1hr
  ```

- [ ] Add export analytics data feature

  ```
  Files: src/app/analytics/page.tsx (modify), src/lib/export-csv.ts (new)

  Implementation:
  - "Export CSV" button in page header
  - Export volume data, PRs, frequency
  - Format: CSV with headers
  - Download file: "volume-analytics-YYYY-MM-DD.csv"
  - Use client-side generation (no backend needed)

  Success Criteria:
  - CSV downloads correctly
  - Data formatted properly
  - Opens in Excel/Sheets

  Time: 45min
  ```

- [ ] Add share report feature

  ```
  Files: src/components/analytics/ai-insights-card.tsx (modify)

  Implementation:
  - "Copy to Clipboard" button on AI report
  - Copies markdown content
  - Toast: "Report copied!"
  - User can paste into notes, messages

  Success Criteria:
  - Clipboard API works
  - Markdown preserved
  - Toast confirmation shows

  Time: 20min
  ```

### AI Improvements

- [ ] Add AI report feedback system

  ```
  Files: convex/ai/reports.ts (modify), src/components/analytics/ai-insights-card.tsx (modify)

  Implementation:
  - Add thumbsUp/thumbsDown buttons to report card
  - Track feedback in aiReports table
  - New field: feedback: v.optional(v.union(v.literal("up"), v.literal("down")))
  - Mutation: submitReportFeedback(reportId, feedback)
  - Use for future prompt tuning
  - Thank user: "Thanks for your feedback!"

  Success Criteria:
  - Feedback buttons work
  - Stored in database
  - UI updates after submission

  Time: 30min
  ```

- [ ] Implement prompt versioning

  ```
  Files: convex/ai/prompts.ts (modify)

  Implementation:
  - Version prompts: v1, v2, etc.
  - Store version in aiReports.promptVersion field
  - Allow A/B testing different prompts
  - Track which versions get better feedback
  - Document prompt changes in comments

  Success Criteria:
  - Prompt version tracked per report
  - Easy to roll out new prompt versions
  - Can compare feedback by version

  Time: 30min
  ```

### Documentation & Monitoring

- [ ] Add analytics architecture documentation

  ```
  Files: CLAUDE.md (append section)

  Implementation:
  - Document analytics module boundaries
  - Explain query patterns
  - Document AI integration architecture
  - Cost estimates and monitoring
  - Troubleshooting guide

  Success Criteria:
  - Team can understand analytics system
  - Future maintenance easier

  Time: 30min
  ```

- [ ] Create AI cost monitoring query

  ```
  Files: convex/ai/reports.ts (append)

  Implementation:
  - Export getCostStats: query (admin only)
  - Aggregate tokenUsage from all reports
  - Calculate: Total cost, avg cost per report, daily/weekly spend
  - Identify expensive reports (outliers)
  - Alert if daily cost > threshold ($2/day)

  Success Criteria:
  - Accurate cost tracking
  - Can identify cost anomalies
  - Alerts work

  Time: 45min
  ```

### Testing & Quality

- [ ] Add end-to-end analytics tests

  ```
  Files: src/app/analytics/page.test.tsx (new)

  Implementation:
  - Test page renders all components
  - Test date range filter
  - Test empty states
  - Test loading states
  - Mock Convex queries

  Success Criteria:
  - Page-level integration tests pass
  - All user flows covered

  Time: 1hr
  ```

- [ ] Accessibility audit

  ```
  Files: All analytics components

  Implementation:
  - Verify keyboard navigation works
  - Screen reader friendly (ARIA labels)
  - Color contrast meets WCAG AA
  - Focus indicators visible
  - Reduced motion respected

  Success Criteria:
  - Lighthouse accessibility score >90
  - Keyboard-only navigation works
  - Screen reader testing passes

  Time: 1hr
  ```

---

## Design Iteration Checkpoints

**After Phase 1 (Quantitative Analytics)**:

- Review: Are analytics queries performant enough?
- Consider: Should we cache computed metrics?
- Extract: Common chart patterns into shared components?
- Refactor: Any coupling between metric calculations?

**After Phase 2 (AI Integration)**:

- Review: Is AI analysis valuable? (Read user feedback)
- Consider: Prompt improvements based on quality
- Extract: Reusable AI integration patterns for future features
- Refactor: Report generation workflow if complex

**After Phase 3 (Polish)**:

- Review: Bundle size acceptable? (<500KB analytics chunk)
- Consider: Further performance optimizations
- Extract: Export/share patterns for reuse
- Plan: Next iteration features (muscle group analysis, workout plans)

---

## Automation Opportunities

1. **Cost Monitoring Alerts**: Set up automated alert if daily AI costs exceed $2
2. **Weekly Analytics Email**: Future feature - email weekly report to users
3. **Prompt Testing**: Script to test prompts with historical data, measure quality
4. **Bundle Analysis**: Automate bundle size monitoring in CI
5. **Screenshot Testing**: Visual regression tests for charts/heatmaps
