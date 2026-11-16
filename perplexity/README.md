# Busabase for Perplexity Computer

An importable plugin with the Busabase workspace skill and an OAuth remote MCP connector. Its
archive root contains `plugin.json`, `mcp.json`, and `skills/busabase/SKILL.md`.

Create a ZIP containing this directory's contents, open **Plugins → Add custom → Upload plugin or
skill**, and upload it. After the source is on the public default branch, **Import plugin from
GitHub** can use `https://github.com/busabase/skills/tree/main/perplexity`.

Confirm that both Busabase components appear, connect the connector, and complete OAuth. Use
`https://busabase.com/api/mcp` with Streamable HTTP if adding it separately. Then ask Computer to
verify the connection and list accessible workspaces. A compatible Computer plan and organization
permission are required; connector policy can skip a connector while importing the plugin.

Update an uploaded plugin through **More actions → Replace file**. Manifest and ZIP checks are
available locally; live upload, OAuth, and workspace actions still require a Perplexity account.
There is no documented CLI publishing command. The public connector catalog has a separate partner
proposal process, which covers single-connector plugins and does not publish this bundle.

References: [plugin import and updates](https://www.perplexity.ai/help-center/en/articles/2026100802-create-or-upload-a-custom-plugin),
[remote connector OAuth](https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors),
[connector proposals](https://www.perplexity.ai/help-center/en/articles/2026092501-submit-a-connector-proposal).
