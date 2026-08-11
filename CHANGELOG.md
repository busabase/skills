# Changelog

## Unreleased

- Add an Agent Plugins v1.0.0 portable package at the repository root with canonical
  `plugin.json`, `mcp.json`, and existing `skills/` discovery.
- Preserve the dedicated Claude Code, Codex, and general-client MCP configurations unchanged.
- Add canonical schema, Agent Skill, client-compatibility, CI, and multilingual documentation
  coverage for the portable package.

## 0.4.0 - 2026-08-10

- Split the Claude Code distribution into a dedicated `claude/` plugin package, following the
  current marketplace package layout used by ChatCut.
- Connect Claude Code directly to the hosted Busabase MCP endpoint with browser OAuth and the
  plugin-scoped server id `plugin:busabase:busabase`.
- Add Claude-specific MCP-first guidance, strict manifest validation, and complete install, login,
  verification, update, and recovery documentation.
- Keep the root `.mcp.json` local profile and the Codex plugin package unchanged.

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
