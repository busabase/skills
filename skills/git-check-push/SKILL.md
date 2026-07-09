---
name: git-check-push
description: Run typecheck + lint (fix all errors), then commit, push, and create PR. Combines typecheck-lint and git-push skills.
disable-model-invocation: false
allowed-tools: Bash(make:*), Bash(pnpm:*), Bash(npx:*), Bash(git:*), Bash(gh:*), Read, Write, Edit, Grep, Glob
user-invocable: true
---

# Typecheck, Lint, Commit & Push

This skill combines two atomic skills in sequence:

## Phase 1: typecheck-lint

Follow the `typecheck-lint` skill — run `make typecheck && pnpm lint:err`, fix all errors referencing `apps/productready` as the golden standard. Repeat until zero errors.

## Phase 2: git-push

Follow the `git-push` skill — stage, commit with conventional message, push, and ensure a PR exists (create if missing).

## Rules

- **CRITICAL**: If `typecheck` or `lint` fails and you cannot fix the errors, **STOP IMMEDIATELY**.
- **NEVER** proceed to Phase 2 (git-push) if there are unresolved errors.
- DO NOT modify `packages/kui` unless explicitly told to
