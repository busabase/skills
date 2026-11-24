# Resource Model And Security

Use this reference to turn a product story into native Busabase resources and to keep credentials outside browser code. `$busabase` remains authoritative for connection, API, ChangeRequest, and approval behavior.

## Place Each Concern In The Native Resource

| Resource | Use it for | Do not use it for |
| --- | --- | --- |
| Folder | The user-facing product boundary and navigation group | Data rows or secrets |
| Base | Typed, queryable workflow records with lifecycle state | Long documents or binary files |
| Base View | A saved table, gallery, kanban, calendar, or gantt projection | A second copy of records |
| Doc | Long-form guidance, briefs, reports, and durable narrative | Status pipelines that need filtering |
| Drive | A named file collection, import area, export area, or artifact store | Secret configuration |
| Asset/File | Images, exports, attachments, and generated artifacts | Structured workflow records |
| Whiteboard | Spatial analysis, mapping, and visual collaboration | The only durable record of a decision |
| Form | Structured intake into an approved workflow | Arbitrary canonical mutation |
| Workflow | Trusted automation and secret-consuming server work | Browser-only interaction |
| HTML | A static or generated presentation artifact | The main interactive application shell |
| AirApp | A focused interactive projection and command surface | A hidden database or credential store |
| Vault | User-, Space-, or API-key-scoped variables and secrets | Folder navigation or browser-readable config |
| App users (Cloud, `site` apps) | End-user accounts: a shop's buyers, a members-only page's readers — email-code sign-in, each sees only rows whose owner column (a text column the app's server names as `ownerField`) holds their verified id (`references/runtime-and-sdk.md` § Sites with signed-in customers) | Space members, or a hand-made users/passwords Base |

Every generated app has a new Folder, at least one workflow Base, and one AirApp. Add the other resources only when the user story requires them. Prefer a native View when table, gallery, kanban, calendar, or gantt already expresses the operation; use the AirApp for cross-resource synthesis, focused decisions, and actions.

## Native View Rules

Supported View types are `table`, `gallery`, `kanban`, `calendar`, and `gantt`.

- Give each View a stable `key`, human name, type, and the minimum configuration required by that type.
- A kanban View names its select field with `stackByFieldSlug`.
- A calendar View names its date field with `dateFieldSlug`.
- A gantt View names its date fields with `startFieldSlug` and `endFieldSlug`.
- A gallery View may name its attachment field with `coverFieldSlug`.
- A table View states the useful fields, filter, and sort rather than exposing every column.
- Materialization must write each `view_id` back into the blueprint.
- View order is shared by everyone and the leftmost View is what the Base opens on; a Base always
  keeps at least one View. A Base with blueprint Views is created with `--skip-default-view`
  (`defaultView: false`) and its Views follow in blueprint order; a Base with none keeps the
  default "Grid view". To change which View opens later, move it with `position: 0`.

## Blueprint Resource Shape

The workspace may add resource collections beside `bases` and `relations`:

```json
{
  "workspace": {
    "docs": [
      {
        "key": "operating-guide",
        "name": "Operating guide",
        "slug": "operating-guide",
        "description": "Durable product guidance",
        "node_id": "filled-after-materialization"
      }
    ],
    "drives": [
      {
        "key": "deliverables",
        "name": "Deliverables",
        "slug": "deliverables",
        "files": [
          { "path": "exports/", "purpose": "Approved generated exports" }
        ],
        "node_id": "filled-after-materialization"
      }
    ],
    "whiteboards": [],
    "forms": [],
    "workflows": [],
    "html": []
  }
}
```

Blueprints describe intended Drive paths and purposes, never inline file contents. Initial content and binary uploads are separate, reviewable deployment operations.

## Vault Requirements, Never Vault Values

A blueprint may declare what trusted execution needs:

```json
{
  "vault_requirements": [
    {
      "key": "PUBLISH_API_KEY",
      "kind": "secret",
      "scope": "space",
      "required": true,
      "purpose": "Publish an approved artifact"
    }
  ],
  "integrations": [
    {
      "key": "publisher",
      "name": "Publisher",
      "purpose": "Publish after review",
      "execution": "trusted_workflow",
      "vault_refs": ["PUBLISH_API_KEY"]
    }
  ]
}
```

`integrations[].execution` names the approved owner: `agent`, `trusted_workflow`, `site` (a
Node/Worker Site integration), or `remote` (a remote AirApp server process, Node or Python). These
are metadata declarations, not a dispatcher, a credential grant, or automatic binding configuration.
The browser is not a Secret consumer. A Python scaffold cannot declare a Site integration.

Rules:

- Keys use uppercase environment-style names.
- `kind` is `secret` or `variable`; `scope` is `user`, `space`, or `api_key`.
- Include purpose and whether it is required. Never include `value`, `secret_value`, examples that look real, or screenshots containing values.
- Do not invent a public `GET /vault`, `getSecret`, or browser SDK call. The public AirApp session and public embed runtime do not expose Vault values.
- Direct users to the selected runtime's configuration to satisfy missing requirements. Sites use explicit **Secrets & Variables** bindings or direct Site values; Vault requirement declarations alone do not configure either. Show key names and readiness only when a supported metadata API exists. See `runtime-and-sdk.md` § Site secrets and environment bindings for deployment and permission boundaries.
- A browser AirApp may request or display the result of trusted work, but cannot receive the credential used to perform it.

Local AirApp OAuth identity tokens are connection credentials, not an ordinary blueprint Vault
requirement. Hono registers the rotating token set through the SDK's Node-only helper under
`~/.busabase/airapps/<app-id>.json`, with an owner-only directory and file. Do not model it as a
normal Vault key, expose it through `vault.get` or `reveal`, overwrite the CLI's active profile, or
make the browser responsible for token refresh.

## Capability Matrix

| Runtime | Read resources | Propose writes | Use Vault values |
| --- | --- | --- | --- |
| Creator Agent/CLI with selected Busabase connection | Approved workspace metadata and APIs | Yes, through ChangeRequests and explicit approval | Only when an explicitly supported trusted Agent path provides them; never print or persist them |
| Authenticated browser AirApp session | Only declared SDK procedures (`/api/v1` on its own origin) and exact resource ids | Only declared ChangeRequest-producing actions | No |
| Site Worker (`site` engine) | Fixed backend routes, using its Space-bound key | Only the approved server actions at the key's level | Only explicitly configured environment bindings; the Site key cannot export Space Vault at any level |
| Cloud remote AirApp server process | The approved app's server capabilities | According to its approved contract | Authorized runtime values captured at new-run startup; no automatic refresh of a live run |
| Local engine server process | The approved local app's capabilities | According to its approved contract | No automatic Cloud Vault injection; use explicitly configured local server credentials |
| Public embed | Explicit read-only allowlist | No | No |
| Trusted Busabase Workflow/server context | Resources granted to the workflow | According to the workflow's reviewed contract | Yes, for declared requirements only |

Treat capability availability as a product constraint. Do not render an action that the selected runtime cannot execute safely.

## External Side Effects

Creating a ChangeRequest or configuring a Secret is not the same as sending email, publishing content, charging money, or writing to a third-party system. For an external side effect:

1. Record the proposed work and approval state in a Base.
2. Let the user review or opt out through a native View or AirApp.
3. Execute through the declared trusted Workflow, Agent integration, or approved Site/backend action. Keep credentials in that server runtime.
4. Store the result, timestamp, external reference, and failure message back through the approved workflow.
5. Keep retries idempotent and visible.

## Materialization Contract

The approved blueprint is not deployable until it contains:

- Folder `node_id`;
- every Base `node_id` and `base_id`;
- every native View `view_id`;
- every Doc, Drive, Whiteboard, Form, Workflow, and HTML `node_id`.

A **pinned** AirApp's deployment config contains those ids and non-secret requirements. It must not list the whole Space to rediscover resources by name or slug.

A **runtime**-bound AirApp — the package-first route, and every installed template — has no ids to carry: they do not exist until an installer materializes them. It resolves each Base through `inspectProvisionedResources`, which matches the `resourceKey` stamped at install time. That is a stable per-install handle, not a name or slug, so it is not the rediscovery forbidden above. See § "Two Ways To Bind" in `SKILL.md`.
