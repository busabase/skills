import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  AGENT_TASKS_PATH,
  CONFIG_EXAMPLE_PATH,
  CONFIG_LOCAL_PATH,
  CURRENT_BATCH_PATH,
  DATA_DIR,
  DECISIONS_PATH,
  EXECUTION_REPORT_PATH,
  GEO_SNAPSHOT_PATH,
  LEGACY_ADS_CONFIG_LOCAL_PATH,
  LOCK_PATH,
  ONBOARDING_PATH,
  PLATFORM_SNAPSHOT_PATH,
  SOURCING_ADS_CONFIG_LOCAL_PATH,
} from "./paths.mjs";

export function utcNow() {
  return new Date().toISOString();
}

export async function pathExists(pathname) {
  try {
    await fs.access(pathname);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/**
 * @param {string} pathname
 * @param {*} [fallback]
 * @returns {Promise<any>}
 */
export async function readJson(pathname, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(pathname, "utf8"));
  } catch (error) {
    if (fallback !== null && error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function writeJson(pathname, value) {
  await fs.mkdir(path.dirname(pathname), { recursive: true });
  const tempPath = `${pathname}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, pathname);
}

export function defaultBatch() {
  const now = utcNow();
  const stamp = now.replace(/\D/g, "").slice(0, 14);
  return {
    batch_id: `cmo-${stamp}`,
    generated_at: now,
    updated_at: now,
    source: "cmo",
    mode: "app-in-skill",
    campaign: { status: "platform_snapshot_required" },
    proposals: [],
  };
}

function normalizeProposals(list, fallback) {
  const source = Array.isArray(list) && list.length ? list : fallback;
  return source.map((item, index) => ({
    ...item,
    id: String(item.id || `proposal-${index + 1}`),
    status: item.status || "draft",
    updated_at: item.updated_at || utcNow(),
  }));
}

function trimCampaigns(list) {
  return (Array.isArray(list) ? list : []).map((item) => ({
    id: String(item.id || ""),
    name: item.name || "",
    status: item.status || "",
    configured_status: item.configured_status || "",
    delivery_status: item.delivery_status || "",
    objective: item.objective || "",
    channel: item.channel || item.objective || "",
    serving_status: item.serving_status || "",
    primary_status: item.primary_status || "",
    bidding_strategy_type: item.bidding_strategy_type || "",
    payment_mode: item.payment_mode || "",
    optimization_score: Number(item.optimization_score || 0),
    tracking_url_template: item.tracking_url_template || "",
    final_url_suffix: item.final_url_suffix || "",
    resource_name: item.resource_name || "",
    budget: item.budget
      ? {
          name: item.budget.name || "",
          amount: Number(item.budget.amount || 0),
          delivery_method: item.budget.delivery_method || "",
          status: item.budget.status || "",
          type: item.budget.type || "",
          explicitly_shared: Boolean(item.budget.explicitly_shared),
          resource_name: item.budget.resource_name || "",
        }
      : undefined,
    official_url: item.official_url || "",
    videos: (Array.isArray(item.videos) ? item.videos : []).map((video) => ({
      id: String(video.id || ""),
      title: video.title || "",
      channel_id: video.channel_id || "",
      duration_millis: Number(video.duration_millis || 0),
      resource_name: video.resource_name || "",
    })),
    ad_groups: (Array.isArray(item.ad_groups) ? item.ad_groups : []).map((adGroup) => ({
      id: String(adGroup.id || ""),
      campaign_id: String(adGroup.campaign_id || ""),
      name: adGroup.name || "",
      status: adGroup.status || "",
      configured_status: adGroup.configured_status || "",
      delivery_status: adGroup.delivery_status || "",
      type: adGroup.type || "",
      cpc_bid: Number(adGroup.cpc_bid || 0),
      goal_type: adGroup.goal_type || "",
      goal_value: Number(adGroup.goal_value || 0),
      optimization_goal: adGroup.optimization_goal || "",
      start_time: adGroup.start_time || "",
      end_time: adGroup.end_time || "",
      targeting: adGroup.targeting || {},
      created_at: adGroup.created_at || "",
      modified_at: adGroup.modified_at || "",
      resource_name: adGroup.resource_name || "",
      raw: adGroup.raw || {},
    })),
    ads: (Array.isArray(item.ads) ? item.ads : []).map((ad) => ({
      id: String(ad.id || ""),
      campaign_id: String(ad.campaign_id || ""),
      ad_group_id: String(ad.ad_group_id || ""),
      name: ad.name || "",
      status: ad.status || "",
      configured_status: ad.configured_status || "",
      delivery_status: ad.delivery_status || "",
      type: ad.type || "",
      final_urls: Array.isArray(ad.final_urls) ? ad.final_urls : [],
      click_url: ad.click_url || "",
      post_id: ad.post_id || "",
      post_url: ad.post_url || "",
      preview_url: ad.preview_url || "",
      preview_expiry: ad.preview_expiry || "",
      profile_id: ad.profile_id || "",
      rejection_reason: ad.rejection_reason || "",
      video_resources: Array.isArray(ad.video_resources) ? ad.video_resources : [],
      videos: (Array.isArray(ad.videos) ? ad.videos : []).map((video) => ({
        id: String(video.id || ""),
        title: video.title || "",
        channel_id: video.channel_id || "",
        duration_millis: Number(video.duration_millis || 0),
        resource_name: video.resource_name || "",
      })),
      resource_name: ad.resource_name || "",
      ad_group_ad_resource_name: ad.ad_group_ad_resource_name || "",
      created_at: ad.created_at || "",
      modified_at: ad.modified_at || "",
      raw: ad.raw || {},
    })),
    metrics: item.metrics
      ? {
          impressions: Number(item.metrics.impressions || 0),
          clicks: Number(item.metrics.clicks || 0),
          cost: Number(item.metrics.cost || 0),
          conversions: Number(item.metrics.conversions || 0),
        }
      : undefined,
    daily: (Array.isArray(item.daily) ? item.daily : []).map((day) => ({
      date: day.date || "",
      impressions: Number(day.impressions || 0),
      clicks: Number(day.clicks || 0),
      cost: Number(day.cost || 0),
      conversions: Number(day.conversions || 0),
    })),
    raw: item.raw || {},
  }));
}

function trimAccountSnapshots(list) {
  return (Array.isArray(list) ? list : []).map((item) => ({
    key: item.key || "",
    account_id: item.account_id || "",
    account_name: item.account_name || "",
    status: item.status || "not_synced",
    synced_at: item.synced_at || "",
    campaign_count: Number(item.campaign_count || 0),
    campaigns: trimCampaigns(item.campaigns),
    blockers: Array.isArray(item.blockers) ? item.blockers : [],
  }));
}

export function normalizeBatch(raw = {}) {
  const fallback = defaultBatch();
  const batch = {
    ...fallback,
    ...raw,
    campaign: { ...fallback.campaign, ...(raw.campaign || {}) },
    proposals: normalizeProposals(raw.proposals, fallback.proposals),
  };
  batch.campaign.status ||= "platform_snapshot_required";
  batch.updated_at ||= utcNow();
  return batch;
}

export function defaultPlatformSnapshot() {
  return {
    source: "platform",
    generated_at: "",
    updated_at: "",
    platforms: {
      google: {
        status: "not_synced",
        account_id: "",
        account_name: "",
        synced_at: "",
        accounts: [],
        campaigns: [],
        metrics_window: "last_30_days",
        blockers: [],
      },
      reddit: {
        status: "not_synced",
        account_id: "",
        account_name: "",
        synced_at: "",
        accounts: [],
        campaigns: [],
        metrics_window: "last_30_days",
        blockers: [],
      },
    },
  };
}

export function normalizePlatformSnapshot(raw = {}) {
  const fallback = defaultPlatformSnapshot();
  return {
    ...fallback,
    ...raw,
    platforms: {
      google: {
        ...fallback.platforms.google,
        ...(raw.platforms?.google || {}),
        accounts: trimAccountSnapshots(raw.platforms?.google?.accounts),
        campaigns: trimCampaigns(raw.platforms?.google?.campaigns),
        campaign_count: Number(
          raw.platforms?.google?.campaign_count || raw.platforms?.google?.campaigns?.length || 0,
        ),
      },
      reddit: {
        ...fallback.platforms.reddit,
        ...(raw.platforms?.reddit || {}),
        accounts: trimAccountSnapshots(raw.platforms?.reddit?.accounts),
        campaigns: trimCampaigns(raw.platforms?.reddit?.campaigns),
        campaign_count: Number(
          raw.platforms?.reddit?.campaign_count || raw.platforms?.reddit?.campaigns?.length || 0,
        ),
      },
    },
  };
}

export async function loadPlatformSnapshot() {
  await ensureDirs();
  return normalizePlatformSnapshot(
    await readJson(PLATFORM_SNAPSHOT_PATH, defaultPlatformSnapshot()),
  );
}

export async function savePlatformSnapshot(snapshot) {
  await ensureDirs();
  const normalized = normalizePlatformSnapshot(snapshot);
  normalized.updated_at = utcNow();
  if (!normalized.generated_at) normalized.generated_at = normalized.updated_at;
  await writeJson(PLATFORM_SNAPSHOT_PATH, normalized);
  return normalized;
}

export function defaultGeoWindow(timeRange = "30d") {
  return {
    time_range: timeRange,
    status: "not_synced",
    overview: {
      aigvrScore: 0,
      mentionRate: 0,
      citationRate: 0,
      completedRecords: 0,
      platformStats: [],
    },
    trend: [],
    prompts: [],
    blind_spots: [],
    content_opportunities: [],
    top_cited_domains: [],
    citation_sources_by_prompt: {},
    notes: [],
    blockers: [],
  };
}

export function defaultGeoSnapshot() {
  return {
    source: "geoly",
    generated_at: "",
    updated_at: "",
    status: "not_synced",
    brand: {},
    windows: {
      "7d": defaultGeoWindow("7d"),
      "30d": defaultGeoWindow("30d"),
    },
    notes: ["Run node .agents/skills/cmo/scripts/sync_geoly.mjs to refresh GEOly cache."],
    blockers: [],
  };
}

const numberOrZero = (value) => Number(value || 0);

function normalizeGeoOverview(raw = {}) {
  const aigvr = raw.aigvr || raw.overview || raw;
  const platformStats = Array.isArray(raw.platformStats)
    ? raw.platformStats
    : Array.isArray(aigvr.platformStats)
      ? aigvr.platformStats
      : [];
  return {
    aigvrScore: numberOrZero(aigvr.score ?? raw.aigvrScore ?? raw.score),
    mentionRate: numberOrZero(aigvr.mentionRate ?? raw.mentionRate),
    citationRate: numberOrZero(aigvr.citationRate ?? raw.citationRate),
    completedRecords: numberOrZero(
      aigvr.completedRecords ?? raw.completedRecords ?? raw.totalCompletedRecords,
    ),
    platformStats: platformStats.map((item) => ({
      platform: String(item.platform ?? item.platformCode ?? item.name ?? ""),
      completedRecords: numberOrZero(item.completedRecords ?? item.completed),
      mentionedCount: numberOrZero(item.mentionedCount ?? item.mentionedRecords),
      mentionRate: numberOrZero(item.mentionRate),
      citationRate: numberOrZero(item.citationRate),
      avgPosition: numberOrZero(item.avgPosition),
    })),
  };
}

function normalizeGeoTrend(list = []) {
  return (Array.isArray(list) ? list : []).map((item) => ({
    date: String(item.date ?? item.day ?? ""),
    platform: String(item.platform ?? item.platformCode ?? ""),
    aigvr: numberOrZero(item.aigvr ?? item.aigvrScore ?? item.score),
    mentionRate: numberOrZero(item.mentionRate),
    citationRate: numberOrZero(item.citationRate),
    completedRecords: numberOrZero(item.completedRecords ?? item.completed),
  }));
}

function normalizeGeoPrompt(item = {}, index = 0) {
  const metrics = item.geoMetrics?.aigvr || item.aigvr || item.metrics || {};
  return {
    id: String(item.id ?? item.prompt_id ?? item.promptId ?? `prompt-${index + 1}`),
    text: String(item.text ?? item.prompt ?? item.query ?? ""),
    topic: String(item.topicName ?? item.topic_name ?? item.category ?? ""),
    platform: String(item.platform ?? item.platformCode ?? ""),
    aigvrScore: numberOrZero(metrics.score ?? item.aigvrScore ?? item.visibility),
    mentionRate: numberOrZero(metrics.mentionRate ?? item.mentionRate),
    citationRate: numberOrZero(metrics.citationRate ?? item.citationRate),
    completedRecords: numberOrZero(metrics.completedRecords ?? item.completedRecords),
    citations: numberOrZero(item.citations ?? item.citationCount),
    lastRunAt: String(item.lastRunAt ?? item.last_run_at ?? item.updatedAt ?? item.createdAt ?? ""),
  };
}

function normalizeGeoCitation(item = {}, index = 0) {
  return {
    id: String(item.id ?? item.url ?? `citation-${index + 1}`),
    url: String(item.url ?? item.href ?? ""),
    domain: String(item.domain ?? item.hostname ?? ""),
    title: String(item.title ?? item.pageTitle ?? ""),
    count: numberOrZero(item.count ?? item.occurrences ?? item.records),
    share: numberOrZero(item.share ?? item.sharePercent ?? item.sharePct),
    platforms: Array.isArray(item.platforms) ? item.platforms.map(String) : [],
    firstSeen: String(item.firstSeen ?? item.first_seen ?? ""),
    lastSeen: String(item.lastSeen ?? item.last_seen ?? ""),
  };
}

function normalizeGeoContentOpportunity(item = {}, index = 0) {
  const citations = numberOrZero(item.citations ?? item.citationCount);
  const brandAffinity = numberOrZero(
    item.brandAffinity ?? item.brandMentionRate ?? item.mentionRate ?? item.coverage,
  );
  const opportunity =
    item.opportunity ??
    item.opportunityScore ??
    item.score ??
    citations * ((100 - brandAffinity) / 100);
  return {
    id: String(item.id ?? item.promptId ?? item.domain ?? `opportunity-${index + 1}`),
    domain: String(item.domain ?? item.targetDomain ?? item.brandDomain ?? ""),
    promptId: String(item.promptId ?? item.prompt_id ?? ""),
    promptText: String(item.promptText ?? item.prompt ?? item.query ?? ""),
    opportunity: numberOrZero(opportunity),
    citations,
    brandAffinity,
    prompts: Array.isArray(item.prompts)
      ? item.prompts.map((prompt) => ({
          id: String(prompt.id ?? prompt.promptId ?? prompt.prompt_id ?? ""),
          text: String(prompt.text ?? prompt.promptText ?? prompt.prompt ?? ""),
          citations: numberOrZero(prompt.citations ?? prompt.citationCount),
          brandAffinity: numberOrZero(
            prompt.brandAffinity ?? prompt.brandMentionRate ?? prompt.mentionRate,
          ),
          competitors: Array.isArray(prompt.competitors) ? prompt.competitors.map(String) : [],
        }))
      : [],
  };
}

function normalizeGeoTopCitedDomain(item = {}, index = 0) {
  return {
    id: String(item.id ?? item.domain ?? `domain-${index + 1}`),
    domain: String(item.domain ?? ""),
    rank: numberOrZero(item.rank ?? index + 1),
    citations: numberOrZero(item.citations ?? item.count ?? item.citationCount),
    uniqueUrls: numberOrZero(item.uniqueUrls ?? item.unique_urls ?? item.pagesCount),
    subdomains: numberOrZero(item.subdomains ?? item.subdomainCount),
    brandAffinity: numberOrZero(
      item.brandAffinity ?? item.brandMentionRate ?? item.mentionRate ?? item.coverage,
    ),
    isBrandDomain: Boolean(item.isBrandDomain),
  };
}

function normalizeGeoWindow(raw = {}, timeRange = "30d") {
  const fallback = defaultGeoWindow(timeRange);
  const citationSources = raw.citation_sources_by_prompt || {};
  return {
    ...fallback,
    ...raw,
    time_range: timeRange,
    status: raw.status || fallback.status,
    overview: normalizeGeoOverview(raw.overview),
    trend: normalizeGeoTrend(raw.trend),
    prompts: (Array.isArray(raw.prompts) ? raw.prompts : []).map(normalizeGeoPrompt),
    blind_spots: (Array.isArray(raw.blind_spots) ? raw.blind_spots : []).map(normalizeGeoPrompt),
    content_opportunities: (Array.isArray(raw.content_opportunities)
      ? raw.content_opportunities
      : []
    ).map(normalizeGeoContentOpportunity),
    top_cited_domains: (Array.isArray(raw.top_cited_domains) ? raw.top_cited_domains : []).map(
      normalizeGeoTopCitedDomain,
    ),
    citation_sources_by_prompt: Object.fromEntries(
      Object.entries(citationSources).map(([promptId, rows]) => [
        promptId,
        (Array.isArray(rows) ? rows : []).map(normalizeGeoCitation),
      ]),
    ),
    notes: Array.isArray(raw.notes) ? raw.notes : fallback.notes,
    blockers: Array.isArray(raw.blockers) ? raw.blockers : fallback.blockers,
  };
}

export function normalizeGeoSnapshot(raw = {}) {
  const fallback = defaultGeoSnapshot();
  const windows = raw.windows || {};
  const normalized = {
    ...fallback,
    ...raw,
    status: raw.status || fallback.status,
    brand: raw.brand || {},
    windows: {
      "7d": normalizeGeoWindow(windows["7d"], "7d"),
      "30d": normalizeGeoWindow(windows["30d"], "30d"),
    },
    notes: Array.isArray(raw.notes) ? raw.notes : fallback.notes,
    blockers: Array.isArray(raw.blockers) ? raw.blockers : fallback.blockers,
  };
  const hasSyncedWindow = Object.values(normalized.windows).some(
    (window) => window.status === "synced",
  );
  if (hasSyncedWindow && normalized.status === "not_synced") normalized.status = "synced";
  return normalized;
}

export async function loadGeoSnapshot() {
  await ensureDirs();
  return normalizeGeoSnapshot(await readJson(GEO_SNAPSHOT_PATH, defaultGeoSnapshot()));
}

export async function saveGeoSnapshot(snapshot) {
  await ensureDirs();
  const normalized = normalizeGeoSnapshot(snapshot);
  normalized.updated_at = utcNow();
  if (!normalized.generated_at) normalized.generated_at = normalized.updated_at;
  await writeJson(GEO_SNAPSHOT_PATH, normalized);
  return normalized;
}

export async function loadBatch() {
  await ensureDirs();
  if (!(await pathExists(CURRENT_BATCH_PATH))) {
    return defaultBatch();
  }
  return normalizeBatch(await readJson(CURRENT_BATCH_PATH));
}

export async function saveBatch(batch) {
  await ensureDirs();
  const normalized = normalizeBatch(batch);
  normalized.updated_at = utcNow();
  await writeJson(CURRENT_BATCH_PATH, normalized);
  return normalized;
}

export async function loadDecisions(batchId = "") {
  const payload = await readJson(DECISIONS_PATH, {
    batch_id: batchId,
    updated_at: utcNow(),
    decision: {},
  });
  if (batchId && payload.batch_id !== batchId) {
    return { batch_id: batchId, updated_at: utcNow(), decision: {} };
  }
  return payload;
}

export async function saveDecision(batch, decision) {
  const existing = await loadDecisions(batch.batch_id);
  const payload = {
    ...existing,
    batch_id: batch.batch_id,
    updated_at: utcNow(),
    decision: {
      action: decision.action || "",
      comment: decision.comment || "",
      decided_at: utcNow(),
    },
  };
  await writeJson(DECISIONS_PATH, payload);
  return payload;
}

export async function saveReviewDecision(batch, review) {
  const existing = await loadDecisions(batch.batch_id);
  const reviews = existing.reviews || {};
  const reviewId = String(review.id || "");
  if (!reviewId) throw new Error("Review id is required");
  reviews[reviewId] = {
    id: reviewId,
    action: review.action || "",
    comment: review.comment || "",
    decided_at: utcNow(),
  };
  const payload = {
    ...existing,
    batch_id: batch.batch_id,
    updated_at: utcNow(),
    reviews,
  };
  await writeJson(DECISIONS_PATH, payload);
  return payload;
}

export async function updateProposalDecision(batch, review) {
  const proposalId = String(review.id || "");
  if (!proposalId) throw new Error("Proposal id is required");
  const proposal = (batch.proposals || []).find((item) => item.id === proposalId);
  if (!proposal) throw new Error(`Unknown proposal: ${proposalId}`);
  const action = review.action || "";
  if (action === "approve") proposal.status = "draft";
  else if (action === "request_changes") proposal.status = "draft";
  else if (action === "block") proposal.status = "blocked";
  proposal.decision = {
    action,
    comment: review.comment || "",
    decided_at: utcNow(),
  };
  proposal.updated_at = utcNow();
  await saveBatch(batch);
  return saveReviewDecision(batch, review);
}

export function platformSnapshotProposals(snapshot, configSummary = {}) {
  const platforms = snapshot.platforms || {};
  return Object.entries(platforms).flatMap(([platformId, platform]) => {
    if (platform.status === "synced") return [];
    const account =
      (configSummary.accounts || []).find((item) => item.platform === platformId) || {};
    const blockers = platform.blockers || [];
    return [
      {
        id: `${platformId}-sync-required`,
        platform: platformId,
        type: "platform_snapshot",
        title: `Sync ${platformId === "google" ? "Google Ads" : "Reddit Ads"} platform data`,
        summary: blockers.length
          ? blockers.join("; ")
          : "Agent needs a read-only platform snapshot before drafting campaign changes.",
        status: account.status === "needs_config" ? "blocked" : "draft",
        account: account.display_name || platform.account_name || "",
        budget: "read-only",
        risk: "read-only account access; no writes",
        next_step:
          account.status === "needs_config"
            ? "Configure account credentials/env first."
            : "Run platform sync, then draft proposals from the synced account state.",
        evidence: ["platform API", "read-only sync"],
        updated_at: platform.synced_at || snapshot.updated_at || utcNow(),
      },
    ];
  });
}

export function effectiveProposals(batch, snapshot, configSummary) {
  return [...(batch.proposals || []), ...platformSnapshotProposals(snapshot, configSummary)];
}

export async function lockPayload() {
  if (!(await pathExists(LOCK_PATH))) return { locked: false };
  const raw = await readJson(LOCK_PATH, {});
  return {
    locked: true,
    path: LOCK_PATH,
    owner: raw.owner || "cmo",
    message: raw.message || "$cmo is writing local app files.",
    started_at: raw.started_at || "",
  };
}

export async function rejectIfLocked() {
  const lock = await lockPayload();
  if (lock.locked) throw new Error(lock.message);
}

export async function loadConfigSummary() {
  const hasLocalConfig = await pathExists(CONFIG_LOCAL_PATH);
  const hasLegacyAdsLocalConfig = await pathExists(LEGACY_ADS_CONFIG_LOCAL_PATH);
  const hasSourcingAdsLocalConfig = await pathExists(SOURCING_ADS_CONFIG_LOCAL_PATH);
  const source = hasLocalConfig
    ? CONFIG_LOCAL_PATH
    : hasLegacyAdsLocalConfig
      ? LEGACY_ADS_CONFIG_LOCAL_PATH
      : hasSourcingAdsLocalConfig
        ? SOURCING_ADS_CONFIG_LOCAL_PATH
        : CONFIG_EXAMPLE_PATH;
  const config = await readJson(source, {});
  const configuredAccounts = Array.isArray(config.accounts) ? config.accounts : [];
  const redditAccountIdEnv = config.reddit_ads?.account_id_env || "REDDIT_ADS_ACCOUNT_ID";
  const redditAccessTokenEnv = config.reddit_ads?.access_token_env || "REDDIT_ADS_ACCESS_TOKEN";
  const googleCustomerIdEnv = config.google_ads?.customer_id_env || "GOOGLE_ADS_CUSTOMER_ID";
  const googleDeveloperTokenEnv =
    config.google_ads?.developer_token_env || "GOOGLE_ADS_DEVELOPER_TOKEN";
  const googleClientSecretPath = path.join(
    os.homedir(),
    ".config",
    "google-ads",
    "client_secret.json",
  );
  const googleTokenPath = path.join(os.homedir(), ".config", "google-ads", "token.json");
  const googleEnvPath = path.join(os.homedir(), ".config", "google-ads", "env.json");
  const googleLocalEnv = await readJson(googleEnvPath, {});
  const googleRepoRoot =
    process.env.ADS_GOOGLE_REPO_ROOT ||
    config.google_ads?.default_repo_root ||
    path.join(os.homedir(), "Documents", "kapps");
  const googleClientSecretExists = await pathExists(googleClientSecretPath);
  const googleTokenExists = await pathExists(googleTokenPath);
  const googleRepoExists = await pathExists(path.join(googleRepoRoot, "pnpm-workspace.yaml"));
  const googleDeveloperTokenSet = Boolean(
    process.env[googleDeveloperTokenEnv] || googleLocalEnv.GOOGLE_ADS_DEVELOPER_TOKEN,
  );
  const googleSharedReady = Boolean(googleDeveloperTokenSet && googleClientSecretExists);
  const redditConfigured = Boolean(
    config.reddit_ads?.account_id || process.env[redditAccountIdEnv],
  );
  const redditApiReady = Boolean(redditConfigured && process.env[redditAccessTokenEnv]);
  const fallbackAccounts = [
    {
      platform: "google",
      key: "google-main",
      display_name: "Google Ads main",
      account_id:
        process.env[googleCustomerIdEnv] ||
        googleLocalEnv.GOOGLE_ADS_CUSTOMER_ID ||
        configuredAccounts.find((account) => account.platform === "google")?.account_id ||
        "",
      login_customer_id:
        configuredAccounts.find((account) => account.platform === "google")?.login_customer_id ||
        process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        "",
      status:
        googleSharedReady &&
        (process.env[googleCustomerIdEnv] ||
          googleLocalEnv.GOOGLE_ADS_CUSTOMER_ID ||
          configuredAccounts.find((account) => account.platform === "google")?.account_id)
          ? "ready"
          : "needs_config",
      checks: {
        customer_id: Boolean(process.env[googleCustomerIdEnv]),
        developer_token: googleDeveloperTokenSet,
        client_secret: googleClientSecretExists,
        oauth_token: googleTokenExists,
        kapps_repo: googleRepoExists,
      },
    },
    {
      platform: "reddit",
      key: "reddit-main",
      display_name: "Reddit Ads main",
      account_id: process.env[redditAccountIdEnv] || config.reddit_ads?.account_id || "",
      status: redditApiReady ? "api_ready" : redditConfigured ? "planning_ready" : "needs_config",
      checks: {
        account_id: redditConfigured,
        access_token: Boolean(process.env[redditAccessTokenEnv]),
        official_docs: true,
        app_ui: true,
      },
    },
  ];
  const accountSources = configuredAccounts.length ? configuredAccounts : fallbackAccounts;
  const accounts = [];
  for (const [index, account] of accountSources.entries()) {
    const base = fallbackAccounts.find((item) => item.platform === account.platform) || {};
    const accountIdEnv = account.account_id_env || base.account_id_env;
    const accountId = accountIdEnv
      ? process.env[accountIdEnv] || account.account_id || ""
      : account.account_id || base.account_id || "";
    const merged = {
      ...base,
      ...account,
      key: account.key || `${account.platform}-${index + 1}`,
      display_name: account.display_name || base.display_name || `${account.platform} account`,
      account_id: accountId,
    };
    if (account.platform === "google") {
      merged.login_customer_id =
        account.login_customer_id ||
        process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        googleLocalEnv.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        "";
    }
    if (account.platform === "google") {
      merged.status = googleSharedReady && accountId ? "ready" : "needs_config";
      merged.checks = {
        customer_id: Boolean(accountId),
        developer_token: googleDeveloperTokenSet,
        client_secret: googleClientSecretExists,
        oauth_token: googleTokenExists,
        kapps_repo: googleRepoExists,
      };
    } else if (account.platform === "reddit") {
      const accessTokenEnv = account.access_token_env || redditAccessTokenEnv;
      const hasAccount = Boolean(accountId);
      const hasToken = Boolean(process.env[accessTokenEnv]);
      merged.status =
        hasAccount && hasToken ? "api_ready" : hasAccount ? "planning_ready" : "needs_config";
      merged.checks = {
        account_id: hasAccount,
        access_token: hasToken,
        official_docs: true,
      };
    }
    merged.configured = merged.status !== "needs_config";
    accounts.push(merged);
  }
  const platformCoverage = (platformId) => {
    const platformAccounts = accounts.filter((account) => account.platform === platformId);
    const connected = platformAccounts.filter(
      (account) => account.status !== "needs_config",
    ).length;
    return { total: platformAccounts.length, connected };
  };
  const googleCoverage = platformCoverage("google");
  const redditCoverage = platformCoverage("reddit");
  return {
    provider: "platform",
    config_source: source,
    using_example: !hasLocalConfig && !hasLegacyAdsLocalConfig && !hasSourcingAdsLocalConfig,
    brand: config.brand?.name || "",
    homepage: config.brand?.homepage || "",
    positioning: config.brand?.positioning || "",
    accounts,
    platforms: [
      {
        id: "google",
        name: "Google Ads",
        status: googleCoverage.connected ? "partial_ready" : "needs_config",
        mode: "execution scripts",
        capabilities: ["SEM Search create/dry-run/pause", "YouTube video create/dry-run/pause"],
        write_risk: "Can create or pause real Google Ads campaigns after confirmation",
        coverage: googleCoverage,
      },
      {
        id: "reddit",
        name: "Reddit Ads",
        status: redditCoverage.connected ? "partial_ready" : "needs_config",
        mode: "platform sync",
        capabilities: [
          "Read-only sync",
          "Proposal diffs",
          "Preflight evidence",
          "Paused platform writes",
        ],
        write_risk: "No live API execution in the app",
        coverage: redditCoverage,
      },
    ],
    google: {
      customer_id_env: googleCustomerIdEnv,
      developer_token_env: googleDeveloperTokenEnv,
      client_secret_path: googleClientSecretPath,
      token_path: googleTokenPath,
      repo_root: googleRepoRoot,
      configured: googleSharedReady,
    },
    api_docs: config.reddit_ads?.official_api_docs || "https://ads-api.reddit.com/docs/v3/",
    postman_workspace: config.reddit_ads?.official_postman_workspace || "",
    account_id_configured: redditConfigured,
    access_token_configured: Boolean(process.env[redditAccessTokenEnv]),
    account_id_env: redditAccountIdEnv,
    access_token_env: redditAccessTokenEnv,
    default_launch_status: config.reddit_ads?.default_launch_status || "paused",
  };
}

export async function loadExecutionReport() {
  if (!(await pathExists(EXECUTION_REPORT_PATH))) return null;
  return readJson(EXECUTION_REPORT_PATH, {});
}

// --- App-in-Skill review model (Busabase-aligned) -------------------------
// Internal workflow states shared verbatim with the Busabase change-request
// lifecycle. The app frontend still reads the legacy `draft`/`blocked`/`running`
// proposal statuses, so `toFrontendStatus` maps the canonical vocabulary back
// to what the UI expects at the API boundary.
export const REVIEW_STATES = Object.freeze([
  "needs_review",
  "changes_requested",
  "approved",
  "done",
  "blocked",
]);

export const VERDICTS = Object.freeze(["approve", "request_changes", "revise", "block"]);

// Canonical review state -> legacy proposal status the current UI understands.
export function toFrontendStatus(state) {
  switch (state) {
    case "blocked":
      return "blocked";
    case "done":
      return "done";
    case "approved":
      return "approved";
    default:
      return "draft"; // needs_review / changes_requested render as an actionable draft
  }
}

// Verdict verb -> resulting canonical review state.
export function verdictToState(action) {
  switch (action) {
    case "approve":
      return "approved";
    case "request_changes":
      return "changes_requested";
    case "block":
      return "blocked";
    case "revise":
      return "needs_review";
    default:
      return "needs_review";
  }
}

export async function loadOnboarding() {
  return readJson(ONBOARDING_PATH, { completed: false });
}

export async function saveOnboarding(marker = {}) {
  const payload = {
    completed: Boolean(marker.completed),
    completed_at: marker.completed ? marker.completed_at || utcNow() : "",
    config_version: marker.config_version || "1",
  };
  await writeJson(ONBOARDING_PATH, payload);
  return payload;
}

export async function isOnboarded() {
  const marker = await loadOnboarding();
  return Boolean(marker.completed);
}

export async function loadAgentTasks() {
  return readJson(AGENT_TASKS_PATH, { updated_at: utcNow(), tasks: [] });
}

// Rebuild the agent task queue from the current batch + decisions: any proposal
// in `changes_requested` or carrying an `@ai` comment is queued work for the agent.
export async function syncAgentTasks(batch, decisions = {}) {
  const reviews = decisions.reviews || {};
  const tasks = (batch.proposals || [])
    .map((proposal) => {
      const review = reviews[proposal.id] || {};
      const comment = String(proposal.decision?.comment || review.comment || "");
      const mentionsAi = /@ai\b/i.test(comment);
      const changesRequested =
        proposal.review_state === "changes_requested" || review.action === "request_changes";
      if (!changesRequested && !mentionsAi) return null;
      return {
        id: proposal.id,
        title: proposal.title || proposal.id,
        reason: changesRequested ? "changes_requested" : "ai_comment",
        comment,
        mentions_ai: mentionsAi,
        queued_at: utcNow(),
      };
    })
    .filter(Boolean);
  const payload = { updated_at: utcNow(), tasks };
  await writeJson(AGENT_TASKS_PATH, payload);
  return payload;
}

export function computeCounts(batch, decisionPayload = {}) {
  const proposals = batch.proposals || [];
  return computeCountsFromProposals(batch, proposals, decisionPayload);
}

export function computeCountsFromProposals(_batch, proposals = [], decisionPayload = {}) {
  return {
    needs_review: proposals.filter((item) => item.status === "draft").length,
    ready_for_agent_next: decisionPayload.decision?.action === "approve_dry_run" ? 1 : 0,
    blocked: proposals.filter((item) => item.status === "blocked").length,
    approved: 0,
    drafts: proposals.filter((item) => item.status === "draft").length,
    running: proposals.filter((item) => item.status === "running").length,
    proposal_approved: 0,
  };
}
