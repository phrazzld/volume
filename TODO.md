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

## PR #20 Review Feedback

**Source**: Claude AI + Codex bot reviews (2025-10-29)

- [ ] **Fix UTC timezone bug in formatTimeAgo compact format** (MERGE-BLOCKING, P1)
  - File: `src/lib/date-utils.ts:142-143`
  - Change `getUTCHours()`/`getUTCMinutes()` to `getHours()`/`getMinutes()`
  - Add test case for timezone correctness
  - Flagged by: Claude AI + Codex bot (cross-validated)
  - Impact: Non-UTC users see wrong times for sets >24h old
  - Effort: 10 minutes

- [ ] **Fix JSDoc for compact format (says lowercase, is uppercase)**
  - File: `src/lib/date-utils.ts:85`
  - Update JSDoc to say "Uppercase terse format" instead of "Lowercase"
  - Effort: 2 minutes

- [ ] **Add null safety check in groupSetsByExercise**
  - File: `src/lib/exercise-grouping.ts:33`
  - Add defensive check: `if (!set.exerciseId) return;`
  - Add test case for malformed set data
  - Effort: 10 minutes

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
