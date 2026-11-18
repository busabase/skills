# Busabase for Antigravity

This native Antigravity plugin bundles the Busabase MCP connection and shared Busabase skill.
Its root contains `plugin.json`, `mcp_config.json`, `skills/busabase/SKILL.md`, and a bundled logo.
The server uses standard MCP OAuth discovery without a static client, API key, or secret in the
package. Installation alone does not authorize workspace access.

From a checkout of this repository, validate and install this directory:

```sh
agy plugin validate --strict ./antigravity
agy plugin install ./antigravity
agy plugin list --json
```

For a release archive, extract it and pass the extracted directory to these commands. Start a fresh
Antigravity session, inspect `/plugin` and `/mcp`, and complete the supported browser sign-in flow.
Authorize the intended Busabase account. The plugin's server is namespaced as `busabase_busabase`.
Ask the agent to use Busabase for a workspace task; the skill verifies the connection and reads the
workspace's instructions before acting. Writes follow the selected connection's permissions and
can wait for review.

To load the plugin only within a project, place this plugin directory under that project's
`.agents/plugins/busabase/`. `agy plugin install` uses the global plugin directory
`~/.gemini/config/plugins/`. Manage the installation with `agy plugin enable busabase`,
`agy plugin disable busabase`, and `agy plugin uninstall busabase`.

To refresh a local installation, update the checkout with `git pull --ff-only` or replace the extracted
release directory, uninstall the old local plugin, and install the updated directory again. Restart
the session afterward.

## Gemini CLI migration

Gemini CLI extensions have a different manifest and MCP configuration format. Antigravity's
documented `agy plugin import gemini` migrates existing Gemini extensions and converts their
configuration. This package provides Antigravity's native layout directly; installing the `gemini/`
directory unchanged is not a substitute.

## Marketplace distribution

A dedicated public repository can put this directory's contents at its root for
`agy plugin install <repository-url>`. The official Marketplace requires a complete manifest,
README, bundled logo, and successful local validation before submission through the
[partner intake form](https://forms.gle/2EX5RFYPoJe1UgxR9). A local install or validation does not
demonstrate Marketplace listing. This package does not submit to the Marketplace.

References: [plugin installation and management](https://antigravity.google/docs/plugins/),
[native schema and publishing](https://antigravity.google/docs/build-plugins),
[MCP and OAuth](https://antigravity.google/docs/mcp/), and
[Gemini CLI migration](https://antigravity.google/docs/cli/gcli-migration/).
