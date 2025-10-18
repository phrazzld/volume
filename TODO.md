# TODO: Dashboard UX Redesign

## Progress Summary

**Status:** Phase 2.3 Complete ✅ | Phase 3 Next (Visual Design)

- ✅ **Phase 1:** Information Architecture (Navigation restructure, Exercises page)
- ✅ **Phase 2.1:** Hero Stats Card (Big numbers, icons, visual hierarchy)
- ✅ **Phase 2.2:** Quick Log Form Review (Already optimized)
- ✅ **Phase 2.3:** Exercise Grouping (Group sets by exercise, not just time)
- ⏳ **Phase 3:** Visual Design System (Colors, typography, spacing)
- ⏳ **Phase 4:** Motivational Elements (PRs, streaks, insights)
- ⏳ **Phase 5:** Mobile Optimization (Bottom sheet, touch targets)

**Previous Work:**

- ✅ shadcn/ui migration complete (PR #15)
- ✅ 150 tests passing, TypeScript clean
- ✅ React-hook-form + zod validation throughout

---

## Context & Patterns

### Current Tech Stack

- **UI Components:** shadcn/ui (Radix primitives + Tailwind)
- **Forms:** react-hook-form + zod validation
- **State:** Convex (useQuery/useMutation)
- **Icons:** lucide-react
- **Testing:** vitest + @testing-library/react
- **Styling:** Tailwind CSS (utility-first)

### Codebase Patterns

```typescript
// Data fetching
const data = useQuery(api.module.functionName, { args });

// Mutations
const mutate = useMutation(api.module.functionName);
await mutate({ args });

// Forms
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

// Error handling
import { handleMutationError } from "@/lib/error-handler";
try {
  await mutation();
} catch (error) {
  handleMutationError(error, "Context");
}
```

### Design Principles

From brainstorming session:

1. **User-facing language** - "Today" not "Dashboard", "Exercises" not "Manage"
2. **Visual hierarchy** - Hero stats > actions > details
3. **Data density** - Show value, hide noise (collapsible breakdowns)
4. **Motivational** - Celebrate achievements (PRs, streaks)
5. **Mobile-first** - Touch targets, keyboard behavior, bottom sheets

---

## Phase 2.3: Exercise Grouping (HIGH IMPACT)

**Goal:** Restructure set history to group by exercise, not just chronological order.

**Current State:**

```
Today (15 sets)
├─ 5:30 PM - Squats - 12 reps @ 315 lbs
├─ 5:33 PM - Squats - 10 reps @ 315 lbs
├─ 5:35 PM - Bench Press - 8 reps @ 225 lbs
├─ 5:38 PM - Squats - 10 reps @ 315 lbs  ← Hard to scan
└─ ...
```

**Target State:**

```
Today (3 exercises, 15 sets)

▾ Squats • 5 sets • 3,500 lbs
  ├─ 12 × 315 lbs  5:30 PM  [↻][×]
  ├─ 10 × 315 lbs  5:33 PM  [↻][×]
  ├─ 10 × 315 lbs  5:38 PM  [↻][×]
  ├─ 8  × 315 lbs  5:40 PM  [↻][×]
  └─ 8  × 315 lbs  5:42 PM  [↻][×]

▾ Bench Press • 5 sets • 4,500 lbs
  └─ ...

▾ Barbell Rows • 5 sets • 4,450 lbs
  └─ ...
```

### Implementation Tasks

- [x] **2.3.1: Create exercise grouping utility** (1h)
  - File: `src/lib/dashboard-utils.ts`
  - Function: `groupSetsByExercise(sets: Set[]) => ExerciseGroup[]`
  - Returns: Array of `{ exerciseId, sets[], totalVolume, totalReps }`
  - Sort: By most recently performed (first set in group)

- [x] **2.3.2: Create ExerciseSetGroup component** (2h)
  - File: `src/components/dashboard/exercise-set-group.tsx`
  - Props: `{ exercise, sets, onRepeat, onDelete, preferredUnit }`
  - Features:
    - Collapsible (expanded by default)
    - Shows aggregate stats in header (N sets • X volume)
    - Compact set list (no "Exercise" column needed)
    - Actions: Repeat, Delete (same as current)

- [x] **2.3.3: Update GroupedSetHistory component** (1h)
  - File: `src/components/dashboard/grouped-set-history.tsx`
  - Replace chronological table with exercise groups
  - Remove "Exercise" column (redundant)
  - Preserve time formatting, actions

- [x] **2.3.4: Update Dashboard.tsx** (30m)
  - File: `src/components/dashboard/Dashboard.tsx`
  - Pass `groupSetsByExercise(todaysSets)` to GroupedSetHistory
  - Update component title to "Today's Workout"

**Success Criteria:**

- ✓ Sets grouped by exercise, not just time
- ✓ Exercise groups collapsible (all expanded by default)
- ✓ Aggregate stats visible (N sets, X volume)
- ✓ Repeat and Delete actions still work
- ✓ Time formatting preserved
- ✓ Mobile responsive
- ✓ TypeScript clean, tests pass

**Effort:** 4-5 hours
**Risk:** Medium (data restructuring, visual changes)

---

## Phase 3: Visual Design System (POLISH)

**Goal:** Define cohesive color palette, typography scale, and spacing rhythm.

### 3.1: Color System (1h)

**Current:** Generic gray, minimal color usage
**Target:** Purposeful color for hierarchy and emotion

- [~] **Define color tokens** in `tailwind.config.ts`

```typescript
// Add to theme.extend.colors
colors: {
  // Primary: Action & Energy (blue/cyan)
  primary: {
    DEFAULT: 'hsl(210, 100%, 50%)',  // Vibrant blue
    hover: 'hsl(210, 100%, 45%)',
    active: 'hsl(210, 100%, 40%)',
  },

  // Success: Achievement (bright green)
  success: {
    DEFAULT: 'hsl(142, 76%, 36%)',
    light: 'hsl(142, 76%, 90%)',
  },

  // Accent: Attention (amber/orange)
  accent: {
    DEFAULT: 'hsl(38, 92%, 50%)',
    light: 'hsl(38, 92%, 90%)',
  },
}
```

- [ ] **Apply colors strategically**
  - Log Set button: `bg-primary hover:bg-primary-hover`
  - PR badges: `bg-success text-success-foreground`
  - Insights/tips: `border-accent bg-accent-light`
  - Keep most UI neutral (don't overuse color)

### 3.2: Typography Scale (30m)

- [ ] **Define text sizes** in `tailwind.config.ts` or use built-in scale

```typescript
// Usage guide (not config, just reference)
Hero numbers:  text-4xl (48px) font-bold      // Daily volume, PR stats
Section titles: text-xl (20px) font-semibold  // Card titles
Body text:      text-base (16px)              // Form labels, table data
Meta text:      text-sm (14px)                // Timestamps, hints
Tiny text:      text-xs (12px)                // Footnotes
```

- [ ] **Apply to key components**
  - DailyStatsCard hero numbers: Increase to `text-4xl`
  - Card titles: Ensure `text-xl font-semibold`
  - Timestamps: `text-sm text-muted-foreground`

### 3.3: Spacing Rhythm (30m)

**Current:** Inconsistent spacing
**Target:** 8px base unit throughout

- [ ] **Audit spacing** in key components
  - Card padding: `p-6` (24px)
  - Section gaps: `space-y-8` (32px)
  - Form field gaps: `gap-4` (16px)
  - Inline element gaps: `gap-2` (8px)

- [ ] **Update PageLayout** spacing
  - File: `src/components/layout/page-layout.tsx`
  - Standardize page content spacing

### 3.4: Visual Depth (30m)

- [ ] **Add subtle shadows** to cards
  - Update Card component or use `shadow-sm` utility
  - Hover states: `hover:shadow-md transition-shadow`
  - Elevate important actions (Log Set button)

**Success Criteria:**

- ✓ Consistent color usage (primary, success, accent)
- ✓ Clear typography hierarchy (4xl → xl → base → sm → xs)
- ✓ 8px base spacing rhythm
- ✓ Subtle depth via shadows
- ✓ Visual changes enhance, don't distract

**Effort:** 2-3 hours
**Risk:** Low (mostly styling tweaks)

---

## Phase 4: Motivational Elements (ENGAGEMENT)

**Goal:** Add gamification and feedback to encourage consistent use.

### 4.1: PR Detection (2h)

- [ ] **Create PR detection utility**
  - File: `src/lib/pr-detection.ts`
  - Function: `checkForPR(set, previousSets) => PRType | null`
  - Types: `'weight' | 'reps' | 'volume' | null`
  - Logic: Compare current set against all previous for same exercise

- [ ] **Create PR celebration component**
  - File: `src/components/dashboard/pr-celebration.tsx`
  - Shows: "🎉 NEW PR! Squats: 315 × 12 (previous: 315 × 10)"
  - Auto-dismiss after 5 seconds
  - Optional: Confetti animation (react-confetti library)

- [ ] **Integrate PR detection**
  - Check after each set logged
  - Show celebration toast
  - Add PR badge in set history (🏆 icon)

### 4.2: Streak Counter (1h)

- [ ] **Create streak calculation utility**
  - File: `src/lib/streak-calculator.ts`
  - Query all sets, group by day
  - Calculate consecutive days with sets logged
  - Handle timezone properly

- [ ] **Display streak in header or hero stats**
  - Component: DailyStatsCard or Nav
  - Format: "🔥 7 Day Streak"
  - Celebrate milestones (7, 30, 100 days)

### 4.3: Contextual Insights (1h)

- [ ] **Create insights generator**
  - File: `src/lib/workout-insights.ts`
  - Examples:
    - "3 more sets to beat Monday's volume!"
    - "You're 2 reps away from a new PR!"
    - "Consistent week! 5/7 days logged"

- [ ] **Display insights card** (optional)
  - Below daily stats or above set history
  - 1-2 insights max (avoid clutter)
  - Accent color border/background

### 4.4: Progress Indicators (1h)

- [ ] **Add progress vs. goals**
  - Example: "This week: ████████░░ 82% of last week's volume"
  - Could be in DailyStatsCard or separate card

**Success Criteria:**

- ✓ PR detection works accurately
- ✓ PR celebration shown (toast + badge)
- ✓ Streak counter accurate and visible
- ✓ Insights helpful, not annoying (max 1-2)
- ✓ Users feel encouraged, not pressured

**Effort:** 5-6 hours
**Risk:** Medium (logic complexity, UX balance)

---

## Phase 5: Mobile Optimization (CRITICAL UX)

**Goal:** Optimize for gym usage (primary use case is mobile).

### 5.1: Bottom Sheet Quick Log (3h)

**Current:** Inline form on page
**Target:** Floating action button → slide-up drawer

- [ ] **Add floating action button** (FAB)
  - File: `src/components/dashboard/floating-action-button.tsx`
  - Position: `fixed bottom-20 right-4` (above bottom nav)
  - Icon: Plus or Dumbbell
  - Shows: Only on mobile (hidden md:hidden)

- [ ] **Create bottom sheet drawer**
  - Library: `vaul` (shadcn-compatible) or custom
  - Slides up from bottom when FAB clicked
  - Contains QuickLogForm
  - Dismissible via swipe or backdrop click
  - Keyboard-aware (adjusts for virtual keyboard)

- [ ] **Alternative: Keep inline form, optimize spacing**
  - Simpler approach if bottom sheet is overkill
  - Ensure form always visible, not buried below hero stats

### 5.2: Touch Target Sizing (1h)

**WCAG Guideline:** Min 44×44px for touch targets

- [ ] **Audit interactive elements**
  - Buttons: Ensure `h-11` (44px) minimum
  - Form inputs: Already 46px, good
  - Icon buttons: Add padding if needed
  - Table actions (Repeat, Delete): Increase size

- [ ] **Add touch-friendly spacing**
  - Increase gaps between buttons in action columns
  - Ensure no accidental taps

### 5.3: Keyboard Behavior (1h)

- [ ] **Auto-advance on number inputs**
  - After entering reps → auto-focus weight (already done via Enter)
  - Consider auto-advance on valid input (e.g., 2 digits)

- [ ] **Numeric keyboard optimization**
  - Ensure `inputMode="numeric"` on all number fields (already done)
  - Test on iOS Safari (primary platform)

### 5.4: Performance on Low-End Devices (1h)

- [ ] **Test on throttled connection**
  - Ensure loading states visible
  - Optimistic UI updates feel instant

- [ ] **Reduce animation complexity** if needed
  - Simplify confetti or other animations
  - Ensure 60fps scrolling

**Success Criteria:**

- ✓ FAB or optimized inline form (mobile-friendly)
- ✓ All touch targets ≥44px
- ✓ Keyboard auto-advances smoothly
- ✓ No accidental taps/clicks
- ✓ Fast, responsive on mobile
- ✓ iOS Safari tested and working

**Effort:** 4-5 hours
**Risk:** Medium (platform-specific bugs, UX testing needed)

---

## Quick Wins (< 30 min each)

These can be done anytime for immediate polish:

- [ ] Add primary color to "Log Set" button
- [ ] Increase hero stat font size to `text-4xl`
- [ ] Add subtle card shadows (`shadow-sm`)
- [ ] Round volume numbers (12,450 → 12.5K)
- [ ] Add loading spinner to "Log Set" button
- [ ] Improve empty state illustrations
- [ ] Add hover states to exercise groups
- [ ] Smooth scroll to latest set after logging

---

## Testing Checklist

After each phase:

- [ ] TypeScript: `pnpm typecheck` passes
- [ ] Linting: `pnpm lint` passes
- [ ] Tests: `pnpm test --run` all passing
- [ ] Manual QA: Desktop Chrome (primary dev browser)
- [ ] Manual QA: Mobile iOS Safari (primary user platform)
- [ ] Manual QA: Dark mode toggle still works
- [ ] Manual QA: All happy paths work (log set, create exercise, delete)

---

## Commit Strategy

**Commit after each completed task** for easy rollback:

```bash
# Phase 2.3
git commit -m "feat(ui): add exercise grouping utility"
git commit -m "feat(ui): create ExerciseSetGroup component"
git commit -m "feat(ui): restructure set history by exercise"

# Phase 3
git commit -m "style: define color system (primary, success, accent)"
git commit -m "style: apply typography scale"
git commit -m "style: standardize spacing rhythm"

# Phase 4
git commit -m "feat(gamification): add PR detection"
git commit -m "feat(gamification): add streak counter"
git commit -m "feat(gamification): add contextual insights"

# Phase 5
git commit -m "feat(mobile): add floating action button"
git commit -m "feat(mobile): optimize touch targets"
git commit -m "feat(mobile): improve keyboard behavior"
```

---

## Future Considerations (Post-Redesign)

These ideas came up during brainstorming but are out of scope for current work:

- **Routine templates** - Pre-built workout structures
- **Rest timer** - Auto-start after logging set
- **Plate calculator** - Show barbell loading
- **Exercise search/filter** - For users with 50+ exercises
- **Analytics page** - Charts, trends, progress over time
- **Social features** - Share PRs, leaderboards
- **Offline mode** - IndexedDB + background sync

See `BACKLOG.md` for full roadmap.

---

## Resources

**Design Inspiration:**

- Strong app (market leader, comprehensive)
- Hevy app (social-first, community routines)
- Strava (athlete-focused, data-driven)
- Linear (clean, modern, purposeful color)

**shadcn/ui Docs:**

- Components: https://ui.shadcn.com/docs/components
- Themes: https://ui.shadcn.com/themes
- Icons (lucide): https://lucide.dev/icons

**Best Practices:**

- WCAG 2.1 AA accessibility
- Mobile-first design
- Progressive enhancement
- Semantic HTML

---

**Last Updated:** 2025-10-17
**Current Branch:** `feature/shadcn-migration` (will merge to master after Phase 2.3 + Phase 3)
