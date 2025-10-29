# TASK: Workout Analytics & AI Insights

## Executive Summary

Add comprehensive analytics dashboard to Volume app, combining quantitative metrics (PRs, volume, frequency, streaks) with GPT-5-powered qualitative analysis. Users get data-driven performance tracking plus technical insights on trends, plateaus, and optimization opportunities. Success measured by user engagement with analytics tab and perceived value of AI insights.

**Solution**: New `/analytics` tab with 4 metric cards + trend charts + AI-generated weekly technical reports. Leverages existing PR detection system, adds Convex analytics queries, integrates GPT-5 mini for cost-effective qualitative analysis (~$0.002/report).

**User Value**: Balanced motivation (celebrating PRs, streaks) + performance optimization (volume trends, plateau detection, recovery analysis). Transforms raw workout logs into actionable training intelligence.

## User Context

**Who**: Strength training enthusiasts tracking progressive overload across exercises
**Problems Being Solved**:

- Cannot see progress patterns across weeks/months (volume trends, consistency)
- Miss PR achievements that deserve celebration
- Don't know when plateaus occur or how to adjust training
- Lack narrative understanding of their training journey

**Measurable Benefits**:

- Visual proof of progress → increased motivation and retention
- Early plateau detection → optimize training before stalling
- Consistency tracking (heatmap/streaks) → habit reinforcement
- AI technical analysis → expert-level insights without coach cost

## Requirements

### Functional Requirements

**Core Metrics (Quantitative)**:

1. **Personal Records (PRs)**
   - Leverage existing `src/lib/pr-detection.ts` system
   - Display: max weight, max reps, max volume per exercise
   - Show recent PRs (last 7/30 days) with celebration UI
   - Track estimated 1RM using Epley formula: `weight * (1 + reps/30)`

2. **Volume Tracking**
   - Total volume per exercise over time (sets × reps × weight)
   - Weekly/monthly volume aggregation
   - Muscle group distribution (if categorization added later)
   - Visualize with line/bar charts (Recharts)

3. **Workout Frequency**
   - GitHub-style contribution graph (365-day heatmap)
   - Show days with workouts vs. rest days
   - Intensity coloring based on total sets/volume per day
   - Use `react-activity-calendar` library

4. **Streaks & Milestones**
   - Current streak: consecutive weeks hitting frequency goal (e.g., 3x/week)
   - Total workouts logged (lifetime counter)
   - Weekly workout count vs. goal
   - Longest streak achieved

**AI-Powered Insights (Qualitative)**:

1. **Weekly Technical Reports**
   - Generated via GPT-5 mini API ($0.25 input / $2 output per 1M tokens)
   - Automated: Convex scheduled function runs weekly (Sunday night)
   - Analysis includes:
     - Volume trends and changes from previous week
     - PR achievements with context
     - Plateau detection (exercises with <5% volume increase over 4 weeks)
     - Recovery patterns (rest days, volume distribution)
     - Optimization suggestions (progressive overload, deload timing)
   - Tone: Technical, data-driven, actionable (not motivational fluff)
   - Length: 200-400 words per report

2. **On-Demand Analysis**
   - Button in analytics UI to generate fresh report immediately
   - Same analysis depth as weekly reports
   - Useful when user wants current insights mid-week

3. **Report Storage & Display**
   - Store reports in Convex `aiReports` table (reportId, userId, generatedAt, content, weekStartDate)
   - Display latest report as card widget on analytics page
   - Archive of past reports (view history)

### Non-Functional Requirements

**Performance**:

- Analytics queries must complete <500ms (use Convex indexes)
- Charts render without blocking UI (lazy load if needed)
- AI report generation: <10s (async, show loading state)

**Security**:

- All analytics queries verify userId ownership (no IDOR vulnerabilities)
- OpenAI API key stored in Convex environment variables
- Rate limit AI generation: max 5 on-demand reports per day per user

**Reliability**:

- Graceful degradation if AI API fails (show cached report or error message)
- Charts handle empty data states (new users with <7 days of logs)
- Scheduled cron job includes retry logic for AI generation failures

**Maintainability**:

- Model-agnostic architecture (easy to swap GPT-5 for Claude/Gemini later)
- Analytics calculations isolated in Convex functions (testable)
- AI prompt templates version-controlled and documented

## Architecture Decision

### Selected Approach: Hybrid Quantitative + AI Insights Dashboard

**Rationale**:

- **User Value**: Balances immediate visual feedback (charts, PRs) with deep insights (AI analysis)
- **Simplicity**: Leverages existing data model and PR detection system - no schema changes needed
- **Explicitness**: Clear separation between computed analytics (Convex) and AI generation (OpenAI)
- **Cost-Effective**: GPT-5 mini provides excellent analysis at ~$0.002 per weekly report (400 tokens input, 800 tokens output)

### Module Boundaries

#### 1. Analytics Computation Module (`convex/analytics.ts`)

**Interface**: Simple query functions accepting userId, time ranges
**Responsibility**: Aggregate workout data into metrics (volume, PRs, streaks)
**Hidden Complexity**:

- Multi-exercise volume calculations
- Streak logic (consecutive weeks with N workouts)
- PR comparisons across time periods
- Date range filtering and grouping

**Key Functions**:

```typescript
getVolumeByExercise(userId, startDate, endDate) → { exerciseId, totalVolume }[]
getWorkoutFrequency(userId, days) → { date, workoutCount, totalSets }[]
getCurrentStreak(userId, weeklyGoal) → { currentStreak, longestStreak, weeksToGoal }
getRecentPRs(userId, days) → PRRecord[]
```

#### 2. Visualization Module (`src/components/analytics/`)

**Interface**: React components accepting simple data props
**Responsibility**: Render charts, heatmaps, metric cards
**Hidden Complexity**:

- Recharts configuration (responsive sizing, tooltips, theming)
- Dark mode color schemes
- Empty state handling
- Loading skeletons

**Key Components**:

```typescript
<VolumeChart data={volumeData} />
<ActivityHeatmap data={frequencyData} />
<PRCard prs={recentPRs} />
<StreakCard streak={streakData} />
```

#### 3. AI Insights Module (`convex/ai/`)

**Interface**: Mutation to generate report, query to fetch reports
**Responsibility**: Generate qualitative analysis using LLM
**Hidden Complexity**:

- Prompt engineering (system message, data formatting)
- OpenAI API integration (error handling, retries)
- Token optimization (sending only relevant data)
- Report storage and retrieval

**Key Functions**:

```typescript
generateWeeklyReport(userId) → reportId  // Scheduled cron job
generateOnDemandReport(userId) → reportId  // User-triggered
getLatestReport(userId) → AIReport
getReportHistory(userId, limit) → AIReport[]
```

### Abstraction Layers

**Layer 1: Data (Convex)**
Vocabulary: sets, exercises, performedAt, weight, reps
Abstraction: Raw workout logs

**Layer 2: Analytics (Convex queries)**
Vocabulary: volume, PRs, streaks, frequency
Abstraction: Aggregated metrics

**Layer 3: Visualization (React components)**
Vocabulary: charts, cards, heatmaps, trends
Abstraction: Visual representations

**Layer 4: Insights (AI generation)**
Vocabulary: patterns, plateaus, optimization, recovery
Abstraction: Qualitative narratives

Each layer transforms concepts - no leakage of implementation details upward.

### Alternatives Considered

| Approach                      | User Value                          | Simplicity                       | Risk                     | Why Not Chosen                                    |
| ----------------------------- | ----------------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------- |
| **Quantitative Only**         | Medium - Numbers alone lack context | High - No AI integration         | Low                      | Misses user's request for qualitative analysis    |
| **AI-First (Minimal Charts)** | Medium - Slow feedback loop         | Medium - Simpler UI              | Medium - API costs       | Users need instant visual feedback, not just text |
| **Video Form Analysis**       | High - Unique feature               | Low - Complex multimodal         | High - Cost ($3/workout) | Not viable for MVP due to cost                    |
| **Hybrid (Selected)**         | High - Best of both worlds          | Medium - Two systems to maintain | Low-Medium               | Balanced value, clear boundaries                  |

## Dependencies & Assumptions

### External Dependencies

- **OpenAI API**: GPT-5 mini availability and pricing ($0.25/$2 per 1M tokens)
- **React Libraries**: `recharts` (charts), `react-activity-calendar` (heatmap)
- **Convex Features**: Scheduled functions (cron jobs), environment variables

### Assumptions

- **Scale**: <1000 users initially, <100 AI reports generated per day
- **Data Availability**: Users have logged ≥7 days of workouts for meaningful analytics
- **Budget**: ~$0.50/day for AI generation (250 weekly reports at $0.002 each)
- **User Behavior**: Users check analytics 2-3x/week, value AI insights enough to read them

### Integration Requirements

- **Existing Systems**:
  - PR detection (`src/lib/pr-detection.ts`) - use as-is
  - Sets/exercises schema - no changes needed
  - Bottom nav - add new "Analytics" tab
- **New Systems**:
  - OpenAI SDK for Node.js
  - Convex scheduled functions (cron)
  - New `aiReports` table in schema

### Environment Requirements

- **Convex Environment Variables**: `OPENAI_API_KEY`
- **Node.js Version**: Already on 22.15 (supports latest OpenAI SDK)
- **Testing**: Vitest for analytics calculations, manual QA for AI reports

## Implementation Phases

### Phase 1: Core Quantitative Analytics (Week 1)

**Goal**: Ship working analytics dashboard with real metrics

**Backend (Convex)**:

1. Create `convex/analytics.ts` with queries:
   - `getVolumeByExercise` - aggregate volume per exercise over date range
   - `getWorkoutFrequency` - daily workout counts for heatmap
   - `getCurrentStreak` - calculate consecutive weeks hitting goal
   - `getRecentPRs` - fetch PRs from last N days
2. Add database indexes for performance:
   - `sets.by_user_performed` (already exists)
   - Ensure queries use indexes efficiently
3. Write tests for analytics calculations (`convex/analytics.test.ts`)

**Frontend (UI)**:

1. Add "Analytics" tab to bottom nav (`src/components/layout/bottom-nav.tsx`)
2. Create `/analytics` page (`src/app/analytics/page.tsx`)
3. Build analytics components:
   - `<VolumeChart />` - Line chart showing volume trends (Recharts)
   - `<ActivityHeatmap />` - 365-day contribution graph (react-activity-calendar)
   - `<PRCard />` - Display recent PRs with celebration styling
   - `<StreakCard />` - Current/longest streak, progress to goal
4. Install dependencies: `pnpm add recharts react-activity-calendar`
5. Implement loading states and empty states (new users)
6. Dark mode theming for all charts

**Testing**:

- Backend: Unit tests for analytics queries (various date ranges, edge cases)
- Frontend: Smoke tests for chart rendering, visual QA for dark mode
- Manual QA: Test with real user data (multiple exercises, PRs, gaps in workout history)

**Deliverable**: Fully functional analytics dashboard with 4 metric visualizations

### Phase 2: AI Insights Integration (Week 2)

**Goal**: Add GPT-5-powered weekly reports and on-demand analysis

**Backend (Convex)**:

1. Create `convex/ai/reports.ts`:
   - `generateReport(userId, weekStartDate)` - internal mutation calling OpenAI
   - `getLatestReport(userId)` - query fetching most recent report
   - `getReportHistory(userId)` - paginated report archive
2. Add `aiReports` table to schema:
   ```typescript
   aiReports: {
     userId: string,
     weekStartDate: number,
     generatedAt: number,
     content: string,  // Markdown-formatted AI response
     metrics: object,  // JSON snapshot of metrics used (for transparency)
     model: string,    // e.g., "gpt-5-mini"
     tokenUsage: object // { input, output, cost }
   }
   ```
3. Create prompt template (`convex/ai/prompts.ts`):
   - System message: Define role as technical strength coach
   - User message: Format weekly metrics (volume, PRs, frequency, rest days)
   - Include examples of good analysis (plateau detection, recovery patterns)
4. Set up OpenAI SDK integration:
   - Install: `pnpm add openai`
   - Configure API key from Convex environment
   - Error handling and retry logic
5. Implement scheduled function (`convex/crons.ts`):
   - Run every Sunday at 9 PM UTC
   - Generate reports for all active users (logged workout in last 14 days)
   - Rate limit: max 100 reports per run (batch if needed)

**Frontend (UI)**:

1. Create `<AIInsightsCard />` component:
   - Display latest report with markdown rendering
   - Show generation timestamp
   - "Generate New Report" button (on-demand)
   - Loading state during generation
   - Error handling (API failures)
2. Add report history view (`/analytics/reports`)
3. Integrate into analytics page layout

**Testing**:

- Backend: Test prompt with sample data, verify token usage
- Frontend: Test on-demand generation, loading states
- Cost validation: Monitor first week of automated reports (target <$0.50/day)
- Quality QA: Read 10+ generated reports, tune prompt if needed

**Deliverable**: Automated weekly AI reports + on-demand generation

### Phase 3: Polish & Optimization (Week 3-4)

**Goal**: Production-ready quality, performance optimization, user feedback iteration

**Performance**:

1. Add data caching for expensive analytics queries
2. Implement pagination for report history
3. Lazy load charts (code splitting)
4. Optimize Recharts configuration (reduce re-renders)

**UX Enhancements**:

1. Add date range filters (7d, 30d, 90d, 1y, all-time)
2. Exercise-specific analytics drill-down
3. Export analytics data (CSV download)
4. Share report feature (copy markdown to clipboard)

**AI Improvements**:

1. Tune prompt based on user feedback
2. Add report regeneration (if user dislikes AI analysis)
3. Implement A/B testing framework for prompt variations
4. Add "feedback" button (thumbs up/down on AI quality)

**Testing**:

1. Load testing: analytics queries with 365 days of data
2. Cost monitoring: track actual GPT-5 mini usage vs. projections
3. User testing: 5+ beta users review analytics features
4. Accessibility audit: keyboard nav, screen readers

**Documentation**:

1. Update `CLAUDE.md` with analytics architecture
2. Document AI prompt engineering decisions
3. Add cost monitoring dashboard (admin view)
4. Create user guide for interpreting AI insights

**Deliverable**: Production-ready analytics system ready for launch

## Risks & Mitigation

| Risk                                           | Likelihood | Impact | Mitigation                                                                                                              |
| ---------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| **GPT-5 API costs exceed budget**              | Medium     | High   | Start with 50 user beta, monitor costs daily, implement rate limits (5 on-demand/day), fallback to GPT-5 nano if needed |
| **AI reports lack quality/value**              | Medium     | High   | Extensive prompt engineering, include real data examples, A/B test prompts, allow user feedback/regeneration            |
| **Analytics queries slow with large datasets** | Low        | Medium | Use Convex indexes, implement pagination, cache computed metrics, add loading states                                    |
| **Empty states discourage new users**          | Medium     | Low    | Show sample analytics with fake data, add onboarding callout, require ≥7 days before showing analytics                  |
| **OpenAI API outages**                         | Low        | Medium | Graceful degradation (show cached report), retry logic with exponential backoff, fallback message                       |
| **Users don't engage with analytics**          | Medium     | High   | Make analytics actionable (not just vanity metrics), celebrate PRs prominently, test with beta users first              |

## Key Decisions

### 1. GPT-5 Mini Over Other Models

**Alternatives**: Claude 3.5 (better quality?), Gemini 2.0 (cheaper?), GPT-5 nano (cheapest)

**Decision**: Use GPT-5 mini

**Rationale**:

- **User Value**: Best balance of quality and cost for technical analysis
- **Simplicity**: User already familiar with OpenAI ecosystem
- **Cost**: $0.002 per report (400 input + 800 output tokens) is acceptable
- **Explicitness**: Well-documented API, predictable pricing

**Tradeoffs**: Locked into OpenAI pricing, but architecture allows easy model swaps later

### 2. Scheduled Weekly Reports Over Daily

**Alternatives**: Daily summaries, bi-weekly, on-demand only

**Decision**: Weekly scheduled reports + on-demand option

**Rationale**:

- **User Value**: Weekly cadence matches typical training splits (PPL, Upper/Lower)
- **Simplicity**: Less complex than daily (1/7th the API calls)
- **Cost**: ~250 reports/week at $0.002 = $0.50/week vs. $3.50/week for daily
- **Pattern Detection**: 7-day window sufficient for trend analysis

**Tradeoffs**: Less immediate feedback, but on-demand option covers this

### 3. Recharts Over Chart.js/Victory

**Alternatives**: Chart.js (popular), Victory (Formidable), ECharts (powerful)

**Decision**: Use Recharts

**Rationale**:

- **Simplicity**: Declarative React API, no imperative canvas management
- **User Value**: Responsive out-of-box, excellent mobile support (our users are mobile-first)
- **Maintainability**: Active development, large community, TypeScript support
- **Bundle Size**: 95KB gzipped (acceptable for value provided)

**Tradeoffs**: Less customizable than Chart.js, but meets our needs

### 4. New Analytics Tab Over Enhanced History

**Alternatives**: Add metrics to history page, show on dashboard homepage

**Decision**: Dedicated `/analytics` tab in bottom nav

**Rationale**:

- **Information Hiding**: Separates concerns - history = logs, analytics = insights
- **User Value**: Power users want deep-dive analytics without cluttering casual logging UX
- **Explicitness**: Clear mental model - "Where do I see my progress?" → Analytics tab
- **Future-Proof**: Room to expand analytics features without impacting other pages

**Tradeoffs**: One more nav item, but value justifies the real estate

## Success Criteria

### Quantitative Metrics

- **Engagement**: 60%+ of weekly active users visit analytics tab
- **AI Value**: 40%+ of users read full AI report (track scroll depth)
- **Retention**: Analytics users have 20%+ higher retention vs. non-analytics users
- **Performance**: 95th percentile analytics query time <500ms
- **Cost**: AI generation costs <$20/month for 1000 users

### Qualitative Metrics

- **User Feedback**: 4+ star average rating on analytics features
- **AI Quality**: <10% of reports regenerated (indicates poor quality)
- **Support Tickets**: <5% of users contact support about analytics confusion

### Timeline

- **Week 1**: Core quantitative analytics shipped to production
- **Week 2**: AI insights beta testing with 50 users
- **Week 3**: AI insights shipped to all users
- **Week 4**: Polish iteration based on first week of usage data

## Next Steps

Run `/plan` to break this specification into detailed implementation tasks with file-level changes.
