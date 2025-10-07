# TODO: Dashboard Reorganization - Multi-Page Navigation

## Progress Summary

**Completed (7 commits):**
- ✅ Module 1: Date utilities with timezone-aware calculations + tests (779d541, 60013e9)
- ✅ Module 2: Bottom navigation component (3534ee7)
- ✅ Module 2: Desktop navigation in top nav (3469612)
- ✅ Module 3: iOS safe area CSS utilities (d3812ed)
- ✅ Module 3: Layout infrastructure with responsive padding (41128f3)
- ✅ Module 4: Convex pagination query (5f360be)

**Next Steps:**
- [ ] Module 5: Create History page (uses pagination)
- [ ] Module 6: Create Settings page (reuses ExerciseManager)
- [ ] Module 7: Refactor Dashboard (uses date utilities)

**Branch:** `feature/multi-page-navigation`

---

## Context
- **Approach**: 3-page structure (Dashboard, History, Settings) with mobile-first bottom navigation
- **Key Pattern**: Reuse existing components (`TerminalPanel`, `DailyStatsCard`, `GroupedSetHistory`, `ExerciseManager`)
- **Architecture**: Module boundaries align with pages; navigation is separate module
- **Testing**: Vitest with jsdom, setup in `src/test/setup.ts`

## Phase 1: Core Modules (6-8 hours)

### Module 1: Date Utilities (Independent, Foundational)

- [x] **Add date-fns dependency**
  ```
  ✅ Completed: 779d541
  Files: package.json, pnpm-lock.yaml
  Added: date-fns 4.1.0
  ```

- [x] **Create date utilities module**
  ```
  ✅ Completed: 60013e9
  Files: src/lib/date-utils.ts, src/lib/date-utils.test.ts
  Result: getTodayRange() with 5 passing tests
  - Handles midnight-to-midnight in user's timezone
  - All edge cases covered (midnight boundary, filtering)
  - date-fns handles DST automatically
  ```

### Module 2: Bottom Navigation (Independent, UI-only)

- [x] **Create bottom navigation component**
  ```
  ✅ Completed: 3534ee7
  Files: src/components/layout/bottom-nav.tsx
  Result: Fixed bottom nav with 3 items, active state, pb-safe for iOS
  - usePathname() for active route detection
  - Home, History, Settings icons from lucide-react
  - 64px touch targets (WCAG compliant)
  - Terminal aesthetic with border-t
  ```

- [x] **Update existing Nav for desktop top navigation**
  ```
  ✅ Completed: 3469612
  Files: src/components/layout/nav.tsx
  Result: Desktop nav links with active state (underline + color)
  - Horizontal layout next to logo
  - Hidden on mobile (md:hidden), shown on desktop (md:flex)
  - Preserves UserButton and ThemeToggle
  - Responsive at 768px breakpoint
  ```

### Module 3: Layout Infrastructure (Foundational)

- [x] **Add iOS safe area utilities to globals.css**
  ```
  ✅ Completed: d3812ed
  Files: src/app/globals.css
  Result: pb-safe, pt-safe, pl-safe, pr-safe utilities added
  - @layer utilities for Tailwind integration
  - env(safe-area-inset-*) for iOS notch/home indicator
  - Applied to BottomNav component
  ```

- [x] **Update root layout for bottom nav and viewport**
  ```
  ✅ Completed: 41128f3
  Files: src/app/layout.tsx
  Result: Bottom nav integrated with responsive padding
  - pb-20 on mobile (80px: 64px nav + 16px buffer)
  - pb-12 on desktop (no bottom nav)
  - BottomNav wrapped in md:hidden div
  - Footer remains reachable
  ```

### Module 4: Convex Pagination (Backend, Independent)

- [x] **Add paginated sets query to Convex**
  ```
  ✅ Completed: 5f360be
  Files: convex/sets.ts
  Result: listSetsPaginated query with cursor-based pagination
  - Custom paginationOpts validator (numItems, cursor)
  - Uses by_user_performed index, order desc
  - Default 25 items per page
  - Returns { page, isDone, continueCursor }
  - Ready for usePaginatedQuery on frontend
  ```

### Module 5: History Page (Depends on Module 4)

- [ ] **Create history page with pagination**
  ```
  Files: NEW src/app/history/page.tsx
  Approach: Reuse GroupedSetHistory component, wrap with usePaginatedQuery
  Success: Shows paginated sets, "Load More" button, handles mutations
  Test: Manual test (log 30+ sets, verify pagination), test load more
  Module: Single responsibility (history display), orchestrates pagination + mutations
  Dependencies: GroupedSetHistory (existing), listSetsPaginated (Module 4)
  Time: 1h 30min

  Implementation:
  - "use client" directive
  - Import usePaginatedQuery, useMutation from convex/react
  - Import GroupedSetHistory from @/components/dashboard/grouped-set-history
  - Import api from convex/_generated/api
  - usePaginatedQuery(api.sets.listSetsPaginated, {}, { initialNumItems: 25 })
  - Extract: results, status, loadMore from hook
  - Fetch exercises (useQuery api.exercises.listExercises) for names
  - deleteSet mutation (reuse existing api.sets.deleteSet)
  - Empty state: "No workout history yet" (when results.length === 0)
  - Loading skeleton: Show while status === "LoadingFirstPage"
  - GroupedSetHistory: Pass results (already grouped? NO - need grouping)
  - Wait: Check if GroupedSetHistory expects grouped data or raw sets
  - Load More button: Show when status === "CanLoadMore"
  - Loading indicator: Show when status === "LoadingMore"

  Test Strategy:
  - Manual: Create 30+ sets, verify pagination works
  - Load More: Click button, verify next batch loads
  - Empty state: Delete all sets, verify empty state shows
  - Mutations: Repeat set, delete set, verify updates
  ```

- [ ] **Handle set grouping in history page**
  ```
  Files: src/app/history/page.tsx (after initial implementation)
  Approach: Use groupSetsByDay from dashboard-utils.ts
  Success: Sets grouped by date, chronological order
  Test: Verify grouping matches dashboard behavior
  Module: Delegates grouping to utility (separation of concerns)
  Dependencies: groupSetsByDay (existing in dashboard-utils.ts)
  Time: 15min (part of history page task, split for clarity)

  Implementation:
  - Import groupSetsByDay from @/lib/dashboard-utils
  - const groupedSets = useMemo(() => groupSetsByDay(results), [results])
  - Pass groupedSets to GroupedSetHistory component
  - Verify GroupedSetHistory expects { date, displayDate, sets[] }

  Test Strategy:
  - Manual: Verify sets grouped by day, newest first
  - Edge case: Sets spanning multiple days
  ```

### Module 6: Settings Page (Reuses Existing Components)

- [ ] **Create settings page**
  ```
  Files: NEW src/app/settings/page.tsx
  Approach: Import ExerciseManager, add section headers with TerminalPanel
  Success: Shows exercise manager, weight unit toggle, expandable sections
  Test: Manual test (create/edit/delete exercises, toggle units)
  Module: Single responsibility (settings orchestration), composes existing components
  Dependencies: ExerciseManager (existing), WeightUnitContext (existing)
  Time: 45min

  Implementation:
  - "use client" directive
  - Import ExerciseManager from @/components/dashboard/exercise-manager
  - Import TerminalPanel from @/components/ui/terminal-panel
  - Import useWeightUnit from @/contexts/WeightUnitContext
  - useQuery for exercises and sets (ExerciseManager needs both)
  - Section 1: Exercise Management (TerminalPanel with ExerciseManager inside)
  - Section 2: Preferences (TerminalPanel with weight unit toggle)
  - Weight unit toggle: Use existing WeightUnitContext (unit, setUnit)
  - Layout: Space-y-4 between sections, max-w-4xl mx-auto
  - Loading state: Show skeleton while data fetches

  Test Strategy:
  - Manual: Create exercise, rename, delete (blocked if sets exist)
  - Weight toggle: Switch units, verify persistence (localStorage)
  - Responsive: Test mobile and desktop layouts
  ```

### Module 7: Dashboard Refactor (Depends on Module 1)

- [ ] **Refactor dashboard to show only today's data**
  ```
  Files: src/app/page.tsx:21-190, src/components/dashboard/Dashboard.tsx:1-190
  Approach: Filter sets using getTodayRange(), remove history and exercise manager
  Success: Dashboard shows only today's stats, quick log, today's sets
  Test: Manual test (log sets today and yesterday, verify only today shown)
  Module: Reduces from 190 → ~80 lines, single responsibility (today's workout)
  Dependencies: getTodayRange (Module 1), existing components
  Time: 1h 30min

  Implementation:
  - Import getTodayRange from @/lib/date-utils
  - Calculate: const { start, end } = getTodayRange()
  - Filter sets: const todaysSets = sets?.filter(s => s.performedAt >= start && s.performedAt <= end)
  - Remove: <GroupedSetHistory> component (moved to /history)
  - Remove: <ExerciseManager> component (moved to /settings)
  - Keep: <DailyStatsCard>, <QuickLogForm>, today's set display
  - Today's sets display: Reuse SetCard or create simple list
  - Option: Reuse GroupedSetHistory with filtered todaysSets
  - Update stats calculations: Pass todaysSets instead of all sets
  - Update exerciseStats: Filter to today's exercises
  - Verify: Undo toast still works (state management unchanged)

  Test Strategy:
  - Manual: Log sets today, yesterday, last week
  - Verify: Only today's sets show on dashboard
  - Verify: Stats accurate (only today's reps/volume)
  - Edge case: Cross midnight (log set at 11:59 PM, refresh at 12:01 AM)
  - Regression: Quick log still works, undo still works
  ```

- [ ] **Create today's set list component (optional optimization)**
  ```
  Files: NEW src/components/dashboard/today-set-list.tsx OR inline in Dashboard.tsx
  Approach: Simplified version of GroupedSetHistory (no date grouping needed)
  Success: Shows today's sets with repeat/delete actions, cleaner than full history
  Test: Visual test, action test (repeat, delete)
  Module: Single responsibility (today's sets display), simpler than GroupedSetHistory
  Optional: Can reuse GroupedSetHistory if filtering works well
  Time: 45min (SKIP if GroupedSetHistory works with filtered data)

  Decision Point: Test GroupedSetHistory with filtered todaysSets first.
  If layout looks good (only one date group), skip this task.
  If layout awkward (shows "TODAY" redundantly), create dedicated component.

  Implementation (if needed):
  - Similar to SetCard component
  - Map over todaysSets, render each set
  - Actions: Repeat (calls formRef.current?.repeatSet), Delete (calls handleDeleteSet)
  - Layout: Terminal table or card list
  - No date grouping (all sets are today)

  Test Strategy:
  - Manual: Log multiple sets today, verify display
  - Actions: Repeat set (form populates), delete set (undo toast appears)
  ```

## Phase 2: Polish & Hardening (3-4 hours)

### Module 8: Loading States

- [ ] **Add loading skeletons to all pages**
  ```
  Files:
  - src/app/page.tsx (dashboard loading)
  - src/app/history/page.tsx (history loading)
  - src/app/settings/page.tsx (settings loading)
  Approach: Follow existing skeleton pattern in Dashboard.tsx:95-130
  Success: Smooth loading states, no layout shift, matches final dimensions
  Test: Throttle network (DevTools), verify skeletons appear
  Module: UI polish (no business logic), reuses terminal aesthetic
  Time: 1h

  Implementation:
  - Dashboard: Already has skeleton (verify matches new layout)
  - History: Copy GroupedSetHistory structure, replace with bg-terminal-bgSecondary
  - Settings: Exercise list skeleton (table rows with animate-pulse)
  - Match dimensions: Use same height/padding as final components
  - Terminal aesthetic: border-terminal-border, bg-terminal-bg

  Test Strategy:
  - DevTools: Throttle to Slow 3G, verify loading states
  - Layout shift: Measure CLS (Cumulative Layout Shift) - should be 0
  ```

- [ ] **Add empty states with CTAs**
  ```
  Files:
  - src/app/page.tsx (no sets today)
  - src/app/history/page.tsx (no history)
  - src/app/settings/page.tsx (no exercises)
  Approach: Follow existing empty state in DailyStatsCard:131-139
  Success: Friendly messages, clear next actions, terminal aesthetic
  Test: Delete all data, verify empty states show, test CTAs
  Module: UI polish (guides users), no complex logic
  Time: 30min

  Implementation:
  - Dashboard empty: "No sets today - Let's go! 💪" (already exists in DailyStatsCard)
  - History empty: "No workout history yet. Log your first set!" + link to dashboard
  - Settings empty: "No exercises yet. Create one in the dashboard." + link
  - Terminal aesthetic: text-terminal-textSecondary, TerminalPanel wrapper
  - CTAs: Use Link from next/link, styled as terminal buttons

  Test Strategy:
  - Fresh account: Sign up, verify all empty states show
  - CTAs: Click links, verify navigation works
  ```

### Module 9: Error Handling

- [ ] **Add error boundaries to pages**
  ```
  Files:
  - NEW src/app/error.tsx (global error boundary)
  - NEW src/app/history/error.tsx (history error boundary)
  - NEW src/app/settings/error.tsx (settings error boundary)
  Approach: Follow Next.js 15 error boundary pattern (use client, error + reset props)
  Success: Errors caught, friendly message, retry button works
  Test: Simulate errors (break query, network offline), verify recovery
  Module: Error containment (prevents full app crash), recovery mechanism
  Time: 45min

  Implementation:
  - "use client" directive (error boundaries must be client components)
  - export default function Error({ error, reset }: { error: Error; reset: () => void })
  - Display: TerminalPanel with error message (sanitize error.message)
  - Retry button: onClick={reset}, terminal button styling
  - Fallback: "Something went wrong. Please try again."
  - Log errors: console.error (or future: send to error tracking)

  Test Strategy:
  - Break query: Change api.sets.listSets to api.sets.invalidQuery
  - Network offline: DevTools offline mode
  - Verify: Error boundary catches, retry works
  ```

### Module 10: Testing Infrastructure

- [ ] **Add unit tests for date utilities**
  ```
  Files: NEW src/lib/date-utils.test.ts
  Approach: Follow Vitest pattern (describe/it/expect), mock Intl API
  Success: 100% coverage for getTodayRange(), edge cases covered
  Test: pnpm test passes, coverage report shows date-utils
  Module: Test suite (ensures correctness), catches regressions
  Time: 45min

  Implementation:
  - Import { describe, it, expect, vi } from 'vitest'
  - Import { getTodayRange } from './date-utils'
  - Test 1: Normal day (noon PST) → verify midnight boundaries
  - Test 2: Near midnight (11:59 PM) → verify boundaries
  - Test 3: Different timezone (UTC, EST) → mock Intl.DateTimeFormat
  - Test 4: DST transition (date-fns handles, verify no errors)
  - Mock Intl API: vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue(...)

  Test Strategy:
  - Run: pnpm test date-utils
  - Coverage: pnpm test:coverage (should show 100% for date-utils.ts)
  - CI: Ensure tests run in CI pipeline (GitHub Actions)
  ```

## Design Iteration Checkpoints

**After Module 7 (Dashboard Refactor)**:
- Review: Are component boundaries clear? Is Dashboard.tsx ~80 lines?
- Extract: Any repeated patterns (set filtering, stats calculation)?
- Refactor: Consider extracting custom hooks (useTodaysSets, useDailyStats)

**After Phase 2 Complete**:
- Review: Navigation UX (mobile vs desktop)
- Measure: Page load times (Lighthouse), bundle sizes
- Identify: Any tight coupling between pages?
- Plan: Future enhancements (filters, search, analytics)

## Validation Checklist

Before marking complete:
- [ ] All 3 pages render correctly (/, /history, /settings)
- [ ] Bottom nav works on mobile (active state, touch targets)
- [ ] Top nav works on desktop (active state, responsive)
- [ ] Today's sets filter correctly (midnight to midnight)
- [ ] History pagination works (20-30 items, load more)
- [ ] Exercise manager in settings (create, edit, delete)
- [ ] iOS safe areas work (test in Safari simulator)
- [ ] Loading states smooth (no layout shift)
- [ ] Empty states show with CTAs
- [ ] Error boundaries catch failures
- [ ] Tests pass (pnpm test, pnpm typecheck, pnpm lint)
- [ ] No regressions (quick log, undo, stats calculations)

## Build Commands

- **Dev**: `pnpm dev` (Next.js + Turbopack)
- **Convex**: `pnpm convex dev` (run in separate terminal)
- **Type Check**: `pnpm typecheck` (run before commit)
- **Lint**: `pnpm lint` (ESLint, fixes automatically via lint-staged)
- **Test**: `pnpm test` (Vitest watch mode)
- **Test Coverage**: `pnpm test:coverage` (verify date utils)

## Dependencies to Add

- [ ] `date-fns` - Timezone-aware date calculations (Module 1)

## Notes

- **Parallelization**: Modules 1-4 can be built in parallel (no dependencies)
- **Critical Path**: Module 1 → Module 7 (dashboard needs date utils)
- **Risk**: iOS safe area testing (need iOS device or simulator)
- **Simplification**: GroupedSetHistory may work for today's sets (avoid creating new component)
- **Future**: Consider extracting custom hooks (useTodaysSets, usePaginatedSets)
