# SOP: Import SES Suppressions From CSV

Use this SOP when AWS SES exports bounce/complaint rows and Buda should suppress
those recipients globally before future CRM automation journeys or campaigns run.
This workflow uses the internal oRPC systemadmin API with a logged-in system
admin cookie.

## When To Use

- SES reports permanent bounces, account-level suppression hits, or complaints.
- You want future CRM marketing sends to skip those recipients for every sender.
- You want an idempotent, audit-friendly import that preserves the original SES
  diagnostic text in metadata.

Do not use this SOP for transient bounces. A temporary provider policy rejection
or mailbox issue should not automatically suppress the recipient forever.

## Behavior

The import writes global CRM email suppressions into `crm_email_preferences`:

- `senderAddress`: `__global__`
- `topic`: `crm_marketing`
- `status`: `unsubscribed`
- `source`: `ses_csv_import`
- `reason`: one of `ses_hard_bounce`, `ses_complaint`, `ses_suppression`

Automation journeys and manual/batch CRM email sends check both the real sender
and `__global__` before sending. If a recipient is globally suppressed, the send
is skipped and an `outreach_logs` row is recorded with `status: "suppressed"`.

## Supported SES CSV Columns

The importer script below supports the SES export shape currently used by Buda:

- `messageid`
- `sendtimestamp`
- `isp`
- `fromaddress`
- `destination`
- `subject`
- `last_delivery_event`
- `last_engagement_event`
- `last_delivery_event_timestamp`
- `last_engagement_event_timestamp`
- `bounce_sub_type`
- `diagnostic_code`
- `opened`
- `clicked`
- `delivered`
- `bounced`
- `complained`

Reason classification uses structured fields, not provider-specific diagnostic
text:

- `complained=TRUE` → `ses_complaint`
- `bounce_sub_type=ON_ACCOUNT_SUPPRESSION_LIST` → `ses_suppression`
- `bounced=TRUE` and `last_delivery_event=PERMANENT_BOUNCE` → `ses_hard_bounce`
- `TRANSIENT_BOUNCE` and unrecognized rows are skipped

The full original `diagnostic_code` is preserved in each row's `metadata`.

## Setup

Log in to the target environment as a system admin, then copy the full Cookie
header from a browser Network request to `/api/rpc/...`.

```bash
export BASE_URL="https://buda.im"
export CSV_FILE="/tmp/aitable-ses-退信.csv"
export COOKIE='__Secure-better-auth.session_token=<value>'
```

Use this oRPC helper:

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
sa_rpc contacts/listSuppressions '{"limit":1}'
```

## Convert CSV To Import Payloads

Convert the SES CSV into JSONL batches. Each line is one request body for
`contacts/importSesSuppressions`.

```bash
python - "$CSV_FILE" > /tmp/ses-suppressions-batches.jsonl <<'PY'
import csv
import json
import sys

csv_file = sys.argv[1]
batch_size = 500

def truthy(value):
    return str(value or "").strip().upper() in {"TRUE", "1", "YES", "Y"}

def classify(row):
    if truthy(row.get("complained")):
        return "ses_complaint"
    if str(row.get("bounce_sub_type") or "").strip().upper() == "ON_ACCOUNT_SUPPRESSION_LIST":
        return "ses_suppression"
    if truthy(row.get("bounced")) and str(row.get("last_delivery_event") or "").strip().upper() == "PERMANENT_BOUNCE":
        return "ses_hard_bounce"
    return None

rows = []
with open(csv_file, newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for raw in reader:
        reason = classify(raw)
        email = (raw.get("destination") or "").strip()
        if not reason or not email:
            continue
        rows.append({
            "email": email,
            "reason": reason,
            "diagnosticCode": raw.get("diagnostic_code") or None,
            "messageId": raw.get("messageid") or None,
            "source": "ses_csv_import",
            "bounceSubType": raw.get("bounce_sub_type") or None,
            "lastDeliveryEvent": raw.get("last_delivery_event") or None,
            "lastDeliveryEventTimestamp": raw.get("last_delivery_event_timestamp") or None,
            "fromAddress": raw.get("fromaddress") or None,
            "subject": raw.get("subject") or None,
            "metadata": {
                "sendTimestamp": raw.get("sendtimestamp") or None,
                "isp": raw.get("isp") or None,
                "lastEngagementEvent": raw.get("last_engagement_event") or None,
                "lastEngagementEventTimestamp": raw.get("last_engagement_event_timestamp") or None,
                "opened": raw.get("opened") or None,
                "clicked": raw.get("clicked") or None,
                "delivered": raw.get("delivered") or None,
                "bounced": raw.get("bounced") or None,
                "complained": raw.get("complained") or None,
                "rawRow": raw,
            },
        })

for i in range(0, len(rows), batch_size):
    print(json.dumps({"rows": rows[i:i + batch_size]}, ensure_ascii=False))
PY
```

Preview batch count and first batch summary:

```bash
wc -l /tmp/ses-suppressions-batches.jsonl
head -n 1 /tmp/ses-suppressions-batches.jsonl | jq '{
  rows: (.rows | length),
  reasons: (.rows | group_by(.reason) | map({reason: .[0].reason, count: length}))
}'
```

## Execute Import

Import every batch. Do **not** pass the large JSON batch through `sa_rpc` or a
shell variable:

- `sa_rpc contacts/importSesSuppressions "$payload"` can arrive as malformed
  input (`rows` missing) when payloads are large.
- `curl --data-binary "$payload"` can fail with `Argument list too long`.

Write the oRPC payload to a file and use `--data-binary @file`:

```bash
rm -f /tmp/ses-suppressions-import-results.jsonl

i=0
while IFS= read -r batch; do
  i=$((i + 1))
  printf '%s\n' "$batch" > /tmp/ses-current-batch.json
  jq -c '{json: .}' /tmp/ses-current-batch.json > /tmp/ses-current-payload.json

  echo "Importing batch $i..."
  curl -s -X POST "$BASE_URL/api/rpc/systemAdmin/contacts/importSesSuppressions" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE" \
    --data-binary @/tmp/ses-current-payload.json \
    | tee -a /tmp/ses-suppressions-import-results.jsonl \
    | jq .
done < /tmp/ses-suppressions-batches.jsonl
```

Summarize results:

```bash
jq -s '{
  batches: length,
  scanned: map(.json.scanned // 0) | add,
  imported: map(.json.imported // 0) | add,
  updated: map(.json.updated // 0) | add,
  skipped: map(.json.skipped // 0) | add,
  invalid: map(.json.invalid // 0) | add,
  errors: [.[] | select(.json.code != null)]
}' /tmp/ses-suppressions-import-results.jsonl
```

If you tested one batch first and then ran the full import, expect mixed
`imported` / `updated` counts. For example, a 992-row import may summarize as
`imported: 492, updated: 500`; that is successful idempotent behavior as long
as `errors` is empty.

## Verify

Search a known suppressed recipient:

```bash
sa_rpc contacts/listSuppressions '{"search":"person@example.com","status":"unsubscribed","limit":20}' \
  | jq -r '.json.items[] | [.recipientEmail, .senderAddress, .reason, .source] | @tsv'
```

The row should show `senderAddress` as `__global__`. A future CRM send to that
recipient should create an `outreach_logs` row with `status: "suppressed"` and
should not call the email provider.

## Rollback

Restore one false positive by recipient and global sender:

```bash
sa_rpc contacts/resubscribeSender '{"recipientEmail":"person@example.com","senderAddress":"__global__"}'
```

## Notes

- Re-running the same import is safe. Existing global suppression rows are
  updated with the latest metadata instead of duplicated.
- `diagnostic_code` is provider-specific and can be multi-line; it is stored as
  metadata, not used as the stable suppression reason.
- Keep user-initiated unsubscribe separate from SES suppression. Unsubscribe is
  usually sender/topic scoped; hard bounces and complaints are global.
