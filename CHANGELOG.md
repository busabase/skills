# Changelog

## Unreleased

- WorkBuddy connector: new [`workbuddy/`](./workbuddy/) package for the WorkBuddy Connector
  marketplace (`connector-meta.json` 1.1.1 — 1.1.0 was already taken by an earlier submission — with `auth_mode: "server-side"` and `server_auth`
  `mcp_oauth` dynamic registration, `mcp.json`, icon). Its `busabase` skill is generated from the
  same body as the Claude Code and Codex plugin skills, and adds the authorization scope, expiry and
  common-error notes WorkBuddy's review asks for. `validate-agent-plugin.mjs` now pins the
  server-side declaration and the single hosted MCP server.

- `busabase-app-creator`: references to the companion `busabase` skill no longer assume it
  sits in a sibling directory, so an alias installed on its own still knows where to get it.
  AirApp websites: deploy a preview and go live yourself (`airapps site-deploy-preview` /
  `site-go-live`, with the person's permission), and bind custom domains
  (`airapps site-bind-domain`, `site-domains`).

- `busabase`: invite teammates on Cloud via `busabase-cli members …` / MCP `members_*` —
  confirm addresses before sending mail, share invite links when there are none, and fall
  back to Space Settings → Members on older or open-source servers.
- `busabase` / plugin guides: treat a successful write response as the landed result
  (`materialized` / CR `status`) instead of always reading back; fetch only when the
  response is missing needed data or the outcome is uncertain.
- `busabase-app-creator`: AirApp template desktop sidebar collapses to a narrow rail and
  expands again (ported from public skills #31).
- Bump the Claude Code plugin to `0.4.9` and the Codex plugin to `0.3.11`.

- `busabase-app-creator`: scaffold a read-only Website Worker with blueprint-scoped reads,
  field filtering, a read-only browser provider, and Worker source checks. Explain engine
  selection, deployment access, and when to choose the Node/Worker starter.
- `busabase`: document welcome-page configuration and permission-aware Workflow operations.
  Both MCP plugin guides explain setting a welcome page only at the user's request.
- Bump the Claude Code plugin to `0.4.8` and the Codex plugin to `0.3.10`.

- `busabase`: when a document is attached to a record, extract its text and hand it back with
  `assets put-text`, so `grep` and search can find the wording. The CLI cookbook now gives the order
  (write the record first, then supply the text), what each key level may do (a changeRequest or
  read key is refused), how `--none` moves a scanned file from `missing` to `unsearchable`, why
  `--sources records` and `--drive-path` cannot see attachment text, and how to get from a hit back
  to its record with `assets get` and `records get`.
- `busabase`: read the selected space's global instructions at the start of each task, before
  searching playbooks (MCP `space_instructions_get`, CLI `busabase-cli space-instructions get`, or
  HTTP `GET /api/v1/space-instructions`). They carry the team's vision, mission, values and design
  style, and never grant permissions.
- `busabase`: a Busabase URL in a message is a locator, not a page to open. The agent reads what it
  points at through Busabase, and a new `read-a-url` reference lists every path shape, how a slug
  becomes a space id, and how to treat another deployment and read-only embed links.
- `dsh-plugin/`: track `@busabase/dsh-plugin` 0.1.23, whose system prompt opens with the new category
  line, which bundles the latest skills (attachment text, space instructions, URL locator), and which
  is built against `busabase-sdk` 1.0.0.
- Bump the Claude Code plugin to `0.4.7` and the Codex plugin to `0.3.9`, which both bundle the
  updated `busabase` skill.

- `busabase`: request 24-hour read-only links for chat results, honor explicit durations up to
  seven days when supported, and display the expiry returned by the server alongside the signed-in
  dashboard link. CLI, HTTP, and SDK examples now pass the duration explicitly.

- Describe Busabase as the open-source database and workspace for AI agents in the `busabase` skill,
  the plugin and marketplace manifests, and the READMEs. The old "approval-first knowledge base" line
  read as if every write waited for review; a write now lands at once with write access and waits for
  a person's review otherwise, and the text says so.
- Bump the Claude Code plugin to `0.4.6` and the Codex plugin to `0.3.8`.

- `busabase-app-creator`: a new app takes its runtime probe, its record helpers (read a page, find,
  create, update, upsert) and its "saved or waiting for review" outcome and sentence from
  `busabase-sdk/airapp` (busabase-sdk 0.99.0 or newer) instead of carrying a private copy of each.
  The scaffold refuses an older SDK, renders a blueprint action of kind `change_request` as a small
  form on the open record, and checks that no app forces review on a person's own write
  (`airapp/forced-review`; `npx --yes busabase-cli@latest check` applies the same rule).
- `busabase-app-creator`: a Python app now gets its browser bundles built when it is scaffolded. It used
  to open as a blank preview because nothing could produce them, and its fixed port 3000 stopped a
  second Python app from starting.
- `busabase-template-creator`: a template can show up to three clips (`template.videos`), each with an
  optional title, ahead of the screenshots.
- Bump the Claude Code plugin to `0.4.5` and the Codex plugin to `0.3.7`, which both bundle the
  updated `busabase-app-creator`.

- `dsh-plugin/`: track `@busabase/dsh-plugin` 0.1.20, which installs on DeepSeek Harness 0.2.1 (its peers
  no longer pin 0.2.0-rc.2) and drops 18 runtime dependencies nothing imports.
- `dsh-plugin/`: track `@busabase/dsh-plugin` 0.1.19, which bundles the skills at `91201e4`, so
  DeepSeek Harness agents also run `npx --yes busabase-cli@latest`. The manifest now declares the
  rendering libraries the plugin's UI imports as runtime dependencies.
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

## Agent shelf — 2026-11-14

### Your agent can now install Busabase itself — and run it, too

One command — `npx skills add busabase/skills` — now installs every Busabase skill.
Until this release it did not: three of the creator entry points in this repository were
symlinks, and the `skills` CLI does not follow symlinks when it discovers skills, so only
3 of the skills on the shelf could be found and installed. The skills existed the whole
time; they were simply invisible from the customer's side of the counter. The entry points
are now published as full copies — each one the complete skill under its task name,
regenerated from the single source on every sync, so a copy can never drift from the
original.

New on the shelf: **`busabase-ops`**, the operator's edition of the `busabase` skill — the
playbook for agents that run a workspace day to day: read the schema and the records you
will touch before you write, dedupe before you create, file attachments so their text is
searchable, and verify by reading back what actually landed. The `busabase` skill itself
gains the same discipline as a new "Running a workspace day to day" section.

Connecting over MCP no longer starts with pasting an API key: the hosted MCP server at
`https://busabase.com/api/mcp` signs in with browser OAuth, and the docs now lead with
that; a Bearer key remains available for headless setups.

The shelf has a storefront, too. busabase.com now carries an agent-install section on the
homepage and a full guide at [busabase.com/agents](https://busabase.com/agents), and the
agent directory's detail pages show the same one-line install command next to each
agent's connection steps.

The seven skills:

- `busabase` — drive a Busabase workspace over HTTP: list Bases/records, propose
  ChangeRequests, and merge approved ones. The full CLI / API / MCP reference.
- `busabase-ops` — operate a workspace day to day, with read-before-write discipline. A
  full copy of `busabase` under the operator's name.
- `busabase-app-creator` — turn a product idea into a complete Busabase workspace app
  with native resources, bounded data access, and a reviewable AirApp.
- `busabase-template-creator` — author and publish templates to the public
  `busabase/templates` catalog, layered on the app-creator contract.
- `busabase-app-package-creator` — package an existing AirApp into an installable
  package. A full copy of `busabase-app-creator` under its task name.
- `busabase-package-creator` — author a Busabase package (manifest, contents,
  versioning). A full copy of `busabase-app-creator` under its task name.
- `busabase-skill-creator` — create a Busabase Skill and package it for installation. A
  full copy of `busabase-app-creator` under its task name.

Details, as recorded when the work landed:

- Shelf discoverability: the three creator aliases (`busabase-app-package-creator`,
  `busabase-package-creator`, `busabase-skill-creator`) are now full copies of
  `busabase-app-creator` instead of symlinks — the `skills` CLI and skills.sh do not follow
  symlinks, so only 3 of the skills were installable/listed. Each copy is the complete skill
  under a task name; only its `name` and `description` differ, and every copy is regenerated
  from the one source on each sync. New `busabase-ops`: a full copy of `busabase` under the
  operator's name. README: skills table now lists all seven skills; the generic MCP section
  leads with OAuth sign-in (no API key to paste), with Bearer keys as the headless alternative.
- `busabase`: new "Running a workspace day to day" section — read the schema and the records
  you will touch first, dedupe before create, cover the whole set in bulk work, a file is
  filed only when `grep` finds its text, no silent deletes, report partial as partial.

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
