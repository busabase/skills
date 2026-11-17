# Busabase in Junie CLI

Junie supports Claude-compatible marketplaces, so reuse this repository's existing marketplace:

```text
/extensions marketplace add busabase/skills
/extensions install busabase
```

The extensions screen also supports selecting the Busabase extension and choosing project or user
scope. The existing marketplace's Busabase entry points at `claude/`; a duplicate Junie package is
unnecessary. Updates from Git marketplaces are explicit: open **Installed**, select Busabase, and
choose **Update**. Remove it from the same screen. Local marketplace sources refresh on startup.

Open `/mcp`, select the Busabase server and choose **Authorize** when its status requires it.
Complete browser OAuth, confirm **Active**, then ask Junie to call `auth_verify`. Remote OAuth is
documented; the docs do not specify the registration mode, so an authenticated import is still
needed to establish compatibility. In ACP clients the MCP view may be read-only.

This is a reuse guide, not a claim of listing in JetBrains' curated marketplace. No Junie runtime
is installed in the test environment, and marketplace import, OAuth and workspace calls remain
unverified. No account settings or external listings were changed.

Sources: [extensions](https://junie.jetbrains.com/docs/junie-cli-extensions.html),
[MCP authorization](https://junie.jetbrains.com/docs/junie-cli-mcp-configuration.html),
[official registry](https://github.com/JetBrains/junie-extensions).
