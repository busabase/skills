# Busabase Skills & Plugins

**English** | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md)

Agent Skills + plugins for [Busabase](https://busabase.com) — the approval-first knowledge base
where AI proposes changes, a human reviews them, and only approved changes get merged.

Two skills, five ways to install them — pick whatever your agent supports.

## Install

### `skills` (Claude Code, Cursor, Codex, … — evergreen)

```bash
npx skills add busabase/skills
```

### Agent Plugins v1 (portable package)

The repository root follows the [Agent Plugins Specification v1.0.0](https://agent-plugins.org/):
`plugin.json` is the portable manifest, `skills/` contains the Agent Skills, and `mcp.json`
declares the hosted Streamable HTTP MCP server. Install or load this repository root with any
client that supports the Agent Plugins format.

Agent Plugins v1 leaves OAuth and credentials to the client. Existing Claude Code and Codex
packages keep their dedicated browser-OAuth behavior. See
[`docs/agent-plugins.md`](./docs/agent-plugins.md) for the compatibility mapping and validation.

### Claude Code plugin

```bash
claude plugin marketplace add https://github.com/busabase/skills.git
claude plugin install busabase@busabase
claude mcp login plugin:busabase:busabase
```

The Claude Code plugin connects to `https://busabase.com/api/mcp` with browser OAuth. Claude
namespaces its bundled server as `plugin:busabase:busabase`. Start a new conversation after install
and login so the authenticated tool catalog is available. See
[`docs/claude-code-install.md`](./docs/claude-code-install.md) for the complete verification and
recovery flow.

Maintainers should also read
[`docs/codex-to-claude-code-port.md`](./docs/codex-to-claude-code-port.md) for the host-by-host
manifest, MCP, OAuth, skill, and validation differences.

### Codex plugin

```bash
codex plugin marketplace add busabase/skills
codex plugin add busabase@busabase
codex mcp login busabase
```

The Codex plugin connects to `https://busabase.com/api/mcp`, opens the standard browser OAuth
flow, and exposes a focused 22-tool catalog. No API key setup is required.

Plugin installation and MCP authorization are separate states. After the browser says
`Authentication complete`, verify the saved connection before starting a Busabase task:

```bash
codex mcp list
```

The `busabase` row should show `Auth` as `OAuth`. If it still shows `Not logged in`, run
`codex mcp login busabase` again and complete the newly opened browser tab while that command is
still running. Start a new Codex task after a successful login so the task loads the authenticated
tool catalog.

### MCP (any MCP-capable agent)

Point your agent at your workspace's Streamable-HTTP endpoint:

- Desktop / local: `http://localhost:15419/api/mcp` (no auth)
- Cloud: `https://busabase.com/api/mcp` (send `Authorization: Bearer $BUSABASE_API_KEY`)

Codex can use the full Cloud MCP surface directly with standard OAuth:

```bash
codex mcp add busabase --url https://busabase.com/api/mcp
codex mcp login busabase
```

The portable root [`mcp.json`](./mcp.json) declares the hosted endpoint using the Agent Plugins v1
format. The legacy root [`.mcp.json`](./.mcp.json) continues to wire the local endpoint for general
MCP clients. The Claude
package uses its own hosted OAuth [MCP configuration](./claude/.mcp.json). The Codex plugin has a
separate remote [MCP configuration](./plugins/busabase/.mcp.json).

The root **busabase** skill remains the full CLI/curl guide for local and general-purpose agent
installs. The Claude- and Codex-bundled skills are intentionally MCP-first: they rely on OAuth and
the curated tool catalog instead of reading `~/.busabase/.env`.

To set up a workspace from scratch first, paste the onboarding prompt from your Busabase dashboard
(**Agent Skills** button) — it walks your agent through connecting, seeding a first Base, and then
running one of the install commands above.

## Skills

| Skill | What it does |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | Drive a Busabase workspace over HTTP: list Bases/records, propose ChangeRequests, and merge approved ones. |
| [`busabase-app-creator`](./skills/busabase-app-creator/SKILL.md) | Turn a product idea into a complete Busabase workspace app with native resources, bounded data access, and a reviewable AirApp. |

## Repo layout

This one repo serves every install path above:

```
plugin.json                           Agent Plugins v1 portable manifest
mcp.json                              Agent Plugins v1 hosted MCP profile
skills/busabase/SKILL.md              canonical local/general-purpose skill
skills/busabase-app-creator/SKILL.md  guided Busabase workspace and AirApp creator
.claude-plugin/marketplace.json       Claude Code marketplace listing
claude/.claude-plugin/plugin.json     Claude Code plugin manifest
claude/.mcp.json                      hosted OAuth MCP profile for Claude Code
claude/skills/busabase/SKILL.md       Claude-specific MCP-first connection guidance
claude/skills/busabase-app-creator/   symlink to the shared app creator skill
.agents/plugins/marketplace.json      Codex marketplace listing
plugins/busabase/.codex-plugin/plugin.json   Codex plugin manifest
plugins/busabase/.mcp.json                   hosted OAuth MCP profile for Codex
plugins/busabase/skills/busabase/SKILL.md    Codex needs the skill INSIDE the plugin dir
                                             (MCP-first guidance for the curated profile)
plugins/busabase/skills/busabase-app-creator/SKILL.md
                                             app creator bundled beside its Busabase dependency
plugins/busabase/assets/                     icons and light/dark logos bundled with Codex
.mcp.json                             legacy/general-client local MCP profile
server.json                           official MCP Registry entry (remote → busabase.com/api/mcp)
scripts/validate-agent-plugin.mjs     portable and client-package conformance guard
```

> **Why host-specific Busabase skills?** The plugin packages use hosted OAuth and MCP tools instead
> of local shell configuration. Claude Code additionally namespaces the server as
> `plugin:busabase:busabase`, while Codex uses `busabase`. The shared `busabase-app-creator` skill
> delegates connection, API, and ChangeRequest behavior to the host-specific MCP-first dependency.

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
