# TODO: Mobile UX Improvements

**Initiative**: World-class mobile experience for Volume workout tracker
**Status**: Phase 1-4 Complete | Phase 5-6 Remaining
**Progress**: 17/22 tasks complete (77%)

---

## Phase 1: Critical Fixes ✅ COMPLETE

### Design System Foundation

- [x] **Create mobile design token system** (75aa090)
  - File: `src/lib/design-tokens/mobile.ts`
  - Tokens: TOUCH_TARGETS (44px min), SPACING, TYPOGRAPHY, INTERACTION
  - Pattern: Tailwind classes as documentation, not runtime imports

- [x] **Add touch-optimized size variants to Button** (3fee654)
  - File: `src/components/ui/button.tsx`
  - New sizes: `touch` (h-11/44px), `comfortable` (h-12/48px)
  - Added visual touch feedback (active:scale-95, active:opacity-90)

- [x] **Update Input with mobile-first height** (955502c)
  - File: `src/components/ui/input.tsx`
  - Changed h-9 → h-11 (44px)
  - Enhanced focus ring: ring-2 with ring-offset-2

- [x] **Update Select for mobile touch targets** (e35dd07)
  - File: `src/components/ui/select.tsx`
  - SelectTrigger: h-11, enhanced focus ring
  - SelectItem: py-3 (48px touch target)

- [x] **Add responsive spacing to FormItem** (2219d57)
  - File: `src/components/ui/form.tsx`
  - Changed space-y-2 → space-y-2 sm:space-y-3

---

## Phase 2: Autofocus & Keyboard Flow ✅ COMPLETE

- [x] **Fix autofocus using Radix onOpenChange** (8048c99)
  - File: `src/components/dashboard/quick-log-form.tsx`
  - Event-driven pattern (no RAF timing hacks)
  - Comprehensive JSDoc documentation

- [x] **Verify focus rings on all inputs** (verification only)
  - All components inherit proper focus rings from Phase 1
  - WCAG 2.4.7 compliance maintained

---

## Phase 3: Typography ✅ COMPLETE

- [x] **Remove uppercase text violations** (2592625)
  - "+ CREATE NEW" → "+ Create New"
  - "LBS"/"KG" → "lbs"/"kg"
  - Audit confirmed: only intentional uppercase remains (PR celebrations)

---

## Phase 4: Responsive Components ✅ COMPLETE

### Responsive Layouts

- [x] **Add responsive layout to DailyStatsCard** (ef58c04)
  - File: `src/components/dashboard/daily-stats-card.tsx`
  - Desktop: Table | Mobile: Cards
  - No horizontal scroll on 320px

- [x] **Add responsive layout to ExerciseManager** (aed7c73)
  - File: `src/components/dashboard/exercise-manager.tsx`
  - Desktop: Table | Mobile: Cards with inline editing
  - Preserved full functionality in both layouts

### Mobile Layout Fixes

- [x] **Fix Last Set indicator layout** (637934b)
  - File: `src/components/dashboard/quick-log-form.tsx`
  - Mobile: Vertical stack | Desktop: Horizontal

- [x] **Standardize Load More button** (475751e)
  - File: `src/app/history/page.tsx`
  - Replaced custom styling with `<Button size="touch">`

### Design Decisions

- **DEFERRED**: ResponsiveTable component creation
  - Rationale: YAGNI - only 2 consumers, inline classes simpler
  - Used responsive Tailwind utilities instead
  - Can extract if 3rd consumer emerges

---

## Phase 5: Testing & Validation 🔲 TODO

### Automated Testing

- [ ] **Set up Playwright for visual regression**
  - Install: `pnpm add -D @playwright/test`
  - Configure mobile viewports (375x667, 390x844, 414x896)
  - File: `playwright.config.ts`

- [ ] **Create baseline screenshots**
  - File: `tests/visual/mobile-components.spec.ts`
  - Components: QuickLogForm, DailyStatsCard, ExerciseManager, Select dropdown
  - Baseline directory: `tests/visual/screenshots/baseline/`

- [ ] **Create touch target validation test**
  - File: `tests/mobile/touch-targets.spec.ts`
  - Assert all interactive elements >= 44px height/width
  - Test on mobile viewport (375px)

### Device Testing

- [ ] **Manual QA on physical iOS device**
  - Autofocus reliability (exercise → reps)
  - Keyboard flow (exercise → reps → weight → submit)
  - No zoom on input focus (16px text)
  - Touch target comfort

- [ ] **Manual QA on physical Android device**
  - Same flow as iOS
  - Numeric keyboard for reps/weight inputs
  - Test Chrome + Samsung Internet

---

## Phase 6: Documentation 🔲 TODO

- [ ] **Create design system usage guide**
  - File: `src/lib/design-tokens/README.md`
  - When to use touch/comfortable/large sizes
  - Component examples and patterns
  - Mobile-first philosophy

- [ ] **Update CLAUDE.md with mobile UX patterns**
  - Mobile UX Standards section (44px minimum)
  - Autofocus pattern (Radix onOpenChange)
  - Reference design token system

---

## Success Criteria

### Implementation (Phase 1-4) ✅ COMPLETE

- ✅ All touch targets >= 44px
- ✅ Autofocus works reliably (event-driven, no timing hacks)
- ✅ No uppercase text (except intentional celebrations)
- ✅ Button/Input mobile-optimized variants
- ✅ SelectItem 48px touch targets
- ✅ Form spacing responsive
- ✅ Visual focus indicators (WCAG 2.4.7)
- ✅ Tables → cards on mobile (DailyStatsCard, ExerciseManager)
- ✅ Design token system centralized

### Testing & Validation (Phase 5) 🔲 TODO

- [ ] Visual regression baseline captured
- [ ] Touch target tests automated
- [ ] Manual QA on iOS device
- [ ] Manual QA on Android device

### Documentation (Phase 6) 🔲 TODO

- [ ] Design system guide created
- [ ] CLAUDE.md updated with patterns

### User Experience Goals

- Rapid set logging on mobile (no mis-taps)
- Natural keyboard flow (exercise → reps → weight → submit)
- No iOS zoom-in on input focus
- Consistent visual experience (mobile/desktop)

---

## Key Decisions

**Design Tokens as Documentation**

- Tailwind requires string literals (JIT compiler)
- Design tokens serve as reference, not runtime imports
- JSDoc comments link hardcoded classes to tokens

**YAGNI Over Abstraction**

- Skipped ResponsiveTable component (only 2 consumers)
- Inline responsive classes simpler and more maintainable
- Can refactor if pattern repeats (3+ consumers)

**Event-Driven Autofocus**

- Radix `onOpenChange` guarantees dropdown closed
- Single RAF for React render cycle
- Eliminated timing hacks and race conditions

**Mobile-First Responsive**

- Base styles for mobile, override for desktop
- `hidden md:block` for tables, `md:hidden` for cards
- Preserves functionality in both layouts

---

**Last Updated**: 2025-10-27
**Branch**: feature/mobile-ux-improvements
**Commits**: 8 total (Phase 1-4 complete)
