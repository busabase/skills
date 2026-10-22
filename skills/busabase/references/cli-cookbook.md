# CLI / curl / OpenAPI cookbook

## 1. `busabase-cli` — ergonomic, best for the everyday loop

A typed Node client over the same REST API. It **auto-loads `~/.busabase/.env`** (and respects
`BUSABASE_BASE_URL` / `BUSABASE_API_KEY` exported in your shell, which override the file), so it
just works with no setup — you don't even need the `source` step (that's only for raw `curl`).
Keep the `@latest`: without it, npx runs any `busabase-cli` it already finds (a global install,
or a `node_modules` in a parent directory) without checking its version. `@latest` costs one
registry check per call; for a tight loop, `npm i -g busabase-cli@latest` once per session and
call plain `busabase-cli`:

```bash
npx --yes busabase-cli@latest whoami                  # active space + user
npx --yes busabase-cli@latest bases list              # the tables
npx --yes busabase-cli@latest records list --base-id <base-id> --limit 20 --output json
npx --yes busabase-cli@latest change-requests list \
  --status-json '["in_review","approved","conflict"]' --limit 20 --output json
npx --yes busabase-cli@latest change-requests list \
  --affects-node-id <node-id> \
  --status-json '["in_review","approved","conflict"]' --limit 1 --output json

# Which account / which space am I on? (offline — reads the stored config, no API call)
npx --yes busabase-cli@latest auth status             # accounts, grouped by host, * = active
npx --yes busabase-cli@latest space list              # spaces this credential can reach, * = targeted

# First, on every instruction: is there already a playbook (a skill or a custom prompt) for
# this job? Several phrasings, the user's language + English; nearest to --near-node-id first.
npx --yes busabase-cli@latest playbooks search --query "做周报" --query "weekly report" \
  --near-node-id <node-id> --output json
# → { items: [{ kind, nodeId, nodeName, path, key?, label?, name?, description?, matchedOn }],
#     total, truncated, coverage }   — truncated / "unsupported" coverage ≠ "none exist"
npx --yes busabase-cli@latest playbooks search --kinds skill --limit 20 --output json   # no --query = browse
npx --yes busabase-cli@latest playbooks get --kind prompt --node-id <node-id> --key <key>   # follow it
npx --yes busabase-cli@latest playbooks get --kind skill --node-id <node-id>                # SKILL.md + files

# Find where something lives before you act on it — one call searches files, Docs, Base
# records AND custom prompts (real line/column numbers, regex, honest per-source coverage).
# A file hit carries `owner` — the skill/drive it is in, with its folder path:
npx --yes busabase-cli@latest grep --pattern "Termination" --context-lines 2 --output json
# Scope to one source when you already know where to look (faster, narrower coverage report):
npx --yes busabase-cli@latest grep --pattern "ACME Corp" --sources records --base-slugs contracts
npx --yes busabase-cli@latest grep --pattern "weekly report" --flags i --sources prompts   # → nodeId, key, locale, field
# `truncated: true` → narrow instead of raising --max-matches: --sources first, then
# --base-slugs (records) or --drive-path (files).
# Files-only, with the fuller missing/stale/unsearchable file reporting — same engine, `grep`
# above composes this plus Docs plus records into one call:
npx --yes busabase-cli@latest assets grep --pattern "Termination" --drive-path contracts/
# Then read just the lines around a hit instead of the whole file/Doc:
npx --yes busabase-cli@latest assets read-lines --asset-id <asset-id> --start-line 118 --end-line 122
npx --yes busabase-cli@latest docs read-lines --node-id <node-id> --start-line 118 --end-line 122
# grep's `missing` names binary files (PDF/docx/images/…) with no extracted text yet — run your
# own extractor and hand the result back so they stop being invisible to search:
npx --yes busabase-cli@latest assets put-text --asset-id <asset-id> --file ./extracted.txt

# propose (server decides review-vs-merge for you) → read back:
npx --yes busabase-cli@latest bases create-change-request --base-id <id> \
  --fields-json '{"title":"…","body":"…"}' \
  --message "Add Acme Corp — qualified lead from the June webinar"
# Update many existing records in one atomic review. Each fields object is a
# partial patch; omitted keys stay unchanged and null clears a field.
npx --yes busabase-cli@latest records bulk-update-change-request --base-id <id> \
  --updates-json @updates.json \
  --message "Apply August content review decisions" --require-review
# If it comes back "in_review" (your key is changeRequest-level, or the human wants
# review), a human decides:
npx --yes busabase-cli@latest change-requests review --change-request-id <id> --verdict approved
npx --yes busabase-cli@latest change-requests merge  --change-request-id <id>

# structure creates (Base / folder / Doc / File / Skill) follow the same rule:
npx --yes busabase-cli@latest nodes create-change-request --type folder \
  --name "客户关系管理 CRM" \
  --message "Create CRM folder"
# ...same conditional review step as above if it comes back "in_review".

# Base detail accepts either stable id or slug (use exactly one):
npx --yes busabase-cli@latest bases get --base-id <base-id> --output json
npx --yes busabase-cli@latest bases get --slug <base-slug> --output json

# Change a node's human-facing description through a permission-aware ChangeRequest:
npx --yes busabase-cli@latest nodes update-description --node-id <node-id> \
  --description "Budget, creator roster and delivery history" \
  --message "Clarify the influencer workspace purpose"

# A View update changes only the supplied config keys. This keeps existing
# filters/sorts/widths when adding a visible column; pass `sorts: []` to clear
# the sort intentionally. Read the resulting View back after the CR lands.
npx --yes busabase-cli@latest views change-request --action update --view-id <view-id> \
  --patch-json '{"config":{"visibleFieldSlugs":["title","campaign","date"]}}' \
  --message "Show Campaign on the Activity table"

# The raw API helper accepts either a path below /api/v1 or a full API path:
npx --yes busabase-cli@latest api --method get --path /bases
npx --yes busabase-cli@latest api --method get --path /api/v1/bases

# Force review even though your key could write directly — e.g. the change is risky, or
# the human asked for a second pair of eyes:
npx --yes busabase-cli@latest bases create --slug campaigns --name "Campaigns" --require-review

# asset-backed attachment fields:
npx --yes busabase-cli@latest bases create-field --base-id <base-id> \
  --slug cover_image \
  --name "封面 Cover Image" \
  --field-type attachment \
  --max-files 1 \
  --allowed-mime image/png \
  --allowed-mime image/svg+xml

npx --yes busabase-cli@latest assets upload --file ./cover.svg --context record-field --output json
# Put the JSON output directly into an attachment field array:
# {"cover_image":[{"id":"...","assetId":"...","attachmentId":"...","url":"...","fileName":"cover.svg","mimeType":"image/svg+xml","size":1234}]}

# clean up a bad proposal without merging:
npx --yes busabase-cli@latest change-requests close --change-request-id <id> --reason "Wrong folder"
```

The CLI covers common structure cases; for multi-operation edits (e.g. create a folder AND fill
it in one CR) use curl with an `operations` array. Each op is discriminated on `kind`
(create | rename | move | delete | restore), and a create op can declare a temporary `ref` that
later ops target via `parentNodeRef`. Omit `autoMerge` here too — add `"autoMerge": false` only
to force review on this batch regardless of permission.

```bash
curl -X POST "$BUSABASE_BASE_URL/api/v1/nodes/change-requests" \
  -H "Authorization: Bearer $BUSABASE_API_KEY" -H "x-busabase-space: $BUSABASE_SPACE_ID" \
  -H 'content-type: application/json' \
  --data '{ "message": "Set up the Growth workspace", "submittedBy": "agent",
            "operations": [
              { "kind": "create", "ref": "growth", "nodeType": "folder", "slug": "growth", "name": "Growth" },
              { "kind": "create", "parentNodeRef": "growth", "nodeType": "base", "slug": "campaigns", "name": "Campaigns",
                "fields": [{ "slug": "title", "name": "Title", "type": "text", "required": true }] },
              { "kind": "move", "nodeId": "<existing-node-id>", "parentNodeRef": "growth" }
            ] }'
```

### Scenario prompts on a node you created

`nodes create` takes the list inline; `nodes set-agent-prompts` sets or replaces it later. Both
validate the file against the same schema BEFORE any request goes out, entry by entry, so a
malformed list never reaches the network.

```bash
cat > prompts.json <<'JSON'
[
  { "key": "log-visit", "label": "Log a customer visit",
    "body": "Add a visit record with the date I give, the contact I name, and a one-line summary." },
  { "key": "quarter-recap", "intent": "read-only", "label": "What did we discuss this quarter",
    "body": "Summarize every visit to the account I name since the quarter started." }
]
JSON

npx --yes busabase-cli@latest nodes create --type base --slug visits --name "Visits" \
  --field title:Title:text --field account:Account:text --agent-prompts-json @prompts.json

npx --yes busabase-cli@latest nodes set-agent-prompts --node-id <nodeId> --file prompts.json
```

Limits: 50 prompts per node, 80 chars per localized `label`, 8 KiB per localized `body`. `label`
and `body` each accept a plain string or an i18n object (`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`,
`fr`, `es`, `pt` — any other key fails validation).

Two things that bite:

- **The list is APPENDED after the node type's built-in scenarios**, which always stay.
  `set-agent-prompts` replaces the whole *custom* list (not a merge); it never touches the
  built-ins. So a generic line only repeats a default — and becomes a vague playbook the next
  agent's `playbooks search` matches on. Write the person's specific jobs, or none.
- **Prompts are addressed by node id**, which does not exist until the node does. A review-first
  create returns a pending ChangeRequest, so `nodes create` reports
  `agentPromptsWrite: { written: false, … }` and writes nothing — finish the job with
  `set-agent-prompts` once a human merges the CR. Reading that field is how you know which
  happened; do not assume the prompts landed.

From code, the same two steps: `client.nodes.updateAgentPrompts({ nodeId, agentPrompts })` after
whichever create you called (`bases.create`, `docs.create`, `fileTrees.create`, …). Over MCP it
is the `node_create` tool's `agentPrompts` argument, or the `nodes.updateAgentPrompts` tool.

### Preview a write before you send it

Any write command takes `--dry-run`: it prints the exact request it would send and sends nothing.
Reads still run, so what you see is the fully-resolved plan, not a template. Read-only commands do
not offer the flag — there would be nothing to suppress.

```bash
npx --yes busabase-cli@latest bases create-change-request --base-id <id> --fields-json @fields.json --dry-run
npx --yes busabase-cli@latest api --method post --path /api/v1/nodes --body-json '{...}' --dry-run
```

### When a 403 says you lack permission

The error envelope's `hint` names the endpoint and the API-key level it needs, read from the same
policy the server enforces. `busabase-cli schema <id>` shows that level too. Levels are ordered
`read` < `changeRequest` < `write` < `manage`; a `changeRequest` key can propose but deliberately
cannot merge its own proposal, which is the approval model working as designed, not a bug to
route around.

Run `npx --yes busabase-cli@latest --help` for the full command list; add `--output json` to parse results.
For record listing, keep `--limit` at `100` or below and use `nextCursor` with `--cursor` for
additional pages.

### Checking whether unfinished CRs affect one resource

First inspect the live `/api/v1/openapi.json`. If `GET /change-requests` advertises
`affectsNodeId`, use the exact `--affects-node-id ... --limit 1` query above; an empty result is
conclusive and avoids hydrating unrelated CRs. Do not infer support from the installed CLI or
trust an unknown query parameter: older deployments may ignore it. When the live API lacks the
filter, fall back to the bounded `change-requests list --status-json ... --limit 20` form and
filter locally. `list` is cursor-paginated via `nextCursor`; follow at most five pages, then
report the check as inconclusive instead of assuming absence. (`change-requests list-page` is
the numbered-page endpoint and is not the fallback loop.) `affectsNodeId` exists on `list` and
`list-page` only — the dashboard's inbox snapshot carries whole-space tab badges and takes no
resource filter, so never route a node-scoped check through it. A full unbounded CR listing can
return large nested file trees and should be used only when that complete payload is actually
required.

## 2. `curl` — quick, zero install

```bash
curl "$BUSABASE_BASE_URL/api/v1/bases"            # tables in this workspace
curl "$BUSABASE_BASE_URL/api/v1/change-requests"  # the review queue
curl "$BUSABASE_BASE_URL/api/v1/records/paged?baseId=<base-id>&limit=100"  # merged canonical records
```

On Cloud, add `-H "Authorization: Bearer $BUSABASE_API_KEY"` and
`-H "x-busabase-space: $BUSABASE_SPACE_ID"` to every call.

## 3. OpenAPI / MCP — the complete, current surface

Don't memorise the API — read it live when you need an exact payload, endpoint, or the revision
loop. This is the authoritative source as the API evolves:

```bash
curl "$BUSABASE_BASE_URL/api/v1/openapi.json"   # machine-readable — the WHOLE surface, ~936 KB
# or browse the interactive docs at $BUSABASE_BASE_URL/api/v1/doc
```

**For one endpoint, don't fetch that document — ask the CLI.** `busabase-cli schema` reads the
contract compiled into the CLI, so it works offline, needs no credential, and returns only what you
asked for. Reading one endpoint's arguments out of `openapi.json` costs roughly 234k tokens (every
type is inlined per endpoint, with no shared component schemas); `schema` costs a few KB.

```bash
npx --yes busabase-cli@latest schema                                    # index: id, method, path, summary
npx --yes busabase-cli@latest schema bases.list                         # input + output as JSON Schema
npx --yes busabase-cli@latest schema records.changeRequest --io input   # only what to send
npx --yes busabase-cli@latest schema records list --output json         # machine-readable; space form works too
```

It also prints the `busabase-cli` command that calls the endpoint, so the schema and the command
you run come from the same source. Reach for `openapi.json` only when you genuinely need the whole
surface at once.

MCP-capable agents can connect to `$BUSABASE_BASE_URL/api/mcp` (Streamable HTTP) instead.

## Writing code against it, rather than driving it from a shell

The three routes above are for *you*, working a task through curl / CLI / MCP. When the
deliverable is code that talks to Busabase, hand off:

| You are… | Use |
| --- | --- |
| Writing TypeScript/JavaScript against the API | `busabase-sdk` — `createBusabaseClient({ baseUrl, apiKey })`. One client, fully typed against the same contract `/api/v1` serves. It is the only client the SDK ships. It carries the same embed-link surface you use from the shell: `client.embedLinks.create({ type: "node", typeId })` (or `type: "change-request"` / `"record-detail"`) returns `{ url, iframeUrl, expiresAt }`, so code that writes on a user's behalf can hand back a no-login link too. |
| Creating or continuously evolving a Busabase **AirApp** (an app that runs inside a workspace) | the `busabase-app-creator` skill — it owns identity checks, approved resource/schema/UI changes, scaffolding/runtime upgrades, data-access budgets, and the review flow. Don't hand-roll one from here. |
