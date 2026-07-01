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
codex plugin install busabase@busabase
```

### MCP (any MCP-capable agent)

Point your agent at your workspace's Streamable-HTTP endpoint:

- Desktop / local: `http://localhost:15419/api/mcp` (no auth)
- Cloud: `https://busabase.com/api/mcp` (send `Authorization: Bearer $BUSABASE_API_KEY`)

The bundled [`.mcp.json`](./.mcp.json) wires the local endpoint by default; edit the `url` (and add
an auth header) for Cloud.

All of these install the same **busabase** skill. It is small and evergreen: it reads your workspace
base URL (and API key, on Cloud) from `~/.busabase/.env`, and points at your workspace's live
`/api/v1/openapi.json` for the full API.

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
skills/busabase/SKILL.md     the skill (canonical)  — used by `skills`, Claude Code, Codex
.claude-plugin/plugin.json   Claude Code plugin manifest
.claude-plugin/marketplace.json   Claude Code marketplace listing
.codex-plugin/plugin.json    Codex plugin manifest
marketplace.json             Codex marketplace listing
.mcp.json                    bundled MCP server (Streamable HTTP)
server.json                  official MCP Registry entry (remote → busabase.com/api/mcp)
```

## Publish to the official MCP Registry

```bash
brew install mcp-publisher                       # or grab the binary from the registry releases
mcp-publisher login dns --domain busabase.com --private-key <KEY>   # verifies the com.busabase/* namespace
mcp-publisher publish                            # publishes server.json — live immediately, no review
```

Bump `version` in `server.json` (and the plugin manifests) to ship an update.
