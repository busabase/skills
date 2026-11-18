# Busabase for Kiro

A Kiro power containing the Busabase workspace skill and a remote MCP connection. It uses the
current Agent Plugins layout: `plugin.json`, `mcp.json`, and `skills/busabase/SKILL.md`.

Install with current Kiro CLI using `kiro-cli powers install /absolute/path/to/skills/kiro`, or open
**Powers → Add Custom Power → Import power from a folder** in the IDE and select this directory.
Once this package is available on the public repository's default branch, **Import power from
GitHub** can use `https://github.com/busabase/skills/tree/main/kiro`. For updates, open the power's
**Check for updates** action and select **Install updates**.

Complete the power's OAuth authorization for `https://busabase.com/api/mcp`, then ask Kiro to verify
the Busabase connection and list its accessible workspaces. Installation and authorization are
separate. Kiro namespaces and manages the power's MCP server; do not add a second user-level server.

The manifests pass Agent Plugins 1.0 schema validation. Kiro CLI 3.3.0 installed this package with
`KIRO_HOME` and `KIRO_RUNTIME_DIR` pointing to temporary directories; its registry and copied files
were checked. OAuth and workspace operations still need a connected Kiro session. This package has
not been submitted to the registry; a public GitHub source can be proposed through its submission form.

References: [authoring](https://kiro.dev/docs/powers/create/),
[installation and updates](https://kiro.dev/docs/powers/installation/),
[power OAuth](https://kiro.dev/docs/web/sandbox/mcp/),
[registry submission](https://kiro.dev/registry/submit/).

## Privacy and support

The hosted MCP service processes the Busabase workspace data that the connected user authorizes.
See the [Busabase Privacy Policy](https://busabase.com/privacy-policy) for its data practices.
The plugin does not bundle credentials; the host manages the OAuth connection.

For installation, package or connection problems, [open a support issue](https://github.com/busabase/skills/issues).
Do not include credentials or private workspace data in a public issue.
