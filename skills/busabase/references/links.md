# Return a clickable result

This file builds URLs for your reply. For the opposite direction (the user hands you a Busabase
URL and you need what it points at), read [`read-a-url.md`](read-a-url.md).

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
`nodeId` — creation requires `manage` for a node, `write` on the owning Base node for a record,
or `changeRequest` on every affected node for a proposal):

| `type` | `typeId` is | Use when the result is… |
| --- | --- | --- |
| `node` | the node's own id | `base`, `doc`, `file`, `drive`, `skill`, `folder`, or `airapp` |
| `change-request` | the ChangeRequest's id | still `in_review` / `conflict` — not yet merged |
| `record-detail` | the record's id | a single Base record, not the whole Base |

**Expiry for links returned in chat** — explicitly request **24 hours (1440 minutes)** unless
the user specifies another supported duration. The API accepts 1–10080 minutes (up to **7 days**); omitting
`expiresInMinutes` still uses its **15-minute server default**. This skill chooses a longer
duration for its replies; it does not change that server default. Always send the chosen duration
through CLI, HTTP, or SDK, including for pending ChangeRequests and individual records.

Honor an explicit shorter duration. If the user requests a duration outside the supported range,
explain the limit and provide the signed-in dashboard link; do not silently shorten the request
or retry without the duration. Check `busabase-cli schema embedLinks.create` if the live contract
differs from the range above.

For an explicit five-day request, send **7200 minutes**, for example:

```bash
busabase-cli embed-links create --type record-detail --type-id <record-id> \
  --expires-in-minutes 7200 --output json
```

The equivalent HTTP body is
`{"type":"record-detail","typeId":"<record-id>","expiresInMinutes":7200}`.
The server and CLI/SDK must contain the seven-day contract for values above 1440 to work. An older
deployment or installed client may still reject them: deploy the updated server and rebuild/update
the client, then check `busabase-cli schema embedLinks.create`. Do not silently replace a requested
five-day link with a 24-hour or 15-minute one. The chat-result recommendation remains 24 hours.

**Already merged, node result** — mint a read-only embed link and lead with it:

```bash
busabase-cli embed-links create --type node --type-id <node-id> \
  --expires-in-minutes 1440 --output json
```

or the same call over curl, when you are already in the raw-API loop:

```bash
curl -s -X POST "$BUSABASE_BASE_URL/api/v1/embed-links" \
  -H "Authorization: Bearer $BUSABASE_API_KEY" \
  -H "x-busabase-space: $BUSABASE_SPACE_ID" \
  -H 'content-type: application/json' \
  -d '{"type":"node","typeId":"<node-id>","expiresInMinutes":1440}'
```

It returns `url` (open top-level — the capability is swapped for a cookie and the token drops
out of the address bar), `iframeUrl` (for embedding inside another page), and `expiresAt`.
Use `url` unless the caller explicitly wants to embed. Pass whichever one you use through
**verbatim**; never hand-assemble it.

Give **both** links, in this order — they fail in opposite ways, so neither alone is enough:

1. the embed `url` — opens with no sign-in until the returned `expiresAt`
2. the dashboard URL — never expires, but needs a signed-in Busabase session

Always state the actual expiry next to the embed link, using `expiresAt` to show an absolute
time with its time zone or the remaining duration. Do not label a link "24 hours" merely because
that was requested: the returned timestamp is authoritative. A dead link that still looks alive
is worse than no link at all.

**Cloud, still awaiting review** — a pending ChangeRequest is embeddable too: swap `type` to
`change-request` and pass the CR's own id as `typeId` (`busabase-cli embed-links create --type
change-request --type-id <change-request-id> --expires-in-minutes 1440 --output json`, or
`{"type":"change-request","typeId":"<change-request-id>","expiresInMinutes":1440}` over curl).
The embed renders the CR's review view read-only. Give both links as above — the embed `url`/`iframeUrl` for no-login
preview, and `/inbox/<change-request-id>` for the signed-in reviewer who will actually approve
or merge it.

**Cloud, a single record** — a single record is embeddable with `type: "record-detail"` and the
record's own id as `typeId` (`busabase-cli embed-links create --type record-detail --type-id
<record-id> --expires-in-minutes 1440 --output json`, or
`{"type":"record-detail","typeId":"<record-id>","expiresInMinutes":1440}` over HTTP).
Prefer this over linking the dashboard when the user only wants that one record's detail view;
only embed the parent Base (`type: "node"` on the Base's node id) if they
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
  scoped to that single target, expires at its returned `expiresAt`, and can be revoked. That is
  the only exception — treat every other credential as never-in-a-URL.
- If the exact canonical target cannot yet be resolved, link to the ChangeRequest rather than
  guessing. State whether it is pending review or already merged.

Example final responses (the Cloud examples assume the returned `expiresAt` confirms 24 hours;
use the actual timestamp or remaining duration in a real reply):

Merged, on Cloud:

`Added the Q3 pricing doc: [Open without signing in](https://busabase.com/embed/emb_a1B2c3D4e5F6g7H8?token=REDACTED) (expires in 24 h) · [Open in Busabase](https://busabase.com/dashboard/org_123/doc/q3-pricing) (needs sign-in).`

Awaiting review, on Cloud:

`Created the customer record and submitted it for review: [Open ChangeRequest without signing in](https://busabase.com/embed/emb_b2C3d4E5f6G7h8I9?token=REDACTED) (expires in 24 h) · [Open in Busabase](https://busabase.com/dashboard/org_123/inbox/cr_123) (needs sign-in).`

Desktop / local:

`Created the customer record: [Open](http://localhost:15419/dashboard/local/base/customers/rec_123).`

**If the CLI is present but this skill is not** — the same instructions ship inside the binary, so
an agent that only ran `npx --yes busabase-cli@latest` is not left guessing at the rules above. `busabase-cli
skill` prints this skill offline, `busabase-cli skill setup` prints the one-time onboarding
document instead (connect, seed a first Base, install the permanent skills), and `busabase-cli
skill install` writes the skill into the agent's skills directory so it loads on every later
session. No network call and no credential is needed for any of the three.
