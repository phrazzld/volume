# BACKLOG: Volume Workout Tracker

*A comprehensive map of opportunities to improve product, codebase, and development experience.*

**Last Groomed:** 2025-10-07
**Status:** Post-MVP - Clean codebase, IDOR vulnerability FIXED (2025-10-07)
**Audit Method:** 6-perspective analysis (complexity, architecture, security, performance, maintainability, UX)

---

## Immediate Concerns

*Issues requiring attention right now - security vulnerabilities, data loss scenarios, critical UX problems.*

---

### 2. 🚨 [Security] Missing Rate Limiting on Mutations - HIGH ABUSE RISK
**File**: All mutation endpoints (`convex/exercises.ts`, `convex/sets.ts`)
**Perspectives**: security-sentinel
**Severity**: **HIGH**
**Category**: OWASP A05:2021 - Security Misconfiguration

**Vulnerability**: No rate limiting allows attackers to spam mutations, causing:
- Database pollution (create thousands of bogus exercises/sets)
- Denial of service (exhaust Convex limits)
- Cost exploitation (drive up database/compute costs)

**Fix**: Implement Convex rate limiting using convex-helpers:
```typescript
import { rateLimiter } from "convex-helpers/server/rate-limiter";

const createExerciseRateLimiter = rateLimiter({
  createExercise: { kind: "token bucket", rate: 10, period: 60_000 },
});

export const createExercise = mutation({
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    await createExerciseRateLimiter(ctx, {
      key: identity.subject,
      throws: true,
    });
    // ... rest of handler
  },
});
```

**Recommended Limits**:
- `createExercise`: 10/minute per user
- `logSet`: 60/minute per user
- `deleteExercise`: 5/minute per user
- `deleteSet`: 20/minute per user

**Effort**: 2 hours (add `convex-helpers` dependency + implement across mutations)
**Risk**: **HIGH** - DoS, cost exploitation, data integrity

---

### 3. 🚨 [Security] Missing Security Headers - MEDIUM
**File**: `next.config.ts:1-7`
**Perspectives**: security-sentinel
**Severity**: **MEDIUM**
**Category**: OWASP A05:2021 - Security Misconfiguration

**Missing Headers**:
- `Content-Security-Policy`: No CSP to prevent XSS
- `X-Frame-Options`: App can be embedded in iframe (clickjacking risk)
- `X-Content-Type-Options`: Browser could MIME-sniff responses
- `Referrer-Policy`: Referer header leaks URLs
- `Permissions-Policy`: No control over browser features

**Fix**: Add security headers to `next.config.ts`:
```typescript
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.*.com https://*.convex.cloud; ..."
      },
    ],
  }];
},
```

**Effort**: 1 hour (testing CSP compatibility)
**Risk**: **MEDIUM** - Defense in depth against XSS/clickjacking

---

### 5. ⚠️ [UX] Alert() Dialogs Still Present - Poor Error UX
**Files**: `src/components/dashboard/Dashboard.tsx:58, 82`, `src/components/dashboard/first-run-experience.tsx:44`
**Perspectives**: user-experience-advocate, maintainability-maven
**Severity**: **HIGH**

**Current UX**: Some mutation failures still use browser `alert()` dialogs - modal, blocking, scary. Especially jarring on mobile.

**User Impact**: Users perceive failures as catastrophic system errors. No recovery path. Inconsistent with rest of app (modern toast notifications).

**Fix**: Replace remaining alert() calls with handleMutationError():
```typescript
// Dashboard.tsx:58
} catch (error) {
  handleMutationError(error, "Delete Set");
}

// Dashboard.tsx:82
} catch (error) {
  handleMutationError(error, "Undo Set");
}

// first-run-experience.tsx:44
} catch (error) {
  handleMutationError(error, "Create Exercise");
  setIsCreating(false); // Allow retry
}
```

**Effort**: 15 minutes
**Value**: **HIGH** - Consistent, professional error handling

---

### 6. ⚠️ [Architecture] Type Duplication Across 5+ Files - CRITICAL CHANGE AMPLIFICATION
**Files**: `src/lib/dashboard-utils.ts:3,36`, `src/components/dashboard/set-card.tsx:10,19`, `src/components/dashboard/grouped-set-history.tsx:12,21`, `src/components/dashboard/quick-log-form.tsx:13,18`, `src/components/dashboard/exercise-manager.tsx:13,19`
**Perspectives**: architecture-guardian, complexity-archaeologist
**Severity**: **CRITICAL**
**Violations**: Modularity (Single Source of Truth), Explicitness, DRY

**Issue**: `Set` and `Exercise` interfaces redefined in 5 separate locations. Adding a field (e.g., `notes`, `rpe`) requires editing 5+ files.

**Impact**:
- Change Amplification: Schema changes require 5+ file edits
- Drift Risk: Some include `createdAt`, others don't
- Testing: Mocks must match 5 different but similar interfaces

**Fix**: Extract shared domain types:
```typescript
// NEW: src/types/domain.ts
import { Id } from "../../convex/_generated/dataModel";

export type WeightUnit = "lbs" | "kg";

export interface Exercise {
  _id: Id<"exercises">;
  name: string;
  createdAt: number;
}

export interface Set {
  _id: Id<"sets">;
  exerciseId: Id<"exercises">;
  reps: number;
  weight?: number;
  unit?: WeightUnit;
  performedAt: number;
}

// Then update all 5 files:
import { Exercise, Set } from "@/types/domain";
```

**Effort**: 1.5h (create types module + update 5+ import sites)
**Impact**: **HIGH** - Enables safe schema evolution, prevents future drift

---

### 7. ⚠️ [Maintainability] Inconsistent Error Handling Patterns
**Files**: Multiple
**Perspectives**: maintainability-maven, user-experience-advocate
**Severity**: **HIGH**

**Issue**: Three different error handling approaches across codebase:
- **Pattern A** (`error-handler.ts`): Centralized handler with toast notifications ✅
- **Pattern B** (`Dashboard.tsx:56-59, 81-83`): Direct `console.error` + `alert()` ❌
- **Pattern C** (`first-run-experience.tsx:43`): Only `console.error`, no user feedback ❌

**Developer Impact**: New developers don't know which pattern to use. Inconsistent UX.

**Fix**: Standardize on Pattern A everywhere - already addressed in item #5 above.

**Effort**: Covered by item #5
**Benefit**: **HIGH** - Consistent UX, easier error tracking integration

---

## High-Value Improvements

*Changes that significantly improve user experience, developer velocity, or system reliability.*

---

### 8. [Architecture] Dashboard God Component - 6 Responsibilities
**File**: `src/components/dashboard/Dashboard.tsx:1-190`
**Perspectives**: architecture-guardian, complexity-archaeologist
**Severity**: **HIGH**
**Violations**: Single Responsibility Principle, Modularity

**Metrics**:
- 190 lines
- 6 responsibilities: data fetching, stats calculation, undo state, mutation orchestration, child coordination, flow control
- High coupling: knows about QuickLogForm internals, toast behavior, stat calculations

**Impact**: Blocks feature development, hard to test, change amplification.

**Fix**: Extract responsibilities into focused hooks:

```typescript
// NEW: src/hooks/useDashboardData.ts
export function useDashboardData() {
  const sets = useQuery(api.sets.listSets, {});
  const exercises = useQuery(api.exercises.listExercises);
  const { unit } = useWeightUnit();

  return {
    sets,
    exercises,
    dailyStats: useMemo(() => calculateDailyStats(sets, unit), [sets, unit]),
    exerciseStats: useMemo(() => calculateDailyStatsByExercise(sets, exercises, unit), [sets, exercises, unit]),
    groupedSets: useMemo(() => groupSetsByDay(sets), [sets]),
    exercisesByRecency: useMemo(() => sortExercisesByRecency(exercises, sets), [exercises, sets]),
  };
}

// NEW: src/hooks/useUndoableDelete.ts
export function useUndoableDelete() {
  // Undo toast state management
}

// UPDATED: Dashboard.tsx (now 80 lines instead of 190)
export function Dashboard() {
  const data = useDashboardData();
  const undo = useUndoableDelete();
  // Just composition, no business logic
}
```

**Effort**: 3h (extract hooks + update tests)
**Impact**: **HIGH** - 190 → 80 lines (58% reduction), reusable hooks, testable

---

### 9. [Architecture] Missing Domain Service Layer - Tight Convex Coupling
**Files**: `src/components/dashboard/quick-log-form.tsx:47`, `src/components/dashboard/exercise-manager.tsx:35-36`, `src/components/dashboard/inline-exercise-creator.tsx:22`, 6+ others
**Perspectives**: architecture-guardian
**Severity**: **HIGH**
**Violations**: Dependency Inversion, Modularity

**Issue**: UI components directly depend on Convex implementation (`api.sets.logSet`, `api.exercises.createExercise`). No abstraction layer.

**Impact**:
- Cannot switch backend without editing 10+ components
- Cannot implement offline support (no interception point)
- Testing requires full Convex mock setup
- Coupling Score: 8/10 (very tight)

**Fix**: Introduce domain service layer:

```typescript
// NEW: src/services/workout-service.ts
export interface WorkoutService {
  logSet(params: LogSetParams): Promise<Id<"sets">>;
  deleteSet(id: Id<"sets">): Promise<void>;
  createExercise(name: string): Promise<Id<"exercises">>;
  // ... other operations
}

// NEW: src/services/convex-workout-service.ts
export function useWorkoutService(): WorkoutService {
  const logSetMutation = useMutation(api.sets.logSet);
  // ... wrap mutations with error handling

  return {
    logSet: async (params) => {
      try {
        return await logSetMutation(params);
      } catch (error) {
        handleMutationError(error, "Log Set");
        throw error;
      }
    },
    // ...
  };
}

// Components use abstraction:
const workoutService = useWorkoutService();
await workoutService.logSet({ ... });
```

**Effort**: 4h (create service interface + implement Convex adapter + update 6+ components)
**Impact**: **HIGH** - Enables offline support, improves testability, migration path

---

### 10. [Complexity] Temporal Decomposition in dashboard-utils.ts
**File**: `src/lib/dashboard-utils.ts:1-252`
**Perspectives**: complexity-archaeologist
**Severity**: **HIGH**
**Violations**: Ousterhout - Decompose by Functionality, Not Timeline

**Issue**: 251-line file with 6 unrelated functions grouped by "used in dashboard" rather than domain:
- Weight conversion (domain: units)
- Stats aggregation (domain: analytics)
- Date grouping (domain: formatting)
- Exercise sorting (domain: sorting)

**Impact**: Discoverability, change amplification, unfocused responsibility.

**Fix**: Split by domain concern:
```typescript
// NEW: src/lib/stats/weight-conversion.ts
export { convertWeight };

// NEW: src/lib/stats/aggregation.ts
export { calculateDailyStats, calculateDailyStatsByExercise };

// NEW: src/lib/formatting/date-grouping.ts
export { groupSetsByDay, formatDateGroup };

// NEW: src/lib/sorting/exercise-sorting.ts
export { sortExercisesByRecency };
```

**Effort**: 3h (split file + update imports + test)
**Impact**: **HIGH** - Clear domain boundaries, easier to extend

---

### 11. [Performance] O(n) Exercise Lookups in Render Loop - SCALING ISSUE
**Files**: `src/components/dashboard/grouped-set-history.tsx:109`, `src/lib/dashboard-utils.ts:187`
**Perspectives**: performance-pathfinder
**Severity**: **HIGH** (scaling concern)

**Issue**: Exercise name lookups using `.find()` inside `.map()` loops:
```typescript
const rows = group.sets.map((set) => {
  const exercise = exercises.find((ex) => ex._id === set.exerciseId); // O(n) lookup!
});
```

**Complexity**: O(sets × exercises) - with 100 sets and 20 exercises = 2,000 array scans

**User Impact**:
- Currently negligible (tens of sets)
- **Noticeable at 500+ sets**: 10ms → 50-100ms render lag
- **Visible jank at 1000+ sets**: 100ms+ interaction latency

**Optimization**: Build Map index once, use O(1) lookups:
```typescript
const exerciseMap = useMemo(
  () => new Map(exercises.map(ex => [ex._id, ex])),
  [exercises]
);

// In render loop
const exercise = exerciseMap.get(set.exerciseId); // O(1) lookup
```

**Expected Speedup**: O(n × m) → O(n + m), **50-100x faster** with large datasets

**Effort**: 30m (2 file changes)
**Priority**: **HIGH** - Easy fix, prevents future lag

---

### 12. [Performance] Client-Side Filtering Wasteful - Optimize Last Set Query
**File**: `src/components/dashboard/quick-log-form.tsx:60-68`
**Perspectives**: performance-pathfinder, user-experience-advocate
**Severity**: **MEDIUM**

**Issue**: Fetches ALL user sets then filters client-side to find last set for selected exercise.

**User Impact**:
- Currently: ~5KB payload, <10ms processing
- At 1,000 sets: ~50KB, 20-30ms
- At 10,000 sets: ~500KB, 100-200ms, **noticeable lag**

**Optimization**: Query only sets for selected exercise (backend already supports this):
```typescript
// Instead of:
const allSets = useQuery(api.sets.listSets, {});
const lastSet = useMemo(() => {
  const exerciseSets = allSets?.filter(s => s.exerciseId === selectedExerciseId);
  return exerciseSets?.[0] ?? null;
}, [selectedExerciseId, allSets]);

// Use:
const exerciseSets = useQuery(
  api.sets.listSets,
  selectedExerciseId ? { exerciseId: selectedExerciseId } : "skip"
);
const lastSet = exerciseSets?.[0] ?? null;
```

**Expected Speedup**: 500KB → <1KB payload, 200ms → <5ms at scale

**Effort**: 15m
**Priority**: **MEDIUM** - Better data efficiency

---

### 13. [UX] No Way to Edit Logged Sets - Must Delete and Re-Log
**Perspectives**: user-experience-advocate
**Severity**: **HIGH**

**Current UX**: User logs set with typo (typed 12 instead of 10). Only option is delete and re-log. Loses timestamp.

**User Impact**: Common use case. Typos happen, especially on mobile numeric keyboard. Deleting to fix breaks flow and loses exact timestamp.

**Improved Experience**: Add edit button next to delete button on set cards:
- Click edit → fields become editable inline
- User corrects reps/weight
- Click save → updates set
- Preserves original timestamp

**Implementation**:
1. Add `updateSet` mutation in `convex/sets.ts`
2. Add edit mode state to SetCard component
3. Inline editing UI (similar to exercise name editing)

**Effort**: 3h
**Value**: **HIGH** - Fixes common frustration, reduces data loss from typos

---

### 14. [UX] Undo Toast Auto-Dismisses Too Fast
**File**: `src/components/dashboard/undo-toast.tsx:14-18`
**Perspectives**: user-experience-advocate
**Severity**: **HIGH**

**Current UX**: Undo toast appears for 3 seconds then auto-dismisses. Power users logging sets rapidly often miss undo opportunity.

**User Impact**: By the time user notices mistake, toast is gone. Must manually re-log set. Frustrating.

**Improved Experience**:
1. Extend timeout to 5-7 seconds (industry standard)
2. Pause auto-dismiss on hover/focus (accessibility best practice)
3. Show countdown indicator

**Implementation**:
```typescript
const UNDO_TIMEOUT_MS = 6000; // 6 seconds instead of 3

// Add hover pause logic
const [isPaused, setIsPaused] = useState(false);
```

**Effort**: 1h
**Value**: **HIGH** - Prevents frustrating data re-entry

---

### 15. [Accessibility] Missing ARIA Live Regions - Screen Readers Silent on Toasts
**Files**: `src/components/dashboard/undo-toast.tsx`, all Sonner toast usage
**Perspectives**: user-experience-advocate
**Severity**: **MEDIUM-HIGH**
**Violations**: WCAG 2.1 Level A

**Current UX**: Screen reader users don't hear toast notifications. When set is logged, visual toast appears but screen reader silent.

**User Impact**: Blind users can't use app. Violates accessibility compliance.

**Improved Experience**: Add ARIA live regions to toast notifications:
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <span className="sr-only">Set logged successfully</span>
  {/* Visual content */}
</div>
```

**Note**: Sonner may already handle this - need to verify. If missing, add aria-live to toast container.

**Effort**: 30m
**Value**: **MEDIUM-HIGH** - Critical for accessibility compliance

---

### 16. [Accessibility] Collapsible Panels Missing Keyboard Support
**File**: `src/components/ui/terminal-panel.tsx`
**Perspectives**: user-experience-advocate
**Severity**: **MEDIUM**
**Violations**: WCAG 2.1 keyboard navigation

**Current UX**: Panels collapsible by clicking title bar. Keyboard-only users can't collapse/expand - no keyboard handlers.

**Fix**: Add keyboard support:
```tsx
<div
  onClick={toggle}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }}
  role="button"
  tabIndex={0}
  aria-expanded={!isCollapsed}
  aria-controls={`panel-${storageKey}`}
>
```

**Effort**: 1h
**Value**: **MEDIUM** - Accessibility compliance

---

### 17. [Security] Lack of Audit Logging for Security Events
**Files**: All mutation endpoints
**Perspectives**: security-sentinel
**Severity**: **MEDIUM**
**Category**: OWASP A09:2021 - Security Logging Failures

**Missing Logs**:
- Exercise deletion (no record of who deleted what)
- Set deletion (undo functionality but no permanent audit)
- Authentication failures
- Authorization failures (silent failure)

**Impact**: Can't investigate security incidents, GDPR compliance risk, no abuse detection.

**Fix**: Add audit logging to critical mutations:
```typescript
// convex/lib/audit.ts
export async function auditLog(ctx, event) {
  await ctx.db.insert("audit_logs", {
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    userId: event.userId,
    timestamp: Date.now(),
    metadata: event.metadata,
  });
}

// Usage:
await auditLog(ctx, {
  action: "delete_exercise",
  resourceType: "exercise",
  resourceId: args.id,
  userId: identity.subject,
  metadata: { name: exercise.name },
});
```

**Effort**: 3h
**Risk**: **MEDIUM** - Forensics and compliance

---

### 18. [Maintainability] Duplicate Time Formatting Logic (3 Implementations)
**Files**: `src/components/dashboard/quick-log-form.tsx:71-80`, `src/components/dashboard/grouped-set-history.tsx:59-76`, `src/components/dashboard/set-card.tsx:50-64`
**Perspectives**: maintainability-maven, complexity-archaeologist
**Severity**: **MEDIUM**
**Violations**: DRY

**Issue**: Same time formatting logic implemented 3 different ways with different formats:
- `quick-log-form.tsx`: "5 MIN AGO", "2 HR AGO"
- `grouped-set-history.tsx`: "5M AGO", "2H AGO", "JUST NOW"
- `set-card.tsx`: "5m ago", "2h ago", "Just now"

**Impact**: Which format is correct? Can't update globally. Testing requires 3x effort.

**Fix**: Extract to shared utility:
```typescript
// NEW: src/lib/time-utils.ts
export type TimeFormat = 'terminal' | 'compact' | 'friendly';

export function formatTimeAgo(
  timestamp: number,
  format: TimeFormat = 'friendly'
): string {
  // Single implementation
}
```

**Effort**: 1h (extract + update call sites + tests)
**Benefit**: **MEDIUM** - Single source of truth, consistent UX

---

## Technical Debt Worth Paying

*Refactorings and improvements that make future development easier and faster.*

---

### 19. [Testing] Critical Business Logic Untested - dashboard-utils.ts
**File**: `src/lib/dashboard-utils.ts` (251 lines)
**Perspectives**: maintainability-maven
**Severity**: **HIGH**

**Current State**: Only validation functions have tests. The 251-line `dashboard-utils.ts` contains complex calculations, mathematical operations, edge cases - **zero tests**.

**Developer Impact**:
- Afraid to refactor (no safety net)
- Bugs in volume/stats calculations could corrupt user data
- Can't verify weight conversion accuracy (critical for fitness app)
- Edge cases undocumented

**Fix**: Add comprehensive test suite:
```typescript
// dashboard-utils.test.ts
describe('convertWeight', () => {
  it('converts lbs to kg accurately');
  it('converts kg to lbs accurately');
  it('handles unknown units gracefully');
});

describe('calculateDailyStats', () => {
  it('filters to today only');
  it('correctly sums total volume across different units');
  it('handles sets without weight');
  it('returns null for empty input');
});

describe('groupSetsByDay', () => {
  it('groups sets by calendar day');
  it('sorts newest first');
  it('handles timezone edge cases');
});
```

**Effort**: 4h
**Benefit**: **HIGH** - Prevents data corruption bugs, enables confident refactoring

---

### 20. [Testing] Error Message Mapping Untested
**File**: `src/lib/error-handler.ts`
**Perspectives**: maintainability-maven
**Severity**: **MEDIUM**

**Issue**: `getUserFriendlyMessage()` function maps technical errors to user-facing messages, but no tests verify mappings are correct.

**Fix**: Add unit tests:
```typescript
// error-handler.test.ts
describe('getUserFriendlyMessage', () => {
  it('maps auth errors correctly');
  it('maps authorization errors');
  it('passes through validation errors');
  it('handles not found errors');
  it('provides generic fallback');
});
```

**Effort**: 1h
**Benefit**: **MEDIUM** - Prevent user-facing message bugs

---

### 21. [Code Quality] Magic Numbers Without Explanation
**Files**: `src/components/dashboard/Dashboard.tsx:137`, `src/components/dashboard/quick-log-form.tsx:89,119`, `src/lib/dashboard-utils.ts:23-29`
**Perspectives**: maintainability-maven
**Severity**: **MEDIUM**

**Issue**: Hardcoded numbers with no context:
- `setTimeout(..., 100)` - Why 100ms? React render? Random?
- `2.20462` - Weight conversion factor, no documentation

**Fix**: Extract to named constants with documentation:
```typescript
// React needs one render cycle before focusing
const REACT_RENDER_DELAY_MS = 100;

// Standard conversion factor: 1 kg = 2.20462 lbs (exact)
const LBS_PER_KG = 2.20462;
```

**Effort**: 30m
**Benefit**: **MEDIUM** - Self-documenting code

---

### 22. [Code Quality] Module-Level Documentation Missing
**File**: `src/lib/dashboard-utils.ts`
**Perspectives**: maintainability-maven
**Severity**: **MEDIUM**

**Issue**: 251-line file with 6 exported functions, no module-level documentation.

**Fix**: Add module overview:
```typescript
/**
 * Dashboard Utilities
 *
 * Core calculation and formatting functions for workout dashboard.
 * Handles daily statistics, volume calculations, and data grouping.
 *
 * Key Functions:
 * - convertWeight: Convert between lbs and kg
 * - calculateDailyStats: Aggregate today's workout totals
 * - calculateDailyStatsByExercise: Per-exercise breakdown
 * ...
 */
```

**Effort**: 15m
**Benefit**: **MEDIUM** - Faster onboarding

---

### 23. [Code Quality] Hydration Mismatch in WeightUnitContext
**File**: `src/contexts/WeightUnitContext.tsx:16-32`
**Perspectives**: complexity-archaeologist
**Severity**: **MEDIUM**

**Issue**: Initializes state from localStorage during render, causing hydration mismatch (server renders "lbs", client may have "kg" in localStorage).

**Fix**: Always start with default to match SSR, sync after hydration:
```typescript
const [unit, setUnit] = useState<WeightUnit>("lbs");
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  try {
    const stored = localStorage.getItem("weightUnit");
    if (stored === "kg" || stored === "lbs") {
      setUnit(stored);
    }
  } catch (error) {
    console.warn("Failed to read weight unit preference:", error);
  }
  setIsHydrated(true);
}, []);
```

**Effort**: 30m
**Benefit**: **MEDIUM** - No hydration warnings

---

### 24. [Maintainability] Poor Naming - `any` Type Usage
**File**: `src/components/dashboard/Dashboard.tsx:63`
**Perspectives**: maintainability-maven, architecture-guardian
**Severity**: **HIGH**

**Issue**: `any` type defeats TypeScript safety:
```typescript
const handleRepeatSet = (set: any) => {
  formRef.current?.repeatSet(set);
};
```

**Fix**: Use proper type:
```typescript
import { Set } from "@/types/domain";

const handleRepeatSet = (set: Set) => {
  formRef.current?.repeatSet(set);
};
```

**Effort**: 15m (once types are centralized in item #6)
**Benefit**: **HIGH** - Type safety prevents runtime errors

---

### 25. [Code Quality] Console Logging in Production
**Files**: Multiple (`error-handler.ts:12`, `Dashboard.tsx:57,81`, `first-run-experience.tsx:43`, `terminal-panel.tsx:46,58`, `WeightUnitContext.tsx:28,42`)
**Perspectives**: maintainability-maven, security-sentinel
**Severity**: **LOW**

**Issue**: `console.error` and `console.warn` calls remain in production build. Could leak error details, performance overhead.

**Fix**: Replace with production-safe logging:
```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (Sentry, etc.)
    } else {
      console.error(message, error);
    }
  },
};
```

**Effort**: 1h
**Benefit**: **LOW** - Production-safe logging

---

## Nice to Have

*Improvements that would be valuable but aren't urgent - optimizations, polish, quality-of-life.*

---

### 26. [Performance] Missing React.memo on Table Rows
**File**: `src/components/dashboard/grouped-set-history.tsx:106-162`
**Perspectives**: performance-pathfinder
**Severity**: **LOW-MEDIUM**

**Issue**: All table rows re-render when any set changes.

**User Impact**:
- Currently: Imperceptible
- At 500+ sets: 10-20ms re-render delay
- At 1000+ sets: 50ms+ visible lag

**Optimization**: Extract row builder to memoized component:
```typescript
const SetRow = React.memo(({ set, exercise, onRepeat, onDelete }) => {
  // Row rendering logic
});
```

**Effort**: 1-2h
**Priority**: **LOW** - Future-proofing

---

### 27. [Performance] Missing Pagination (Future Consideration)
**File**: `convex/sets.ts:44-75`
**Perspectives**: performance-pathfinder
**Severity**: **LOW**

**Issue**: `.collect()` fetches all user sets without limit.

**User Impact**:
- Currently: Non-issue (MVP users have <100 sets)
- At 10,000 sets: ~500KB payload, 200-500ms query, **slow initial load**

**Optimization**: Add pagination + infinite scroll when users accumulate 1000+ sets (months/years of use).

**Effort**: 4-6h
**Priority**: **LOW** - Not needed until dataset grows significantly

---

### 28. [UX] No Search/Filter for Exercises
**Perspectives**: user-experience-advocate
**Severity**: **LOW-MEDIUM**

**Current UX**: User with 50+ exercises must scroll through entire list. No search, no filter.

**Improved Experience**: Add search input above exercise selector.

**Effort**: 2h
**Value**: **MEDIUM** - Quality of life for power users

---

### 29. [UX] Loading Skeleton Layout Shift
**File**: `src/components/dashboard/Dashboard.tsx:95-130`
**Perspectives**: user-experience-advocate
**Severity**: **LOW**

**Issue**: Loading skeleton roughly matches final UI but minor layout shift on load.

**Fix**: Ensure skeleton exactly matches final layout dimensions.

**Effort**: 30m
**Value**: **LOW** - Visual polish

---

### 30. [Code Quality] Hardcoded Colors in UndoToast
**File**: `src/components/dashboard/undo-toast.tsx:27-30`
**Perspectives**: maintainability-maven
**Severity**: **LOW**

**Current**: `<CornerBracket position="top-left" color="#00ff00" />`
**Fix**: `<CornerBracket position="top-left" color="var(--terminal-success)" />`

**Effort**: 5m
**Benefit**: **LOW** - Respects theme changes

---

## Post-MVP Features

*Feature roadmap from original backlog - organized by strategic value.*

---

### High Priority (v1.1) - User Requested Features

#### Analytics & Insights
**Effort**: 2-3 days | **Value**: HIGH - Core value proposition

- [ ] **Daily/weekly/monthly aggregation stats**
  - Total reps per exercise per period
  - Total volume (reps × weight) for weighted exercises
  - Average reps/sets per day

- [ ] **Charts and visualizations**
  - Line chart: reps/volume over time per exercise
  - Bar chart: total volume by exercise this week/month
  - Use Recharts (recommended)
  - Location: New `/analytics` page

- [ ] **Personal Records (PRs)**
  - Track max reps (bodyweight exercises)
  - Track max weight (weighted exercises)
  - "New PR!" celebration with confetti
  - PR history timeline

- [ ] **Streak tracking**
  - Consecutive days with ≥1 set logged
  - Per-exercise streaks
  - Calendar heatmap view (GitHub-style)
  - Streak recovery (grace period)

---

#### Offline-First Architecture
**Effort**: 3-4 days | **Value**: MEDIUM-HIGH - Enables anywhere usage

- [ ] **Add Dexie.js for local IndexedDB storage**
  - Mirror Convex schema locally
  - Write to Dexie first (instant feedback)
  - Background sync queue to Convex
  - ULID-based IDs for offline creation

- [ ] **Sync conflict resolution**
  - Last-write-wins strategy
  - Maintain `updatedAt` timestamps

- [ ] **Offline indicator UI**
  - Online/offline status badge
  - Pending sync count indicator
  - Manual "sync now" button

- [ ] **Service Worker for PWA**
  - Cache static assets
  - Background sync API

**When to implement**: When users request offline support or gym connectivity is poor

---

#### Data Portability
**Effort**: 1 day | **Value**: MEDIUM - Builds trust

- [ ] **Export functionality**
  - CSV export: `exercise_name, reps, weight, unit, timestamp`
  - JSON export: Full data with IDs (for re-import)
  - Download as file (client-side Blob API)

- [ ] **Import functionality**
  - Parse CSV/JSON with validation
  - Deduplication by ULID + timestamp
  - Support Strong/FitNotes CSV formats
  - Progress indicator for large imports

---

### Medium Priority (v1.2) - UX Polish

#### Enhanced Set Logging UI
**Effort**: 2 days | **Value**: MEDIUM

- [ ] **Additional set metadata**
  - RPE (Rate of Perceived Exertion) 1-10 slider
  - Notes field (optional)
  - Timestamp adjuster (backlog sets)
  - Tags: "warmup", "dropset", "amrap"

- [ ] **Rest timer between sets**
  - Set-to-set rest countdown
  - Customizable per exercise
  - Notification when rest complete

- [ ] **Quick-log shortcuts**
  - Pin favorite exercises to home
  - One-tap to repeat last set (already implemented)

---

#### Exercise Management Enhancements
**Effort**: 1 day | **Value**: MEDIUM

- [ ] **Exercise types**
  - Bodyweight vs Weighted vs Timed vs Distance
  - Default unit per exercise
  - Type-specific UI hints

- [ ] **Exercise library**
  - Pre-populated common exercises (100+ exercises)
  - Search and filter
  - Exercise templates with suggested rep ranges

- [ ] **Tags and categories**
  - Multi-tag support (e.g., "push", "upper", "compound")
  - Filter by tag
  - Color coding

---

#### Workout Sessions (Optional Grouping)
**Effort**: 2 days | **Value**: LOW-MEDIUM

- [ ] **Session concept**
  - Group sets into named sessions (e.g., "Upper Body A")
  - Start/end session with timestamps
  - Session notes
  - Session duration tracking

- [ ] **Session history**
  - List past sessions
  - Repeat session feature
  - Compare sessions over time

**Note**: Optional feature - sets work standalone without sessions

---

## Completed & Archived

### Recently Completed (Last Month)
- ✅ **Landing page** (PR #6) - Terminal aesthetic hero
- ✅ **Vitest infrastructure** (PR #5) - Unit test setup with validator tests
- ✅ **Enhanced input validation** (PR #4) - Integer reps, weight rounding, duplicate detection
- ✅ **Sonner toast notifications** (PR #4) - Replaced alert() calls (most places)
- ✅ **Centralized error handler** (PR #4) - handleMutationError utility
- ✅ **Weight unit system** (PR #3) - kg/lbs toggle with data integrity
- ✅ **Mobile UX polish** (PR #3) - Responsive design, touch targets
- ✅ **Pre-commit hooks** - ESLint on commit with husky + lint-staged
- ✅ **SSR hydration fixes** - Resolved theme and clerk hydration issues
- ✅ **Undo toast** - Delete confirmation with undo functionality

### Deferred (Valid Suggestions for Future)
- Make "USE" button more prominent in last set display
- Add global weight unit toggle to nav/settings
- Add visual hint for Enter key functionality
- Add TypeCheck to lint-staged (may slow commits)
- JSDoc comments for all exported functions

### Archived (Not Pursuing)
- Native app features - PWA sufficient for now
- Social features - Not v1 scope
- Advanced AI insights - Unclear value proposition

---

## Decision Framework

### Prioritization Criteria
1. **Security**: Vulnerabilities blocking production deployment
2. **User Value**: Solves real user problems, prevents data loss
3. **Data Integrity**: Protects user data quality
4. **Developer Velocity**: Makes future development faster
5. **Risk**: Likelihood of failure/scope creep
6. **Dependencies**: What must exist before this?

### When to Implement Features
- **Immediate Concerns**: Before production deployment (security, data loss)
- **High-Value Improvements**: Next 1-2 sprints (architecture, critical UX)
- **Technical Debt**: When slowing down development or before major refactor
- **Nice to Have**: When metrics show need (slow load, user feedback)
- **Post-MVP Features**: After gathering real user feedback

---

## Summary Statistics

**Total Issues Identified**: 30+ new findings from comprehensive audit

**By Priority**:
- **CRITICAL**: 6 (~~7~~) - **1 FIXED: IDOR vulnerability** ✅
- **HIGH**: 11 (architecture, performance, critical UX)
- **MEDIUM**: 8 (technical debt, code quality)
- **LOW**: 4+ (polish, future-proofing)

**Cross-Validated (Multiple Perspectives)**:
- Type duplication (architecture + complexity)
- Dashboard god component (architecture + complexity + maintainability)
- Error handling inconsistency (maintainability + UX)
- Time formatting duplication (maintainability + complexity)

**Estimated Effort to Address All Critical/High**:
- **Immediate (CRITICAL)**: ~~6h~~ **3h remaining** (~~security~~ ✅ + data loss + types)
- **High-Value**: ~30h (architecture + performance + UX)
- **Total**: ~~36 hours~~ **33 hours remaining** of focused work

**Top 5 Quick Wins** (High Value, Low Effort):
1. ~~Fix listSets IDOR vulnerability (15m) - CRITICAL security~~ ✅ **COMPLETED**
2. Replace remaining alert() calls (15m) - UX consistency
3. Optimize last set query (15m) - Performance improvement
4. Fix O(n) exercise lookups (30m) - 50-100x performance gain
5. Block exercise deletion with sets (30m) - Data loss prevention

---

**Remember**: The best feature is the one users actually need, not the one that's technically impressive.

*This backlog is a living document. Update priorities based on real-world usage, user feedback, and measured impact.*

**Last Groomed**: 2025-10-07 by 6-perspective parallel audit
**Next Groom**: Quarterly or when priorities shift significantly
