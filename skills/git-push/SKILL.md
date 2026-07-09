---
name: git-push
description: Git commit, push, and ensure a PR exists and is ready for review. Supports keeping draft state with 'keep-draft'.
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(gh:*)
user-invocable: true
---

# Git Push & PR

Stage changes, commit, push, and manage Pull Request state.

## Arguments
- `keep-draft` (optional): If present, prevents auto-activating a Draft PR to "Ready for Review".

## Workflow

1. **Safety Check (PR Status)**:
   - Check if a PR exists and its state:
     ```bash
     gh pr view --json state,url,isDraft
     ```
   - **IF PR is MERGED or CLOSED**:
     - **STOP IMMEDIATELY**. Do not commit or push.
     - Warn the user: "⚠️ The Pull Request ({url}) is {state}. Context is stale."
     - Hint: "Please run `/git-new-branch` to start a fresh task."
   - **IF PR is OPEN**: Proceed.
   - **IF NO PR FOUND**: Proceed.

2. **Stage**: `git add -A`

3. **Commit**: Use a conventional commit message (`fix:`, `feat:`, `chore:`, `docs:`) based on what changed.

4. **Push**: `git push` (if no upstream, use `git push --set-upstream origin $(git branch --show-current)`).

5. **PR Handling**:
   - **Generate Metadata**:
     - Run `git log develop..HEAD` (or appropriate base branch) to understand the full scope of changes.
     - **Title**: Generate a conventional commit style title summarizing the entire PR.
     - **Body**: Generate a bulleted list of changes.
   - **If PR exists (from Step 1)**:
     - Update the PR with the new title/description:
       ```bash
       gh pr edit --title "..." --body-file - <<'EOF'
       ## Summary
       - ...

       ## Validation
       - ...
       EOF
       ```
     - Check `isDraft` status.
     - **If Draft**:
       - If `keep-draft` IS passed: **Do nothing** (Maintain Draft).
       - If `keep-draft` IS NOT passed: Run `gh pr ready` (Activate).
     - Report the URL.
   - **If NO PR existed**:
     - Create one with the generated title/description:
       ```bash
       gh pr create --title "..." --body-file - <<'EOF'
       ## Summary
       - ...

       ## Validation
       - ...
       EOF
       ```
     - Report the new URL.
