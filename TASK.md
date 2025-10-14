# PRD: Complete Migration to shadcn/ui

## Executive Summary

**Problem:** Volume uses custom terminal-aesthetic UI components that create maintenance burden and limit developer velocity.

**Solution:** Complete migration to shadcn/ui with default styling, abandoning terminal aesthetic in favor of modern, accessible defaults.

**User Value:** Dramatically improved developer experience, faster feature iteration, better accessibility, and smoother UI/UX out of the box.

**Success Criteria:** All 21+ components migrated to shadcn/ui, terminal aesthetic removed, dark mode preserved, mobile-first maintained, all tests passing.

---

## User Context

**Who:** Developers working on Volume (primary) + end users (secondary benefit from better UX/accessibility)

**Problems Being Solved:**

1. **Developer Friction:** Custom components require manual styling, accessibility work, and ongoing maintenance
2. **Inconsistent Patterns:** 193 custom className instances with varying patterns
3. **Limited Component Library:** Missing complex components (Dialog, Combobox, DropdownMenu, etc.)
4. **Accessibility Gaps:** Custom components lack robust ARIA attributes, keyboard navigation, focus management

**Measurable Benefits:**

- **Developer Velocity:** ~50% faster to add new UI features (use shadcn CLI vs. building from scratch)
- **Accessibility:** Inherit Radix UI's WCAG 2.1 Level AA compliance automatically
- **Maintainability:** Reduce custom UI code by ~70% (21 custom components → ~5-10 shadcn imports)
- **Consistency:** Single source of truth for component behavior and styling

---

## Requirements

### Functional Requirements

**Must Have:**

1. All existing UI functionality preserved (forms, tables, navigation, buttons, etc.)
2. Dark mode toggle with system theme default (using next-themes + shadcn)
3. Mobile-first responsive design maintained
4. All current features work identically (exercise management, set logging, history, settings)
5. Existing toast notifications preserved (sonner already compatible)
6. Lucide icons maintained (already shadcn's default)

**Nice to Have:**

1. Improved loading states (shadcn Skeleton component)
2. Better form validation UX (shadcn Form with react-hook-form + zod)
3. Smooth animations (shadcn includes Tailwind animations)

### Non-Functional Requirements

**Performance:**

- No regression in page load time (shadcn is tree-shakeable)
- Lighthouse scores maintained or improved (better semantic HTML from Radix)

**Accessibility:**

- WCAG 2.1 Level AA compliance (inherited from Radix UI primitives)
- Full keyboard navigation support
- Proper ARIA attributes on all interactive elements
- Focus management in modals/dialogs

**Maintainability:**

- All shadcn components live in `src/components/ui/` (standard convention)
- Custom business logic components stay in domain folders (dashboard, layout, etc.)
- Clear separation: UI primitives (shadcn) vs. composed components (custom)

**Developer Experience:**

- Use `npx shadcn-ui@latest add <component>` to add new components
- Minimal custom styling (rely on shadcn defaults)
- TypeScript-first with full type safety

---

## Architecture Decision

### Selected Approach: Complete shadcn Migration with Default Styling

**Description:** Initialize shadcn/ui, replace all custom UI components with shadcn equivalents, strip terminal aesthetic entirely, use default slate/neutral color palette.

**Rationale:**

1. **Simplicity:** Fighting shadcn's design philosophy is counterproductive. Embrace defaults = less code, faster velocity.
2. **User Value:** Modern, polished UI improves perceived quality and trust.
3. **Explicitness:** shadcn copies components into your repo → full transparency, easy to customize later if needed.

### Alternatives Considered

| Approach                               | User Value | Simplicity | Risk   | Why Not Chosen                                                        |
| -------------------------------------- | ---------- | ---------- | ------ | --------------------------------------------------------------------- |
| **Hybrid (shadcn + terminal styling)** | Medium     | Low        | Medium | Unnecessary complexity now that terminal aesthetic is abandoned       |
| **Continue Custom Components**         | Low        | Low        | High   | Ongoing maintenance burden, accessibility gaps, slow feature velocity |
| **Full UI Library (Chakra, MUI)**      | Medium     | Medium     | Low    | Less control than shadcn (no component ownership), larger bundle size |

**Selected:** Complete shadcn migration with defaults wins on simplicity + user value + developer experience.

### Module Boundaries

**UI Primitives Layer** (`src/components/ui/`)

- **Interface:** Pure presentational components (Button, Input, Card, etc.)
- **Responsibility:** Visual consistency, accessibility, base interactions
- **Hidden Complexity:** Radix UI primitives, ARIA attributes, focus management

**Composed Components Layer** (`src/components/{domain}/`)

- **Interface:** Business logic components (QuickLogForm, ExerciseManager, etc.)
- **Responsibility:** Feature-specific behavior, data fetching, mutations
- **Hidden Complexity:** Convex queries/mutations, form state, validation

**Layout Layer** (`src/components/layout/`)

- **Interface:** Page structure (Nav, Footer, PageLayout, BottomNav)
- **Responsibility:** App shell, navigation, responsive breakpoints
- **Hidden Complexity:** Mobile/desktop layout switching, auth state

### Abstraction Layers

Each layer changes vocabulary:

1. **Radix UI (base):** `<Dialog.Root>`, `<Dialog.Trigger>` → low-level primitives
2. **shadcn UI:** `<Dialog>`, `<DialogTrigger>` → styled, composed primitives
3. **Domain Components:** `<ExerciseDialog>`, `<DeleteConfirmDialog>` → business logic

---

## Dependencies & Assumptions

### External Dependencies

- **shadcn/ui** (latest) - UI component system
- **Radix UI primitives** (via shadcn) - Headless UI logic
- **class-variance-authority (cva)** (via shadcn) - Variant styling
- **clsx** + **tailwind-merge** (via shadcn) - Class name utilities
- **react-hook-form** (new) - Form state management
- **zod** (new) - Form validation schemas

### Existing Dependencies (Keep)

- **sonner** - Toast notifications (already compatible)
- **lucide-react** - Icons (shadcn's default)
- **next-themes** - Dark mode support (shadcn uses this)
- **Tailwind CSS** - Utility classes (shadcn requires this)

### Assumptions

- **Scale:** Single-user mobile app, no backend rendering complexity
- **Browser Support:** Modern browsers only (ES2020+)
- **Team Size:** 1-2 developers
- **Design System Evolution:** Willing to use shadcn defaults now, customize later if needed
- **Breaking Changes:** Acceptable to completely redesign UI in one release

---

## Implementation Phases

### Phase 1: Foundation Setup (2-3 days)

**Goal:** Initialize shadcn, configure Tailwind/CSS, install core primitives

**Tasks:**

1. **Initialize shadcn:**

   ```bash
   npx shadcn-ui@latest init
   ```

   - Choose New York style (more modern)
   - Choose Slate color palette (neutral default)
   - Use CSS variables for theming
   - Confirm mobile-first approach in config

2. **Update `globals.css`:**
   - Remove all terminal-specific CSS variables (`--terminal-*`)
   - Remove uppercase text transform rules
   - Remove border-radius overrides
   - Keep shadcn's CSS variables (will be added by init)
   - Preserve mobile safe-area utilities

3. **Update `tailwind.config.ts`:**
   - Merge shadcn config with existing config
   - Remove terminal color extensions
   - Keep font family config (can switch from mono to sans-serif)
   - Add shadcn's color palette extensions

4. **Install core components:**

   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add label
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add separator
   npx shadcn-ui@latest add form
   npx shadcn-ui@latest add table
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add dropdown-menu
   npx shadcn-ui@latest add skeleton
   ```

5. **Install form dependencies:**
   ```bash
   pnpm add react-hook-form zod @hookform/resolvers
   ```

**Validation:**

- shadcn components render correctly
- Dark mode toggle works (system default)
- Mobile layout not broken
- Dev server runs without errors

---

### Phase 2: Core Components Migration (5-7 days)

**Goal:** Replace custom UI components with shadcn equivalents

#### 2.1: Buttons & Inputs

**Before:**

```tsx
// Custom styled button
<button className="px-6 py-2 bg-terminal-success text-terminal-bg font-bold uppercase...">
  LOG SET
</button>
```

**After:**

```tsx
import { Button } from "@/components/ui/button";

<Button>Log Set</Button>;
```

**Tasks:**

- Replace all `<button>` elements with `<Button>`
- Replace custom input styling with `<Input>`
- Replace select dropdowns with `<Select>`
- Update form labels to use `<Label>`

**Files to Update:**

- `src/components/dashboard/quick-log-form.tsx`
- `src/components/dashboard/exercise-manager.tsx`
- `src/components/dashboard/inline-exercise-creator.tsx`
- `src/app/history/page.tsx`
- `src/app/settings/page.tsx`

#### 2.2: Layout Components

**Replace:**

- `TerminalPanel` → `Card` + `CardHeader` + `CardContent`
- `CornerBracket` → Remove (aesthetic only, not needed)

**Before:**

```tsx
<TerminalPanel title="LOG SET" titleColor="success">
  <form>...</form>
</TerminalPanel>
```

**After:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Log Set</CardTitle>
  </CardHeader>
  <CardContent>
    <form>...</form>
  </CardContent>
</Card>;
```

**Tasks:**

- Replace all `<TerminalPanel>` with `<Card>`
- Update `PageLayout` component to use shadcn primitives
- Remove `CornerBracket` component entirely

---

### Phase 3: Forms & Tables (5-7 days)

#### 3.1: Form Migration (react-hook-form + zod)

**Goal:** Replace custom form handling with shadcn Form pattern

**Before (imperative):**

```tsx
const [reps, setReps] = useState("");
const [weight, setWeight] = useState("");

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  await logSet({ reps: parseFloat(reps), weight: parseFloat(weight) });
  setReps("");
  setWeight("");
};

return (
  <form onSubmit={handleSubmit}>
    <input value={reps} onChange={(e) => setReps(e.target.value)} />
    <input value={weight} onChange={(e) => setWeight(e.target.value)} />
    <button type="submit">Submit</button>
  </form>
);
```

**After (declarative):**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  reps: z.coerce.number().min(1),
  weight: z.coerce.number().optional(),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { reps: 0, weight: 0 },
});

const onSubmit = async (values: z.infer<typeof formSchema>) => {
  await logSet(values);
  form.reset();
};

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="reps"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reps</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">Submit</Button>
    </form>
  </Form>
);
```

**Benefits:**

- Type-safe form validation
- Built-in error handling
- Automatic field state management
- Declarative validation rules

**Tasks:**

1. Create zod schemas for all forms
2. Convert `QuickLogForm` to shadcn Form pattern
3. Convert `InlineExerciseCreator` to shadcn Form pattern
4. Convert `ExerciseManager` edit mode to Form pattern
5. Add proper validation error messages

#### 3.2: Table Migration

**Replace:**

- `TerminalTable` → `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableCell`

**Before:**

```tsx
<TerminalTable
  headers={["ID", "Name", "Sets", "Actions"]}
  rows={exercises.map((ex) => [ex._id, ex.name, setCount, actionsJSX])}
/>
```

**After:**

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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
    {exercises.map((ex) => (
      <TableRow key={ex._id}>
        <TableCell>{ex._id}</TableCell>
        <TableCell>{ex.name}</TableCell>
        <TableCell>{setCount}</TableCell>
        <TableCell>{actionsJSX}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>;
```

**Tasks:**

1. Replace `TerminalTable` in `ExerciseManager`
2. Update `GroupedSetHistory` to use shadcn Table (if applicable)
3. Remove `TerminalTable` component

---

### Phase 4: Complex Components (3-5 days)

#### 4.1: Dialogs & Modals

**Add confirmation dialogs for destructive actions:**

**Before:**

```tsx
const handleDelete = async (exercise: Exercise) => {
  if (!confirm(`Delete "${exercise.name}"?`)) return;
  await deleteExercise({ id: exercise._id });
};
```

**After:**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="icon">
      <Trash2 />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{exercise.name}"? This action cannot be
        undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => deleteExercise({ id: exercise._id })}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

**Tasks:**

1. Add AlertDialog component
2. Replace `confirm()` calls with AlertDialog in ExerciseManager
3. Add Dialog for creating new exercises (replace inline creator)

#### 4.2: Navigation Components

**Update:**

- Top nav (`src/components/layout/nav.tsx`)
- Bottom nav (`src/components/layout/bottom-nav.tsx`)
- Theme toggle (`src/components/layout/theme-toggle.tsx`)

**Use shadcn components:**

- `DropdownMenu` for user menu
- `Button` with `variant="ghost"` for nav links
- `Separator` for visual dividers

**Tasks:**

1. Refactor Nav to use DropdownMenu for user profile
2. Refactor BottomNav to use Button variants
3. Update ThemeToggle to use shadcn's theme toggle pattern

---

### Phase 5: Cleanup & Polish (2-3 days)

**Goal:** Remove all old custom UI code, update tests, verify everything works

**Tasks:**

1. **Remove deprecated files:**
   - `src/components/ui/terminal-panel.tsx`
   - `src/components/ui/terminal-table.tsx`
   - `src/components/ui/corner-bracket.tsx`

2. **Update CSS:**
   - Remove unused terminal CSS variables
   - Clean up `globals.css`
   - Verify dark mode styling

3. **Update tests:**
   - Fix any broken component tests (button selectors, etc.)
   - Update snapshot tests if using them
   - Verify form validation tests still pass

4. **Manual QA Checklist:**
   - [ ] Dark mode toggle works (defaults to system)
   - [ ] Mobile bottom nav works on small screens
   - [ ] Desktop nav works on large screens
   - [ ] Create exercise form works
   - [ ] Log set form works (with validation)
   - [ ] Exercise manager CRUD works
   - [ ] History page renders correctly
   - [ ] Settings page renders correctly
   - [ ] Toast notifications work
   - [ ] All buttons have proper hover/focus states
   - [ ] Keyboard navigation works in all forms
   - [ ] Loading states display correctly

5. **Performance check:**
   - Run Lighthouse audit
   - Check bundle size (should be similar or smaller)
   - Verify no console errors/warnings

6. **Update CLAUDE.md:**
   - Document new shadcn usage patterns
   - Remove references to terminal aesthetic
   - Add notes on how to add new shadcn components

---

## Risks & Mitigation

| Risk                                           | Likelihood | Impact | Mitigation                                                                              |
| ---------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------- |
| **CSS conflicts between old/new styles**       | High       | Medium | Do Phase 1 carefully, test dark mode thoroughly, use `cn()` utility consistently        |
| **Form validation breaking existing behavior** | Medium     | High   | Write comprehensive form tests, validate all edge cases (empty, negative numbers, etc.) |
| **Mobile layout regressions**                  | Medium     | Medium | Test on real devices (iPhone, Android), check safe-area handling, verify bottom nav     |
| **Breaking user workflows**                    | Low        | High   | Manual QA of all critical paths (log set → view history → manage exercises)             |
| **Bundle size increase**                       | Low        | Low    | shadcn is tree-shakeable, only import used components, check bundle analyzer            |

---

## Key Decisions

### Decision 1: Abandon Terminal Aesthetic

**What:** Remove all terminal-specific styling (uppercase, zero border-radius, custom colors)

**Alternatives:** Keep terminal styling, hybrid approach

**Rationale:**

- **User Value:** Modern UI improves perceived quality and trust
- **Simplicity:** Fighting shadcn's defaults is counterproductive
- **Explicitness:** Clear design system (shadcn) vs. custom aesthetic
- **Developer Experience:** Faster to iterate with defaults

**Tradeoffs:** Loses unique visual identity, but gains consistency and velocity

### Decision 2: Use react-hook-form + zod

**What:** Replace imperative form state with declarative form library

**Alternatives:** Keep useState-based forms, use Formik

**Rationale:**

- **User Value:** Better validation UX, clearer error messages
- **Simplicity:** Declarative > imperative for complex forms
- **Explicitness:** Type-safe validation schemas
- **Developer Experience:** Less boilerplate, easier to reason about

**Tradeoffs:** Learning curve for react-hook-form, but worth it for maintainability

### Decision 3: No Feature Flag / Gradual Rollout

**What:** "Rip the bandage off" - complete UI change in one release

**Alternatives:** Feature flag, gradual route-by-route rollout

**Rationale:**

- **User Value:** Single, cohesive experience (no half-old, half-new UI)
- **Simplicity:** No need to maintain two UIs simultaneously
- **Explicitness:** Clear before/after state
- **Developer Experience:** Faster to complete migration

**Tradeoffs:** Higher risk of bugs, but mitigated by thorough manual QA

---

## Timeline Estimate

**Total: 3-4 weeks** (one dedicated developer)

- **Phase 1 (Foundation):** 2-3 days
- **Phase 2 (Core Components):** 5-7 days
- **Phase 3 (Forms & Tables):** 5-7 days
- **Phase 4 (Complex Components):** 3-5 days
- **Phase 5 (Cleanup & Polish):** 2-3 days

**Assumptions:**

- No blockers or surprises
- Developer familiar with React/Next.js
- No major feature development in parallel

---

## Success Metrics

**Must Achieve:**

- ✅ All 21+ components migrated to shadcn
- ✅ Zero terminal aesthetic remnants
- ✅ Dark mode toggle works (system default)
- ✅ Mobile-first layout preserved
- ✅ All existing features functional
- ✅ All tests passing

**Nice to Have:**

- ✅ Improved Lighthouse accessibility score
- ✅ Smaller bundle size
- ✅ Faster form validation UX
- ✅ Better keyboard navigation

---

## Next Steps

After this PRD is approved, run `/plan` to break down Phase 1 into detailed implementation tasks.
