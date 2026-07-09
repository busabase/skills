---
name: issues-coder
description: Read GitHub issues, spawn a sub-agent to implement the fix, create branch + PR linked to the issue, commit, and assign reviewer.
disable-model-invocation: false
allowed-tools: Bash(gh:*), Bash(git:*), Bash(make:*), Bash(pnpm:*), Bash(npx:*), Read, Write, Edit, Grep, Glob, Skill, AskUserQuestion, sessions_spawn
user-invocable: true
---

# Issues Coder

Pick open GitHub issues → analyze → spawn sub-agent to implement → create PR → done.

## Arguments
- `issue-number` (optional): Start with a specific issue number.

## Workflow

### Step 0: Prepare Working Tree

1. **Safety Check (CRITICAL)**:
   ```bash
   CURRENT_BRANCH=$(git branch --show-current)
   if [ "$CURRENT_BRANCH" = "develop" ] || [ "$CURRENT_BRANCH" = "main" ]; then
     echo "On protected branch. Will branch off from here."
   fi
   ```
2. **Stash any uncommitted changes** on the current branch:
   ```bash
   ORIGINAL_BRANCH=$(git branch --show-current)
   git stash push -m "issues-coder: auto-stash before switching"
   ```
3. **Resume check** — if already on a `fix/<N>-*` or `feat/<N>-*` branch:
   - Check PR state: `gh pr view --json state,isDraft,url 2>/dev/null`
   - **Draft PR exists** → unfinished work. Read issue `#<N>`, continue from Step 2.
   - **Open PR (not draft)** → already done. Go to Step 1.
   - **No PR** → branch exists but no code yet. Read issue `#<N>`, continue from Step 2.
4. If on `develop`/`main` or unrelated branch → go to Step 1.

---

### Step 1: Pick & Analyze

1. **Fetch issues** (skip any with linked PRs or unclear requirements):
   ```bash
   gh issue list --state open --limit 20 --json number,title,labels,author,assignees
   ```
   For each candidate, check for linked PRs:
   ```bash
   gh pr list --state all --search "#<NUMBER>" --json number,url --limit 1
   ```
   **Skip if**: any PR references it (open, draft, or merged).

2. **View issue details**:
   ```bash
   gh issue view <NUMBER> --json number,title,body,labels,assignees,author,comments
   ```
   **Skip if**: comments show unresolved discussion about requirements.

3. **Analyze**: summarize problem, grep related files, estimate scope.

4. **Ask user (Sandboxing & Confirmation)**:
   - "🔍 **#<N>: <title>** — <analysis> — Fix this?"
   - Options: **["Yes", "Skip", "Stop"]**
   - **Wait for explicit "Yes" or "确认" before proceeding.**

---

### Step 2: Branch & Delegate to Sub-agent

1. **Create branch** (skip if resuming on existing branch):
   ```bash
   git fetch origin develop
   git checkout -b fix/<NUMBER>-<short-desc> --no-track origin/develop
   ```
   ⚠️ **`--no-track` is CRITICAL** — without it the branch tracks `origin/develop` and `git push` will push to develop directly!

2. **Spawn Sub-agent for Implementation (Async)**:
   - Do NOT implement the fix in the main agent loop.
   - Use `sessions_spawn` (runtime="acp" or "subagent") to spawn a coding agent.
   - Provide the sub-agent with the issue details, the current branch name, and instructions to follow repo rules (check `apps/productready`, no KUI mods, VO/DTO/PO, CSS variables).
   - Instruct the sub-agent to run `pnpm build` (for the specific app) or `make typecheck && pnpm lint:err` after finishing the code.
   - Yield the main session (`sessions_yield`) and wait for the sub-agent to announce completion.

3. **Verify Build**:
   - Once the sub-agent returns, the main agent MUST verify the build/typecheck status before proceeding.

---

### Step 3: Sandboxed Review & PR Creation

1. **Show Execution Plan (CRITICAL)**:
   - Print a summary of changed files: `git status -s`
   - Show the proposed commit message and PR title/body.
   - Ask the user: **"Code implemented by sub-agent. Proceed with commit and PR creation? (Reply '确认提交' to proceed)"**

2. **Commit & push** (ONLY after explicit user confirmation):
   ```bash
   # Physical lock to prevent direct push to develop
   if [ "$(git branch --show-current)" = "develop" ]; then
     echo "🛑 FATAL: Attempting to push directly to develop. Aborting."
     exit 1
   fi
   
   git add -A
   git commit -m "fix: <description> (#<NUMBER>)"
   git push -u origin fix/<NUMBER>-<short-desc>
   ```

3. **Create PR**:
   ```bash
   gh pr create --title "fix: <description> (#<NUMBER>)" \
     --body "Closes #<NUMBER>
   ## Changes
   - <bullet list>
   ## Validation
   - <how to verify>" \
     --base develop
   ```
   If draft PR already exists: `gh pr edit --title "..." --body "..."` then `gh pr ready`.

4. **Assign reviewer** (issue author, or first assignee, or ask):
   ```bash
   gh pr edit --add-reviewer <username>
   ```

5. **Comment on issue**:
   ```bash
   gh issue comment <NUMBER> --body "🤖 Fix submitted: $(gh pr view --json url -q .url)"
   ```

---

### Step 4: Clean Up & Done

1. **Switch back** to original branch:
   ```bash
   git checkout $ORIGINAL_BRANCH
   git stash pop 2>/dev/null  # restore stashed changes if any
   ```

2. **Print result**:
   ```
   ✅ #<N> done → PR: <url> → reviewer: @<user>
   ```

3. **Task complete.** Do NOT ask "Next issue?" — one issue per invocation. User will re-run the skill if they want more.

---

## Rules

- **NEVER** push to `develop` or `main` directly. Always create a PR. Physical checks must be in place.
- **NEVER** create a branch without `--no-track` when basing off `origin/develop`.
- **STOP** if typecheck/lint fails — don't create PR with broken code.
- **DELEGATE** heavy coding to sub-agents via `sessions_spawn`. Do not block the main conversational agent with long compilation or coding loops.
- **EXPLICIT CONFIRMATION** is required before creating the branch/assigning the sub-agent, and again before pushing the code/creating the PR.
- Always use `Closes #N` in PR body.
- Always switch back to the original branch after creating the PR.
