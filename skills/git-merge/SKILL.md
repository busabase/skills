---
name: git-merge
description: Intelligently run git merge into the current branch, usually from the newest origin/develop but also from any branch the user specifies. Use when the user says "git merge", "git merge origin/develop (newest)", "git merge newest origin/develop", or asks to resolve merge conflicts smartly. Protect unrelated local changes, resolve conflicts by preserving current feature intent plus incoming changes, run focused validation, and commit/push when the branch already has a pull request.
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(gh:*), Bash(pnpm:*), Bash(make:*), Read, Edit, Grep, Glob
user-invocable: true
---

# Git Merge

Use this when the user asks to merge another branch into the current branch. Default to latest `origin/develop` when the user does not name a source branch, but honor explicit sources such as `origin/main`, `feature/foo`, or another remote branch.

Common prompts:

- `git merge`
- `git merge origin/develop (newest)`
- `git merge newest origin/develop`
- `merge develop`
- `merge feature/foo and resolve conflicts`

The goal is not just to run Git. Preserve the feature branch's intent, incorporate the incoming branch carefully, protect unrelated local changes, and leave a clear report.

## Workflow

1. Inspect state:
   - `git status --short --branch`
   - `git log --oneline --decorate -5`
   - `gh pr view --json number,url,state,headRefName,baseRefName` if GitHub CLI auth is available.
   - Note any uncommitted changes. Treat them as user-owned unless you just made them.
   - Detect the merge source:
     - If the user named a branch, use it.
     - Otherwise use `origin/develop`.

2. Protect local changes before merging:
   - If the worktree is dirty, stash only the dirty paths when practical.
   - Prefer path-limited stash for known unrelated changes such as root `src/i18n/*` deletions.
   - If many feature files are dirty and are part of the active work, stash all with a descriptive message, then restore after merge.

3. Fetch and merge:
   - **ALWAYS fetch before merging**, no exceptions — even if the user didn't say "newest".
   - For `origin/develop`: `git fetch origin develop`
   - For another remote branch: `git fetch origin <branch>`
   - For a local source branch: verify it exists with `git rev-parse --verify` (no fetch needed).
   - `git merge <source>`
   - Never use destructive reset/checkout to resolve conflicts.

4. Resolve conflicts intelligently:
   - Read conflicted files. Do not blindly choose ours/theirs.
   - Preserve both sides when they are additive.
   - Keep current branch's feature intent when the incoming branch renamed or reshaped old concepts.
   - Prefer current architecture over legacy names.

## Repo Conflict Policies

- **Buda billing/order work**:
  - Prefer `billingOrders` over legacy `billingPayments`.
  - Keep `billing_orders` as the commerce ledger for subscriptions, fixed-term plans, credits, courses, marketplace, refunds, and manual grants.
  - If develop reintroduces `createBillingPayment`-style test fixtures, merge them into order fixtures such as `createBillingOrderEvent`.

- **Drizzle migrations**:
  - Do not hand-write migrations casually.
  - If migration numbers collide, delete conflicting generated migration files and snapshots, reset journal to the last agreed migration, then run the app's `db:generate`.
  - If Drizzle asks whether `billing_orders` is a rename, choose create table; it is not a rename from `billing_payments`.
  - Inspect generated SQL for unsafe `NOT NULL` additions on existing tables and report risks.

- **Tests and fixtures**:
  - Preserve develop's new fixture helpers and the branch's changed persistence model.
  - If resolving a test conflict, run that exact test immediately.
  - For CRM journey tests, preserve source-tag helpers while keeping billing assertions on `billingOrders`.

## Validation

- Conflicted test file changed: run that exact Vitest spec.
- Buda billing/order changed: run order/webhook/payment related specs.
- Buda changes: run `pnpm --filter buda run typecheck` when feasible.
- Many files changed or before commit/push: run `pnpm lint:err`.
- Avoid full `make typecheck` if develop has unrelated known failures; if run and it fails elsewhere, report clearly.

## Finish

1. Restore any stash after merge.
2. Verify no unresolved conflicts: `git diff --name-only --diff-filter=U`.
3. If the current branch already has an open pull request:
   - Stage only files involved in the merge and your conflict resolution.
   - Commit the merge result with a concise message such as `merge origin/develop into feature branch`.
   - Push the current branch.
   - Report the PR URL.
4. If there is no open pull request, do not push unless the user asks.
5. Report source branch merged, conflicts resolved, tests/checks run, commit hash if created, and whether push was performed.
