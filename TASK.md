# TASK: Validator Unit Tests with Vitest Setup

**Extracted from**: BACKLOG.md Item #1A
**Priority**: HIGH
**Effort**: 1-1.5 hours
**Value**: HIGH - Data integrity & regression prevention

---

## Context

PR #4 (Enhanced Input Validation) was recently merged with critical bug fixes. The PR review identified 2 critical validation bugs that unit tests would have caught:
1. Client-side `parseInt()` bypassing server validation (data corruption risk)
2. Weight lower bound inconsistency (0.1 vs 0 check)

Currently, the project has **zero automated tests**. The validators in `convex/lib/validate.ts` are pure functions that protect data integrity - they are the perfect candidates for unit testing.

## Critical Validators to Test

Located in `convex/lib/validate.ts`:

1. **validateReps(reps: number): void**
   - Validates reps are whole numbers between 1-1000
   - Used in: `convex/sets.ts:23`

2. **validateWeight(weight?: number): number | undefined**
   - Validates weight between 0.1-10000
   - Rounds to 2 decimal places
   - Used in: `convex/sets.ts:24`

3. **validateUnit(unit?: string, weight?: number): void**
   - Requires "lbs" or "kg" when weight provided
   - Used in: `convex/sets.ts:25`

4. **validateExerciseName(name: string): string**
   - Trims whitespace and converts to uppercase
   - Validates length between 2-100 characters
   - Used in: `convex/exercises.ts:18, 71`

---

## Phase 1: Setup Vitest Infrastructure

**Effort**: 30-45 minutes

### 1.1 Install Dependencies

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitejs/plugin-react
```

### 1.2 Create `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 1.3 Create Test Setup

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

### 1.4 Add npm Scripts

Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Phase 2: Write Validator Unit Tests

**Effort**: 30 minutes

Create `convex/lib/validate.test.ts` with the following test coverage:

### 2.1 validateReps Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateReps, validateWeight, validateUnit, validateExerciseName } from './validate';

describe('validateReps', () => {
  it('accepts valid integers 1-1000', () => {
    expect(() => validateReps(1)).not.toThrow();
    expect(() => validateReps(500)).not.toThrow();
    expect(() => validateReps(1000)).not.toThrow();
  });

  it('rejects decimals', () => {
    expect(() => validateReps(5.5)).toThrow('whole number');
    expect(() => validateReps(10.1)).toThrow('whole number');
  });

  it('rejects out-of-bounds values', () => {
    expect(() => validateReps(0)).toThrow();
    expect(() => validateReps(-5)).toThrow();
    expect(() => validateReps(1001)).toThrow();
  });

  it('rejects non-finite values', () => {
    expect(() => validateReps(NaN)).toThrow();
    expect(() => validateReps(Infinity)).toThrow();
  });
});
```

### 2.2 validateWeight Tests

```typescript
describe('validateWeight', () => {
  it('returns undefined for undefined input', () => {
    expect(validateWeight(undefined)).toBeUndefined();
  });

  it('rounds to 2 decimal places', () => {
    expect(validateWeight(22.555)).toBe(22.56);
    expect(validateWeight(99.999)).toBe(100.00);
    expect(validateWeight(10.1234)).toBe(10.12);
  });

  it('rejects values below 0.1', () => {
    expect(() => validateWeight(0)).toThrow('between 0.1 and 10000');
    expect(() => validateWeight(0.05)).toThrow('between 0.1 and 10000');
  });

  it('rejects values above 10000', () => {
    expect(() => validateWeight(10001)).toThrow('between 0.1 and 10000');
  });

  it('rejects non-finite values', () => {
    expect(() => validateWeight(NaN)).toThrow();
    expect(() => validateWeight(Infinity)).toThrow();
  });
});
```

### 2.3 validateUnit Tests

```typescript
describe('validateUnit', () => {
  it('allows valid units with weight', () => {
    expect(() => validateUnit('lbs', 100)).not.toThrow();
    expect(() => validateUnit('kg', 50)).not.toThrow();
  });

  it('rejects invalid units when weight provided', () => {
    expect(() => validateUnit('pounds', 100)).toThrow();
    expect(() => validateUnit(undefined, 100)).toThrow();
  });

  it('allows no unit when no weight', () => {
    expect(() => validateUnit(undefined, undefined)).not.toThrow();
  });
});
```

### 2.4 validateExerciseName Tests

```typescript
describe('validateExerciseName', () => {
  it('trims whitespace', () => {
    expect(validateExerciseName('  push-ups  ')).toBe('PUSH-UPS');
  });

  it('converts to uppercase', () => {
    expect(validateExerciseName('bench press')).toBe('BENCH PRESS');
  });

  it('rejects empty strings', () => {
    expect(() => validateExerciseName('')).toThrow('cannot be empty');
    expect(() => validateExerciseName('   ')).toThrow('cannot be empty');
  });

  it('rejects too short names', () => {
    expect(() => validateExerciseName('a')).toThrow('2-100 characters');
  });

  it('rejects too long names', () => {
    const longName = 'a'.repeat(101);
    expect(() => validateExerciseName(longName)).toThrow('2-100 characters');
  });
});
```

---

## Success Criteria

- ✅ Vitest runs successfully: `pnpm test`
- ✅ All validator tests pass with 100% coverage
- ✅ Tests document expected validation behavior
- ✅ Foundation established for future TDD development

---

## Benefits

1. **Prevents Regression**: Ensures critical bugs from PR #4 don't return
2. **Fast Feedback Loop**: Unit tests run in milliseconds
3. **Documentation**: Tests serve as specification of validation rules
4. **Foundation**: Infrastructure ready for testing all future code
5. **Data Integrity**: Protects against data corruption at the validation layer

---

## Next Steps After Completion

1. Run tests in CI/CD pipeline (future)
2. Add coverage reporting (future)
3. Write tests for dashboard utilities (BACKLOG.md #10)
4. Write component tests (BACKLOG.md #10)

---

**Source**: BACKLOG.md Item #1A (elevated from PR #4 review feedback)
**Related Items**: BACKLOG.md #10 (Test Suite Implementation)
