# Using Busabase in Paseo

Paseo launches an installed coding agent and preserves that agent's skills, configuration, and MCP
servers. Connect Busabase in the provider that runs the task: use this repository's Claude Code,
Codex, Copilot CLI, Gemini CLI, or other matching package. Start a new Paseo task with that provider,
then ask it to verify the Busabase connection and list accessible workspaces.

No separate Paseo MCP plugin is provided. Paseo's native plugin format is a TypeScript extension
(`paseo-plugin.json` with client/server contributions) for daemon and interface features. It does not
make a provider's agent consume an MCP server by declaring a generic MCP file. Reusing the provider's
supported integration avoids a second connector that cannot actually serve the task's agent.

For example, install [the Copilot CLI plugin](../copilot/README.md) through Copilot before choosing
Copilot as the Paseo task provider. OAuth remains in that provider's own authorization flow. A task
that uses a different provider requires that provider's Busabase connection.

This is integration guidance, not an installable Paseo UI extension or registry submission. A
future Paseo workspace panel would need a distinct user-facing use case and its own implementation
and acceptance tests.

References: [provider configuration](https://paseo.sh/docs/providers),
[native plugin quickstart](https://paseo.sh/docs/plugins),
[official plugin directory](https://github.com/getpaseo/plugins).
