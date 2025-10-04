# TODO: Bloomberg Terminal Aesthetic Redesign (Phase 4)

## 🚧 Current Status

**Branch:** `feature/unified-dashboard`
**Phase:** 4 of 4 (Visual Redesign)
**Progress:** Phases 1-3 complete (24 commits), Phase 4 in progress

---

## Phase 4: Bloomberg Terminal Aesthetic [6-8 hours]

**Goal:** Transform UI to Bloomberg Terminal aesthetic - dense information architecture, monospace typography, systematic color coding, terminal-style panels, zero decorative elements.

**Design Principles:**
- Pure black background (#000000), high-contrast text (#f0f0f0)
- Monospace-first (IBM Plex Mono) with tabular-nums for alignment
- Systematic color coding: green=success, red=danger, yellow=warning, cyan=info
- No gradients, shadows, or rounded corners (terminal flat aesthetic)
- 1px borders everywhere, visible grid structure
- Corner bracket decorations for panel framing
- Dense spacing (maximize data per screen, ≥44px touch targets)

### 4.1: Design System Foundation

- [ ] Install IBM Plex Mono font via next/font/google
  ```
  Files: src/app/layout.tsx
  Import { IBM_Plex_Mono } from 'next/font/google'
  Configure: weight: ['400', '500', '600', '700'], variable: '--font-mono'
  Add to <html> className
  Time: 10 min
  ```

- [ ] Define terminal color palette in Tailwind config
  ```
  Files: tailwind.config.ts
  Add theme.extend.colors.terminal:
    bg: '#000000', bgSecondary: '#0a0a0a'
    border: '#333333', borderLight: '#444444'
    text: '#f0f0f0', textSecondary: '#999999', textMuted: '#666666'
    success: '#00ff00', danger: '#ff0000', warning: '#ffaa00'
    info: '#00ffff', accent: '#ffcc00'
  Time: 15 min
  ```

- [ ] Update global CSS with terminal theme variables
  ```
  Files: src/app/globals.css
  Update :root and .dark with terminal palette
  Set body font-family: var(--font-mono)
  Add font-variant-numeric: tabular-nums
  Time: 10 min
  ```

- [ ] Add terminal utility classes to Tailwind config
  ```
  Files: tailwind.config.ts
  Add spacing.terminal: '1px', borderRadius.terminal: '0px'
  Add boxShadow.terminal: 'none'
  Time: 5 min
  ```

- [ ] Force-remove all rounded corners and shadows globally
  ```
  Files: src/app/globals.css
  Add * { border-radius: 0 !important; box-shadow: none !important; }
  Exception: input/select may have 2px radius for UX
  Time: 5 min
  ```

### 4.2: UI Primitives

- [ ] Create TerminalPanel component
  ```
  Files: src/components/ui/terminal-panel.tsx (new)
  Props: children, title?, titleColor?, showCornerBrackets?, className?
  Black bg, 1px border, optional title bar (uppercase, colored)
  Optional corner brackets in corners
  Time: 45 min
  ```

- [ ] Create CornerBracket SVG component
  ```
  Files: src/components/ui/corner-bracket.tsx (new)
  Props: position (top-left/top-right/bottom-left/bottom-right), size?, color?
  8x8px L-shaped SVG lines, absolute positioned
  Time: 30 min
  ```

- [ ] Create TerminalTable component
  ```
  Files: src/components/ui/terminal-table.tsx (new)
  Props: headers, rows, columnWidths?, highlightRows?, className?
  Full-width table, 1px borders, monospace, tabular-nums
  Header: uppercase, bold, bg-terminal-bgSecondary
  Optional zebra striping
  Time: 1 hour
  ```

### 4.3: Component Redesign

- [ ] Redesign Nav with terminal aesthetic
  ```
  Files: src/components/layout/nav.tsx
  bg-terminal-bg, border-b border-terminal-border
  Logo: uppercase, monospace, bold
  Links: monospace, hover:text-terminal-info
  Active: text-terminal-accent with underline
  Time: 30 min
  ```

- [ ] Redesign DailyStatsCard as dense metrics grid
  ```
  Files: src/components/dashboard/daily-stats-card.tsx
  Wrap in TerminalPanel title="DAILY METRICS" titleColor="info"
  Remove expand/collapse (always show for density)
  Grid: 2 cols mobile, 4 cols desktop, bordered cells
  Color-coded values: sets=cyan, reps=green, volume=orange, exercises=yellow
  Time: 45 min
  ```

- [ ] Redesign QuickLogForm with terminal inputs
  ```
  Files: src/components/dashboard/quick-log-form.tsx
  Wrap in TerminalPanel title="LOG SET" titleColor="success"
  Inputs: bg-terminal-bgSecondary, border-terminal-border, monospace
  Labels: uppercase, text-xs, text-terminal-textSecondary
  Buttons: Primary=bg-terminal-success, Secondary=bordered
  Update InlineExerciseCreator styling to match
  Time: 1 hour
  ```

- [x] Redesign ExerciseManager as terminal table
  ```
  Files: src/components/dashboard/exercise-manager.tsx
  Wrap in TerminalPanel title="EXERCISE REGISTRY" titleColor="accent"
  Use TerminalTable: ["ID", "NAME", "CREATED", "SETS", "ACTIONS"]
  ID: first 6 chars, Name: editable inline, Actions: icon buttons
  Remove expand/collapse (always show)
  Time: 1.5 hours
  ```

- [x] Redesign GroupedSetHistory as dense terminal table
  ```
  Files: src/components/dashboard/grouped-set-history.tsx
  Wrap in TerminalPanel title="SET HISTORY" titleColor="warning"
  Each day: date header + TerminalTable
  Headers: ["TIME", "EXERCISE", "REPS", "WEIGHT", "ACTIONS"]
  Time: HH:MM, Reps=green, Weight=orange
  Remove SetCard (inline all in table)
  Time: 1.5 hours
  ```

- [x] Redesign FirstRunExperience with terminal welcome
  ```
  Files: src/components/dashboard/first-run-experience.tsx
  Wrap in TerminalPanel title="SYSTEM INITIALIZATION" titleColor="info"
  Replace emoji with ASCII art box
  Popular exercises: bordered grid, hover:border-terminal-info
  Time: 45 min
  ```

- [x] Redesign UndoToast with terminal styling
  ```
  Files: src/components/dashboard/undo-toast.tsx
  bg-terminal-bgSecondary, border border-terminal-success
  Text: monospace, uppercase
  Replace CheckCircle with [✓] text
  Corner brackets, fast animation (duration-100)
  Time: 30 min
  ```

### 4.4: Typography & Spacing

- [x] Tighten all component spacing for density
  ```
  Files: All dashboard components
  Panel padding: p-6 → p-3 or p-4
  Between components: space-y-6 → space-y-2 or space-y-3
  Input padding: px-4 py-2 → px-3 py-2
  Verify ≥44px touch targets on mobile
  Time: 45 min
  ```

- [x] Ensure monospace + tabular-nums everywhere
  ```
  Files: All dashboard components
  Add font-mono to all text
  Add tabular-nums to all numeric values
  Headers: font-mono font-bold uppercase
  Time: 30 min
  ```

- [x] Apply systematic color coding to metrics
  ```
  Files: All dashboard components
  Reps: text-terminal-success (green)
  Weight: text-terminal-warning (orange)
  Set count: text-terminal-info (cyan)
  Timestamps: text-terminal-textSecondary (gray)
  Time: 30 min
  ```

### 4.5: Polish & Consistency

- [x] Enable corner brackets on all panels
  ```
  Files: All TerminalPanel usages
  showCornerBrackets={true} on DailyStatsCard, QuickLogForm, etc.
  Time: 15 min
  ```

- [x] Update loading skeletons to match terminal aesthetic
  ```
  Files: src/app/page.tsx (loading state)
  bg-terminal-bgSecondary, border-terminal-border
  Match new panel layouts
  Time: 20 min
  ```

- [x] Remove theme toggle (terminal is dark-only)
  ```
  Files: src/components/layout/theme-toggle.tsx, nav.tsx
  Delete ThemeToggle component and remove from Nav
  Time: 15 min
  ```

- [x] Update focus states to cyan
  ```
  Files: src/app/globals.css
  *:focus-visible { outline: 2px solid var(--terminal-info); }
  Time: 10 min
  ```

- [x] Audit all borders for 1px consistency
  ```
  Files: All dashboard components
  Replace border-gray-* → border-terminal-border
  Replace border-2/border-4 → border (1px)
  Time: 30 min
  ```

### 4.6: Validation

- [ ] Visual regression check
  ```
  Manual inspection: all components match terminal aesthetic
  No gradients, shadows, rounded corners remain
  Time: 30 min
  ```

- [ ] Responsive design verification
  ```
  Test mobile (375px), tablet (768px), desktop (1024px+)
  Tables scroll horizontally if needed on mobile
  Touch targets ≥44px
  Time: 30 min
  ```

- [ ] Accessibility audit
  ```
  Run WAVE or axe DevTools
  Verify WCAG AA contrast (all terminal colors pass)
  Test keyboard navigation (Tab, Enter, Escape)
  Time: 30 min
  ```

- [ ] Performance check
  ```
  pnpm build → check bundle size (<150 kB)
  Profile with React DevTools (no slow renders)
  Test on mid-range mobile (no jank)
  Time: 20 min
  ```

---

## Phase 4 Completion Checklist

- [ ] All components use terminal color palette
- [ ] All text is monospace with tabular-nums
- [ ] All borders are 1px, terminal-colored
- [ ] No gradients, shadows, or rounded corners
- [ ] Corner brackets on all panels
- [ ] Spacing dense but usable (≥44px touch)
- [ ] Color coding systematic and semantic
- [ ] Loading states match terminal aesthetic
- [ ] Theme toggle removed
- [ ] Focus states use cyan
- [ ] Responsive at all breakpoints
- [ ] WCAG AA accessibility
- [ ] Bundle <150 kB
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds

**Estimated:** 6-8 hours
**Outcome:** Bloomberg Terminal aesthetic while maintaining all functionality

---

## Key Files & Patterns

**New Files to Create:**
- `src/components/ui/terminal-panel.tsx` - Bordered panel with corner brackets
- `src/components/ui/corner-bracket.tsx` - SVG L-shaped decorations
- `src/components/ui/terminal-table.tsx` - Dense tabular data component

**Files to Modify:**
- `src/app/layout.tsx` - Add IBM Plex Mono font
- `tailwind.config.ts` - Terminal color palette + utilities
- `src/app/globals.css` - Terminal theme variables, force no rounding
- `src/components/layout/nav.tsx` - Terminal styling
- `src/components/dashboard/*.tsx` - All dashboard components (terminal aesthetic)

**Patterns:**
- Wrap components in `<TerminalPanel title="..." titleColor="...">`
- Use `TerminalTable` for tabular data (exercises, history)
- Apply color semantics: green=success, red=danger, yellow=warning, cyan=info
- Force 1px borders, no rounding, no shadows
- Monospace + tabular-nums everywhere

**Dependencies:**
- IBM Plex Mono from next/font/google (~50 kB)
- lucide-react (existing) - may replace with text/symbols for terminal aesthetic
- Convex (existing) - no backend changes

---

## Quality Gates (Run Before Committing)

```bash
pnpm typecheck  # TypeScript must pass
pnpm lint       # ESLint must pass
pnpm build      # Production build must succeed
```

Manual test: Log a set, view history, edit exercise, check mobile responsiveness

---

## Completed Work (Reference)

### ✅ Phase 1: Core Dashboard (12 commits)
- Created unified dashboard with all components
- DailyStatsCard, QuickLogForm, GroupedSetHistory, SetCard
- Client-side utilities (calculateDailyStats, groupSetsByDay, sortExercisesByRecency)

### ✅ Phase 2: Smart Features (7 commits)
- InlineExerciseCreator with keyboard shortcuts
- Repeat set functionality (from card or button)
- Auto-focus flow (exercise → reps → weight → submit)
- UndoToast with 3s auto-dismiss
- Exercise sorting by recency

### ✅ Phase 3: Polish & Cleanup (5 commits)
- Slide-up animation for toast
- Expand/collapse animation for stats
- Deleted old pages (history, log, exercises)
- Deleted old components (log-set-form, set-list, etc.)
- Updated nav to remove old links
- Added loading skeletons

**Total:** 24 atomic commits on `feature/unified-dashboard`

---

## Next Steps

1. Execute Phase 4 tasks (6-8 hours)
2. Run completion checklist
3. Create PR with all 4 phases
4. Merge to master

**Target:** 1-2 days to complete Phase 4
