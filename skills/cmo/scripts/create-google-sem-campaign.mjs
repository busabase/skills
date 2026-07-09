#!/usr/bin/env node
/**
 * create-google-sem-campaign.mjs
 * Create a Google Ads SEARCH (SEM) Campaign from a Buda GTM ICP.
 *
 * Config source: apps/buda/src/domains/gtm/data/icps/<icp-id>.ts (sem block).
 * Landing page: icp.landingCopy.hero.primaryCta.href > first absolute icp.funnels[].url.
 *
 * Usage:
 *   node .agents/skills/cmo/scripts/create-google-sem-campaign.mjs --icp seo-marketer
 *   node .agents/skills/cmo/scripts/create-google-sem-campaign.mjs --icp seo-marketer --dry-run
 *   node .agents/skills/cmo/scripts/create-google-sem-campaign.mjs --icp seo-marketer --force
 *   node .agents/skills/cmo/scripts/create-google-sem-campaign.mjs --icp seo-marketer \
 *     --daily-budget 20 --regions US,TW,HK --language en --landing-page https://buda.app/seo
 *
 * Requires (only when not --dry-run):
 *   - GOOGLE_ADS_DEVELOPER_TOKEN
 *   - GOOGLE_ADS_CUSTOMER_ID (format: xxx-xxx-xxxx)
 *   - ~/.config/google-ads/client_secret.json
 *   - pnpm add -w googleapis google-ads-api
 */

import fs from "node:fs";
import path from "node:path";
import {
  GEO_TARGET_IDS,
  getCustomer,
  getCustomerId,
  getDeveloperToken,
  getOAuthClient,
  LANGUAGE_CRITERION_IDS,
  toMicros,
} from "../lib/google-ads-client.mjs";
import { listICPIds, loadICP, resolveLandingPage } from "../lib/icp-loader.mjs";
import {
  LEGACY_ADS_SEM_STATE_PATH,
  LEGACY_GOOGLE_SEM_STATE_PATH,
  SEM_STATE_PATH,
} from "../lib/paths.mjs";

const STATE_FILE = SEM_STATE_PATH;
const STATE_FALLBACKS = [STATE_FILE, LEGACY_GOOGLE_SEM_STATE_PATH, LEGACY_ADS_SEM_STATE_PATH];

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const hasFlag = (flag) => args.includes(flag);

const icpId = get("--icp");
const dryRun = hasFlag("--dry-run");
const force = hasFlag("--force");
const dailyBudget = Number(get("--daily-budget", "10"));
const regionsArg = get("--regions", "US,TW,HK,SG");
const language = get("--language", "en");
const landingOverride = get("--landing-page");

if (!icpId) {
  console.error(
    [
      "Usage: node create-google-sem-campaign.mjs --icp <icp-id> [options]",
      "",
      "Required:",
      "  --icp <id>            ICP id, e.g. seo-marketer",
      `                        Available: ${listICPIds().join(", ")}`,
      "",
      "Options:",
      "  --dry-run             Preview the plan without calling the API",
      "  --force               Re-create campaign even if one exists in state",
      "  --daily-budget <n>    USD/day, default 10 (min 1)",
      "  --regions <list>      Comma-separated ISO codes, default US,TW,HK,SG",
      "  --language <code>     Audience language, default en",
      "  --landing-page <url>  Override ICP's landing page",
      "",
      "Env (required without --dry-run):",
      "  GOOGLE_ADS_DEVELOPER_TOKEN",
      "  GOOGLE_ADS_CUSTOMER_ID (xxx-xxx-xxxx)",
    ].join("\n"),
  );
  process.exit(1);
}

// ── Load ICP + validate ───────────────────────────────────────────────────────
let icp;
try {
  icp = loadICP(icpId);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

const sem = icp.sem ?? {};
const errors = [];
if (!Array.isArray(sem.keywords) || sem.keywords.length === 0) {
  errors.push("icp.sem.keywords must be a non-empty array");
}
if (!Array.isArray(sem.adCopy?.headlines) || sem.adCopy.headlines.length < 3) {
  errors.push("icp.sem.adCopy.headlines must have at least 3 entries (RSA minimum)");
}
if (!Array.isArray(sem.adCopy?.descriptions) || sem.adCopy.descriptions.length < 2) {
  errors.push("icp.sem.adCopy.descriptions must have at least 2 entries (RSA minimum)");
}
if (!(dailyBudget >= 1)) errors.push(`--daily-budget must be at least 1 (got ${dailyBudget})`);

const regions = regionsArg
  .split(",")
  .map((r) => r.trim().toUpperCase())
  .filter(Boolean);
const unknownRegions = regions.filter((r) => !GEO_TARGET_IDS[r]);
if (unknownRegions.length > 0) {
  errors.push(
    `Unknown region codes: ${unknownRegions.join(", ")}. Add them to GEO_TARGET_IDS in lib/google-ads-client.mjs.`,
  );
}

if (!LANGUAGE_CRITERION_IDS[language]) {
  errors.push(
    `Unknown language: ${language}. Available: ${Object.keys(LANGUAGE_CRITERION_IDS).join(", ")}`,
  );
}

const landingPage = landingOverride ?? resolveLandingPage(icp);
if (!landingPage) {
  errors.push(
    "No landing page. Set icp.landingCopy.hero.primaryCta.href, add an absolute icp.funnels[].url, or pass --landing-page.",
  );
}

if (errors.length) {
  console.error(`❌ Invalid SEM config for "${icpId}":`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// Cap to RSA limits (Google enforces these hard)
const headlines = sem.adCopy.headlines.slice(0, 15);
const descriptions = sem.adCopy.descriptions.slice(0, 4);

// ── State ─────────────────────────────────────────────────────────────────────
function loadState() {
  for (const stateFile of STATE_FALLBACKS) {
    if (!fs.existsSync(stateFile)) continue;
    try {
      return JSON.parse(fs.readFileSync(stateFile, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}
function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

const state = loadState();
const existing = state[icpId];

if (existing?.campaignId && !force && !dryRun) {
  console.log(`⏭  Campaign already exists for "${icpId}": ${existing.campaignId}`);
  console.log(`   Created ${existing.createdAt}. Use --force to re-create.`);
  process.exit(0);
}

// ── Print plan ────────────────────────────────────────────────────────────────
const campaignName = `[Buda SEM] ${icpId} — ${new Date().toISOString().slice(0, 10)}`;
const byMatch = sem.keywords.reduce((acc, k) => {
  const mt = (k.matchType ?? "broad").toLowerCase();
  acc[mt] = (acc[mt] ?? 0) + 1;
  return acc;
}, {});

console.log(`\n🎯 Google Ads SEM Campaign Plan`);
console.log(`   ICP:          ${icpId} — ${icp.name?.en ?? icp.name ?? ""}`);
console.log(`   Campaign:     ${campaignName}`);
console.log(`   Landing:      ${landingPage}`);
console.log(`   Daily budget: $${dailyBudget}`);
console.log(`   Regions:      ${regions.join(", ")}`);
console.log(`   Language:     ${language}`);
console.log(
  `   Keywords:     ${sem.keywords.length} (${Object.entries(byMatch)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ")})`,
);
if (Array.isArray(sem.negativeKeywords)) {
  console.log(`   Negatives:    ${sem.negativeKeywords.length}`);
}
console.log(`   Headlines:    ${headlines.length} / 15`);
console.log(`   Descriptions: ${descriptions.length} / 4`);
console.log();

console.log("   Sample keywords:");
for (const kw of sem.keywords.slice(0, 5)) {
  const cpc = kw.maxCpc ? `  max $${kw.maxCpc}` : "";
  const notes = kw.notes ? `  — ${kw.notes}` : "";
  console.log(`     [${kw.matchType ?? "broad"}] ${kw.keyword}${cpc}${notes}`);
}
if (sem.keywords.length > 5) console.log(`     … +${sem.keywords.length - 5} more`);

console.log("\n   Sample headlines:");
for (const h of headlines.slice(0, 4)) console.log(`     • ${h}`);
if (headlines.length > 4) console.log(`     … +${headlines.length - 4} more`);
console.log();

if (dryRun) {
  console.log("✅ Dry run complete. No API calls made.");
  console.log("   Remove --dry-run to create the campaign.");
  process.exit(0);
}

// ── Create campaign via Google Ads API ────────────────────────────────────────
const customerId = getCustomerId();
const developerToken = getDeveloperToken();
const oauth2 = await getOAuthClient();
const customer = await getCustomer({
  oauth2,
  customerId,
  developerToken,
  loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "",
});

// Enum values (from google-ads-api v17):
// AdvertisingChannelType: SEARCH = 2
// CampaignStatus: ENABLED = 2, PAUSED = 3
// BiddingStrategyType: MANUAL_CPC = 3
// BudgetDeliveryMethod: STANDARD = 2
// AdGroupStatus: ENABLED = 2
// AdGroupType: SEARCH_STANDARD = 2
// KeywordMatchType: EXACT = 2, PHRASE = 3, BROAD = 4
// AdGroupAdStatus: ENABLED = 2
// AdGroupCriterionStatus: ENABLED = 2
const MATCH_TYPE_ENUM = { exact: 2, phrase: 3, broad: 4 };

async function run() {
  console.log("→ Creating campaign budget...");
  const budgetName = `[Buda SEM Budget] ${icpId} ${Date.now()}`;
  const budgetResult = await customer.campaignBudgets.create([
    {
      name: budgetName,
      amount_micros: toMicros(dailyBudget),
      delivery_method: 2, // STANDARD
      explicitly_shared: false,
    },
  ]);
  const budgetResourceName = budgetResult.results[0].resource_name;
  console.log(`  ✓ Budget: ${budgetResourceName}`);

  console.log("→ Creating campaign...");
  const campaignResult = await customer.campaigns.create([
    {
      name: campaignName,
      advertising_channel_type: 2, // SEARCH
      status: 3, // PAUSED (safer default — flip to ENABLED in UI after review)
      campaign_budget: budgetResourceName,
      manual_cpc: { enhanced_cpc_enabled: false },
      network_settings: {
        target_google_search: true,
        target_search_network: true,
        target_content_network: false,
        target_partner_search_network: false,
      },
      geo_target_type_setting: {
        positive_geo_target_type: 2, // PRESENCE
        negative_geo_target_type: 2, // PRESENCE
      },
    },
  ]);
  const campaignResourceName = campaignResult.results[0].resource_name;
  const campaignId = campaignResourceName.split("/").pop();
  console.log(`  ✓ Campaign: ${campaignId} (status=PAUSED — enable in UI after review)`);

  console.log(`→ Adding geo targets: ${regions.join(", ")}...`);
  const geoCriteria = regions.map((r) => ({
    campaign: campaignResourceName,
    location: { geo_target_constant: `geoTargetConstants/${GEO_TARGET_IDS[r]}` },
  }));
  if (geoCriteria.length) await customer.campaignCriteria.create(geoCriteria);

  console.log(`→ Adding language target: ${language}...`);
  await customer.campaignCriteria.create([
    {
      campaign: campaignResourceName,
      language: {
        language_constant: `languageConstants/${LANGUAGE_CRITERION_IDS[language]}`,
      },
    },
  ]);

  if (Array.isArray(sem.negativeKeywords) && sem.negativeKeywords.length > 0) {
    console.log(`→ Adding ${sem.negativeKeywords.length} negative keywords...`);
    await customer.campaignCriteria.create(
      sem.negativeKeywords.map((kw) => ({
        campaign: campaignResourceName,
        negative: true,
        keyword: { text: kw, match_type: MATCH_TYPE_ENUM.broad },
      })),
    );
  }

  console.log("→ Creating ad group...");
  const adGroupResult = await customer.adGroups.create([
    {
      name: `${campaignName} — AdGroup`,
      campaign: campaignResourceName,
      status: 2, // ENABLED
      type: 2, // SEARCH_STANDARD
      cpc_bid_micros: toMicros(Math.max(...sem.keywords.map((k) => Number(k.maxCpc) || 0), 1)),
    },
  ]);
  const adGroupResourceName = adGroupResult.results[0].resource_name;
  const adGroupId = adGroupResourceName.split("/").pop();
  console.log(`  ✓ Ad group: ${adGroupId}`);

  console.log(`→ Adding ${sem.keywords.length} keywords...`);
  await customer.adGroupCriteria.create(
    sem.keywords.map((k) => {
      const mt = (k.matchType ?? "broad").toLowerCase();
      const criterion = {
        ad_group: adGroupResourceName,
        status: 2, // ENABLED
        keyword: { text: k.keyword, match_type: MATCH_TYPE_ENUM[mt] ?? MATCH_TYPE_ENUM.broad },
      };
      if (k.maxCpc) criterion.cpc_bid_micros = toMicros(k.maxCpc);
      return criterion;
    }),
  );

  console.log(
    `→ Creating Responsive Search Ad (${headlines.length} headlines, ${descriptions.length} descriptions)...`,
  );
  const adResult = await customer.adGroupAds.create([
    {
      ad_group: adGroupResourceName,
      status: 2, // ENABLED
      ad: {
        final_urls: [landingPage],
        responsive_search_ad: {
          headlines: headlines.map((text) => ({ text: text.slice(0, 30) })),
          descriptions: descriptions.map((text) => ({ text: text.slice(0, 90) })),
        },
      },
    },
  ]);
  const adResourceName = adResult.results[0].resource_name;
  const adId = adResourceName.split("/").pop();
  console.log(`  ✓ Ad: ${adId}`);

  return { campaignId, adGroupId, adId, budgetResourceName };
}

let result;
try {
  result = await run();
} catch (err) {
  console.error(`\n❌ Failed to create SEM campaign: ${err.message}`);
  if (err.errors) {
    for (const e of err.errors) console.error(`   ${JSON.stringify(e)}`);
  }
  process.exit(1);
}

// ── Persist state ─────────────────────────────────────────────────────────────
state[icpId] = {
  campaignId: result.campaignId,
  adGroupId: result.adGroupId,
  adId: result.adId,
  budgetResourceName: result.budgetResourceName,
  dailyBudget,
  regions,
  language,
  landingPage,
  keywordCount: sem.keywords.length,
  createdAt: new Date().toISOString(),
  history: [
    ...(existing ? [{ ...existing, replacedAt: new Date().toISOString() }] : []),
    ...(Array.isArray(existing?.history) ? existing.history : []),
  ],
};
saveState(state);

console.log(`\n✅ SEM campaign created for "${icpId}"`);
console.log(`   Campaign ID: ${result.campaignId}`);
console.log(`   Ad Group ID: ${result.adGroupId}`);
console.log(`   Ad ID:       ${result.adId}`);
console.log(`   State saved: ${STATE_FILE}`);
console.log(
  `\nView in Google Ads: https://ads.google.com/aw/campaigns?campaignId=${result.campaignId}`,
);
console.log("⚠️  Campaign is PAUSED by default. Review keywords & ads, then enable in the UI.");
