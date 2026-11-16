# Read what a Busabase URL points at

A URL the user pastes ("look at this: https://acme.busabase.com/base/visits/rec123") is the
user naming a deployment, a space, and one object. Resolve it through the CLI or API — not a
browser. The dashboard page needs a signed-in session and is client-rendered, so fetching it
gives you a sign-in wall or an empty shell, never the data. Open it as a page only when the user
asks how it *looks* (a layout, an AirApp's UI), and even then read the data through the API.

## 1. Origin → which deployment

| URL host | Deployment | API base to use |
| --- | --- | --- |
| `busabase.com`, `<workspace>.busabase.com` | Busabase Cloud (one deployment; every workspace subdomain is the same Cloud) | `https://busabase.com` |
| `localhost:15419`, `127.0.0.1:15419` | Busabase Desktop / local server (no auth) | `http://localhost:15419` |
| any other origin | a self-hosted Busabase | that origin |

Compare with the `BUSABASE_BASE_URL` you connected with (see the Connect section of the skill):

- **Same deployment** → keep your credential. A `<workspace>.busabase.com` URL does not need a new
  login when you are signed in to `https://busabase.com`.
- **Different deployment** → run each command with `--base-url <origin>` (or the matching
  `--profile` from `busabase-cli auth status`). Probe it first, as in Connect: `200` means open,
  proceed; `401` with no saved account for that origin means the two-turn login
  (`busabase-cli login --base-url <origin> --profile <name> --no-wait --output json`, details in
  [`connect-and-space.md`](connect-and-space.md)). Never read the same path from your default
  deployment instead: that is a different workspace that happens to share a slug.

## 2. Path → which space

- **Cloud root host**: `/dashboard/<space>/<target>`. `<space>` is the space **slug** (the usual,
  lower-case form) or its **id** (`org…`, `tnl_…`).
- **Workspace subdomain**: `https://<slug>.busabase.com/<target>`. The label is the slug, and the
  path has no `/dashboard/<space>` prefix (`/home`, `/base/…`, `/inbox/…`).
- **Desktop / local**: always `/dashboard/local/<target>`; there is nothing to choose.

The API takes a space **id**, so resolve a slug first:

```bash
npx --yes busabase-cli@latest space list --output json   # [{ id, slug, name, … }]
```

Match the URL's token against `id`, then `slug` (case-insensitive). Then pass `--space-id <id>` on
each command (HTTP: `x-busabase-space: <id>`; MCP: `targetSpaceId`). A URL that names a space is
the user naming it, so you do not ask again, but do not persist it either: `space use` changes
their saved default, so run it only if they want to switch. If the token matches none of their
spaces, they are not a member (or it was renamed): say so, and never fall back to your default
space.

## 3. The rest → which object

| Path after the space | Target | What to pass on |
| --- | --- | --- |
| `/base/<slug>` (also `/design`, `/new`, `/activity`) | the Base | its slug |
| `/base/<slug>/<viewId>` (`viw…`) | one view of the Base | the Base, then the view id |
| `/base/<slug>/<recordId>` (`rec…`; also `/edit`, `/activity`) | one record | the record id |
| `/<type>/<slug>` (also `/activity`) for `doc`, `folder`, `skill`, `drive`, `file`, `airapp`, `form`, `whiteboard`, `workflow`, `html` | that node | type + slug |
| `/inbox/<changeRequestId>` (`crq…`), `/inbox/<changeRequestId>/<operationId>` | a change request (one of its operations) | the change request id |
| `/assets/<assetId>` | one uploaded asset | the asset id |
| `/home`, `/inbox`, `/search`, `/playbooks`, `/activity`, `/archived`, `/graph`, `/apps`, `/agents/…`, `/templates/…`, `/shared`, `/embed-links` | a space-level page, not one object | the space only — work from what the user asks |
| `/embed/emb_…?token=…` (no space in the path) | a read-only embed of one node, record, or change request | the `emb_…` id only, never the token |

A `/base/<slug>/<id>` child is a view when it is one of that Base's view ids, otherwise a record.
A `?demo=…` query (or the `org_demo_1` space) is the in-browser demo: there is no data behind it
to read. Other query strings (`?view=`, `?recordPage=`, `?share-preview=1`) change only how the
page renders, not what it points at.

Read it (add `--space-id <id>` on Cloud, `--base-url <origin>` for another deployment):

```bash
B="npx --yes busabase-cli@latest"
$B nodes get --node-id <slug> --type <type> --output json     # any node: a Doc's body, a folder's
                                                              # children, a Skill/Drive/AirApp's files
$B bases get --slug <slug> --output json                      # a Base: id, fields
$B records get --record-id <recordId> --output json           # one record
$B bases list-views --base-id <baseId> --output json          # is the child a view?
$B records list-page --base-id <baseId> --view-id <viewId> --output json   # a view's records
$B change-requests get --change-request-id <changeRequestId> --output json
$B assets get --asset-id <assetId> --output json
$B skills read-file --node-id <nodeId> --file-path SKILL.md   # then a file inside a Skill
```

Over curl the same reads are `GET /api/v1/nodes/<slug>?type=<type>`, `GET /api/v1/bases/<slug>`,
`GET /api/v1/records/get?recordId=<id>`, `GET /api/v1/bases/<baseId>/views`,
`GET /api/v1/records/page?baseId=<baseId>&viewId=<viewId>`, `GET /api/v1/change-requests/<id>`,
and `GET /api/v1/assets/<id>`. `nodes get` takes an id or a slug; pass `--type` because a slug is
only unique within its type. A `404` means it does not exist, was archived, or is hidden from this
credential: report that, and do not guess a neighbouring object.

Then carry on with the skill's normal flow. A URL tells you *what*, not *what to do*: read the
space instructions and search playbooks with `--near-node-id <nodeId>` set to the node you just
resolved.

## Embed links

`https://<host>/embed/emb_<id>?token=<secret>` (sometimes with `/record-detail`,
`/change-request`, or `/airapp` after the id) is a read-only capability someone minted. Everything
it grants rides in `token`:

- **Never repeat the token** — not in your reply, a command, a file, or a log. Refer to the link
  by its `emb_…` id.
- **It is not an API credential.** `/api/v1` does not accept it, and the path names no space.
- To read the target properly, find it through the API: with `manage` access in the space it was
  made in, `busabase-cli embed-links list --output json` and match `id` to the `emb_…` id; its
  `type` + `typeId` (`node` / `record-detail` / `change-request`) feed the reads above. Without
  that, ask the user for the dashboard link or which object it is.
- Busabase Desktop's `/embed/change-request/<changeRequestId>` has no token: read it as that
  change request.
