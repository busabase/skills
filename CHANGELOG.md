# Changelog

## Unreleased

- Run the CLI as `npx --yes busabase-cli@latest` everywhere the skills show a command. Plain
  `npx busabase-cli` reuses any `busabase-cli` it already finds (a global install, or a
  `node_modules` in a parent directory) without checking its version, so an agent could silently
  run an old CLI; `--yes` also keeps the first run from stopping at an install prompt.
- `busabase` skill: optionally send `x-busabase-agent` on writes so a change request records which
  agent client made it.
- `busabase-app-creator`: writes are permission-aware (omit `autoMerge`; they merge when the
  credential can and wait for review otherwise), with the user gating scope rather than each write;
  document what an attachment cell must contain; `records.listPage` takes `sort` directly instead
  of needing a sorted View.
- `busabase-template-creator`: each locale gets its own complete screenshot list under
  `template.locales`, never mixed into the default list.
- Bump the Claude Code plugin to `0.4.4` and the Codex plugin to `0.3.6`, which both bundle the
  updated `busabase-app-creator`.

- Teach the bundled Claude Code and Codex `busabase` skills to name the playbook they follow on
  every write (CLI `--playbook`, MCP `playbook` argument, `x-busabase-playbook` header) so the
  change request records it, and to check `change_request_query` with `affectsNodeId` for
  unfinished work on a resource before proposing a change to it. Bump the Claude Code plugin to
  `0.4.3` and the Codex plugin to `0.3.5`.
- `busabase` skill: look for a playbook before every task; custom prompts carry only the task,
  because Busabase now opens every prompt with the line naming its node, so `{target}` is no longer
  written; skill nodes always get custom prompts.
- `busabase-app-creator`: AirApps default to a full-width table with a separate detail page,
  metrics move to an overview page, and the detail page follows one of three layouts chosen by the
  kind of business.
- `dsh-plugin`: open Cloud previews in the Desktop browser, compose the Inspector inside the
  sidebar tabs, and load Cloud configuration before registering tools.
- Fix nine MCP tool names in the bundled Claude Code and Codex `busabase` skills that the hosted
  server does not publish (`records_search`, `docs_read_lines`, `change_requests_review`, …), so
  an agent's first call no longer fails. Bump the Claude Code plugin to `0.4.2` and the Codex plugin
  to `0.3.4`.
- Teach the bundled Claude Code and Codex `busabase` skills to look for a playbook first: on every
  instruction, call `playbooks_search` with a few phrasings of the user's intent, then
  `playbooks_get` the skill or custom prompt that fits and follow it. Bump the Claude Code plugin to
  `0.4.1` and the Codex plugin to `0.3.3` so cached installs pick the guidance up.
- Fail validation if either bundled skill drops the playbook-first rule.
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
- Update the app creator skill with local real-data proxying and continuous AirApp
  maintenance.
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
- Refresh the `busabase` skill.

## 0.2.1 - 2026-07-22

- Document the explicit `codex mcp login busabase` step after plugin installation.
- Add recovery checks for the `Not logged in` state and stale task tool catalogs.

## 0.2.0 - 2026-07-22

- Bundle the hosted Busabase MCP profile in the Codex plugin.
- Use browser-based OAuth instead of local API-key configuration.
- Add MCP-first skill guidance for the curated 22-tool catalog.
- Add complete marketplace metadata, starter prompts, legal links, and brand assets.
- Document the OpenAI Plugin Directory submission and reviewer test matrix.
