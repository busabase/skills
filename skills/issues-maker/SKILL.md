---
name: issues-maker
description: Create a GitHub issue based on code analysis, then fix it using issues-coder.
disable-model-invocation: false
allowed-tools: Bash, Read, Grep, Glob, Skill, AskUserQuestion
user-invocable: true
---

# Issues Maker

Create a GitHub issue based on code analysis, then fix it using `issues-coder`.

## Workflow

### Step 1: Analyze Code & Identify Issues
1. **Understand Requirement**: Read the user's input. If the requirement is vague or slightly blurry, use `AskUserQuestion` to clarify.
2. **Read Code & Verify**: Explore the codebase. Once you have a clear understanding and have verified the issue in the code, proceed.
3. **Propose**: Present the identified issue and the proposed fix to the user for one final confirmation before creating the issue.
   - Question: "I've analyzed the code and confirmed the issue: <detailed description>. Ready to create a GitHub issue and fix it?"
   - Options: ["Yes, create and fix", "No, skip", "Stop"]

### Step 2: Create GitHub Issue
1. **Generate Title & Body**: Create a clear title and detailed body for the issue.
2. **Create Issue**:
   ```bash
   gh issue create --title "<title>" --body "<body>" --label "bug" --assignee "@me"
   ```
3. **Capture Issue Number**: Extract the issue number from the command output.

### Step 3: Fix with Issues Coder
1. **Invoke Skill**: Use the `issues-coder` skill with the new issue number.
   - Command: `Skill("issues-coder", args="<issue-number>")`

## Rules
- **NEVER** create an issue without user confirmation.
- **ALWAYS** check for existing issues to avoid duplicates.
- **FOLLOW** repo conventions for issue titles and labels.
- **DELEGATE** the actual fix to `issues-coder`.
