# Reddit Ads API v3 Reference

Use this file as a routing guide, not as a frozen API spec. Reddit Ads API fields, enums, ad formats, policies, and rate limits can change. Browse the official docs for task-specific details before generating or executing API calls.

## Official Sources

- Reddit Ads API v3 docs: https://ads-api.reddit.com/docs/v3/
- Official Postman workspace: https://www.postman.com/reddit-ads-api/reddit-ads-api-v3/overview
- Reddit Ads API help page: https://business.reddithelp.com/s/article/Reddit-Ads-API
- Create a Reddit application: https://business.reddithelp.com/s/article/Create-a-Reddit-Application
- Reddit Ads API Terms: https://business.reddithelp.com/s/article/Reddit-Ads-API-Terms
- Reddit Advertising Policy overview: https://business.reddithelp.com/s/article/Reddit-Advertising-Policy-Overview
- Ad unit specifications: https://business.reddithelp.com/s/article/Reddit-Ad-Unit-Specifications
- Creative best practices: https://business.reddithelp.com/s/article/Creative-Best-Practices
- Reddit Pixel: https://business.reddithelp.com/s/article/reddit-pixel
- Conversions API: https://business.reddithelp.com/s/article/Conversions-API

## Current High-Level Facts To Verify

- Base URL is expected to be `https://ads-api.reddit.com/api/v3`.
- OAuth bearer tokens are required.
- Use read scopes for GET/reporting and manage scopes for create/update/delete operations. Verify exact scope names in the current docs before requesting or using tokens.
- The official Postman workspace describes campaign setup as campaign, ad group, post, then ad creation.
- List endpoints are paginated. Follow returned pagination URLs directly instead of reconstructing query parameters.
- HTTP 429 means rate limited. Implement exponential backoff and inspect rate-limit headers.
- Ad creation is subject to Ads API Terms, Ads Policy, account permissions, review, and billing/account status.

## Safe API Execution Pattern

1. Never place secrets in files. Read tokens from environment variables or a local ignored secrets store.
2. Start with GET calls:
   - Identify accessible accounts.
   - List existing campaigns/ad groups/ads to avoid duplicates.
   - Pull recent reports to establish baselines.
3. Save raw, non-secret evidence:
   - Endpoint path.
   - Timestamp.
   - Request body with secrets removed.
   - Response body.
   - Created or referenced resource IDs.
4. Generate dry-run payload files before write calls.
5. Present an exact confirmation summary before writes.
6. After writes, immediately GET created resources and save verification responses.

## Payload File Naming

Use predictable names in `data/raw/YYYY-MM-DD/reddit-ads/<slug>/payloads/`:

```text
01_campaign.dry-run.json
02_ad_group_<audience>.dry-run.json
03_post_<creative>.dry-run.json
04_ad_<creative>_<audience>.dry-run.json
execution_manifest.json
```

After confirmed execution, save responses:

```text
responses/01_campaign.create.response.json
responses/02_ad_group_<audience>.create.response.json
responses/verify_<resource_id>.json
```

## Reporting Pattern

Pull reports with enough grouping to answer the decision:

- Daily pacing: date, campaign.
- Audience decisions: campaign, ad group, date.
- Creative decisions: ad, post or creative resource, date.
- Placement/device decisions: include placement/device dimensions when available.

Normalize reports to CSV under `data/processed/YYYY-MM-DD/reddit-ads/<slug>/` only after raw responses are saved.

## Refuse Or Pause

Pause and ask for confirmation when:

- The user asks to launch, enable, increase budget, expand targeting, or delete ads.
- Required account, budget, date, destination, or objective is missing.
- API docs conflict with local assumptions.
- A category may be restricted or regulated.
- Pixel/CAPI verification is missing for conversion campaigns.
- The API returns permission, billing, policy, or review errors.
