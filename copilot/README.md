# Busabase for GitHub Copilot CLI

A Copilot CLI plugin with a Busabase workspace skill and an OAuth remote MCP connection. It uses
Agent Plugins 1.0 (`plugin.json`, `mcp.json`, and `skills/busabase/SKILL.md`).

The repository provides Copilot's marketplace descriptor at `.github/plugin/marketplace.json`.
Once this change reaches the public default branch, use the marketplace lifecycle:

```sh
copilot plugin marketplace add busabase/skills
copilot plugin install busabase@busabase
copilot plugin list --json
copilot plugin marketplace update busabase
copilot plugin update busabase@busabase
```

For a checked-out repository, add its root as the marketplace instead:

```sh
copilot plugin marketplace add /absolute/path/to/skills
copilot plugin install busabase@busabase
```

The market entry resolves `./copilot`. Local marketplaces load that directory live; changes apply
to the next session without a cached copy. Git marketplace updates refresh their remote source.
The separate Claude marketplace remains available for compatible clients such as Junie.

Open `/mcp` and authorize Busabase; `/mcp auth busabase` starts a fresh browser OAuth flow. Ask
Copilot to verify the connection and list accessible workspaces. Organization policies may restrict
marketplace sources. CLI 1.0.112 deprecates direct repo/URL/local plugin installs, so use the market.

Agent Plugins and marketplace schemas pass. CLI 1.0.112 passed isolated marketplace registration,
installation, listing, update and MCP configuration lookup. Its live Skill path and bytes match
this Copilot package. OAuth and workspace actions still need a connected session. Testing used
temporary `COPILOT_HOME` and `COPILOT_CACHE_HOME`; runtime-only loading can also use `--plugin-dir`
with `COPILOT_PLUGIN_DIR_ONLY=true`. No external catalog submission was performed.

References: [plugin and marketplace reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference),
[OAuth commands](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference),
[isolated plugin directories](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/plugin-directories).
