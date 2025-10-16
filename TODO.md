# TODO: Complete shadcn/ui Migration

## Context

**Approach:** Complete migration from custom terminal aesthetic to shadcn/ui with default styling

**Key Architecture Decisions:**

- Abandon terminal aesthetic (uppercase, zero border-radius, custom colors)
- Use shadcn default slate palette with dark mode support (system default)
- Migrate forms to react-hook-form + zod for declarative validation
- Replace custom components: TerminalPanel → Card, TerminalTable → Table, buttons → Button
- Maintain mobile-first responsive design

**Existing Patterns to Follow:**

- Component tests: `vitest` with `@testing-library/react` (see `quick-log-form.test.tsx`)
- Mutations: `useMutation(api.*.*)` pattern from Convex
- Context: `WeightUnitProvider` pattern for app-wide state
- Layout: `LAYOUT` constants from `src/lib/layout-constants.ts`
- Error handling: `handleMutationError()` from `src/lib/error-handler.ts`

**shadcn MCP Tools - ALWAYS USE WHEN APPLICABLE:**

**⚠️ CRITICAL: Use these tools BEFORE and AFTER every component migration. This is NOT optional.**

Available MCP Tools:

- `mcp__shadcn__search_items_in_registries` - Search for components by name (e.g., "input", "select", "dialog")
- `mcp__shadcn__view_items_in_registries` - View detailed API documentation for components
- `mcp__shadcn__get_item_examples_from_registries` - Get official usage examples (e.g., "input-demo", "form-demo")
- `mcp__shadcn__get_audit_checklist` - Post-implementation quality checklist

**When to use:**

1. **BEFORE starting any component migration:** Search for component + view examples
2. **DURING implementation:** Reference examples for correct API usage
3. **AFTER completing migration:** Run audit checklist to verify quality

**Why this matters:**

- **Prevents mistakes:** Official examples show correct patterns (we missed Button size variants!)
- **Discovers features:** Find better component variants you didn't know existed
- **Quality assurance:** Audit checklist catches common implementation issues
- **Strategic over tactical:** Learn best practices vs. just making it work

**Key Files Affected:**

- Global styles: `src/app/globals.css`, `tailwind.config.ts`
- Custom UI: `src/components/ui/terminal-panel.tsx`, `terminal-table.tsx`, `corner-bracket.tsx` (DELETE)
- Dashboard: `src/components/dashboard/*.tsx` (8 files using custom UI)
- Layout: `src/components/layout/*.tsx` (5 files)
- Pages: `src/app/history/page.tsx`, `src/app/settings/page.tsx`

---

## Phase 1: Foundation Setup ✅ COMPLETE

### 1.1: Initialize shadcn/ui

- [x] Initialize shadcn with proper config (New York style, Slate color, CSS variables)
- [x] Install shadcn core components (button, input, label, select, card, separator, form, table, dialog, alert-dialog, dropdown-menu, skeleton)
- [x] Install form dependencies (react-hook-form, zod, @hookform/resolvers)

### 1.2: Update Global Styles

- [x] Merge shadcn CSS variables into globals.css
- [x] Update tailwind.config.ts for shadcn
- [x] Update font to Inter (shadcn default)

---

## Phase 2: Core Components Migration (IN PROGRESS)

### 2.1: Layout Components ✅ COMPLETE

- [x] Replace TerminalPanel with Card in Dashboard components
  - [x] quick-log-form.tsx → Card with CardHeader/CardTitle/CardContent
  - [x] daily-stats-card.tsx → Card + Table (replaced TerminalTable)
  - [x] first-run-experience.tsx → Card with modern onboarding
  - [x] settings/page.tsx → Card for Preferences section
  - [x] exercise-manager.tsx → Card + Table with inline editing
  - [x] grouped-set-history.tsx → Card + Table for daily history
  - [x] landing/LandingHero.tsx → Card for hero section
  - [x] undo-toast.tsx → Remove CornerBrackets, use shadcn Button

- [x] Delete deprecated terminal UI components
  - [x] terminal-panel.tsx (DELETED - 126 lines)
  - [x] terminal-table.tsx (DELETED - 94 lines)
  - [x] corner-bracket.tsx (DELETED - 61 lines)

- [x] Update PageLayout to remove terminal styling
  - [x] page-layout.tsx → Remove font-mono, uppercase, terminal-text from h1
  - [x] settings/page.tsx → Update title to "Settings", modernize loading skeleton
  - [x] history/page.tsx → Update title to "Workout History", modernize empty state and Load More button

### 2.2: Button & Input Migration

- [x] Replace custom buttons with shadcn Button
  - [x] quick-log-form.tsx → Use/Submit/Unit toggle buttons migrated
  - [x] inline-exercise-creator.tsx → Create/Cancel buttons migrated
  - [x] history/page.tsx → Load More button (already migrated in PageLayout task)
  - [x] settings/page.tsx → Weight unit toggle (already styled with shadcn)
  - Note: Icon buttons in exercise-manager kept as minimal button elements

- [x] Replace custom inputs with shadcn Input

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="input") - Find Input component
    2. mcp__shadcn__get_item_examples_from_registries(query="input-demo") - See usage examples
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/input"]) - Review API docs

  Files:
    - src/components/dashboard/quick-log-form.tsx:238-295
    - src/components/dashboard/inline-exercise-creator.tsx
    - src/components/dashboard/exercise-manager.tsx:90-110

  **STEP 2: Implement migration:**
    Before:
      <input
        className="w-full px-3 py-3 bg-terminal-bgSecondary border border-terminal-border..."
        type="number"
      />
    After:
      import { Input } from "@/components/ui/input"
      <Input type="number" />  // inherits shadcn styling

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: All input elements replaced, styling consistent
  Test: Focus states work, mobile keyboard shows correct type (numeric for number inputs)
  Module: Form primitive - Input hides border/focus complexity
  Time: 1.5hr
  ```

- [x] Replace custom select with shadcn Select

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="select") - Find Select component
    2. mcp__shadcn__get_item_examples_from_registries(query="select-demo") - See usage patterns
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/select"]) - Review full Select API

  Files:
    - src/components/dashboard/quick-log-form.tsx:211-235
    - src/app/settings/page.tsx:70-85 (weight unit toggle - already uses buttons, correct pattern)

  **STEP 2: Implement migration:**
    Before:
      <select className="w-full h-[46px] px-3...">
        <option value="">SELECT...</option>
        {exercises.map(ex => <option>{ex.name}</option>)}
      </select>
    After:
      import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
      <Select onValueChange={...}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {exercises.map(ex => <SelectItem value={ex._id}>{ex.name}</SelectItem>)}
        </SelectContent>
      </Select>

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Select dropdown replaced in quick-log-form, accessibility improved (keyboard navigation)
  Test: TypeScript ✓, ESLint ✓, Dev server compiles ✓
  Module: Form control - Select hides portal/positioning complexity
  Time: 1hr (faster than estimated)
  Commit: 0089dd1
  ```

### 2.3: Table Migration ✅ COMPLETE

- [x] Replace TerminalTable with shadcn Table

  ```
  Files: src/components/dashboard/exercise-manager.tsx:73-150
  Approach:
    Before (array-based API):
      <TerminalTable
        headers={["ID", "Name", "Sets", "Actions"]}
        rows={exercises.map(ex => [ex._id, ex.name, count, actions])}
      />
    After (JSX-based API):
      import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Sets</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map(ex => (
            <TableRow key={ex._id}>
              <TableCell>{ex._id}</TableCell>
              <TableCell>{ex.name}</TableCell>
              <TableCell>{count}</TableCell>
              <TableCell>{actions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  Success: Table renders correctly, maintains responsive behavior
  Test: Table scrolls on mobile, rows highlight on hover
  Module: Data display primitive - Table hides responsive overflow complexity
  Time: Already completed in earlier commits
  ```

- [x] Delete TerminalTable component
  ```
  Files: src/components/ui/terminal-table.tsx (DELETE)
  Approach:
    1. Verify no remaining imports of TerminalTable
    2. Delete terminal-table.tsx
  Success: File deleted, no import errors
  Test: pnpm typecheck passes
  Time: Already completed in earlier commits
  ```

---

## Phase 3: Forms & Validation (5-7 days)

### 3.1: QuickLogForm Migration

- [ ] Create zod schema for QuickLogForm

  ```
  Files: src/components/dashboard/quick-log-form.tsx:1-40 (add at top)
  Approach:
    import { z } from "zod"

    const quickLogSchema = z.object({
      exerciseId: z.string().min(1, "Exercise is required"),
      reps: z.coerce.number().min(1, "Reps must be at least 1"),
      weight: z.coerce.number().optional(),
      unit: z.enum(["lbs", "kg"]).optional(),
    });

    type QuickLogFormValues = z.infer<typeof quickLogSchema>;
  Success: Schema compiles, types inferred correctly
  Test: Unit test - schema.parse() validates correctly
  Module: Validation layer - schema hides validation logic from UI
  Time: 30min
  ```

- [ ] Convert QuickLogForm to react-hook-form

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="form") - Find Form components
    2. mcp__shadcn__get_item_examples_from_registries(query="form-demo") - See react-hook-form + zod patterns
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/form"]) - Review FormField API

  Files: src/components/dashboard/quick-log-form.tsx:23-153

  **STEP 2: Implement migration:**
    Replace:
      - useState for reps/weight → useForm
      - Manual onChange handlers → FormField render props
      - Manual form submission → form.handleSubmit(onSubmit)

    Pattern:
      const form = useForm<QuickLogFormValues>({
        resolver: zodResolver(quickLogSchema),
        defaultValues: { exerciseId: "", reps: 0, weight: undefined, unit: "lbs" },
      });

      const onSubmit = async (values: QuickLogFormValues) => {
        await logSet(values);
        form.reset();
        focusElement(repsInputRef);
      };

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField control={form.control} name="reps" render={({ field }) => (
            <FormItem>
              <FormLabel>Reps</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </form>
      </Form>

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Form works identically, validation errors show automatically
  Test:
    - Submit with empty reps → validation error shows
    - Submit with valid data → set logged, form resets
    - Focus flow still works (exercise → reps → weight → submit)
  Module: Form state layer - react-hook-form hides field registration complexity
  Time: 3hr
  ```

- [ ] Preserve autofocus behavior in new form

  ```
  Files: src/components/dashboard/quick-log-form.tsx:44-74, 110-115
  Approach:
    1. Keep focusElement() helper (lines 60-74)
    2. Keep useEffect for exercise selection → focus reps (lines 111-115)
    3. Update refs to work with FormField render props
    4. Keep Enter key handlers for reps → weight → submit flow
  Success: Tab/Enter flow works: exercise → reps → weight → submit → focus reps
  Test: Manual QA on mobile Safari (most critical for focus issues)
  Module: UX enhancement layer - focus management orthogonal to form state
  Time: 1hr
  ```

- [ ] Keep "last set" indicator with new form
  ```
  Files: src/components/dashboard/quick-log-form.tsx:76-98, 182-199
  Approach:
    1. Keep lastSet useMemo logic (lines 80-85)
    2. Keep formatTimeAgo helper (lines 88-97)
    3. Update "USE" button to call form.setValue() instead of setState
    4. Position above form using Card component
  Success: Last set shows with "USE" button, clicking prefills form
  Test: Log set, verify last set appears, click USE, verify form prefilled
  Module: Context-aware UI - lastSet logic decoupled from form state
  Time: 45min
  ```

### 3.2: Other Forms Migration

- [ ] Convert InlineExerciseCreator to react-hook-form

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="form") - Find Form components
    2. mcp__shadcn__get_item_examples_from_registries(query="form-demo") - See form patterns with single input
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/form"]) - Review FormField API

  Files: src/components/dashboard/inline-exercise-creator.tsx:1-90

  **STEP 2: Implement migration:**
    Schema: z.object({ name: z.string().min(1, "Name is required") })
    Follow same pattern as QuickLogForm

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Inline creator works, validation shows errors
  Test: Create exercise with empty name → error shows
  Module: Single-purpose form - hides exercise creation logic
  Time: 1.5hr
  ```

- [ ] Convert ExerciseManager edit mode to react-hook-form

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="form") - Find Form components
    2. mcp__shadcn__get_item_examples_from_registries(query="form-demo") - See inline form patterns
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/form", "@shadcn/input"]) - Review APIs

  Files: src/components/dashboard/exercise-manager.tsx:31-52

  **STEP 2: Implement migration:**
    Replace:
      - editingName state → form.watch("name")
      - Input onChange → FormField with Input
      - handleSaveEdit → form.handleSubmit(onSubmit)
    Note: This is inline editing, so form is per-row (more complex)

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Inline edit works, validation prevents empty names
  Test: Click edit, clear name, try to save → validation error
  Module: Inline editing pattern - form state per table row
  Time: 2hr
  ```

---

## Phase 4: Complex Components (3-5 days)

### 4.1: Dialogs & Confirmation Modals

- [ ] Replace window.confirm with AlertDialog in ExerciseManager

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="alert-dialog") - Find AlertDialog component
    2. mcp__shadcn__get_item_examples_from_registries(query="alert-dialog-demo") - See confirmation patterns
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/alert-dialog"]) - Review full API

  Files: src/components/dashboard/exercise-manager.tsx:54-71

  **STEP 2: Implement migration:**
    Before:
      const handleDelete = async (exercise) => {
        if (!confirm(`Delete "${exercise.name}"?`)) return;
        await deleteExercise({ id: exercise._id });
      };
    After:
      import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon"><Trash2 /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{exercise.name}"?
              This exercise has {setCount} sets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteExercise({ id: exercise._id })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Delete confirmation shows in modal, better UX than browser confirm
  Test: Click delete, modal opens, click cancel → nothing happens, click delete → exercise deleted
  Module: Confirmation pattern - AlertDialog hides focus trap complexity
  Time: 1.5hr
  ```

- [ ] Replace window.confirm in SetCard component

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. Reference alert-dialog examples from ExerciseManager task above
    2. mcp__shadcn__get_item_examples_from_registries(query="alert-dialog-demo") - Review destructive action patterns

  Files: src/components/dashboard/set-card.tsx:24-35

  **STEP 2: Implement migration:**
    Follow same AlertDialog pattern as ExerciseManager

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Set deletion uses modal confirmation
  Test: Delete set flow works identically
  Module: Reusable confirmation - same pattern across app
  Time: 45min
  ```

- [ ] Convert InlineExerciseCreator to Dialog

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="dialog") - Find Dialog component
    2. mcp__shadcn__get_item_examples_from_registries(query="dialog-demo") - See modal form patterns
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/dialog"]) - Review Dialog API

  Files: src/components/dashboard/inline-exercise-creator.tsx:1-90

  **STEP 2: Implement migration:**
    Replace inline form with Dialog trigger
    Before: Form shows inline below QuickLogForm
    After:
      - "+ CREATE NEW" option in select opens Dialog
      - Dialog contains exercise creation form
      - On success, Dialog closes and exercise selected

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Exercise creation in modal, cleaner UX
  Test: Select "+ CREATE NEW", dialog opens, create exercise, dialog closes, exercise selected
  Module: Modal creation pattern - Dialog hides overlay/focus trap
  Time: 2hr
  ```

### 4.2: Navigation Components

- [ ] Update Nav component with shadcn primitives

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="button") - Review Button variants (ghost)
    2. mcp__shadcn__search_items_in_registries(query="dropdown-menu") - Find DropdownMenu component
    3. mcp__shadcn__get_item_examples_from_registries(query="dropdown-menu-demo") - See navigation menu patterns

  Files: src/components/layout/nav.tsx:1-90

  **STEP 2: Implement migration:**
    1. Replace custom button styling with Button variant="ghost"
    2. Use DropdownMenu for user profile menu (Clerk UserButton)
    3. Use Separator for visual dividers
    4. Keep Clerk auth components (UserButton, SignInButton, SignUpButton)

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Nav renders with shadcn buttons, consistent styling
  Test: Nav links work, user menu works, auth buttons work
  Module: App shell - Nav hides responsive breakpoint complexity
  Time: 1.5hr
  ```

- [ ] Update BottomNav component with shadcn Button

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__get_item_examples_from_registries(query="button-demo") - Review Button variants for nav
    2. mcp__shadcn__view_items_in_registries(items=["@shadcn/button"]) - Check ghost variant API

  Files: src/components/layout/bottom-nav.tsx:1-49

  **STEP 2: Implement migration:**
    Replace custom button styling with Button variant="ghost"
    Keep mobile-only visibility (className="md:hidden")

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Bottom nav uses shadcn Button, mobile behavior unchanged
  Test: Bottom nav shows on mobile, hides on desktop, buttons work
  Module: Mobile navigation - BottomNav hides fixed positioning complexity
  Time: 45min
  ```

- [ ] Update ThemeToggle with shadcn pattern

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="theme") - Search for theme toggle patterns
    2. mcp__shadcn__get_item_examples_from_registries(query="theme-toggle") - See official theme toggle examples
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/dropdown-menu"]) - Review DropdownMenu for theme options
    4. Reference: https://ui.shadcn.com/docs/dark-mode/next

  Files: src/components/layout/theme-toggle.tsx:1-44

  **STEP 2: Implement migration:**
    Use shadcn's theme toggle pattern (Button + DropdownMenu + next-themes)

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Theme toggle works, system/light/dark options, icons update
  Test: Toggle theme, verify persistence, check system default works
  Module: Theme control - ThemeToggle hides next-themes complexity
  Time: 1hr
  ```

### 4.3: Card Components

- [ ] Update SetCard component styling

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__search_items_in_registries(query="card") - Find Card component patterns
    2. mcp__shadcn__get_item_examples_from_registries(query="card-demo") - See Card layout examples
    3. mcp__shadcn__view_items_in_registries(items=["@shadcn/card"]) - Review CardHeader/CardContent API

  Files: src/components/dashboard/set-card.tsx:53-103

  **STEP 2: Implement migration:**
    1. Wrap content in Card component
    2. Use CardHeader for metadata (time, exercise name)
    3. Use CardContent for reps/weight
    4. Use Button for actions (Repeat, Delete)

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: SetCard uses shadcn Card, consistent styling
  Test: SetCard renders in history, actions work
  Module: Data card - SetCard hides layout complexity
  Time: 1hr
  ```

- [ ] Update DailyStatsCard component

  ```
  **🔍 STEP 1: Use shadcn MCP tools (REQUIRED):**
    1. mcp__shadcn__get_item_examples_from_registries(query="card-demo") - Review Card patterns for stats/metrics
    2. mcp__shadcn__view_items_in_registries(items=["@shadcn/card"]) - Verify Card API usage

  Files: src/components/dashboard/daily-stats-card.tsx:1-153

  **STEP 2: Implement migration:**
    1. Replace TerminalPanel with Card (if not already done)
    2. Update metric display to use shadcn typography
    3. Remove uppercase text transform

  **STEP 3: Verify with MCP audit (REQUIRED):**
    - mcp__shadcn__get_audit_checklist() - Run quality checklist

  Success: Stats card uses shadcn styling
  Test: Stats display correctly, responsive on mobile
  Module: Metrics display - hides stat calculation complexity
  Time: 1hr
  ```

---

## Phase 5: Cleanup & Testing (2-3 days)

### 5.1: Remove Deprecated Components

- [ ] Delete deprecated UI components

  ```
  Files:
    - src/components/ui/terminal-panel.tsx (DELETE)
    - src/components/ui/terminal-table.tsx (DELETE)
    - src/components/ui/corner-bracket.tsx (DELETE)
  Approach:
    1. Run grep to verify no remaining imports
    2. Delete files
  Success: Files deleted, no import errors
  Test: pnpm typecheck passes
  Time: 10min
  ```

- [ ] Remove terminal constants from lib
  ```
  Files: src/lib/layout-constants.ts:1-40
  Approach:
    1. Review if LAYOUT constants still needed
    2. If not, consider removing or updating to use shadcn spacing
  Success: No unused constants, LAYOUT usage updated or removed
  Test: pnpm typecheck passes
  Time: 20min
  ```

### 5.2: Update Tests

- [ ] Update QuickLogForm tests

  ```
  Files: src/components/dashboard/quick-log-form.test.tsx
  Approach:
    1. Update selectors (button text changed from "LOG SET" to "Log Set")
    2. Add tests for form validation errors
    3. Update mocks for react-hook-form
  Success: All tests pass
  Test: pnpm test -- quick-log-form.test.tsx
  Time: 1.5hr
  ```

- [ ] Update ExerciseManager tests

  ```
  Files: src/components/dashboard/exercise-manager.test.tsx
  Approach:
    1. Update selectors for new Button/Table components
    2. Add tests for AlertDialog confirmation flow
    3. Update inline edit tests for react-hook-form
  Success: All tests pass
  Test: pnpm test -- exercise-manager.test.tsx
  Time: 1.5hr
  ```

- [ ] Add snapshot tests for key pages
  ```
  Files: Create new files
    - src/app/page.test.tsx (Dashboard)
    - src/app/history/page.test.tsx
    - src/app/settings/page.test.tsx
  Approach:
    Use Testing Library to render pages, snapshot major sections
  Success: Snapshots created, tests pass
  Test: pnpm test:coverage
  Time: 1hr
  ```

### 5.3: Manual QA

- [ ] Mobile QA checklist

  ```
  Devices: iPhone (Safari), Android (Chrome)
  Tests:
    - [ ] Dark mode toggle works (defaults to system)
    - [ ] Bottom nav visible, buttons work
    - [ ] QuickLogForm: exercise select opens, number keyboard appears for reps/weight
    - [ ] QuickLogForm: focus flow works (exercise → reps → weight → submit)
    - [ ] Create exercise dialog works on mobile
    - [ ] Exercise table scrolls horizontally if needed
    - [ ] Delete confirmations show as modals (not browser confirm)
    - [ ] History page loads, infinite scroll works
    - [ ] Settings page: weight unit toggle works
  Time: 1.5hr
  ```

- [ ] Desktop QA checklist

  ```
  Browsers: Chrome, Safari, Firefox
  Tests:
    - [ ] Top nav visible, bottom nav hidden
    - [ ] Dark mode toggle in nav works
    - [ ] All forms work with keyboard (Tab, Enter)
    - [ ] Tables display full width, no horizontal scroll
    - [ ] Dialogs center on screen, ESC closes
    - [ ] Hover states work on buttons/links
    - [ ] Focus visible indicator on keyboard nav
  Time: 1hr
  ```

- [ ] Accessibility audit
  ```
  Tool: Chrome DevTools Lighthouse
  Tests:
    - [ ] Run Lighthouse audit on Dashboard
    - [ ] Check accessibility score (target: 90+)
    - [ ] Fix any ARIA issues
    - [ ] Verify all interactive elements keyboard accessible
  Success: Lighthouse accessibility score 90+
  Time: 1hr
  ```

### 5.4: Performance & Bundle

- [ ] Bundle size analysis

  ```
  Command: pnpm analyze
  Success: Bundle size not significantly larger (shadcn is tree-shakeable)
  Test: Check main bundle < 200KB gzipped
  Time: 30min
  ```

- [ ] Performance check
  ```
  Tool: Chrome DevTools Lighthouse
  Tests:
    - [ ] Run Lighthouse on Dashboard
    - [ ] Check performance score (target: 90+)
    - [ ] Verify no layout shifts (CLS < 0.1)
    - [ ] Check First Contentful Paint < 1.5s
  Success: Performance scores maintained or improved
  Time: 30min
  ```

### 5.5: Documentation

- [ ] Update CLAUDE.md with shadcn patterns

  ```
  Files: CLAUDE.md
  Approach:
    1. Remove terminal aesthetic references
    2. Add section on shadcn usage
    3. Document form pattern (react-hook-form + zod)
    4. Add examples of common tasks (add new form field, add new component)
  Success: CLAUDE.md reflects new architecture
  Time: 45min
  ```

- [ ] Update README if needed
  ```
  Files: README.md (if exists)
  Approach: Update screenshots, feature list, tech stack
  Success: README accurate
  Time: 30min
  ```

---

## Design Iteration Checkpoints

**After Phase 2 (Core Components):**

- Review: Are Card components too shallow? Should we create domain-specific card variants?
- Review: Is Button usage consistent? Do we need custom variants?
- Extract: Any repeated patterns that should be extracted to shared components?

**After Phase 3 (Forms):**

- Review: Is react-hook-form pattern consistent across all forms?
- Review: Are zod schemas co-located with forms or should they be in separate files?
- Extract: Any common form fields that should be extracted (exercise select, weight input with unit toggle)?

**After Phase 4 (Complex Components):**

- Review: Is AlertDialog usage consistent for all destructive actions?
- Review: Should we extract a reusable ConfirmDialog wrapper?
- Review: Are Dialog components too large? Should form logic be extracted?

---

## Automation Opportunities

1. **Component Migration Script:** Could automate replacing TerminalPanel → Card (AST transformation)
2. **Test Snapshot Generation:** Script to generate snapshot tests for all pages
3. **Unused Import Detection:** Script to find and remove unused terminal component imports
4. **Accessibility Testing:** Integrate axe-core into test suite for automated a11y checks

---

## Success Metrics

**Must Achieve:**

- [ ] All 21+ components migrated to shadcn
- [ ] Zero terminal aesthetic remnants (no --terminal-\* in CSS)
- [ ] Dark mode toggle works (defaults to system)
- [ ] Mobile-first layout preserved
- [ ] All existing features work identically
- [ ] All tests passing (pnpm test)
- [ ] TypeScript compiles (pnpm typecheck)
- [ ] Lighthouse accessibility score 90+

**Nice to Have:**

- [ ] Lighthouse performance score 90+
- [ ] Bundle size < 200KB gzipped
- [ ] Test coverage > 70%
- [ ] Zero console errors/warnings

---

## Estimated Timeline

**Total: 3-4 weeks** (one dedicated developer, ~6-8 hours/day)

- **Phase 1 (Foundation):** 2-3 days
- **Phase 2 (Core Components):** 5-7 days
- **Phase 3 (Forms):** 5-7 days
- **Phase 4 (Complex Components):** 3-5 days
- **Phase 5 (Cleanup & Testing):** 2-3 days

**Critical Path:**

1. Phase 1 must complete before any component work (CSS/Tailwind foundation)
2. Phase 2.1 (Layout) can parallelize with 2.2 (Buttons)
3. Phase 3 depends on Phase 2 (need Button/Input components)
4. Phase 4 can partially parallelize (4.1 dialogs independent from 4.2 nav)
5. Phase 5 must be serial (cleanup after everything done)
