# TODO: Complete shadcn/ui Migration

## Progress Summary

**Status:** Phase 2 Complete ✅ | Phase 3 In Progress (1/9 tasks)

- ✅ Phase 1: Foundation Setup
- ✅ Phase 2: Core Components Migration (Buttons, Inputs, Select, Table, Card, Layout)
- ✅ **Bonus:** Terminal Styling Cleanup (all terminal-\* classes removed)
- 🔄 Phase 3: Forms & Validation (zod schema created, forms pending)
- ⏳ Phase 4: Complex Components (dialogs, modals)

---

## Context & Patterns

### shadcn MCP Tools (ALWAYS USE)

**Before migration:**

1. `mcp__shadcn__search_items_in_registries(query="component-name")`
2. `mcp__shadcn__get_item_examples_from_registries(query="component-demo")`
3. `mcp__shadcn__view_items_in_registries(items=["@shadcn/component"])`

**After migration:**

- `mcp__shadcn__get_audit_checklist()` - Run quality checks

### Codebase Patterns

- Tests: `vitest` + `@testing-library/react`
- Mutations: `useMutation(api.*.*)` from Convex
- Context: `WeightUnitProvider` for app-wide state
- Layout: `LAYOUT` constants from `src/lib/layout-constants.ts`
- Errors: `handleMutationError()` from `src/lib/error-handler.ts`

---

## Phase 3: Forms & Validation (IN PROGRESS)

### 3.1: QuickLogForm Migration

- [x] Create zod schema for QuickLogForm
  - Commit: 831ac65
  - Schema: `quickLogSchema` with exerciseId, reps, weight, unit

- [x] Convert QuickLogForm to react-hook-form (ALL-IN-ONE MIGRATION)
  - Commit: df788db
  - Migrated all form state to useForm hook
  - Wrapped all inputs in FormField components
  - Preserved autofocus flow and keyboard navigation
  - TypeScript passes, core functionality intact

  ```
  **CRITICAL: This task includes autofocus + last set preservation. Do NOT split.**

  Files: src/components/dashboard/quick-log-form.tsx
  Pattern: Form component in src/components/ui/form.tsx (FormField, FormItem, FormControl)
  Schema: quickLogSchema already exists (lines 34-39)

  **🔍 STEP 1: Research (REQUIRED):**
    1. mcp__shadcn__get_item_examples_from_registries(query="form-rhf-demo")
    2. mcp__shadcn__get_item_examples_from_registries(query="form-rhf-input")
    3. Review how to use refs with FormField render props

  **STEP 2: State Migration (lines 55-63):**
    REMOVE:
      - const [selectedExerciseId, setSelectedExerciseId] = useState...
      - const [reps, setReps] = useState("")
      - const [weight, setWeight] = useState("")
      - const [isSubmitting, setIsSubmitting] = useState(false)

    ADD:
      import { useForm } from "react-hook-form"
      import { zodResolver } from "@hookform/resolvers/zod"
      import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

      const form = useForm<QuickLogFormValues>({
        resolver: zodResolver(quickLogSchema),
        defaultValues: {
          exerciseId: "",
          reps: undefined,  // Use undefined for number inputs
          weight: undefined,
          unit: unit  // Use current weight unit from context
        },
      })

    KEEP:
      - const [showInlineCreator, setShowInlineCreator] = useState(false)
      - const repsInputRef = useRef<HTMLInputElement>(null)
      - const weightInputRef = useRef<HTMLInputElement>(null)

  **STEP 3: Form Submission (lines 150-181):**
    REPLACE submitForm with:
      const onSubmit = async (values: QuickLogFormValues) => {
        try {
          const setId = await logSet({
            exerciseId: values.exerciseId as Id<"exercises">,
            reps: values.reps!,
            weight: values.weight,
            unit: values.weight ? values.unit : undefined,
          })

          // Keep exercise selected, clear reps/weight
          form.reset({
            exerciseId: values.exerciseId,  // CRITICAL: Preserve selection
            reps: undefined,
            weight: undefined,
            unit: values.unit
          })

          // Focus reps for next set
          focusElement(repsInputRef)
          toast.success("Set logged!")
          onSetLogged?.(setId)
        } catch (error) {
          handleMutationError(error, "Log Set")
        }
      }

    UPDATE handleSubmit:
      <form onSubmit={form.handleSubmit(onSubmit)}>

  **STEP 4: Exercise Select Field (lines 240-272):**
    WRAP Select in FormField:
      <FormField
        control={form.control}
        name="exerciseId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exercise *</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                if (value === "CREATE_NEW") {
                  setShowInlineCreator(true)
                  field.onChange("")  // Clear field
                } else {
                  field.onChange(value)  // Update form state
                }
              }}
              disabled={form.formState.isSubmitting}
            >
              {/* Keep existing SelectTrigger/SelectContent */}
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

  **STEP 5: Reps Input Field (lines 270-287):**
    WRAP Input in FormField:
      <FormField
        control={form.control}
        name="reps"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reps *</FormLabel>
            <FormControl>
              <Input
                {...field}
                ref={repsInputRef}  // CRITICAL: Preserve ref
                type="number"
                inputMode="numeric"
                min="1"
                onKeyDown={handleRepsKeyDown}  // CRITICAL: Keep keyboard nav
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                value={field.value ?? ""}  // Convert undefined to empty string
                disabled={form.formState.isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

  **STEP 6: Weight Input Field (lines 289-315):**
    Similar pattern to reps, preserve weightInputRef + handleWeightKeyDown

  **STEP 7: Last Set Indicator (lines 213-238):**
    UPDATE "Use" button:
      onClick={() => {
        form.setValue("reps", lastSet.reps)
        form.setValue("weight", lastSet.weight ?? undefined)
        focusElement(repsInputRef)
      }}

  **STEP 8: Autofocus Effect (lines 143-148):**
    UPDATE to watch form.watch("exerciseId"):
      const selectedExerciseId = form.watch("exerciseId")
      useEffect(() => {
        if (selectedExerciseId) {
          focusElement(repsInputRef)
        }
      }, [selectedExerciseId])

  **STEP 9: repeatSet imperative handle (lines 131-141):**
    UPDATE to use form.setValue:
      useImperativeHandle(ref, () => ({
        repeatSet: (set: Set) => {
          form.setValue("exerciseId", set.exerciseId)
          form.setValue("reps", set.reps)
          form.setValue("weight", set.weight ?? undefined)
          focusElement(repsInputRef)
        },
      }))

  **STEP 10: Verify & Test:**
    - mcp__shadcn__get_audit_checklist()
    - pnpm typecheck
    - pnpm lint
    - Manual test: Focus flow (exercise → reps → weight → submit → reps)
    - Manual test: Last set "Use" button prefills form
    - Manual test: Enter key navigation works
    - Manual test: Form resets after submit but keeps exercise selected

  Success Criteria:
    ✅ Form validates with zod schema
    ✅ Validation errors show inline
    ✅ Autofocus works: select exercise → focus reps
    ✅ Enter key: reps → weight → submit
    ✅ After submit: exercise stays selected, reps/weight clear, focus on reps
    ✅ "Use" button prefills reps/weight from last set
    ✅ repeatSet() imperative API still works
    ✅ No TypeScript errors
    ✅ Mobile Safari focus still works (double RAF preserved)

  Edge Cases:
    - Empty weight (optional field) - use undefined, not empty string
    - Number input controlled value - convert undefined to ""
    - Exercise selection with CREATE_NEW - clear field when opening creator
    - Form reset - must preserve exerciseId for quick multi-set logging

  Time: 3-4hr (complex, many moving parts)
  Risk: HIGH - Critical UX feature, test thoroughly before committing
  ```

### 3.2: Other Forms Migration

- [x] Convert InlineExerciseCreator to react-hook-form
  - Commit: 3e37c9c
  - Created exerciseNameSchema with validation
  - Migrated to useForm with FormField wrapper
  - Preserved keyboard shortcuts and autofocus

- [x] Convert ExerciseManager edit mode to react-hook-form
  - Commit: 777fd53
  - Created exerciseEditSchema for name validation
  - Single form instance for inline editing (one row at a time)
  - Preserved keyboard shortcuts and autofocus

---

## Phase 4: Complex Components

### 4.1: Dialogs & Confirmation Modals

- [x] Replace window.confirm with AlertDialog in ExerciseManager
  - Commit: 4c764e7
  - Replaced browser confirm with AlertDialog component
  - Added exerciseToDelete state for dialog control
  - Contextual messaging based on set count
  - Professional UI with keyboard navigation

- [x] Replace window.confirm in SetCard component
  - Commit: 55a332e
  - Replaced browser confirm with AlertDialog
  - Added showDeleteDialog state
  - Simple confirmation message
  - Consistent with ExerciseManager pattern

- [ ] Replace window.confirm in GroupedSetHistory

  ```
  Files: src/components/dashboard/grouped-set-history.tsx:41
  Pattern: Same as ExerciseManager

  Time: 30min
  ```

---

## Phase 5: Final Cleanup & Testing

- [ ] Remove unused terminal theme colors from tailwind.config.ts
- [ ] Run full test suite (pnpm test:coverage)
- [ ] Manual QA on mobile (iOS Safari focus behavior)
- [ ] Create PR with migration summary

---

## MCP Tool Reference

```bash
# Search for components
mcp__shadcn__search_items_in_registries(query="alert-dialog")

# View examples
mcp__shadcn__get_item_examples_from_registries(query="alert-dialog-demo")

# View API docs
mcp__shadcn__view_items_in_registries(items=["@shadcn/alert-dialog"])

# Post-implementation audit
mcp__shadcn__get_audit_checklist()
```
