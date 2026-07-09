# Agent Rules

Align all AI coding agents to single source of truth.

## Single Source of Truth

**Edit only these two places**:
- `AGENTS.md` - all rules
- `.agents/skills/` - all skills

**Everything else is a symlink** - don't edit them!

## Quick Start

```bash
/agent-rules              # Align all agents
/agent-rules --check      # Verify
/agent-rules --status     # Show status
```

## Architecture

```
AGENTS.md                 ← Edit rules here
.agents/skills/           ← Edit skills here (SOURCE)

↓ Symlinks ↓

CLAUDE.md → AGENTS.md
.github/copilot-instructions.md → ../AGENTS.md
.cursor/rules/main.md → ../../AGENTS.md
.gemini/GEMINI.md → ../AGENTS.md
.kiro/steering/main.md → ../../AGENTS.md

.claude/skills/ → ../.agents/skills
.github/skills/ → ../.agents/skills
.kiro/skills/ → ../.agents/skills
.codex/skills/ → ../.agents/skills
```

## Supported Agents

- OpenAI Codex (uses `AGENTS.md`)
- Claude Code (uses `CLAUDE.md` → `AGENTS.md`)
- GitHub Copilot (uses `.github/copilot-instructions.md` → `AGENTS.md`)
- Kiro CLI (uses `.kiro/steering/main.md` → `AGENTS.md`)
- Cursor IDE (uses `.cursor/rules/main.md` → `AGENTS.md`)
- Gemini CLI (uses `.gemini/GEMINI.md` → `AGENTS.md`)

## Rules

1. ✅ Edit `AGENTS.md` for rules
2. ✅ Edit `.agents/skills/` for skills
3. ❌ Never edit symlinked files
4. ❌ Never copy files

## MCP Configs

**NOT symlinked** - each agent has its own:
- `.claude/mcp.json`
- `.kiro/mcp.json`
- `.cursor/mcp.json`
- `.codex/config.toml`

Sync manually if needed.

## Files

- `SKILL.md` - Full documentation
- `scripts/` - Alignment scripts
