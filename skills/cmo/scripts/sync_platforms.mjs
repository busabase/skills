#!/usr/bin/env node
import fs from "node:fs";
import {
  effectiveProposals,
  loadConfigSummary,
  loadPlatformSnapshot,
  savePlatformSnapshot,
  utcNow,
} from "../lib/common.mjs";
import {
  ENV_FILE,
  getCustomer,
  getCustomerId,
  getDeveloperToken,
  getOAuthClient,
} from "../lib/google-ads-client.mjs";
import { getRedditAccessToken, readRedditLocalEnv } from "../lib/reddit-ads-client.mjs";

function readGoogleLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ENV_FILE, "utf8"));
  } catch {
    return {};
  }
}

function parseArgs(argv) {
  const args = {
    google: true,
    reddit: true,
    limit: 1000,
    includeCampaigns: true,
    accountKey: "",
    accountId: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--google-only") args.reddit = false;
    else if (arg === "--reddit-only") args.google = false;
    else if (arg === "--limit") args.limit = Number(argv[++index]);
    else if (arg === "--include-campaigns") args.includeCampaigns = true;
    else if (arg === "--account-key") args.accountKey = argv[++index];
    else if (arg === "--account-id") args.accountId = argv[++index];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node .agents/skills/cmo/scripts/sync_platforms.mjs [--google-only|--reddit-only] [--account-key KEY|--account-id ID] [--limit 25]

Read platform accounts and write a short-lived local UI snapshot. This is read-only:
- Google Ads: GAQL campaign query via GoogleAdsService.
- Reddit Ads: Ads API v3 list endpoints with OAuth Bearer token.

Local files are cache/planning state only; platform APIs remain the source of truth.
By default, the snapshot keeps campaign summaries for the configured accounts so the UI list is complete.
Use --limit to cap Google campaign reads during debugging.`);
}

function blocker(message, account = {}) {
  return {
    key: account.key || "",
    account_id: account.account_id || "",
    account_name: account.display_name || "",
    status: "blocked",
    campaign_count: 0,
    campaigns: [],
    blockers: [message],
    synced_at: "",
  };
}

function dollarsFromMicros(value) {
  return Number(value || 0) / 1_000_000;
}

function googleCampaignStatus(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "ENABLED",
    3: "PAUSED",
    4: "REMOVED",
  };
  return labels[value] || String(value || "");
}

function googleChannelType(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "SEARCH",
    3: "DISPLAY",
    4: "SHOPPING",
    5: "HOTEL",
    6: "VIDEO",
    7: "MULTI_CHANNEL",
    8: "LOCAL",
    9: "SMART",
    10: "PERFORMANCE_MAX",
    11: "LOCAL_SERVICES",
    12: "DISCOVERY",
    13: "TRAVEL",
  };
  return labels[value] || String(value || "");
}

function googleServingStatus(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "SERVING",
    3: "NONE",
    4: "ENDED",
    5: "PENDING",
    6: "SUSPENDED",
  };
  return labels[value] || String(value || "");
}

function googlePrimaryStatus(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "ELIGIBLE",
    3: "PAUSED",
    4: "REMOVED",
    5: "ENDED",
    6: "PENDING",
    7: "MISCONFIGURED",
    8: "LIMITED",
    9: "LEARNING",
    10: "NOT_ELIGIBLE",
  };
  return labels[value] || String(value || "");
}

function googleBiddingStrategyType(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "COMMISSION",
    3: "ENHANCED_CPC",
    4: "MANUAL_CPA",
    5: "MANUAL_CPC",
    6: "MANUAL_CPM",
    7: "MANUAL_CPV",
    8: "MAXIMIZE_CONVERSIONS",
    9: "MAXIMIZE_CONVERSION_VALUE",
    10: "PAGE_ONE_PROMOTED",
    11: "PERCENT_CPC",
    12: "TARGET_CPA",
    13: "TARGET_CPM",
    14: "TARGET_IMPRESSION_SHARE",
    15: "TARGET_OUTRANK_SHARE",
    16: "TARGET_ROAS",
    17: "TARGET_SPEND",
    18: "TARGET_CPV",
    19: "TARGET_CPC",
    20: "TARGET_CPM",
  };
  return labels[value] || String(value || "");
}

function googleBudgetDeliveryMethod(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "STANDARD",
    3: "ACCELERATED",
  };
  return labels[value] || String(value || "");
}

function googleBudgetStatus(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "ENABLED",
    3: "REMOVED",
  };
  return labels[value] || String(value || "");
}

function googleBudgetType(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "STANDARD",
    3: "FIXED_CPA",
  };
  return labels[value] || String(value || "");
}

function googlePaymentMode(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    4: "CONVERSIONS",
    5: "CONVERSION_VALUE",
    6: "CLICKS",
    7: "GUEST_STAY",
  };
  return labels[value] || String(value || "");
}

function googleAdGroupStatus(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "ENABLED",
    3: "PAUSED",
    4: "REMOVED",
  };
  return labels[value] || String(value || "");
}

function googleAdStatus(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "ENABLED",
    3: "PAUSED",
    4: "REMOVED",
  };
  return labels[value] || String(value || "");
}

function googleAdType(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "TEXT_AD",
    3: "EXPANDED_TEXT_AD",
    6: "RESPONSIVE_SEARCH_AD",
    7: "IMAGE_AD",
    12: "VIDEO_AD",
    15: "RESPONSIVE_SEARCH_AD",
    17: "CALL_AD",
    18: "APP_AD",
    19: "SHOPPING_SMART_AD",
    20: "VIDEO_RESPONSIVE_AD",
    30: "VIDEO_AD",
  };
  return labels[value] || String(value || "");
}

function googleAdGroupType(value) {
  const labels = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "SEARCH_STANDARD",
    3: "DISPLAY_STANDARD",
    6: "SHOPPING_PRODUCT_ADS",
    7: "HOTEL_ADS",
    8: "SHOPPING_SMART_ADS",
    9: "VIDEO_BUMPER",
    10: "VIDEO_TRUE_VIEW_IN_STREAM",
    11: "VIDEO_TRUE_VIEW_IN_DISPLAY",
    12: "VIDEO_NON_SKIPPABLE_IN_STREAM",
    13: "VIDEO_OUTSTREAM",
    14: "SEARCH_DYNAMIC_ADS",
    15: "SHOPPING_COMPARISON_LISTING_ADS",
    16: "PROMOTED_VIDEO",
  };
  return labels[value] || String(value || "");
}

function minimalCampaigns(campaigns, includeCampaigns) {
  return includeCampaigns ? campaigns : [];
}

function pushDailyMetric(campaign, row) {
  const date = row.segments?.date || "";
  if (!date) return;
  campaign.daily ||= [];
  campaign.daily.push({
    date,
    impressions: Number(row.metrics?.impressions || 0),
    clicks: Number(row.metrics?.clicks || 0),
    cost: dollarsFromMicros(row.metrics?.cost_micros),
    conversions: Number(row.metrics?.conversions || 0),
  });
}

function googleCampaignUrl(campaignId) {
  if (!campaignId) return "";
  return `https://ads.google.com/aw/campaigns?campaignId=${encodeURIComponent(campaignId)}`;
}

function redditCampaignUrl(accountId, campaignId) {
  if (!accountId || !campaignId) return "";
  return `https://ads.reddit.com/accounts/${encodeURIComponent(accountId)}/campaigns/${encodeURIComponent(campaignId)}`;
}

function redditStatus(item = {}) {
  return item.effective_status || item.configured_status || item.status || "";
}

function redditDeliveryStatus(item = {}) {
  return Array.isArray(item.delivery_status)
    ? item.delivery_status.join(", ")
    : item.delivery_status || "";
}

function redditAdGroupType(adGroup = {}) {
  return [adGroup.optimization_goal, adGroup.bid_type, adGroup.bid_strategy]
    .filter(Boolean)
    .join(" · ");
}

function normalizeRedditAdGroup(adGroup = {}) {
  return {
    id: String(adGroup.id || ""),
    campaign_id: String(adGroup.campaign_id || ""),
    name: adGroup.name || "",
    status: redditStatus(adGroup),
    configured_status: adGroup.configured_status || "",
    delivery_status: redditDeliveryStatus(adGroup),
    type: redditAdGroupType(adGroup),
    cpc_bid: dollarsFromMicros(adGroup.bid_value),
    goal_type: adGroup.goal_type || "",
    goal_value: dollarsFromMicros(adGroup.goal_value),
    optimization_goal: adGroup.optimization_goal || "",
    start_time: adGroup.start_time || "",
    end_time: adGroup.end_time || "",
    targeting: adGroup.targeting || {},
    created_at: adGroup.created_at || "",
    modified_at: adGroup.modified_at || "",
    resource_name: "",
    raw: adGroup,
  };
}

function normalizeRedditAd(ad = {}) {
  return {
    id: String(ad.id || ""),
    campaign_id: String(ad.campaign_id || ""),
    ad_group_id: String(ad.ad_group_id || ""),
    name: ad.name || "",
    status: redditStatus(ad),
    configured_status: ad.configured_status || "",
    delivery_status: redditDeliveryStatus(ad),
    type: ad.campaign_objective_type || "REDDIT_AD",
    final_urls: [ad.click_url].filter(Boolean),
    click_url: ad.click_url || "",
    post_id: ad.post_id || "",
    post_url: ad.post_url || "",
    preview_url: ad.preview_url || "",
    preview_expiry: ad.preview_expiry || "",
    profile_id: ad.profile_id || "",
    rejection_reason: ad.rejection_reason || "",
    resource_name: "",
    created_at: ad.created_at || "",
    modified_at: ad.modified_at || "",
    raw: ad,
  };
}

function normalizeVideo(row) {
  const video = row.video || {};
  return {
    id: String(video.id || ""),
    title: video.title || "",
    channel_id: video.channel_id || "",
    duration_millis: Number(video.duration_millis || 0),
    resource_name: video.resource_name || "",
  };
}

function normalizeAssetVideo(asset = {}) {
  const youtube = asset.youtube_video_asset || {};
  return {
    id: String(youtube.youtube_video_id || ""),
    title: youtube.youtube_video_title || asset.name || "",
    channel_id: "",
    duration_millis: 0,
    resource_name: asset.resource_name || "",
  };
}

function buildAssetVideoMap(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const video = normalizeAssetVideo(row.asset || {});
    if (video.resource_name && video.id) map.set(video.resource_name, video);
  }
  return map;
}

function extractVideoAssetResources(ad = {}) {
  const resources = new Set();
  const direct = ad.video_ad?.video?.asset;
  if (direct) resources.add(direct);
  for (const item of ad.video_responsive_ad?.videos || []) {
    if (item?.asset) resources.add(item.asset);
  }
  for (const item of ad.demand_gen_video_responsive_ad?.videos || []) {
    if (item?.asset) resources.add(item.asset);
  }
  return [...resources];
}

function addCampaignVideo(campaignMap, row) {
  const id = String(row.campaign?.id || "");
  if (!campaignMap.has(id) || !row.video?.id) return;
  const campaign = campaignMap.get(id);
  campaign.videos ||= [];
  if (campaign.videos.some((video) => video.id === String(row.video.id))) return;
  campaign.videos.push(normalizeVideo(row));
}

function addCampaignAdGroup(campaignMap, row) {
  const id = String(row.campaign?.id || "");
  if (!campaignMap.has(id) || !row.ad_group?.id) return;
  const adGroup = row.ad_group || {};
  const campaign = campaignMap.get(id);
  campaign.ad_groups ||= [];
  if (campaign.ad_groups.some((item) => item.id === String(adGroup.id))) return;
  campaign.ad_groups.push({
    id: String(adGroup.id || ""),
    name: adGroup.name || "",
    status: googleAdGroupStatus(adGroup.status),
    type: googleAdGroupType(adGroup.type),
    cpc_bid: dollarsFromMicros(adGroup.cpc_bid_micros),
    resource_name: adGroup.resource_name || "",
  });
}

function addCampaignAd(campaignMap, row, assetVideoMap = new Map()) {
  const id = String(row.campaign?.id || "");
  if (!campaignMap.has(id) || !row.ad_group_ad?.ad?.id) return;
  const adGroupAd = row.ad_group_ad || {};
  const ad = adGroupAd.ad || {};
  const campaign = campaignMap.get(id);
  const videoResources = extractVideoAssetResources(ad);
  const videos = videoResources
    .map((resourceName) => assetVideoMap.get(resourceName))
    .filter(Boolean);
  for (const video of videos) {
    campaign.videos ||= [];
    if (!campaign.videos.some((item) => item.id === video.id)) campaign.videos.push(video);
  }
  campaign.ads ||= [];
  if (campaign.ads.some((item) => item.id === String(ad.id))) return;
  campaign.ads.push({
    id: String(ad.id || ""),
    ad_group_id: String(row.ad_group?.id || ""),
    name: ad.name || "",
    status: googleAdStatus(adGroupAd.status),
    type: googleAdType(ad.type),
    final_urls: Array.isArray(ad.final_urls) ? ad.final_urls : [],
    video_resources: videoResources,
    videos,
    resource_name: ad.resource_name || "",
    ad_group_ad_resource_name: adGroupAd.resource_name || "",
  });
}

async function syncGoogle(limit, includeCampaigns, account = {}) {
  const localEnv = readGoogleLocalEnv();
  if (
    !process.env.GOOGLE_ADS_CUSTOMER_ID &&
    !localEnv.GOOGLE_ADS_CUSTOMER_ID &&
    !account.account_id
  )
    return blocker("Missing GOOGLE_ADS_CUSTOMER_ID or account_id.", account);
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN && !localEnv.GOOGLE_ADS_DEVELOPER_TOKEN)
    return blocker("Missing GOOGLE_ADS_DEVELOPER_TOKEN.", account);

  try {
    const customerId = String(
      account.account_id ||
        process.env.GOOGLE_ADS_CUSTOMER_ID ||
        localEnv.GOOGLE_ADS_CUSTOMER_ID ||
        getCustomerId(),
    ).replace(/-/g, "");
    const developerToken = getDeveloperToken();
    const oauth2 = await getOAuthClient();
    const customer = await getCustomer({
      oauth2,
      customerId,
      developerToken,
      loginCustomerId:
        account.login_customer_id ||
        process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        localEnv.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        "",
    });
    if (typeof customer.query !== "function") {
      return blocker(
        "google-ads-api client does not expose customer.query in this runtime.",
        account,
      );
    }
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.resource_name,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.serving_status,
        campaign.primary_status,
        campaign.bidding_strategy_type,
        campaign.campaign_budget,
        campaign.payment_mode,
        campaign.optimization_score,
        campaign.tracking_url_template,
        campaign.final_url_suffix,
        campaign_budget.resource_name,
        campaign_budget.name,
        campaign_budget.amount_micros,
        campaign_budget.delivery_method,
        campaign_budget.status,
        campaign_budget.type,
        campaign_budget.explicitly_shared
      FROM campaign
      ORDER BY campaign.id
      LIMIT ${Number.isFinite(limit) ? Math.max(1, limit) : 25}
    `;
    const metricQuery = `
      SELECT
        campaign.id,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date DURING LAST_14_DAYS
      ORDER BY campaign.id, segments.date DESC
    `;
    const videoQuery = `
      SELECT
        campaign.id,
        campaign.advertising_channel_type,
        video.id,
        video.title,
        video.channel_id,
        video.duration_millis,
        video.resource_name
      FROM video
      WHERE campaign.advertising_channel_type = 'VIDEO'
      LIMIT 1000
    `;
    const adGroupQuery = `
      SELECT
        campaign.id,
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        ad_group.cpc_bid_micros
      FROM ad_group
      ORDER BY campaign.id, ad_group.id
      LIMIT 1000
    `;
    const adQuery = `
      SELECT
        campaign.id,
        ad_group.id,
        ad_group_ad.ad.id,
        ad_group_ad.status,
        ad_group_ad.ad.type,
        ad_group_ad.ad.name,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.video_ad.video.asset,
        ad_group_ad.ad.video_responsive_ad.videos,
        ad_group_ad.ad.demand_gen_video_responsive_ad.videos,
        ad_group_ad.ad.resource_name,
        ad_group_ad.resource_name
      FROM ad_group_ad
      ORDER BY campaign.id, ad_group.id, ad_group_ad.ad.id
      LIMIT 3000
    `;
    const assetQuery = `
      SELECT
        asset.id,
        asset.name,
        asset.resource_name,
        asset.youtube_video_asset.youtube_video_id,
        asset.youtube_video_asset.youtube_video_title
      FROM asset
      WHERE asset.type = 'YOUTUBE_VIDEO'
      LIMIT 5000
    `;
    const [campaignRows, metricRows, videoRows, adGroupRows, adRows, assetRows] = await Promise.all(
      [
        customer.query(campaignQuery),
        customer.query(metricQuery),
        customer.query(videoQuery).catch(() => []),
        customer.query(adGroupQuery).catch(() => []),
        customer.query(adQuery).catch(() => []),
        customer.query(assetQuery).catch(() => []),
      ],
    );
    const assetVideoMap = buildAssetVideoMap(assetRows);
    const campaignMap = new Map();
    for (const row of campaignRows) {
      const id = String(row.campaign?.id || "");
      campaignMap.set(id, {
        id,
        name: row.campaign?.name || "",
        status: googleCampaignStatus(row.campaign?.status),
        channel: googleChannelType(row.campaign?.advertising_channel_type),
        serving_status: googleServingStatus(row.campaign?.serving_status),
        primary_status: googlePrimaryStatus(row.campaign?.primary_status),
        bidding_strategy_type: googleBiddingStrategyType(row.campaign?.bidding_strategy_type),
        payment_mode: googlePaymentMode(row.campaign?.payment_mode),
        optimization_score: Number(row.campaign?.optimization_score || 0),
        tracking_url_template: row.campaign?.tracking_url_template || "",
        final_url_suffix: row.campaign?.final_url_suffix || "",
        resource_name: row.campaign?.resource_name || "",
        budget: {
          name: row.campaign_budget?.name || "",
          amount: dollarsFromMicros(row.campaign_budget?.amount_micros),
          delivery_method: googleBudgetDeliveryMethod(row.campaign_budget?.delivery_method),
          status: googleBudgetStatus(row.campaign_budget?.status),
          type: googleBudgetType(row.campaign_budget?.type),
          explicitly_shared: Boolean(row.campaign_budget?.explicitly_shared),
          resource_name: row.campaign_budget?.resource_name || "",
        },
        official_url: googleCampaignUrl(id),
        videos: [],
        ad_groups: [],
        ads: [],
        metrics: { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
        daily: [],
      });
    }
    for (const row of videoRows) addCampaignVideo(campaignMap, row);
    for (const row of adGroupRows) addCampaignAdGroup(campaignMap, row);
    for (const row of adRows) addCampaignAd(campaignMap, row, assetVideoMap);
    for (const row of metricRows) {
      const id = String(row.campaign?.id || "");
      if (!campaignMap.has(id)) continue;
      const campaign = campaignMap.get(id);
      campaign.metrics.impressions += Number(row.metrics?.impressions || 0);
      campaign.metrics.clicks += Number(row.metrics?.clicks || 0);
      campaign.metrics.cost += dollarsFromMicros(row.metrics?.cost_micros);
      campaign.metrics.conversions += Number(row.metrics?.conversions || 0);
      pushDailyMetric(campaign, row);
    }
    const campaigns = Array.from(campaignMap.values()).sort(
      (a, b) => Number(b.metrics.cost || 0) - Number(a.metrics.cost || 0),
    );
    return {
      status: "synced",
      account_id: account.account_id || process.env.GOOGLE_ADS_CUSTOMER_ID,
      key: account.key || "google-main",
      account_name: account.display_name || "",
      synced_at: utcNow(),
      metrics_window: "last_30_days",
      campaign_count: campaigns.length,
      campaigns: minimalCampaigns(campaigns, includeCampaigns),
      blockers: [],
    };
  } catch (error) {
    return blocker(`Google read-only sync failed: ${error.message}`, account);
  }
}

async function fetchRedditList(pathname, token) {
  const baseUrl = "https://ads-api.reddit.com/api/v3";
  const values = [];
  let nextUrl = `${baseUrl}/${pathname}`;
  for (let page = 0; nextUrl && page < 5; page += 1) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text.slice(0, 500);
      try {
        message = JSON.parse(text).message || JSON.parse(text).error?.message || message;
      } catch {
        // Keep response text.
      }
      throw new Error(`${response.status} ${response.statusText}: ${message}`);
    }
    const json = text ? JSON.parse(text) : {};
    const data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    values.push(...data);
    nextUrl = json.pagination?.next_url || "";
  }
  return values;
}

async function syncReddit(configSummary, includeCampaigns, account = {}) {
  const tokenEnv = configSummary.access_token_env || "REDDIT_ADS_ACCESS_TOKEN";
  const accountIdEnv = configSummary.account_id_env || "REDDIT_ADS_ACCOUNT_ID";
  const redditLocalEnv = readRedditLocalEnv();
  const token =
    process.env[account.access_token_env || tokenEnv] ||
    (await getRedditAccessToken().catch(() => ""));
  const accountId =
    account.account_id ||
    process.env[account.account_id_env || accountIdEnv] ||
    redditLocalEnv.REDDIT_ADS_ACCOUNT_ID ||
    configSummary.account_id ||
    "";
  if (!accountId) return blocker(`Missing Reddit Ads account id (${accountIdEnv}).`, account);
  if (!token) return blocker(`Missing Reddit Ads access token (${tokenEnv}).`, account);

  try {
    const [campaigns, adGroups, ads] = await Promise.all([
      fetchRedditList(`ad_accounts/${encodeURIComponent(accountId)}/campaigns`, token),
      fetchRedditList(`ad_accounts/${encodeURIComponent(accountId)}/ad_groups`, token),
      fetchRedditList(`ad_accounts/${encodeURIComponent(accountId)}/ads`, token),
    ]);
    const normalizedAdGroups = adGroups.map(normalizeRedditAdGroup);
    const normalizedAds = ads.map(normalizeRedditAd);
    const normalizedCampaigns = campaigns.map((campaign) => ({
      id: String(campaign.id || campaign.campaign_id || ""),
      name: campaign.name || campaign.title || "",
      status: redditStatus(campaign),
      configured_status: campaign.configured_status || "",
      delivery_status: redditDeliveryStatus(campaign),
      objective: campaign.objective || campaign.objective_type || "",
      channel: campaign.objective || campaign.objective_type || "REDDIT",
      metrics: null,
      daily: [],
      videos: [],
      ad_groups: normalizedAdGroups.filter(
        (adGroup) =>
          String(adGroup.campaign_id) === String(campaign.id || campaign.campaign_id || ""),
      ),
      ads: normalizedAds.filter(
        (ad) => String(ad.campaign_id) === String(campaign.id || campaign.campaign_id || ""),
      ),
      official_url: redditCampaignUrl(accountId, campaign.id || campaign.campaign_id || ""),
      raw_kind: campaign.kind || "campaign",
      raw: campaign,
    }));
    return {
      status: "synced",
      account_id: accountId,
      key: account.key || "reddit-main",
      account_name: account.display_name || "",
      synced_at: utcNow(),
      metrics_window: "platform_default",
      campaign_count: normalizedCampaigns.length,
      campaigns: minimalCampaigns(normalizedCampaigns, includeCampaigns),
      blockers: [],
    };
  } catch (error) {
    return blocker(`Reddit read-only sync failed: ${error.message}`, account);
  }
}

function mergePlatformAccountSnapshot(existingPlatform = {}, accountSnapshot) {
  const accounts = Array.isArray(existingPlatform.accounts) ? existingPlatform.accounts : [];
  const key = accountSnapshot.key || accountSnapshot.account_id || "default";
  const nextAccounts = accounts.filter(
    (item) => (item.key || item.account_id || "default") !== key,
  );
  nextAccounts.push(accountSnapshot);
  const blockers = nextAccounts.flatMap((item) => item.blockers || []);
  const syncedAccounts = nextAccounts.filter((item) => item.status === "synced");
  return {
    ...existingPlatform,
    status: syncedAccounts.length ? "synced" : blockers.length ? "blocked" : "not_synced",
    account_id: syncedAccounts[0]?.account_id || existingPlatform.account_id || "",
    account_name: syncedAccounts[0]?.account_name || existingPlatform.account_name || "",
    synced_at:
      syncedAccounts
        .map((item) => item.synced_at)
        .filter(Boolean)
        .sort()
        .at(-1) || "",
    accounts: nextAccounts,
    campaign_count: nextAccounts.reduce((sum, item) => sum + Number(item.campaign_count || 0), 0),
    campaigns: nextAccounts.flatMap((item) => item.campaigns || []),
    blockers,
  };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const [configSummary, snapshot] = await Promise.all([loadConfigSummary(), loadPlatformSnapshot()]);
const selectedAccounts = (configSummary.accounts || []).filter((account) => {
  if (args.accountKey && account.key !== args.accountKey) return false;
  if (args.accountId && account.account_id !== args.accountId) return false;
  if (args.google && account.platform === "google") return true;
  if (args.reddit && account.platform === "reddit") return true;
  return false;
});

for (const account of selectedAccounts) {
  if (account.platform === "google") {
    const accountSnapshot = await syncGoogle(args.limit, args.includeCampaigns, account);
    snapshot.platforms.google = mergePlatformAccountSnapshot(
      snapshot.platforms.google,
      accountSnapshot,
    );
  } else if (account.platform === "reddit") {
    const accountSnapshot = await syncReddit(configSummary, args.includeCampaigns, account);
    snapshot.platforms.reddit = mergePlatformAccountSnapshot(
      snapshot.platforms.reddit,
      accountSnapshot,
    );
  }
}
if (!selectedAccounts.length) {
  if (args.google)
    snapshot.platforms.google = await syncGoogle(args.limit, args.includeCampaigns, {});
  if (args.reddit)
    snapshot.platforms.reddit = await syncReddit(configSummary, args.includeCampaigns, {});
}

await savePlatformSnapshot(snapshot);

const proposals = effectiveProposals({ proposals: [] }, snapshot, configSummary).filter(
  (item) => !["platform_analysis", "platform_snapshot"].includes(item.type),
);
console.log(
  JSON.stringify(
    {
      synced_at: snapshot.updated_at,
      platforms: Object.fromEntries(
        Object.entries(snapshot.platforms).map(([key, value]) => [
          key,
          {
            status: value.status,
            account_id: value.account_id,
            campaign_count: value.campaign_count ?? value.campaigns?.length ?? 0,
            local_campaign_samples: value.campaigns?.length || 0,
            blockers: value.blockers || [],
          },
        ]),
      ),
      proposals: proposals.length,
    },
    null,
    2,
  ),
);
