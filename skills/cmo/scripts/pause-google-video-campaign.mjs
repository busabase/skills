#!/usr/bin/env node
/**
 * pause-google-video-campaign.mjs
 * Pause a Google Ads Video campaign — used when a YouTube video is replaced.
 *
 * Usage:
 *   node pause-google-video-campaign.mjs --campaign-id 12345678
 *   node pause-google-video-campaign.mjs --campaign-id 12345678 --reason "replaced by new version"
 *   node pause-google-video-campaign.mjs --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx
 */

import fs from "node:fs";

import {
  getCustomer,
  getCustomerId,
  getDeveloperToken,
  getOAuthClient,
} from "../lib/google-ads-client.mjs";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const campaignIdArg = get("--campaign-id");
const mdxPath = get("--mdx");
const reason = get("--reason") ?? "paused by ads skill";

if (!campaignIdArg && !mdxPath) {
  console.error(
    [
      "Usage: node pause-google-video-campaign.mjs [options]",
      "",
      "Options (one required):",
      "  --campaign-id <id>   Google Ads campaign ID to pause",
      "  --mdx <path>         MDX file — reads campaignId from frontmatter ads block",
      "",
      "Optional:",
      "  --reason <text>      Reason for pausing (logged)",
    ].join("\n"),
  );
  process.exit(1);
}

function getCampaignIdFromMdx(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`MDX file not found: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const adsBlock = match[1].match(/ads:\n((?: {2}.*\n?)*)/);
  if (!adsBlock) return null;

  const idMatch = adsBlock[1].match(/campaignId:\s*["']?([0-9]+)["']?/);
  return idMatch ? idMatch[1] : null;
}

let campaignId = campaignIdArg;

if (!campaignId && mdxPath) {
  campaignId = getCampaignIdFromMdx(mdxPath);
  if (!campaignId) {
    console.log("No campaignId found in MDX frontmatter. Nothing to pause.");
    process.exit(0);
  }
}

console.log(`Pausing video campaign: ${campaignId}`);
console.log(`Reason: ${reason}`);

const customerId = getCustomerId();
const developerToken = getDeveloperToken();
const oauth2 = await getOAuthClient();
const customer = await getCustomer({
  oauth2,
  customerId,
  developerToken,
  loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "",
});

try {
  await customer.campaigns.update([
    {
      resource_name: `customers/${customerId}/campaigns/${campaignId}`,
      status: 3, // PAUSED
    },
  ]);
  console.log(`✅ Campaign ${campaignId} paused.`);
} catch (err) {
  console.error(`❌ Failed to pause campaign: ${err.message}`);
  if (err.errors) {
    for (const e of err.errors) console.error(`   ${JSON.stringify(e)}`);
  }
  process.exit(1);
}
