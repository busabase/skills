# WorkBuddy connector

The Busabase connector package for the [WorkBuddy](https://open.workbuddy.cn/docs/connector)
Connector marketplace (Tencent). Unlike the Claude Code and Codex plugins, WorkBuddy does not
install from this repository: the package is zipped and submitted on the WorkBuddy open platform,
reviewed there, and published from its console.

| File | Purpose |
| --- | --- |
| `connector-meta.json` | Metadata, `auth_mode: "server-side"` and `server_auth` (`source` is `busabase`) |
| `mcp.json` | One Streamable HTTP server: `https://busabase.com/api/mcp` |
| `icon.svg` | Marketplace icon |
| `skills/busabase/SKILL.md` | The MCP-first `busabase` skill, **generated** — do not edit by hand |

## Authorization

The connector uses WorkBuddy's server-side OAuth with dynamic client registration:

```json
"server_auth": {
  "auth_type": "mcp_oauth",
  "data": { "mcp_oauth": { "server_url": "https://busabase.com/api/mcp", "scopes": "mcp" } }
}
```

WorkBuddy's cloud discovers the authorization server from the protected-resource metadata,
registers a client (`client_name: "WorkBuddy Connector"`, a generated HTTPS callback on a WorkBuddy
domain), opens the browser for consent, then exchanges and stores the tokens. busabase.com
implements this contract:

| Endpoint | Role |
| --- | --- |
| `GET /.well-known/oauth-protected-resource/api/mcp` | Protected-resource metadata (RFC 9728) |
| `GET /.well-known/oauth-authorization-server` | Authorization-server metadata (RFC 8414) |
| `POST /api/oauth/register` | Dynamic client registration (RFC 7591), public client |
| `GET /api/oauth/authorize` | Authorization with PKCE `S256` and explicit consent |
| `POST /api/oauth/token` | Code exchange and refresh |

Callbacks match exactly what the client registered, so no wildcard redirect allowlist is needed.
`server_auth` requires WorkBuddy 4.24.0, hence `minWorkbuddyVersion: "4.24.0"`.

Server-side OAuth is a Busabase Cloud feature. A self-hosted or open-source Busabase authenticates
MCP with API keys, so do not point this package at a self-hosted URL.

## Updating

1. The skill body is shared with the Claude Code and Codex plugin skills and is regenerated on every
   publish; propose wording changes upstream rather than editing `skills/busabase/SKILL.md`.
2. Bump `version` in `connector-meta.json` whenever anything in this directory changes, and note it
   in `CHANGELOG.md`.
3. After the change is merged, zip this directory and resubmit it on the WorkBuddy open platform.
   It goes live only after review passes and it is published from the console.
