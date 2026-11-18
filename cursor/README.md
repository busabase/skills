# Busabase for Cursor

Cursor supports the Agent Plugins standard. This package uses its root `plugin.json`, `mcp.json`,
and `skills/busabase/SKILL.md` layout to bundle the Busabase MCP connection and shared skill.
It contains no credential, shell command, or background installer.

From a checkout of this repository, load the plugin for a Cursor CLI session:

```sh
agent --plugin-dir ./cursor
```

For a release archive, extract it and pass the extracted directory to `--plugin-dir`. Loading is
session-scoped and does not publish or globally install the plugin. Complete Cursor's standard
MCP OAuth browser flow when requested and authorize the intended Busabase account. Cursor can
show plugin MCP servers with a prefix such as `plugin-busabase-busabase`; use the identifier shown
by Cursor when reconnecting. Installation alone does not authorize workspace access.

Ask Cursor to use Busabase for a workspace task. The skill verifies the connection and reads that
workspace's instructions before acting. Writes follow the selected connection's permissions and
can wait for review. In the IDE, manage installed plugins and MCP authorization in Customize.

For this local distribution, update the checkout with `git pull --ff-only` or replace the extracted
release directory, then start a fresh `agent --plugin-dir` session. Omit `--plugin-dir` to stop
loading this local plugin.

## Marketplace distribution

This repository includes `.cursor-plugin/marketplace.json` at its root. It selects only the
`cursor/` plugin directory, so Cursor does not load the other platforms' packages. After the
descriptor reaches the selected public branch, add this repository as a marketplace:

```sh
agent plugin marketplace add https://github.com/busabase/skills
agent plugin marketplace list
```

Install or enable Busabase from that marketplace in Cursor's Customize page. Refresh the repository
index with `agent plugin marketplace update https://github.com/busabase/skills`; repository indexing
and plugin installation remain separate actions.

The official Cursor Marketplace accepts a public Git repository link at
[cursor.com/marketplace/publish](https://cursor.com/marketplace/publish), followed by manual review.
This repository's descriptor resolves the Busabase entry to `cursor/plugin.json` and its bundled
Skill and MCP configuration. The existing Marketplace submission does not need to be repeated when
updating these repository files; a descriptor alone does not demonstrate approval or listing.

Cursor CLI provides `agent plugin marketplace add <git-url>`, `list`, and `update <name-or-url>` for
account marketplace management. These manage marketplace indexing; they do not submit a plugin
to Cursor's public Marketplace. This change does not submit or claim a Marketplace listing.

`--workspace <path>` selects a verification project. `CURSOR_CONFIG_DIR` is the documented override
for CLI configuration; it does not document relocation of all Cursor account state or MCP credentials,
so it alone is insufficient to promise complete account isolation.

References: [plugins](https://cursor.com/docs/plugins),
[plugin reference and submission](https://cursor.com/docs/reference/plugins),
[CLI parameters](https://cursor.com/docs/cli/reference/parameters), and
[CLI configuration](https://cursor.com/docs/cli/reference/configuration).
