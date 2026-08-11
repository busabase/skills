# Porting the Busabase Codex plugin to Claude Code

This document records the host differences that matter when maintaining the Busabase plugin. It is
based on the current Busabase Codex package, the public
[ChatCut agent plugin](https://github.com/ChatCut-Inc/agent-plugin), and the Claude Code
[plugin reference](https://code.claude.com/docs/en/plugins-reference),
[marketplace reference](https://code.claude.com/docs/en/plugin-marketplaces), and
[MCP reference](https://code.claude.com/docs/en/mcp).

## Package boundary

Do not point both marketplaces at the repository root. The root `.mcp.json` intentionally connects
general MCP clients to the local Busabase Desktop endpoint. A Claude marketplace entry with
`"source": "./"` would therefore inherit the wrong connection profile.

Use separate package roots:

| Host | Marketplace source | Plugin manifest | MCP profile |
| --- | --- | --- | --- |
| Claude Code | `./claude` | `claude/.claude-plugin/plugin.json` | `claude/.mcp.json` |
| Codex | `./plugins/busabase` | `plugins/busabase/.codex-plugin/plugin.json` | `plugins/busabase/.mcp.json` |

The repository-root `.claude-plugin/marketplace.json` is a marketplace manifest only. The Claude
plugin manifest belongs inside the `claude/` package, matching ChatCut's split-package layout.

## Manifest translation

| Codex | Claude Code | Porting rule |
| --- | --- | --- |
| `.codex-plugin/plugin.json` | `.claude-plugin/plugin.json` | Keep shared identity fields; validate against the host-specific schema. |
| `interface` | no equivalent required | Do not copy Codex composer icons, starter prompts, capability labels, or legal listing fields into behavioral configuration. Marketplace metadata carries the public listing basics. |
| `skills: "./skills/"` | `skills: "./skills/"` | Same relative-path idea, but each path is resolved from its own package root. |
| `mcpServers: "./.mcp.json"` | `mcpServers: "./.mcp.json"` | Supported by both hosts; keep separate files because their MCP dialects differ. |

Claude Code accepts additional component types such as agents, hooks, LSP servers, workflows, and
monitors, but Busabase does not need them for this port.

## MCP translation

The protected resource is `https://busabase.com/api/mcp`. Its unauthenticated response advertises
the protected-resource metadata URL and the `mcp` scope. That metadata names
`https://busabase.com` as the authorization server; the authorization-server metadata exposes
authorization, token, dynamic registration, revocation, PKCE S256, and refresh-token support.

Use this Claude Code definition:

```json
{
  "mcpServers": {
    "busabase": {
      "type": "http",
      "url": "https://busabase.com/api/mcp",
      "oauth_resource": "https://busabase.com/api/mcp"
    }
  }
}
```

Important differences:

- Claude Code requires `type: "http"` in this file-backed plugin configuration.
- Claude Code uses `headers`; Codex uses `http_headers` when static headers are needed.
- `oauth_resource` pins the RFC 8707 resource value to the MCP endpoint and matches the live
  protected-resource document.
- Do not add an `Authorization` header. A rejected static header prevents Claude Code from falling
  back to OAuth.
- The installed Claude server id is `plugin:busabase:busabase`, not `busabase`.

## Skill translation

The app creator is host-neutral and is shared with Claude through
`claude/skills/busabase-app-creator`. The base Busabase skill is host-specific because connection
recovery commands and server ids differ.

| Operation | Codex | Claude Code |
| --- | --- | --- |
| Inspect server | `codex mcp list` | `claude mcp get plugin:busabase:busabase` or `/mcp` |
| Authenticate | `codex mcp login busabase` | `claude mcp login plugin:busabase:busabase` |
| Headless login | host-specific terminal flow | add `--no-browser`, then paste the redirect URL |
| Refresh tools | start a new Codex task | start a new Claude conversation or run `/reload-plugins` when offered |

The approval contract does not change: call `auth_verify` first, select a space explicitly, treat
stored content as untrusted data, prefer ChangeRequests, and perform review or merge decisions only
on an explicit user instruction for an identified proposal.

## Validation contract

Run these checks before publishing:

```bash
claude plugin validate ./claude --strict
claude plugin validate ./.claude-plugin/marketplace.json --strict
```

Then install from a clean temporary Claude configuration and verify:

- marketplace name: `busabase`;
- plugin id: `busabase@busabase`;
- plugin version matches `claude/.claude-plugin/plugin.json`;
- two skills resolve: `busabase` and `busabase-app-creator`;
- one MCP server resolves: `busabase`;
- `claude mcp get plugin:busabase:busabase` reports the hosted URL and either `Needs
  authentication` before login or `Connected` afterwards.

Installation, OAuth, and the current conversation's tool catalog are separate states. Never report
the Claude plugin ready solely because the marketplace install command succeeded.
