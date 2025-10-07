# PRD: Dashboard Reorganization - Multi-Page Navigation

## Executive Summary

**Problem**: The current dashboard is a 190-line monolithic component displaying all features (daily stats, logging, full history, exercise management) on a single page. Users must scroll to reach history or manage exercises, creating friction and cognitive overload.

**Solution**: Split dashboard into 3 focused pages (Dashboard, History, Settings) with mobile-first bottom navigation. Dashboard shows only today's data + quick logging, History shows all historical data (paginated), Settings consolidates exercise management and preferences.

**User Value**: Faster navigation (1 tap to history vs. scrolling), reduced cognitive load (single purpose per page), better mobile ergonomics (thumb-friendly bottom nav), cleaner codebase (focused components vs. god component).

**Success Criteria**: Users can access history in 1 tap, dashboard load time improves (smaller initial component), mobile users report easier navigation in user testing.

---

## User Context

### Who Uses This
- **Primary**: Fitness enthusiasts tracking workout progress on mobile devices (80%+ mobile usage expected)
- **Secondary**: Power users on desktop managing exercise libraries and analyzing historical data

### Problems Being Solved
1. **Navigation friction**: Users must scroll through entire dashboard to view past workouts or manage exercises
2. **Cognitive overload**: Too many features on one screen makes it unclear where to focus
3. **Poor mobile UX**: Scrolling on mobile is tedious; bottom navigation is ergonomic (thumb reach zones)
4. **Code maintainability**: 190-line Dashboard component with 6 responsibilities is hard to extend

### Measurable Benefits
- **Reduced taps to history**: 1 tap (bottom nav) vs. ~3 scrolls on mobile
- **Faster dashboard load**: ~40% smaller bundle (history/exercise management deferred)
- **Improved maintainability**: Dashboard splits from 190 lines → ~80 lines
- **Better mobile ergonomics**: Bottom nav hits "natural thumb zone" (bottom 1/3 of screen)

---

## Requirements

### Functional Requirements

**FR1: Dashboard Page (/ route)**
- Display daily stats card (sets/reps/volume) filtered to today only (midnight to midnight, user's timezone)
- Display quick log form (create exercises inline, log sets)
- Display today's set history (grouped by time, most recent first)
- Show loading skeleton while data fetches
- Empty state: "No sets today - Let's go! 💪"

**FR2: History Page (/history route)**
- Display all historical workout data (grouped by date, chronological order)
- Paginate with "Load More" button (initial load: 20-30 sets)
- Show exercise names for each set (with fallback for deleted exercises)
- Allow "Repeat" and "Delete" actions on each set
- Show loading skeleton while paginating
- Empty state: "No workout history yet"

**FR3: Settings Page (/settings route)**
- Display exercise manager (list all exercises with set counts)
- Allow inline editing of exercise names
- Allow deleting exercises (with confirmation + block if sets exist)
- Display weight unit toggle (lbs/kg)
- Future: Account preferences, export/import, help docs

**FR4: Bottom Navigation (Mobile < 768px)**
- Fixed position at bottom of screen
- 3 navigation items: Dashboard | History | Settings
- Show active state (highlight current route)
- Icons + labels for clarity
- Handle iOS safe area insets (notch/home indicator)

**FR5: Top Navigation (Desktop ≥ 768px)**
- Horizontal nav in existing top bar (next to logo)
- Same 3 items: Dashboard | History | Settings
- Active state with underline or color change
- Responsive breakpoint at 768px

**FR6: Inline Exercise Creation (Preserved)**
- Users can still create exercises inline in QuickLogForm
- No change to existing workflow (fast logging)
- Settings page provides bulk management (rename, delete, view all)

### Non-Functional Requirements

**NFR1: Performance**
- Dashboard initial load: < 1.5s on 3G
- History pagination: < 500ms per "Load More"
- Navigation transitions: Instant (no loading spinners between pages)

**NFR2: Mobile-First Design**
- Bottom nav optimized for thumb reach zones (ergonomic)
- Touch targets: ≥ 48px × 48px (WCAG 2.1 AAA)
- Works on viewports down to 320px width (iPhone SE)

**NFR3: Data Integrity**
- Today's sets calculated correctly across timezones (use client-side date-fns)
- History pagination preserves chronological order (no duplicate/missing sets)
- Exercise deletion blocked if sets exist (data context preserved)

**NFR4: Browser Compatibility**
- iOS Safari (handle 100vh issues with 100dvh)
- Chrome/Firefox/Safari on desktop
- Handle iOS safe areas (notch, home indicator)

**NFR5: Code Quality**
- Dashboard component reduces from 190 → ~80 lines
- History and Settings components < 150 lines each
- Shared components reused (TerminalPanel, TerminalTable)
- TypeScript strict mode (no `any` types)

---

## Architecture Decision

### Selected Approach: 3-Page Structure with Hybrid Navigation

**Pages**:
1. **Dashboard (/)**: Today's stats + quick log + today's sets
2. **History (/history)**: All historical data (paginated)
3. **Settings (/settings)**: Exercise CRUD + preferences

**Navigation**:
- Mobile: Fixed bottom nav (3 items)
- Desktop: Horizontal top nav (same 3 items)
- Active state: `usePathname()` detection

**Rationale**:
- **Simplicity**: Only 3 pages needed for MVP (analytics deferred)
- **User Value**: Matches mental model ("Today" vs. "Past" vs. "Configuration")
- **Explicitness**: Clear separation of concerns (no feature overlap)

### Alternatives Considered

| Approach | User Value | Simplicity | Risk | Why Not Chosen |
|----------|-----------|-----------|------|----------------|
| **3-Page + Bottom Nav (SELECTED)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low | **Best balance** - Mobile-first, clear boundaries |
| Tabbed Interface (Single Page) | ⭐⭐⭐ | ⭐⭐⭐ | Low | Still monolithic component, no URL state |
| Hamburger Menu (Hidden Nav) | ⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | Poor discoverability (~20% lower engagement) |
| 5-Page Structure (Add Analytics + Exercises) | ⭐⭐⭐⭐ | ⭐⭐ | High | Premature - analytics not ready, exercises fits in settings |
| Modal-Based Navigation | ⭐⭐ | ⭐⭐ | Medium | No URL state, poor mobile UX, breaks back button |

### Module Boundaries

**1. Dashboard Module** (`src/app/page.tsx` + components)
- **Interface**: Displays today's data, accepts set logging
- **Responsibility**: Filter sets to today, calculate daily stats, orchestrate quick log form
- **Hidden Complexity**: Timezone-aware date filtering, undo toast state management

**2. History Module** (`src/app/history/page.tsx` + components)
- **Interface**: Displays all historical data, accepts pagination requests
- **Responsibility**: Fetch paginated sets, group by date, handle repeat/delete actions
- **Hidden Complexity**: Convex pagination cursor management, grouping logic

**3. Settings Module** (`src/app/settings/page.tsx` + components)
- **Interface**: Displays exercise list, accepts CRUD operations
- **Responsibility**: Exercise management (create, rename, delete), preferences (weight unit)
- **Hidden Complexity**: Exercise ownership verification, deletion blocking (if sets exist)

**4. Navigation Module** (`src/components/layout/bottom-nav.tsx`, `top-nav.tsx`)
- **Interface**: Displays nav items, highlights active route
- **Responsibility**: Route detection, responsive layout, iOS safe area handling
- **Hidden Complexity**: Active state calculation, z-index stacking, viewport height fixes

**5. Date Filtering Module** (New: `src/lib/date-utils.ts`)
- **Interface**: `getTodayRange()` → `{ start: number, end: number }`
- **Responsibility**: Calculate midnight-to-midnight timestamps in user's timezone
- **Hidden Complexity**: Timezone detection, DST handling, edge cases (crossing midnight)

### Abstraction Layers

**Layer 1: UI Components** (React components, terminal aesthetic)
- Vocabulary: "Dashboard", "History", "Settings", "BottomNav"
- Handles: User interactions, rendering, styling

**Layer 2: Data Fetching** (Convex hooks: `useQuery`, `useMutation`, `usePaginatedQuery`)
- Vocabulary: "Sets", "Exercises", "Pagination", "Mutations"
- Handles: Real-time subscriptions, optimistic updates, error handling

**Layer 3: Business Logic** (Utility functions: `dashboard-utils.ts`, `date-utils.ts`)
- Vocabulary: "Stats", "Volume", "Grouping", "Today Range"
- Handles: Calculations, transformations, filtering

**Layer 4: Data Storage** (Convex backend: queries, mutations, schema)
- Vocabulary: "Tables", "Indexes", "Auth", "Validation"
- Handles: Database queries, ownership verification, data integrity

Each layer changes vocabulary and abstracts away lower-layer complexity.

---

## Dependencies & Assumptions

### External Dependencies
- **Next.js 15**: App Router for routing, `usePathname()` for active state
- **Convex**: Real-time queries, pagination API (`usePaginatedQuery`)
- **date-fns**: Timezone-aware date calculations (`startOfDay`, `endOfDay`)
- **Lucide React**: Icons for navigation (Home, History, Settings)
- **Tailwind CSS**: Responsive classes (`md:hidden`, `md:block`), safe area utilities

### Assumptions
- **Scale**: Users have < 10,000 sets (pagination sufficient, no need for virtualization)
- **Mobile Usage**: 80%+ of users on mobile (justifies bottom nav priority)
- **Timezone**: Users primarily work out in one timezone (edge case: traveling users cross midnight)
- **Browser**: Modern browsers (Safari 15+, Chrome 90+, Firefox 88+)
- **iOS**: Safe area insets supported (iOS 11+, 99% of devices)

### Environment Requirements
- **Client-side Date Calculation**: Browser must expose `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Viewport Height**: Support for `100dvh` CSS unit (fallback to `100vh` for older browsers)
- **Navigation**: JavaScript enabled (no SSR fallback for bottom nav active state)

### Integration Points
- **Clerk Middleware**: All new routes (`/history`, `/settings`) already protected by existing middleware
- **Existing Components**: Reuse `TerminalPanel`, `TerminalTable`, `DailyStatsCard`, `QuickLogForm`, `GroupedSetHistory`, `ExerciseManager`
- **Convex Schema**: No changes required (existing indexes support new queries)

---

## Implementation Phases

### Phase 1: MVP (Core Functionality)
**Goal**: Ship 3-page navigation with today/history split

**Tasks**:
1. **Create Date Utilities** (`src/lib/date-utils.ts`)
   - `getTodayRange()` function (midnight to midnight in user's timezone)
   - Handle DST transitions (date-fns automatically handles)
   - Unit tests for timezone edge cases

2. **Create Bottom Navigation** (`src/components/layout/bottom-nav.tsx`)
   - Fixed position with `z-50`, `pb-safe` for iOS
   - 3 items: Dashboard | History | Settings
   - Active state with `usePathname()`
   - Icons + labels (Lucide React)

3. **Create Top Navigation** (`src/components/layout/top-nav.tsx`)
   - Horizontal layout in existing Nav component
   - Same 3 items, responsive with `hidden md:block`
   - Active state (underline or color change)

4. **Update Root Layout** (`src/app/layout.tsx`)
   - Add bottom nav (mobile only)
   - Add content padding (`pb-20 md:pb-0`)
   - Add safe area utilities to globals.css
   - Use `100dvh` instead of `100vh`

5. **Refactor Dashboard** (`src/app/page.tsx`)
   - Filter sets to today only (use `getTodayRange()`)
   - Remove `GroupedSetHistory` (move to history page)
   - Remove `ExerciseManager` (move to settings page)
   - Keep `DailyStatsCard`, `QuickLogForm`, today's set list
   - Reduce from 190 → ~80 lines

6. **Create History Page** (`src/app/history/page.tsx`)
   - Import `GroupedSetHistory` component
   - Use `usePaginatedQuery` for sets (initial: 20-30 items)
   - "Load More" button (show when `status === "CanLoadMore"`)
   - Loading skeleton (show when `status === "LoadingMore"`)
   - Empty state: "No workout history yet"

7. **Create Settings Page** (`src/app/settings/page.tsx`)
   - Import `ExerciseManager` component
   - Add weight unit toggle (reuse `WeightUnitContext`)
   - Section headers: "Exercise Management", "Preferences"
   - Future: Account settings, export/import

8. **Add Pagination to Convex** (`convex/sets.ts`)
   - Create `listSetsPaginated` query
   - Use `.paginate(args.paginationOpts)` (Convex API)
   - Preserve `by_user_performed` index for performance

**Deliverables**:
- 3 functional pages with navigation
- Today's sets filtered correctly
- History paginated (20-30 items per load)
- Bottom nav works on mobile, top nav on desktop

**Estimated Effort**: 6-8 hours

### Phase 2: Hardening (Polish & Edge Cases)
**Goal**: Handle edge cases, improve UX, fix iOS issues

**Tasks**:
1. **Loading Skeletons**
   - Dashboard: Stats card + form + set list skeletons
   - History: Grouped set skeletons (3-5 groups)
   - Settings: Exercise list skeleton
   - Match final layout dimensions (no layout shift)

2. **Error Boundaries**
   - Page-level error boundaries (catch data fetching errors)
   - Graceful degradation (show error message + retry button)
   - Toast notifications for mutation errors

3. **iOS Testing & Fixes**
   - Test on iPhone SE, 14 Pro, 15 Pro Max (various safe areas)
   - Verify bottom nav doesn't cover content
   - Test in Safari (address bar hiding/showing)
   - Verify `100dvh` works correctly

4. **Empty States**
   - Dashboard: "No sets today - Let's go! 💪" (with CTA to log set)
   - History: "No workout history yet" (with CTA to log first set)
   - Settings: "No exercises yet" (with CTA to create first exercise)

5. **Performance Optimization**
   - Lazy load history page (dynamic import)
   - Lazy load settings page (dynamic import)
   - Memoize expensive calculations (`useMemo` for stats)

**Deliverables**:
- Smooth loading states (no flashes or layout shift)
- Error handling for all failure scenarios
- iOS safe area working correctly
- Empty states with clear CTAs

**Estimated Effort**: 3-4 hours

### Phase 3: Future Enhancements (Post-MVP)
**Goal**: Add features as user needs emerge

**Potential Additions**:
1. **History Filters**
   - Date range picker (last 7 days, last 30 days, custom range)
   - Exercise filter (dropdown: "All Exercises" or specific exercise)
   - Search bar (filter by exercise name)

2. **Settings Expansion**
   - Account settings (email, password, delete account)
   - Export/import (CSV, JSON)
   - Notification preferences (future: push notifications)
   - Help/documentation links

3. **Analytics Page** (`/analytics`)
   - Add 4th nav item: Dashboard | History | Analytics | Settings
   - PRs, streaks, charts (see BACKLOG.md)
   - Requires data aggregation logic (defer until user request)

4. **Keyboard Shortcuts**
   - `g d` → Dashboard
   - `g h` → History
   - `g s` → Settings
   - Terminal aesthetic: Show shortcuts in footer

**Estimated Effort**: Variable (defer until user feedback)

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Timezone edge cases** (DST, traveling users) | Medium | Medium | Use date-fns (handles DST), test with multiple timezones, document behavior (today = device timezone) |
| **iOS safe area issues** (notch, home indicator) | Medium | High | Use `pb-safe` utility (env(safe-area-inset-bottom)), test on multiple iOS devices, fallback to fixed padding |
| **Pagination performance** (10,000+ sets) | Low | Medium | Convex handles pagination efficiently, add virtualization if needed (future), monitor query performance |
| **Bottom nav covers content** | Medium | High | Add `pb-20` to content wrapper, test on multiple devices, ensure footer visible (flexbox layout) |
| **Active route detection fails** | Low | Low | `usePathname()` is reliable, add fallback (default to dashboard), test all route transitions |
| **Users miss inline exercise creation** | Low | Medium | Keep inline creation in QuickLogForm (no workflow change), add tooltip/hint on first use |
| **Mobile users don't find settings** | Low | Medium | Bottom nav always visible (no hidden menus), use clear icons + labels, test with 5 users |

---

## Key Decisions

### Decision 1: 3 Pages (Not 4 or 5)
**What**: Dashboard, History, Settings (defer Analytics, merge Exercises into Settings)

**Alternatives**:
- 4 pages: Add dedicated Exercises page
- 5 pages: Add Analytics page now

**Rationale**:
- **User Value**: 3 pages match mental model (Today, Past, Config)
- **Simplicity**: Exercises fit naturally in Settings (both are configuration)
- **Explicitness**: Analytics not ready yet (avoid "Coming Soon" placeholder)

**Tradeoffs**:
- Pro: Cleaner nav, faster to ship
- Con: Settings page may grow large (mitigate with tabs/sections later)

### Decision 2: Bottom Nav on Mobile (Not Hamburger Menu)
**What**: Fixed bottom nav with 3 always-visible items

**Alternatives**:
- Hamburger menu (hidden drawer)
- Floating action button + menu

**Rationale**:
- **User Value**: Always visible = faster navigation (~20% higher engagement vs. hamburger)
- **Simplicity**: No state management (open/close), no overlay
- **Explicitness**: All features discoverable (no "out of sight, out of mind")

**Tradeoffs**:
- Pro: Ergonomic (thumb reach), industry standard (Instagram, Strava)
- Con: Takes permanent screen space (mitigate with small height: 64px)

### Decision 3: "Load More" Button (Not Infinite Scroll)
**What**: History page uses button to load next 20 sets

**Alternatives**:
- Infinite scroll (auto-load on scroll)
- Traditional pagination (numbered pages)

**Rationale**:
- **User Value**: Predictable, user controls loading, footer always reachable
- **Simplicity**: Convex `usePaginatedQuery` makes this trivial
- **Explicitness**: User sees loading state, knows when more data exists

**Tradeoffs**:
- Pro: Simple implementation, good UX on mobile
- Con: Extra tap required (acceptable for fitness app - users don't browse deep history often)

### Decision 4: Midnight-to-Midnight (Not Last 24 Hours)
**What**: "Today" means calendar day (midnight to midnight in user's timezone)

**Alternatives**:
- Last 24 hours (rolling window)
- Current workout session (since app opened)

**Rationale**:
- **User Value**: Matches mental model ("What did I do today?")
- **Simplicity**: Clear boundary (resets at midnight)
- **Explicitness**: Users understand "today" = calendar day (no confusion)

**Tradeoffs**:
- Pro: Intuitive, aligns with daily habits
- Con: Edge case: User crosses midnight mid-workout (acceptable - stats recalculate on next page load)

### Decision 5: Client-Side Date Filtering (Not Server-Side)
**What**: Calculate today's date range in browser, pass timestamps to Convex

**Alternatives**:
- Server-side calculation (Convex function)
- Hybrid (server detects timezone from request)

**Rationale**:
- **User Value**: Accurate timezone (browser knows user's current location)
- **Simplicity**: No timezone passing required, works offline (PWA future)
- **Explicitness**: Browser API is authoritative source for user's timezone

**Tradeoffs**:
- Pro: Handles traveling users, DST transitions automatic
- Con: Requires JavaScript enabled (acceptable - app already requires JS)

---

## Summary

### Approach Selected
**3-page structure with mobile-first bottom navigation**. Dashboard shows today's data, History shows all paginated data, Settings consolidates exercise management and preferences.

### User Value Delivered
- **1-tap access** to history and settings (vs. scrolling on dashboard)
- **Reduced cognitive load** (single purpose per page)
- **Better mobile ergonomics** (bottom nav in thumb reach zone)
- **Faster dashboard load** (~40% smaller bundle)

### Timeline Estimate
- **Phase 1 (MVP)**: 6-8 hours
- **Phase 2 (Hardening)**: 3-4 hours
- **Total**: 10-12 hours

### Complexity Assessment
**Medium** - Straightforward refactor with clear module boundaries. Main risks are timezone edge cases (mitigated with date-fns) and iOS safe area issues (mitigated with pb-safe utility).

---

**Next Step**: Run `/plan` to break this PRD into implementation tasks.
