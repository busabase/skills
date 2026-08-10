# Interview And Blueprint

Use this reference for the conversational discovery and the machine-readable handoff between reasoning, scaffolding, and deployment.

## Conversation Rules

- Ask exactly one decision question per assistant message.
- Present two or three mutually exclusive, context-specific choices labeled `A`, `B`, and optionally `C`.
- Mark the best default with `(Recommended)` when there is a defensible default.
- End every question with `Reply A/B, or type your own answer.` Use `A/B/C` when there are three choices, and translate the line into the conversation language.
- Accept letters case-insensitively, the full option text, or any custom natural-language answer.
- Never ask a bare open-ended interview question. For inherently open topics, offer two or three likely categories or examples while keeping custom input available.
- Use the host's structured choice control when one is available; otherwise render the lettered options as plain text.
- Briefly restate the decision before asking the next question.
- Do not repeat facts the user already supplied.
- Ask in business language, not schema language.
- Stop interviewing when the blueprint can be implemented without guessing user-visible behavior.

## Question Format

Use this shape consistently:

```text
Where should this AirApp run?

A. Busabase Cloud (Recommended) - deploy into a selected Cloud Space.
B. Busabase Desktop - deploy into the local Desktop workspace.

Reply A/B, or type your own answer.
```

Keep option descriptions to one short sentence. Do not combine two decisions in one set of choices. If the user types a custom answer, treat it as authoritative and continue instead of forcing it into an option.

## Adaptive Question Order

Ask only the unresolved items, usually in this order:

1. Deployment: Cloud or Desktop.
2. Source location: temporary or persistent.
3. Outcome: what should become easier after opening the app?
4. Audience: who opens it and how often?
5. Objects: what things do they inspect or track?
6. Lifecycle: what states does each important object move through?
7. Relationships: what belongs to or depends on what?
8. Artifacts: which native Views, Docs, files, visual boards, Forms, or Workflows make the job easier?
9. First screen: what must be visible immediately?
10. Detail: what makes one item understandable?
11. Attention: what requires a human decision or follow-up?
12. Actions: is read-only enough; if not, which small action should create a CR?
13. Integrations: does any action require trusted execution and named Vault requirements?
14. Brand: existing colors/logo/reference or inferred operational style?
15. Naming: final app and workspace name.

Avoid asking all questions when a detailed initial story already answers them.

## Stopping Rule

The interview is complete when the Agent can state all of these without an unsupported assumption:

- one user and recurring job;
- one primary outcome;
- app name and slug;
- complete object graph;
- native resource and View graph;
- primary fields and lifecycle choices;
- page/navigation map;
- empty/loading/error behavior;
- read procedure allowlist;
- optional CR-producing actions;
- branding and language;
- seed-record and initial-artifact outline;
- data-access budgets for lists, search, filters, summaries, and Load More behavior.
- named Vault requirements and their trusted execution owner, without values.

## Human Blueprint View

Before showing JSON, present:

```text
User Story
  As <audience>, I want <workflow>, so that <outcome>.

Pages
  Overview -> Entity list -> Entity detail -> Settings

Data graph
  Folder
  ├── Base A --relation--> Base B
  │   ├── Kanban View
  │   └── Calendar View
  ├── Doc
  ├── Drive
  ├── Trusted Workflow (optional)
  └── AirApp

Actions
  Read: ...
  ChangeRequest only: ...

Excluded
  ...
```

Then show field tables and request approve/revise/stop.

## Blueprint JSON Contract

Use JSON, schema version `1`. Keep secrets out.

```json
{
  "schema_version": 1,
  "app": {
    "name": "Launch Tracker",
    "slug": "launch-tracker",
    "description": "A shared view of launches and their work items.",
    "locale": "en",
    "deployment": "cloud",
    "space_id": "non-secret-space-id-or-empty-for-desktop",
    "read_only": true,
    "brand": {
      "mode": "inferred",
      "accent": "#176B5B",
      "logo_path": ""
    }
  },
  "workspace": {
    "folder": {
      "name": "Launch Tracker",
      "slug": "launch-tracker",
      "node_id": "filled-after-structure-creation"
    },
    "bases": [
      {
        "key": "launches",
        "name": "Launches",
        "slug": "launches",
        "node_id": "filled-after-structure-creation",
        "base_id": "filled-after-structure-creation",
        "read_limit": 50,
        "description": "Launches visible to the team.",
        "views": [
          {
            "key": "launch-calendar",
            "name": "Launch calendar",
            "type": "calendar",
            "config": { "dateFieldSlug": "due-date" },
            "view_id": "filled-after-structure-creation"
          }
        ],
        "fields": [
          { "slug": "name", "name": "Name", "type": "text", "required": true },
          {
            "slug": "status",
            "name": "Status",
            "type": "select",
            "required": true,
            "options": {
              "choices": [
                { "id": "planned", "name": "Planned" },
                { "id": "active", "name": "Active" },
                { "id": "done", "name": "Done" }
              ]
            }
          },
          { "slug": "owner", "name": "Owner", "type": "text", "required": false },
          { "slug": "due-date", "name": "Due date", "type": "date", "required": false }
        ],
        "seed_records": [
          { "name": "Summer release", "status": "active", "owner": "Growth" }
        ]
      }
    ],
    "docs": [],
    "drives": [],
    "whiteboards": [],
    "forms": [],
    "workflows": [],
    "html": [],
    "vault_requirements": [],
    "integrations": [],
    "relations": []
  },
  "ui": {
    "primary_base": "launches",
    "summary": "See launch health and open the details that need attention.",
    "screens": [
      {
        "id": "overview",
        "name": "Overview",
        "purpose": "Status and attention summary",
        "data_sources": ["launches"]
      },
      {
        "id": "launches",
        "name": "Launches",
        "purpose": "Filterable list and detail",
        "data_sources": ["launches"]
      }
    ],
    "attention_states": ["blocked", "due_soon"],
    "actions": []
  },
  "permissions": {
    "read_procedures": ["records.listPaged", "changeRequests.listPaged"],
    "change_request_procedures": []
  }
}
```

During approval, materialized ids may be absent or empty because the structure does not exist yet. Immediately after structure creation, read canonical results back and populate every Folder/Node/Base/View/resource id before scaffolding. `scaffold` must reject a blueprint that still lacks them. Include `changeRequests.listPaged` only when the UI actually renders a pending-review summary. See `resource-model-and-security.md` for optional resource and Vault shapes.

Each Base may declare `read_limit`, an integer from 1 through 50. It is the one-page interactive
budget emitted as `readLimit` in deployment config and consumed by both providers. Omit it to use the
default of 50; use a smaller value for compact projections such as a 14-report activity window.

## Field Rules

- Make the first field short, human-readable, and required. It becomes the record label.
- Use typed fields instead of a generic JSON blob.
- Use `select`/`multiselect` only for stable choices.
- Use `relation` for real cross-Base ownership or dependencies.
- Use kebab-case physical slugs and stable lowercase keys.
- Store media/files as attachments or Drive references, not large text fields.
- Keep optional fields optional; do not invent fake required data.
- Give each Base an explicit `read_limit` when its screen needs less than the default 50.
- Warn about a large first version, but do not enforce a Base/field count limit after user confirmation.

## Relation Shape

```json
{
  "source_base": "tasks",
  "field_slug": "project",
  "field_name": "Project",
  "target_base": "projects",
  "required": true,
  "multiple": false
}
```

The referenced `field_slug` must also exist as a `relation` field in the source Base.

## Action Shape

Read-only is the default. If requested:

```json
{
  "id": "request-status-change",
  "label": "Request status change",
  "kind": "change_request",
  "base": "launches",
  "fields": ["status", "comment"]
}
```

Reject action kinds that directly mutate or merge canonical data.

## Seed Rules

- Propose three to five realistic records across the primary workflow.
- Include enough state variation to exercise metrics, filters, list, detail, and empty cases.
- Avoid fake personal data that resembles a real private person.
- Keep seeds in the blueprint until they are submitted as CRs.
- For relations, submit and merge parent records before resolving child record ids.
