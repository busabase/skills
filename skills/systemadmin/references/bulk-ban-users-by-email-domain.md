# SOP: Bulk Ban Users By Email Domain

Use this SOP when spam or abuse accounts share an email domain and need to be
blocked in Buda systemadmin. This workflow uses the internal oRPC systemadmin
API with a logged-in system admin cookie.

## When To Use

- You need to ban many user accounts from one exact email domain.
- You want bans to cascade to matching CRM contacts, stopping outreach.
- You want reversible, audit-logged cleanup instead of hard deletion.

Do not use this SOP for broad substring searches. `emailDomain` is a strict
suffix match: `web-library.net` matches `user@web-library.net`, not
`user@fake-web-library.net.cn`.

## Setup

Log in to the target environment as a system admin, then copy the full Cookie
header from a browser Network request to `/api/rpc/...`.

```bash
export BASE_URL="https://buda.im"
export TARGET_DOMAIN="web-library.net"
export COOKIE='__Secure-better-auth.session_token=<value>'
```

Cookie names differ by environment:

- Local HTTP / localhost: `better-auth.session_token`
- Production HTTPS: `__Secure-better-auth.session_token`

The safest production option is to copy the full `Cookie` request header from a
browser Network request to `/api/rpc/...`, including companion cookies such as
`__Secure-better-auth.session_data` when present.

Use this oRPC helper. It wraps input as `{ "json": ... }`, which is required by
the current oRPC transport. Do not use `local body="${2:-{}}"`; bash appends an
extra `}` in this context and creates malformed JSON.

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

Smoke-test the cookie before changing data:

```bash
sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"limit\":1}"
```

## Preview

Check total matching users and how many are already banned:

```bash
sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"limit\":100}" \
  | tee "/tmp/users-$TARGET_DOMAIN-preview.json" \
  | jq '{
      total: .json.total,
      returned: (.json.users | length),
      bannedInPage: ([.json.users[] | select(.banned == true)] | length),
      activeInPage: ([.json.users[] | select(.banned != true)] | length)
    }'
```

Preview active users only:

```bash
sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"banned\":false,\"limit\":100}" \
  | jq -r '.json.users[] | [.id, .email, (.banned|tostring), .createdAt] | @tsv'
```

If `total` is larger than `100`, preview with offsets before acting:

```bash
for offset in 0 100 200 300 400 500 600 700 800 900; do
  echo "=== offset $offset ==="
  sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"banned\":false,\"limit\":100,\"offset\":$offset}" \
    | jq -r '.json.users[] | [.id, .email, (.banned|tostring), .createdAt] | @tsv'
done
```

## Execute Ban

Ban the first page of active users:

```bash
sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"banned\":false,\"limit\":100}" \
  | jq -r '.json.users[] | .id' \
  | while read -r user_id; do
      echo "Banning $user_id"
      sa_rpc users/banUser "{\"userId\":\"$user_id\",\"reason\":\"Spam domain $TARGET_DOMAIN\"}" \
        | tee -a "/tmp/ban-$TARGET_DOMAIN-results.jsonl"
    done
```

For more than one page, repeat in batches until there are no active users left.
Because each batch removes users from the `banned:false` result set, it is safe
to rerun the first-page command repeatedly:

```bash
while true; do
  remaining="$(
    sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"banned\":false,\"limit\":100}" \
      | tee "/tmp/users-$TARGET_DOMAIN-next-batch.json" \
      | jq '.json.users | length'
  )"

  if [ "$remaining" -eq 0 ]; then
    echo "No active users remain for $TARGET_DOMAIN"
    break
  fi

  jq -r '.json.users[] | .id' "/tmp/users-$TARGET_DOMAIN-next-batch.json" \
    | while read -r user_id; do
        echo "Banning $user_id"
        sa_rpc users/banUser "{\"userId\":\"$user_id\",\"reason\":\"Spam domain $TARGET_DOMAIN\"}" \
          | tee -a "/tmp/ban-$TARGET_DOMAIN-results.jsonl"
      done
done
```

## Verify

No active users should remain:

```bash
sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"banned\":false,\"limit\":100}" \
  | jq '{remaining: .json.total, returned: (.json.users | length)}'
```

Previously matching users should now be banned:

```bash
sa_rpc users/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"banned\":true,\"limit\":100}" \
  | jq -r '.json.users[] | [.id, .email, (.banned|tostring), .updatedAt] | @tsv'
```

Check the CRM contact cascade. Banning a user also bans matching CRM contacts by
`userId` or email:

```bash
sa_rpc contacts/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"includeBanned\":true,\"limit\":100}" \
  | jq -r '.json.contacts[] | [.id, .email, (.bannedAt // "active"), (.bannedReason // "")] | @tsv'
```

The default contact list should no longer include banned contacts:

```bash
sa_rpc contacts/list "{\"emailDomain\":\"$TARGET_DOMAIN\",\"limit\":100}" \
  | jq -r '.json.contacts[] | [.id, .email, (.bannedAt // "active")] | @tsv'
```

## Rollback

Unban a user if a false positive is found. This also lifts the ban on matching
CRM contacts:

```bash
sa_rpc users/unbanUser '{"userId":"usr_xxxxx"}'
```

## Notes

- Prefer ban over delete for spam cleanup. It is reversible, audit-logged, and
  preserves data needed for deduplication.
- `users/list { "banned": false }` must return only active users. If banned
  users appear in that result, stop and fix the server filter before continuing.
- Public `/api/v1/system-admin/...` Bearer-key OpenAPI is intended for
  automation, but verify that the runtime router is mounted in the target
  environment before relying on it.
