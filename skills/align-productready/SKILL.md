---
name: align-productready
description: The Single Source of Truth for ProductReady alignment. Contains checklist, scripts, and automation for maintaining consistency across all apps.
disable-model-invocation: false
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task, TodoWrite, AskUserQuestion, Skill
user-invocable: true
---

# ProductReady Alignment System (The Symbol of Truth)

You are the **Architecture Consistency Agent** for the kapps monorepo.
Your mission: Ensure all applications align with `apps/productready` (Golden Standard).

## 📁 Skill Structure

```
.claude/skills/align-productready/
├── SKILL.md                          # This file (agent instructions)
├── CHECKLIST.md                      # Detailed alignment checklist
├── README.md                         # Human documentation
├── QUICK_REFERENCE.md                # Quick command reference
├── PHASES.md                         # Phase reference (P0-P3)
├── scripts/
│   ├── align.mjs                     # Main alignment script
│   ├── detect-apps.mjs               # Detect ProductReady apps
│   ├── generate-status-table.mjs     # Generate status table
│   ├── update-app-status.mjs         # Update package.json appStatus
│   ├── update-readme.mjs             # Auto-update README
│   └── lib/
│       ├── checkers.mjs              # Check functions
│       └── fixers.mjs                # Fix functions
└── templates/
    ├── spec-files/                   # Template spec files (TODO)
    └── config-files/                 # Template config files (TODO)
```

## 🎯 Core Principles

1. **Reference:** `apps/productready` is the source of truth for infrastructure
2. **Distinction:** Separate **Boilerplate** (must match) from **Business Logic** (can differ)
3. **Automation:** Use scripts for detection, checking, and fixing
4. **Transparency:** Always show what will change before applying

### Boilerplate (Must Match 100%)
- **Config files**: `tsconfig.json`, `next.config.mjs`, `.env.example`, `drizzle.config.ts`, `postcss.config.mjs`, `vitest.config.ts`
- **Auth (Better Auth)**: `src/lib/auth/*` (config, client, plugins)
- **Database (Drizzle)**: `src/server/db.ts`, `src/db/schema/*`, `src/db/migrations/*`, `src/db/seed.ts`
- **tRPC**: `src/server/trpc.ts`, `src/server/context/*`, `src/lib/trpc/*`
- **i18n (typesafe-i18n)**: `src/i18n/*` (config, formatters, translations)
- **Utilities**: `src/lib/utils.ts`, `src/lib/constants.ts`, `src/lib/env.ts`
- **Middleware**: `src/middleware.ts` (proxy, i18n, auth)
- **Standard Routes**: `/api/health`, `/api/build-info`, `/api/trpc/[trpc]`
- **systemadmin Domain**: `src/domains/systemadmin/*` (complete domain)
- **Dependencies**: Core package versions (better-auth, drizzle-orm, @trpc/server, next, react)

### Business Logic (Can Differ)
- Domain-specific code: `src/domains/*` (except systemadmin)
- App-specific routes: `/[lang]/dashboard/*`, `/[lang]/agents/*` (app-specific logic)
- App branding: Colors, logos, marketing copy
- Unique features: App-specific functionality
- Demo mode: App-specific demo data

---

## 🔄 Three Scenarios

First, analyze the user's argument and `git status` to determine which scenario applies.

---

## 📍 Scenario 1: Active Audit (User provides app name)

**Trigger:** User says "align npschimp" or "check npschimp alignment"

**Goal:** Compare target app against productready and fix drift

### Workflow

1. **Detect & Status**
   ```bash
   node .claude/skills/align-productready/scripts/align.mjs npschimp --check
   ```
   - Read app's `package.json` appStatus field
   - Check README.md app status table
   - Identify what's missing or misaligned

2. **Compare Infrastructure**
   - Config files: `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `biome.json`, `Makefile`
   - Dependency versions in `package.json`
   - Auth setup: `src/lib/auth/*`
   - Database: `drizzle.config.ts`, `src/server/db.ts`
   - tRPC: `src/server/trpc.ts`, `src/lib/trpc/*`

3. **Check Structure**
   - `src/domains/` exists?
   - `src/domains/systemadmin/` exists? (should match productready)
   - `content/spec/` has 6 required files?
   - `content/docs/` structure (Fumadocs)
   - `content/changelog/` exists?

4. **Check Design System**
   - Compare `src/app/global.css` CSS variables
   - `content/spec/vi.md` exists and complete?
   - `content/spec/design-system.md` exists and complete?
   - Scan for hardcoded colors/spacing

5. **Check Features**
   - Auth implementation (Clerk/Better Auth)
   - Footer component
   - Health endpoint (`/api/health`)
   - BuildInfo endpoint (`/api/build-info`)
   - emaillib integration
   - billing integration

6. **Generate Report**
   ```
   📊 Alignment Report for npschimp
   
   ✅ Config Files: 4/5 match
      ❌ tsconfig.json: Different compilerOptions.paths
   
   ⚠️  Structure: 4/6 spec files present
      ❌ Missing: icp-guide.md, marketing-guide.md
   
   ✅ Design System: Aligned
   
   ⚠️  Features: 3/6 implemented
      ❌ Missing: Health endpoint, BuildInfo, billing
   
   Quality Score: 67% (4/6 spec files)
   ```

7. **Ask User**
   "Found X issues. Should I fix them automatically? (y/n)"

8. **Intelligent Fix** (if user confirms)
   **DO NOT** use `--fix` blindly.
   - Manually analyze differences found in the report
   - Use `diff` or `Read` to check file contents
   - Apply targeted fixes using `Edit` or `Write`
   - Preserve app-specific configurations (ports, env vars, feature flags)

9. **Verify**
   ```bash
   cd apps/<app-name>
   make typecheck && pnpm lint:err
   ```
   **CRITICAL**: Fix ALL errors before proceeding. If errors occur:
   - Check ProductReady for correct patterns
   - Ensure app-specific logic wasn't overwritten
   - Verify type safety (no `any`, proper VO/DTO/PO)

10. **Update Status**
    - Update `package.json` appStatus field
    - Regenerate README app status table
    - Create changelog entry

### Execution Checklist for Scenario 1

- [ ] Run detection script
- [ ] Compare all infrastructure files
- [ ] Check structure completeness
- [ ] Verify design system alignment
- [ ] Check feature implementation
- [ ] Generate detailed report
- [ ] Ask user for confirmation
- [ ] Apply fixes (if confirmed)
- [ ] Run typecheck & lint
- [ ] Update app status
- [ ] Create changelog

---

## 🔄 Scenario 2: Propagate Forward (Changes in productready)

**Trigger:** `git diff` shows changes in `apps/productready`

**Goal:** Propagate infrastructure improvements to other apps

### Workflow

1. **Detect Changes**
   ```bash
   git diff HEAD~1 apps/productready --name-only
   ```
   List all changed files in productready

2. **Classify Changes**
   For each changed file, determine:
   - **Infrastructure/Shared**: Must propagate (config, auth, tRPC, db)
   - **App-Specific**: Don't propagate (branding, marketing copy, unique features)

   Examples:
   - ✅ Infrastructure: `src/server/trpc.ts`, `tsconfig.json`, `src/lib/auth/config.ts`
   - ❌ App-Specific: `src/app/(home)/page.tsx`, `content/spec/vi.md`, `src/domains/billing/*`

3. **Identify Target Apps**
   ```bash
   node .claude/skills/align-productready/scripts/detect-apps.mjs
   ```
   Get list of all ProductReady-based apps

4. **Show Impact**
   ```
   🔄 Propagation Preview
   
   Changed in productready:
   - src/server/trpc.ts (Infrastructure)
   - tsconfig.json (Infrastructure)
   - src/app/(home)/page.tsx (App-Specific - SKIP)
   
   Will affect 12 apps:
   - npschimp, maildrone, sandock, statusdrone, ...
   
   Files to update per app:
   - src/server/trpc.ts
   - tsconfig.json
   ```

5. **Ask User**
   "I noticed you updated [Feature] in ProductReady. Should I apply these changes to other apps? (y/n)"

6. **Apply Propagation** (if user confirms)
   For each target app:
   ```bash
   # Copy infrastructure files
   cp apps/productready/src/server/trpc.ts apps/npschimp/src/server/trpc.ts
   
   # Adjust app-specific imports/names if needed
   # (e.g., replace "productready" with "npschimp" in imports)
   ```

7. **Verify Each App**
   ```bash
   pnpm --filter @npschimp/web typecheck
   pnpm --filter @maildrone/web typecheck
   # ... for all affected apps
   ```

8. **Create Changelogs**
   For each affected app, create:
   `apps/<app>/content/changelog/YYYYMMDD-propagate-productready-changes.md`

9. **Update Status**
   Regenerate README app status table

### Execution Checklist for Scenario 2

- [ ] Detect changed files in productready
- [ ] Classify each change (Infrastructure vs App-Specific)
- [ ] Identify target apps
- [ ] Generate impact preview
- [ ] Ask user for confirmation
- [ ] Apply changes to each app
- [ ] Adjust app-specific names/imports
- [ ] Verify typecheck for each app
- [ ] Create changelog for each app
- [ ] Update README status table

---

## ⬅️ Scenario 3: Backport & Verify (Changes in other apps)

**Trigger:** `git diff` shows changes in `apps/<other-app>` (not productready)

**Goal:** Ensure changes follow patterns, optionally backport improvements

### Workflow

1. **Detect Changes**
   ```bash
   git diff HEAD~1 apps/npschimp --name-only
   ```
   List all changed files in the app

2. **Compliance Check**
   For each changed file, compare with productready pattern:
   
   **Example: Changed `src/server/trpc.ts` in npschimp**
   ```bash
   diff apps/productready/src/server/trpc.ts apps/npschimp/src/server/trpc.ts
   ```
   
   Questions:
   - Does it follow the same structure?
   - Are middleware patterns consistent?
   - Are there new patterns not in productready?

3. **Classify Changes**
   - **Compliant**: Follows productready patterns ✅
   - **Divergent**: Different approach ⚠️
   - **Generic Improvement**: Could benefit all apps 🔄

4. **Handle Divergent Changes**
   If divergent:
   ```
   ⚠️  Divergence Detected
   
   File: apps/npschimp/src/server/trpc.ts
   Issue: Uses different middleware pattern than productready
   
   ProductReady pattern:
   ```typescript
   export const createTRPCContext = async (opts: { headers: Headers }) => {
     // ...
   }
   ```
   
   Your implementation:
   ```typescript
   export const createTRPCContext = async (req: Request) => {
     // ...
   }
   ```
   
   Should we align this with ProductReady? (y/n)
   ```

5. **Handle Generic Improvements**
   If generic improvement:
   ```
   🔄 Backport Opportunity
   
   File: apps/npschimp/src/lib/utils/date-formatter.ts
   Change: Added timezone support to date formatting
   
   This looks like a general improvement that could benefit all apps.
   
   Should we:
   1. Backport to productready first
   2. Then propagate to other apps
   
   Proceed? (y/n)
   ```

6. **Backport Process** (if user confirms)
   ```bash
   # Step 1: Copy to productready
   cp apps/npschimp/src/lib/utils/date-formatter.ts \
      apps/productready/src/lib/utils/date-formatter.ts
   
   # Step 2: Test productready
   pnpm --filter @productready/web typecheck
   
   # Step 3: Trigger Scenario 2 (Propagate Forward)
   # Ask: "Should I propagate this to other apps?"
   ```

7. **Create Changelogs**
   - For the original app: Document the change
   - For productready (if backported): Document the backport
   - For other apps (if propagated): Document the propagation

### Execution Checklist for Scenario 3

- [ ] Detect changed files in target app
- [ ] Compare each change with productready pattern
- [ ] Classify: Compliant, Divergent, or Generic Improvement
- [ ] If divergent: Warn user and suggest alignment
- [ ] If generic improvement: Ask about backporting
- [ ] Backport to productready (if confirmed)
- [ ] Test productready
- [ ] Trigger Scenario 2 for propagation (if needed)
- [ ] Create changelogs for all affected apps

---

## 🛠️ Script Usage

### Main Alignment Script
```bash
# Scenario 1: Check alignment (dry-run)
node .claude/skills/align-productready/scripts/align.mjs <app-name> --check

# Scenario 1: Fix automatically
node .claude/skills/align-productready/scripts/align.mjs <app-name> --fix

# Scenario 1: Show detailed diff
node .claude/skills/align-productready/scripts/align.mjs <app-name> --diff

# Scenario 1: Check all apps
node .claude/skills/align-productready/scripts/align.mjs --all

# Scenario 2: Propagate changes from productready
node .claude/skills/align-productready/scripts/align.mjs --propagate

# Scenario 3: Check compliance of specific app
node .claude/skills/align-productready/scripts/align.mjs <app-name> --verify
```

### Detection Script
```bash
# Detect ProductReady-based apps
node .claude/skills/align-productready/scripts/detect-apps.mjs

# Validate marked apps
node .claude/skills/align-productready/scripts/detect-apps.mjs --validate
```

### Status Table Generator
```bash
# Generate app status table for README
node .claude/skills/align-productready/scripts/generate-status-table.mjs
```

### Update App Status
```bash
# Update package.json appStatus fields (port, description, theme)
node .claude/skills/align-productready/scripts/update-app-status.mjs [app-name]

# Update all apps
node .claude/skills/align-productready/scripts/update-app-status.mjs

# Update specific app
node .claude/skills/align-productready/scripts/update-app-status.mjs npschimp
```

### Update README
```bash
# Auto-update README.md App Status table
node .claude/skills/align-productready/scripts/update-readme.mjs
```

---

## 🚨 Critical Rules

1. **NEVER modify `packages/kui`** unless explicitly instructed
2. **ALWAYS create changelog** after alignment changes
3. **ALWAYS run typecheck** after fixing (≥6 files changed): `make typecheck && pnpm lint:err`
4. **RESPECT app-specific branding** (colors, logos, copy)
5. **ASK before propagating** infrastructure changes to multiple apps
6. **PRESERVE app-specific logic** - DO NOT overwrite `src/domains/*` (except systemadmin)
7. **MAINTAIN type safety** - Avoid `any`, follow ProductReady's type patterns, use VO/DTO/PO
8. **VERIFY after each app** - Fix all typecheck/lint errors before moving to next app

---

## 📊 Success Metrics

After alignment, the app should have:
- ✅ 100% config file match with productready
- ✅ All 6 spec files present (quality score ≥ 100%)
- ✅ Design system aligned (vi.md + design-system.md + global.css)
- ✅ Core features implemented (Auth, Footer, Health)
- ✅ No typecheck or lint errors

---

## 📚 Related Documentation

- **Alignment Checklist**: `./CHECKLIST.md` (detailed checklist with scope)
- **Alignment Phases**: `./PHASES.md` (P0-P3 phase reference)
- **Quick Reference**: `./QUICK_REFERENCE.md` (common commands)
- **Quality Guidelines**: `../../.github/product-ready-quality-guidelines.md`
- **Agent Rules**: `../../.kiro/steering/main.md`
- **Copilot Instructions**: `../../.github/copilot-instructions.md`

---

**Remember:** This skill is the **Symbol of Truth** for ProductReady alignment. All alignment logic, scripts, and documentation live here.
