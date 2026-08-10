# Claude Code installation — Busabase

This guide installs the official Busabase plugin from:

```text
https://github.com/busabase/skills.git
```

The Claude Code package is isolated under `claude/`. It bundles two skills and a hosted HTTP MCP
profile in `claude/.mcp.json` for `https://busabase.com/api/mcp`; the repository-root `.mcp.json`
remains the local desktop profile for general MCP clients and is not part of the Claude marketplace
package.

## Requirements

- Claude Code 2.x with plugin marketplace support.
- Git available to the shell running Claude Code.
- A Busabase account with access to at least one space.

Verify the local tools:

```bash
claude --version
git --version
```

## Install

```bash
claude plugin marketplace add https://github.com/busabase/skills.git
claude plugin marketplace list
claude plugin install busabase@busabase
```

The marketplace name is `busabase`. If Claude reports that plugin changes require a reload, run
`/reload-plugins` in an interactive conversation or start a new conversation.

## Authenticate

Claude Code namespaces plugin MCP servers as `plugin:<plugin>:<server>`. For this plugin, run:

```bash
claude mcp login plugin:busabase:busabase
```

The command opens Busabase's browser OAuth flow. It uses the protected resource
`https://busabase.com/api/mcp` and requests the server-advertised `mcp` scope. Tokens are stored and
refreshed by Claude Code; do not create or paste a Busabase API key for this plugin.

If the command runs over SSH, use:

```bash
claude mcp login --no-browser plugin:busabase:busabase
```

Open the printed authorization URL locally. If the localhost redirect cannot complete, paste the
full callback URL from the browser address bar into Claude Code's terminal prompt.

## Verify

```bash
claude plugin validate ./claude --strict
claude plugin validate ./.claude-plugin/marketplace.json --strict
claude plugin details busabase@busabase
claude mcp get plugin:busabase:busabase
```

Expected plugin inventory:

- plugin name `busabase`, version `0.4.0`;
- two skills: `busabase` and `busabase-app-creator`;
- one HTTP MCP server named `busabase`;
- MCP URL `https://busabase.com/api/mcp`;
- authenticated server status after login.

In a new conversation, call `auth_verify` first. If it returns multiple spaces, select one
explicitly before any space-scoped operation. Do not treat installation alone as proof that OAuth
or the current conversation's tool catalog is ready.

## Update or remove

```bash
claude plugin marketplace update busabase
claude plugin update busabase@busabase
claude plugin uninstall busabase@busabase
```

Restart Claude Code or start a new conversation after an update so the refreshed manifest, skills,
and MCP catalog are loaded.
