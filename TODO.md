# TODO: Code Quality Refactoring - DRY & Module Boundaries

## ✅ ALL TASKS COMPLETE

### Phase 1: Time Formatting ✅

- ✅ Extracted `formatTimeAgo` utility (2 formats: terminal, compact)
- ✅ Added 25 comprehensive tests
- ✅ Migrated 2 call sites (useLastSet, set-card)

### Phase 2: Module Boundaries ✅

- ✅ Created 5 domain-specific modules:
  - `weight-utils.ts` (10 tests) - Unit conversion
  - `stats-calculator.ts` (13 tests) - Workout statistics
  - `date-formatters.ts` (8 tests) - Date grouping/display
  - `exercise-sorting.ts` (5 tests) - Exercise ordering
  - `exercise-grouping.ts` (8 tests) - Session grouping
- ✅ Migrated 4 import sites to new modules
- ✅ Deleted `dashboard-utils.ts` and test file

### Phase 3: Magic Numbers ✅

- ✅ Extracted `UNDO_TOAST_DURATION_MS` (3000ms) with JSDoc
- ✅ Extracted `FOCUS_DELAY_MS` (50ms) with JSDoc
- ✅ Documented setTimeout timing patterns in Dashboard.tsx
- ✅ `LBS_PER_KG` already extracted in Phase 2

**Total**: 16 commits, 48 new tests, all passing
**Branch**: `refactor/code-quality-dry-module-boundaries`

---

## PR #20 Review Feedback ✅

**Source**: Claude AI + Codex bot reviews (2025-10-29)
**Completed**: 2025-10-29 (1 commit, all 241 tests passing)

- ✅ **Fix UTC timezone bug in formatTimeAgo compact format** (MERGE-BLOCKING, P1)
  - Changed `getUTCHours()`/`getUTCMinutes()` to `getHours()`/`getMinutes()`
  - Added timezone-independent test assertions
  - Fixed regression where non-UTC users saw wrong times for sets >24h old
  - Flagged by: Claude AI + Codex bot (cross-validated)

- ✅ **Fix JSDoc for compact format (was incorrect)**
  - Updated from "Lowercase terse format" to "Uppercase terse format"
  - Now matches actual implementation ('JUST NOW', '5M AGO')

- ✅ **Add null safety check in groupSetsByExercise**
  - Added defensive check: `if (!set.exerciseId) return;`
  - Added test case for malformed set data
  - Prevents potential runtime errors from malformed Convex data

---

## Success Validation

Run before merging:

```bash
pnpm typecheck    # TypeScript compilation
pnpm test         # All tests passing (48 new + existing)
pnpm lint         # No linting issues
```

**Expected Outcome**:

- Zero regressions
- Clear module boundaries (weight, stats, dates, exercises)
- Self-documenting code (magic numbers eliminated)
- Improved maintainability and discoverability
