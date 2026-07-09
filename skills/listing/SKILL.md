---
name: listing
description: Marketplace listing publisher for Buda GTM commerce data. Use when creating, reviewing, exporting, or preparing product listings for Taobao, Douyin, Xiaohongshu, Shopify, website, or other storefronts from /kit/gtm ChannelListing data. Starts with draft and assisted-publish workflows; use API publishing only when credentials and platform permissions are explicitly available.
allowed-tools: Bash(*), Read, Edit, Write, Glob, Grep
user-invocable: true
---

# /listing — Marketplace Listing Publisher

Use this skill to turn `/kit/gtm` commerce catalog data into platform-ready listing assets, especially for storefronts with public marketplace or launch discovery traffic.

`/gtm` owns strategy and the canonical commerce model. `/listing` executes publishing work from that model.

## Source Of Truth

Read the GTM commerce files first:

```bash
cat apps/buda/src/domains/gtm/data/index.ts
cat apps/buda/src/domains/gtm/data/core.ts
cat apps/buda/src/domains/gtm/data/storefronts.ts
cat apps/buda/src/domains/gtm/data/offers.ts
cat apps/buda/src/domains/gtm/data/channel-listings.ts
```

For ICP language and buyer context, read only the relevant ICP files from:

```bash
ls apps/buda/src/domains/gtm/data/icps
cat apps/buda/src/domains/gtm/data/icps/<icp-id>.ts
```

Do not invent product facts that belong in GTM data. If a listing needs a new price, SKU, offer, store, fulfillment rule, or compliance caveat, update `apps/buda/src/domains/gtm/data/**` first.

## Modes

## Traffic Priority

When the user asks for "国外", "海外", "公域流量", "marketplace", or "where to list", prioritize `trafficTier` before API convenience:

1. `marketplace-public` — AppSumo, Etsy, Carousell, Taobao, Douyin, Xiaohongshu. These can bring platform discovery/search traffic.
2. `launch-discovery` — Product Hunt. Not checkout, but strong launch/referral traffic.
3. `service-marketplace` — Fiverr, Upwork. Sell implementation outcomes, not raw SaaS seats.
4. `enterprise-procurement` — AWS/Azure/Google marketplaces. Strong B2B procurement, slower approvals.
5. `owned-store` — Website, Shopify, Lemon Squeezy, Gumroad checkout. Best APIs, but weak public discovery unless paired with ads/content/launch.

Do not rank Shopify above public marketplaces when the user's goal is organic marketplace discovery.

Suggested overseas order for Buda:

- P0: AppSumo deal and Product Hunt launch.
- P1: Fiverr/Upwork service listings, Etsy digital templates, Carousell HK assisted listing.
- P2: AWS Marketplace for Sandock/MoonRouter/Buda enterprise.
- Owned checkout: website, Shopify, Lemon Squeezy, Gumroad after the traffic source is chosen.

### Draft

Default mode. Generate a platform-ready listing package without touching a seller backend.

Use when the user asks things like:

```bash
/listing taobao-moonrouter-safe-ai-model-gateway
/listing appsumo-buda-ai-agent-workspace-deal
/listing product-hunt-buda-moonrouter-launch
/listing draft taobao-buda-credits
/listing for AI寻宝阁 MoonRouter
/listing overseas public traffic
```

Produce:

- Platform and storefront
- Traffic tier and why this listing should be prioritized
- Product/SPU, offer, SKU variants, price table
- Final title options, with one recommended title
- Category suggestion
- Short selling points
- Detail page copy sections
- Main image and detail image briefs
- Fulfillment workflow and buyer inputs
- After-sale and refund boundary
- Compliance notes and sensitive wording risks
- Checklist for publishing

For Taobao digital services, always include:

- Account email or account binding requirement
- Delivery timing
- Virtual service refund caveat
- Availability caveat for model/provider claims when applicable
- Clear variant names and prices

For overseas public marketplace listings, adapt the package to the platform:

- AppSumo: deal positioning, founder/SMB pain, annual or lifetime-like terms, proof assets, refund terms.
- Product Hunt: launch tagline, gallery/story, maker comment, CTA routing, launch-day reply plan.
- Etsy: downloadable template/checklist/prompt-pack language, digital delivery, search keywords.
- Fiverr/Upwork: service packages, scope boundaries, deliverables, timeline, portfolio proof.
- Carousell HK/SG: local service wording, assisted manual publishing, buyer chat flow, no public API assumption.

### Assisted

Use when the user asks to open a platform backend, fill seller forms, or help publish manually.

Rules:

- Use browser automation only when the user is already authenticated or explicitly provides the target backend URL.
- Fill fields from `ChannelListing`, `Offer`, `Product`, and `SKU`.
- Stop before final publish/payment/irreversible submission unless the user explicitly confirms.
- If the platform UI requires data that is not in GTM, capture the missing field and suggest the GTM data update.

### API Publish

Only use when the user explicitly asks for API publishing and the repo/env has credentials and platform permissions.

Rules:

- Verify API docs and current permission requirements before implementing or calling platform APIs.
- Never assume Taobao, Douyin, Xiaohongshu, or Shopify write permissions exist.
- Prefer a dry-run payload first.
- Log the listing id, platform response id, and any platform validation errors.

Taobao notes:

- Product publishing usually needs leaf category, required item properties, SKU properties, images, price, stock, and seller authorization.
- Some APIs and categories require explicit permissions or merchant qualifications.
- If permissions are missing, fall back to Draft or Assisted mode.

## Workflow

1. Identify listing target:
   - Direct `ChannelListing.id`, or
   - `storefrontId + productId`, or
   - fuzzy match from product/channel words in the user request.
2. Load linked objects:
   - `ChannelListing`
   - `CommerceStorefront`
   - `GTMProduct`
   - `CommerceOffer` when `offerId` exists
   - all SKU variants referenced by `variants[].skuId` and offer items
   - target ICP files if `targetIcpIds` are present
3. Validate publishing readiness:
   - Has storefront and channel
   - Has product and at least one variant
   - Has title and description in the target language
   - Has price or clear custom-pricing instruction for each variant
   - Has fulfillment instructions
   - Has required buyer inputs
   - Has after-sale/refund boundary for virtual services
4. Produce the listing package or assisted-publish steps.
5. If you change GTM data or create listing assets in the repo, add/update an app changelog.

## Output Shape

For Draft mode, keep output practical and directly pasteable:

```markdown
**Listing**
- Platform:
- Storefront:
- Recommended title:
- Category:

**Variants**
| Variant | SKU | Price | Fulfillment |

**Detail Page**
1. ...

**Images**
- Main image:
- Detail images:

**Publishing Checklist**
- ...
```

When the user asks for a file, write a Markdown draft under:

```text
apps/buda/content/gtm/listings/YYYYMMDD-<listing-id>.md
```

Create the directory if needed. Keep generated listing drafts out of GTM data unless they change the canonical catalog.

## Platform Voice

- Taobao: concrete, transactional, trust-building. Emphasize what buyer receives, how delivery works, refund boundary, and buyer inputs.
- Douyin: short-video friendly. Include content angles, simple benefit language, and live-commerce handoff.
- Xiaohongshu: lifestyle/workflow proof, use cases, before/after, buyer story.
- Shopify/website: concise product-led copy, SEO title, handle, FAQ, structured data hints.

## Guardrails

- Do not publish or submit irreversible changes without explicit user confirmation.
- Do not claim a model, provider, feature, delivery time, or compliance status unless it exists in GTM data or the user explicitly provided it.
- Keep Product/SPU, SKU, Offer, Listing, and Storefront separate. Do not turn platform fields into canonical SKU data.
- Prefer updating `ChannelListing.platformFields` for platform-specific needs.
- Preserve existing listing ids and SKU ids unless the user asks for a rename.
