# TODO - UI/UX Improvements

## 1. Form UX Enhancements

### Quick Wins
- [x] Increase touch targets to 48px minimum (buttons/inputs)
- [x] Add autofocus flow: exercise → reps → weight → submit
- [x] Implement "Repeat Last" button on history cards
- [x] Smart placeholders ("How many?" instead of "0")
- [x] Enable Enter key submission from any field
- [x] Auto-clear reps/weight after submit (keep exercise selected)
- [x] Remove number input spinners (hard to tap on mobile)
- [x] Set weight input step to 0.5 for precision

### Medium Impact
- [x] Add inline "+ Create Exercise" option in dropdown
- [x] Sort exercises by last used, not alphabetical
- [x] Pre-fill form with last logged values for selected exercise
- [x] Add weight unit toggle (lbs/kg switcher)
- [x] Show "optional" as placeholder in weight field

## 2. Visual Polish

### Typography
- [x] Increase line-height to 1.6 for body text
- [x] Add letter-spacing to headings (DAILY METRICS, LOG SET)
- [x] Use tabular-nums for metrics (prevents layout shift)
- [x] Vary font weights for better hierarchy
- [x] Increase base font size from 16px to 18px

### Color & Contrast
- [ ] Color code exercises (bodyweight=cyan, weighted=green, etc.)
- [x] Calculate and show actual volume instead of "—"
- [ ] Flash green border on form after successful submit
- [ ] Add glowing border animation on focused inputs
- [ ] Subtle hover effects on table rows (desktop)
- [ ] Subtle gradients on metrics cards

### Spacing & Layout
- [x] Increase padding in "DAILY METRICS" card
- [ ] Use consistent 16px spacing rhythm throughout
- [ ] Subtle border-width variation for depth
- [ ] Add thin dividers between collapsible sections
- [ ] Optional compact/spacious mode toggle

## 3. Mobile Optimization

### Core Patterns
- [x] Ensure `inputMode="numeric"` on number inputs
- [x] Beautiful empty states: "No sets today. Let's go! 💪"
- [ ] Optimistic UI updates (set appears before server confirms)
- [ ] Pull-to-refresh pattern for syncing
- [ ] Proper safe area insets for notched devices

### Interactions
- [ ] Swipe left on set card reveals delete button
- [~] Button press states (scale down on tap)
- [ ] Haptic feedback on successful log
- [ ] Landscape mode optimization (horizontal layout)
- [ ] Native select styling for better dropdown UX

## 4. Smart Defaults & Patterns

### Intelligent Behavior
- [x] Exercise dropdown shows recent first
- [ ] Remember last exercise between sessions
- [ ] Suggest common rep ranges based on exercise type
- [ ] Auto-increment set number for same exercise
- [ ] Quick "Copy Last Workout" feature

### Visual Scanning
- [ ] Color-code exercises in history (dots/bars)
- [ ] Group consecutive sets of same exercise
- [ ] Highlight personal records (PRs)
- [x] Show relative time ("2h ago") for recent sets
- [ ] Responsive table: stack columns on small screens

### Micro-interactions
- [x] Undo toast: "Set logged! [Undo]" for 3 seconds
- [ ] Loading skeleton screens (not blank sections)
- [ ] Smooth collapse animations on accordions
- [ ] Number counter animations when metrics change
- [ ] Success celebration on PR sets

---

**Priority Order**: Start with Quick Wins in section 1, then core patterns in section 3, then visual polish in section 2, then smart defaults in section 4.
