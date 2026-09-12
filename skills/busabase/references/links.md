# Return a clickable result

After every successful mutation, include a short Markdown link in the chat response that opens
the exact result in Busabase. A bare id or local filesystem path is not enough when a browser
URL can be constructed.

Which link to give depends on the edition you probed at connect time, because "open this" means
something very different when the reader has no session — you are often writing into another
agent's chat window, on a machine that never signed in to Busabase.

**Desktop / local (the `200` probe)** — one link is enough. That instance has no auth, so the
plain dashboard URL opens for anyone who can reach the host. Do not mint an embed link; there is
nothing to bypass, and the endpoint does not exist on the OSS server.

**Cloud (the `401` probe)** — the dashboard URL needs a session the reader may not have. An
embed link targets one of three polymorphic kinds, selected with `type` + `typeId` (not a bare
`nodeId` — permission is still resolved down to a single `manage`-level node either way):

| `type` | `typeId` is | Use when the result is… |
| --- | --- | --- |
| `node` | the node's own id | `base`, `doc`, `file`, `drive`, `skill`, `folder`, or `airapp` |
| `change-request` | the ChangeRequest's id | still `in_review` / `conflict` — not yet merged |
| `record-detail` | the record's id | a single Base record, not the whole Base |

**Already merged, node result** — mint a short-lived read-only embed link and lead with it:

```bash
busabase-cli embed-links create --type node --type-id <node-id> --output json
```

or the same call over curl, when you are already in the raw-API loop:

```bash
curl -s -X POST "$BUSABASE_BASE_URL/api/v1/embed-links" \
  -H "Authorization: Bearer $BUSABASE_API_KEY" \
  -H "x-busabase-space: $BUSABASE_SPACE_ID" \
  -H 'content-type: application/json' \
  -d '{"type":"node","typeId":"<node-id>"}'
```

It returns `url` (open top-level — the capability is swapped for a cookie and the token drops
out of the address bar) and `iframeUrl` (for embedding inside another page). Use `url` unless
the caller explicitly wants to embed. Pass whichever one you use through **verbatim**; never
hand-assemble it.

Give **both** links, in this order — they fail in opposite ways, so neither alone is enough:

1. the embed `url` — opens with no sign-in, but **expires in 15 minutes**
2. the dashboard URL — never expires, but needs a signed-in Busabase session

Always state the expiry next to the embed link. A dead link that still looks alive is worse
than no link at all.

**Cloud, still awaiting review** — a pending ChangeRequest is embeddable too: swap `type` to
`change-request` and pass the CR's own id as `typeId` (`busabase-cli embed-links create --type
change-request --type-id <change-request-id> --output json`, or
`{"type":"change-request","typeId":"<change-request-id>"}` over curl). The embed renders the
CR's review view read-only. Give both links as above — the embed `url`/`iframeUrl` for no-login
preview, and `/inbox/<change-request-id>` for the signed-in reviewer who will actually approve
or merge it.

**Cloud, a single record** — a single record is embeddable with `type: "record-detail"` and the
record's own id as `typeId` (`busabase-cli embed-links create --type record-detail --type-id
<record-id> --output json`). Prefer this over linking the dashboard when the user only wants that
one record's detail view; only embed the parent Base (`type: "node"` on the Base's node id) if they
actually want the full Base view, and say that is what the link shows.

Building the URLs:

- Root-host shape is `${BUSABASE_BASE_URL}/dashboard/${BUSABASE_SPACE_ID}/<target-path>`;
  URL-encode the Space ID and route segments, and remove any trailing `/api/v1` from
  `BUSABASE_BASE_URL` first.
- After merge, prefer the canonical result: `/base/<base-slug>`, `/base/<base-slug>/<record-id>`,
  `/doc/<slug>`, `/folder/<slug>`, `/skill/<slug>`, `/drive/<slug>`, `/file/<slug>`, or
  `/airapp/<slug>`.
- For Busabase Desktop, use its confirmed local Space ID in the same `/dashboard/<space-id>/...`
  shape. For a confirmed workspace-subdomain URL, preserve that origin and use its short
  `/dashboard/<target-path>` route instead.
- Prefer an exact URL already returned by the live API or CLI over one you assemble yourself.
  Otherwise construct it only from the confirmed base URL, Space ID, and identifiers read back
  after the write.
- **Never put an API key in a URL.** The one credential that legitimately rides in a link is the
  embed capability token the server itself placed in `url` / `iframeUrl`: it is read-only,
  scoped to that single target, expires in 15 minutes, and can be revoked. That is the only
  exception — treat every other credential as never-in-a-URL.
- If the exact canonical target cannot yet be resolved, link to the ChangeRequest rather than
  guessing. State whether it is pending review or already merged.

Example final responses:

Merged, on Cloud:

`Added the Q3 pricing doc: [Open without signing in](https://busabase.com/embed/emb_a1B2c3D4e5F6g7H8?token=REDACTED) (expires in 15 min) · [Open in Busabase](https://busabase.com/dashboard/org_123/doc/q3-pricing) (needs sign-in).`

Awaiting review, on Cloud:

`Created the customer record and submitted it for review: [Open ChangeRequest without signing in](https://busabase.com/embed/emb_b2C3d4E5f6G7h8I9?token=REDACTED) (expires in 15 min) · [Open in Busabase](https://busabase.com/dashboard/org_123/inbox/cr_123) (needs sign-in).`

Desktop / local:

`Created the customer record: [Open](http://localhost:15419/dashboard/local/base/customers/rec_123).`

**If the CLI is present but this skill is not** — the same instructions ship inside the binary, so
an agent that only ran `npx busabase-cli` is not left guessing at the rules above. `busabase-cli
skill` prints this skill offline, `busabase-cli skill setup` prints the one-time onboarding
document instead (connect, seed a first Base, install the permanent skills), and `busabase-cli
skill install` writes the skill into the agent's skills directory so it loads on every later
session. No network call and no credential is needed for any of the three.
