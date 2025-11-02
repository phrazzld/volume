# TODO: Analytics "War Room" Dashboard

**Branch**: `feature/analytics-ai-insights`
**Status**: Phase 9 - Final Integration & Testing
**Progress**: 27/45 tasks complete (60%)

## 📊 Current Status

All core features implemented and working:

- ✅ Full-width responsive dashboard layout (12-column grid)
- ✅ Progressive overload tracking with mini charts
- ✅ Muscle group recovery dashboard with 11 categories
- ✅ Focus suggestions (rule-based recommendations)
- ✅ Enhanced AI insights card (automated reports only)
- ✅ Timezone detection and sync (Clerk integration)
- ✅ Automated report generation (daily/weekly/monthly crons)
- ✅ Activity heatmap with proper tooltips
- ✅ Streak tracking and PR cards

**Remaining**: Manual testing, type safety verification, build checks

---

## ✅ Completed Phases (Archive)

### Phase 1: Layout Foundation & Quick Fixes

**Status**: ✅ COMPLETE | **Tasks**: 4/4

- Full-width analytics layout (`maxWidth={false}`)
- Activity heatmap duplicate legend removal
- VolumeChart component removal
- 12-column responsive grid implementation

**Key Commits**: 43cc944, 80a7b17

---

### Phase 2: Progressive Overload Widget

**Status**: ✅ COMPLETE | **Tasks**: 2/2

- Backend query (`analyticsProgressiveOverload.ts`) with trend detection
- Frontend widget with mini charts and trend indicators (↗️ ↔️ ↘️)

**Features**:

- Top 5 exercises by recent activity
- Last 10 workouts tracked per exercise
- 5% threshold for trend detection
- Recharts mini sparklines

---

### Phase 3: Muscle Group System & Recovery Dashboard

**Status**: ✅ COMPLETE | **Tasks**: 3/3

- Muscle group mapping system (11 categories with fuzzy matching)
- Recovery tracking backend query (`analyticsRecovery.ts`)
- Recovery dashboard widget with color-coded status

**Muscle Groups**: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core, Other

**Color Coding**:

- 0-2 days: Fresh (green)
- 3-4 days: Recovering (yellow)
- 5-7 days: Ready (orange)
- 8+ days: Overdue (red)
- Never trained: Gray

---

### Phase 4: Focus Suggestions Widget

**Status**: ✅ COMPLETE | **Tasks**: 2/2

- Backend query (`analyticsFocus.ts`) with rule-based recommendation engine
- Frontend widget with priority sorting and deep links

**Suggestion Types**:

- Neglected muscle groups (8+ days since last trained)
- Push/pull imbalance (33%+ difference in volume)
- 3-5 suggestions max, sorted by priority

---

### Phase 5: Enhanced AI Insights Card

**Status**: ✅ COMPLETE | **Tasks**: 2/2

- Removed manual report generation UI (automation only)
- Added report type badge (Daily/Weekly/Monthly)

**Design**: Automated cron-driven reports, no user controls

---

### Phase 6: Schema Changes for Users & Timezone

**Status**: ✅ COMPLETE | **Tasks**: 1/1

- Added `users` table with timezone and report preferences
- Fields: `clerkUserId`, `timezone`, `dailyReportsEnabled`, `weeklyReportsEnabled`, `monthlyReportsEnabled`
- Indexes: `by_clerk_id`, `by_daily_enabled`, `by_timezone`

---

### Phase 7: Client-Side Timezone Detection

**Status**: ✅ COMPLETE | **Tasks**: 2/2

- `useTimezoneSync` hook with Clerk auth guards
- Integration in `ConvexClientProvider`

**Auth Safety**: Only fires after `isLoaded=true` and `isSignedIn=true` to prevent race conditions

**Key Fix**: 6dad555 - Eliminated "Unauthorized" error on page load

---

### Phase 8: Automated Report Generation System

**Status**: ✅ COMPLETE | **Tasks**: 5/5

#### 8.1 Schema for Report Types

- Added `reportType` field to `aiReports` table
- Added compound index `by_user_type_date`
- Fixed Convex naming (renamed `muscle-group-mapping` → `muscle_group_mapping`)

#### 8.2 Report Generation Logic

- `calculateDateRange` helper (daily/weekly/monthly)
- Updated `generateReport` mutation with `reportType` parameter
- Backward compatible (defaults to "weekly")

#### 8.3 Daily Reports Cron

- Hourly cron with timezone-aware midnight detection
- `getEligibleUsersForDailyReports` query
- `generateDailyReports` action
- Distributes load across 24 hours

#### 8.4 Monthly Reports Cron

- Monthly cron (1st of month at midnight UTC)
- `getActiveUsersWithMonthlyReports` query
- `generateMonthlyReports` action

#### 8.5 Query Enhancement

- Added `reportType` filtering to `getLatestReport`
- Optional parameter for targeted report retrieval

**Cron Schedule**:

- **Daily**: Hourly at :00 (timezone-aware)
- **Weekly**: Sunday 9 PM UTC
- **Monthly**: 1st of month, midnight UTC

**Key Commits**: be38bfd, 11453ad, 64eb4cc, 016fc74, 0b3dc46

---

## 🎯 Active Tasks - Phase 9: Final Integration & Testing

### 9.1 Analytics Page Layout Finalization

**Status**: ✅ COMPLETE

- [x] Finalize grid layout with all widgets in correct order
- [x] All imports present
- [x] Loading state checks complete

**Final Layout**:

1. AI Insights (12 cols full width)
2. Focus Suggestions (4 cols) + Progressive Overload (8 cols)
3. Recovery Dashboard (6 cols) + Activity Heatmap (6 cols)
4. Streak Card (4 cols) + PR Card (8 cols)

---

### 9.2 Manual Testing Checklist

- [ ] **Responsive Layout Testing**
  - Mobile (360px): Single column stack, no horizontal scroll
  - Tablet (768px): 6-column layout, proper spacing
  - Desktop (1440px): 12-column grid, full width utilization
  - Ultra-wide (1920px+): Content spreads to edges, no awkward gaps

- [ ] **Progressive Overload Widget**
  - Create test user with 20+ sets across 3+ exercises
  - Verify mini charts render correctly
  - Test hover tooltips show dates and values
  - Verify trend indicators (↗️ ↔️ ↘️) match actual progression

- [ ] **Recovery Dashboard**
  - Balanced training: All muscle groups green/yellow
  - Imbalanced training: Some muscle groups red (8+ days)
  - Brand new user: All muscle groups gray (never trained)
  - Verify color coding matches days since last trained

- [ ] **Focus Suggestions**
  - Scenario: Haven't trained legs in 10 days → high priority suggestion
  - Scenario: Too much push, not enough pull → balance suggestion
  - Test deep link to log page works

- [ ] **AI Insights Card**
  - Verify no manual generation buttons visible
  - Check placeholder text for new users
  - Verify report type badge displays correctly (Daily/Weekly/Monthly)
  - Test with different report types

- [ ] **Timezone Detection**
  - Check browser console for timezone detection logs
  - Verify timezone saved to users table in Convex dashboard
  - Test with different timezones (mock system timezone if possible)
  - Verify no "Unauthorized" errors on page load

- [ ] **Activity Heatmap**
  - Verify only one legend visible (library default)
  - Test hover shows date and set count
  - Verify GitHub-style color scheme matches theme (light/dark)

- [ ] **Loading States**
  - Verify skeleton loaders render correctly for all widgets
  - Test all widgets handle undefined/null data gracefully
  - Ensure no console errors during loading

- [ ] **Empty States**
  - New user with no data: All empty states visible
  - User with minimal data: Partial empty states
  - Verify empty state messages are helpful and actionable

---

### 9.3 Type Safety Verification

- [ ] Run TypeScript type check: `pnpm typecheck`
  - Fix any type errors
  - Ensure all props properly typed
  - Verify no `any` types in new code
  - **Success Criteria**: Zero errors

---

### 9.4 Test Suite Execution

- [ ] Run full test suite: `pnpm test --run`
  - Verify all existing tests still pass
  - Verify all new backend query tests pass (progressive overload, recovery, focus)
  - Verify muscle group mapping tests pass
  - **Current**: 381 tests passing
  - **Success Criteria**: All tests pass

---

### 9.5 Production Build Verification

- [ ] Run production build: `pnpm build`
  - Ensure Next.js builds without errors
  - Verify bundle size is reasonable (no massive increases)
  - Check for any build warnings (ignore themeColor/viewport deprecation)
  - **Success Criteria**: Build completes successfully

---

## 📝 Reference & Notes

### Design Decisions

**Muscle Group Categories** (11 total):

- Upper: Chest, Back, Shoulders, Biceps, Triceps
- Lower: Quads, Hamstrings, Glutes, Calves
- Core: Core
- Fallback: Other

**Report Timing**:

- Daily: Opt-in only (default OFF) - future paywall feature
- Weekly: Enabled by default for active users
- Monthly: Opt-in only (default OFF)

**No Manual Generation**: All reports automated via cron jobs, no user controls

**Timezone Handling**:

- Client-side detection using `Intl.DateTimeFormat`
- Stored per-user in `users` table
- Hourly cron checks for midnight in each timezone

**Progressive Overload**:

- Top 5 exercises by recent activity
- Last 10 workouts tracked per exercise
- Trend threshold: 5% change between last 3 and previous 3 workouts

**Recovery Status Color Coding**:

- 0-2 days: Fresh (green) - recently trained
- 3-4 days: Recovering (yellow) - in recovery window
- 5-7 days: Ready (orange) - optimal training window
- 8+ days: Overdue (red) - neglected muscle group
- Never trained: Gray - no data

**Focus Suggestions**:

- Rule-based V1 (simple heuristics)
- 3-5 suggestions max
- Priority sorted (neglected > imbalance)
- Deep links to log page with exercise pre-selected

### Technical Notes

**Grid System**:

- Mobile: 1 column
- Tablet (md): 6 columns
- Desktop (lg): 12 columns
- Gap: 1rem (md), 1.5rem (lg)

**Convex Naming**:

- Files must use alphanumeric + underscores only (no hyphens)
- Example: `muscle_group_mapping.ts` not `muscle-group-mapping.ts`

**Auth Race Condition Fix**:

- Hook `useTimezoneSync` guards with `isLoaded` and `isSignedIn` checks
- Mutation `updateUserTimezone` returns early instead of throwing for unauthenticated
- Prevents "Unauthorized" errors during Clerk initialization

---

## 🎯 Success Criteria

When Phase 9 is complete:

1. ✅ All TypeScript checks pass (`pnpm typecheck`)
2. ✅ All tests pass (`pnpm test --run`)
3. ✅ Production build succeeds (`pnpm build`)
4. ✅ Manual testing checklist complete
5. ✅ No console errors on page load
6. ✅ Analytics dashboard is fully responsive (mobile → ultra-wide)
7. ✅ All widgets render correctly with real data
8. ✅ Empty states handled gracefully for new users
9. ✅ Cron jobs running successfully (check Convex logs)

---

**Feature Branch Ready for Merge**: When all Phase 9 tasks complete
