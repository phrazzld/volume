# TODO: Enhanced Input Validation

> **Goal**: Implement robust input validation for reps, weight, and exercise names with user-friendly error handling via toast notifications.
>
> **Success Criteria**: Reject decimal reps, enforce 2-decimal weight precision, prevent duplicate exercises (case-insensitive), replace all alerts with toasts.

---

## Phase 1: Validation Infrastructure

### Core Validators

- [x] Create `convex/lib/validate.ts` with validation utilities
  - Export `validateReps(reps: number)`: Reject if not integer, not positive, or > 1000. Throw user-friendly error: "Reps must be a whole number between 1 and 1000"
  - Export `validateWeight(weight: number | undefined)`: Return undefined if not provided. Reject if not finite, not positive, or > 10000. Round to 2 decimals: `Math.round(weight * 100) / 100`. Throw error: "Weight must be between 0.1 and 10000"
  - Export `validateUnit(unit: string | undefined, weight: number | undefined)`: If weight provided, require unit to be "lbs" or "kg". Throw error: "Unit must be 'lbs' or 'kg' when weight is provided"
  - Export `validateExerciseName(name: string)`: Trim and convert to uppercase. Reject if length < 2 or > 100. Throw error: "Exercise name must be 2-100 characters". Return normalized name (uppercase)
  - Export `requireAuth(ctx: QueryCtx | MutationCtx)`: Check `ctx.auth.getUserIdentity()`, throw "Not authenticated" if null, return identity
  - Export `requireOwnership<T extends { userId: string }>(resource: T | null, userId: string, resourceType: string)`: Throw "Not authorized" if resource null or userId mismatch

- [x] Update `convex/sets.ts` - Replace inline validation in `logSet` mutation (lines 18-34)
  - Import validators from `./lib/validate`
  - Replace line 18-21 reps check with: `validateReps(args.reps)`
  - Replace lines 24-34 weight/unit validation with: `const weight = validateWeight(args.weight); validateUnit(args.unit, weight);`
  - Use validated/rounded weight value in db.insert (not raw args.weight)
  - Success: Mutation rejects 5.5 reps, rounds 22.555 to 22.56, enforces unit requirement

- [x] Update `convex/exercises.ts` - Add duplicate detection to `createExercise` mutation (after line 17)
  - Import validators from `./lib/validate`
  - Replace lines 15-18 validation with: `const normalizedName = validateExerciseName(args.name);`
  - Query for existing exercise: `const existing = await ctx.db.query("exercises").withIndex("by_user_name", (q) => q.eq("userId", identity.subject).eq("name", normalizedName)).first();`
  - If existing, throw error: "Exercise with this name already exists"
  - Insert with normalizedName (uppercase) instead of args.name.trim()
  - Success: Prevents "Push-ups" when "PUSH-UPS" exists, stores all names as uppercase

- [x] Update `convex/exercises.ts` - Add validation to `updateExercise` mutation (after line 64)
  - Import validators from `./lib/validate`
  - Replace lines 61-64 with: `const normalizedName = validateExerciseName(args.name);`
  - Query for duplicate (excluding current exercise): Check by_user_name index for normalizedName, filter out current exercise ID
  - If duplicate found, throw error: "Exercise with this name already exists"
  - Update with normalizedName (uppercase)
  - Success: Update validation matches create validation, prevents duplicates on rename

### Type Safety

- [x] Update `convex/_generated/dataModel.d.ts` imports in validation utilities
  - Import `QueryCtx`, `MutationCtx` from `convex/_generated/server.d.ts` for auth helpers
  - Ensure all validator functions have proper TypeScript signatures
  - Success: No TypeScript errors, full type inference in mutations

---

## Phase 2: Error Handling System

### Infrastructure Setup

- [x] Install Sonner toast library
  - Run: `pnpm add sonner`
  - Verify installation in package.json
  - Success: Sonner appears in dependencies

- [x] Add Toaster component to root layout in `src/app/layout.tsx`
  - Import: `import { Toaster } from "sonner";`
  - Add before closing `</body>` tag (after ConvexClientProvider): `<Toaster position="bottom-right" theme="dark" toastOptions={{ style: { background: 'var(--terminal-bg-secondary)', border: '1px solid var(--terminal-border)', color: 'var(--terminal-text)' } }} />`
  - Success: Toasts render with terminal theme styling

- [x] Create `src/lib/error-handler.ts` with centralized error handling
  - Export `handleMutationError(error: unknown, context: string)`: Log error to console with context, extract message from Error or use "Unknown error", call getUserFriendlyMessage, show toast.error with 4s duration
  - Export `getUserFriendlyMessage(errorMessage: string)`: Map "Not authenticated" → "Please sign in to continue", "Not authorized" → "You don't have permission for this action", pass through validation errors (contain "Reps must", "Weight must", "Unit must", "Exercise name"), "not found" → "Item not found. It may have been deleted.", default → "Something went wrong. Please try again."
  - Import `toast` from "sonner"
  - Success: Single source of truth for error message mapping

### Component Updates

- [x] Update `src/components/dashboard/quick-log-form.tsx` - Replace alert with toast (lines 103, 127)
  - Import: `import { toast } from "sonner"; import { handleMutationError } from "@/lib/error-handler";`
  - Line 103 (delete set): Replace console.error + alert with `handleMutationError(error, "Delete Set");`
  - Line 127 (log set): Replace console.error + alert with `handleMutationError(error, "Log Set");`
  - Add success toast after successful log: `toast.success("Set logged!");` (after line 123)
  - Success: No more alert() calls, toasts appear on error/success

- [x] Update `src/components/dashboard/grouped-set-history.tsx` - Replace alerts with toasts (lines 44, 51)
  - Import error handler and toast
  - Line 44: Replace console.error + alert with `handleMutationError(error, "Delete Set");`
  - Line 51: Replace console.error + alert with `handleMutationError(error, "Undo Delete");`
  - Add success toast after delete: `toast.success("Set deleted");`
  - Success: Toast notifications for delete and undo operations

- [x] Update `src/components/dashboard/set-card.tsx` - Replace alert with toast (line 33)
  - Import error handler and toast
  - Replace console.error + alert with `handleMutationError(error, "Delete Set");`
  - Add success toast after delete: `toast.success("Set deleted");`
  - Success: Consistent error/success messaging

- [x] Update `src/components/dashboard/exercise-manager.tsx` - Replace alerts with toasts (lines 62, 77, 94)
  - Import error handler and toast
  - Line 62 (update): Replace console.error + alert with `handleMutationError(error, "Update Exercise");`
  - Line 77 (delete): Replace console.error + alert with `handleMutationError(error, "Delete Exercise");`
  - Line 94 (update): Replace console.error + alert with `handleMutationError(error, "Update Exercise");`
  - Add success toasts: After update → `toast.success("Exercise updated");`, after delete → `toast.success("Exercise deleted");`
  - Success: All exercise operations show toasts

- [x] Update `src/components/dashboard/inline-exercise-creator.tsx` - Replace alert with toast (line 39)
  - Import error handler and toast
  - Replace console.error + alert with `handleMutationError(error, "Create Exercise");`
  - Add success toast after create: `toast.success("Exercise created");`
  - Success: Exercise creation shows toasts

---

## Phase 3: Testing

### Validation Tests

- [ ] Create `convex/lib/validate.test.ts` with Vitest tests
  - Test `validateReps()`: Accepts integers 1-1000, rejects 0, negative, decimals (5.5), over 1000, NaN, Infinity
  - Test `validateWeight()`: Returns undefined for undefined input, accepts positive numbers, rounds to 2 decimals (22.555 → 22.56), rejects 0, negative, over 10000, NaN, Infinity
  - Test `validateUnit()`: Accepts "lbs"/"kg" when weight provided, rejects invalid units, rejects missing unit when weight provided, allows undefined unit when no weight
  - Test `validateExerciseName()`: Trims whitespace, converts to uppercase ("push-ups" → "PUSH-UPS"), rejects < 2 chars, rejects > 100 chars, accepts Unicode/emojis
  - Success: All edge cases covered, tests pass

### Utility Tests

- [ ] Create `src/lib/dashboard-utils.test.ts` with critical business logic tests
  - Test `convertWeight()`: lbs→kg (220 → 99.79), kg→lbs (100 → 220.46), same unit returns unchanged
  - Test `calculateDailyStats()`: Filters to today only, excludes yesterday, converts weights to target unit for volume calculation, returns null for empty/no-today sets
  - Success: Data integrity verified, weight conversion accurate

### Error Handler Tests

- [ ] Create `src/lib/error-handler.test.ts` with message mapping tests
  - Test `getUserFriendlyMessage()`: Maps "Not authenticated" → sign-in message, "Not authorized" → permission message, validation errors pass through unchanged, "not found" → generic not found, unknown errors → generic fallback
  - Mock console.error to verify logging
  - Success: All error types mapped correctly

---

## Phase 4: Validation Edge Cases ✅ VERIFIED

- [x] Add integer validation for reps in `convex/sets.ts`
  - Ensure `validateReps()` uses `Number.isInteger()` check
  - Success: Rejects 5.5, 10.1, any float value
  - ✅ VERIFIED: convex/lib/validate.ts:11 uses `Number.isInteger(reps)`

- [x] Add weight precision rounding in `convex/sets.ts`
  - Ensure `validateWeight()` returns `Math.round(weight * 100) / 100`
  - Success: 22.555 becomes 22.56, 99.999 becomes 100.00
  - ✅ VERIFIED: convex/lib/validate.ts:36 uses `Math.round(weight * 100) / 100`

- [x] Verify case-insensitive duplicate detection in `convex/exercises.ts`
  - Query using normalized (uppercase) name
  - Success: "push-ups" blocked if "PUSH-UPS" exists, "BENCH PRESS" blocked if "bench press" exists
  - ✅ VERIFIED: convex/lib/validate.ts:74 converts to uppercase, convex/exercises.ts:24 queries with normalized name

---

## Phase 5: Critical PR Review Fixes 🚨 MERGE BLOCKERS

### P1: Client-side parseInt() bypasses server validation

- [ ] Fix reps parsing in `src/components/dashboard/quick-log-form.tsx:109`
  - **Issue**: User enters "5.5" → `parseInt("5.5", 10)` = 5 → silently truncated → server validation bypassed
  - **Impact**: Data corruption - fractional reps stored without user awareness or server rejection
  - **Root Cause**: Client-side truncation happens BEFORE mutation call, so `validateReps()` never sees decimal
  - **Fix**: Change `parseInt(reps, 10)` to `parseFloat(reps)` OR `Number(reps)`
  - **Testing**: After fix, entering "5.5" should trigger error toast: "Reps must be a whole number between 1 and 1000"
  - **Success Criteria**: Decimal reps rejected by server, user sees clear error message
  - **Source**: Codex PR Review, inline comment on quick-log-form.tsx:110

### P1: Weight validation lower bound inconsistency

- [ ] Fix weight minimum threshold in `convex/lib/validate.ts:31`
  - **Issue**: Code checks `weight <= 0` but error message says "between 0.1 and 10000"
  - **Impact**: Invalid ultra-small weights (0.01, 0.05) accepted, contradicts documentation
  - **Inconsistency**: TODO.md:15, TASK.md, and error message all specify 0.1 minimum
  - **Fix**: Change condition from `weight <= 0` to `weight < 0.1`
  - **Testing**: After fix, validateWeight(0.05) should throw "Weight must be between 0.1 and 10000"
  - **Success Criteria**: Weights below 0.1 rejected, matches error message and docs
  - **Source**: Codex PR Review + Claude AI Review (both flagged this)

### Enhancement: Empty exercise name edge case

- [ ] Improve empty string handling in `convex/lib/validate.ts:68-72`
  - **Issue**: Empty string after `trim()` gets generic "Exercise name must be 2-100 characters" error
  - **Enhancement**: Add specific check for empty string with clearer message
  - **Fix**:
    ```typescript
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      throw new Error("Exercise name cannot be empty");
    }

    if (trimmed.length < 2 || trimmed.length > 100) {
      throw new Error("Exercise name must be 2-100 characters");
    }
    ```
  - **Benefit**: More specific, user-friendly error message for common mistake
  - **Effort**: 2 minutes
  - **Source**: Claude AI Review suggestion

---

## Notes

- All exercise names stored as UPPERCASE for consistency
- Validation errors are user-friendly (already optimized for toast display)
- No silent data modification - reject bad input with clear error messages
- Tests focus on discrete, useful cases - no complex mocks or deep integration tests
- Error handler utility centralizes message mapping for future error tracking integration

## PR Review Feedback Summary (PR #4)

**Reviews Received:**
- Claude AI Code Review (2025-10-06)
- Codex Automated Review (2025-10-06)

**Critical Issues (Merge Blockers):**
1. ✅ **P1: parseInt() bypasses server validation** - Added to Phase 5
2. ✅ **P1: Weight lower bound inconsistency** - Added to Phase 5
3. ✅ **Enhancement: Empty exercise name** - Added to Phase 5

**Valid Suggestions (Deferred to BACKLOG):**
- Add unit tests for validators → BACKLOG #10 (elevated to "Immediate Concerns")
- Migration script for uppercase normalization → BACKLOG (new item)
- Optimize quick-log-form query → BACKLOG #6 note
- Sentry integration → BACKLOG #19 (already tracked)
- Rate limiting → BACKLOG #8 (already tracked)

**Rejected Suggestions:**
- None - all feedback was valid and actionable

**Decision Rationale:**
Phase 5 must be completed before merge to prevent data corruption and ensure validation integrity. Testing infrastructure (Phase 3) deferred to post-merge to unblock PR while maintaining quality standards.
