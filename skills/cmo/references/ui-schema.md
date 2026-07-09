# Ads App UI Schema

The local app is a platform-first review workspace. Google Ads and Reddit Ads are the source of truth. Local files under `app/.data/` are only short-lived snapshot cache, proposal diffs, approvals, and execution/verification reports.

## Files

- `app/.data/platform_snapshot.json`: short-lived read-only status cache from Google Ads and Reddit Ads.
- `app/.data/current_batch.json`: optional proposal diffs, written only after the agent creates real diffs.
- `app/.data/decisions.json`: optional launch/readiness decisions, written only after human review.
- `app/.data/execution_report.json`: dry-run, write, or read-back verification report written by the skill.
- `app/.data/agent.lock`: temporary lock while the skill writes files.

## Platform Snapshot Shape

```json
{
  "source": "platform",
  "generated_at": "ISO timestamp",
  "updated_at": "ISO timestamp",
  "platforms": {
    "google": {
      "status": "not_synced|synced|blocked",
      "account_id": "",
      "account_name": "",
      "synced_at": "ISO timestamp",
      "metrics_window": "last_30_days",
      "campaign_count": 0,
      "campaigns": [
        {
          "id": "",
          "name": "",
          "status": "",
          "channel": "",
          "metrics": {
            "impressions": 0,
            "clicks": 0,
            "cost": 0,
            "conversions": 0
          }
        }
      ],
      "blockers": []
    },
    "reddit": {
      "status": "not_synced|synced|blocked",
      "account_id": "",
      "account_name": "",
      "synced_at": "ISO timestamp",
      "metrics_window": "platform_default",
      "campaign_count": 0,
      "campaigns": [],
      "blockers": []
    }
  }
}
```

`campaigns` should usually be empty to avoid local data retention. Use it only for a small UI sample when `sync_platforms.mjs --include-campaigns` is explicitly requested.

## Batch Shape

```json
{
  "batch_id": "ads-20260626-120000",
  "generated_at": "ISO timestamp",
  "source": "ads",
  "mode": "app-in-skill",
  "campaign": { "status": "platform_snapshot_required" },
  "proposals": [
    {
      "id": "google-snapshot-analysis",
      "platform": "google|reddit",
      "type": "platform_analysis|campaign_create|campaign_update|pause|budget_change|creative_test",
      "title": "",
      "summary": "",
      "status": "draft|approved|running|blocked|done",
      "account": "",
      "budget": "",
      "risk": "",
      "next_step": "",
      "evidence": []
    }
  ]
}
```

## Decision Shape

```json
{
  "batch_id": "ads-20260626-120000",
  "updated_at": "ISO timestamp",
  "decision": {
    "action": "approve_dry_run|request_changes|block_launch",
    "comment": "",
    "decided_at": "ISO timestamp"
  }
}
```

`approve_dry_run` means the proposal diff is ready for the skill to generate dry-run payloads. It does not authorize live writes or spend.
