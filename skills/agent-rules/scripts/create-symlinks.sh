#!/bin/bash
# Universal Agent Skills - Create Symlinks Script

echo "🔗 Creating Universal Agent Skills Symlinks"
echo "==========================================="
echo ""

create_symlink() {
    local target="$1"
    local link="$2"

    mkdir -p "$(dirname "$link")"
    rm -rf "$link"
    ln -s "$target" "$link"
}

# Create skills symlinks
echo "📦 Creating skills symlinks..."
create_symlink ../.agents/skills .claude/skills
create_symlink ../.agents/skills .github/skills
create_symlink ../.agents/skills .kiro/skills
create_symlink ../.agents/skills .codex/skills
echo "  ✓ .claude/skills → ../.agents/skills"
echo "  ✓ .github/skills → ../.agents/skills"
echo "  ✓ .kiro/skills → ../.agents/skills"
echo "  ✓ .codex/skills → ../.agents/skills"
echo ""

# Create instruction symlinks
echo "📝 Creating instruction symlinks..."
create_symlink AGENTS.md CLAUDE.md
create_symlink ../AGENTS.md .github/copilot-instructions.md
create_symlink ../../AGENTS.md .cursor/rules/main.md
create_symlink ../AGENTS.md .gemini/GEMINI.md
create_symlink ../../AGENTS.md .kiro/steering/main.md
echo "  ✓ CLAUDE.md → AGENTS.md"
echo "  ✓ .github/copilot-instructions.md → ../AGENTS.md"
echo "  ✓ .cursor/rules/main.md → ../../AGENTS.md"
echo "  ✓ .gemini/GEMINI.md → ../AGENTS.md"
echo "  ✓ .kiro/steering/main.md → ../../AGENTS.md"
echo ""

echo "==========================================="
echo "✅ All symlinks created successfully!"
echo ""
echo "Single Source of Truth:"
echo "  - Rules: AGENTS.md (project root)"
echo "  - Skills: .agents/skills/"
echo ""
echo "Run verification:"
echo "  bash .agents/skills/agent-rules/scripts/verify-architecture.sh"
echo ""
