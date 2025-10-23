# TODO - PR #17 Critical Fixes

Critical issues identified in automated code review that must be addressed before merging.

---

## 🔴 CRITICAL (Block Merge)

### ✅ 1. Fix Inefficient POST Query Pattern [COMPLETED]

**Problem**: After creating resources, code fetches ALL user records then filters client-side
**Impact**: O(n) performance, 50KB+ wasted bandwidth at 1000 records
**Files**: `convex/http.ts:36-39, 223-226, 295-296`

**Tasks**:

#### 1a. Add getSingleExercise Query

**File**: `convex/exercises.ts`

Add new query function:

```typescript
export const getExercise = query({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const exercise = await ctx.db.get(args.id);

    if (!exercise) {
      throw new Error("Exercise not found");
    }

    if (exercise.userId !== identity.subject) {
      throw new Error("You do not own this exercise");
    }

    return exercise;
  },
});
```

#### 1b. Add getSingleSet Query

**File**: `convex/sets.ts`

Add similar `getSet` query following same pattern

#### 1c. Update POST /api/exercises Endpoint

**File**: `convex/http.ts:31-52`

Replace:

```typescript
const exercises = await ctx.runQuery(api.exercises.listExercises, {
  includeDeleted: true,
});
const created = exercises.find((e) => e._id === exerciseId);
```

With:

```typescript
const created = await ctx.runQuery(api.exercises.getExercise, {
  id: exerciseId,
});
```

#### 1d. Update POST /api/sets Endpoint

**File**: `convex/http.ts:287-311`

Replace inefficient `listSets` call with `getSingleSet` query

#### 1e. Update POST /api/exercises/:id/restore Endpoint

**File**: `convex/http.ts:218-238`

Replace inefficient `listExercises` call with `getExercise` query

**Acceptance**: All POST endpoints fetch only the created record, not all records

---

### ✅ 2. Fix Type Safety Violations [COMPLETED]

**Problem**: `as any` casts bypass TypeScript protection
**Impact**: Runtime errors from invalid IDs
**Files**: `convex/http.ts` lines 133, 179, 219, 288, 341, 424

**Tasks**:

#### 2a. Create ID Parser Utilities

**File**: NEW `convex/lib/id-utils.ts`

```typescript
import { Id } from "../_generated/dataModel";

/**
 * Parse and validate exercise ID from HTTP request
 * Throws error if ID is missing or invalid format
 */
export function parseExerciseId(id: string | undefined): Id<"exercises"> {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid exercise ID");
  }
  // Convex IDs are opaque strings - runtime validation happens in mutations
  return id as Id<"exercises">;
}

/**
 * Parse and validate set ID from HTTP request
 * Throws error if ID is missing or invalid format
 */
export function parseSetId(id: string | undefined): Id<"sets"> {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error("Invalid set ID");
  }
  return id as Id<"sets">;
}
```

#### 2b. Replace All `as any` Casts in PATCH /api/exercises/:id

**File**: `convex/http.ts:107-163`

Replace line 133:

```typescript
// Before
id: id as any,

// After
import { parseExerciseId } from "./lib/id-utils";
const exerciseId = parseExerciseId(request.url.split("/").pop());
id: exerciseId,
```

#### 2c. Replace All `as any` in DELETE /api/exercises/:id

**File**: `convex/http.ts:165-201`

Replace line 179

#### 2d. Replace All `as any` in POST /api/exercises/:id/restore

**File**: `convex/http.ts:203-254`

Replace line 219

#### 2e. Replace All `as any` in POST /api/sets

**File**: `convex/http.ts:256-324`

Replace line 288 (use parseExerciseId for exerciseId param)

#### 2f. Replace All `as any` in GET /api/sets

**File**: `convex/http.ts:326-360`

Replace line 341 (use parseExerciseId for query param)

#### 2g. Replace All `as any` in DELETE /api/sets/:id

**File**: `convex/http.ts:411-445`

Replace line 424 (use parseSetId)

**Acceptance**: Zero `as any` casts in http.ts, all ID parsing uses type-safe utilities

---

### ✅ 3. Add HTTP Endpoint Integration Tests [COMPLETED]

**Problem**: 542 lines of HTTP code with ZERO tests
**Impact**: API contract violations, auth bypass bugs
**File**: NEW `convex/http.test.ts`

**Tasks**:

#### 3a. Create Test File Structure

**File**: NEW `convex/http.test.ts`

Setup test infrastructure with ConvexTestingHelper

#### 3b. Test Authentication Enforcement

Write tests verifying:

- All endpoints return 401 without auth token
- Endpoints work with valid auth token
- Multi-user isolation (user A can't access user B's data)

#### 3c. Test Input Validation

Write tests for:

- POST /api/exercises with missing name → 400
- POST /api/sets with missing reps → 400
- POST /api/sets with invalid exerciseId → 400
- PATCH /api/preferences with invalid weightUnit → 400

#### 3d. Test Query Parameters

Write tests for:

- GET /api/exercises?includeDeleted=true includes deleted exercises
- GET /api/exercises?includeDeleted=false excludes deleted
- GET /api/sets?exerciseId=xyz filters correctly
- GET /api/sets/paginated?cursor=abc&pageSize=25 handles pagination

#### 3e. Test Path Parameters

Write tests for:

- PATCH /api/exercises/:id updates correct exercise
- DELETE /api/exercises/:id deletes correct exercise
- POST /api/exercises/:id/restore restores deleted exercise
- DELETE /api/sets/:id deletes correct set

#### 3f. Test Error Responses

Write tests for:

- 404 when accessing non-existent resource
- 403 when accessing another user's resource (IDOR protection)
- Error response format consistency

**Acceptance**:

- 30+ tests covering all HTTP endpoints
- All auth, validation, query param, path param scenarios tested
- Test coverage report shows >80% for http.ts

---

## 🟡 HIGH PRIORITY (Before iOS Dev)

### 4. Standardize Error Status Codes [~1-2hrs]

**Problem**: Same errors return 400 in some places, 500 in others
**File**: `convex/http.ts` (multiple locations)

**Tasks**:

#### 4a. Create Error Response Utility

**File**: NEW `convex/lib/http-utils.ts`

```typescript
export function errorResponse(error: unknown, context: string): Response {
  const message = error instanceof Error ? error.message : `${context} failed`;

  // Map error messages to HTTP status codes
  let status = 500; // Default to server error

  if (message.includes("not found") || message.includes("does not exist")) {
    status = 404;
  } else if (
    message.includes("required") ||
    message.includes("invalid") ||
    message.includes("must be")
  ) {
    status = 400;
  } else if (
    message.includes("not own") ||
    message.includes("not authorized") ||
    message.includes("Unauthorized")
  ) {
    status = 403;
  }

  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### 4b. Replace All Error Handling in http.ts

**File**: `convex/http.ts` (15+ catch blocks)

Replace all instances of:

```typescript
catch (error) {
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : "...",
    }),
    {
      status: 400, // or 500
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

With:

```typescript
import { errorResponse } from "./lib/http-utils";

catch (error) {
  return errorResponse(error, "Create exercise");
}
```

#### 4c. Replace All Success Responses

Replace all `new Response(JSON.stringify(...))` with `jsonResponse(...)`

**Acceptance**: Consistent error codes across all endpoints, reusable utilities

---

### 5. Fix Brittle URL Parsing [~30min]

**Problem**: Three different parsing strategies, no validation
**Files**: `convex/http.ts` lines 118, 176, 214-216

**Tasks**:

#### 5a. Add URL Utility to http-utils.ts

**File**: `convex/lib/http-utils.ts`

```typescript
/**
 * Extract path parameter from URL
 * @param url Full request URL
 * @param paramName Parameter name (e.g., "exercises", "sets")
 * @returns Extracted parameter value
 * @throws Error if parameter not found
 */
export function extractPathParam(url: string, paramName: string): string {
  const urlObj = new URL(url);
  const segments = urlObj.pathname.split("/").filter(Boolean);
  const paramIndex = segments.indexOf(paramName) + 1;

  if (paramIndex === 0 || paramIndex >= segments.length) {
    throw new Error(`Missing path parameter: ${paramName}`);
  }

  return segments[paramIndex];
}
```

#### 5b. Replace All URL Parsing Logic

Replace:

- Line 118: `request.url.split("/").pop()`
- Line 176: `request.url.split("/").pop()?.split("?")[0]`
- Line 214-216: Manual segment extraction

With:

```typescript
const id = extractPathParam(request.url, "exercises");
```

**Acceptance**: Single URL parsing strategy, consistent validation

---

### 6. Document API Error Codes [~20min]

**Problem**: iOS developers have no error code documentation
**File**: `convex/README.md`

**Tasks**:

#### 6a. Add Error Response Section

After "Authentication" section, add:

```markdown
## Error Responses

All endpoints return errors in this JSON format:

\`\`\`json
{
"error": "Human-readable error message"
}
\`\`\`

### HTTP Status Codes

- **200 OK**: Request succeeded
- **400 Bad Request**: Invalid input (missing fields, validation failed)
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid auth but insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server-side failure

### Common Error Scenarios

#### Missing Authentication

\`\`\`bash
curl https://curious-salamander-943.convex.cloud/api/exercises

# Response: 401 Unauthorized

\`\`\`

#### Invalid Input

\`\`\`bash
curl -X POST https://curious-salamander-943.convex.cloud/api/exercises \\
-H "Authorization: Bearer $TOKEN" \\
-d '{"name": ""}'

# Response: 400 {"error": "Exercise name is required"}

\`\`\`

#### IDOR Protection

\`\`\`bash

# Trying to access another user's exercise

curl https://curious-salamander-943.convex.cloud/api/exercises/xyz \\
-H "Authorization: Bearer $TOKEN"

# Response: 403 {"error": "You do not own this exercise"}

\`\`\`

#### Resource Not Found

\`\`\`bash
curl https://curious-salamander-943.convex.cloud/api/exercises/invalid-id \\
-H "Authorization: Bearer $TOKEN"

# Response: 404 {"error": "Exercise not found"}

\`\`\`
```

**Acceptance**: iOS team has clear error handling documentation

---

## Summary

**Critical Path** (must fix before merge):

1. ✅ Inefficient POST queries → ~45 min [COMPLETED]
2. ✅ Type safety violations → ~60 min [COMPLETED]
3. ✅ HTTP endpoint tests → ~4-6 hrs [COMPLETED]

**Total**: ✅ All critical tasks completed!

**High Priority** (before iOS dev starts): 4. Error status codes → ~1-2 hrs 5. URL parsing → ~30 min 6. Error documentation → ~20 min

**Total**: 8-10 hours before iOS integration

**Deferred to BACKLOG**:

- Pagination validation (security)
- Response format standardization
- Code duplication cleanup
- Rate limiting (already in BACKLOG)
