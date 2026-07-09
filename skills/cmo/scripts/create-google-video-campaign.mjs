#!/usr/bin/env node
/**
 * create-google-video-campaign.mjs
 * Create a Google Ads Video Campaign from MDX frontmatter ads config.
 *
 * Reads ads config from MDX frontmatter:
 *   ads:
 *     enabled: true
 *     dailyBudget: 5        # USD, min $1
 *     targetCPV: 0.02       # USD per view, min $0.01
 *     regions: [TW, HK, SG]
 *     language: zh-CN
 *     landingPage: https://buda.ai
 *
 * After creating the campaign, patches campaignId / adGroupId / adId back into MDX.
 * Idempotent: skips if campaignId already exists in MDX (use --force to override).
 *
 * Usage:
 *   node create-google-video-campaign.mjs --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx
 *   node create-google-video-campaign.mjs --mdx <mdx> --dry-run
 *   node create-google-video-campaign.mjs --mdx <mdx> --force
 */

import fs from "node:fs";

import {
  GEO_TARGET_IDS,
  getCustomer,
  getCustomerId,
  getDeveloperToken,
  getOAuthClient,
  LANGUAGE_CRITERION_IDS,
  toMicros,
} from "../lib/google-ads-client.mjs";

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const mdxPath = get("--mdx");
const dryRun = hasFlag("--dry-run");
const force = hasFlag("--force");

if (!mdxPath) {
  console.error(
    [
      "Usage: node create-google-video-campaign.mjs --mdx <mdx-file> [options]",
      "",
      "Options:",
      "  --mdx <path>   Path to MDX file with ads config in frontmatter (required)",
      "  --dry-run      Preview what would be created without calling the API",
      "  --force        Re-create campaign even if campaignId already exists in MDX",
      "",
      "Required env vars:",
      "  GOOGLE_ADS_DEVELOPER_TOKEN",
      "  GOOGLE_ADS_CUSTOMER_ID     (format: xxx-xxx-xxxx)",
      "",
      "Required file:",
      "  ~/.config/google-ads/client_secret.json",
    ].join("\n"),
  );
  process.exit(1);
}

if (!fs.existsSync(mdxPath)) {
  console.error(`MDX file not found: ${mdxPath}`);
  process.exit(1);
}

// ── Parse MDX frontmatter (handles ads: nested block + arrays) ────────────────
function parseFullFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const lines = match[1].split("\n");
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const kvMatch = line.match(/^([a-zA-Z][\w-]*):\s+(.*)/);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2].trim().replace(/^["']|["']$/g, "");
      result[key] = val === "true" ? true : val === "false" ? false : val;
      i++;
      continue;
    }

    const blockMatch = line.match(/^([a-zA-Z][\w-]*):\s*$/);
    if (blockMatch) {
      const key = blockMatch[1];
      i++;
      if (i < lines.length && lines[i].startsWith("  - ")) {
        const arr = [];
        while (i < lines.length && lines[i].startsWith("  - ")) {
          arr.push(lines[i].slice(4).trim());
          i++;
        }
        result[key] = arr;
      } else if (i < lines.length && lines[i].match(/^ {2}[a-zA-Z]/)) {
        const obj = {};
        while (i < lines.length && lines[i].match(/^ {2}[a-zA-Z]/)) {
          const nestedLine = lines[i];
          const nestedBlockMatch = nestedLine.match(/^ {2}([a-zA-Z][\w-]*):\s*$/);
          if (nestedBlockMatch) {
            const nestedKey = nestedBlockMatch[1];
            i++;
            const arr = [];
            while (i < lines.length && lines[i].startsWith("    - ")) {
              arr.push(lines[i].slice(6).trim());
              i++;
            }
            obj[nestedKey] = arr;
            continue;
          }
          const nestedKv = nestedLine.match(/^ {2}([a-zA-Z][\w-]*):\s+(.*)/);
          if (nestedKv) {
            const val = nestedKv[2].trim().replace(/^["']|["']$/g, "");
            obj[nestedKv[1]] =
              val === "true"
                ? true
                : val === "false"
                  ? false
                  : Number.isNaN(Number(val))
                    ? val
                    : Number(val);
          }
          i++;
        }
        result[key] = obj;
      } else {
        result[key] = {};
      }
      continue;
    }

    i++;
  }

  return result;
}

function upsertAdsIds(content, campaignId, adGroupId, adId) {
  const fmMatch = content.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!fmMatch) return content;

  const [full, open, body, close] = fmMatch;
  const rest = content.slice(full.length);
  let newBody = body;

  const updateAdsField = (b, field, value) => {
    const fieldRegex = new RegExp(`(  ${field}:\\s*).*`, "m");
    if (fieldRegex.test(b)) {
      return b.replace(fieldRegex, `$1"${value}"`);
    }
    return b.replace(/(ads:\n(?: {2}.*\n)*)( {2}campaignId:|$)/, (_m, adsBlock) => {
      return `${adsBlock}  ${field}: "${value}"\n`;
    });
  };

  newBody = updateAdsField(newBody, "campaignId", campaignId);
  newBody = updateAdsField(newBody, "adGroupId", adGroupId);
  newBody = updateAdsField(newBody, "adId", adId);

  return open + newBody + close + rest;
}

function validateAdsConfig(ads) {
  if (!ads.enabled) return { skip: true, reason: "ads.enabled is false" };

  const errors = [];
  const budget = Number(ads.dailyBudget ?? 5);
  const cpv = Number(ads.targetCPV ?? 0.02);

  if (budget < 1) errors.push(`dailyBudget must be at least $1 (got ${budget})`);
  if (cpv < 0.01) errors.push(`targetCPV must be at least $0.01 (got ${cpv})`);
  if (!ads.landingPage) errors.push("landingPage is required");
  if (!ads.regions || (Array.isArray(ads.regions) && ads.regions.length === 0)) {
    errors.push("regions must have at least one country code");
  }

  if (errors.length > 0) return { skip: false, errors };

  return {
    skip: false,
    config: {
      dailyBudget: budget,
      targetCPV: cpv,
      regions: Array.isArray(ads.regions) ? ads.regions : [ads.regions],
      language: ads.language ?? "zh-CN",
      landingPage: ads.landingPage,
    },
  };
}

// ── Create Video Campaign ─────────────────────────────────────────────────────
async function createVideoAdsCampaign({ customer, customerId, title, youtubeId, config }) {
  const campaignName = `[Buda] ${title} — ${new Date().toISOString().slice(0, 10)}`;
  const budgetName = `[Buda] Budget ${Date.now()}`;

  console.log("  Creating campaign budget...");
  const budgetResult = await customer.campaignBudgets.create([
    {
      name: budgetName,
      amount_micros: toMicros(config.dailyBudget),
      delivery_method: 2, // STANDARD
    },
  ]);
  const budgetResourceName = budgetResult.results[0].resource_name;
  console.log(`  Budget created: ${budgetResourceName}`);

  console.log("  Creating campaign...");
  const campaignResult = await customer.campaigns.create([
    {
      name: campaignName,
      advertising_channel_type: 6, // VIDEO
      status: 2, // ENABLED
      campaign_budget: budgetResourceName,
      video_brand_safety_suitability: 2, // EXPANDED_INVENTORY
      target_cpv: { target_cpv_micros: toMicros(config.targetCPV) },
      geo_target_type_setting: { positive_geo_target_type: 2 }, // PRESENCE
    },
  ]);
  const campaignResourceName = campaignResult.results[0].resource_name;
  const campaignId = campaignResourceName.split("/").pop();
  console.log(`  Campaign created: ${campaignId}`);

  console.log(`  Adding geo targets: ${config.regions.join(", ")}...`);
  const geoTargets = config.regions
    .map((r) => GEO_TARGET_IDS[r.toUpperCase()])
    .filter(Boolean)
    .map((geoId) => ({
      campaign: campaignResourceName,
      location: { geo_target_constant: `geoTargetConstants/${geoId}` },
    }));

  if (geoTargets.length > 0) await customer.campaignCriteria.create(geoTargets);

  const langId = LANGUAGE_CRITERION_IDS[config.language] ?? LANGUAGE_CRITERION_IDS["zh-CN"];
  console.log(`  Adding language target: ${config.language} (id=${langId})...`);
  await customer.campaignCriteria.create([
    {
      campaign: campaignResourceName,
      language: { language_constant: `languageConstants/${langId}` },
    },
  ]);

  console.log("  Creating ad group...");
  const adGroupResult = await customer.adGroups.create([
    {
      name: `${campaignName} — AdGroup`,
      campaign: campaignResourceName,
      status: 2, // ENABLED
      type: 10, // VIDEO_TRUE_VIEW_IN_STREAM
      cpv_bid_micros: toMicros(config.targetCPV),
    },
  ]);
  const adGroupResourceName = adGroupResult.results[0].resource_name;
  const adGroupId = adGroupResourceName.split("/").pop();
  console.log(`  Ad group created: ${adGroupId}`);

  console.log("  Creating video ad...");
  // NOTE: Google Ads requires a YouTube video Asset resource name in the format
  // `customers/{customerId}/assets/{assetId}`. The asset must be created first
  // via assets.create with a YouTubeVideoAsset, then its resource_name is used here.
  // Using the raw YouTube video ID directly is not supported by the API.
  // TODO: Implement asset creation step before ad creation.
  const videoAssetResourceName = `customers/${customerId}/assets/${youtubeId}`;
  const adResult = await customer.ads.create([
    {
      name: `${title} — Ad`,
      final_urls: [config.landingPage],
      video_responsive_ad: {
        videos: [{ asset: videoAssetResourceName }],
        headlines: [{ text: title.slice(0, 30) }],
        long_headlines: [{ text: title.slice(0, 90) }],
        descriptions: [],
        call_to_actions: [{ text: "Learn More" }],
      },
    },
  ]);

  const adResourceName = adResult.results[0].resource_name;
  const adId = adResourceName.split("/").pop();

  await customer.adGroupAds.create([
    {
      ad_group: adGroupResourceName,
      ad: adResourceName,
      status: 2, // ENABLED
    },
  ]);

  console.log(`  Ad created: ${adId}`);

  return { campaignId, adGroupId, adId };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const mdxContent = fs.readFileSync(mdxPath, "utf8");
const fm = parseFullFrontmatter(mdxContent);

const title = fm.title;
const youtubeId = fm.youtubeId;
const ads = fm.ads ?? {};

console.log(`\nGoogle Ads Video Campaign Creator`);
console.log(`MDX: ${mdxPath}`);
console.log(`Title: ${title}`);
console.log(`YouTube ID: ${youtubeId ?? "(not set)"}`);
console.log();

if (!youtubeId) {
  console.error("❌ No youtubeId in MDX frontmatter. Upload to YouTube first.");
  process.exit(1);
}

if (ads.campaignId && !force) {
  console.log(`⏭  Campaign already exists: ${ads.campaignId}`);
  console.log("   Use --force to re-create.");
  process.exit(0);
}

const validation = validateAdsConfig(ads);

if (validation.skip) {
  console.log(`⏭  Skipping: ${validation.reason}`);
  process.exit(0);
}

if (validation.errors) {
  console.error("❌ Invalid ads config:");
  for (const err of validation.errors) console.error(`   - ${err}`);
  process.exit(1);
}

const { config } = validation;

console.log("Campaign plan:");
console.log(`  Name:         [Buda] ${title}`);
console.log(`  Daily budget: $${config.dailyBudget}`);
console.log(`  Target CPV:   $${config.targetCPV}`);
console.log(`  Est. views:   ~${Math.round(config.dailyBudget / config.targetCPV)}/day`);
console.log(`  Regions:      ${config.regions.join(", ")}`);
console.log(`  Language:     ${config.language}`);
console.log(`  Landing page: ${config.landingPage}`);
console.log(`  YouTube ID:   ${youtubeId}`);
console.log();

if (dryRun) {
  console.log("✅ Dry run complete. No API calls made.");
  console.log("   Remove --dry-run to create the campaign.");
  process.exit(0);
}

const customerId = getCustomerId();
const developerToken = getDeveloperToken();
const oauth2 = await getOAuthClient();
const customer = await getCustomer({
  oauth2,
  customerId,
  developerToken,
  loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "",
});

console.log("Creating campaign...");
let result;
try {
  result = await createVideoAdsCampaign({
    customer,
    customerId,
    title,
    youtubeId,
    config,
  });
} catch (err) {
  console.error(`\n❌ Failed to create campaign: ${err.message}`);
  if (err.errors) {
    for (const e of err.errors) console.error(`   ${JSON.stringify(e)}`);
  }
  process.exit(1);
}

const updated = upsertAdsIds(mdxContent, result.campaignId, result.adGroupId, result.adId);
fs.writeFileSync(mdxPath, updated);

console.log(`\n✅ Campaign created successfully!`);
console.log(`   Campaign ID:  ${result.campaignId}`);
console.log(`   Ad Group ID:  ${result.adGroupId}`);
console.log(`   Ad ID:        ${result.adId}`);
console.log(`   Written back to: ${mdxPath}`);
console.log();
console.log(
  `View in Google Ads: https://ads.google.com/aw/campaigns?campaignId=${result.campaignId}`,
);
