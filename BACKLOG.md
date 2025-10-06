# BACKLOG: Volume Workout Tracker

*A map of opportunities to improve the product, codebase, and development experience.*

**Last Updated:** 2025-10-06
**Status:** Post-MVP - Clean codebase, ready for strategic improvements

---

## Immediate Concerns

*Issues that need attention right now - security, reliability, critical UX problems.*

### 1. Enhanced Input Validation ⚠️ PR REVIEW - CRITICAL FIXES NEEDED
**Effort:** 2 hours + 30 min fixes | **Value:** HIGH - Data integrity & security

**Status:** PR #4 under review. Critical bugs found, must fix before merge. See TODO.md Phase 5 for details.

**PR Review Findings (2025-10-06):**
- 🚨 **P1 Bug**: Client-side `parseInt()` bypasses server validation (data corruption risk)
- 🚨 **P1 Bug**: Weight lower bound inconsistency (0.1 vs 0 check)
- ✅ Enhancement: Empty exercise name error message

**PR Link:** https://github.com/phrazzld/volume/pull/4

**Implementation:**
- Integer-only reps validation (reject decimals)
- 2-decimal precision weight rounding
- Case-insensitive duplicate exercise detection (all names stored uppercase)
- Sonner toast notifications replacing alert()
- Centralized error handler utility

**Future Enhancements** (defer to post-implementation):
- ConvexError integration for structured error data (when error codes/retry logic needed)
- ESLint rule to enforce try-catch blocks on mutations
- Error tracking service (Sentry) integration with structured context
- Advanced validation: RPE (1-10 scale), tempo patterns, set tags
- Field-level validation errors (highlight specific form fields)

---

### 2. Error Boundary Implementation
**Effort:** 1 hour | **Value:** HIGH - Prevents catastrophic failures

**Current State:** No error boundaries exist. Any uncaught error crashes the entire app (white screen of death).

**Impact:**
- ❌ Poor user experience on runtime errors
- ❌ Complete loss of user state/data on crash
- ❌ No graceful degradation

**Fix:** Create `src/components/ErrorBoundary.tsx`:
```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    // TODO: Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="border border-terminal-danger p-6 max-w-md">
            <h2 className="text-terminal-danger font-bold mb-2">ERROR</h2>
            <p className="text-terminal-text mb-4">
              Something went wrong. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-terminal-info text-terminal-bg"
            >
              RELOAD
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Then wrap in `src/app/layout.tsx` around `<ConvexClientProvider>`.

**Benefits:**
- ✅ Graceful error recovery instead of blank screen
- ✅ User can reload and retry
- ✅ Foundation for error tracking integration

---

### 3. Type Safety Fixes
**Effort:** 30 minutes | **Value:** MEDIUM - Prevents runtime bugs

**Current State:** Two type safety violations found:

**Issue 1:** `src/app/page.tsx:63` - `any` type defeats TypeScript
```typescript
const handleRepeatSet = (set: any) => {  // ❌ Unsafe
  formRef.current?.repeatSet(set);
}
```

**Issue 2:** `src/app/page.tsx:139` - Unsafe cast and dummy data
```typescript
setTimeout(() => {
  formRef.current?.repeatSet({
    _id: "" as Id<"sets">,  // ❌ Empty string cast to ID
    exerciseId,
    reps: 0,  // ❌ Dummy data
    performedAt: Date.now(),
  });
}, 100);
```

**Fix:**
```typescript
// Import proper type
import { Doc } from "@/convex/_generated/dataModel";
type Set = Doc<"sets">;

// Fix handleRepeatSet
const handleRepeatSet = (set: Set) => {
  formRef.current?.repeatSet(set);
};

// Fix first exercise created - use selectExercise method instead
const handleFirstExerciseCreated = (exerciseId: Id<"exercises">) => {
  setTimeout(() => {
    formRef.current?.selectExercise(exerciseId);
  }, 100);
};
```

Update `QuickLogForm` interface:
```typescript
export interface QuickLogFormHandle {
  repeatSet: (set: Set) => void;
  selectExercise: (exerciseId: Id<"exercises">) => void;  // NEW
}
```

**Benefits:**
- ✅ Full TypeScript safety restored
- ✅ Prevents runtime type errors
- ✅ Better IDE autocomplete and refactoring

---

### 3A. Exercise Name Uppercase Migration 🆕 FROM PR REVIEW
**Effort:** 15 minutes | **Value:** MEDIUM - Data consistency

**Status:** Deferred from PR #4, recommended for post-merge cleanup.

**Context:**
PR #4 implements uppercase normalization for exercise names (all stored as "PUSH-UPS" not "push-ups"). However, normalization is gradual - only applies when exercises are created or updated. This creates potential issues:
- Mixed-case exercises coexist indefinitely if never edited
- Duplicate detection only works for new/updated exercises
- User confusion: "push-ups" and "PUSH-UPS" could both exist

**Migration Script:**
```typescript
// convex/migrations/uppercaseExerciseNames.ts
import { mutation } from "./_generated/server";

/**
 * One-time migration: Convert all exercise names to uppercase.
 * Run once after PR #4 is merged.
 */
export default mutation({
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    let updated = 0;

    for (const exercise of exercises) {
      const uppercase = exercise.name.toUpperCase();
      if (exercise.name !== uppercase) {
        await ctx.db.patch(exercise._id, { name: uppercase });
        updated++;
      }
    }

    return { total: exercises.length, updated };
  },
});
```

**Execution:**
```bash
# After PR #4 is merged and deployed
pnpm convex run migrations/uppercaseExerciseNames
# Expected output: { total: 15, updated: 12 } (example)
```

**Benefits:**
- ✅ Immediate data consistency (all exercises uppercase)
- ✅ Duplicate detection works for all exercises, not just new ones
- ✅ Prevents user confusion from mixed-case names
- ✅ Clean slate for production data

**Risks:** LOW - Non-destructive transformation, idempotent (safe to re-run)

**Source:** Claude AI Review feedback on PR #4

---

### 4. Loading States for Mutations
**Effort:** 2 hours | **Value:** MEDIUM - Prevents UX issues

**Current State:** Mutations lack loading states, allowing:
- Double-clicks causing duplicate operations
- No feedback during slow network conditions
- User confusion about action success

**Locations:**
- `src/components/dashboard/exercise-manager.tsx:52-63` - Update exercise
- `src/components/dashboard/inline-exercise-creator.tsx` - Create exercise
- Various delete operations

**Example Fix** (`exercise-manager.tsx`):
```typescript
const [isUpdating, setIsUpdating] = useState(false);

const handleSaveEdit = async (exerciseId: Id<"exercises">) => {
  if (!editingName.trim() || isUpdating) return;

  setIsUpdating(true);
  try {
    await updateExercise({ id: exerciseId, name: editingName.trim() });
    setEditingId(null);
    setEditingName("");
  } catch (error) {
    console.error("Failed to update exercise:", error);
    // TODO: Replace with toast notification
    alert("Failed to update exercise. Please try again.");
  } finally {
    setIsUpdating(false);
  }
};

// In JSX
<button
  onClick={() => handleSaveEdit(exercise._id)}
  disabled={isUpdating}
  className={isUpdating ? "opacity-50 cursor-not-allowed" : ""}
>
  {isUpdating ? <span>...</span> : <Check className="h-5 w-5" />}
</button>
```

**Apply to:**
- Exercise create/update/delete
- Set logging/deletion
- All mutation operations

**Benefits:**
- ✅ Prevents race conditions from double-clicks
- ✅ Clear feedback during network operations
- ✅ Better perceived performance

---

## High-Value Improvements

*Changes that would significantly improve user experience, developer velocity, or system reliability.*

### 5. Comprehensive Accessibility Audit
**Effort:** 3-4 hours | **Value:** HIGH - Inclusive design, WCAG compliance

**Current State:** Minimal ARIA attributes. Issues found:
- No `role` attributes on custom interactive elements
- No `aria-live` regions for dynamic content updates
- No `aria-expanded` on collapsible panels
- Missing `aria-label` on icon-only buttons
- No keyboard event handlers for custom clickable elements

**Specific Fixes Needed:**

**TerminalPanel Collapsible** (`src/components/ui/terminal-panel.tsx`):
```typescript
<div
  className={...}
  onClick={toggleCollapsed}
  role="button"
  tabIndex={0}
  aria-expanded={!isCollapsed}
  aria-controls={`panel-${storageKey}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCollapsed();
    }
  }}
>
```

**UndoToast Live Region** (`src/components/dashboard/undo-toast.tsx`):
```typescript
<div
  className="..."
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
```

**Icon Buttons** (exercise-manager, set-card, etc.):
```typescript
<button
  onClick={handleDelete}
  aria-label="Delete exercise"
  title="Delete exercise"
>
  <Trash2 className="h-5 w-5" />
</button>
```

**DailyStatsCard Collapsible** (`src/components/dashboard/daily-stats-card.tsx:113-116`):
```typescript
<button
  onClick={() => setShowBreakdown(!showBreakdown)}
  aria-expanded={showBreakdown}
  aria-controls="exercise-breakdown"
>
```

**Checklist:**
- [ ] Add ARIA roles to all custom interactive elements
- [ ] Add aria-label to all icon-only buttons
- [ ] Add aria-expanded to collapsible sections
- [ ] Add aria-live regions for dynamic updates (toasts, form submissions)
- [ ] Add keyboard event handlers (Enter, Space) for custom clickables
- [ ] Test with screen reader (VoiceOver on macOS)
- [ ] Verify focus visible styles on all interactive elements
- [ ] Run axe DevTools accessibility audit

**Benefits:**
- ✅ WCAG 2.1 AA compliance
- ✅ Better experience for screen reader users
- ✅ Full keyboard-only navigation support
- ✅ Broader audience reach

---

### 6. Optimistic Updates
**Effort:** 3-4 hours | **Value:** MEDIUM-HIGH - Better perceived performance

**Current State:** All mutations wait for server response before updating UI. This feels slow, especially on mobile networks.

**Implementation:** Use Convex's `.withOptimisticUpdate()` for instant feedback:

```typescript
// Example: Delete set with optimistic update
const deleteSet = useMutation(api.sets.deleteSet).withOptimisticUpdate(
  (localStore, args) => {
    // Remove set immediately from local state
    const currentSets = localStore.getQuery(api.sets.listSets, {});
    if (currentSets) {
      localStore.setQuery(
        api.sets.listSets,
        {},
        currentSets.filter(s => s._id !== args.id)
      );
    }
  }
);

// Example: Log set with optimistic update
const logSet = useMutation(api.sets.logSet).withOptimisticUpdate(
  (localStore, args) => {
    const currentSets = localStore.getQuery(api.sets.listSets, {});
    if (currentSets) {
      // Add new set to local state immediately
      const optimisticSet = {
        _id: "temp" as Id<"sets">, // Temporary ID
        ...args,
        userId: "current-user",
        performedAt: Date.now(),
        _creationTime: Date.now(),
      };
      localStore.setQuery(
        api.sets.listSets,
        {},
        [optimisticSet, ...currentSets]
      );
    }
  }
);
```

**Apply to:**
- Create/delete exercises
- Log/delete sets
- Update exercise names

**Query Optimization (Related - from PR review):**
Currently `quick-log-form.tsx:60-68` fetches ALL sets then filters client-side to find last set for selected exercise. This wastes bandwidth and CPU.

**Better approach:**
```typescript
// Current (inefficient)
const allSets = useQuery(api.sets.listSets, {});
const lastSet = useMemo(() => {
  const exerciseSets = allSets?.filter(s => s.exerciseId === selectedExerciseId);
  return exerciseSets?.[0] ?? null;
}, [selectedExerciseId, allSets]);

// Optimized (query only needed sets)
const exerciseSets = useQuery(
  api.sets.listSets,
  selectedExerciseId ? { exerciseId: selectedExerciseId } : "skip"
);
const lastSet = exerciseSets?.[0] ?? null;
```

**Benefits:**
- ✅ Reduced data transfer (only fetch sets for one exercise, not all)
- ✅ Faster client-side processing (no filtering needed)
- ✅ Better performance as dataset grows

**Source:** Claude AI Review feedback on PR #4

**Benefits:**
- ✅ Instant UI updates (feels native-app fast)
- ✅ Better mobile experience on slow connections
- ✅ Users can continue workflow immediately
- ✅ Automatic rollback on failure (Convex handles this)

---

### 7. Modern Error Handling System ✅ BEING IMPLEMENTED
**Effort:** 2 hours | **Value:** MEDIUM - Better UX, more professional

**Status:** Being implemented as part of Enhanced Input Validation (item #1). See TODO.md Phase 2.

**Implementation Approach:** Using Sonner library instead of custom toast component.
- ✅ Sonner (by Emil Kowalski) - 3KB, battle-tested, accessible
- ✅ Centralized error handler utility (`src/lib/error-handler.ts`)
- ✅ Terminal theme styling
- ✅ User-friendly error message mapping

**Original Plan (SUPERSEDED):** ~~Extend existing `UndoToast` pattern into generic `Toast` component~~

**Why Sonner:** Don't reinvent the wheel - Sonner provides polish, accessibility, and features that would take weeks to replicate. Used by Vercel, shadcn/ui, and thousands of production apps.

**Step 1 (SUPERSEDED):** ~~Extend existing `UndoToast` pattern into generic `Toast` component~~
```typescript
// src/components/ui/toast.tsx
export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const colors = {
    success: "border-terminal-success text-terminal-success",
    error: "border-terminal-danger text-terminal-danger",
    info: "border-terminal-info text-terminal-info",
    warning: "border-terminal-warning text-terminal-warning",
  };

  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} ...`}>
      {message}
      <button onClick={onClose}>×</button>
    </div>
  );
}
```

**Step 2:** Create toast context/hook:
```typescript
// src/contexts/ToastContext.tsx
export function useToast() {
  return {
    success: (message: string) => { /* ... */ },
    error: (message: string) => { /* ... */ },
    info: (message: string) => { /* ... */ },
  };
}
```

**Step 3:** Create error handler utility:
```typescript
// src/lib/error-handler.ts
export function handleMutationError(
  error: unknown,
  context: string,
  toast: ReturnType<typeof useToast>
) {
  const message = error instanceof Error ? error.message : "Unknown error";

  // Log for debugging
  console.error(`[${context}]:`, error);

  // Show user-friendly message
  toast.error(getUserFriendlyMessage(message));

  // TODO: Send to error tracking service (Sentry)
}

function getUserFriendlyMessage(errorMessage: string): string {
  // Map technical errors to friendly messages
  if (errorMessage.includes("Not authenticated")) {
    return "Please sign in to continue";
  }
  if (errorMessage.includes("Not authorized")) {
    return "You don't have permission for this action";
  }
  return "Something went wrong. Please try again.";
}
```

**Step 4:** Replace all `alert()` calls with toast notifications:
```typescript
// Before
} catch (error) {
  console.error("Failed to delete set:", error);
  alert("Failed to delete set. Please try again.");
}

// After
} catch (error) {
  handleMutationError(error, "Delete Set", toast);
}
```

**Locations to update:**
- `quick-log-form.tsx:103, 127`
- `grouped-set-history.tsx:44, 51`
- `set-card.tsx:33`
- `exercise-manager.tsx:62, 77, 94`
- `inline-exercise-creator.tsx:39`

**Benefits:**
- ✅ Non-modal, dismissible notifications
- ✅ Mobile-friendly
- ✅ Consistent UX across all errors
- ✅ User-friendly error messages
- ✅ Foundation for error tracking integration

---

### 8. Rate Limiting on Mutations
**Effort:** 2-3 hours | **Value:** MEDIUM - Prevents abuse, cost control

**Current State:** No rate limiting. Users can spam mutations:
- Create thousands of exercises/sets rapidly
- Database pollution
- Increased Convex costs
- Potential DoS attack vector

**Implementation:**

**Option 1: Client-side throttling** (Quick win):
```typescript
// src/hooks/useThrottledMutation.ts
import { useMutation } from "convex/react";
import { useRef } from "react";

export function useThrottledMutation<Args, Result>(
  mutation: any,
  cooldownMs: number = 1000
) {
  const lastCall = useRef<number>(0);
  const base = useMutation(mutation);

  return async (args: Args): Promise<Result> => {
    const now = Date.now();
    if (now - lastCall.current < cooldownMs) {
      throw new Error("Please wait before trying again");
    }
    lastCall.current = now;
    return await base(args);
  };
}

// Usage
const logSet = useThrottledMutation(api.sets.logSet, 500); // 500ms cooldown
```

**Option 2: Server-side rate limiting** (Better security):
```typescript
// convex/rateLimit.ts
import { mutation } from "./_generated/server";

const RATE_LIMITS = {
  createExercise: { limit: 10, windowMs: 60000 }, // 10 per minute
  logSet: { limit: 60, windowMs: 60000 },         // 60 per minute
  deleteSet: { limit: 30, windowMs: 60000 },      // 30 per minute
};

// TODO: Implement rate limit check using Convex storage
// Store user:action:timestamp entries, check count within window
```

**Recommendation:** Start with client-side throttling (quick), add server-side later.

**Benefits:**
- ✅ Prevents accidental spam (double-clicks, stuck keys)
- ✅ Protects against malicious abuse
- ✅ Controls backend costs
- ✅ Better user experience (intentional throttling)

---

### 9. Custom Convex Hooks (DRY Up Query/Mutation Usage)
**Effort:** 2 hours | **Value:** MEDIUM - Better code organization

**Current State:** Direct `useQuery`/`useMutation` calls scattered across components. This leads to:
- Code duplication
- Inconsistent error handling
- Hard to add cross-cutting concerns (logging, analytics)

**Implementation:** Create custom hooks that encapsulate common patterns:

```typescript
// src/hooks/useExercises.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/contexts/ToastContext";

export function useExercises() {
  const toast = useToast();
  const exercises = useQuery(api.exercises.listExercises);
  const createMutation = useMutation(api.exercises.createExercise);
  const updateMutation = useMutation(api.exercises.updateExercise);
  const deleteMutation = useMutation(api.exercises.deleteExercise);

  const createExercise = async (name: string) => {
    try {
      const id = await createMutation({ name });
      toast.success(`Created "${name}"`);
      return id;
    } catch (error) {
      handleMutationError(error, "Create Exercise", toast);
      throw error;
    }
  };

  const updateExercise = async (id: Id<"exercises">, name: string) => {
    try {
      await updateMutation({ id, name });
      toast.success("Exercise updated");
    } catch (error) {
      handleMutationError(error, "Update Exercise", toast);
      throw error;
    }
  };

  const deleteExercise = async (id: Id<"exercises">) => {
    try {
      await deleteMutation({ id });
      toast.success("Exercise deleted");
    } catch (error) {
      handleMutationError(error, "Delete Exercise", toast);
      throw error;
    }
  };

  return {
    exercises,
    createExercise,
    updateExercise,
    deleteExercise,
    isLoading: exercises === undefined,
  };
}

// src/hooks/useSets.ts
export function useSets(exerciseId?: Id<"exercises">) {
  const toast = useToast();
  const sets = useQuery(api.sets.listSets, { exerciseId });
  const logMutation = useMutation(api.sets.logSet);
  const deleteMutation = useMutation(api.sets.deleteSet);

  const logSet = async (args: LogSetArgs) => {
    try {
      const id = await logMutation(args);
      toast.success("Set logged!");
      return id;
    } catch (error) {
      handleMutationError(error, "Log Set", toast);
      throw error;
    }
  };

  const deleteSet = async (id: Id<"sets">) => {
    try {
      await deleteMutation({ id });
      toast.success("Set deleted");
    } catch (error) {
      handleMutationError(error, "Delete Set", toast);
      throw error;
    }
  };

  return {
    sets,
    logSet,
    deleteSet,
    isLoading: sets === undefined,
  };
}
```

**Usage in components:**
```typescript
// Before
const exercises = useQuery(api.exercises.listExercises);
const createExercise = useMutation(api.exercises.createExercise);
// ... handle errors, show toasts, etc.

// After
const { exercises, createExercise, isLoading } = useExercises();
```

**Benefits:**
- ✅ Centralized error handling
- ✅ Consistent toast notifications
- ✅ Easy to add analytics, logging, etc.
- ✅ Simpler component code
- ✅ Better testability

---

## Technical Debt Worth Paying

*Refactorings and improvements that make future development easier and faster.*

### 10. Test Suite Implementation
**Effort:** 1-2 days (initial setup + critical tests) | **Value:** HIGH - Long-term velocity

**Current State:** Zero automated tests. Risks:
- Regressions when adding features
- Fear of refactoring
- No validation of business logic
- Manual testing overhead

**Implementation Plan:**

**Step 1:** Install testing dependencies
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitejs/plugin-react
```

**Step 2:** Configure Vitest (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3:** Test priority order:

**High Priority (Business Logic):**
- [ ] `src/lib/dashboard-utils.test.ts`
  - `convertWeight()` - Critical for data integrity
  - `calculateDailyStats()` - Ensure accurate stats
  - `calculateDailyStatsByExercise()` - Group by logic
  - `groupSetsByDay()` - Date grouping edge cases

**Medium Priority (Components):**
- [ ] `src/components/dashboard/quick-log-form.test.tsx`
  - Form validation (empty reps, invalid weight)
  - Unit toggle functionality
  - Auto-focus behavior
  - Repeat set functionality

**Lower Priority (UI Components):**
- [ ] Smoke tests for each page
- [ ] Navigation component tests
- [ ] Theme toggle tests

**Example Test:**
```typescript
// src/lib/dashboard-utils.test.ts
import { describe, it, expect } from 'vitest';
import { convertWeight, calculateDailyStats } from './dashboard-utils';

describe('convertWeight', () => {
  it('converts lbs to kg correctly', () => {
    expect(convertWeight(220, 'lbs', 'kg')).toBeCloseTo(99.79, 2);
  });

  it('converts kg to lbs correctly', () => {
    expect(convertWeight(100, 'kg', 'lbs')).toBeCloseTo(220.46, 2);
  });

  it('returns same value for same unit', () => {
    expect(convertWeight(100, 'lbs', 'lbs')).toBe(100);
  });
});

describe('calculateDailyStats', () => {
  it('returns null for empty sets', () => {
    expect(calculateDailyStats([])).toBeNull();
  });

  it('filters to today\'s sets only', () => {
    const yesterday = Date.now() - 86400000;
    const sets = [
      { performedAt: Date.now(), reps: 10, exerciseId: "ex1" },
      { performedAt: yesterday, reps: 20, exerciseId: "ex1" },
    ];
    const stats = calculateDailyStats(sets);
    expect(stats?.totalReps).toBe(10); // Only today's reps
  });

  it('converts weights to target unit for volume calculation', () => {
    const sets = [
      { performedAt: Date.now(), reps: 10, weight: 100, unit: 'kg', exerciseId: "ex1" },
    ];
    const stats = calculateDailyStats(sets, 'lbs');
    expect(stats?.totalVolume).toBeCloseTo(2204.6, 1); // 10 reps * ~220.46 lbs
  });
});
```

**Add npm scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Benefits:**
- ✅ Catch regressions before deployment
- ✅ Confidence to refactor
- ✅ Documentation via tests
- ✅ Faster development (no manual testing)

---

### 11. Shared Validation Layer
**Effort:** 2 hours | **Value:** MEDIUM - DRY principle, consistency

**Current State:** Validation logic scattered across mutations. Leads to:
- Duplication if we add client-side validation
- Inconsistency between endpoints
- Hard to update validation rules

**Implementation:**

```typescript
// convex/validators.ts
export const validateReps = (reps: number): void => {
  if (!Number.isInteger(reps) || reps <= 0 || reps > 1000) {
    throw new Error("Reps must be a positive integer between 1 and 1000");
  }
};

export const validateWeight = (weight: number | undefined): number | undefined => {
  if (weight === undefined) return undefined;

  if (!isFinite(weight) || weight <= 0 || weight > 10000) {
    throw new Error("Weight must be between 0.1 and 10000");
  }

  // Round to 2 decimal places
  return Math.round(weight * 100) / 100;
};

export const validateUnit = (unit: string | undefined, weight: number | undefined): void => {
  if (weight !== undefined) {
    if (!unit || (unit !== "lbs" && unit !== "kg")) {
      throw new Error("Unit must be 'lbs' or 'kg' when weight is provided");
    }
  }
};

export const validateExerciseName = (name: string): string => {
  const trimmed = name.trim();

  if (trimmed.length < 2 || trimmed.length > 100) {
    throw new Error("Exercise name must be 2-100 characters");
  }

  return trimmed;
};

// Composite validators for common patterns
export interface ValidatedSetInput {
  reps: number;
  weight?: number;
  unit?: "lbs" | "kg";
}

export const validateSetInput = (input: {
  reps: number;
  weight?: number;
  unit?: string;
}): ValidatedSetInput => {
  validateReps(input.reps);
  const weight = validateWeight(input.weight);
  validateUnit(input.unit, weight);

  return {
    reps: input.reps,
    weight,
    unit: input.unit as "lbs" | "kg" | undefined,
  };
};
```

**Usage in mutations:**
```typescript
// convex/sets.ts
import { validateSetInput } from "./validators";

export const logSet = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Single line validation
    const validated = validateSetInput(args);

    // Verify exercise ownership
    const exercise = await ctx.db.get(args.exerciseId);
    // ...

    await ctx.db.insert("sets", {
      userId: identity.subject,
      exerciseId: args.exerciseId,
      ...validated,
      performedAt: Date.now(),
    });
  },
});
```

**Benefits:**
- ✅ Single source of truth for validation rules
- ✅ Easy to add client-side validation (import same validators)
- ✅ Consistent error messages
- ✅ Testable in isolation
- ✅ Easy to update rules globally

---

### 12. Extract Duplicate Time Formatting Logic
**Effort:** 30 minutes | **Value:** LOW-MEDIUM - Code quality

**Current State:** Duplicate relative time formatting in 3 components with slight variations:
- `quick-log-form.tsx:68-77`
- `grouped-set-history.tsx:56-73`
- `set-card.tsx:45-59`

**Fix:** Create shared utility:

```typescript
// src/lib/time-utils.ts

/**
 * Format a timestamp as relative time (e.g., "2m ago", "3h ago", "2d ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  // Older than 7 days: show date
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format absolute time (e.g., "2:34 PM")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
```

**Replace in components:**
```typescript
// Before (68-77 lines of duplicate logic)
const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffMs = now - timestamp;
  // ... 10 more lines ...
};

// After (1 import, 1 line)
import { formatRelativeTime } from "@/lib/time-utils";
<span className="...">{formatRelativeTime(set.performedAt)}</span>
```

**Benefits:**
- ✅ DRY principle - single source of truth
- ✅ Consistent formatting across app
- ✅ Easier to test in isolation
- ✅ Easier to add i18n later

---

### 13. Extract Magic Numbers
**Effort:** 5 minutes | **Value:** LOW - Code clarity

**Current State:** Hardcoded `setTimeout(..., 100)` in `quick-log-form.tsx:86, 121`

**Fix:**
```typescript
// At top of quick-log-form.tsx
/**
 * Small delay to allow DOM to update before focusing next input.
 * Prevents race condition where ref is not yet attached.
 */
const FOCUS_DELAY_MS = 100;

// Usage
setTimeout(() => {
  repsInputRef.current?.select();
}, FOCUS_DELAY_MS);
```

**Benefits:**
- ✅ Self-documenting code
- ✅ Easy to adjust if needed
- ✅ Searchable constant name

---

### 14. Fix Hydration Mismatch in WeightUnitContext
**Effort:** 30 minutes | **Value:** MEDIUM - Prevents React warnings

**Current State:** `src/contexts/WeightUnitContext.tsx:16-32` initializes state from localStorage during render, causing hydration mismatch:
- Server renders with "lbs"
- Client may have "kg" in localStorage
- React hydration warning

**Fix:**
```typescript
// src/contexts/WeightUnitContext.tsx
export function WeightUnitProvider({ children }: { children: React.ReactNode }) {
  // Always start with default to match SSR
  const [unit, setUnit] = useState<WeightUnit>("lbs");
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with localStorage after hydration
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

  // Update localStorage when unit changes
  useEffect(() => {
    if (!isHydrated) return; // Don't write during initial hydration

    try {
      localStorage.setItem("weightUnit", unit);
    } catch (error) {
      console.warn("Failed to save weight unit preference:", error);
    }
  }, [unit, isHydrated]);

  const toggleUnit = () => {
    setUnit((prev) => (prev === "lbs" ? "kg" : "lbs"));
  };

  return (
    <WeightUnitContext.Provider value={{ unit, toggleUnit }}>
      {children}
    </WeightUnitContext.Provider>
  );
}
```

**Benefits:**
- ✅ No hydration warnings
- ✅ No flash of wrong content
- ✅ Cleaner separation of SSR/client logic

---

### 15. Focus Management for Keyboard Navigation
**Effort:** 1 hour | **Value:** MEDIUM - Accessibility

**Current State:** Modal-like components (toasts, inline creators) don't trap focus, allowing keyboard users to tab out.

**Implementation:** Add focus trap to:
- `inline-exercise-creator.tsx` - When creating exercise inline
- Toast notifications (when implemented)

**Example:**
```typescript
// src/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);

  return containerRef;
}

// Usage in inline-exercise-creator.tsx
const trapRef = useFocusTrap(isCreating);

<div ref={trapRef}>
  <input ref={inputRef} ... />
  <button>Create</button>
</div>
```

**Benefits:**
- ✅ Better keyboard navigation
- ✅ Prevents focus escaping from active UI
- ✅ WCAG 2.1 compliance

---

## Nice to Have

*Improvements that would be valuable but aren't urgent - optimizations, polish, quality-of-life.*

### 16. Fix Hardcoded Colors in UndoToast
**Effort:** 5 minutes | **Value:** LOW - Visual consistency

**Location:** `src/components/dashboard/undo-toast.tsx:27-30`

**Current:**
```typescript
<CornerBracket position="top-left" color="#00ff00" />
```

**Fix:**
```typescript
<CornerBracket position="top-left" color="var(--terminal-success)" />
```

**Benefits:**
- ✅ Respects theme changes
- ✅ Consistent with design system

---

### 17. Dependency Updates
**Effort:** 10 minutes | **Value:** LOW - Security patches, bug fixes

**Current State:** Some minor updates available:
- `@clerk/nextjs`: 6.33.1 → 6.33.2 (patch)
- `eslint`: 9.36.0 → 9.37.0 (minor)

**⚠️ WARNING:** DO NOT upgrade to Tailwind v4.x - major breaking changes

**Command:**
```bash
pnpm update @clerk/nextjs eslint
pnpm audit  # Check for security vulnerabilities
```

**Benefits:**
- ✅ Latest bug fixes
- ✅ Security patches

---

### 18. Bundle Size Optimization
**Effort:** 1 hour | **Value:** LOW - Performance (not critical at current scale)

**Current State:** Importing entire `lucide-react` package. Could optimize by importing specific icons.

**Analysis needed:**
```bash
pnpm build
# Check .next/analyze or use @next/bundle-analyzer
```

**Potential optimizations:**
- Import specific icons instead of entire package
- Code splitting by route (already done by Next.js)
- Consider switching to lighter icon library if needed

**Only pursue if bundle exceeds 300KB initial load.**

---

### 19. Error Tracking Service Integration
**Effort:** 2 hours | **Value:** LOW-MEDIUM - Production monitoring

**When to implement:** After MVP gains users

**Options:**
- Sentry (recommended - great DX, generous free tier)
- LogRocket (session replay + error tracking)
- Rollbar (simpler alternative)

**Implementation outline:**
```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out known issues, PII, etc.
    return event;
  },
});
```

**Benefits:**
- ✅ Automatic error reporting
- ✅ Stack traces from production
- ✅ User context (affected users)
- ✅ Performance monitoring

---

### 20. Pagination for Large Datasets
**Effort:** 3 hours | **Value:** LOW - Future-proofing

**Current State:** `listSets` fetches ALL sets. This is fine for MVP but will become slow with:
- 1000+ sets
- Multiple years of data

**When to implement:** When users report slow loading or you see query performance issues

**Implementation:**
```typescript
// convex/sets.ts
export const listSetsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };

    return await ctx.db
      .query("sets")
      .withIndex("by_user_performed", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

**Frontend:**
```typescript
const { results, status, loadMore } = usePaginatedQuery(
  api.sets.listSetsPaginated,
  {},
  { initialNumItems: 50 }
);
```

**Benefits:**
- ✅ Faster initial load
- ✅ Reduced memory usage
- ✅ Better UX for power users

---

### 21. Virtualized Scrolling for Long Lists
**Effort:** 2 hours | **Value:** LOW - Performance optimization

**Current State:** Rendering all sets in DOM. Fine for <100 sets, but 1000+ sets will lag.

**When to implement:** When users report scroll lag

**Library:** `react-window` or `@tanstack/react-virtual`

```bash
pnpm add react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={sets.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <SetCard set={sets[index]} />
    </div>
  )}
</FixedSizeList>
```

**Benefits:**
- ✅ Smooth scrolling with 1000+ items
- ✅ Lower memory usage
- ✅ Better mobile performance

---

## Post-MVP Features

*Features from original backlog, reorganized by strategic value.*

### High Priority (v1.1) - User Requested Features

#### Analytics & Insights
**Effort:** 2-3 days | **Value:** HIGH - Core value proposition

- [ ] **Daily/weekly/monthly aggregation stats**
  - Total reps per exercise per period
  - Total volume (reps × weight) for weighted exercises
  - Average reps/sets per day
  - *Implementation:* Add `daily_exercise_stats` aggregation table in Convex, cron job for rollups

- [ ] **Charts and visualizations**
  - Line chart: reps/volume over time per exercise
  - Bar chart: total volume by exercise this week/month
  - Use Recharts (recommended - good bundle size, easy API)
  - *Location:* New `/analytics` page

- [ ] **Personal Records (PRs)**
  - Track max reps (bodyweight exercises)
  - Track max weight (weighted exercises)
  - "New PR!" celebration when beaten with confetti animation
  - PR history timeline

- [ ] **Streak tracking**
  - Consecutive days with ≥1 set logged
  - Per-exercise streaks
  - Calendar heatmap view (GitHub-style)
  - Streak recovery (grace period for missed days)

**Dependencies:** None - can start immediately after current improvements

---

#### Offline-First Architecture
**Effort:** 3-4 days | **Value:** MEDIUM-HIGH - Enables true anywhere usage

- [ ] **Add Dexie.js for local IndexedDB storage**
  - Mirror Convex schema locally
  - Write to Dexie first (instant feedback)
  - Background sync queue to Convex
  - Use ULID-based IDs for offline creation

- [ ] **Sync conflict resolution**
  - Last-write-wins strategy
  - Maintain `updatedAt` timestamps
  - Handle concurrent edits across devices

- [ ] **Offline indicator UI**
  - Online/offline status badge in nav
  - Pending sync count indicator
  - Manual "sync now" button
  - Sync error notifications

- [ ] **Service Worker for PWA**
  - Cache static assets
  - Background sync API
  - Push notifications (optional)

**When to implement:** When users request offline support or gym has poor connectivity

---

#### Data Portability
**Effort:** 1 day | **Value:** MEDIUM - Builds trust, enables migration

- [ ] **Export functionality**
  - CSV export: `exercise_name, reps, weight, unit, timestamp`
  - JSON export: Full data with IDs (for re-import)
  - Download as file (client-side with Blob API)
  - Include schema version in exports

- [ ] **Import functionality**
  - Parse CSV/JSON with validation
  - Deduplication by ULID + timestamp
  - Merge strategy: skip duplicates, add new
  - Support Strong/FitNotes CSV formats
  - Progress indicator for large imports

- [ ] **Backup automation** (Future)
  - Daily auto-backup to Convex storage
  - Restore from backup UI
  - Version history (last 30 days)

**Dependencies:** Enhanced validation layer (item #11)

---

### Medium Priority (v1.2) - UX Polish

#### Enhanced Set Logging UI
**Effort:** 2 days | **Value:** MEDIUM - Improves daily usage

- [ ] **Additional set metadata**
  - RPE (Rate of Perceived Exertion) 1-10 slider
  - Notes field (optional, e.g., "felt strong today")
  - Timestamp adjuster (backlog sets from earlier)
  - Tags: "warmup", "dropset", "amrap"

- [ ] **Undo functionality** (already partially implemented)
  - Extend current undo toast to all operations
  - Action queue for undo/redo
  - 5s timeout before permanent deletion

- [ ] **Quick-log shortcuts**
  - Pin favorite exercises to home
  - One-tap to repeat last set (already implemented)
  - Recent exercises at top (already implemented via recency sort)

- [ ] **Custom numeric keypad** (mobile-specific)
  - Touch-optimized for mobile
  - Quick +5 reps button
  - Decimal support for weight (e.g., 22.5kg)
  - Large tap targets (≥48px) with haptic feedback

**Design notes:**
- Zero layout shift during input
- Maintain current fast keyboard flow on desktop
- Progressive enhancement for mobile

---

#### Exercise Management Enhancements
**Effort:** 1 day | **Value:** MEDIUM

- [ ] **Exercise types**
  - Bodyweight vs Weighted vs Timed vs Distance
  - Default unit per exercise (kg/lb/none/seconds/meters)
  - Type-specific UI hints

- [ ] **Exercise library**
  - Pre-populated common exercises (100+ exercises)
  - Custom user-created exercises (keep current flow)
  - Search and filter
  - Exercise templates with suggested rep ranges

- [ ] **Tags and categories**
  - Multi-tag support (e.g., "push", "upper", "compound")
  - Filter exercises by tag
  - Color coding
  - Smart suggestions based on usage patterns

---

#### Workout Sessions (Optional Grouping)
**Effort:** 2 days | **Value:** LOW-MEDIUM - Organization feature

- [ ] **Session concept**
  - Group sets into named sessions (e.g., "Upper Body A")
  - Start/end session with timestamps
  - Session notes
  - Session duration tracking

- [ ] **Session history**
  - List past sessions
  - Repeat session feature
  - Compare sessions over time

- [ ] **Rest timer**
  - Set-to-set rest countdown
  - Customizable per exercise
  - Notification when rest complete
  - Auto-start option

**Note:** Optional feature - sets work standalone without sessions

---

## Completed & Archived

### Recently Completed
- ✅ **Weight unit system** (PR #3) - kg/lbs toggle with data integrity
- ✅ **Mobile UX polish** (PR #3) - Responsive design, touch targets
- ✅ **Pre-commit hooks** - ESLint on commit with husky + lint-staged
- ✅ **SSR hydration fixes** - Resolved theme and clerk hydration issues
- ✅ **Undo toast** - Delete confirmation with undo functionality

### Deferred from PR #3 Review
*Valid suggestions deferred to maintain PR focus. Addressed above in appropriate sections.*

- Replace alert/confirm with Toast System → Item #7
- Extract time formatting utility → Item #12
- Extract magic numbers → Item #13
- Add ARIA labels → Item #5
- Add screen reader live regions → Item #5
- Verify color contrast ratios → Item #5
- Add JSDoc comments → Future documentation task
- Optimize Convex query for last set → Item #20 (pagination)
- Add loading/error states → Item #4
- Handle edge case: deleted exercise → Will handle with error boundaries
- Add TypeCheck to lint-staged → Evaluate performance, defer for now
- Add global weight unit toggle → Current in-form toggle is sufficient
- Add visual hint for Enter key → Current UX is discoverable
- Make "USE" button more prominent → Current design is functional

### Archived (Not Pursuing)
- **Add TypeCheck to lint-staged** - May slow commits excessively, run in CI instead
- **Native app features** - PWA sufficient for now, reassess based on user demand
- **Social features** - Product direction decision, not v1 scope
- **Advanced AI insights** - Experimental, unclear value proposition

---

## Decision Framework

### Prioritization Criteria
1. **User Value**: Does this solve a real user problem?
2. **Data Integrity**: Does this protect user data quality?
3. **Developer Velocity**: Does this make future development faster?
4. **Risk**: What's likelihood of failure/scope creep?
5. **Dependencies**: What must exist before this?

### When to Implement Features
- **Immediate Concerns**: Before production deployment
- **High-Value Improvements**: Next 1-2 sprints
- **Technical Debt**: When slowing down development or before major refactor
- **Nice to Have**: When metrics show need (slow load, user feedback)
- **Post-MVP Features**: After gathering real user feedback

### Future Architecture Decisions Needed
- When to add Dexie? → User complaints about offline or data persistence
- When to go native? → Widget requests, HealthKit demand, performance issues
- When to add auth complexity? → Coach sharing, social features demand
- How to handle scale? → 1M+ sets per user (pagination, archiving)

---

## How to Use This Backlog

### For Development
1. **Start at the top** - Work through "Immediate Concerns" first
2. **Batch related items** - Group related improvements into coherent PRs
3. **Measure impact** - Track metrics before/after changes
4. **Gather feedback** - Validate assumptions with real users

### For Planning
1. **Sprint planning** - Pull from appropriate priority tier
2. **Effort estimation** - Use provided estimates as starting point
3. **Risk assessment** - Flag dependencies and unknowns
4. **Stakeholder communication** - Reference specific items by number

### For Prioritization Adjustments
- **User feedback** - Elevate items users request
- **Production issues** - Promote items causing problems
- **Strategic shifts** - Reprioritize based on product direction
- **Technical constraints** - Adjust based on discovered limitations

---

**Remember:** The best feature is the one users actually need, not the one that's technically impressive.

*This backlog is a living document. Update priorities based on real-world usage, user feedback, and measured impact.*
