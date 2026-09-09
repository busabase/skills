# Connect, sign in, and target the right space

## Which edition am I talking to?

Never assume — probe with no `Authorization` header before the first write:

```bash
set -a; [ -f ~/.busabase/.env ] && . ~/.busabase/.env; set +a
: "${BUSABASE_BASE_URL:=http://localhost:15419}"
curl -s -o /dev/null -w '%{http_code}' "$BUSABASE_BASE_URL/api/v1/bases"
```

- **Desktop / local** runs with no auth (`200`): proceed anonymously, no key needed.
- **Cloud / self-hosted cloud edition** (`401`): every call needs `Authorization: Bearer
  $BUSABASE_API_KEY`, and usually `x-busabase-space` (below). Both come from `~/.busabase/.env`.

## Signing in: the two-turn device flow (the agent path)

A blocking login prints its verification URL **mid-command** and then polls for up to 15
minutes. If your harness only relays a turn's *final* message, that URL never reaches the user —
they cannot approve what they never saw, and the login silently times out. So split it:

```bash
# Turn 1 — start. Returns immediately; writes NO credential:
npm exec -y --package busabase-cli@latest -- busabase-cli login --no-wait --output json
# → { "verification_url": "...", "user_code": "...", "resume_code": "...", "expires_in": "900", "hint": "..." }
```

Then, in this order:

1. Render the URL as a QR code and show it:
   `busabase-cli qrcode "<verification_url>" --out-file qr.png` — include the image in your reply
   (generating the file alone is not enough), URL first, QR below it.
2. Send `verification_url` to the user **verbatim**. It is an opaque string: never URL-encode or
   decode it, never trim, wrap, or re-assemble its query.
3. **End your turn.** The user approves on any device — often a phone.

```bash
# Turn 2 — after the user says they approved (keep the same --base-url/--profile flags):
npm exec -y --package busabase-cli@latest -- busabase-cli login --resume-code <resume_code>
```

Rules that prevent the classic failures:

- **Do not restart login while a link is pending.** Every fresh start invalidates the previous
  device code — the user clicks approve and sees "expired".
- **Do not show the URL and then block in the same turn.** That is the exact failure the
  two-turn flow exists to avoid.
- If the resume code has expired (the error names the exact restart command), start over with
  `--no-wait` and a fresh link — do not retry the stale code.
- **Old CLI fallback**: if `--no-wait` is rejected as an unknown option, the installed CLI
  predates it. Fall back to the blocking form with a generous runner timeout (≥ 900s):
  `busabase-cli login --device-code --no-browser` — it prints the URL and code to stderr and
  polls until approved.

Other paths, when they fit better:

- **`login --api-key sk_…`** — non-interactive automation/CI, credential supplied via the local
  environment or a secret manager. Never ask the user to paste an API key into chat, and never
  print, quote, or summarize a credential.
- **Interactive menu** (a human at a TTY runs plain `busabase-cli login`) — explains
  local / Cloud / self-hosted and handles everything itself; nothing for you to do.
- **`login --profile <name>`** adds a second account; `auth status` lists accounts,
  `auth switch` changes the active one.

## Cloud: confirm the target space before you write

A Cloud API key belongs to the **user**, not to a space — it works across **every space the
user is a member of**. Each request targets one space via the `x-busabase-space` header.
With exactly one space the header is optional; **when the key spans multiple spaces, a write
with no `x-busabase-space` header is rejected with `400`** (it lists your spaces) rather than
silently guessing. Always confirm the target before the first write of a session:

```bash
curl "$BUSABASE_BASE_URL/api/v1/auth" -H "Authorization: Bearer $BUSABASE_API_KEY"
```

`spaces` in the response is every space the user belongs to; `space` is the default.
`GET /api/v1/auth` is the one discovery call that intentionally omits `x-busabase-space`;
after selection, every other request must carry the confirmed id.

- **Exactly one space** → use its `id` — don't ask.
- **Multiple spaces** → if `BUSABASE_SPACE_ID` is already set (from `~/.busabase/.env`), use it.
  Otherwise **ask the user which space** — list the spaces by name and let them pick; never
  guess, and never assume the default is the one they mean. With the CLI available,
  `busabase-cli space list` prints exactly that list (and marks the current target). Persist the
  answer so future sessions don't re-ask:

```bash
busabase-cli space use "<chosen space name or id>"
```

Prefer that over appending to `~/.busabase/.env` by hand: it validates the choice against the
spaces this credential can actually reach, and — if the user keeps several accounts — records it
on the right one. A raw `>>` would only patch the mirror file and be lost the next time they run
`busabase-cli auth switch`. Without the CLI, `printf 'BUSABASE_SPACE_ID=%s\n' "<id>" >>
~/.busabase/.env` still works for a single account.

Then send `-H "x-busabase-space: $BUSABASE_SPACE_ID"` on **every** curl call. A space you're not
a member of returns 403; a missing header when the user has multiple spaces returns 400.
Programmatic clients should branch on `data.reason`: `SPACE_SELECTION_REQUIRED` means show or
ask for a Space choice; `SPACE_NOT_ALLOWED` means discard the stale/invalid choice and select
again. (`busabase-cli` handles this itself — `login` persists the chosen `BUSABASE_SPACE_ID`,
and every CLI command auto-loads it and sends the header. MCP tools can target another
authorized Space with `targetSpaceId`; use the confirmed Space ID on every multi-space MCP
operation rather than silently relying on the default.)

## Two auth facts worth knowing before you debug a 401

- `/api/v1` accepts an ambient **session cookie** only for *same-origin browser* requests (that
  is how an AirApp acts as the logged-in user). Your curl calls are neither, so they always need
  `Authorization: Bearer` — a cookie alone is rejected, by design.
- An AirApp reaches the API at plain `/api/v1/…` on its own origin. There is no bridge prefix
  and no Cloud-vs-Desktop path fork; if you see either in existing AirApp code, it predates
  this and is wrong.

Also: since the CLI's JSON error envelope carries a `hint` field on `401`/`403`, prefer running
the exact command it names over reconstructing a recovery yourself.

## Deployed-version and AirApp compatibility preflight

Before diagnosing or changing a deployed AirApp, probe the target deployment rather than
assuming a merged PR is live:

```bash
curl -s "$BUSABASE_BASE_URL/api/health"       # inspect buildSha and buildNumber
curl -s -o /dev/null -w '%{http_code}' "$BUSABASE_BASE_URL/api/v1/health"
curl -s -o /dev/null -w '%{http_code}' "$BUSABASE_BASE_URL/__busabase_api__/api/health"
```

`buildSha`/`buildNumber` identify the code actually deployed; a merged PR alone does not. A
current deployment should return `200` from `/api/v1/health` and `404` from the obsolete
`/__busabase_api__/...` prefix. If those expectations fail, separate deployment lag from an
AirApp source problem before proposing a file CR.
