# Busabase for Kimi

Use the records, docs, files and skills your team shares in Busabase from Kimi Code or Kimi Work.
The native `kimi.plugin.json` declares the workspace Skill and the HTTPS Busabase MCP server.
Authorization uses Kimi's browser OAuth flow; the package contains no credential.

## Kimi Code

Extract the archive, then run these slash commands in Kimi Code's chat:

```text
/plugins install /absolute/path/to/busabase-kimi
/reload
/plugins info busabase
/mcp
```

If Busabase needs authentication, use `/mcp-config login <server-name>` with the actual runtime
name shown in `/mcp`, then complete browser consent. Ask Kimi to call `auth_verify`, select the
intended workspace and list its Bases before making a change.

To update a local source, replace the extracted package and run `/plugins install` on that
absolute directory again, then `/reload`. Kimi copies local installs into its managed plugin
storage; editing only the original extracted files does not update an installed plugin.

## Kimi Work

Kimi Work follows the Kimi Code plugin definition. Give its built-in Plugin Builder this package
or the `kimi/` subdirectory of the Busabase skills repository and ask it to register the plugin
in your Personal marketplace. Install it with `+`, then complete any displayed connection flow.
The official creation guide accepts `kimi.plugin.json` sources. Work import and authorization
still require acceptance in an actual Kimi Work account.

## Verification and publishing

Native manifest parsing, Skill discovery and a local managed installation can be tested without
using model credits. Those checks do not prove browser OAuth consent or agent-triggered workspace
tasks. Review those separately in each host.

The Skill is generated from the shared Busabase plugin template and Kimi-specific fragments.
The official marketplace application starts from a tested personal plugin: open its detail
page, use the feedback envelope and choose the official marketplace publication request. No
public CLI marketplace-publish command is documented in these sources.

[Native plugin format and installation](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/plugins.html) ·
[MCP and OAuth](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html) ·
[Kimi Work plugin definition](https://www.kimi.com/en/help/plugins-and-skills/overview) ·
[Create a personal plugin](https://www.kimi.com/en/help/plugins-and-skills/create) ·
[Marketplace publication](https://www.kimi.com/en/help/plugins-and-skills/publish)
