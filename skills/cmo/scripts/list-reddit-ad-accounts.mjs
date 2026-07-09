#!/usr/bin/env node
import { getRedditAccessToken, readRedditLocalEnv } from "../lib/reddit-ads-client.mjs";

const businessId =
  process.argv[2] ||
  process.env.REDDIT_ADS_BUSINESS_ID ||
  readRedditLocalEnv().REDDIT_ADS_BUSINESS_ID ||
  "";

if (!businessId) {
  console.error("Usage: node .agents/skills/cmo/scripts/list-reddit-ad-accounts.mjs <business_id>");
  console.error("Find the business_id in Reddit Ads Business Manager URL, or paste it here.");
  process.exit(1);
}

const token = await getRedditAccessToken();
const url = `https://ads-api.reddit.com/api/v3/businesses/${encodeURIComponent(businessId)}/ad_accounts?page.size=100`;
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "User-Agent": "web:ads-skill:0.1 (by /u/aiorganizer)",
  },
});
const text = await response.text();
if (!response.ok) {
  console.error(`${response.status} ${response.statusText}: ${text.slice(0, 1000)}`);
  process.exit(1);
}
const json = text ? JSON.parse(text) : {};
console.log(
  JSON.stringify(
    (json.data || []).map((account) => ({
      id: account.id || account.account_id || account.ad_account_id,
      name: account.name || account.account_name || account.display_name,
      status: account.status || account.configured_status || account.effective_status,
    })),
    null,
    2,
  ),
);
