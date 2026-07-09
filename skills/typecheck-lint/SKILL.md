---
name: typecheck-lint
description: Run typecheck and lint, then fix all errors. Reference apps/productready as the golden standard when resolving issues.
disable-model-invocation: false
allowed-tools: Bash(make:*), Bash(pnpm:*), Bash(npx:*), Read, Write, Edit, Grep, Glob
user-invocable: true
---

# Fix Typecheck & Lint Errors

Run `make typecheck && pnpm lint:err` and fix ALL errors until both pass cleanly.

## Workflow

1. Run `make typecheck && pnpm lint:err`
2. For each error, check `apps/productready` for the correct pattern (it is the boilerplate golden standard)
3. Fix the error following productready's conventions
4. Re-run until zero errors

## Key Rules

- **apps/productready is the golden standard** — when in doubt, look at how productready does it
- **DO NOT modify packages/kui** unless explicitly told to
- Fix errors in the order they appear; type errors first, then lint
- If a type error stems from a wrong VO/DTO/PO pattern, align with productready's approach
- If a lint error is about unused imports, remove them; don't just suppress

## Common Fix Patterns

### Missing dependencies in useCallback/useEffect
Add the missing dependency to the array. Check productready for whether the value should be stable (wrapped in useCallback/useMemo upstream).

### Type mismatch on tRPC router
Check `apps/productready/src/server/routers/` or `apps/productready/src/domains/*/trpc/` for the correct input/output schema pattern.

### Import resolution errors
Ensure the import path uses `~/` alias correctly. Check `tsconfig.json` paths and compare with productready.

### Biome lint errors
Run `pnpm lint:err` which uses `biome format . --write && biome check . --write --diagnostic-level=error`. Remaining errors after auto-fix need manual intervention.
