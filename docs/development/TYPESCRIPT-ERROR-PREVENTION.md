# TypeScript Error Prevention Guidelines

This document outlines common TypeScript errors and prevention strategies for the Issue Collector Platform.

## Common Error Patterns

### 1. Missing Module Imports (`@/types/api`)

**Error:** `Cannot find module '@/types/api' or its corresponding type declarations.`

**Cause:** The `@/types/api` module doesn't exist. The `ApiSuccessResponse` interface should be defined locally in files that need it.

**Solution:**
Define `ApiSuccessResponse` locally in each file:

```typescript
// Remove: import { ApiSuccessResponse } from '@/types/api'
// Add at end of file (or top if used in type definitions):
export interface ApiSuccessResponse<T> {
  data: T;
  message: string;
  status: number;
}
```

**Files that should define this locally:**
- `apps/admin/app/admin/*/types.ts` files
- `apps/admin/lib/api/*.ts` files

**Prevention:**
- Always define `ApiSuccessResponse` locally when needed
- Do not import from non-existent `@/types/api` module
- Consider creating a shared types file in the future: `apps/admin/lib/types/api.types.ts`

### 2. Missing Return Statements in Async Functions

**Error:** `Function lacks ending return statement and return type does not include 'undefined'.`

**Cause:** TypeScript thinks async functions can return `undefined` when error handlers don't explicitly throw.

**Solution:**
Update error handlers to return `Error` and explicitly throw in catch blocks:

```typescript
// Before:
const handleApiError = (error: any, fallbackMessage: string): never => {
  logger.error(fallbackMessage, error);
  const apiMessage: string | undefined = error?.response?.data?.message;
  throw new Error(apiMessage || fallbackMessage);
};

// After:
const handleApiError = (error: any, fallbackMessage: string): Error => {
  logger.error(fallbackMessage, error);
  const apiMessage: string | undefined = error?.response?.data?.message;
  return new Error(apiMessage || fallbackMessage);
};

// In catch blocks:
catch (error) {
  throw handleApiError(error, "Failed to...");
}
```

**Prevention:**
- Always explicitly `throw` errors in catch blocks
- Use `Error` return type for error handlers instead of `never`
- Ensure all code paths in async functions either return a value or throw

### 3. Optional Property Type Mismatches

**Error:** `Type 'boolean | undefined' is not assignable to type 'boolean'.`

**Cause:** Optional properties from DTOs (`isActive?: boolean`) are assigned to required properties.

**Solution:**
Use nullish coalescing operator to provide defaults:

```typescript
// Before:
isActive: env.isActive,

// After:
isActive: env.isActive ?? true,
```

**Prevention:**
- Always provide defaults for optional properties when assigning to required ones
- Use `??` (nullish coalescing) or `||` (logical OR) operators
- Check type definitions to understand which properties are optional

### 4. Function vs Boolean Type Mismatches

**Error:** `Type '(user: User) => boolean' is not assignable to type 'boolean | undefined'.`

**Cause:** A function is passed where a boolean is expected.

**Solution:**
Convert function to boolean by checking if condition is met:

```typescript
// Before:
allowDelete={canDeleteUser}

// After:
allowDelete={users.some(canDeleteUser)}
```

**Prevention:**
- Check prop types before passing values
- Convert functions to booleans when needed using `.some()`, `.every()`, or direct calls

### 5. Null/Undefined in SelectOption Values

**Error:** `Type 'null' is not assignable to type 'string | number'.`

**Cause:** `SelectOption` interface requires `value: string | number`, but `null` is used for "unassigned" options.

**Solution:**
Use sentinel values (like `-1`) and convert in handlers:

```typescript
// In options:
{ value: -1, label: "Unassigned" }

// In value prop:
value={formData.assigneeId ?? -1}

// In onChange handler:
onChange={(value) => setFormData({ ...formData, assigneeId: value === -1 ? null : (value as number) })}
```

**Prevention:**
- Never use `null` in `SelectOption.value`
- Use sentinel values (`-1`, `0`, `""`) for special cases
- Always convert sentinel values back to `null` in handlers

## Pre-Commit Checklist

Before committing code, ensure:

1. ✅ Run type checking: `pnpm type-check` (or `pnpm typecheck`)
2. ✅ Run build check: `pnpm build:check` (runs type-check + build)
3. ✅ Verify no `@/types/api` imports exist
4. ✅ All async functions have explicit return/throw paths
5. ✅ Optional properties have defaults when needed
6. ✅ No `null` values in `SelectOption.value`

## CI/CD Integration

The Jenkinsfile should include type checking before build:

```groovy
stage('Type Check') {
  steps {
    sh 'cd apps/admin && pnpm type-check'
  }
}
```

This catches TypeScript errors early in the CI/CD pipeline.

## Running Type Checks

### Local Development

```bash
# Type check only
cd apps/admin && pnpm type-check

# Type check + build
cd apps/admin && pnpm build:check
```

### Before Committing

Always run `pnpm build:check` in the admin app directory before committing to ensure:
- TypeScript compilation succeeds
- Next.js build completes successfully
- No type errors will block Portainer/Jenkins builds

## Future Improvements

1. **Shared Types File:** Create `apps/admin/lib/types/api.types.ts` to centralize `ApiSuccessResponse` definition
2. **Strict Type Checking:** Enable stricter TypeScript compiler options
3. **Automated Checks:** Add pre-commit hooks to run type checking automatically
4. **Type Documentation:** Document all shared types and their usage patterns

## Related Files

- `apps/admin/package.json` - Contains `type-check` and `build:check` scripts
- `apps/admin/tsconfig.json` - TypeScript configuration
- `apps/admin/app/admin/*/types.ts` - Module-specific type definitions
- `apps/admin/lib/api/*.ts` - API service files with error handling

## Notes

- Some errors in legacy/unused components (e.g., `components/ecommerce/*`, `components/tables/BasicTableOne.tsx`) may not block builds but should be fixed if those components are actively used
- The `lib/tree/index.ts` file has complex generic type constraints that may require refactoring if errors persist



