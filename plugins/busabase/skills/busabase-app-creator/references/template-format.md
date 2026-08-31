# The Template Package Format

What a package-first run writes, and what makes it valid. Read this completely
before writing the first file on that route.

A **template** is one directory that is three things at once: an Agent Skill, an
installable busabase package, and the app it carries. That is not a bundling
trick — it is the point. The manual an agent reads and the resources it operates
on ship together, so an installed app is usable by an agent immediately instead
of requiring one to guess a schema.

## Layout

```
<name>/
├── SKILL.md                      the manual — required, and the template opt-in
├── references/ agents/ scripts/  optional; installed alongside SKILL.md
├── busabase.json                 the manifest — required
├── content/                      the resources, as plain files — required
│   ├── _folder.json              { "name": "...", "description": "..." }
│   ├── <base>/base.json          one directory per Base
│   ├── <base>/records.ndjson     optional sample rows
│   ├── <name>-app/               the AirApp
│   │   ├── _node.json            { "type": "airapp", "name": "..." }
│   │   ├── .busabaseignore       what stays in the repo, out of the node
│   │   ├── package.json          MUST have a `dev` script
│   │   └── server.js, app/, …
│   └── <name>-files/_node.json   optional Drive: { "type": "drive", "name": "..." }
└── assets/screenshots/*.webp     catalog images; not nodes, never installed
```

Everything under `content/` is exactly a `busabase-package@1` tree — the format
`busabase-cli install` has always read. The template increment lives entirely
*outside* it: the root `SKILL.md` and the manifest's `template` object. So a
template directory is already a valid package, and any package becomes a
template by adding those two things.

`<name>` is the identity: the directory name, `busabase.json`'s `name`, and
SKILL.md's frontmatter `name` must all agree. The validator enforces it, because
they are one thing.

## `SKILL.md` frontmatter

```yaml
---
name: busa-email
description: Inbox triage and reply-approval desk. Use when the user mentions …
metadata:
  category: comms
  tags:
    - risk:gated-write
  busabase:
    template: true          # the opt-in — never inferred from directory shape
    folderSlug: busa-email
    resources:              # every key must be a Base under content/
      - reviews
      - contacts
      - settings
    risk: gated-write
---
```

`template: true` is deliberate rather than implied. Publishing a template means
accepting that installers run this app's code and hand this file to their agent;
that deserves a flag someone typed on purpose.

`resources` is checked against `content/`. An agent told about a table that does
not exist writes to the wrong one, so a mismatch fails validation rather than
warning.

The body is the manual, written for the agent that will operate the installed
app: what each Base holds, what each field means, the workflow states, and —
most importantly — the boundary. Say what the app must never do (send, publish,
charge, merge its own proposals). An agent follows what is written here.

## `busabase.json`

```jsonc
{
  "format": "busabase-package@1",
  "name": "busa-email",
  "description": "Inbox triage, human review, and trusted execution.",
  "version": "0.3.0",
  "license": "MIT",
  "tags": ["email", "triage"],
  "template": {
    "category": "email",           // required; what the catalog groups by
    "schemaVersion": 3,            // bump when the declared resource shape changes
    "airapp": "busa-email-app",    // which content/ dir is the app
    "tags": ["inbox", "review-queue"],
    "screenshots": ["assets/screenshots/overview.webp"],
    "agentPrompts": [              // shown after install; "Ask agent" prefills the first
      "Triage this morning's mail and draft replies for anything high priority."
    ],
    "vaultNamespace": "busa-email",
    "secrets": [                   // DECLARED, never created — no slot for values exists
      { "key": "IMAP_PASSWORD", "description": "mailbox password", "required": true }
    ],
    "requires": { "airapp": true }
  }
}
```

`agentPrompts` is not decoration. It is the shortest honest answer to "what
would I even ask this thing", which is what decides whether an installed app
gets used or sits there. Write two or three that the app can actually satisfy.

With more than one AirApp, replace `airapp` with `airapps` and mark exactly one
`primary`:

```jsonc
"airapps": [
  { "slug": "busa-email-app", "role": "primary" },
  { "slug": "busa-email-admin", "role": "admin" }
]
```

Ambiguity is refused, never guessed: a template that silently opens the wrong
app is worse than one that will not publish.

## `content/<base>/base.json`

```jsonc
{
  "name": "Email Reviews",
  "description": "Mailbox review items and human decisions",
  "position": 0,
  "fields": [
    { "slug": "subject", "name": "Subject", "type": "text",
      "required": true, "position": 0, "options": {} }
  ],
  "views": []
}
```

`position` is required on every field. A relation field points at another Base
in the same package by slug:

```jsonc
{ "slug": "company", "name": "Company", "type": "relation", "position": 3,
  "required": false, "options": { "targetBaseSlug": "companies" } }
```

## `content/<base>/records.ndjson`

One JSON object per line: `{"key": "…", "fields": {…}}`. `key` is
package-local and only has to be unique within the package; install mints real
ids.

**At most 50 rows per Base**, enforced by the validator. A template's sample rows
are *merged* on install rather than proposed, so the app is not empty when
opened — and that convenience is exactly why the ceiling is low. Merged rows fire
webhooks and automations, enter commit history, and are read by agents as data.
A template seeds a demo; it does not ship a dataset.

## When the app declares its own tables

An AirApp that provisions its own resources (via `provisionDeclaredResources`)
carries the field definitions in its own config, because it cannot read
`content/` from inside the installed node. Then `content/<base>/base.json` is
**generated from that config**, never hand-edited, by a script the template ships
(see `busa-email`'s `scripts/sync-content.mjs`, which also takes `--check`).

Two rules matter here, and the second cost a real defect:

- The config's `key` is the app's stable handle (`contacts`) and becomes the
  node's `resourceKey`. The install stamps it, and the app looks its tables up
  by it.
- The config **must keep each Base's `slug`**. Stripping a workspace's node ids
  from a config is right; taking the slug with them is not — the SDK needs it to
  create the Base. Losing it broke the app's own provisioning while installing
  from the package still worked perfectly, because install reads `base.json` and
  never touches the config. Set it to `<name>-<key>`, which is also what install
  produces after prefixing, so both routes land on one Base.

## `.busabaseignore`

Gitignore syntax, read at `content/<airapp>/.busabaseignore`. It lets one
directory be both the deployed node and the developer's working copy — the repo
keeps `test/`, lockfiles and coverage; the node receives only what has to run.

`package.json` and the entry it declares can never be ignored. That is an error,
not a warning: the app would install cleanly and then fail to boot, which is the
hardest failure to attribute.

## Validating

```bash
npx busabase-cli index . --repo <owner/repo> -o templates.json          # build the catalog
npx busabase-cli index . --repo <owner/repo> -o templates.json --check  # verify it is current
```

The same rules decide catalog listing and install behaviour, so a card can never
promise something its install does not do. A directory that declares itself a
template and does not qualify appears in the catalog's `rejected` list with its
reasons.

Hard requirements, any of which disqualify it: a root `SKILL.md` with
`metadata.busabase.template: true`; a `busabase.json` with a `template` object
carrying at least `category`; a readable `content/` tree; every declared
`resource` present; an unambiguous primary AirApp; every AirApp having a `dev`
script; and `busabase.json.name` matching SKILL.md's `name`.

Warnings do not disqualify — no AirApp (a data-only template), no sample rows,
no screenshots, no `agentPrompts` — but each is a card that is honest about
being less than it could be.

That command answers one question: *will this list and install*. It deliberately
says nothing about the rest of this skill's contract, which `check` reads off the
directory itself:

```bash
npx busabase-cli check ./<name>              # one directory
npx busabase-cli check . --strict --json     # every template in a repo, for CI
npx busabase-cli check ./<name> --only airapp  # while iterating on the app
```

Four things can be true of one directory and they are not four rungs of a ladder,
so `check` reports each applicable layer separately:

| Layer | Answers |
| --- | --- |
| `package` | identity, the screenshots the card promises, committed secrets or workspace ids |
| `skill` | frontmatter, a description an agent can dispatch on, unfilled TODOs, references that travel |
| `template` | `validateTemplate` — will it list and install as one |
| `airapp` | the runtime contract: `dev`/`start`, the SDK pin, runtime detection, page budgets, config slugs |

A layer that does not apply reports `–`, never `✓`: "not applicable" and "passed"
look identical in a checklist that only has ticks, and that is how coverage gets
assumed instead of verified.

It is static — no install, and none of the template's own code is executed, so it
is safe on a pull request from a stranger and fast enough to re-run while
building. **Errors** break an installing user or publish someone's credentials.
**Warnings** are documented defaults worth defending in review, and `--strict`
fails on them too.

The rules live where they are versioned with what they check: the AirApp contract
in `busabase-sdk/airapp-check` (beside the runtime it is about, so the two cannot
drift), the format rules in `busabase-package/audit`. `check` composes them and
owns none of its own.

**A validator pass is a precondition, never the finish line.** Install the
package into a scratch Space, merge, and open the app. A package can satisfy
every static rule while its runtime behaviour is broken. The known example is
provisioning: install reads `base.json` and never exercises the declaration the
app provisions from, so a config Base that lost its `slug` shipped once through
a green catalog check. `busabase-cli check` now catches that particular one —
which is exactly why it is not evidence that the next one is covered. Only a
real install-and-open finds those.

## Publishing

Templates are submitted by pull request to <https://github.com/busabase/templates>.
That repository's `AGENTS.md` carries its own conventions — where a template
goes, what is generated, what disqualifies one. Read it before opening the PR;
do not restate or override it from here.
