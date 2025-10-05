# BACKLOG: Workout Tracker - Post-MVP Enhancements

*Everything beyond basic CRUD goes here. Prioritize based on user feedback.*

---

## High Priority (v1.1) - User Requested Features

### Analytics & Insights
**Effort: 2-3 days | Value: High - core value prop**

- [ ] Daily/weekly/monthly aggregation stats
  - Total reps per exercise per period
  - Total volume (reps × weight) for weighted exercises
  - Average reps/sets per day

- [ ] Charts and visualizations
  - Line chart: reps/volume over time per exercise
  - Bar chart: total volume by exercise this week/month
  - Use Recharts or Chart.js (lightweight)

- [ ] Personal Records (PRs)
  - Track max reps (bodyweight)
  - Track max weight (weighted exercises)
  - "New PR!" celebration when beaten

- [ ] Streak tracking
  - Consecutive days with ≥1 set logged
  - Per-exercise streaks
  - Calendar heatmap view

**Implementation Notes:**
- Add `daily_exercise_stats` aggregation table in Convex
- Cron job to compute daily rollups
- Cache expensive calculations

---

### Offline-First Architecture
**Effort: 3-4 days | Value: Medium-High - enables true anywhere usage**

- [ ] Add Dexie for local IndexedDB storage
  - Mirror Convex schema locally
  - Write to Dexie first (instant feedback)
  - Background sync queue to Convex

- [ ] Sync conflict resolution
  - Last-write-wins strategy
  - Maintain `updated_at` timestamps
  - Handle concurrent edits across devices

- [ ] Offline indicator UI
  - Online/offline status badge
  - Pending sync count
  - Manual "sync now" button

- [ ] Service Worker for PWA
  - Cache static assets
  - Background sync API
  - Push notifications (optional)

**Implementation Notes:**
- Use Convex subscriptions for real-time sync
- ULID-based IDs for offline creation
- Test with DevTools offline mode

---

### Data Portability
**Effort: 1 day | Value: Medium - builds trust, enables migration**

- [ ] Export functionality
  - CSV export: exercise_name, reps, weight, timestamp
  - JSON export: full data with IDs (for re-import)
  - Download as file

- [ ] Import functionality
  - Parse CSV/JSON
  - Deduplication by ULID + timestamp
  - Merge strategy: skip duplicates, add new
  - Support Strong/FitNotes CSV formats

- [ ] Backup automation
  - Daily auto-backup to Convex storage
  - Restore from backup UI
  - Version history (last 30 days)

**Implementation Notes:**
- Client-side export with Blob API
- Server-side import with validation
- Include schema version in exports

---

## Medium Priority (v1.2) - UX Improvements

### Enhanced Set Logging UI
**Effort: 2 days | Value: Medium - improves daily usage**

- [ ] Custom numeric keypad
  - Touch-optimized for mobile
  - Quick +5 reps button
  - Decimal support for weight (e.g., 22.5kg)

- [ ] Additional set metadata
  - RPE (Rate of Perceived Exertion) 1-10 slider
  - Notes field (optional, e.g., "felt strong today")
  - Timestamp adjuster (backlog sets from earlier)

- [ ] Undo functionality
  - "Set saved. Undo?" toast with 5s timeout
  - Action queue for undo/redo

- [ ] Quick-log shortcuts
  - Pin favorite exercises to home
  - One-tap to repeat last set
  - Recent exercises at top

**Design Notes:**
- Large tap targets (≥48px)
- Haptic feedback on mobile
- Zero layout shift during input

---

### Exercise Management Enhancements
**Effort: 1 day | Value: Low-Medium**

- [ ] Exercise types
  - Bodyweight vs Weighted vs Timed vs Distance
  - Default unit per exercise (kg/lb/none)

- [ ] Exercise library
  - Pre-populated common exercises
  - Custom user-created exercises
  - Search and filter

- [ ] Tags and categories
  - Multi-tag support (e.g., "push", "upper")
  - Filter exercises by tag
  - Color coding

- [ ] Exercise templates
  - Save common workout routines
  - Quick-start a routine

---

### Workout Sessions (Optional Grouping)
**Effort: 2 days | Value: Low-Medium - organization feature**

- [ ] Session concept
  - Group sets into named sessions (e.g., "Upper Body A")
  - Start/end session with timestamps
  - Session notes

- [ ] Session history
  - List past sessions
  - Repeat session feature
  - Session duration tracking

- [ ] Rest timer
  - Set-to-set rest countdown
  - Customizable per exercise
  - Notification when rest complete

**Implementation Notes:**
- Optional feature - sets work standalone too
- `workout_sessions` table with `set_to_session` join

---

## Low Priority (v2.0+) - Advanced Features

### Progressive Web App (PWA) Full Features
**Effort: 2 days | Value: Low - nice-to-have polish**

- [ ] Install prompts
  - "Add to Home Screen" banner
  - iOS Safari install guide
  - Android Chrome install

- [ ] App manifest polish
  - Splash screens
  - Icons (192x192, 512x512)
  - Theme colors

- [ ] Push notifications
  - Workout reminders
  - Streak maintenance nudges
  - PR celebration alerts

- [ ] Share functionality
  - Share workout summary
  - Deep links to exercises
  - Social media cards

---

### Native App Features (Requires Expo or SwiftUI)
**Effort: 4-6 weeks | Value: Low - only if PWA insufficient**

- [ ] iOS widgets
  - Today's sets widget
  - Quick-log widget
  - Streak counter widget

- [ ] HealthKit integration
  - Write workout sessions to Apple Health
  - Read heart rate during sets (optional)

- [ ] Siri / App Intents
  - "Hey Siri, log 20 push-ups"
  - Shortcuts integration

- [ ] Live Activities
  - Active workout session in Dynamic Island
  - Rest timer in Live Activity

**Implementation Path:**
- Option A: Expo with React Native (reuse logic)
- Option B: SwiftUI native (best UX, most effort)
- Keep web PWA, share Convex backend

---

### Advanced Analytics & AI
**Effort: 1-2 weeks | Value: Low - experimental**

- [ ] Estimated 1RM calculations
  - Epley formula: 1RM = weight × (1 + reps/30)
  - Brzycki alternative
  - Historical 1RM progression

- [ ] Volume load tracking
  - Weekly/monthly volume trends
  - Overtraining detection
  - Deload week suggestions

- [ ] AI insights
  - "Your push-up volume is up 14% vs last week"
  - Pattern recognition (e.g., "You always skip leg day")
  - Workout recommendations

- [ ] Comparative analytics
  - Compare exercises (volume, frequency)
  - Body part distribution pie chart
  - Training balance score

---

### Social & Coaching (Future, Not v1)
**Effort: Unknown | Value: TBD - changes product direction**

- [ ] Coach sharing
  - Share workout data with trainer
  - Privacy scopes (read-only, specific exercises)
  - Coach annotations

- [ ] Social features
  - Follow friends (opt-in)
  - Leaderboards (opt-in)
  - Workout feed (opt-in)

- [ ] Program builder
  - Create workout programs
  - Track adherence to program
  - Progressive overload automation

**Note:** Requires authentication overhaul, privacy controls, moderation

---

### Platform & Performance
**Effort: Ongoing | Value: Medium - ensures scalability**

- [ ] Performance optimization
  - Virtual scrolling for large lists (react-window)
  - Code splitting by route
  - Image optimization
  - Bundle size reduction (<200KB initial)

- [ ] Accessibility audit
  - Screen reader support
  - Keyboard navigation
  - ARIA labels
  - Color contrast (WCAG AA)

- [ ] Internationalization (i18n)
  - Multi-language support
  - Unit system preference (kg/lb)
  - Date/time localization

- [ ] Error monitoring
  - Sentry integration
  - User error reporting
  - Performance monitoring

---

## Technical Debt & Refactoring

### Code Quality
- [ ] Add comprehensive test suite
  - Vitest for Convex functions
  - React Testing Library for components
  - Playwright for E2E critical paths
  - Target 80%+ coverage

- [ ] Type safety improvements
  - Remove all `any` types
  - Strict TypeScript everywhere
  - Zod schemas for validation

- [ ] Documentation
  - Component prop documentation
  - Convex function JSDoc
  - Architecture decision records (ADRs)

### Architecture Improvements
- [ ] Move to monorepo (if adding native apps)
  - Turborepo or Nx
  - Shared types package
  - Shared utilities package

- [ ] Implement hexagonal architecture
  - Domain layer (pure business logic)
  - Application layer (use cases)
  - Infrastructure layer (Convex, Dexie)
  - Presentation layer (React components)

---

## UI/UX Enhancement Ideas (Post-Polish Phase)

### 5. Data Insights & Visualization
**Effort: 2-3 weeks | Value: High - drives engagement**

#### Analytics Dashboard Enhancements
- [ ] Progress bar: today's sets vs. weekly average
- [ ] Streak indicator: "🔥 3 day streak" badge in metrics
- [ ] Mini calendar heatmap showing workout frequency
- [ ] Interactive exercise breakdown pie/bar chart
- [ ] Reps distribution insights: "Most common: 20 reps"
- [ ] Time of day patterns: "You usually train at 7PM"
- [ ] Personal record badges and highlights in history
- [ ] Weekly/monthly volume trends with sparklines
- [ ] Exercise frequency analysis and balance score
- [ ] Rest day tracking and recovery recommendations

#### Data Visualization Components
- [ ] Interactive charts (Recharts preferred for bundle size)
- [ ] Inline sparklines for quick trends
- [ ] Progress photos timeline with before/after
- [ ] Workout density heatmap (GitHub-style)
- [ ] Volume progression graphs per exercise
- [ ] Comparative analytics (this week vs. last week)
- [ ] Training split visualization

#### Smart Insights & Recommendations
- [ ] Auto-detect plateaus and suggest deload weeks
- [ ] Volume recommendations based on fitness goals
- [ ] Exercise variation suggestions when stale
- [ ] Recovery time analysis per muscle group
- [ ] Optimal training frequency insights
- [ ] Form fatigue warnings (declining reps pattern)

---

### 6. Advanced Interactions & Features
**Effort: 3-4 weeks | Value: Medium-High - power user features**

#### Enhanced Logging Experience
- [ ] Voice input: "Log 20 reps squats at 135 pounds"
  - Natural language processing
  - Fallback to manual if parse fails
  - Voice feedback confirmation

- [ ] Workout templates system
  - Save common routines (e.g., "Push Day A")
  - Quick-start templates from history
  - Community template sharing (later)

- [ ] Rich set metadata
  - Notes field per set: "felt easy", "form breakdown"
  - Photo/video attachments for form checks
  - Tags: "warmup", "dropset", "amrap"

- [ ] RPE/RIR tracking
  - Rate of Perceived Exertion (1-10 slider)
  - Reps in Reserve estimation
  - Fatigue tracking over session

- [ ] Superset & circuit grouping
  - Link sets performed back-to-back
  - Visual grouping in history
  - Circuit timer mode

- [ ] Smart rest timer
  - Auto-start after logging set
  - Customizable per exercise type
  - Progressive rest time reduction

- [ ] Exercise aliases & variations
  - "BB Squat" = "Barbell Squat"
  - Track variations separately or grouped
  - Quick variant switcher

- [ ] Bulk operations
  - Select multiple sets for batch delete
  - Batch edit exercise/weight/reps
  - Copy entire workout to new date

- [ ] Media attachments
  - Upload form check videos
  - Progress photos with date tags
  - Side-by-side comparison view

- [ ] Timer integrations
  - Countdown for timed exercises (planks)
  - EMOM (every minute on the minute) mode
  - Tabata timer integration

#### Offline & Sync Enhancements
- [ ] True offline-first architecture (Dexie.js)
- [ ] Intelligent sync queue with retry logic
- [ ] Auto-save drafts (recover from crashes)
- [ ] Conflict resolution UI for multi-device
- [ ] Background sync with service workers
- [ ] Sync status indicator and manual trigger

#### Data Management & Portability
- [ ] Advanced export options
  - CSV with custom column selection
  - JSON with full schema
  - Excel with charts
  - PDF workout summaries

- [ ] Import from competitors
  - Strong app CSV format
  - FitNotes format
  - Hevy format
  - Generic CSV mapper

- [ ] Automated backups
  - Daily encrypted backups
  - Point-in-time restore
  - Version history browser

- [ ] Privacy controls
  - Selective data deletion
  - Archive vs. delete exercises
  - GDPR compliance tools

#### Navigation & Organization
- [ ] Advanced filtering & search
  - Date range picker
  - Exercise multi-select filter
  - Cmd+K quick search palette
  - Saved filter presets

- [ ] Keyboard shortcuts (desktop)
  - L = focus log form
  - N = new exercise
  - / = search
  - Esc = clear form
  - ↑↓ = navigate history

- [ ] Navigation improvements
  - Breadcrumb showing current date
  - Jump to date modal
  - Sticky metrics while scrolling
  - Floating "scroll to top" FAB
  - Swipe left/right between days

#### Gamification & Motivation
- [ ] Goal system
  - Daily set targets with progress rings
  - Weekly volume goals per exercise
  - Custom goal creation

- [ ] Achievement badges
  - Milestones (100 sets, 1000 reps, etc.)
  - Consistency badges (7/30/90 day streaks)
  - Exercise mastery levels

- [ ] Leaderboards (opt-in)
  - Compare with friends only
  - Privacy-first design
  - Custom competitions

- [ ] Motivational features
  - Rotating quotes in empty states
  - Celebration animations on PRs
  - Progress reminders
  - "On this day" flashbacks

- [ ] Social sharing
  - "Share today's workout" card generator
  - Beautiful workout summary images
  - Opt-in public profile

#### Accessibility & Theming
- [ ] Full accessibility audit
  - ARIA labels on all controls
  - Screen reader testing (NVDA/JAWS)
  - Keyboard-only navigation
  - Focus management

- [ ] High contrast mode
  - WCAG AAA contrast ratios
  - Reduced reliance on color alone
  - Bold text option

- [ ] Color-blind friendly modes
  - Deuteranopia safe palette
  - Protanopia safe palette
  - Pattern-based differentiation

- [ ] User customization
  - Adjustable font sizing
  - Line height controls
  - Reduced motion toggle
  - Animation speed control

- [ ] Multiple theme variants
  - Cyberpunk (neon accents)
  - Retro (amber/green CRT)
  - Minimal (ultra-clean)
  - Custom theme creator

#### Terminal Aesthetic Deep Dive
- [ ] CRT effects (toggleable)
  - Scanline overlay
  - Phosphor glow
  - Screen curvature subtle
  - Flicker effect

- [ ] Retro interactions
  - Blinking cursor in inputs
  - Typewriter text on load
  - Terminal prompt ">" prefixes
  - ASCII art loading states

- [ ] Neon cyberpunk mode
  - Glowing borders on focus
  - Pulsing active states
  - Matrix-style bg animation
  - Synthwave color palette

- [ ] Sound design (opt-in)
  - Mechanical keyboard clicks
  - Terminal beep on success
  - Error buzzer on fail
  - 8-bit celebration sounds

#### Advanced Training Features
- [ ] Program tracking
  - Follow structured programs
  - 12-week program templates
  - Progress tracking vs. plan
  - Auto-progression rules

- [ ] Plate calculator
  - Show loading for target weight
  - Available plates config
  - Optimal plate arrangement

- [ ] Strength standards
  - 1RM calculator (Epley/Brzycki)
  - Compare to population norms
  - Strength level badges

- [ ] Periodization tools
  - Deload week planner
  - Volume landmarks tracking
  - Training max calculations
  - Auto-progression suggestions

---

## Decision Log

### Why These Aren't in MVP
- **Analytics**: Requires data aggregation strategy, not critical for first use
- **Offline-first**: Convex has good optimistic updates, true offline is complex
- **Export/Import**: Trust-builder but not launch blocker
- **Advanced UI**: Keypad/RPE/notes add polish but core flow works without them
- **PWA features**: Installability is nice but web app works fine
- **Sessions**: Organization layer on top of sets, not required initially

### Prioritization Criteria
1. **User Value**: Does this solve a real user problem?
2. **Simplicity**: Can we ship simpler version first?
3. **Risk**: What's likelihood of failure/scope creep?
4. **Dependencies**: What must exist before this?

### Future Architecture Decisions Needed
- When to add Dexie? (User complaints about offline)
- When to go native? (Widget requests, HealthKit demand)
- When to add auth complexity? (Coach sharing, social)
- How to handle scale? (1M+ sets per user)

---

## How to Use This Backlog

1. **After MVP launch**: Gather user feedback, measure usage patterns
2. **Prioritize**: Pick items that solve real user problems (not cool tech)
3. **Batch**: Group related items into coherent releases (v1.1, v1.2, etc.)
4. **Iterate**: Ship small, measure impact, adjust priorities

**Remember:** The best feature is the one users actually need, not the one that's technically impressive.
