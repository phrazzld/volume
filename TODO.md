# TODO: Quality Infrastructure

*Generated from quality infrastructure audit - 2025-10-12*

## CRITICAL - Continuous Integration (blocks quality enforcement)

- [x] Create `.github/workflows/ci.yml` with automated quality checks
  - Run on: push to any branch, all pull requests
  - Jobs: install dependencies → typecheck → lint → test → build
  - Use `pnpm` as package manager (current setup)
  - Run tests with `pnpm test --run` (currently 51 tests pass in 1.4s)
  - Success criteria: Workflow fails if any step exits non-zero
  - Cache node_modules for faster runs (GitHub Actions cache)

- [ ] Add coverage reporting to Vitest config (`vitest.config.ts`)
  - Enable coverage collection with `@vitest/coverage-v8` provider
  - Set thresholds: 70% lines, 70% functions, 70% branches
  - Exclude test files, generated code (`convex/_generated/**`)
  - Output formats: text summary (for CI logs), html (for local review)
  - Success criteria: `pnpm test:coverage` fails if below threshold

- [ ] Create `.github/dependabot.yml` for automated dependency updates
  - Monitor npm dependencies weekly
  - Monitor GitHub Actions monthly
  - Auto-create PRs for security updates
  - Group minor/patch updates to reduce PR noise
  - Success criteria: Dependabot runs weekly, creates PRs for outdated deps

## HIGH - Test Coverage (253 untested lines in dashboard-utils.ts)

- [ ] Create `src/lib/dashboard-utils.test.ts` for weight conversion and stats
  - Test `convertWeight()`: lbs→kg, kg→lbs, edge cases (0, negative, very large)
  - Verify conversion factor accuracy: 2.20462 lbs per kg (test 100kg = 220.46lbs)
  - Test `normalizeWeightUnit()`: valid units ("lbs", "kg"), invalid inputs
  - Test `calculateDailyStats()`: filters to today only, sums volume correctly
  - Test mixed units: sets with lbs + kg correctly normalized to common unit
  - Test edge cases: empty input returns null, sets without weight handled
  - Test `groupSetsByDay()`: groups by calendar day, sorts newest first
  - Test `sortExercisesByRecency()`: orders by most recent set timestamp
  - Success criteria: 100% coverage of dashboard-utils.ts functions

- [ ] Create `src/lib/error-handler.test.ts` for production vs dev logging
  - Mock `process.env.NODE_ENV` (use vitest `vi.stubEnv()`)
  - Test production mode: logs sanitized message only (no stack traces)
  - Test development mode: logs full error object with stack trace
  - Test `getUserFriendlyMessage()`: maps error types correctly
    - Auth errors → "Please sign in again"
    - Not found → "Could not find [resource]"
    - Generic errors → "Something went wrong"
  - Success criteria: Validates security behavior (no info disclosure in prod)

- [ ] Create `src/components/dashboard/quick-log-form.test.tsx` for critical UI paths
  - Test form state: reps field accepts integers only, weight accepts decimals
  - Test validation: empty reps shows error, invalid exercise ID prevented
  - Test last set display: shows correct "X MIN AGO" formatting
  - Test "USE" button: populates form with last set's reps/weight
  - Test mutation calls: `logSet` called with correct params on submit
  - Mock Convex hooks (`useQuery`, `useMutation`) with vitest
  - Success criteria: Core logging flow validated end-to-end

- [ ] Create `src/components/dashboard/exercise-manager.test.tsx` for CRUD operations
  - Test create exercise: form submission calls `createExercise` mutation
  - Test delete exercise: confirmation → calls `deleteExercise` (soft delete)
  - Test update exercise: inline edit mode saves new name
  - Test error handling: mutation errors display user-friendly messages
  - Mock Convex mutations and verify correct args passed
  - Success criteria: All CRUD operations validated

## MEDIUM - Developer Tooling

- [ ] Create `.prettierrc.json` with code formatting rules
  - Base config: semi: true, singleQuote: false, tabWidth: 2
  - Match ESLint settings from `.eslintrc.json` (avoid conflicts)
  - Add `.prettierignore`: ignore generated files, build output, node_modules
  - Success criteria: `pnpm prettier --check .` passes on existing code (or autofix)

- [ ] Add Prettier to `package.json` scripts and lint-staged
  - Add devDependency: `prettier` (latest stable)
  - Add script: `"format": "prettier --write ."`
  - Add script: `"format:check": "prettier --check ."`
  - Update `lint-staged` config: run prettier before ESLint
  - Success criteria: Pre-commit hook formats code automatically

- [ ] Add bundle analyzer to Next.js config (`next.config.ts`)
  - Install `@next/bundle-analyzer` as devDependency
  - Wrap Next.js config with analyzer: `withBundleAnalyzer(nextConfig)`
  - Enable only when `ANALYZE=true` env var set
  - Add package.json script: `"analyze": "ANALYZE=true pnpm build"`
  - Success criteria: `pnpm analyze` generates bundle size report

- [ ] Add PR checklist template (`.github/pull_request_template.md`)
  - Checklist items: tests added/updated, types updated if needed
  - Link to CI status badge (auto-populated by GitHub)
  - Prompt for testing notes (manual testing performed)
  - Success criteria: All new PRs include checklist by default

## Future Enhancements → See BACKLOG.md

The following were identified but deferred to BACKLOG.md as non-critical:
- Bundle size regression tracking (Lighthouse CI integration)
- Import sorting automation (trivial-import-sort plugin)
- Git commit message linting (commitlint + husky)
- Component visual regression testing (Chromatic/Percy)
- Pre-commit typecheck (may slow commits, trade-off documented in BACKLOG)

---

**Completion Order**: CRITICAL tasks first (CI pipeline unblocks everything), then HIGH (test coverage), then MEDIUM (developer experience).

**Estimated Total Effort**: ~12 hours
- CRITICAL: 2h (CI setup + coverage config)
- HIGH: 8h (test file creation)
- MEDIUM: 2h (tooling setup)
