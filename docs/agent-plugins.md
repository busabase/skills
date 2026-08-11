# Agent Plugins v1 compatibility

Busabase publishes a portable package that follows the [Agent Plugins Specification v1.0.0](https://agent-plugins.org/specification), currently a Working Draft.

## Portable package

The repository root is the portable plugin root:

```text
plugin.json                         Agent Plugins manifest
mcp.json                            portable Streamable HTTP MCP profile
skills/busabase/SKILL.md            portable Agent Skill
skills/busabase-app-creator/        portable Agent Skill and supporting files
```

The manifest uses the canonical `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` identifier and only the closed set of fields permitted by v1. The MCP profile uses the matching `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` identifier and declares the hosted endpoint with the standard `streamable-http` transport name.

Agent Plugins v1 does not define portable OAuth or credential-reference fields. Authentication for `https://busabase.com/api/mcp` remains client-managed. Clients that support MCP OAuth discovery can authenticate interactively; other clients may need their own credential configuration.

## Existing client packages

The portable files are additive. They do not replace or redirect the established client packages:

| Client | Manifest | MCP configuration | Behavior retained |
| --- | --- | --- | --- |
| Claude Code | `claude/.claude-plugin/plugin.json` | `claude/.mcp.json` | Hosted MCP, browser OAuth, Claude server namespace, Claude-specific skill guidance |
| Codex | `plugins/busabase/.codex-plugin/plugin.json` | `plugins/busabase/.mcp.json` | Hosted MCP, browser OAuth, curated tools, Codex interface metadata and assets |
| General MCP clients | n/a | `.mcp.json` | Local Busabase Desktop endpoint at `http://localhost:15419/api/mcp` |

Client-only manifests may contain fields that are not allowed in the portable root `plugin.json`. Keeping them in their existing package roots avoids mixing vendor-specific behavior into the closed Agent Plugins manifest.

## Validation

Run the dependency-free repository check:

```bash
node scripts/validate-agent-plugin.mjs
```

It validates the pinned Agent Plugins manifest and MCP rules, the immediate-child Agent Skill layout and frontmatter, and the paths and endpoints required by the existing Claude Code and Codex packages. The GitHub Actions workflow runs the same check on pushes and pull requests.

When Agent Plugins publishes a version newer than v1.0.0, re-check the canonical schema identifiers and closed field sets before changing either portable file.
