# TODO: Unified Dashboard UX Redesign (v1.1)

## Context

**Approach:** Single-page dashboard consolidating logging, history, and stats with zero navigation required. Mobile-first responsive design with inline exercise creation and smart defaults.

**Key Files:**
- `src/app/page.tsx` - Complete rewrite: unified dashboard page
- `src/components/dashboard/*.tsx` - New component directory for all dashboard components
- `src/components/layout/nav.tsx` - Update navigation (Phase 3)
- `src/app/history/page.tsx` - Delete in Phase 3
- `src/app/log/page.tsx` - Delete in Phase 3

**Patterns to Follow:**
- Form state: `useState` for inputs, refs for auto-focus (see `src/components/sets/log-set-form.tsx`)
- Convex integration: `useQuery` for data fetching, `useMutation` for actions (existing pattern)
- Styling: Tailwind utility classes, dark mode with `dark:` prefix
- Component structure: Controlled components with props interfaces

**Dependencies:**
- lucide-react (installed) - ChevronDown, RotateCcw, Trash2, CheckCircle icons
- Convex queries/mutations (existing) - no backend changes needed
- Existing Tailwind config - will extend with animations in Phase 3

**Critical Path:** Phase 1 (core dashboard) → Phase 2 (smart features) → Phase 3 (cleanup)

---

## Tenet Integration Plan

**🎯 Modularity:**
- Clear component boundaries: DailyStatsCard, QuickLogForm, GroupedSetHistory, SetCard, InlineExerciseCreator, UndoToast
- Single responsibility per component: stats display, form logic, history display, etc.
- Minimal coupling: Parent page fetches data, children receive props
- Interface contracts: TypeScript interfaces for all props

**🎯 Testability:**
- Props-based components (no direct Convex queries in children)
- Pure functions for data transformations (stats calculation, set grouping)
- Controlled form components (testable with mock handlers)
- Test strategy: Start with manual testing, add unit tests for utilities in Phase 4 (future)

**🎯 Design Evolution:**
- Iteration checkpoints:
  - After Phase 1: Review component interfaces, extract emerging patterns
  - After Phase 2: Review auto-focus flow, optimize form UX
  - After Phase 3: Performance audit, identify refactoring opportunities
- Assumptions to validate:
  - Client-side stats calculation is fast enough (< 100ms for 100+ sets)
  - Exercise selector doesn't need search until users have 20+ exercises
  - Inline exercise creation is discoverable enough

**🎯 Automation:**
- Quality gates (already automated): `pnpm lint`, `pnpm typecheck`, `pnpm build`
- Manual validation steps in Phase 3 (not TODO tasks - developer knows to run these)
- Future: Add Playwright E2E tests for critical path (BACKLOG.md)

**🎯 Binding Compliance:**
- hex-domain-purity: Pure functions for stats/grouping logic, UI separate from business logic
- component-isolation: Each component independently developable with clear interfaces
- automated-quality-gates: All commits pass lint/typecheck/build before merge
- code-size: Components stay focused (< 200 lines each), extract utilities if needed

---

## Phase 1: Core Dashboard [4-5 hours]

**Goal:** Functional unified dashboard with feature parity to current app.

- [x] Create dashboard component directory structure
  ```
  Files: src/components/dashboard/ (new directory)

  🎯 MODULARITY: Organize by feature, clear naming convention

  Approach: Create src/components/dashboard/ directory for all new components
  Success: Directory exists and is ready for components
  Time: 2 minutes
  ```

- [x] Implement DailyStatsCard component
  ```
  Files: src/components/dashboard/daily-stats-card.tsx (new)

  🎯 MODULARITY: Single responsibility - display stats, no mutations
  🎯 TESTABILITY: Pure presentational component, props-based

  Approach: Collapsible card component following TASK.md spec (line 530-610)
  - Props: stats object (totalSets, totalReps, totalVolume, exercisesWorked), expanded bool, onToggle callback
  - Use ChevronDown icon from lucide-react
  - Gradient background (blue-purple), grid layout for stats
  - Handle null stats (empty state)

  Success: Component renders, toggles expand/collapse, shows all 4 stats correctly, empty state works
  Time: 30 minutes
  ```

- [ ] Implement SetCard component
  ```
  Files: src/components/dashboard/set-card.tsx (new)

  🎯 MODULARITY: Presentational only, actions via callbacks
  🎯 TESTABILITY: Props-based, no side effects

  Approach: Individual set display card following TASK.md spec (line 1130-1180)
  - Props: set object, exercise object (optional), onRepeat callback, onDelete callback
  - Use RotateCcw and Trash2 icons from lucide-react
  - Relative time formatting ("2h ago", "Just now", "Yesterday at 3pm")
  - Confirm dialog on delete
  - Hover states for action buttons

  Success: Displays set info, formats time correctly, repeat/delete buttons work, looks good in dark mode
  Time: 45 minutes
  ```

- [ ] Implement GroupedSetHistory component
  ```
  Files: src/components/dashboard/grouped-set-history.tsx (new)

  🎯 MODULARITY: Container for SetCard components, handles grouping display
  🎯 TESTABILITY: Receives pre-grouped data as props

  Approach: Day-grouped set list following TASK.md spec (line 1020-1070)
  - Props: groupedSets array (date, displayDate, sets[]), exercises array, onRepeat callback, onDelete callback
  - Map over groups, render day headers with emoji 📅
  - Render SetCard for each set in group
  - Empty state: Friendly message with 💪 emoji

  Success: Groups display correctly, day labels format nicely, empty state shows, actions work
  Time: 30 minutes
  ```

- [ ] Implement QuickLogForm component (basic version, no smart features)
  ```
  Files: src/components/dashboard/quick-log-form.tsx (new)

  🎯 MODULARITY: Form logic isolated, controlled inputs
  🎯 TESTABILITY: Callbacks for mutations, form state testable

  Approach: Logging form following TASK.md spec (line 640-800), Phase 1 features only
  - Props: exercises array, onSetLogged callback (optional)
  - State: selectedExerciseId, reps, weight, isSubmitting
  - Use Convex useMutation for logSet
  - Validation: required exercise/reps, reps > 0
  - inputMode="numeric" pattern="[0-9]*" for mobile keyboards
  - Clear form after successful submit (keep exercise selected)
  - Basic error handling with alert

  Phase 1 excludes:
  - Inline exercise creator (Phase 2)
  - Repeat last button (Phase 2)
  - Auto-focus flow (Phase 2)
  - Undo toast (Phase 2)
  - Exercise sorting by recency (Phase 2)

  Success: Form submits, mutation succeeds, form clears, validation works, mobile numeric keyboard appears
  Time: 1 hour
  ```

- [ ] Add client-side data transformation utilities
  ```
  Files: src/lib/dashboard-utils.ts (new)

  🎯 MODULARITY: Pure functions, no side effects
  🎯 TESTABILITY: Easy to unit test with sample data
  🎯 BINDING COMPLIANCE: hex-domain-purity - business logic separate from UI

  Approach: Extract pure functions for reuse following TASK.md spec (line 195-255)
  - calculateDailyStats(sets): Filters today's sets, calculates totals
  - groupSetsByDay(sets): Groups into Map<dateString, sets[]>, sorts by date
  - formatDateGroup(dateString): Returns "Today", "Yesterday", or formatted date
  - formatRelativeTime(timestamp): Returns "2h ago", "Just now", etc.

  Success: Functions work correctly, handle edge cases (empty arrays, null), pure (no mutations)
  Time: 30 minutes
  ```

- [ ] Rewrite home page with unified dashboard
  ```
  Files: src/app/page.tsx (complete rewrite)

  🎯 MODULARITY: Page orchestrates components, doesn't implement logic
  🎯 TESTABILITY: Data fetching layer separate from presentation

  Approach: Unified dashboard page following TASK.md architecture (line 125-170)
  - Use Convex useQuery for sets and exercises
  - Use useMemo for dailyStats calculation (from dashboard-utils)
  - Use useMemo for groupedSets (from dashboard-utils)
  - State: statsExpanded (boolean, default true)
  - Render: DailyStatsCard → QuickLogForm → GroupedSetHistory
  - Handle loading states (undefined queries)
  - Handle delete set (useMutation, pass to GroupedSetHistory)
  - Handle repeat set (callback to pre-fill form) - Phase 2

  Layout:
  - Max-width container (max-w-4xl)
  - Vertical spacing (mb-6 between sections)
  - Mobile padding (px-4), responsive (sm:px-6 lg:px-8)

  Success: Page loads, data fetches, components render, stats calculate correctly, can log sets and see them appear
  Time: 1 hour
  ```

---

## Phase 2: Smart Features [3-4 hours]

**Goal:** Add delightful interactions and smart defaults.

- [ ] Implement InlineExerciseCreator component
  ```
  Files: src/components/dashboard/inline-exercise-creator.tsx (new)

  🎯 MODULARITY: Self-contained inline form, clear interface
  🎯 TESTABILITY: Controlled component with callbacks

  Approach: Inline exercise creation following TASK.md spec (line 865-925)
  - Props: onCreated(exerciseId) callback, onCancel callback
  - State: name, isCreating
  - Use Convex useMutation for createExercise
  - Auto-focus name input on mount (useEffect + ref)
  - Enter to submit, Escape to cancel (onKeyDown handlers)
  - Blue background to distinguish from main form
  - Horizontal layout: [input] [Create] [Cancel]

  Success: Creates exercise, calls onCreated with ID, auto-focuses input, keyboard shortcuts work
  Time: 30 minutes
  ```

- [ ] Add inline exercise creator to QuickLogForm
  ```
  Files: src/components/dashboard/quick-log-form.tsx (modify)

  🎯 DESIGN EVOLUTION: Iterate on form UX based on Phase 1 learnings

  Approach: Integrate InlineExerciseCreator following TASK.md spec (line 725-770)
  - Add state: showInlineCreator (boolean)
  - Add "CREATE_NEW" option to exercise dropdown (with separator)
  - onChange: if value === "CREATE_NEW", set showInlineCreator = true
  - Conditionally render InlineExerciseCreator component below dropdown
  - onCreated: setSelectedExerciseId(newId), hide creator, focus reps
  - onCancel: hide creator

  Success: Dropdown has "+ Create new exercise" option, clicking shows inline form, creating works, focus flows correctly
  Time: 30 minutes
  ```

- [ ] Implement "Repeat Last Set" functionality
  ```
  Files: src/components/dashboard/quick-log-form.tsx (modify), src/app/page.tsx (modify)

  🎯 MODULARITY: Clear data flow from parent to form

  Approach: Pre-fill form from set data
  - Add prop to QuickLogForm: onRepeatRequest (optional callback to get last set)
  - Add "Repeat Last" button to form (next to Log Set button)
  - Button enabled only if last set exists for selected exercise
  - onClick: Pre-fill reps and weight from last set
  - Auto-focus reps input for quick edit

  In page.tsx:
  - Track lastLoggedSet state
  - Pass to QuickLogForm
  - Also wire up onRepeat from SetCard → pre-fills from specific set

  Success: Repeat button pre-fills form correctly, works from both button and set cards, focus flows to reps
  Time: 45 minutes
  ```

- [ ] Add auto-focus flow to QuickLogForm
  ```
  Files: src/components/dashboard/quick-log-form.tsx (modify)

  🎯 DESIGN EVOLUTION: Optimize keyboard/mobile flow based on testing

  Approach: Intelligent auto-focus following TASK.md spec (line 688-707)
  - Add refs: exerciseRef, repsRef, weightRef
  - useEffect: When selectedExerciseId changes → focus reps
  - handleRepsKeyDown: Enter → focus weight (or submit if weight empty)
  - handleWeightKeyDown: Enter → submit form
  - After submit success → focus exercise selector (for quick re-logging)

  Success: Selecting exercise focuses reps, Enter in reps focuses weight, Enter in weight submits, flow feels natural
  Time: 30 minutes
  ```

- [ ] Implement UndoToast component
  ```
  Files: src/components/dashboard/undo-toast.tsx (new)

  🎯 MODULARITY: Self-contained toast with timer logic
  🎯 TESTABILITY: Props-based, timer testable with fake timers

  Approach: Success toast with undo following TASK.md spec (line 1190-1230)
  - Props: visible (boolean), onUndo callback, onDismiss callback
  - useEffect: Auto-dismiss after 3 seconds when visible
  - Fixed position bottom-right (md breakpoint), full-width on mobile
  - Green background, CheckCircle icon from lucide-react
  - Slide-up animation (will add animation to Tailwind in Phase 3)
  - Portal rendering? (use React.createPortal if needed)

  Success: Toast appears after logging, auto-dismisses after 3s, undo button works, looks good on mobile
  Time: 30 minutes
  ```

- [ ] Wire up UndoToast in home page
  ```
  Files: src/app/page.tsx (modify)

  🎯 AUTOMATION: Implement optimistic UI pattern for instant feedback

  Approach: Show toast after successful set logging
  - State: undoToastVisible, lastLoggedSetId
  - After logSet success: show toast, store setId
  - onUndo: Call deleteSet mutation, hide toast
  - onDismiss: Hide toast, clear setId

  Success: Toast shows after logging, undo deletes the set, auto-dismiss works
  Time: 20 minutes
  ```

- [ ] Add exercise sorting by recency
  ```
  Files: src/app/page.tsx (modify)

  🎯 DESIGN EVOLUTION: Smart defaults based on usage patterns

  Approach: Sort exercises by last usage following TASK.md spec (line 234-255)
  - Use useMemo: exercisesByRecency
  - Build Map of exerciseId → last used timestamp from sets
  - Sort: most recently used first, then alphabetical
  - Pass exercisesByRecency to QuickLogForm instead of exercises

  Success: Most recent exercises appear first in dropdown, unused exercises at bottom alphabetically
  Time: 20 minutes
  ```

---

## Phase 3: Polish & Cleanup [2-3 hours]

**Goal:** Remove old code, add animations, final polish.

- [ ] Add slide-up animation to Tailwind config
  ```
  Files: tailwind.config.ts (modify)

  🎯 AUTOMATION: Reusable animation utilities

  Approach: Add keyframes and animation following TASK.md pattern (line 1220-1230)
  - Add to theme.extend.keyframes: "slide-up" (translateY 100% → 0, opacity 0 → 1)
  - Add to theme.extend.animation: "slide-up": "slide-up 0.2s ease-out"
  - Apply to UndoToast component

  Success: Toast slides up smoothly when appearing
  Time: 10 minutes
  ```

- [ ] Add expand/collapse animation to DailyStatsCard
  ```
  Files: src/components/dashboard/daily-stats-card.tsx (modify)

  Approach: Smooth height transition
  - Add transition-all duration-200 to content div
  - Ensure overflow-hidden during transition
  - Test on mobile and desktop

  Success: Stats expand/collapse smoothly without layout jump
  Time: 15 minutes
  ```

- [ ] Delete old history page
  ```
  Files: src/app/history/page.tsx (delete)

  Approach: Remove file entirely
  Success: File deleted, no references remain
  Time: 2 minutes
  ```

- [ ] Delete old log page
  ```
  Files: src/app/log/page.tsx (delete)

  Approach: Remove file entirely
  Success: File deleted, no references remain
  Time: 2 minutes
  ```

- [ ] Delete old form components
  ```
  Files: src/components/sets/log-set-form.tsx (delete), src/components/sets/set-list.tsx (delete)

  Approach: Remove replaced components
  Success: Files deleted, replaced by dashboard components
  Time: 2 minutes
  ```

- [ ] Update navigation to remove old links
  ```
  Files: src/components/layout/nav.tsx (modify)

  🎯 MODULARITY: Clean interface, no dead links

  Approach: Update links array
  - Remove "Log Set" link
  - Remove "History" link
  - Keep "Home" and "Exercises" only
  - Test on mobile and desktop

  Success: Navigation shows only Home and Exercises, no 404s
  Time: 10 minutes
  ```

- [ ] Add loading skeletons for initial load
  ```
  Files: src/components/dashboard/loading-skeletons.tsx (new), src/app/page.tsx (modify)

  🎯 DESIGN EVOLUTION: Better perceived performance

  Approach: Skeleton components for loading states
  - Create SetCardSkeleton: Animated gray blocks matching SetCard layout
  - Create StatsCardSkeleton: Animated blocks matching stats layout
  - In page.tsx: Show skeletons when queries are undefined
  - Use animate-pulse from Tailwind

  Success: Skeletons show during load, no layout shift when data arrives, smooth transition
  Time: 30 minutes
  ```

- [ ] Add empty state for no exercises
  ```
  Files: src/app/page.tsx (modify)

  🎯 DESIGN EVOLUTION: Better first-run experience

  Approach: Detect empty exercises array, show friendly prompt
  - If exercises.length === 0: Hide form, show creation prompt
  - Large 💪 emoji, heading "No exercises yet"
  - Prominent "+ Create your first exercise" button → shows InlineExerciseCreator

  Success: Empty state looks good, guides user to create first exercise
  Time: 20 minutes
  ```

- [ ] Manual cross-browser and responsive testing
  ```
  Context: This is a validation step, not a TODO task. Listed for completeness.

  Test in: Chrome, Safari, Firefox
  Test on: Desktop (>1024px), tablet (640-1024px), mobile (<640px)
  Test: All interactions, dark mode, keyboard nav, touch targets

  See TASK.md line 1515-1550 for full checklist.
  ```

---

## Quality Validation (Reference - Not TODO Tasks)

**Before commits:**
- Run `pnpm typecheck` - TypeScript compiles without errors
- Run `pnpm lint` - ESLint passes
- Run `pnpm build` - Production build succeeds
- Manual smoke test - Core workflow works (log a set, see it appear)

**🎯 Tenet Compliance:**
- **Modularity:** Each component has single responsibility, clear interface
- **Testability:** Components are props-based, data transformations are pure functions
- **Design Evolution:** Refactoring opportunities documented in code comments
- **Automation:** Quality gates run automatically (lint, typecheck, build)
- **Binding Compliance:**
  - hex-domain-purity ✓ (pure utils in lib/, UI separate)
  - component-isolation ✓ (props-based, independently testable)
  - automated-quality-gates ✓ (pnpm scripts)
  - code-size ✓ (components stay focused, < 200 lines)

**Metrics to Track:**
- Bundle size: Should stay < 120 kB (currently ~105 kB)
- Component sizes: Each < 200 lines (extract if larger)
- Zero circular dependencies
- TypeScript strict mode: No errors

---

## Design Iteration Checkpoints

**🎯 DESIGN NEVER DONE** - Schedule reviews after each phase:

**After Phase 1:**
- Review component interfaces - are props clean and minimal?
- Check for code duplication - extract common patterns?
- Validate data flow - is parent-child relationship clear?
- Test on real mobile device - any UX issues?

**After Phase 2:**
- Review auto-focus flow - does it feel natural or annoying?
- Check exercise sorting - is recency useful or confusing?
- Validate inline creator - is it discoverable enough?
- Test repeat functionality - works as expected?

**After Phase 3:**
- Performance audit - any slow renders? (React DevTools Profiler)
- Bundle size check - under 120 kB?
- Accessibility audit - keyboard nav works? Screen reader friendly?
- Identify technical debt - document in code comments for future

---

## Next Steps After TODO.md Complete

1. Run `/execute` to start Phase 1 implementation
2. After Phase 1: Manual testing, review, iterate
3. After Phase 2: More testing, refine UX
4. After Phase 3: Create PR with `/git-pr`

---

## BACKLOG: Future Enhancements (Not Part of v1.1)

*True future work that's not required for v1.1 - see BACKLOG.md for details*

### Nice-to-Have Improvements (Post-v1.1)
- **Swipe to delete** on mobile set cards (effort: 2h, priority: low)
- **Pull to refresh** gesture (effort: 1h, priority: low)
- **Keyboard shortcuts** Cmd+K to focus exercise selector (effort: 1h, priority: low)
- **Persist stats collapsed state** to localStorage (effort: 30min, priority: low)

### Testing & Quality (Phase 4)
- **Unit tests** for dashboard-utils.ts functions (effort: 2h, priority: medium)
- **E2E tests** with Playwright for critical path (effort: 4h, priority: medium)
- **Accessibility audit** with axe-core (effort: 2h, priority: medium)
- **Performance monitoring** setup (effort: 2h, priority: low)

### Advanced Features (v1.2+)
- **Charts & visualizations** for progress over time (effort: 1 week, priority: medium)
- **Personal records** tracking and celebration (effort: 3 days, priority: medium)
- **Workout sessions** grouping sets together (effort: 1 week, priority: low)
- **Progressive Web App** full implementation (effort: 1 week, priority: low)

See BACKLOG.md for complete list and prioritization.

---

**Total Estimated Time:** 9-12 hours across all 3 phases
**Critical Path:** Phase 1 (4-5h) → Phase 2 (3-4h) → Phase 3 (2-3h)
**Target Completion:** 2-3 days with breaks and testing
