# TODO: Quality Infrastructure

_Generated from quality infrastructure audit - 2025-10-12_

## CRITICAL - Continuous Integration (blocks quality enforcement)

- [x] Create `.github/workflows/ci.yml` with automated quality checks
  - Run on: push to any branch, all pull requests
  - Jobs: install dependencies → typecheck → lint → test → build
  - Use `pnpm` as package manager (current setup)
  - Run tests with `pnpm test --run` (currently 51 tests pass in 1.4s)
  - Success criteria: Workflow fails if any step exits non-zero
  - Cache node_modules for faster runs (GitHub Actions cache)

- [x] Add coverage reporting to Vitest config (`vitest.config.ts`)
  - Enable coverage collection with `@vitest/coverage-v8` provider
  - Set thresholds: 70% lines, 70% functions, 70% branches
  - Exclude test files, generated code (`convex/_generated/**`)
  - Output formats: text summary (for CI logs), html (for local review)
  - Success criteria: `pnpm test:coverage` fails if below threshold

- [x] Create `.github/dependabot.yml` for automated dependency updates
  - Monitor npm dependencies weekly
  - Monitor GitHub Actions monthly
  - Auto-create PRs for security updates
  - Group minor/patch updates to reduce PR noise
  - Success criteria: Dependabot runs weekly, creates PRs for outdated deps

## HIGH - Test Coverage (253 untested lines in dashboard-utils.ts)

- [x] Create `src/lib/dashboard-utils.test.ts` for weight conversion and stats
  - Test `convertWeight()`: lbs→kg, kg→lbs, edge cases (0, negative, very large)
  - Verify conversion factor accuracy: 2.20462 lbs per kg (test 100kg = 220.46lbs)
  - Test `normalizeWeightUnit()`: valid units ("lbs", "kg"), invalid inputs
  - Test `calculateDailyStats()`: filters to today only, sums volume correctly
  - Test mixed units: sets with lbs + kg correctly normalized to common unit
  - Test edge cases: empty input returns null, sets without weight handled
  - Test `groupSetsByDay()`: groups by calendar day, sorts newest first
  - Test `sortExercisesByRecency()`: orders by most recent set timestamp
  - Success criteria: 100% coverage of dashboard-utils.ts functions

- [x] Create `src/lib/error-handler.test.ts` for production vs dev logging
  - Mock `process.env.NODE_ENV` (use vitest `vi.stubEnv()`)
  - Test production mode: logs sanitized message only (no stack traces)
  - Test development mode: logs full error object with stack trace
  - Test `getUserFriendlyMessage()`: maps error types correctly
    - Auth errors → "Please sign in again"
    - Not found → "Could not find [resource]"
    - Generic errors → "Something went wrong"
  - Success criteria: Validates security behavior (no info disclosure in prod)

- [x] Create `src/components/dashboard/quick-log-form.test.tsx` for critical UI paths
  - Test form state: reps field accepts integers only, weight accepts decimals
  - Test validation: empty reps shows error, invalid exercise ID prevented
  - Test last set display: shows correct "X MIN AGO" formatting
  - Test "USE" button: populates form with last set's reps/weight
  - Test mutation calls: `logSet` called with correct params on submit
  - Mock Convex hooks (`useQuery`, `useMutation`) with vitest
  - Success criteria: Core logging flow validated end-to-end

  ```
  Approach (based on exercise-manager.test.tsx patterns):
  1. Mock Convex hooks: useQuery (returns sets), useMutation (logSet)
  2. Mock WeightUnitContext provider (unit + toggleUnit)
  3. Mock localStorage for TerminalPanel collapse state
  4. Mock toast.success and handleMutationError
  5. Use vi.useFakeTimers() for formatTimeAgo testing (follow date-utils.test.ts pattern)
  6. Test form state with fireEvent.change on controlled inputs
  7. Test async submission with waitFor (action BEFORE waitFor, assert AFTER)
  8. Test keyboard navigation: Enter in reps → weight, Enter in weight → submit

  Files referenced:
  - Component: src/components/dashboard/quick-log-form.tsx:1-332
  - Pattern: src/components/dashboard/exercise-manager.test.tsx:12-22 (Convex mock)
  - Pattern: src/lib/date-utils.test.ts (fake timers for relative timestamps)
  - Context: src/contexts/WeightUnitContext.tsx (need to mock provider)

  Modularity:
  - Components to test independently:
    1. Form state management (controlled inputs: exercise, reps, weight)
    2. Validation logic (submit button disabled states)
    3. Last set indicator (query data display + formatTimeAgo)
    4. USE button (populate form from last set)
    5. Keyboard navigation (Enter key handlers)
    6. Async submission (loading state, success/error handling)
    7. Unit toggle interaction
  - Parallelizable: Can test validation, time formatting, and input handling separately
  - Dependencies: WeightUnitContext, Convex hooks, toast, error handler

  Test Strategy:
  - Unit tests for all form interactions (~20-25 tests)
    1. Rendering: form elements present, exercise dropdown populated
    2. Form state: controlled inputs update on change
    3. Validation: submit disabled when exercise/reps missing
    4. Last set display: shows/hides based on selection, correct format
    5. USE button: populates reps + weight from last set
    6. Submission: calls logSet with correct params (with/without weight)
    7. Loading state: button disabled + text changes during submit
    8. Error handling: calls handleMutationError on failure
    9. Success flow: clears reps/weight, shows toast, keeps exercise selected
    10. Keyboard nav: Enter key flows (reps→weight→submit)
    11. Unit toggle: switches between lbs/kg
  - Edge cases:
    * No exercises available (empty state)
    * No last set for selected exercise
    * Submit without weight (optional field, weight + unit undefined)
    * Time formatting edge cases (0 sec, 59 sec, 1 min, 59 min, 1 hr, 23 hr, 1 day, 7+ days)
    * Decimal weight values (step="0.5")
  - Coverage target: 100% of form logic (exclude focus management - mobile-specific)

  Automation: None needed (one-time test suite)

  Success criteria (binary pass/fail):
  - [ ] All form inputs render and accept correct input types
  - [ ] Submit button disabled/enabled based on validation rules
  - [ ] Last set indicator displays correct exercise data + relative time
  - [ ] USE button correctly populates form with last set values
  - [ ] logSet mutation called with exact params (exercise, reps, weight?, unit?)
  - [ ] Loading state shows "LOGGING..." and disables button during submit
  - [ ] Success clears reps + weight (keeps exercise), shows toast
  - [ ] Error calls handleMutationError with context "Log Set"
  - [ ] Enter key navigation: reps→weight→submit (3 separate tests)
  - [ ] Unit toggle switches between lbs/kg correctly
  - [ ] Edge cases: no exercises, no last set, optional weight
  - [ ] All tests pass in <1s (async operations properly awaited)

  Constraints:
  - Must mock WeightUnitContext (component depends on it)
  - Must mock localStorage (TerminalPanel uses it for collapse state)
  - Cannot test focus management (useRef + requestAnimationFrame not testable)
  - Cannot test InlineExerciseCreator (would require additional complex mocking)
  - Time tests require fake timers (vi.useFakeTimers + vi.setSystemTime)

  Complexity: COMPLEX (most complex component test - multiple contexts, async, time-based UI)
  Time: 2-3h (20-25 tests, multiple mocking layers, keyboard event testing)
  ```

- [x] Create `src/components/dashboard/exercise-manager.test.tsx` for CRUD operations
  - Test create exercise: form submission calls `createExercise` mutation
  - Test delete exercise: confirmation → calls `deleteExercise` (soft delete)
  - Test update exercise: inline edit mode saves new name
  - Test error handling: mutation errors display user-friendly messages
  - Mock Convex mutations and verify correct args passed
  - Success criteria: All CRUD operations validated

## MEDIUM - Developer Tooling

- [x] Create `.prettierrc.json` with code formatting rules
  - Base config: semi: true, singleQuote: false, tabWidth: 2
  - Match ESLint settings from `.eslintrc.json` (avoid conflicts)
  - Add `.prettierignore`: ignore generated files, build output, node_modules
  - Success criteria: `pnpm prettier --check .` passes on existing code (or autofix)

- [x] Add Prettier to `package.json` scripts and lint-staged
  - Add devDependency: `prettier` (latest stable)
  - Add script: `"format": "prettier --write ."`
  - Add script: `"format:check": "prettier --check ."`
  - Update `lint-staged` config: run prettier before ESLint
  - Success criteria: Pre-commit hook formats code automatically

- [x] Add bundle analyzer to Next.js config (`next.config.ts`)
  - Install `@next/bundle-analyzer` as devDependency
  - Wrap Next.js config with analyzer: `withBundleAnalyzer(nextConfig)`
  - Enable only when `ANALYZE=true` env var set
  - Add package.json script: `"analyze": "ANALYZE=true pnpm build"`
  - Success criteria: `pnpm analyze` generates bundle size report

- [x] Add PR checklist template (`.github/pull_request_template.md`)
  - Checklist items: tests added/updated, types updated if needed
  - Link to CI status badge (auto-populated by GitHub)
  - Prompt for testing notes (manual testing performed)
  - Success criteria: All new PRs include checklist by default

## Future Enhancements → See BACKLOG.md

The following were identified but deferred to BACKLOG.md as non-critical:

- Bundle size regression tracking (Lighthouse CI integration)
- Import sorting automation (trivial-import-sort plugin)
- Git commit message linting (commitlint + husky)
- Component visual regression testing (Chromatic/Percy)
- Pre-commit typecheck (may slow commits, trade-off documented in BACKLOG)

---

**Completion Order**: CRITICAL tasks first (CI pipeline unblocks everything), then HIGH (test coverage), then MEDIUM (developer experience).

**Estimated Total Effort**: ~12 hours

- CRITICAL: 2h (CI setup + coverage config)
- HIGH: 8h (test file creation)
- MEDIUM: 2h (tooling setup)
