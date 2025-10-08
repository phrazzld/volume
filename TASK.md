# TASK: Fix IDOR Vulnerability in listSets Query

**Status**: Ready for Implementation
**Priority**: CRITICAL - Security Vulnerability
**Estimated Effort**: 2-3 hours
**Category**: Security Fix (OWASP A01:2021 - Broken Access Control)

---

## Executive Summary

Fix critical IDOR (Insecure Direct Object Reference) vulnerability in `convex/sets.ts:listSets` query that allows authenticated users to access other users' workout data by providing any exerciseId. Implement exercise ownership verification before returning filtered sets, add security tests to prevent regression, and document the secure pattern for future development.

**Impact**: Prevents horizontal privilege escalation attack exposing personal fitness data (reps, weight, timestamps, unit preferences) across all users.

---

## User Context

**Who**: All authenticated users (current and future)
**Problem**: Any user can read another user's workout sets by guessing/enumerating exercise IDs
**Benefit**: Data privacy guaranteed - users can only access their own workout data
**Success Criteria**: Unauthorized access attempts throw explicit errors and are logged

---

## Requirements

### Functional Requirements

1. **Ownership Verification**: When `listSets` is called with `exerciseId` parameter, verify the exercise belongs to the authenticated user before returning sets
2. **Error Handling**: Throw explicit error with message "Not authorized to access this exercise" when user attempts to access another user's exercise
3. **Authorized Access**: Return sets normally when user queries their own exercises
4. **Unauthenticated Access**: Existing behavior maintained (returns empty array)

### Non-Functional Requirements

1. **Performance**: Use existing indexes (`by_exercise`, `by_user_performed`) - no schema migration required
2. **Security**: Zero tolerance for data leakage - fail closed on authorization errors
3. **Maintainability**: Follow existing `requireOwnership()` pattern from codebase
4. **Reliability**: Comprehensive tests prevent regression

---

## Architecture Decision

### Selected Approach: Exercise Ownership Verification

**Description**: Before filtering sets by exerciseId, fetch the exercise document and verify ownership using existing `requireOwnership()` helper. This enforces authorization at the application layer using current database indexes.

**Rationale**:
- **Simplicity**: 5 lines of code, uses existing helpers and indexes
- **User Value**: Fixes critical vulnerability immediately without infrastructure changes
- **Explicitness**: Clear ownership check, explicit error messages, follows codebase conventions
- **Risk**: Low - minimal changes, existing pattern, comprehensive tests

### Alternatives Considered

| Approach | Simplicity | Performance | Security | Why Not Chosen |
|----------|-----------|-------------|----------|----------------|
| **Compound Index** (`by_user_exercise`) | Medium | Excellent | Excellent | Premature optimization for MVP scale. Can add later if needed. |
| **Always Filter by User** | Medium | Good | Excellent | More complex query logic. Ownership check is clearer and more maintainable. |
| **Silent Return** (`return []`) | High | Excellent | Good | Poor UX, harder debugging, no audit trail for attacks. |

### Module Boundaries

**Modified Module**: `convex/sets.ts:listSets` query handler
**Interface**: No changes to query signature or return type
**Responsibility**: Enforces authorization before data access
**Hidden Complexity**: Exercise existence and ownership verification details

**New Module**: `convex/sets.test.ts` (test suite)
**Interface**: Security test cases
**Responsibility**: Validates authorization logic
**Hidden Complexity**: Mock data setup, auth context simulation

### Abstraction Layers

- **Layer 1 (Client)**: Calls `listSets({ exerciseId })` - unchanged
- **Layer 2 (Query Handler)**: Validates auth, verifies ownership, fetches data - **modified**
- **Layer 3 (Database)**: Executes indexed queries - unchanged

Each layer maintains its vocabulary: Client thinks "get my sets", Handler thinks "authorize then fetch", Database thinks "index lookup".

---

## Dependencies & Assumptions

### Dependencies
- **External**: None
- **Internal**: `convex/lib/validate.ts:requireOwnership` helper (already exists)
- **Schema**: Current `exercises` and `sets` tables with existing indexes

### Assumptions
- **Scale**: Current MVP dataset (<1000 exercises, <10000 sets per user) - existing indexes sufficient
- **Auth**: Clerk authentication provides reliable `identity.subject` (already in use)
- **Environment**: Convex dev environment running (required for tests)
- **Browser Compatibility**: No client-side changes needed

### Explicit Constraints
- No schema migrations (use existing indexes)
- No breaking API changes (query signature unchanged)
- Maintain existing error handling patterns (`requireOwnership` throws)

---

## Implementation Phases

### Phase 1: Core Fix (30 minutes)
**Goal**: Patch vulnerability with minimal changes

1. Add exercise ownership verification in `listSets` handler before filtering by exerciseId
2. Use existing `requireOwnership()` helper for consistency
3. Verify fix locally with manual testing (create two users, attempt cross-user access)

**Acceptance Criteria**:
- Querying own exercise returns sets successfully
- Querying another user's exercise throws "Not authorized" error
- Querying without exerciseId returns all user's sets (unchanged behavior)

### Phase 2: Security Tests (1 hour)
**Goal**: Prevent regression with comprehensive test coverage

1. Create `convex/sets.test.ts` test file
2. Add test utilities for auth mocking (if not already available)
3. Write 4 core test cases:
   - Authorized access: User can list their own exercise's sets
   - Unauthorized access: User cannot list another user's exercise's sets
   - Unauthenticated access: Returns empty array
   - No filter: Returns all user's sets

**Acceptance Criteria**:
- All tests pass with `pnpm test`
- Coverage includes both success and failure paths
- Tests use realistic mock data

### Phase 3: Documentation (30 minutes)
**Goal**: Help future developers avoid similar vulnerabilities

1. Add inline comment documenting the security pattern in `listSets`
2. Update `CLAUDE.md` (if applicable) with secure query pattern example
3. Update BACKLOG.md to mark item #1 as completed
4. Git commit with detailed message referencing OWASP category

**Acceptance Criteria**:
- Code includes clear comments explaining authorization check
- Pattern is documented for reuse
- BACKLOG.md updated

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Production users exploited** | Medium | CRITICAL | Deploy immediately after testing. No public announcement (avoid alerting attackers). |
| **Performance regression** | Low | Low | Uses existing indexes. Monitor query latency after deploy. |
| **Test complexity** | Medium | Medium | Start with simple cases. Use Convex test utilities. Reference existing tests. |
| **Incomplete fix** | Low | CRITICAL | Manual security testing with 2 user accounts. Peer review before merge. |
| **Breaking client code** | Low | Low | Error throw matches existing pattern. Clients already handle query errors. |

---

## Key Decisions

### Decision 1: Throw Error vs. Return Empty Array
**What**: When user queries exercise they don't own
**Alternatives**: Silent return `[]` (hides issue), throw error (explicit)
**Selected**: Throw error
**Rationale**:
- **User Value**: Clear feedback enables better UX ("please select your exercise")
- **Simplicity**: Matches existing `requireOwnership()` pattern
- **Explicitness**: Logs security events, easier debugging

**Tradeoffs**: Minor information leakage (confirms exercise exists) - acceptable for authenticated app

### Decision 2: Use Existing Indexes vs. Add Compound Index
**What**: Database query strategy
**Alternatives**: Add `by_user_exercise` index (optimal), use existing indexes (simpler)
**Selected**: Use existing indexes
**Rationale**:
- **User Value**: Fixes vulnerability now without deployment complexity
- **Simplicity**: No schema migration, no index bloat
- **Explicitness**: Query logic is clear with ownership check

**Tradeoffs**: Slightly less optimal performance (negligible at current scale). Can optimize later if needed.

### Decision 3: Security Tests Required
**What**: Test coverage for fix
**Alternatives**: Manual testing only (faster), automated tests (safer)
**Selected**: Automated tests
**Rationale**:
- **User Value**: Prevents regression that could re-expose user data
- **Simplicity**: Forces clear thinking about edge cases
- **Explicitness**: Documents expected behavior

**Tradeoffs**: Additional 1 hour development time - worth it for critical security issue

---

## Implementation Guide

### Code Changes

**File**: `convex/sets.ts` (lines 58-64)

**Current (Vulnerable)**:
```typescript
if (args.exerciseId) {
  // ❌ NO OWNERSHIP CHECK
  sets = await ctx.db
    .query("sets")
    .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId!))
    .order("desc")
    .collect();
}
```

**Fixed (Secure)**:
```typescript
if (args.exerciseId) {
  // ✅ Verify exercise ownership before querying sets
  const exercise = await ctx.db.get(args.exerciseId);
  requireOwnership(exercise, identity.subject, "exercise");

  sets = await ctx.db
    .query("sets")
    .withIndex("by_exercise", (q) => q.eq("exerciseId", args.exerciseId))
    .order("desc")
    .collect();
}
```

**File**: `convex/sets.test.ts` (new file)

Create comprehensive security test suite covering authorized access, unauthorized access, unauthenticated access, and edge cases.

---

## Testing Strategy

### Security Test Cases

1. **Test: Authorized Access**
   - Setup: User A owns Exercise 1
   - Action: User A calls `listSets({ exerciseId: Exercise1 })`
   - Expected: Returns User A's sets for Exercise 1

2. **Test: Unauthorized Access**
   - Setup: User A owns Exercise 1, User B is authenticated
   - Action: User B calls `listSets({ exerciseId: Exercise1 })`
   - Expected: Throws "Not authorized to access this exercise"

3. **Test: Unauthenticated Access**
   - Setup: No user authenticated
   - Action: Call `listSets({ exerciseId: Exercise1 })`
   - Expected: Returns empty array (existing behavior)

4. **Test: Exercise Not Found**
   - Setup: User A authenticated
   - Action: User A calls `listSets({ exerciseId: "nonexistent_id" })`
   - Expected: Throws "exercise not found"

5. **Test: No Filter (Baseline)**
   - Setup: User A owns multiple exercises with sets
   - Action: User A calls `listSets({})`
   - Expected: Returns all User A's sets (existing behavior)

### Manual Testing Checklist

- [ ] Create two test accounts (User A, User B)
- [ ] User A creates Exercise 1 and logs sets
- [ ] User B creates Exercise 2 and logs sets
- [ ] Verify User A can query Exercise 1 sets
- [ ] Verify User A CANNOT query Exercise 2 sets (throws error)
- [ ] Verify unauthenticated query returns empty array
- [ ] Verify no performance regression (check Convex dashboard)

---

## Deployment Strategy

1. **Pre-Deployment**:
   - Run full test suite: `pnpm test`
   - Run type checking: `pnpm typecheck`
   - Manual security testing with 2 accounts
   - Code review focusing on authorization logic

2. **Deployment**:
   - Deploy to Convex dev environment first
   - Verify in Convex dashboard (check query logs)
   - If production exists, deploy during low-traffic window
   - Monitor error rates for 1 hour post-deployment

3. **Post-Deployment**:
   - Verify no spike in error rates (Convex dashboard)
   - Test production with real accounts
   - Document fix in commit message and BACKLOG.md
   - NO public security advisory (avoid alerting attackers to past vulnerability)

---

## Success Metrics

**Security**:
- ✅ Zero unauthorized data access (verified by security tests)
- ✅ Explicit errors logged for unauthorized attempts
- ✅ No client-side code changes required (server-enforced)

**Performance**:
- ✅ Query latency unchanged (<50ms for typical dataset)
- ✅ No additional database queries for unfiltered calls
- ✅ Uses existing indexes efficiently

**Maintainability**:
- ✅ Follows existing `requireOwnership()` pattern
- ✅ Clear inline documentation
- ✅ Comprehensive test coverage
- ✅ Explicit error messages aid debugging

**User Experience**:
- ✅ Authorized users experience no change
- ✅ Unauthorized access fails fast with clear error
- ✅ No breaking changes to client code

---

## Quality Validation

**Deep Modules**: ✅ Simple interface (`listSets({ exerciseId? })`) hides authorization complexity
**Information Hiding**: ✅ Ownership verification is implementation detail, not leaked to callers
**Abstraction Layers**: ✅ Handler layer transforms "get sets" to "authorize then fetch"
**Strategic Design**: ✅ Investing 2-3 hours prevents future security incidents and sets pattern

**Red Flags Avoided**:
- ❌ No temporal decomposition (logic grouped by security concern)
- ❌ No information leakage (ownership check doesn't expose exercise details)
- ❌ No pass-through (handler adds authorization layer)
- ❌ No generic names (clear "requireOwnership" helper)

---

## Next Steps

1. **Review this specification** - Ensure alignment with security requirements
2. **Run `/plan`** - Break down into implementation tasks
3. **Execute Phase 1** - Fix vulnerability (30 min)
4. **Execute Phase 2** - Add security tests (1 hour)
5. **Execute Phase 3** - Document and deploy (30 min)

**Total Timeline**: 2-3 hours from start to production deployment

---

## Appendix: Secure Query Pattern

For future reference, this is the recommended pattern for Convex queries with optional filters on related resources:

```typescript
export const queryWithOptionalFilter = query({
  args: {
    relatedResourceId: v.optional(v.id("relatedResource")),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    if (args.relatedResourceId) {
      // ✅ ALWAYS verify ownership of filter resource first
      const relatedResource = await ctx.db.get(args.relatedResourceId);
      requireOwnership(relatedResource, identity.subject, "relatedResource");

      // Then apply filter
      return ctx.db
        .query("mainResource")
        .withIndex("by_related", (q) => q.eq("relatedResourceId", args.relatedResourceId))
        .collect();
    }

    // No filter - return all user's resources
    return ctx.db
      .query("mainResource")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});
```

**Key Principles**:
1. Always get authenticated identity first
2. Verify ownership of ANY filter parameter before using it
3. Use existing `requireOwnership()` helper for consistency
4. Throw explicit errors (don't return empty silently)
5. Add security tests for each authorization point

---

*This PRD follows the philosophy of strategic programming - investing time upfront to reduce complexity and prevent future security incidents.*
