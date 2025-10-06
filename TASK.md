
### 1. Enhanced Input Validation
**Effort:** 2 hours | **Value:** HIGH - Data integrity & security

**Current State:** Basic validation exists but allows unrealistic/invalid data:
- Reps: No upper bound (allows 999999), accepts floats (5.5 reps)
- Weight: No upper bound (allows 999999), unlimited precision
- Exercise names: No length limits, no duplicate detection

**Locations:**
- `convex/sets.ts:18-34` - Reps and weight validation
- `convex/exercises.ts:15-18` - Exercise name validation

**Fix:**
```typescript
// Reps validation (sets.ts:18-21)
if (!Number.isInteger(args.reps) || args.reps <= 0 || args.reps > 1000) {
  throw new Error("Reps must be a positive integer between 1 and 1000");
}

// Weight validation (sets.ts:24-34)
if (args.weight !== undefined) {
  if (!isFinite(args.weight) || args.weight <= 0 || args.weight > 10000) {
    throw new Error("Weight must be between 0.1 and 10000");
  }
  args.weight = Math.round(args.weight * 100) / 100; // 2 decimal precision
  // ... rest of validation
}

// Exercise name validation (exercises.ts:15-18)
const trimmedName = args.name.trim();
if (trimmedName.length < 2 || trimmedName.length > 100) {
  throw new Error("Exercise name must be 2-100 characters");
}

// Check for duplicate
const existing = await ctx.db
  .query("exercises")
  .withIndex("by_user_name", (q) =>
    q.eq("userId", identity.subject).eq("name", trimmedName)
  )
  .first();
if (existing) {
  throw new Error("Exercise with this name already exists");
}
```

**Impact:**
- ✅ Prevents database pollution with unrealistic data
- ✅ Protects statistical calculations from extreme values
- ✅ Improves data quality and user trust
- ✅ Prevents UI rendering issues with very large numbers

---

