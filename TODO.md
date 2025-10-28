# TODO: Code Quality Refactoring - DRY & Module Boundaries

## Context

**Source**: TASK.md - 4 code quality issues identified by multi-agent audit
**Priority**: HIGH - Technical debt accumulation, change amplification risk
**Goal**: Eliminate duplication, improve module boundaries, document magic numbers

### Issues to Address

1. **Time Formatting Duplication** (CRITICAL) - 3 implementations across codebase
2. **Dashboard-utils Temporal Decomposition** (HIGH) - 7 unrelated functions in one file
3. **Magic Numbers Without Documentation** (MEDIUM) - Hardcoded values lacking context
4. ~~Critical Business Logic Untested~~ - **DONE** (632 lines of tests exist)

**Strategy**: Test-safe refactoring with module boundaries prioritized over execution order

**Key Patterns**:

- Follow existing test conventions (vi.useFakeTimers, comprehensive edge cases)
- Maintain backward compatibility during migration
- Domain-driven module organization (not timeline-based)

---

## Implementation Tasks

### Phase 1: Extract Time Formatting Utility (Issue #12)

**Impact**: Eliminates 3 implementations → 1 source of truth
**Files**: useLastSet.ts, set-card.tsx, date-utils.ts (extend existing)
**Tests**: Comprehensive coverage required before migration

- [ ] **Add formatTimeAgo utility to date-utils.ts**

  ```
  Files: src/lib/date-utils.ts:82-120 (after formatTimestamp)
  Approach: Two formats - "terminal" (uppercase) and "compact" (lowercase → HH:MM)
  Success: Function compiles, exports TimeFormat type
  Test: Unit tests validate all time ranges and format branches
  Module: Pure function, no side effects, single responsibility (relative time)
  Time: 30min
  ```

  Implementation:
  - Type: `export type TimeFormat = "terminal" | "compact";`
  - Signature: `formatTimeAgo(timestamp: number, format: TimeFormat = "terminal"): string`
  - Terminal format: "5 SEC AGO" | "3 MIN AGO" | "2 HR AGO" | "5 DAYS AGO"
  - Compact format: "JUST NOW" | "5M AGO" | "3H AGO" | HH:MM (>24h)
  - JSDoc with examples for both formats

- [ ] **Add comprehensive test suite for formatTimeAgo**

  ```
  Files: src/lib/date-utils.test.ts:110-250 (new describe block)
  Approach: Follow existing vi.useFakeTimers pattern from getTodayRange tests
  Success: >95% coverage, all edge cases validated
  Test: Tests ARE the spec for this function
  Module: Validates pure function in isolation
  Time: 45min
  ```

  Test cases:
  - Terminal format: <60s, <60m, <24h, >24h (with singular/plural days)
  - Compact format: <60s (JUST NOW), <60m, <24h, >24h (HH:MM absolute time)
  - Edge cases: 0s, exactly 60s, exactly 60m, exactly 24h
  - Default format is "terminal" when omitted
  - Boundary precision (59s ≠ 60s, 59m ≠ 60m, 23h ≠ 24h)

- [ ] **Migrate useLastSet.ts to use shared utility**

  ```
  Files: src/hooks/useLastSet.ts:1,20-29
  Approach: Import formatTimeAgo, delete inline implementation
  Success: Hook uses shared utility, existing tests pass unchanged
  Test: pnpm test useLastSet.test.ts
  Module: Hook delegates to utility layer (separation of concerns)
  Time: 10min
  ```

  Changes:
  - Line 1: Add `formatTimeAgo` to imports from @/lib/date-utils
  - Lines 20-29: Delete inline formatTimeAgo function
  - Return object: Use imported function (terminal format matches existing)

- [ ] **Migrate set-card.tsx to use shared utility**

  ```
  Files: src/components/dashboard/set-card.tsx:1,51-65,92
  Approach: Import formatTimeAgo with "compact" format
  Success: Component uses shared utility, visual behavior unchanged
  Test: Manual QA - timestamp display matches previous behavior
  Module: Component delegates formatting to utility
  Time: 10min
  ```

  Changes:
  - Line 1: Add `formatTimeAgo` to imports from @/lib/date-utils
  - Lines 51-65: Delete inline formatTime function
  - Line 92: Replace with `formatTimeAgo(set.performedAt, "compact")`
  - Note: Compact format produces "JUST NOW" (was "Just now") - verify UX consistency

---

### Phase 2: Split dashboard-utils.ts by Domain (Issue #8)

**Impact**: Clear module boundaries, improved discoverability, prevents god object
**Current State**: 323 lines, 7 functions, 632 lines of tests (GOOD NEWS: already tested!)
**Strategy**: Split with tests intact, update imports across ~15 call sites

- [ ] **Create weight-utils.ts module**

  ```
  Files: src/lib/weight-utils.ts (NEW), src/lib/weight-utils.test.ts (NEW)
  Approach: Extract convertWeight + normalizeWeightUnit + LBS_PER_KG constant
  Success: Module exports clean API, tests migrated and passing
  Test: Move convertWeight tests from dashboard-utils.test.ts
  Module: Single domain (weight unit conversion), deep module (simple interface)
  Time: 30min
  ```

  Functions to extract:
  - `convertWeight(weight, fromUnit, toUnit)` - lines 12-31
  - `normalizeWeightUnit(unit?)` - lines 39-41 (currently private, make public)
  - Constant: `LBS_PER_KG = 2.20462` with JSDoc (see Issue #10)

  Tests to migrate:
  - Lines 13-38 from dashboard-utils.test.ts → weight-utils.test.ts

- [ ] **Create stats-calculator.ts module**

  ```
  Files: src/lib/stats-calculator.ts (NEW), src/lib/stats-calculator.test.ts (NEW)
  Approach: Extract calculateDailyStats + calculateDailyStatsByExercise
  Success: Module exports stats interfaces, tests migrated
  Test: Move calculateDailyStats* tests from dashboard-utils.test.ts
  Module: Single domain (workout statistics aggregation)
  Time: 30min
  ```

  Functions to extract:
  - `calculateDailyStats(sets, targetUnit)` - lines 67-92
  - `calculateDailyStatsByExercise(sets, exercises, targetUnit)` - lines 171-222
  - Interfaces: `DailyStats`, `ExerciseStats`

  Dependencies: Import convertWeight, normalizeWeightUnit from weight-utils

  Tests to migrate:
  - Lines 40-150 from dashboard-utils.test.ts → stats-calculator.test.ts

- [ ] **Create date-formatters.ts module**

  ```
  Files: src/lib/date-formatters.ts (NEW), src/lib/date-formatters.test.ts (NEW)
  Approach: Extract groupSetsByDay + formatDateGroup
  Success: Module exports grouping utilities, tests migrated
  Test: Move groupSetsByDay + formatDateGroup tests
  Module: Single domain (date grouping and display formatting)
  Time: 30min
  ```

  Functions to extract:
  - `groupSetsByDay(sets)` - lines 101-125
  - `formatDateGroup(dateString)` - lines 137-159

  Tests to migrate:
  - Lines 200-350 from dashboard-utils.test.ts → date-formatters.test.ts

- [ ] **Create exercise-sorting.ts module**

  ```
  Files: src/lib/exercise-sorting.ts (NEW), src/lib/exercise-sorting.test.ts (NEW)
  Approach: Extract sortExercisesByRecency
  Success: Module exports sorting utility, tests migrated
  Test: Move sortExercisesByRecency tests
  Module: Single domain (exercise ordering logic)
  Time: 20min
  ```

  Functions to extract:
  - `sortExercisesByRecency(exercises, sets)` - lines 232-256

  Tests to migrate:
  - Lines 400-500 from dashboard-utils.test.ts → exercise-sorting.test.ts

- [ ] **Create exercise-grouping.ts module**

  ```
  Files: src/lib/exercise-grouping.ts (NEW), src/lib/exercise-grouping.test.ts (NEW)
  Approach: Extract groupSetsByExercise
  Success: Module exports grouping utility with ExerciseGroup interface
  Test: Move groupSetsByExercise tests
  Module: Single domain (exercise-level aggregation for session views)
  Time: 20min
  ```

  Functions to extract:
  - `groupSetsByExercise(sets, targetUnit)` - lines 275-322
  - Interface: `ExerciseGroup`

  Dependencies: Import convertWeight, normalizeWeightUnit from weight-utils

  Tests to migrate:
  - Lines 550-632 from dashboard-utils.test.ts → exercise-grouping.test.ts

- [ ] **Delete dashboard-utils.ts and update imports**

  ```
  Files: dashboard-utils.ts (DELETE), ~15 call sites across components
  Approach: Use ast-grep to find all imports, update to new modules
  Success: All imports updated, pnpm typecheck passes, all tests green
  Test: pnpm test && pnpm typecheck
  Module: Clean module boundaries enforced, no god object
  Time: 45min
  ```

  Find all imports:

  ```bash
  ast-grep --lang typescript -p 'import { $$$ } from "@/lib/dashboard-utils"'
  ```

  Update strategy:
  - Most call sites use 1-2 functions → import from specific module
  - If site uses 3+ functions → may indicate coupling (note for future refactor)

---

### Phase 3: Document Magic Numbers (Issue #10)

**Impact**: Self-documenting code, confident future changes
**Files**: dashboard-utils.ts, undo-toast.tsx, quick-log-form.tsx

- [ ] **Extract LBS_PER_KG constant in weight-utils.ts**

  ```
  Files: src/lib/weight-utils.ts (during Phase 2 creation)
  Approach: Extract to module-level constant with comprehensive JSDoc
  Success: Constant replaces hardcoded 2.20462 in convertWeight
  Test: Existing tests validate accuracy
  Module: Named constant documents conversion factor
  Time: 5min (part of weight-utils creation)
  ```

  Implementation:

  ```typescript
  /**
   * Official conversion factor: 1 kilogram = 2.20462 pounds
   *
   * Rounded to 5 decimal places for UI display accuracy.
   * Source: International System of Units (SI)
   *
   * @example
   * 100 kg × 2.20462 = 220.462 lbs
   * 220 lbs ÷ 2.20462 = 99.79 kg
   */
  export const LBS_PER_KG = 2.20462;
  ```

- [ ] **Extract UNDO_TOAST_DURATION_MS constant**

  ```
  Files: src/components/dashboard/undo-toast.tsx:13-16
  Approach: Module-level constant with rationale comment
  Success: Named constant replaces 3000 magic number
  Test: Manual QA - toast dismisses after 3s
  Module: Self-documenting timing constant
  Time: 5min
  ```

  Implementation:

  ```typescript
  /**
   * Duration to display undo toast before auto-dismissing.
   * 3 seconds provides sufficient time to notice and react,
   * following industry standard for non-critical notifications.
   */
  const UNDO_TOAST_DURATION_MS = 3000;

  // Line 16:
  const timer = setTimeout(onDismiss, UNDO_TOAST_DURATION_MS);
  ```

- [ ] **Extract FOCUS_DELAY_MS constant in quick-log-form.tsx**

  ```
  Files: src/components/dashboard/quick-log-form.tsx:239-243
  Approach: Module-level constant with rationale
  Success: Named constant replaces 50 magic number
  Test: Manual QA - focus works after exercise selection
  Module: Documents timing requirement
  Time: 5min
  ```

  Implementation:

  ```typescript
  /**
   * Delay to ensure DOM updates complete before focusing input.
   * 50ms allows Radix Popover close animation to finish and
   * React to update the DOM with the selected exercise.
   *
   * Note: Could use requestAnimationFrame instead, but fixed
   * delay is more predictable and less complex.
   */
  const FOCUS_DELAY_MS = 50;

  // Line 240:
  setTimeout(() => focusElement(repsInputRef), FOCUS_DELAY_MS);
  ```

- [ ] **Document setTimeout calls in Dashboard.tsx**

  ```
  Files: src/components/dashboard/Dashboard.tsx:110,197
  Approach: Add explanatory comments (no constants needed - zero-delay pattern)
  Success: Code intent is clear to future maintainers
  Test: No functional change, comments improve clarity
  Module: Self-documenting code
  Time: 5min
  ```

  Line 110:

  ```typescript
  // Zero-delay setTimeout ensures scroll happens AFTER React finishes
  // rendering the newly logged set in the history section
  setTimeout(() => {
    historyRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });
  ```

  Line 197:

  ```typescript
  // Zero-delay setTimeout waits for React to render the new exercise
  // in the dropdown before auto-selecting it
  setTimeout(() => {
    formRef.current?.repeatSet({
      exerciseId,
      // ... dummy set for auto-selection
    });
  });
  ```

---

## Success Criteria

**Phase 1 - Time Formatting**:

- ✅ Single `formatTimeAgo` function in date-utils.ts
- ✅ Two call sites migrated (useLastSet, set-card)
- ✅ Comprehensive test coverage (>95%)
- ✅ No visual regressions in time display

**Phase 2 - Module Boundaries**:

- ✅ 5 new domain-specific modules created
- ✅ All 632 lines of tests migrated and passing
- ✅ ~15 import sites updated successfully
- ✅ dashboard-utils.ts deleted
- ✅ `pnpm test && pnpm typecheck` passes

**Phase 3 - Magic Numbers**:

- ✅ 4 magic numbers extracted/documented
- ✅ Code intent clear to future maintainers
- ✅ No functional changes

**Overall**:

- ✅ Zero regressions (all existing tests pass)
- ✅ Improved discoverability (domain-driven organization)
- ✅ Change amplification eliminated (DRY principle)
- ✅ Module boundaries enforce single responsibility

---

## Effort Estimates

**Phase 1** (Time Formatting): ~1.5h

- Implementation: 30min
- Tests: 45min
- Migration: 20min

**Phase 2** (Module Split): ~3h

- 5 module extractions: 2h
- Import updates: 45min
- Validation: 15min

**Phase 3** (Magic Numbers): ~30min

- 4 constant extractions: 20min
- Documentation: 10min

**Total**: ~5 hours (vs BACKLOG estimate of 4.5h - close match!)

---

## Sequencing Notes

**Why this order?**

1. **Time formatting first** - Smallest, independent, high-value quick win
2. **Module split second** - Tests already exist (safe refactor), enables future work
3. **Magic numbers last** - Quick cleanup pass, some done during module split

**Parallelization opportunities**: None - each phase builds on previous

**Risk mitigation**: Comprehensive test suite exists (632 lines), making refactor low-risk

---

## Design Iteration Checkpoints

**After Phase 1**:

- Review if "terminal" vs "compact" naming is intuitive
- Consider lowercase format option if UX feedback prefers mixed case

**After Phase 2**:

- Review module boundaries: Are they intuitive? Easy to discover?
- Check import patterns: If components import 3+ modules, consider facade pattern
- Identify any functions that don't fit cleanly (candidates for future refactor)

**After Phase 3**:

- Audit for remaining magic numbers (search for bare numeric literals)
- Consider extracting common timing patterns to shared constants module

---

## Future Opportunities

**Not in scope, but noted**:

- Consider facade pattern if call sites import 3+ split modules
- Extract common timing patterns (RAF delays, animation durations) to timing-constants.ts
- Internationalization of formatTimeAgo (i18n-ready architecture)
- Performance: Memoize formatDateGroup for repeated calls with same input

**Module Value Test** (after refactor):
For each new module, verify: **Value = Functionality - Interface Complexity**

- ✅ Weight-utils: 2 functions, clear responsibility → Deep module
- ✅ Stats-calculator: 2 functions, clear responsibility → Deep module
- ❌ If any module feels shallow (interface ≈ implementation), reconsider abstraction
