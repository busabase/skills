# Alignment Phases Reference

This document describes the alignment phases from the original ProductReady alignment system.

## Phase Overview

### P0: Core Infrastructure (Default)
**Components:**
- Drizzle database with lazy initialization
- Better-Auth (admin, apiKey, organization plugins)
- tRPC (context, procedures)

**Validation:**
```bash
make typecheck && pnpm lint:err
pnpm --filter <app> db:generate
pnpm --filter <app> db:migrate
pnpm --filter <app> auth:generate
```

### P1: Essential Features
**Components:**
- Typesafe-i18n configuration
- Health monitoring endpoint
- Dashboard route structure

**Validation:**
```bash
pnpm --filter <app> typesafe-i18n
curl http://localhost:PORT/api/health
```

### P2: Advanced Features
**Components:**
- Demo mode implementation
- System admin routes
- Task scheduler

### P3: Optional Features
**Components:**
- AI agent integration
- Billing integration
- Email integration

## Success Criteria

- ✅ `make typecheck && pnpm lint:err` passes
- ✅ Database migrations run
- ✅ Auth flow works
- ✅ tRPC endpoint responds
- ✅ All routes exist
- ✅ Changelog created

## Notes

These phases are from the original alignment system. The current align-productready skill uses a different approach based on three scenarios (Active Audit, Propagate Forward, Backport & Verify).

For current alignment workflow, see:
- `.claude/skills/align-productready/SKILL.md`
- `.claude/skills/align-productready/CHECKLIST.md`
