# ProductReady Alignment System

**The Symbol of Truth** for maintaining consistency across all apps in the kapps monorepo.

## 🎯 Purpose

This skill is the **single source of truth** for:
1. **Alignment rules** - What must match between apps and productready
2. **Checking logic** - How to detect misalignment
3. **Fixing logic** - How to automatically fix issues
4. **Documentation** - Comprehensive checklists and guidelines

## 🚀 Quick Start

### Check Alignment
```bash
node .claude/skills/align-productready/scripts/align.mjs npschimp --check
```

### Fix Alignment (Manual)
**DO NOT** use `--fix` blindly.
- Manually analyze differences from check report
- Apply targeted fixes
- Preserve app-specific configuration


### Update README
```bash
node .claude/skills/align-productready/scripts/update-readme.mjs
```

## 📋 Three Scenarios

### Scenario 1: Active Audit
**Trigger:** User provides app name  
**Action:** Check and fix specific app against productready

```bash
node scripts/align.mjs npschimp --check
node scripts/align.mjs npschimp --fix
```

### Scenario 2: Propagate Forward
**Trigger:** Changes detected in productready  
**Action:** Propagate infrastructure changes to other apps

```bash
node scripts/align.mjs --propagate
```

### Scenario 3: Backport & Verify
**Trigger:** Changes detected in other apps  
**Action:** Verify compliance and optionally backport improvements

```bash
node scripts/align.mjs npschimp --verify
```

## 🔧 Scripts

### align.mjs
Main alignment script supporting all three scenarios.

### detect-apps.mjs
Detect which apps are based on ProductReady boilerplate.

### generate-status-table.mjs
Generate app status table for README.md from package.json appStatus fields.

### update-app-status.mjs
Update package.json appStatus fields (port, description, theme alignment).

### update-readme.mjs
Auto-update README.md App Status table.

## 🎯 What Gets Checked

### Infrastructure (Must Match 100%)
- Config files: tsconfig.json, tailwind.config.ts, next.config.mjs, biome.json, Makefile
- Auth: src/lib/auth/*
- Database: drizzle.config.ts, src/server/db.ts
- tRPC: src/server/trpc.ts, src/lib/trpc/*

### Structure (Must Exist)
- src/domains/ (DDD architecture)
- src/domains/systemadmin/
- content/spec/ (6 required files)

### Design System (Must Align)
- src/app/global.css
- content/spec/vi.md
- content/spec/design-system.md

### Features (Should Implement)
- Auth, Footer, Health endpoint, BuildInfo endpoint

## 📚 Documentation

- **SKILL.md** - Complete agent instructions with workflow details
- **CHECKLIST.md** - Item-by-item checklist with infrastructure scope
- **QUICK_REFERENCE.md** - Quick command reference
- **PHASES.md** - Phase reference (P0-P3)
- **README.md** - This file (overview)

## 🚨 Critical Rules

1. **NEVER modify packages/kui** unless explicitly instructed
2. **ALWAYS create changelog** after alignment changes
3. **ALWAYS run typecheck** after fixing (≥6 files changed)
4. **RESPECT app-specific branding** (colors, logos, copy)
5. **ASK before propagating** infrastructure changes to multiple apps

## 📊 Success Metrics

After alignment, the app should have:
- ✅ 100% config file match with productready
- ✅ All 6 spec files present (quality score ≥ 100%)
- ✅ Design system aligned (vi.md + design-system.md + global.css)
- ✅ Core features implemented (Auth, Footer, Health)
- ✅ No typecheck or lint errors
