# Volume Convex HTTP API

HTTP Actions API for the Volume workout tracking app. All endpoints require Clerk JWT authentication.

## Base URL

```
https://curious-salamander-943.convex.cloud
```

## Authentication

All endpoints require a Clerk JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

To obtain a JWT token:

- **Web:** Use Clerk's `useAuth()` hook and call `getToken()`
- **iOS:** Use Clerk iOS SDK's `Clerk.shared.session?.getToken()?.jwt`

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:

- `401 Unauthorized` - Missing or invalid JWT token
- `400 Bad Request` - Invalid request body or parameters
- `404 Not Found` - Resource not found or no access
- `500 Internal Server Error` - Server error

---

## Exercises Endpoints

### POST /api/exercises

Create a new exercise.

**Request:**

```bash
curl -X POST https://curious-salamander-943.convex.cloud/api/exercises \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bench Press"
  }'
```

**Response (200):**

```json
{
  "id": "j97h2x8q9k5m3n4p",
  "name": "Bench Press",
  "createdAt": 1729687200000,
  "deletedAt": null
}
```

**Notes:**

- If an exercise with the same name exists but is soft-deleted, it will be automatically restored
- Exercise names are case-sensitive

---

### GET /api/exercises

List all exercises for the authenticated user.

**Request:**

```bash
curl -X GET https://curious-salamander-943.convex.cloud/api/exercises \
  -H "Authorization: Bearer <jwt-token>"
```

**Query Parameters:**

- `includeDeleted` (optional) - Set to `true` to include soft-deleted exercises

**Request with deleted exercises:**

```bash
curl -X GET "https://curious-salamander-943.convex.cloud/api/exercises?includeDeleted=true" \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "exercises": [
    {
      "_id": "j97h2x8q9k5m3n4p",
      "name": "Bench Press",
      "userId": "user_abc123",
      "createdAt": 1729687200000,
      "deletedAt": null
    },
    {
      "_id": "k08i3y9r0l6n4o5q",
      "name": "Squats",
      "userId": "user_abc123",
      "createdAt": 1729600800000,
      "deletedAt": null
    }
  ]
}
```

---

### PATCH /api/exercises/:id

Update an exercise name.

**Request:**

```bash
curl -X PATCH https://curious-salamander-943.convex.cloud/api/exercises/j97h2x8q9k5m3n4p \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Barbell Bench Press"
  }'
```

**Response (200):**

```json
{
  "id": "j97h2x8q9k5m3n4p",
  "name": "Barbell Bench Press",
  "updatedAt": 1729687500000
}
```

**Notes:**

- Only the exercise owner can update it
- Returns 404 if exercise doesn't exist or user doesn't own it

---

### DELETE /api/exercises/:id

Soft-delete an exercise (sets `deletedAt` timestamp).

**Request:**

```bash
curl -X DELETE https://curious-salamander-943.convex.cloud/api/exercises/j97h2x8q9k5m3n4p \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "success": true
}
```

**Notes:**

- Soft delete only - exercise data is preserved
- Associated sets remain accessible
- Exercise can be restored using the restore endpoint

---

### POST /api/exercises/:id/restore

Restore a soft-deleted exercise.

**Request:**

```bash
curl -X POST https://curious-salamander-943.convex.cloud/api/exercises/j97h2x8q9k5m3n4p/restore \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "id": "j97h2x8q9k5m3n4p",
  "name": "Bench Press",
  "deletedAt": null
}
```

---

## Sets Endpoints

### POST /api/sets

Log a new workout set.

**Request:**

```bash
curl -X POST https://curious-salamander-943.convex.cloud/api/sets \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseId": "j97h2x8q9k5m3n4p",
    "reps": 8,
    "weight": 185,
    "unit": "lbs"
  }'
```

**Request Body:**

- `exerciseId` (required) - Exercise ID
- `reps` (required) - Number of repetitions (1-1000)
- `weight` (optional) - Weight amount (0.1-10000)
- `unit` (optional) - Weight unit, either `"lbs"` or `"kg"`

**Response (200):**

```json
{
  "id": "l19j4z0s1m7o5p6r",
  "exerciseId": "j97h2x8q9k5m3n4p",
  "reps": 8,
  "weight": 185,
  "unit": "lbs",
  "performedAt": 1729687800000
}
```

**Bodyweight Exercise (no weight):**

```bash
curl -X POST https://curious-salamander-943.convex.cloud/api/sets \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseId": "k08i3y9r0l6n4o5q",
    "reps": 15
  }'
```

**Notes:**

- `performedAt` timestamp is auto-generated server-side
- Weight and unit must both be provided together or both omitted
- Exercise must exist and belong to the user

---

### GET /api/sets

List sets for the authenticated user.

**Request (all sets):**

```bash
curl -X GET https://curious-salamander-943.convex.cloud/api/sets \
  -H "Authorization: Bearer <jwt-token>"
```

**Query Parameters:**

- `exerciseId` (optional) - Filter sets by exercise ID

**Request (filtered by exercise):**

```bash
curl -X GET "https://curious-salamander-943.convex.cloud/api/sets?exerciseId=j97h2x8q9k5m3n4p" \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "sets": [
    {
      "_id": "l19j4z0s1m7o5p6r",
      "exerciseId": "j97h2x8q9k5m3n4p",
      "userId": "user_abc123",
      "reps": 8,
      "weight": 185,
      "unit": "lbs",
      "performedAt": 1729687800000
    },
    {
      "_id": "m20k5a1t2n8p6q7s",
      "exerciseId": "j97h2x8q9k5m3n4p",
      "userId": "user_abc123",
      "reps": 10,
      "weight": 135,
      "unit": "lbs",
      "performedAt": 1729601200000
    }
  ]
}
```

**Notes:**

- Sets are ordered by `performedAt` descending (newest first)

---

### GET /api/sets/paginated

List sets with pagination support.

**Request (first page):**

```bash
curl -X GET "https://curious-salamander-943.convex.cloud/api/sets/paginated?pageSize=25" \
  -H "Authorization: Bearer <jwt-token>"
```

**Query Parameters:**

- `pageSize` (optional) - Number of items per page (default: 25)
- `cursor` (optional) - Pagination cursor from previous response

**Request (next page):**

```bash
curl -X GET "https://curious-salamander-943.convex.cloud/api/sets/paginated?pageSize=25&cursor=<cursor-value>" \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "sets": [
    {
      "_id": "l19j4z0s1m7o5p6r",
      "exerciseId": "j97h2x8q9k5m3n4p",
      "userId": "user_abc123",
      "reps": 8,
      "weight": 185,
      "unit": "lbs",
      "performedAt": 1729687800000
    }
  ],
  "nextCursor": "n31l6b2u3o9q7r8t",
  "hasMore": true
}
```

**Response Fields:**

- `sets` - Array of set objects for current page
- `nextCursor` - Cursor for next page (use in next request)
- `hasMore` - Boolean indicating if more pages exist

---

### DELETE /api/sets/:id

Delete a set (hard delete).

**Request:**

```bash
curl -X DELETE https://curious-salamander-943.convex.cloud/api/sets/l19j4z0s1m7o5p6r \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "success": true
}
```

**Notes:**

- Hard delete - set data is permanently removed
- Only the set owner can delete it
- Returns 404 if set doesn't exist or user doesn't own it

---

## User Preferences Endpoints

### GET /api/preferences

Get user preferences for the authenticated user.

**Request:**

```bash
curl -X GET https://curious-salamander-943.convex.cloud/api/preferences \
  -H "Authorization: Bearer <jwt-token>"
```

**Response (200):**

```json
{
  "weightUnit": "lbs"
}
```

**Notes:**

- Returns default `"lbs"` for new users who haven't set preferences
- Only `weightUnit` preference is currently supported

---

### PATCH /api/preferences

Update user preferences.

**Request:**

```bash
curl -X PATCH https://curious-salamander-943.convex.cloud/api/preferences \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "weightUnit": "kg"
  }'
```

**Request Body:**

- `weightUnit` (required) - Either `"lbs"` or `"kg"`

**Response (200):**

```json
{
  "weightUnit": "kg",
  "updatedAt": 1729688000000
}
```

**Notes:**

- Preferences are scoped to the authenticated user
- Invalid weight units return 400 error

---

## Development Testing

### Getting a Test JWT Token

**Using Clerk Dashboard:**

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to Users
4. Click on a test user
5. Go to the "JWT Templates" tab
6. Copy the JWT token

**Using the Web App:**

```javascript
// In browser console on running web app
const { getToken } = Clerk;
const token = await getToken();
console.log(token);
```

### Testing All Endpoints

```bash
# Set your JWT token
export JWT_TOKEN="your-jwt-token-here"
export BASE_URL="https://curious-salamander-943.convex.cloud"

# Create exercise
curl -X POST $BASE_URL/api/exercises \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Exercise"}'

# List exercises
curl -X GET $BASE_URL/api/exercises \
  -H "Authorization: Bearer $JWT_TOKEN"

# Log a set (replace EXERCISE_ID with ID from previous response)
curl -X POST $BASE_URL/api/sets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exerciseId":"EXERCISE_ID","reps":10,"weight":100,"unit":"lbs"}'

# Get preferences
curl -X GET $BASE_URL/api/preferences \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## iOS Integration

### Swift URLRequest Example

```swift
func makeAuthenticatedRequest<T: Decodable>(
    endpoint: String,
    method: String = "GET",
    body: Data? = nil
) async throws -> T {
    let baseURL = URL(string: "https://curious-salamander-943.convex.cloud")!
    var request = URLRequest(url: baseURL.appendingPathComponent(endpoint))
    request.httpMethod = method
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    // Get Clerk JWT
    guard let token = try await Clerk.shared.session?.getToken()?.jwt else {
        throw APIError.unauthorized
    }
    request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")

    if let body = body {
        request.httpBody = body
    }

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw APIError.invalidResponse
    }

    return try JSONDecoder().decode(T.self, from: data)
}
```

---

**Last Updated:** 2025-10-23
