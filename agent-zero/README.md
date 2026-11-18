# Busabase and Agent Zero: release preparation

Agent Zero has a native plugin format and Plugin Index, but index entries must point at a dedicated
public GitHub repository with `plugin.yaml` and `LICENSE` at its root. The shared `busabase/skills`
repository cannot supply an Agent Zero plugin by adding a subdirectory alone.

`submission.draft.json` contains the proposed runtime/index metadata and the remaining packaging
gates. It deliberately has no invented repository URL. A future dedicated plugin can bundle the
canonical CLI-oriented Busabase skill and its references; it must actually load under Agent Zero
and pass the official plugin review before submission. Installation/update use Agent Zero's Plugin
Hub, Git or ZIP flow; local third-party plugins live in `/a0/usr/plugins/`.

Meanwhile, use the existing Busabase setup skill through Agent Zero's permitted host tools. Follow
Busabase's CLI/device authorization and verify the selected workspace. Agent Zero also documents
remote MCP with bearer headers, but its public docs do not establish remote OAuth support; this
draft promises no automatic MCP authorization and includes no credential.

No Agent Zero instance was available for install/load testing. Creating the dedicated repository,
packaging, authenticated acceptance and an index PR remain pending; nothing was submitted.

Sources: [plugin index rules](https://github.com/agent0ai/a0-plugins),
[plugin lifecycle](https://github.com/agent0ai/agent-zero/blob/development/docs/developer/plugins.md),
[plugin contract](https://github.com/agent0ai/agent-zero/blob/development/plugins/AGENTS.md),
[installer lifecycle](https://github.com/agent0ai/agent-zero/blob/development/plugins/_plugin_installer/AGENTS.md),
[MCP setup](https://github.com/agent0ai/agent-zero/blob/development/docs/guides/mcp-setup.md).
