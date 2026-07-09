---
name: systemadmin
description: Operate any kapps app's systemadmin API — marketplace listings, repos, skills batch-publish, CRM contacts, automation journeys & approvals, companies, spaces, users, waitlist, growth stats, and more. Use when asked to manage marketplace items, publish skills, inspect CRM contacts/journeys/approvals, or administer any app's systemadmin panel via API.
disable-model-invocation: false
allowed-tools: Bash(curl:*), Bash(jq:*), Bash(cat:*), Bash(echo:*), Bash(find:*), Bash(ls:*), Read, Write, Edit, WebFetch
user-invocable: true
---

# /systemadmin — Systemadmin API Operator

Interact with any kapps app's systemadmin oRPC API to manage marketplace listings,
repos, skills, companies, users, and other admin operations.

## Arguments

`$ARGUMENTS` can be:
- An operation name: `marketplace list`, `marketplace batch-publish-skills`, `repos list`
- A subcommand with flags: `marketplace batch-publish-skills --file skills.json`
- Natural language: "publish all skills from company X to the marketplace"

## Authentication

The systemadmin API requires a logged-in system admin session. Two modes:

**1. Cookie-based (browser session) — use when running from the machine:**
```bash
# Export your session cookie from the browser's DevTools → Application → Cookies
# Local HTTP usually uses:
COOKIE="better-auth.session_token=<value>"
# Production HTTPS usually uses Better Auth's secure cookie prefix:
# COOKIE="__Secure-better-auth.session_token=<value>"
#
# Safest option: copy the full Cookie header from a browser Network request to
# /api/rpc/... so companion cookies such as session_data are included too.
BASE_URL="http://localhost:3000"  # or the app's URL
```

**2. Service-to-service — use SYSTEM_ADMIN_SECRET env var if configured:**
```bash
BASE_URL="${BUDA_URL:-http://localhost:3000}"
```

**RPC endpoint:** `POST $BASE_URL/api/rpc/<procedure-path>`

All systemadmin procedures are nested under the `systemAdmin` router key:
```
POST /api/rpc/systemAdmin/marketplace/list
POST /api/rpc/systemAdmin/marketplace/getListing
POST /api/rpc/systemAdmin/marketplace/createListing
...
```

## Common curl wrapper

```bash
sa_rpc() {
  local path="$1"
  local body
  local payload

  if [ $# -ge 2 ]; then
    body="$2"
  else
    body='{}'
  fi

  payload="$(jq -nc --arg body "$body" '{json: ($body | fromjson)}')" || return 1

  curl -s -X POST "$BASE_URL/api/rpc/systemAdmin/$path" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE" \
    --data-binary "$payload" | jq .
}
```

For spam-account cleanup, follow the dedicated SOP:
`references/bulk-ban-users-by-email-domain.md`.

For AWS SES bounce/complaint CSV cleanup, follow the dedicated SOP:
`references/import-ses-suppressions-from-csv.md`.

---

## Marketplace Operations

### List listings
```bash
sa_rpc marketplace/list '{"kind":"skill","status":"published","limit":50}'
sa_rpc marketplace/list '{"kind":"skill","status":"pending","sortBy":"createdAt","sortOrder":"desc"}'
```

Filters: `kind` (skill/agent/team), `status` (draft/pending/published/rejected),
`source` (system/official/community), `category`, `featured` (all/featured/not_featured),
`verified` (all/verified/not_verified), `search`, `sortBy`, `sortOrder`, `limit`, `offset`.

### Get single listing (with full payload)
```bash
sa_rpc marketplace/getListing '{"id":"mpl_xxxxx"}'
```

### Create a listing
```bash
sa_rpc marketplace/createListing '{
  "companyId": "mpc_xxxxx",
  "kind": "skill",
  "name": "My Skill",
  "description": "Does something useful",
  "category": "Engineering",
  "source": "official",
  "payload": {"githubUrl": "https://github.com/org/repo", "path": "skills/my-skill"},
  "priceCents": 0
}'
```

### Update a listing
```bash
sa_rpc marketplace/updateListing '{"id":"mpl_xxxxx","name":"New Name","category":"Marketing"}'
```

### Delete a listing
```bash
sa_rpc marketplace/deleteListing '{"id":"mpl_xxxxx"}'
```

### Update status (draft → pending → published / rejected)
```bash
sa_rpc marketplace/updateStatus '{"id":"mpl_xxxxx","status":"published"}'
sa_rpc marketplace/updateStatus '{"id":"mpl_xxxxx","status":"rejected"}'
```

### Bulk update status (by filter)
```bash
# Publish all pending official skills
sa_rpc marketplace/bulkUpdateStatus '{"kind":"skill","status":"pending","source":"official","targetStatus":"published"}'
```

### Set featured / verified / category
```bash
sa_rpc marketplace/setFeatured  '{"id":"mpl_xxxxx","featured":1}'
sa_rpc marketplace/setVerified  '{"id":"mpl_xxxxx","verified":true}'
sa_rpc marketplace/setCategory  '{"id":"mpl_xxxxx","category":"Engineering"}'
```

### Update pricing
```bash
sa_rpc marketplace/updatePricing '{"id":"mpl_xxxxx","pricing":{"model":"free"}}'
sa_rpc marketplace/updatePricing '{"id":"mpl_xxxxx","pricing":{"model":"one_time","amount":999,"currency":"USD"}}'
```

---

## Batch Publish Skills

Upload many skills at once. Each entry maps to one `marketplace_listings` row with `kind: "skill"`.

### From a JSON file
Create a file `skills-batch.json`:
```json
{
  "skills": [
    {
      "companyId": "mpc_xxxxx",
      "name": "GitHub PR Reviewer",
      "description": "Reviews PRs and suggests improvements",
      "category": "Engineering",
      "source": "official",
      "payload": {
        "githubUrl": "https://github.com/org/skills-repo",
        "path": "skills/github-pr-reviewer"
      },
      "priceCents": 0,
      "publish": true
    },
    {
      "companyId": "mpc_xxxxx",
      "name": "SEO Analyzer",
      "description": "Analyzes pages for SEO issues",
      "category": "Marketing",
      "source": "official",
      "payload": {
        "githubUrl": "https://github.com/org/skills-repo",
        "path": "skills/seo-analyzer"
      },
      "priceCents": 0,
      "publish": false
    }
  ]
}
```

```bash
sa_rpc marketplace/batchPublishSkills "$(cat skills-batch.json)"
```

Returns: `{ "created": 2, "published": 1, "errors": [] }`

### `publish: true` vs `publish: false`
- `publish: true` → status set to `"published"` immediately (live in marketplace)
- `publish: false` (default) → status set to `"pending"` (awaiting review)

### Max batch size: 100 skills per call.

---

## Marketplace Repos

```bash
# List repos with company/listing counts
sa_rpc marketplaceRepos/list '{}'

# Add a GitHub repo
sa_rpc marketplaceRepos/create '{
  "githubUrl": "https://github.com/org/skills-repo",
  "name": "Official Skills",
  "description": "Curated official skills",
  "type": "official"
}'

# Sync a repo (re-pulls companies/listings from GitHub)
sa_rpc marketplaceRepos/sync '{"id":"mpr_xxxxx"}'

# Delete a repo
sa_rpc marketplaceRepos/delete '{"id":"mpr_xxxxx"}'
```

## Marketplace Companies

```bash
# List companies (grouped by repo)
sa_rpc marketplace/listCompanies '{"status":"pending","limit":20}'

# Approve / reject a company
sa_rpc marketplace/updateCompanyStatus '{"id":"mpc_xxxxx","status":"published"}'
sa_rpc marketplace/updateCompanyStatus '{"id":"mpc_xxxxx","status":"rejected"}'
```

---

## Typical Workflow: Add a New Skills Repo and Bulk-Publish

```
1. Add the GitHub repo
   sa_rpc marketplaceRepos/create '{"githubUrl":"...","type":"official"}'
   → note the returned repo id

2. Sync the repo (this creates companies from COMPANY.md files in the repo)
   sa_rpc marketplaceRepos/sync '{"id":"mpr_xxxxx"}'

3. List companies to get companyId values
   sa_rpc marketplace/listCompanies '{"limit":50}'

4. Approve the company
   sa_rpc marketplace/updateCompanyStatus '{"id":"mpc_xxxxx","status":"published"}'

5. Batch-publish skills
   # Build the batch JSON, then:
   sa_rpc marketplace/batchPublishSkills '{"skills":[...]}'
```

---

---

## CRM Operations

### Contacts

```bash
# List contacts (filter by search, tags, status, etc.)
sa_rpc contacts/list '{"search":"alice","limit":20}'
sa_rpc contacts/list '{"limit":50,"offset":0}'
sa_rpc contacts/list '{"emailDomain":"spam.com","limit":100}'   # strict @spam.com suffix
sa_rpc contacts/list '{"includeBanned":true,"limit":100}'        # show banned too (hidden by default)

# Get single contact detail (includes user link, outreach history)
sa_rpc contacts/get '{"id":"cnt_xxxxx"}'
sa_rpc contacts/byUserId '{"userId":"usr_xxxxx"}'

# Create / update / delete
sa_rpc contacts/create '{"email":"alice@example.com","name":"Alice","company":"Acme"}'
sa_rpc contacts/update '{"id":"cnt_xxxxx","name":"Alice Smith","tags":["vip"]}'
sa_rpc contacts/delete '{"id":"cnt_xxxxx"}'

# Ban (spam cleanup) — the contact-level equivalent of a user ban.
# Banned contacts are RETAINED (audit + dedup) but excluded from the default
# list, ALL outreach/campaign sends, and stats. Reversible via unban.
sa_rpc contacts/ban '{"id":"cnt_xxxxx","reason":"Spam"}'
sa_rpc contacts/unban '{"id":"cnt_xxxxx"}'
sa_rpc contacts/bulkBan '{"emailDomain":"spam.com","reason":"Spam domain"}'  # by domain
sa_rpc contacts/bulkBan '{"ids":["cnt_a","cnt_b"],"reason":"Manual spam triage"}'
```

**Public REST (OpenAPI, Bearer key)** — same list/ban for service-to-service jobs:
```bash
# Find spam contacts by domain (banned hidden unless includeBanned=true)
curl -s "$BASE_URL/api/v1/system-admin/crm/contacts?emailDomain=spam.com&limit=100" \
  -H "Authorization: Bearer $SYSTEM_ADMIN_API_SECRET_KEY"
# Ban / bulk-ban
curl -s -X POST "$BASE_URL/api/v1/system-admin/crm/contacts/ban" \
  -H "Authorization: Bearer $SYSTEM_ADMIN_API_SECRET_KEY" -H "Content-Type: application/json" \
  -d '{"id":"cnt_xxxxx","reason":"Spam"}'
curl -s -X POST "$BASE_URL/api/v1/system-admin/crm/contacts/bulk-ban" \
  -H "Authorization: Bearer $SYSTEM_ADMIN_API_SECRET_KEY" -H "Content-Type: application/json" \
  -d '{"emailDomain":"spam.com","reason":"Spam domain"}'

# CRM overview & stats
sa_rpc contacts/overview '{}'
sa_rpc contacts/getStats '{}'

# Contact timeline (all events: emails, replies, activities)
sa_rpc contacts/timeline '{"contactId":"cnt_xxxxx","limit":50}'

# Activities (notes, calls, meetings)
sa_rpc contacts/listActivities '{"contactId":"cnt_xxxxx","limit":20}'
sa_rpc contacts/createActivity '{"contactId":"cnt_xxxxx","type":"note","title":"Follow-up call","body":"Discussed pricing"}'
```

### Outreach Logs

```bash
# List all outreach logs (cross-contact, filterable)
sa_rpc contacts/outreach '{"limit":50,"channel":"email"}'

# Outreach detail for one log entry
sa_rpc contacts/outreachDetail '{"id":"orl_xxxxx"}'

# Contact-specific outreach history
sa_rpc contacts/outreachLogs '{"contactId":"cnt_xxxxx","limit":20}'

# Replies
sa_rpc contacts/listReplies '{"isRead":false,"limit":20}'
sa_rpc contacts/markReplyRead '{"replyId":"rep_xxxxx","isRead":true}'
sa_rpc contacts/sendReply '{
  "replyId": "rep_xxxxx",
  "toEmail": "alice@example.com",
  "subject": "Re: Your question",
  "body": "Hi Alice, thanks for reaching out..."
}'
```

### Email Preferences & Suppression

```bash
# List all email suppressions
sa_rpc contacts/listSuppressions '{"limit":50}'

# Import AWS SES permanent bounce / complaint suppressions. Usually run via the
# CSV SOP so rows are classified, batched, and sent via --data-binary @file.
# Use this inline example only for tiny manual payloads.
sa_rpc contacts/importSesSuppressions '{
  "rows": [
    {
      "email": "bad@example.com",
      "reason": "ses_hard_bounce",
      "diagnosticCode": "smtp; 550 No such recipient",
      "messageId": "010e...",
      "bounceSubType": "GENERAL",
      "lastDeliveryEvent": "PERMANENT_BOUNCE"
    }
  ]
}'

# Unsubscribe / resubscribe a sender→recipient pair
sa_rpc contacts/unsubscribeSender '{"recipientEmail":"alice@example.com","senderAddress":"noreply@app.com"}'
sa_rpc contacts/resubscribeSender '{"recipientEmail":"alice@example.com","senderAddress":"noreply@app.com"}'

# View email preferences for a contact
sa_rpc contacts/emailPreferences '{"contactId":"cnt_xxxxx"}'
```

### Data Sync

```bash
# Sync registered users → contacts
sa_rpc contacts/syncUsers '{}'
sa_rpc contacts/syncUsers '{"full":true}'  # full re-sync

# Sync from external platforms
sa_rpc contacts/syncLuma '{"maxEvents":50}'
sa_rpc contacts/syncAitable '{}'
sa_rpc contacts/syncBika '{}'

# View sync history
sa_rpc contacts/importRuns '{"limit":20}'
sa_rpc contacts/syncStates '{}'

# Toggle a sync provider on/off
sa_rpc contacts/toggleSync '{"provider":"luma","enabled":true}'
```

### Automation Journeys

```bash
# List all journeys with status & stats
sa_rpc crmAutomations/journeys '{}'

# Get journey detail (nodes, recipient runs, analytics, approvals)
sa_rpc crmAutomations/journey '{"journeyId":"welcome-sequence"}'

# Preview who will receive a journey (audience targeting)
sa_rpc crmAutomations/journeyTargetPreview '{"journeyId":"welcome-sequence","limit":25,"page":1}'

# List recipient run history for a journey
sa_rpc crmAutomations/journeyRecipientRuns '{"journeyId":"welcome-sequence","limit":50}'

# Get a single contact's run detail within a journey
sa_rpc crmAutomations/journeyRecipientDetail '{"journeyId":"welcome-sequence","contactId":"cnt_xxxxx"}'

# All journeys a contact/user has been through
sa_rpc crmAutomations/recipientJourneyRuns '{"contactId":"cnt_xxxxx","limit":50}'
```

### Journey Execution & Approval

```bash
# Run a scheduled sync (processes all due journeys)
sa_rpc crmAutomations/runScheduledSync '{}'

# Manually trigger a journey for all eligible recipients now
sa_rpc crmAutomations/runNow '{"journeyId":"welcome-sequence"}'

# Manually trigger a journey for one specific contact
sa_rpc crmAutomations/runRecipientNow '{"journeyId":"welcome-sequence","contactId":"cnt_xxxxx"}'

# ── Approval Queue ──

# List ALL pending approvals across every journey (global queue)
sa_rpc crmAutomations/listAllPendingApprovals '{"limit":50}'

# Approve an email (optionally edit draft before sending)
sa_rpc crmAutomations/approveApproval '{
  "approvalId": "apr_xxxxx",
  "draftSubject": "Welcome to the platform!",
  "draftBody": "<p>Hi {{name}}, ...</p>"
}'

# Reject an approval with a note
sa_rpc crmAutomations/rejectApproval '{"approvalId":"apr_xxxxx","note":"Wrong segment, skip this one"}'
```

### Manual Sync Triggers

```bash
# Recalculate lifecycle stages for all contacts (active / at-risk / churned)
sa_rpc crmAutomations/triggerStageSync '{}'
# Returns: { "updated": 142 }

# Update last_seen timestamps for all contacts
sa_rpc crmAutomations/triggerLastSeenSync '{}'
# Returns: { "updated": 87 }
```

### Automation Toggles

```bash
# View all automation states
sa_rpc contacts/getAutomationStates '{}'

# Pause / resume an automation
sa_rpc contacts/toggleAutomation '{"id":"auto_xxxxx","status":"paused"}'
sa_rpc contacts/toggleAutomation '{"id":"auto_xxxxx","status":"enabled"}'
```

---

## Other Systemadmin Operations

### Users
```bash
sa_rpc users/list '{"search":"alice","limit":20}'              # substring on email+name
sa_rpc users/list '{"emailDomain":"spam.com","limit":100}'     # strict @spam.com suffix
sa_rpc users/list '{"banned":true,"limit":50}'                 # only banned users
sa_rpc users/list '{"emailDomain":"spam.com","banned":false,"limit":100}' # active users on a domain
sa_rpc users/byId '{"userId":"usr_xxxxx"}'
sa_rpc users/banUser '{"userId":"usr_xxxxx","reason":"Spam"}'   # bans + revokes sessions + bans linked contact
sa_rpc users/unbanUser '{"userId":"usr_xxxxx"}'                 # lifts the ban + unbans linked contact
```

Banning a user **cascades to their linked CRM contact** (matched by userId or email) —
one action bans the login AND stops all outreach. Unban reverses both. This cascade is
shared logic, so it applies to the OpenAPI `users/ban` too.

**Ban a spam email domain (search → review → ban one-by-one):**
Use the production-ready SOP: `references/bulk-ban-users-by-email-domain.md`.

`search` is a substring match (matches anywhere in email/name); `emailDomain` is a strict
`@domain` suffix — prefer it when targeting a whole domain for cleanup.

**Ban vs delete:** prefer **ban** for spam/abuse — it sets `banned=true`, stores the
reason, and immediately revokes every active session, but keeps the account and its data
(reversible via `unbanUser`). Deletion is a separate, irreversible security-cleanup path.
Both `banUser`/`unbanUser` throw `NOT_FOUND` for an unknown `userId` and are audit-logged
to `system_logs` (`action: ban_user` / `unban_user`, `category: security`).

**Public REST (OpenAPI, Bearer key — no admin session needed):** the same ban/unban is
also exposed on the system-admin OpenAPI surface for service-to-service automation:
```bash
curl -s -X POST "$BASE_URL/api/v1/system-admin/users/ban" \
  -H "Authorization: Bearer $SYSTEM_ADMIN_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"usr_xxxxx","reason":"Spam"}'
curl -s -X POST "$BASE_URL/api/v1/system-admin/users/unban" \
  -H "Authorization: Bearer $SYSTEM_ADMIN_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"usr_xxxxx"}'
```
API-initiated bans are logged with a null actor (`newValue.via: "openapi"`).

### Spaces
```bash
sa_rpc spaces/list '{"limit":20}'
sa_rpc spaces/byId '{"spaceId":"spc_xxxxx"}'
sa_rpc spaces/updatePlan '{"spaceId":"spc_xxxxx","plan":"pro"}'
```

### Waitlist
```bash
sa_rpc waitlist/list '{"status":"pending","limit":50}'
sa_rpc waitlist/approveAndSendCode '{"id":"wl_xxxxx"}'
sa_rpc waitlist/getStats '{}'
```

### Growth stats
```bash
sa_rpc growth/scoreboard '{}'
sa_rpc growth/trends '{}'
sa_rpc growth/aiUsage '{}'
```

### Invite codes
```bash
sa_rpc inviteCodes/list '{"limit":20}'
sa_rpc inviteCodes/generate '{"count":5}'
sa_rpc inviteCodes/getStats '{}'
```

### Redemption codes
```bash
sa_rpc systemRedemptionCodes/list '{"limit":20}'
sa_rpc systemRedemptionCodes/generate '{"rewardType":"plan","planType":"pro","durationDays":30,"count":10}'
```

### System flags (feature flags)
```bash
sa_rpc systemFlags/list '{}'
sa_rpc systemFlags/update '{"key":"some_flag","enabled":true}'
```

---

## App-specific URLs

| App | Default dev URL |
|-----|----------------|
| buda | http://localhost:3000 |
| productready | http://localhost:3001 |
| npschimp | http://localhost:3002 |

Set `BASE_URL` to the target app's URL before running commands.

---

## Notes

- **No hard-delete on the public OpenAPI surface (by design).** `/api/v1/system-admin/*`
  exposes **ban / unban** for both **users** and **contacts** (reversible, audit-logged) plus
  powerful read/search — but deliberately exposes **no DELETE** for users or contacts. To get
  rid of spam, **ban it, don't delete it** (retain for audit + dedup; reversible). Hard delete
  (`contacts/delete`) exists only on the internal admin-session RPC, not the Bearer-key API.
  If a destructive op is ever needed over the API, prefer a soft-delete-style endpoint.
- **Ban + search cheat-sheet (users & contacts, both transports):**
  - Users — `users/list {search|emailDomain|banned}` → `users/ban {userId,reason}` / `users/unban {userId}`.
    Banning a user **also bans their linked contact** (and unban lifts it) — shared logic, OpenAPI included.
  - Contacts — `contacts/list {search|emailDomain|status|source|includeBanned}` →
    `contacts/ban {id,reason}` / `contacts/unban {id}` / `contacts/bulkBan {ids|emailDomain,reason}`.
  - `emailDomain` is a strict `@domain` suffix (clean domain targeting); `search` is a loose substring.
- All mutations are audit-logged to `system_logs` with the admin's userId, IP, and user agent.
- The `payload` field on listings is JSONB — store any skill config snapshot there (githubUrl, path, version, tags, etc.).
- `priceCents` is denormalized from `pricing.amount` — keep them consistent.
- Categories: Engineering, Marketing, Sales, Operations, Research, Finance, HR, Customer Support, Data & Analytics, System.
