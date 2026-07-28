# Changelog

## 0.3.2 - 2026-07-28

- Replace the removed `createBusabaseRpcClient` AirApp runtime with
  `createBusabaseClient` against same-origin `/api/v1`.
- Sync the public app creator with the canonical kapps skill, including local
  real-data proxying and continuous AirApp maintenance.
- Refresh the bundled Codex skill and bump its version so existing `0.3.1`
  caches receive the corrected scaffold.
- Replace the plugin's raster artwork and green accent with Busabase's canonical
  light and dark SVG marks.

## 0.3.1 - 2026-07-27

- Move the bundled Codex MCP profile to the canonical `https://busabase.com/api/mcp` endpoint.
- Add complete Simplified Chinese, Traditional Chinese, and Japanese installation documentation.
- Add reciprocal language navigation across all README variants.

## 0.3.0 - 2026-07-27

- Add the public `busabase-app-creator` skill for guided workspace and AirApp creation.
- Bundle app creator in the Codex plugin beside its MCP-first `busabase` dependency.
- Document native Busabase resources, bounded reads, Vault requirements, and trusted execution boundaries.
- Refresh the public `busabase` skill from the kapps source of truth.

## 0.2.1 - 2026-07-22

- Document the explicit `codex mcp login busabase` step after plugin installation.
- Add recovery checks for the `Not logged in` state and stale task tool catalogs.

## 0.2.0 - 2026-07-22

- Bundle the hosted Busabase MCP profile in the Codex plugin.
- Use browser-based OAuth instead of local API-key configuration.
- Add MCP-first skill guidance for the curated 22-tool catalog.
- Add complete marketplace metadata, starter prompts, legal links, and brand assets.
- Document the OpenAI Plugin Directory submission and reviewer test matrix.
