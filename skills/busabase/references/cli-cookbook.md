# CLI / curl / OpenAPI cookbook

## 1. `busabase-cli` — ergonomic, best for the everyday loop

A typed Node client over the same REST API. It **auto-loads `~/.busabase/.env`** (and respects
`BUSABASE_BASE_URL` / `BUSABASE_API_KEY` exported in your shell, which override the file), so it
just works with no setup — you don't even need the `source` step (that's only for raw `curl`):

```bash
npx busabase-cli whoami                  # active space + user
npx busabase-cli bases list              # the tables
npx busabase-cli records list --base-id <base-id> --limit 20 --output json
npx busabase-cli change-requests list \
  --status-json '["in_review","approved","conflict"]' --limit 20 --output json
npx busabase-cli change-requests list \
  --affects-node-id <node-id> \
  --status-json '["in_review","approved","conflict"]' --limit 1 --output json

# Which account / which space am I on? (offline — reads the stored config, no API call)
npx busabase-cli auth status             # accounts, grouped by host, * = active
npx busabase-cli space list              # spaces this credential can reach, * = targeted

# Find where something lives before you act on it — one call searches files, Docs, AND
# Base records (real line/column numbers, regex, honest per-source coverage):
npx busabase-cli grep --pattern "Termination" --context-lines 2 --output json
# Scope to one source when you already know where to look (faster, narrower coverage report):
npx busabase-cli grep --pattern "ACME Corp" --sources records --base-slugs contracts
# Files-only, with the fuller missing/stale/unsearchable file reporting — same engine, `grep`
# above composes this plus Docs plus records into one call:
npx busabase-cli assets grep --pattern "Termination" --drive-path contracts/
# Then read just the lines around a hit instead of the whole file/Doc:
npx busabase-cli assets read-lines --asset-id <asset-id> --start-line 118 --end-line 122
npx busabase-cli docs read-lines --node-id <node-id> --start-line 118 --end-line 122
# grep's `missing` names binary files (PDF/docx/images/…) with no extracted text yet — run your
# own extractor and hand the result back so they stop being invisible to search:
npx busabase-cli assets put-text --asset-id <asset-id> --file ./extracted.txt

# propose (server decides review-vs-merge for you) → read back:
npx busabase-cli bases create-change-request --base-id <id> \
  --fields-json '{"title":"…","body":"…"}' \
  --message "Add Acme Corp — qualified lead from the June webinar"
# Update many existing records in one atomic review. Each fields object is a
# partial patch; omitted keys stay unchanged and null clears a field.
npx busabase-cli records bulk-update-change-request --base-id <id> \
  --updates-json @updates.json \
  --message "Apply August content review decisions" --require-review
# If it comes back "in_review" (your key is changeRequest-level, or the human wants
# review), a human decides:
npx busabase-cli change-requests review --change-request-id <id> --verdict approved
npx busabase-cli change-requests merge  --change-request-id <id>

# structure creates (Base / folder / Doc / File / Skill) follow the same rule:
npx busabase-cli nodes create-change-request --type folder \
  --name "客户关系管理 CRM" \
  --message "Create CRM folder"
# ...same conditional review step as above if it comes back "in_review".

# Force review even though your key could write directly — e.g. the change is risky, or
# the human asked for a second pair of eyes:
npx busabase-cli bases create --slug campaigns --name "Campaigns" --require-review

# asset-backed attachment fields:
npx busabase-cli bases create-field --base-id <base-id> \
  --slug cover_image \
  --name "封面 Cover Image" \
  --field-type attachment \
  --max-files 1 \
  --allowed-mime image/png \
  --allowed-mime image/svg+xml

npx busabase-cli assets upload --file ./cover.svg --context record-field --output json
# Put the JSON output directly into an attachment field array:
# {"cover_image":[{"id":"...","assetId":"...","attachmentId":"...","url":"...","fileName":"cover.svg","mimeType":"image/svg+xml","size":1234}]}

# clean up a bad proposal without merging:
npx busabase-cli change-requests close --change-request-id <id> --reason "Wrong folder"
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
    "body": "{target}\n\nAdd a visit record with the date I give, the contact I name, and a one-line summary." },
  { "key": "quarter-recap", "intent": "read-only", "label": "What did we discuss this quarter",
    "body": "{target}\n\nSummarize every visit to the account I name since the quarter started." }
]
JSON

npx busabase-cli nodes create --type base --slug visits --name "Visits" \
  --field title:Title:text --field account:Account:text --agent-prompts-json @prompts.json

npx busabase-cli nodes set-agent-prompts --node-id <nodeId> --file prompts.json
```

Limits: 50 prompts per node, 80 chars per localized `label`, 8 KiB per localized `body`. `label`
and `body` each accept a plain string or an i18n object (`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`,
`fr`, `es`, `pt` — any other key fails validation).

Two things that bite:

- **The list REPLACES the node type's default scenarios** (the capability prompts underneath are
  untouched). Two generic lines are a downgrade from the defaults, not an addition to them.
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
npx busabase-cli bases create-change-request --base-id <id> --fields-json @fields.json --dry-run
npx busabase-cli api --method post --path /api/v1/nodes --body-json '{...}' --dry-run
```

### When a 403 says you lack permission

The error envelope's `hint` names the endpoint and the API-key level it needs, read from the same
policy the server enforces. `busabase-cli schema <id>` shows that level too. Levels are ordered
`read` < `changeRequest` < `write` < `manage`; a `changeRequest` key can propose but deliberately
cannot merge its own proposal, which is the approval model working as designed, not a bug to
route around.

Run `npx busabase-cli --help` for the full command list; add `--output json` to parse results.
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
npx busabase-cli schema                                    # index: id, method, path, summary
npx busabase-cli schema bases.list                         # input + output as JSON Schema
npx busabase-cli schema records.changeRequest --io input   # only what to send
npx busabase-cli schema records list --output json         # machine-readable; space form works too
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
