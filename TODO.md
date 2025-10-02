# TODO: Workout Tracker - MVP (Core CRUD Only)

## Context
- **Approach**: Simple CRUD app with Convex backend, Clerk auth, Next.js frontend
- **Tech Stack**: Next.js 15, TypeScript, Tailwind, Convex, Clerk
- **MVP Scope**: Auth + Create exercises + Log sets + View history. That's it.
- **Architecture**: Server-first with Convex mutations/queries, no offline-first complexity yet

## Tenet Integration Plan
- **🎯 Modularity**: Convex functions isolated by resource (exercises, sets), React components by feature
- **🎯 Testability**: Convex functions are pure, UI components isolated
- **🎯 Simplicity**: No analytics, no export, no advanced UI - just core CRUD
- **🎯 Automation**: TypeScript strict, basic tests for critical paths

---

## Phase 1: Project Setup [1 hour]

- [x] Initialize Next.js 15 project
  ```
  Command: pnpm create next-app@latest workout-tracker --typescript --tailwind --app --src-dir --import-alias "@/*"
  Command: cd workout-tracker

  Files: package.json, tsconfig.json, next.config.ts
  Approach: Next.js 15 App Router, TypeScript strict mode, Tailwind CSS
  Success: `pnpm dev` runs, builds successfully
  Time: 15 minutes
  ```

- [x] Install and configure Convex
  ```
  Command: pnpm add convex
  Command: pnpm convex dev --once

  Files: convex/_generated/, convex.json
  Approach: Follow Convex quick-start, create convex/ directory
  Success: Convex dev server runs, dashboard accessible
  Time: 15 minutes
  ```

- [x] Install and configure Clerk authentication
  ```
  Command: pnpm add @clerk/nextjs

  Files: src/app/layout.tsx, middleware.ts, .env.local
  Approach: Wrap app with ClerkProvider, add auth middleware, set CLERK_* env vars
  Success: Sign-in page shows, can create test account, protected routes work
  Time: 30 minutes
  ```

---

## Phase 2: Data Model & Convex Schema [30 minutes]

- [x] Define Convex schema for exercises and sets
  ```
  Files: convex/schema.ts

  🎯 MODULARITY: Clean separation - exercises and sets tables

  Schema:
  exercises: {
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }

  sets: {
    userId: v.string(),
    exerciseId: v.id("exercises"),
    reps: v.number(),
    weight: v.optional(v.number()),
    performedAt: v.number(),  // timestamp
  }

  Indexes:
  - exercises: by_user (userId)
  - sets: by_user (userId), by_exercise (exerciseId, performedAt)

  Approach: Minimal schema, userId from Clerk auth
  Success: Schema validates, indexes defined
  Time: 30 minutes
  ```

---

## Phase 3: Backend - Convex Functions [1.5 hours]

- [x] Implement exercise mutations and queries
  ```
  Files: convex/exercises.ts

  🎯 MODULARITY: All exercise logic in one file
  🎯 TESTABILITY: Pure functions, userId from auth context

  Functions:
  - createExercise(name: string): Id<"exercises">
  - listExercises(): Exercise[]
  - deleteExercise(id: Id<"exercises">): void

  Approach: Use ctx.auth.getUserIdentity() for userId, basic validation
  Success: Can create/list/delete exercises via Convex dashboard
  Time: 45 minutes
  ```

- [x] Implement set mutations and queries
  ```
  Files: convex/sets.ts

  🎯 MODULARITY: All set logic in one file

  Functions:
  - logSet(exerciseId: Id<"exercises">, reps: number, weight?: number): Id<"sets">
  - listSets(exerciseId?: Id<"exercises">): SetEvent[]  // optional filter
  - deleteSet(id: Id<"sets">): void

  Approach: Auto-timestamp with Date.now(), validate reps > 0
  Success: Can log/list/delete sets via Convex dashboard, filtered by exercise works
  Time: 45 minutes
  ```

---

## Phase 4: UI - Exercise Management [1 hour]

- [~] Create exercise list and creation form
  ```
  Files: src/app/exercises/page.tsx, src/components/exercises/create-exercise-form.tsx

  🎯 MODULARITY: Form component reusable, page composes logic

  Features:
  - List all exercises (useQuery)
  - Simple form: name input + create button
  - Delete button per exercise

  Approach: Convex React hooks, basic form with controlled input, Tailwind styling
  Success: Can create exercise, see in list, delete works
  Time: 45 minutes
  ```

- [ ] Add exercise selector component
  ```
  Files: src/components/exercises/exercise-selector.tsx

  🎯 MODULARITY: Reusable dropdown/select for picking exercise

  Props: onSelect: (exerciseId: Id<"exercises">) => void, selectedId?: string

  Approach: Native <select> or Radix Select, fetch exercises via useQuery
  Success: Shows exercises, selection works, updates parent state
  Time: 15 minutes
  ```

---

## Phase 5: UI - Set Logging [1.5 hours]

- [ ] Create set logging form
  ```
  Files: src/app/log/page.tsx, src/components/sets/log-set-form.tsx

  🎯 MODULARITY: Form isolated, page coordinates

  Fields:
  - Exercise selector (required)
  - Reps (number input, required)
  - Weight (number input, optional)
  - Submit button

  Approach: React Hook Form or simple controlled inputs, useMutation for logSet
  Success: Can log set with exercise+reps, optional weight works, saves to Convex
  Time: 1 hour
  ```

- [ ] Add simple validation and feedback
  ```
  Files: src/components/sets/log-set-form.tsx

  Features:
  - Reps must be > 0
  - Success message after logging
  - Clear form after submit

  Approach: Basic HTML5 validation + toast notification
  Success: Invalid input blocked, success feedback shown
  Time: 30 minutes
  ```

---

## Phase 6: UI - Set History [1 hour]

- [ ] Create set history timeline view
  ```
  Files: src/app/history/page.tsx, src/components/sets/set-list.tsx

  🎯 MODULARITY: List component presentational, page handles data

  Features:
  - Reverse-chronological list of all sets
  - Show: exercise name, reps, weight (if present), timestamp
  - Delete button per set
  - Empty state: "No sets logged yet"

  Approach: useQuery for sets, join with exercise names, format timestamps with date-fns
  Success: Shows all sets newest first, delete works, updates live
  Time: 45 minutes
  ```

- [ ] Add basic filtering (optional, if time)
  ```
  Files: src/app/history/page.tsx

  Features:
  - Filter by exercise (dropdown)
  - "Show all" option

  Approach: Pass exerciseId filter to listSets query
  Success: Filter updates list correctly
  Time: 15 minutes (bonus)
  ```

---

## Phase 7: Navigation & Polish [1 hour]

- [ ] Add navigation between pages
  ```
  Files: src/components/layout/nav.tsx, src/app/layout.tsx

  🎯 MODULARITY: Nav component reusable

  Links:
  - Exercises (manage exercises)
  - Log Set (quick log)
  - History (view all sets)
  - Sign Out button

  Approach: Simple nav bar with Next.js Link, Clerk UserButton component
  Success: Can navigate between all pages, sign out works
  Time: 30 minutes
  ```

- [ ] Basic styling and responsive layout
  ```
  Files: src/app/globals.css, various components

  Tasks:
  - Consistent spacing (Tailwind container, padding)
  - Readable typography
  - Mobile-friendly (stack on small screens)
  - Focus states for accessibility

  Approach: Tailwind utility classes, mobile-first responsive
  Success: Looks clean on desktop and mobile, accessible
  Time: 30 minutes
  ```

---

## Phase 8: Testing & Deployment [1 hour]

- [ ] Manual testing checklist
  ```
  Test flow:
  1. Sign in with Clerk
  2. Create exercise "Push-ups"
  3. Log set: 20 reps, no weight
  4. Log set: 15 reps, 10 weight
  5. View history - both sets appear
  6. Filter by exercise
  7. Delete a set
  8. Delete an exercise
  9. Sign out

  Success: All flows work, no errors in console
  Time: 20 minutes
  ```

- [ ] Deploy to Vercel
  ```
  Command: pnpm convex deploy
  Command: vercel --prod

  Files: .env.production (set CONVEX_URL, CLERK_* vars)

  Approach: Deploy Convex backend first, then Next.js to Vercel
  Success: Live URL works, can sign in and use app
  Time: 40 minutes
  ```

---

## Quality Validation (Reference - Not TODO Tasks)

**Before commits:**
- `pnpm typecheck` passes
- `pnpm lint` passes
- Manual test: create exercise → log set → view history

**🎯 Tenet Compliance:**
- **Modularity**: Convex functions by resource, React components by feature
- **Testability**: Convex functions isolated, UI components testable
- **Simplicity**: Zero analytics, zero export, zero advanced UI
- **Automation**: TypeScript strict enforces types

**Success Criteria:**
- User can sign in, create exercise, log sets, view history
- All CRUD operations work
- Mobile responsive
- Deployed and accessible

---

## Total Time Estimate: 8-10 hours (1-2 days)

**Critical Path:**
1. Setup (Convex + Clerk) → 1.5h
2. Schema + Backend → 2h
3. Exercise UI → 1h
4. Set Logging → 1.5h
5. History View → 1h
6. Nav + Polish → 1h
7. Test + Deploy → 1h

---

**Next Steps:**
1. Run `/execute` to start with Phase 1
2. After Phase 8: App is live, gather feedback
3. Prioritize BACKLOG.md items based on user needs
