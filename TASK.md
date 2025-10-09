# TASK: Soft Delete Architecture + Type Centralization + Lookup Optimization

**Status:** Planning complete, ready for implementation

See **[TODO.md](./TODO.md)** for detailed implementation tasks.

## Executive Summary

Fix 3 critical BACKLOG issues simultaneously with unified architectural solution:

1. **#4 (CRITICAL)**: Exercise deletion orphans sets → Soft delete preserves history
2. **#6 (CRITICAL)**: Type duplication across 5+ files → Centralized domain types
3. **#11 (HIGH)**: O(n) exercise lookups → O(1) Map-based optimization

**Approach:** Soft delete exercises only (sets stay hard delete), centralize types to `src/types/domain.ts`, build exercise Map for O(1) lookups.

**Estimated Time:** 2.5 hours across 4 phases

## User Value

**Problem:** User deletes "Bench Press" exercise that has 200 logged sets:
- ❌ **Current:** Sets show "Unknown exercise" in history - permanent data context loss
- ✅ **After:** Sets show "Bench Press" - history intact, can restore by recreating

**Magic UX:** User recreates "Bench Press" → system restores original (all 200 sets back)

## Architecture Decision

### Selected: Soft Delete + Type Centralization + Map Optimization

**Rationale:**
- **Simplicity**: Single abstraction solves 3 problems (Ousterhout deep modules)
- **User Value**: Prevents data loss + 50-100x performance gain
- **Explicitness**: `includeDeleted` parameter makes behavior clear at call sites
- **Strategic**: Enables future analytics ("stopped doing squats 3 weeks ago")

**Module Boundaries:**
```
UI: "delete exercise"
    ↓ Simple interface
Domain: HIDES soft delete + restore logic
        EXPOSES: createExercise, deleteExercise
    ↓
DB: deletedAt field, indexed filtering
```

**Module Value = Functionality - Interface Complexity**
- Functionality: Soft delete, auto-restore, duplicate checking, history preservation
- Interface: 3 simple functions (create, delete, list)
- Value: **HIGH** (4 complex behaviors behind simple API)

### Alternatives Considered

| Approach | User Value | Simplicity | Risk | Why Not |
|----------|-----------|------------|------|---------|
| **Block deletion** | LOW | HIGH | LOW | Can't hide unused exercises |
| **Archive table** | MEDIUM | LOW | MEDIUM | Complex queries, data duplication |
| **Soft delete (chosen)** | **HIGH** | **HIGH** | **LOW** | ✅ Best balance |

## Key Decisions

### 1. Soft Delete Exercises Only (Not Sets)

**Decision:** Exercises get `deletedAt` field, sets remain hard delete

**Rationale:**
- **Exercises** = entities (referenced by foreign keys, need preservation)
- **Sets** = transaction records (ephemeral, undo already works)
- **Analytics** cleaner without deleted sets (mistakes filtered out)

**Tradeoffs:**
- ✅ Simple schema (1 table changed)
- ✅ Undo toast still works (recreate set with new ID)
- ❌ Undo doesn't preserve original timestamp (acceptable)

### 2. Auto-Restore on Duplicate Create

**Decision:** Creating "Bench Press" after deletion restores original instead of error

**Rationale:**
- **Delightful UX**: User thinks new, gets full history back (magic!)
- **Data integrity**: Same exercise ID = all sets preserved
- **Transparent**: No user training needed

**Edge Cases:**
- Soft-deleted duplicate → restore silently
- Active duplicate → error (existing behavior)

### 3. Explicit `includeDeleted` Parameter

**Decision:** Every `listExercises` call must specify active-only vs. all

**Rationale:**
- **Explicitness**: No implicit behavior, clear intent at call sites
- **Flexibility**: History needs deleted names, dropdowns need active only
- **Type Safety**: TypeScript enforces parameter

**Call Sites:**
- Dashboard history: `{ includeDeleted: true }` - show deleted names
- Exercise dropdown: `{ includeDeleted: false }` - active only
- Settings manager: `{ includeDeleted: false }` - manage active

### 4. Indexed Filtering for Performance

**Decision:** Add `by_user_deleted` composite index (userId, deletedAt)

**Rationale:**
- **Fast queries**: O(1) indexed lookup vs. O(n) table scan
- **Scales**: 10,000 exercises still fast
- **Future-proof**: Ready for "deleted exercises" UI panel

## Implementation Phases

### Phase 1: Type Foundation (30min)
1. Create `src/types/domain.ts` - single source of truth
2. Update `convex/schema.ts` - add deletedAt + index
3. Migrate 5 components to centralized types

**Deliverable:** Zero type duplication, schema supports soft delete

### Phase 2: Backend Queries (45min)
1. Update `listExercises` - add includeDeleted param
2. Update `deleteExercise` - patch deletedAt instead of delete
3. Update `createExercise` - restore soft-deleted duplicates
4. Update `updateExercise` - block editing deleted
5. Add `restoreExercise` - explicit restore mutation

**Deliverable:** Soft delete works end-to-end, auto-restore functional

### Phase 3: Frontend Optimization (45min)
1. Dashboard - fetch with includeDeleted, build exercise Map
2. GroupedSetHistory - use Map.get() instead of array.find()
3. QuickLogForm - filter active exercises only
4. History page - include deleted for accurate names

**Deliverable:** O(1) lookups, deleted names show in history

### Phase 4: Testing (30min)
1. Manual: Delete exercise with sets → verify history shows names
2. Manual: Delete + recreate → verify auto-restore works
3. Performance: 100+ sets render < 50ms (was 200ms+)
4. Edge cases: Error handling, type safety

**Deliverable:** All success metrics met, no regressions

## Dependencies & Assumptions

**External:**
- Convex schema evolution (automatic, non-breaking)
- date-fns already installed (for existing date utils)

**Scale:**
- Expected: 10-50 exercises per user
- Works at: 1000+ exercises (indexed queries)

**Environment:**
- TypeScript strict mode (catches type errors)
- Convex dev server running (schema updates)

**Team:**
- Solo developer (no coordination needed)
- Familiarity with Convex, React, TypeScript

## Success Metrics

1. ✅ **Zero "Unknown exercise" in history** after deletion
2. ✅ **Delete + recreate restores** full history automatically
3. ✅ **Exercise lookups O(1)** - 50-100x faster than O(n)
4. ✅ **Type changes in 1 file** instead of 5 - 80% reduction
5. ✅ **No regressions** - quick log, stats, undo still work

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema migration breaks | LOW | HIGH | Optional field (non-breaking), test in dev first |
| History queries fail | LOW | MEDIUM | Explicit includeDeleted, test both paths |
| Performance degrades | LOW | LOW | Use indexed queries, measure before/after |
| Type refactor bugs | MEDIUM | LOW | Update incrementally, typecheck after each |

## Future Enhancements (6-Month Horizon)

**v1.1 - Deleted Exercises UI** (1h)
- Settings → "Deleted Exercises" panel
- Restore button for each
- Permanent delete option

**v1.2 - Analytics on Stopped Exercises** (2-3h)
- Charts: "Stopped doing squats on Oct 5"
- Insights: "Haven't done bench press in 3 weeks"
- Trend analysis over time

## Quality Validation

**Deep Modules?**
- ✅ Simple interface (create/delete/list) hides complex soft delete logic
- ✅ Implementation details invisible to UI components

**Information Hiding?**
- ✅ No leakage - components don't know about deletedAt field
- ✅ Query changes don't break callers (optional field)

**Different Abstractions?**
- ✅ UI layer: "exercises" vocabulary
- ✅ Domain layer: "active/deleted" filtering
- ✅ DB layer: "deletedAt" timestamps

**Strategic Design?**
- ✅ Invests in future (enables analytics)
- ✅ Not just tactical fix (solves 3 problems)

**Red Flags Avoided:**
- ✅ No temporal decomposition (organized by domain, not steps)
- ✅ No pass-through layers (domain adds value)
- ✅ No information leakage (soft delete hidden)

---

**Implementation Guide:** See [TODO.md](./TODO.md) for atomic task breakdown.

**Next Step:** Exit plan mode → Execute Phase 1
