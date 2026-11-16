# Busabase for Doubao Work

This native plugin bundles the remote Busabase MCP connection and the shared Busabase skill.
It uses standard MCP OAuth. The package contains no API key, client secret or authorization token.

## Package contents

```text
plugin.json
mcp.json
com.doubao/assets/plugin-icon.png
skills/busabase/SKILL.md
skills/busabase/assets/icon.png
```

`plugin.json` must be at the ZIP root. From this directory, create an archive containing
only these files:

```sh
zip ../busabase-doubao-plugin-1.0.0.zip plugin.json mcp.json \
  com.doubao/assets/plugin-icon.png skills/busabase/SKILL.md skills/busabase/assets/icon.png
```

Use the native plugin upload/import entry available to your Doubao Work account. Developer
submission and client import availability depend on the platform and account. Upload this
archive as a plugin. For a standalone skill entry, zip only the contents of `skills/busabase/`
so `SKILL.md` is at the root; that standalone archive does not install the MCP connection.

After installation, complete Busabase browser consent. Prefer Change Request access for tasks
that should wait for review. Ask the agent to call `auth_verify`, choose the intended workspace
when several are available, then list its Bases. Reconnect through Doubao if authorization expires;
never paste credentials into the conversation.

## Acceptance checklist

- Find customer records using the actual Base schema and share the record links.
- Read a team document and summarize its current content.
- Propose a follow-up record and state whether it applied or awaits review.
- Confirm a Change Request connection cannot merge, even if automatic merge is requested.
- Retry an uncertain write without creating duplicates.
- Reconnect an expired grant and select the correct workspace in a new conversation.

The files and OAuth/MCP protocol have automated coverage. Actual Doubao Work installation,
authorization, model-triggered tasks and marketplace approval require separate client/platform
verification; this source package does not assert those steps have passed.

## Maintainers

The skill is generated from a shared template. The native manifest version must match the
version submitted to Doubao. Rebuild the archive and resubmit when the package changes.

[Doubao plugin documentation](https://open.doubao.com/document/plugin-docs-center/getting-started/what-is-plugin)
