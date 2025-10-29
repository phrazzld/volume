### 12. [Maintainability] Time Formatting Duplication - 3 Implementations ⚠️ **CRITICAL DUPLICATION**

**Files**: `quick-log-form.tsx:88-96`, `grouped-set-history.tsx:46-63`, `set-card.tsx:37-51`
**Perspectives**: maintainability-maven, complexity-archaeologist, architecture-guardian
**Severity**: **HIGH** - **Cross-validated by 3 agents**
**Violations**: DRY, Change Amplification

**Issue**: Same time formatting logic implemented 3 different ways:

- `quick-log-form.tsx`: "5 MIN AGO", "2 HR AGO"
- `grouped-set-history.tsx`: "JUST NOW", "5M AGO", "3H AGO" → switches to "HH:MM"
- `set-card.tsx`: "Just now", "5m ago" → switches to `toLocaleTimeString()`

**Impact**: Inconsistent UX, must update 3 places to change time formatting, testing requires 3x effort.

**Test**: "If we want to show 'yesterday' for dates 24-48h ago, how many files change?" → **3 locations**

**Fix**: Extract to shared utility:

```typescript
// NEW: src/lib/time-utils.ts (extend existing file)
export type TimeFormat = "terminal" | "compact";

export function formatTimeAgo(
  timestamp: number,
  format: TimeFormat = "terminal"
): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return format === "terminal" ? `${seconds} SEC AGO` : "JUST NOW";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return format === "terminal" ? `${minutes} MIN AGO` : `${minutes}M AGO`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return format === "terminal" ? `${hours} HR AGO` : `${hours}H AGO`;
  }

  // Older than 24h: show absolute time
  if (format === "compact") {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const days = Math.floor(hours / 24);
  return `${days} DAY${days === 1 ? "" : "S"} AGO`;
}

// Update call sites:
// quick-log-form.tsx: formatTimeAgo(lastSet.performedAt, 'terminal')
// grouped-set-history.tsx: formatTimeAgo(set.performedAt, 'compact')
// set-card.tsx: formatTimeAgo(set.performedAt, 'compact')
```

**Effort**: 1h (extract + update 3 call sites + add tests)
**Impact**: **HIGH** - Single source of truth, consistent UX, enables internationalization

---

### 8. [Complexity] Dashboard-utils.ts Temporal Decomposition - 7 Unrelated Functions

**File**: `src/lib/dashboard-utils.ts:1-253`
**Perspectives**: complexity-archaeologist, architecture-guardian
**Severity**: **HIGH**
**Violations**: Ousterhout - Decompose by Functionality, Not Timeline

**Issue**: 253-line file with 7 unrelated functions grouped by "used in dashboard":

1. `convertWeight` (unit conversion)
2. `normalizeWeightUnit` (validation)
3. `calculateDailyStats` (statistics aggregation)
4. `calculateDailyStatsByExercise` (per-exercise stats)
5. `groupSetsByDay` (data grouping)
6. `formatDateGroup` (date formatting)
7. `sortExercisesByRecency` (sorting algorithm)

**Cohesion Test**: "What does dashboard-utils do?" → "It converts weights AND calculates stats AND formats dates AND sorts exercises AND..." → **7 distinct responsibilities**

**Impact**: Discoverability, change amplification, unfocused responsibility. Becoming a **dumping ground**.

**Fix**: Split by domain concern:

```typescript
// NEW: src/lib/weight-utils.ts
export { convertWeight, normalizeWeightUnit, getDisplayUnit };

// NEW: src/lib/stats-calculator.ts
export { calculateDailyStats, calculateDailyStatsByExercise };

// NEW: src/lib/date-formatters.ts
export { groupSetsByDay, formatDateGroup };

// NEW: src/lib/exercise-sorting.ts
export { sortExercisesByRecency };
```

**Effort**: 3h (split module + update ~15 imports + test)
**Impact**: **HIGH** - Clear domain boundaries, easier to extend, prevents god object

---

### 9. [Testing] Critical Business Logic Untested - dashboard-utils.ts ⚠️ **253 LINES, 0 TESTS**

**File**: `src/lib/dashboard-utils.ts`
**Perspectives**: maintainability-maven, complexity-archaeologist
**Severity**: **HIGH** - **Cross-validated by 2 agents**

**Current State**: 253 lines of complex calculations, mathematical operations, edge cases - **ZERO tests**.

**Developer Impact**:

- Afraid to refactor (no safety net)
- Bugs in volume/stats calculations could corrupt user data
- Can't verify weight conversion accuracy (critical for fitness app: `2.20462` magic number)
- Edge cases undocumented

**Fix**: Add comprehensive test suite:

```typescript
// NEW: src/lib/dashboard-utils.test.ts
describe("convertWeight", () => {
  it("converts lbs to kg accurately", () => {
    expect(convertWeight(220, "lbs", "kg")).toBeCloseTo(99.79, 2);
  });
  it("converts kg to lbs accurately", () => {
    expect(convertWeight(100, "kg", "lbs")).toBeCloseTo(220.46, 2);
  });
  it("handles edge cases", () => {
    expect(convertWeight(0, "lbs", "kg")).toBe(0);
  });
});

describe("calculateDailyStats", () => {
  it("filters to today only");
  it("correctly sums total volume across mixed units");
  it("handles sets without weight");
  it("returns null for empty input");
});

describe("groupSetsByDay", () => {
  it("groups sets by calendar day");
  it("sorts newest first");
  it("handles timezone edge cases");
});
```

**Effort**: 4h (comprehensive test suite)
**Benefit**: **CRITICAL** - Prevents data corruption bugs, enables confident refactoring

---

### 10. [Code Quality] Magic Numbers Without Documentation

**Files**: `Dashboard.tsx:156`, `quick-log-form.tsx:89,119`, `dashboard-utils.ts:16,23`
**Perspectives**: maintainability-maven, complexity-archaeologist
**Severity**: **MEDIUM**

**Issue**: Hardcoded numbers with no context:

- `setTimeout(..., 100)` - Why 100ms? React render? Random?
- `2.20462` - Weight conversion factor, no documentation

**Impact**: New developers confused, afraid to change timing, can't verify accuracy.

**Fix**: Extract to named constants with documentation:

```typescript
// React needs one render cycle to update DOM before focusing
const REACT_RENDER_DELAY_MS = 100;

// Official conversion factor: 1 kg = 2.20462 lbs (rounded to 5 decimals for UI)
const LBS_PER_KG = 2.20462;
```

**Effort**: 10m
**Benefit**: **MEDIUM** - Self-documenting code, confident future changes

---
