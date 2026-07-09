#!/usr/bin/env node
/**
 * pause-google-sem-campaign.mjs
 * Pause a Google Ads SEM (Search) campaign, either by ICP id (reads local cache)
 * or by explicit --campaign-id.
 *
 * Usage:
 *   node .agents/skills/cmo/scripts/pause-google-sem-campaign.mjs --icp seo-marketer
 *   node .agents/skills/cmo/scripts/pause-google-sem-campaign.mjs --campaign-id 12345678
 *   node .agents/skills/cmo/scripts/pause-google-sem-campaign.mjs --icp seo-marketer \
 *     --reason "rebuilding keyword set"
 */

import fs from "node:fs";
import path from "node:path";
import {
  getCustomer,
  getCustomerId,
  getDeveloperToken,
  getOAuthClient,
} from "../lib/google-ads-client.mjs";
import {
  LEGACY_ADS_SEM_STATE_PATH,
  LEGACY_GOOGLE_SEM_STATE_PATH,
  SEM_STATE_PATH,
} from "../lib/paths.mjs";

const STATE_FILE = SEM_STATE_PATH;
const STATE_FALLBACKS = [STATE_FILE, LEGACY_GOOGLE_SEM_STATE_PATH, LEGACY_ADS_SEM_STATE_PATH];

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const icpId = get("--icp");
const campaignIdArg = get("--campaign-id");
const reason = get("--reason") ?? "manual pause";

if (!icpId && !campaignIdArg) {
  console.error(
    [
      "Usage: node pause-google-sem-campaign.mjs [--icp <id> | --campaign-id <id>] [--reason <text>]",
      "",
      "Pass either --icp (reads campaignId from state/sem-state.json)",
      "or --campaign-id (direct).",
    ].join("\n"),
  );
  process.exit(1);
}

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
let campaignId = campaignIdArg;
let entry = null;

if (icpId) {
  entry = state[icpId];
  if (!entry?.campaignId) {
    console.error(
      `❌ No campaign in state for "${icpId}". Run create-google-sem-campaign.mjs first, or pass --campaign-id directly.`,
    );
    process.exit(1);
  }
  campaignId = entry.campaignId;
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

const resourceName = `customers/${customerId}/campaigns/${campaignId}`;
console.log(`→ Pausing campaign ${campaignId} (reason: ${reason})...`);

try {
  await customer.campaigns.update([
    {
      resource_name: resourceName,
      status: 3, // PAUSED
    },
  ]);
} catch (err) {
  console.error(`\n❌ Failed to pause campaign: ${err.message}`);
  if (err.errors) {
    for (const e of err.errors) console.error(`   ${JSON.stringify(e)}`);
  }
  process.exit(1);
}

if (icpId && entry) {
  state[icpId] = {
    ...entry,
    pausedAt: new Date().toISOString(),
    pauseReason: reason,
  };
  saveState(state);
}

console.log(`✅ Campaign ${campaignId} paused.`);
console.log(`   View: https://ads.google.com/aw/campaigns?campaignId=${campaignId}`);
