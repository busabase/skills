# Busabase for Grok Build

Read and update the records, docs, files and skills your team shares in Busabase. The plugin
bundles the Busabase Skill and the hosted MCP connection at `https://busabase.com/api/mcp`.
Grok handles browser OAuth consent. No API key or other credential is included in this package.

## Install and use

Download and extract the Grok plugin archive. The extracted directory must contain
`.grok-plugin/plugin.json`, `.mcp.json` and `skills/busabase/SKILL.md` directly. Launch Grok with
that directory through the native installer:

```sh
grok plugin install /absolute/path/to/busabase-grok
grok
```

Open `/plugins` to inspect the enabled plugin and `/mcps` to inspect Busabase. Press `i` on its
server entry if it needs authorization, complete browser consent, then refresh. Ask Grok to call
`auth_verify`, select the intended workspace and list its Bases before requesting changes.
`grok inspect --json` shows the source of each discovered plugin and MCP server.

For updates, replace the complete extracted directory with a newer release, run
`grok plugin update busabase`, then start a new Grok session. Local installations are live links
to their source directory in the verified CLI version, so keep that directory available. Grok's
marketplace also supports installation/update management once the plugin has been listed; this
package does not claim an official listing.

## Verification and publishing

The package contains instructions and an HTTPS MCP declaration, with no hooks or executable
install scripts. Native parsing/loading and authenticated workspace acceptance are distinct
checks; OAuth consent and model-triggered tasks still require a signed-in Grok environment.

The Skill is generated from the shared Busabase plugin template and Grok-specific connection
fragments. Do not edit its generated copy. Official marketplace submissions use a PR to
`xai-org/plugin-marketplace`, a pinned public source commit and the repository's catalog/index
validators. Submitting or publishing is a separate action.

[Plugin documentation](https://docs.x.ai/build/features/skills-plugins-marketplaces) ·
[MCP and OAuth](https://docs.x.ai/build/features/mcp-servers) ·
[Marketplace contribution guide](https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md)
