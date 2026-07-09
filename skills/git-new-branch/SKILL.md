---
name: git-new-branch
description: Update from remote develop, start a new branch with a conventional name, and submit via git-push.
disable-model-invocation: false
allowed-tools: Bash, AskUserQuestion, Skill
user-invocable: true
---

# Git New Branch

Follow these steps to safely switch context, synchronize with remote develop, and start a new task.

> **Worktree note**: Run every command below in the **current working directory**. If this is a git worktree session, do NOT `cd` into the main repo checkout — the new branch (and its files) must be created in the worktree you are already in, otherwise the branch lands in a different working copy and the user won't see the files where they expect.

## Workflow

1. **Safety Checks**:
   - **Uncommitted Changes**: Run `git status --porcelain`.
     - If output is not empty, **STOP**. Tell user: "You have uncommitted changes. Please commit or stash them first."
   - **Open PR Check**:
     - Get current branch: `git branch --show-current`
     - If current branch is NOT `develop` or `main` or `master`:
       - Check for open PR: `gh pr view --json state,url`
       - If PR is **OPEN**, ask for confirmation using `AskUserQuestion`:
         - Question: "You have an OPEN Pull Request for the current branch. Do you want to leave it and start a new task?"
         - Options: ["Yes, start new task", "No, stay here"]
       - If user says "No", **STOP**.

2. **Update Base Branch (Remote Sync)**:
   - Fetch latest changes from remote: `git fetch origin develop`
   - Confirm the fetch actually moved the ref (the output shows `<old>..<new> develop -> origin/develop`, or "up to date"). This step MUST run before creating the branch so it is based on the newest develop.
   - *Note*: We do NOT checkout local `develop` to avoid worktree conflicts.

3. **Get Task Description**:
   - If user didn't provide args, use `AskUserQuestion`:
     - Question: "What task are you planning to do?"
     - Header: "Task Description"

4. **Generate Names**:
   - **Branch Name**: `type/short-description` (e.g., `feat/login-page`)
   - **Commit Message**: `type: start work on <Task Description>` (e.g., `feat: start work on login page`)
   - Types: `feat`, `fix`, `chore`, `refactor`, `docs`.

5. **Initialize Branch**:
   - Create the branch from the tip just fetched in step 2: `git checkout -b <Branch Name> FETCH_HEAD`
     - `FETCH_HEAD` is the develop tip fetched above, so the branch is guaranteed to start from the newest develop even if the local `origin/develop` remote-tracking ref is stale. (`git checkout -b <Branch Name> origin/develop` also works once the fetch in step 2 has updated the ref.)
   - Create an **empty commit** to initialize the PR:
     ```bash
     git commit --allow-empty -m "<Commit Message>"
     ```

6. **Submit (Push & PR)**:
   - Invoke the `git-push` skill to handle the rest.
   - **Important**: Pass `keep-draft` argument to ensure the new PR stays in Draft mode.
   - Command: `/git-push keep-draft`
