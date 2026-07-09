# Quick Reference

## 🚀 Most Common Commands

```bash
# Check alignment
node .claude/skills/align-productready/scripts/align.mjs <app> --check

# Manual Fix (Recommended)
# Use AI to analyze report and apply fixes manually.
# DO NOT use --fix blindly.

# Update README
node .claude/skills/align-productready/scripts/update-readme.mjs
```

## 📋 Three Scenarios

| Scenario | Command | Status |
|----------|---------|--------|
| **Active Audit** | `align.mjs <app> --check` | ✅ Working |
| **Propagate Forward** | `align.mjs --propagate` | 📋 TODO |
| **Backport & Verify** | `align.mjs <app> --verify` | 📋 TODO |

## 📊 Quality Score

- 🎯 100% = Excellent (6/6 spec files)
- ✅ 80-99% = Good (5/6)
- 🚧 50-79% = In Development (3-4/6)
- ⚠️ <50% = Needs Improvement (0-2/6)

## 📚 Documentation

- **README.md** - Complete documentation
- **SKILL.md** - AI agent instructions
- **CHECKLIST.md** - Detailed checklist
- **PHASES.md** - Phase reference (P0-P3)

## 💡 Tips

1. Always run from project root
2. Check before fixing: `--check` first, then `--fix`
3. Run `make typecheck && pnpm lint:err` after fixing
4. Create changelog after alignment changes
