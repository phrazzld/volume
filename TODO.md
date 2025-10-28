# TODO: Code Quality Refactoring - DRY & Module Boundaries

## Progress Summary

**Completed**:

- ✅ Phase 1: Time formatting utility extraction (4 tasks, 25 tests, 2 migrations)
- ✅ Phase 2: Module extraction (5 new modules, 44 tests, all passing)
  - weight-utils.ts (10 tests)
  - stats-calculator.ts (13 tests)
  - date-formatters.ts (8 tests)
  - exercise-sorting.ts (5 tests)
  - exercise-grouping.ts (8 tests)

**Commits**: 12 total (5 Phase 1 + 2 linter + 5 Phase 2)
**Branch**: `refactor/code-quality-dry-module-boundaries`

---

## Remaining Tasks

### Phase 2: Import Migration & Cleanup

- [ ] **Update ~15 import sites to use new modules**

  Find all imports from dashboard-utils:

  ```bash
  ast-grep --lang typescript -p 'import { $$$ } from "@/lib/dashboard-utils"'
  ```

  Replace with specific module imports:
  - `convertWeight`, `normalizeWeightUnit`, `LBS_PER_KG` → `@/lib/weight-utils`
  - `calculateDailyStats`, `calculateDailyStatsByExercise` → `@/lib/stats-calculator`
  - `groupSetsByDay`, `formatDateGroup` → `@/lib/date-formatters`
  - `sortExercisesByRecency` → `@/lib/exercise-sorting`
  - `groupSetsByExercise` → `@/lib/exercise-grouping`

- [ ] **Delete dashboard-utils.ts after migration**
  - Verify all imports updated with: `ast-grep --lang typescript -p 'from "@/lib/dashboard-utils"'`
  - Run validation: `pnpm test && pnpm typecheck`
  - Delete files: `dashboard-utils.ts`, `dashboard-utils.test.ts`

---

### Phase 3: Document Magic Numbers

- [ ] **Extract UNDO_TOAST_DURATION_MS constant**
  - File: `src/components/dashboard/undo-toast.tsx:13-16`
  - Replace `3000` with named constant + JSDoc rationale

- [ ] **Extract FOCUS_DELAY_MS constant**
  - File: `src/components/dashboard/quick-log-form.tsx:239-243`
  - Replace `50` with named constant + JSDoc explaining DOM timing

- [ ] **Document setTimeout calls in Dashboard.tsx**
  - Lines 110, 197: Add comments explaining zero-delay pattern for React timing

**Note**: LBS_PER_KG already extracted during Phase 2 (weight-utils.ts)

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
