# Busabase Skills & Plugins

Agent Skills + plugins for [Busabase](https://busabase.com) — the approval-first knowledge base
where AI proposes changes, a human reviews them, and only approved changes get merged.

One skill, four ways to install it — pick whatever your agent supports.

## Install

### `skills` (Claude Code, Cursor, Codex, … — evergreen)

```bash
npx skills add busabase/skills
```

### Claude Code plugin

```bash
/plugin marketplace add busabase/skills
/plugin install busabase@busabase
```

### Codex plugin

```bash
codex plugin marketplace add busabase/skills
codex plugin add busabase@busabase
```

The Codex plugin connects to `https://busabase.com/api/mcp/plugin`, opens the standard browser OAuth
flow, and exposes a focused 22-tool catalog. No API key setup is required.

### MCP (any MCP-capable agent)

Point your agent at your workspace's Streamable-HTTP endpoint:

- Desktop / local: `http://localhost:15419/api/mcp` (no auth)
- Cloud: `https://busabase.com/api/mcp` (send `Authorization: Bearer $BUSABASE_API_KEY`)

Codex can use the full Cloud MCP surface directly with standard OAuth:

```bash
codex mcp add busabase --url https://busabase.com/api/mcp
codex mcp login busabase
```

The root [`.mcp.json`](./.mcp.json) wires the local endpoint for general MCP clients. The Codex
plugin has its own remote [MCP configuration](./plugins/busabase/.mcp.json), which is bundled because
it lives inside the plugin directory.

The root **busabase** skill remains the full CLI/curl guide for local and general-purpose agent
installs. The Codex-bundled skill is intentionally MCP-first: it relies on OAuth and the curated tool
catalog instead of reading `~/.busabase/.env`.

To set up a workspace from scratch first, paste the onboarding prompt from your Busabase dashboard
(**Agent Skills** button) — it walks your agent through connecting, seeding a first Base, and then
running one of the install commands above.

## Skills

| Skill | What it does |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | Drive a Busabase workspace over HTTP: list Bases/records, propose ChangeRequests, and merge approved ones. |

## Repo layout

This one repo serves every install path above:

```
skills/busabase/SKILL.md              the skill (canonical) — used by `skills`, Claude Code, Buda
.claude-plugin/plugin.json            Claude Code plugin manifest (auto-discovers ./skills/)
.claude-plugin/marketplace.json       Claude Code marketplace listing
.agents/plugins/marketplace.json      Codex marketplace listing
plugins/busabase/.codex-plugin/plugin.json   Codex plugin manifest
plugins/busabase/.mcp.json                   hosted OAuth MCP profile for Codex
plugins/busabase/skills/busabase/SKILL.md    Codex needs the skill INSIDE the plugin dir
                                             (MCP-first guidance for the curated profile)
plugins/busabase/assets/                     icons and light/dark logos bundled with Codex
.mcp.json                             bundled MCP server (Streamable HTTP)
server.json                           official MCP Registry entry (remote → busabase.com/api/mcp)
```

> **Why a Codex-specific skill?** Codex only bundles files inside `plugins/<name>/`. The bundled
> skill also has a different connection contract: hosted OAuth and MCP tools instead of local shell
> configuration. Keep the approval and prompt-injection rules aligned across both skills, but do not
> copy CLI/API-key setup into the Codex plugin.

## Publish to the OpenAI Plugin Directory

The OpenAI Plugin Directory and the MCP Registry are separate release channels. Use
[`docs/openai-plugin-submission.md`](./docs/openai-plugin-submission.md) for the Platform submission,
domain verification, reviewer access, test prompts, and production smoke checks.

## Publish to the official MCP Registry

```bash
brew install mcp-publisher                       # or grab the binary from the registry releases
mcp-publisher login dns --domain busabase.com --private-key <KEY>   # verifies the com.busabase/* namespace
mcp-publisher publish                            # publishes server.json — live immediately, no review
```

Bump `version` in `server.json` only when publishing an MCP Registry update. Bump the Codex plugin
manifest independently for GitHub marketplace releases.
