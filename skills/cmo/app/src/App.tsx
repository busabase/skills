import {
  BarChart3,
  Cable,
  ChevronDown,
  CircleAlert,
  FileSearch,
  Globe2,
  Info,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  MousePointerClick,
  PanelLeft,
  Radar,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useI18n } from "./i18n";
import { SUPPORTED_LANGS } from "./i18n/messages";

type Route =
  | "overview"
  | "traffic"
  | "search"
  | "keywords"
  | "pages"
  | "geo"
  | "ads"
  | "ads-assets"
  | "ads-accounts"
  | "ads-runs"
  | "integrations"
  | "settings";
type TimeRange = "7d" | "30d" | "90d";
type GeoTimeRange = "7d" | "30d";

interface Metrics {
  impressions?: number;
  clicks?: number;
  cost?: number;
  conversions?: number;
}

interface CampaignBudget {
  name?: string;
  amount?: number;
  delivery_method?: string;
  status?: string;
  type?: string;
  explicitly_shared?: boolean;
  resource_name?: string;
}

interface CampaignVideo {
  id?: string;
  title?: string;
  channel_id?: string;
  duration_millis?: number;
  resource_name?: string;
}

interface CampaignAdGroup {
  id?: string;
  campaign_id?: string;
  name?: string;
  status?: string;
  configured_status?: string;
  delivery_status?: string;
  type?: string;
  cpc_bid?: number;
  goal_type?: string;
  goal_value?: number;
  optimization_goal?: string;
  start_time?: string;
  end_time?: string;
  targeting?: Record<string, unknown>;
  created_at?: string;
  modified_at?: string;
  resource_name?: string;
  raw?: Record<string, unknown>;
}

interface CampaignAd {
  id?: string;
  campaign_id?: string;
  ad_group_id?: string;
  name?: string;
  status?: string;
  configured_status?: string;
  delivery_status?: string;
  type?: string;
  final_urls?: string[];
  click_url?: string;
  post_id?: string;
  post_url?: string;
  preview_url?: string;
  preview_expiry?: string;
  profile_id?: string;
  rejection_reason?: string;
  video_resources?: string[];
  videos?: CampaignVideo[];
  resource_name?: string;
  ad_group_ad_resource_name?: string;
  created_at?: string;
  modified_at?: string;
  raw?: Record<string, unknown>;
}

interface CampaignDaily {
  date?: string;
  impressions?: number;
  clicks?: number;
  cost?: number;
  conversions?: number;
}

interface Campaign {
  id?: string;
  name?: string;
  status?: string;
  configured_status?: string;
  delivery_status?: string;
  channel?: string;
  objective?: string;
  serving_status?: string;
  primary_status?: string;
  bidding_strategy_type?: string;
  payment_mode?: string;
  optimization_score?: number;
  tracking_url_template?: string;
  final_url_suffix?: string;
  resource_name?: string;
  budget?: CampaignBudget;
  metrics?: Metrics;
  daily?: CampaignDaily[];
  videos?: CampaignVideo[];
  ad_groups?: CampaignAdGroup[];
  ads?: CampaignAd[];
  official_url?: string;
  raw?: Record<string, unknown>;
}

interface AccountSnapshot {
  key?: string;
  account_id?: string;
  account_name?: string;
  status?: string;
  synced_at?: string;
  campaign_count?: number;
  campaigns?: Campaign[];
}

interface PlatformSnapshot {
  status?: string;
  account_id?: string;
  account_name?: string;
  synced_at?: string;
  campaign_count?: number;
  accounts?: AccountSnapshot[];
  campaigns?: Campaign[];
  blockers?: string[];
}

interface Proposal {
  id: string;
  title?: string;
  summary?: string;
  status?: string;
  platform?: string;
  account?: string;
  type?: string;
  budget?: string;
  risk?: string;
  next_step?: string;
  updated_at?: string;
  proposed_structure?: {
    campaign_name?: string;
    video_assets?: DraftVideoAsset[];
    ad_groups?: Array<{ name?: string; audience?: string; assets?: string[] }>;
  };
}

interface DraftVideoAsset {
  video_id?: string;
  title?: string;
  url?: string;
  language?: string;
  format?: string;
  source?: string;
  google_ads_asset_resource_name?: string;
  google_ads_asset_id?: string;
  google_ads_asset_status?: string;
  google_ads_asset_synced_at?: string;
}

interface AccountConfig {
  platform?: string;
  key?: string;
  display_name?: string;
  account_id?: string;
  status?: string;
  checks?: Record<string, boolean>;
}

interface PlatformConfig {
  id: string;
  name: string;
  mode?: string;
  capabilities?: string[];
  write_risk?: string;
}

interface CmoState {
  data_provider?: string;
  batch?: { batch_id?: string; updated_at?: string; proposals?: Proposal[] };
  counts?: Record<string, number>;
  decisions?: Record<string, unknown>;
  lock?: { locked?: boolean; message?: string };
  config_summary?: {
    brand?: string;
    positioning?: string;
    accounts?: AccountConfig[];
    platforms?: PlatformConfig[];
    using_example?: boolean;
    config_source?: string;
    data_provider?: string;
    api_docs?: string;
    postman_workspace?: string;
    default_launch_status?: string;
  };
  platform_snapshot?: { platforms?: Record<string, PlatformSnapshot> };
  execution_report?: Record<string, unknown> | null;
  onboarding?: { completed?: boolean; completed_at?: string };
  agent_tasks?: { count?: number; updated_at?: string };
}

interface CampaignRow {
  id: string;
  source: "platform" | "draft";
  platform: string;
  platformName: string;
  account: string;
  name: string;
  status: string;
  channel: string;
  metrics?: Metrics;
  daily?: CampaignDaily[];
  videos?: CampaignVideo[];
  ad_groups?: CampaignAdGroup[];
  ads?: CampaignAd[];
  serving_status?: string;
  primary_status?: string;
  bidding_strategy_type?: string;
  payment_mode?: string;
  optimization_score?: number;
  tracking_url_template?: string;
  final_url_suffix?: string;
  resource_name?: string;
  budget_detail?: CampaignBudget;
  budget?: string;
  risk?: string;
  next_step?: string;
  summary?: string;
  proposal?: Proposal;
  official_url?: string;
  raw?: Record<string, unknown>;
  updated_at?: string;
}

type CampaignDetailTab = "overview" | "structure" | "creatives" | "performance" | "raw";

interface AdsAssetRow {
  key: string;
  videoId: string;
  title: string;
  url: string;
  format: string;
  language: string;
  source: string;
  status: string;
  assetResourceName: string;
  assetId: string;
  lastSynced: string;
  proposalIds: string[];
  campaignIds: string[];
  campaignNames: string[];
  campaignRefs: AdsAssetCampaignRef[];
  adIds: string[];
}

interface AdsAssetCampaignRef {
  rowId: string;
  id: string;
  name: string;
  platform: string;
  account: string;
  status: string;
  adIds: string[];
  sources: string[];
}

type AdsAssetCampaignRefInput = Partial<Omit<AdsAssetCampaignRef, "adIds" | "sources">> & {
  adIds?: string[];
  sources?: string[];
};
type AdsAssetInput = Partial<Omit<AdsAssetRow, "campaignRefs">> & {
  videoId?: string;
  assetResourceName?: string;
  campaignRefs?: AdsAssetCampaignRefInput[];
};

interface MarketingAction {
  priority: "P0" | "P1" | "P2";
  pillar: string;
  title: string;
  description: string;
  ownerHint: string;
}

interface IntegrationStatus {
  provider: string;
  connected: boolean;
  configured?: boolean;
  source: string;
  setupHint: string;
  requiredEnv?: string[];
  missingEnv?: string[];
}

interface MarketingStats {
  pageviews: number;
  sessions: number;
  newUsers: number;
  users: number;
  bounceRate: number;
  avgDuration: number;
  organicClicks: number;
  organicImpressions: number;
  organicCtr: number;
  averagePosition: number;
  keywordIdeas?: number;
}

interface TrendPoint {
  date: string;
  sessions: number;
  newUsers: number;
  pageviews: number;
  organicClicks: number;
  impressions: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
  newUsers: number;
  users: number;
  engagedSessions: number;
  engagementRate: number;
  conversions: number;
}

interface ManualTrafficSource {
  source: string;
  sessions: number;
  newUsers: number;
  users: number;
  engagedSessions: number;
  conversions: number;
}

interface SearchQuery {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  intent: string;
  action: string;
  priorityScore?: number;
  reason?: string;
}

interface KeywordCoverage {
  keyword: string;
  recommendedChannel: "SEO" | "GEO" | "SEM" | "Mixed";
  heatScore: number;
  gapScore: number;
  seoCoverageStatus: "covered" | "weak" | "missing";
  semCoverageStatus: "covered" | "weak" | "missing" | "not_applicable";
  averageMonthlySearches: number;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  primaryPage: string | null;
  recommendation: string;
}

interface LandingPageCoverage {
  path: string;
  views: number;
  sessions: number;
  organicClicks: number;
  impressions: number;
  ctr: number;
  position: number;
  opportunity: string;
  coveredKeywords: KeywordCoverage[];
  missingKeywords: KeywordCoverage[];
  geoReadinessScore: number;
  aiOptimizationScore: number;
  recommendation: string;
}

interface CoverageSummary {
  totalKeywords: number;
  weakKeywords: number;
  missingKeywords: number;
  hotKeywords: number;
  averageGapScore: number;
  geoReadinessScore: number;
  aiOptimizationScore: number;
}

interface MarketingOverview {
  integrations: IntegrationStatus[];
  stats: MarketingStats;
  trend: TrendPoint[];
  sources: TrafficSource[];
  topPages: Array<{
    path: string;
    views: number;
    sessions: number;
    organicClicks: number;
    impressions: number;
    ctr: number;
    position: number;
    opportunity: string;
  }>;
  searchQueries: SearchQuery[];
  keywordCoverage: KeywordCoverage[];
  landingPageCoverage: LandingPageCoverage[];
  coverageSummary: CoverageSummary;
  ads: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalCostMicros: number;
    totalClicks: number;
    totalConversions: number;
    currencyCode: string;
    campaigns: Array<{
      id: string;
      name: string;
      status: string;
      clicks: number;
      costMicros: number;
      conversions: number;
      recommendation: string;
    }>;
  };
  actions: MarketingAction[];
  notes: string[];
}

interface MarketingKeywords {
  activeIcp: { id: string; name: string } | null;
  icpSeeds: Array<{ id: string; name: string }>;
  keywordCoverage: KeywordCoverage[];
  coverageSummary: CoverageSummary;
  actions: MarketingAction[];
  notes: string[];
}

interface MarketingPages {
  stats: {
    pageviews: number;
    sessions: number;
    organicClicks: number;
    organicImpressions: number;
    geoReadinessScore: number;
    aiOptimizationScore: number;
  };
  coverageSummary: CoverageSummary;
  pages: LandingPageCoverage[];
  notes: string[];
}

interface MarketingTraffic {
  stats: MarketingStats;
  trend: TrendPoint[];
  sources: TrafficSource[];
  manualSources: ManualTrafficSource[];
  topPages: MarketingOverview["topPages"];
  notes: string[];
}

interface MarketingSearch {
  stats: Pick<
    MarketingStats,
    "organicClicks" | "organicImpressions" | "organicCtr" | "averagePosition"
  >;
  queries: SearchQuery[];
  opportunities: SearchQuery[];
  actions: MarketingAction[];
  notes: string[];
}

interface GeoOverview {
  aigvrScore: number;
  mentionRate: number;
  citationRate: number;
  completedRecords: number;
  platformStats: Array<{
    platform: string;
    completedRecords: number;
    mentionedCount: number;
    mentionRate: number;
    citationRate: number;
    avgPosition: number;
  }>;
}

interface GeoTrendPoint {
  date: string;
  platform?: string;
  aigvr: number;
  mentionRate: number;
  citationRate: number;
  completedRecords: number;
}

interface GeoPrompt {
  id: string;
  text: string;
  topic: string;
  platform: string;
  aigvrScore: number;
  mentionRate: number;
  citationRate: number;
  completedRecords: number;
  citations: number;
  lastRunAt: string;
}

interface GeoCitationSource {
  id: string;
  url: string;
  domain: string;
  title: string;
  count: number;
  share: number;
  platforms: string[];
  firstSeen: string;
  lastSeen: string;
}

interface GeoContentOpportunity {
  id: string;
  domain: string;
  promptId: string;
  promptText: string;
  opportunity: number;
  citations: number;
  brandAffinity: number;
  prompts?: Array<{
    id: string;
    text: string;
    citations: number;
    brandAffinity: number;
    competitors: string[];
  }>;
}

interface GeoTopCitedDomain {
  id: string;
  domain: string;
  rank: number;
  citations: number;
  uniqueUrls: number;
  subdomains: number;
  brandAffinity: number;
  isBrandDomain: boolean;
}

interface GeoWindow {
  time_range: GeoTimeRange;
  status: string;
  start_date?: string;
  end_date?: string;
  overview: GeoOverview;
  trend: GeoTrendPoint[];
  prompts: GeoPrompt[];
  blind_spots: GeoPrompt[];
  content_opportunities: GeoContentOpportunity[];
  top_cited_domains: GeoTopCitedDomain[];
  citation_sources_by_prompt: Record<string, GeoCitationSource[]>;
  selected_prompt_id: string;
  selected_citation_sources: GeoCitationSource[];
  notes: string[];
  blockers: string[];
}

interface GeoSnapshot {
  source: string;
  generated_at: string;
  updated_at: string;
  status: string;
  brand: { name?: string; homepage?: string; geoly_brand_id?: string; geoly_org_id?: string };
  selected_time_range: GeoTimeRange;
  window: GeoWindow;
  notes: string[];
  blockers: string[];
}

const navigationSections: Array<{
  label?: string;
  items: Array<{ id: Route; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    items: [
      { id: "overview", label: "Command Center", icon: LayoutDashboard },
      { id: "traffic", label: "Traffic", icon: BarChart3 },
      { id: "search", label: "Search", icon: Search },
      { id: "keywords", label: "Keywords", icon: Globe2 },
      { id: "pages", label: "Landing Pages", icon: FileSearch },
      { id: "geo", label: "GEO", icon: Radar },
    ],
  },
  {
    label: "Ads",
    items: [
      { id: "ads", label: "Campaigns", icon: MousePointerClick },
      { id: "ads-assets", label: "Ads Assets", icon: Library },
      { id: "ads-accounts", label: "Accounts", icon: Cable },
      { id: "ads-runs", label: "Runs", icon: ListChecks },
    ],
  },
  {
    items: [
      { id: "integrations", label: "Integrations", icon: Cable },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];
const routePaths: Record<Route, string> = {
  overview: "/",
  traffic: "/traffic",
  search: "/search",
  keywords: "/keywords",
  pages: "/landing-pages",
  geo: "/geo",
  ads: "/ads/campaigns",
  "ads-assets": "/ads/assets",
  "ads-accounts": "/ads/accounts",
  "ads-runs": "/ads/runs",
  integrations: "/integrations",
  settings: "/settings",
};
const campaignDetailPath = (campaignRowId: string) =>
  `/ads/campaigns/${encodeURIComponent(campaignRowId)}`;
const routeFromPath = (pathname: string): Route => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/ads") return "ads";
  if (normalized.startsWith("/ads/campaigns/")) return "ads";
  const match = Object.entries(routePaths).find(([, routePath]) => routePath === normalized);
  return (match?.[0] as Route | undefined) ?? "overview";
};
const campaignIdFromPath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (!normalized.startsWith("/ads/campaigns/")) return "";
  const encoded = normalized.slice("/ads/campaigns/".length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

const number = (value = 0) => Number(value || 0).toLocaleString();
const money = (value = 0, currency = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const moneyMicros = (value = 0, currency = "USD") =>
  money(Number(value || 0) / 1_000_000, currency);
const percent = (value = 0) => `${Number(value || 0).toFixed(1)}%`;
const score = (value = 0) => Number(value || 0).toFixed(1);
const statusLabel = (value = "unknown") => String(value).replaceAll("_", " ");
const officialCampaignUrl = (platformId: string, campaignId: string) => {
  if (!campaignId) return "";
  if (platformId === "google") {
    return `https://ads.google.com/aw/campaigns?campaignId=${encodeURIComponent(campaignId)}`;
  }
  return "";
};
const rate = (numerator = 0, denominator = 0) => {
  const bottom = Number(denominator || 0);
  if (!bottom) return "0%";
  return `${((Number(numerator || 0) / bottom) * 100).toFixed(2)}%`;
};
const unitCost = (cost = 0, count = 0) => {
  const units = Number(count || 0);
  if (!units) return "-";
  return money(Number(cost || 0) / units);
};
const formatSyncTime = (value?: string) => {
  if (!value) return "Not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};
const formatDuration = (millis = 0) => {
  const seconds = Math.round(Number(millis || 0) / 1000);
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
};
const youtubeUrl = (videoId?: string) =>
  videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "";
const youtubeEmbedUrl = (videoId?: string) =>
  videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1` : "";
const youtubeThumbnailUrl = (videoId?: string) =>
  videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : "";
const budgetText = (row: CampaignRow) => {
  if (row.budget_detail?.amount) {
    const delivery = row.budget_detail.delivery_method
      ? ` · ${row.budget_detail.delivery_method}`
      : "";
    return `${money(row.budget_detail.amount)} / day${delivery}`;
  }
  return row.budget || "From platform";
};
const platformTerms = (platform: string) => {
  if (platform === "reddit")
    return { group: "Ad group", groupPlural: "Ad groups", ad: "Ad", adPlural: "Ads" };
  return { group: "Ad group", groupPlural: "Ad groups", ad: "Ad", adPlural: "Ads" };
};
const adsWithVideoFallback = (row: CampaignRow) =>
  (row.ads ?? []).map((ad) => {
    if (ad.videos?.length) return ad;
    if (String(ad.type || "").includes("VIDEO") && row.videos?.length === 1) {
      return { ...ad, videos: row.videos };
    }
    return ad;
  });
const mergeUnique = (current: string[], additions: Array<string | undefined>) => [
  ...new Set([...current, ...additions.filter(Boolean).map(String)]),
];
const mergeCampaignRefs = (
  current: AdsAssetCampaignRef[],
  additions: Array<AdsAssetCampaignRefInput | undefined>,
) => {
  const refs = new Map(current.map((ref) => [ref.id || ref.name, ref]));
  for (const addition of additions) {
    if (!addition) continue;
    const key = addition.id || addition.name;
    if (!key) continue;
    const existing =
      refs.get(key) ??
      ({
        id: "",
        rowId: "",
        name: "",
        platform: "",
        account: "",
        status: "",
        adIds: [],
        sources: [],
      } satisfies AdsAssetCampaignRef);
    refs.set(key, {
      id: addition.id || existing.id,
      rowId: addition.rowId || existing.rowId,
      name: addition.name || existing.name,
      platform: addition.platform || existing.platform,
      account: addition.account || existing.account,
      status: addition.status || existing.status,
      adIds: mergeUnique(existing.adIds, addition.adIds ?? []),
      sources: mergeUnique(existing.sources, addition.sources ?? []),
    });
  }
  return [...refs.values()];
};
const collectAdsAssets = (rows: CampaignRow[]) => {
  const assetMap = new Map<string, AdsAssetRow>();
  const aliasMap = new Map<string, string>();

  const upsert = (asset: AdsAssetInput) => {
    const aliases = mergeUnique([], [asset.assetResourceName, asset.videoId, asset.key]);
    const existingKey = aliases.map((alias) => aliasMap.get(alias)).find(Boolean);
    const key = existingKey || asset.assetResourceName || asset.videoId || asset.key;
    if (!key) return;
    const current =
      assetMap.get(key) ??
      ({
        key,
        videoId: "",
        title: "",
        url: "",
        format: "",
        language: "",
        source: "",
        status: "",
        assetResourceName: "",
        assetId: "",
        lastSynced: "",
        proposalIds: [],
        campaignIds: [],
        campaignNames: [],
        campaignRefs: [],
        adIds: [],
      } satisfies AdsAssetRow);

    assetMap.set(key, {
      ...current,
      videoId: asset.videoId || current.videoId,
      title: asset.title || current.title,
      url: asset.url || current.url || youtubeUrl(asset.videoId),
      format: asset.format || current.format,
      language: asset.language || current.language,
      source: mergeUnique(current.source ? current.source.split(", ") : [], [asset.source]).join(
        ", ",
      ),
      status: asset.status || current.status,
      assetResourceName: asset.assetResourceName || current.assetResourceName,
      assetId: asset.assetId || current.assetId,
      lastSynced: asset.lastSynced || current.lastSynced,
      proposalIds: mergeUnique(current.proposalIds, asset.proposalIds ?? []),
      campaignIds: mergeUnique(current.campaignIds, asset.campaignIds ?? []),
      campaignNames: mergeUnique(current.campaignNames, asset.campaignNames ?? []),
      campaignRefs: mergeCampaignRefs(current.campaignRefs, asset.campaignRefs ?? []),
      adIds: mergeUnique(current.adIds, asset.adIds ?? []),
    });
    for (const alias of aliases) aliasMap.set(alias, key);
  };

  for (const row of rows) {
    if (row.proposal?.proposed_structure?.video_assets?.length) {
      for (const asset of row.proposal.proposed_structure.video_assets) {
        upsert({
          videoId: asset.video_id,
          title: asset.title,
          url: asset.url,
          format: asset.format,
          language: asset.language,
          source: asset.source || "draft",
          status: asset.google_ads_asset_status || row.status,
          assetResourceName: asset.google_ads_asset_resource_name,
          assetId: asset.google_ads_asset_id,
          lastSynced: asset.google_ads_asset_synced_at,
          proposalIds: [row.proposal.id],
          campaignNames: [row.proposal.proposed_structure.campaign_name || row.name],
          campaignRefs: [
            {
              id: row.proposal.id,
              rowId: row.id,
              name: row.proposal.proposed_structure.campaign_name || row.name,
              platform: row.platformName,
              account: row.account,
              status: row.status,
              sources: ["draft proposal"],
            },
          ],
        });
      }
    }

    if (row.source === "platform") {
      for (const video of row.videos ?? []) {
        upsert({
          videoId: video.id,
          title: video.title,
          url: youtubeUrl(video.id),
          source: "campaign video",
          status: row.status,
          assetResourceName: video.resource_name,
          assetId: video.resource_name?.split("/").pop(),
          lastSynced: row.updated_at,
          campaignIds: [String(row.raw?.id || row.id.split(":").at(-1) || "")],
          campaignNames: [row.name],
          campaignRefs: [
            {
              id: String(row.raw?.id || row.id.split(":").at(-1) || ""),
              rowId: row.id,
              name: row.name,
              platform: row.platformName,
              account: row.account,
              status: row.status,
              sources: ["campaign video"],
            },
          ],
        });
      }
      for (const ad of row.ads ?? []) {
        for (const video of ad.videos ?? []) {
          upsert({
            videoId: video.id,
            title: video.title,
            url: youtubeUrl(video.id),
            source: "ad creative",
            status: ad.status || row.status,
            assetResourceName: video.resource_name,
            assetId: video.resource_name?.split("/").pop(),
            lastSynced: row.updated_at,
            campaignIds: [String(row.raw?.id || row.id.split(":").at(-1) || "")],
            campaignNames: [row.name],
            adIds: [ad.id ? String(ad.id) : ""],
            campaignRefs: [
              {
                id: String(row.raw?.id || row.id.split(":").at(-1) || ""),
                rowId: row.id,
                name: row.name,
                platform: row.platformName,
                account: row.account,
                status: row.status,
                adIds: [ad.id ? String(ad.id) : ""],
                sources: ["ad creative"],
              },
            ],
          });
        }
        for (const resource of ad.video_resources ?? []) {
          upsert({
            assetResourceName: resource,
            source: "ad resource",
            status: ad.status || row.status,
            assetId: resource.split("/").pop(),
            lastSynced: row.updated_at,
            campaignIds: [String(row.raw?.id || row.id.split(":").at(-1) || "")],
            campaignNames: [row.name],
            adIds: [ad.id ? String(ad.id) : ""],
            campaignRefs: [
              {
                id: String(row.raw?.id || row.id.split(":").at(-1) || ""),
                rowId: row.id,
                name: row.name,
                platform: row.platformName,
                account: row.account,
                status: row.status,
                adIds: [ad.id ? String(ad.id) : ""],
                sources: ["ad resource"],
              },
            ],
          });
        }
      }
    }
  }

  return [...assetMap.values()].sort(
    (a, b) =>
      (b.lastSynced || "").localeCompare(a.lastSynced || "") ||
      a.title.localeCompare(b.title) ||
      a.key.localeCompare(b.key),
  );
};
const flattenFields = (value: unknown, prefix = ""): Array<[string, string]> => {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    if (!value.length) return prefix ? [[prefix, "[]"]] : [];
    if (value.every((item) => item === null || typeof item !== "object")) {
      return [[prefix, value.join(", ")]];
    }
    return value.flatMap((item, index) => flattenFields(item, `${prefix}[${index}]`));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      flattenFields(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [[prefix, String(value)]];
};

const statusTone = (value = "") => {
  const status = value.toLowerCase();
  if (
    [
      "ready",
      "api_ready",
      "planning_ready",
      "approved",
      "running",
      "active",
      "enabled",
      "serving",
      "done",
      "synced",
      "covered",
    ].includes(status)
  )
    return "good";
  if (status === "blocked" || status === "needs_config" || status === "missing") return "danger";
  if (
    [
      "draft",
      "needs_review",
      "not_synced",
      "platform_snapshot_required",
      "paused",
      "limited",
      "weak",
      "not_applicable",
    ].includes(status)
  )
    return "warn";
  return "neutral";
};

const campaignStatusGroup = (value = "") => {
  const status = value.toLowerCase();
  if (["running", "active", "enabled", "serving"].includes(status)) return "running";
  if (["draft", "needs_review", "platform_snapshot_required"].includes(status)) return "draft";
  if (["paused", "ended", "limited", "done", "approved", "synced"].includes(status))
    return "paused";
  if (["blocked", "needs_config", "missing", "not_synced"].includes(status)) return "blocked";
  const tone = statusTone(status);
  if (tone === "good") return "running";
  if (tone === "danger") return "blocked";
  if (tone === "warn") return "draft";
  return "paused";
};

const sumMetrics = (rows: CampaignRow[]) =>
  rows.reduce(
    (memo, row) => {
      const metrics = row.metrics ?? {};
      memo.impressions += Number(metrics.impressions || 0);
      memo.clicks += Number(metrics.clicks || 0);
      memo.cost += Number(metrics.cost || 0);
      memo.conversions += Number(metrics.conversions || 0);
      return memo;
    },
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
  );

function useMarketing<T>(view: string, timeRange: TimeRange, extra = "") {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/marketing/${view}?timeRange=${timeRange}${extra}`);
      if (!response.ok) throw new Error(`${view} request failed: ${response.status}`);
      setData(await response.json());
      setError("");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [extra, timeRange, view]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

function useGeo(timeRange: GeoTimeRange, promptSearch: string, promptId: string) {
  const [data, setData] = useState<GeoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ timeRange });
    if (promptSearch.trim()) params.set("promptSearch", promptSearch.trim());
    if (promptId) params.set("promptId", promptId);
    try {
      const response = await fetch(`/api/geo?${params.toString()}`);
      if (!response.ok) throw new Error(`GEO request failed: ${response.status}`);
      setData(await response.json());
      setError("");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [promptId, promptSearch, timeRange]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

function App() {
  const { t } = useI18n();
  const [state, setState] = useState<CmoState | null>(null);
  const [location, navigate] = useLocation();
  const route = routeFromPath(location);
  const routeCampaignId = campaignIdFromPath(location);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("cmo:sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const geoTimeRange: GeoTimeRange = timeRange === "7d" ? "7d" : "30d";
  const [query, setQuery] = useState("");
  const [geoPromptSearch, setGeoPromptSearch] = useState("");
  const [geoSelectedPromptId, setGeoSelectedPromptId] = useState("");
  const [geoDomainSearch, setGeoDomainSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const overview = useMarketing<MarketingOverview>("command-center", timeRange);
  const traffic = useMarketing<MarketingTraffic>("traffic", timeRange);
  const search = useMarketing<MarketingSearch>("search", timeRange);
  const keywords = useMarketing<MarketingKeywords>("keywords", timeRange);
  const pages = useMarketing<MarketingPages>("landing-pages", timeRange);
  const integrations = useMarketing<{ integrations: IntegrationStatus[]; notes: string[] }>(
    "integrations",
    timeRange,
  );
  const geo = useGeo(geoTimeRange, geoPromptSearch, geoSelectedPromptId);

  const loadState = useCallback(async () => {
    try {
      const response = await fetch("/api/state");
      if (!response.ok) throw new Error(`State request failed: ${response.status}`);
      setState(await response.json());
      setError("");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadState();
    const timer = window.setInterval(() => void loadState(), 5000);
    return () => window.clearInterval(timer);
  }, [loadState]);

  useEffect(() => {
    if (routeCampaignId && routeCampaignId !== selectedCampaignId) {
      setSelectedCampaignId(routeCampaignId);
    }
  }, [routeCampaignId, selectedCampaignId]);

  const platforms = state?.config_summary?.platforms ?? [];
  const platformMap = useMemo(
    () => new Map(platforms.map((platform) => [platform.id, platform.name])),
    [platforms],
  );

  const rows = useMemo<CampaignRow[]>(() => {
    const snapshotPlatforms = state?.platform_snapshot?.platforms ?? {};
    const platformRows: CampaignRow[] = Object.entries(snapshotPlatforms).flatMap(
      ([platformId, platform]) => {
        const platformName = platformMap.get(platformId) ?? platformId;
        const accounts = platform.accounts?.length
          ? platform.accounts
          : [
              {
                account_id: platform.account_id,
                account_name: platform.account_name,
                campaigns: platform.campaigns ?? [],
                campaign_count: platform.campaign_count ?? platform.campaigns?.length ?? 0,
                synced_at: platform.synced_at,
              },
            ];
        return accounts.flatMap((account): CampaignRow[] => {
          const campaigns = account.campaigns ?? [];
          if (!campaigns.length && Number(account.campaign_count || 0) > 0) {
            return [
              {
                id: `${platformId}:${account.key ?? account.account_id}:collapsed`,
                source: "platform",
                platform: platformId,
                platformName,
                account: account.account_name ?? account.account_id ?? platformName,
                name: `${platformName} has ${account.campaign_count} existing campaigns`,
                status: "synced",
                channel: "Not expanded",
                risk: "Only count is cached; details are not stored",
                next_step: "Run sync again with campaign samples when details are needed.",
                updated_at: account.synced_at ?? platform.synced_at,
              },
            ];
          }
          return campaigns.map(
            (campaign): CampaignRow => ({
              id: `${platformId}:${account.key ?? account.account_id}:${campaign.id ?? campaign.name}`,
              source: "platform",
              platform: platformId,
              platformName,
              account: account.account_name ?? account.account_id ?? platformName,
              name: campaign.name ?? campaign.id ?? "Untitled campaign",
              status: campaign.status ?? "unknown",
              channel: campaign.channel ?? campaign.objective ?? "",
              metrics: campaign.metrics,
              daily: campaign.daily ?? [],
              videos: campaign.videos ?? [],
              ad_groups: campaign.ad_groups ?? [],
              ads: campaign.ads ?? [],
              serving_status: campaign.serving_status ?? "",
              primary_status: campaign.primary_status ?? "",
              bidding_strategy_type: campaign.bidding_strategy_type ?? "",
              payment_mode: campaign.payment_mode ?? "",
              optimization_score: Number(campaign.optimization_score || 0),
              tracking_url_template: campaign.tracking_url_template ?? "",
              final_url_suffix: campaign.final_url_suffix ?? "",
              resource_name: campaign.resource_name ?? "",
              budget_detail: campaign.budget,
              next_step: "Draft proposed changes before editing platform state.",
              official_url:
                campaign.official_url ?? officialCampaignUrl(platformId, campaign.id ?? ""),
              raw: campaign.raw ?? (campaign as unknown as Record<string, unknown>),
              updated_at: account.synced_at ?? platform.synced_at,
            }),
          );
        });
      },
    );
    const draftRows: CampaignRow[] = (state?.batch?.proposals ?? []).map((proposal) => ({
      id: `draft:${proposal.id}`,
      source: "draft",
      platform: proposal.platform ?? "",
      platformName: platformMap.get(proposal.platform ?? "") ?? proposal.platform ?? "platform",
      account: proposal.account ?? "",
      name: proposal.title ?? proposal.id,
      status: proposal.status ?? "draft",
      channel: proposal.type ?? "",
      budget: proposal.budget ?? "",
      risk: proposal.risk ?? "",
      next_step: proposal.next_step ?? "",
      summary: proposal.summary ?? "",
      proposal,
      raw: proposal as unknown as Record<string, unknown>,
      updated_at: proposal.updated_at,
    }));
    return [...draftRows, ...platformRows];
  }, [platformMap, state]);

  const matchesCampaignQuery = useCallback(
    (row: CampaignRow) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return [
        row.name,
        row.platformName,
        row.account,
        row.status,
        row.channel,
        row.risk,
        row.next_step,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    },
    [query],
  );
  const filteredRows = rows
    .filter((row) => platformFilter === "all" || row.platform === platformFilter)
    .filter((row) => accountFilter === "all" || row.account === accountFilter)
    .filter(
      (row) =>
        statusFilter === "all" ||
        campaignStatusGroup(row.status) === statusFilter ||
        row.status === statusFilter,
    )
    .filter(matchesCampaignQuery);

  const platformIds = Array.from(new Set(rows.map((row) => row.platform).filter(Boolean)));
  const accountOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter((row) => platformFilter === "all" || row.platform === platformFilter)
            .map((row) => row.account)
            .filter(Boolean),
        ),
      ),
    [platformFilter, rows],
  );
  const isCampaignDetailRoute = Boolean(routeCampaignId);

  useEffect(() => {
    if (route === "geo" && timeRange === "90d") {
      setTimeRange("30d");
    }
  }, [route, timeRange]);

  useEffect(() => {
    if (accountFilter !== "all" && !accountOptions.includes(accountFilter)) {
      setAccountFilter("all");
    }
  }, [accountFilter, accountOptions]);

  const reviewProposal = async (
    proposalId: string,
    action: "approve" | "request_changes" | "block",
  ) => {
    const response = await fetch("/api/review-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        review: { id: proposalId, action, comment: reviewNotes[proposalId] ?? "" },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Review failed");
      return;
    }
    await loadState();
  };

  const refreshAll = () => {
    void loadState();
    void overview.reload();
    void traffic.reload();
    void search.reload();
    void keywords.reload();
    void pages.reload();
    void integrations.reload();
    void geo.reload();
  };

  return (
    <div
      className={`shell ${sidebarOpen ? "sidebar-open" : ""} ${
        sidebarCollapsed ? "collapsed" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="brand">
          <div className="mark" title={state?.config_summary?.brand || "CMO Console"}>
            CMO
          </div>
          <div className="brandCopy">
            <h1>{state?.config_summary?.brand || "CMO Console"}</h1>
            <p>
              {t("brand.summary", {
                platforms: platforms.length || 2,
                accounts: state?.config_summary?.accounts?.length || 2,
              })}
            </p>
          </div>
          <button
            className="iconButton sidebarToggle desktopOnly"
            type="button"
            title={t(sidebarCollapsed ? "sidebar.expand" : "sidebar.collapse")}
            aria-label={t(sidebarCollapsed ? "sidebar.expand" : "sidebar.collapse")}
            aria-expanded={!sidebarCollapsed}
            onClick={() =>
              setSidebarCollapsed((value) => {
                const next = !value;
                try {
                  window.localStorage.setItem("cmo:sidebar-collapsed", next ? "1" : "0");
                } catch {
                  // ignore storage failures (private mode, etc.)
                }
                return next;
              })
            }
          >
            <PanelLeft size={17} />
          </button>
        </div>
        <HumanAttention
          counts={state?.counts}
          onGo={() => {
            navigate(routePaths.ads);
            setSidebarOpen(false);
          }}
        />
        <nav className="nav" aria-label="CMO views">
          {navigationSections.map((section, sectionIndex) => (
            <div className="navSection" key={section.label ?? `section-${sectionIndex}`}>
              {section.label ? (
                <span className="navSectionLabel">
                  {t(`navGroup.${section.label.toLowerCase()}`)}
                </span>
              ) : null}
              {section.items.map((item) => {
                const Icon = item.icon;
                const label = t(`nav.${item.id}`);
                return (
                  <button
                    key={item.id}
                    className={route === item.id ? "active" : ""}
                    type="button"
                    title={label}
                    onClick={() => {
                      navigate(routePaths[item.id]);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebarFooter">
          <button
            className="wideButton"
            type="button"
            title={t("footer.help")}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={16} />
            <span>{t("footer.help")}</span>
          </button>
          <button
            className="wideButton"
            type="button"
            title={t("footer.refresh")}
            onClick={refreshAll}
          >
            <RefreshCw size={16} />
            <span>{t("footer.refresh")}</span>
          </button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="iconButton sidebarToggle mobileOnly"
            type="button"
            title={t("sidebar.openNav")}
            aria-label={t("sidebar.openNav")}
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft size={18} />
          </button>
          <div>
            <h2>{t(`nav.${route}`)}</h2>
            <p>
              {state?.lock?.locked
                ? state.lock.message
                : state?.config_summary?.positioning || t("topbar.subtitle")}
            </p>
          </div>
          <div className="topbarActions">
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as TimeRange)}
              title={t("topbar.timeRange")}
            >
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              {route === "geo" ? null : <option value="90d">90d</option>}
            </select>
            <button
              className="iconButton"
              type="button"
              title={t("footer.refresh")}
              onClick={refreshAll}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>
        {error ? <div className="errorBanner">{error}</div> : null}
        <MarketingError views={[overview, traffic, search, keywords, pages, integrations, geo]} />
        <section className="content">
          {route === "overview" ? (
            <Overview
              data={overview.data}
              rows={rows}
              platforms={platforms}
              snapshot={state?.platform_snapshot?.platforms ?? {}}
              loading={overview.loading}
            />
          ) : null}
          {route === "traffic" ? (
            <TrafficView data={traffic.data} loading={traffic.loading} />
          ) : null}
          {route === "search" ? <SearchView data={search.data} loading={search.loading} /> : null}
          {route === "keywords" ? (
            <KeywordsView data={keywords.data} loading={keywords.loading} />
          ) : null}
          {route === "pages" ? <PagesView data={pages.data} loading={pages.loading} /> : null}
          {route === "geo" ? (
            <GeoView
              data={geo.data}
              loading={geo.loading}
              promptSearch={geoPromptSearch}
              selectedPromptId={geoSelectedPromptId}
              onPromptSearchChange={(value) => {
                setGeoPromptSearch(value);
                setGeoSelectedPromptId("");
              }}
              onSelectPrompt={setGeoSelectedPromptId}
              domainSearch={geoDomainSearch}
              onDomainSearchChange={setGeoDomainSearch}
            />
          ) : null}
          {route === "ads" ? (
            <AdsView
              rows={filteredRows}
              allRows={rows}
              platformIds={platformIds}
              query={query}
              platformFilter={platformFilter}
              accountFilter={accountFilter}
              statusFilter={statusFilter}
              reviewNotes={reviewNotes}
              overview={overview.data}
              isDetailRoute={isCampaignDetailRoute}
              accountOptions={accountOptions}
              onQueryChange={setQuery}
              onPlatformFilterChange={(value) => {
                setPlatformFilter(value);
                setAccountFilter("all");
              }}
              onAccountFilterChange={setAccountFilter}
              onStatusFilterChange={setStatusFilter}
              selectedId={selectedCampaignId}
              onSelectCampaign={setSelectedCampaignId}
              onOpenCampaign={(campaignRowId) => {
                setSelectedCampaignId(campaignRowId);
                if (campaignRowId) navigate(campaignDetailPath(campaignRowId));
              }}
              onBackToCampaigns={() => {
                setSelectedCampaignId("");
                navigate(routePaths.ads);
              }}
              onReviewNoteChange={(id, value) =>
                setReviewNotes((current) => ({ ...current, [id]: value }))
              }
              onReview={reviewProposal}
            />
          ) : null}
          {route === "ads-assets" ? (
            <AdsAssetsView
              rows={rows}
              onOpenCampaign={(campaignRowId) => {
                setSelectedCampaignId(campaignRowId);
                navigate(campaignDetailPath(campaignRowId));
              }}
            />
          ) : null}
          {route === "ads-accounts" ? (
            <AdsAccountsView
              accounts={state?.config_summary?.accounts ?? []}
              platforms={platforms}
              snapshot={state?.platform_snapshot?.platforms ?? {}}
            />
          ) : null}
          {route === "ads-runs" ? <AdsRunsView state={state} /> : null}
          {route === "integrations" ? (
            <IntegrationsView
              data={integrations.data}
              accounts={state?.config_summary?.accounts ?? []}
              platforms={platforms}
            />
          ) : null}
          {route === "settings" ? <SettingsView state={state} /> : null}
        </section>
      </main>
      <button
        className="scrim"
        aria-label={t("sidebar.closeNav")}
        type="button"
        onClick={() => setSidebarOpen(false)}
      />
      {showSettings ? (
        <HelpSettingsModal state={state} onClose={() => setShowSettings(false)} />
      ) : null}
    </div>
  );
}

function HumanAttention({ counts, onGo }: { counts?: Record<string, number>; onGo: () => void }) {
  const { t } = useI18n();
  const needsReview = counts?.needs_review ?? 0;
  const approved = counts?.approved ?? 0;
  const blocked = counts?.blocked ?? 0;
  return (
    <section className="humanWork" aria-label={t("attn.aria")}>
      <button
        type="button"
        className={`attnPrimary ${needsReview ? "has" : ""}`}
        title={t("attn.primaryHint")}
        onClick={onGo}
      >
        <span className="attnCount">{needsReview}</span>
        <span className="attnLabel">{t("attn.primary")}</span>
      </button>
      <div className="attnSecondary">
        <span title={t("attn.readyHint")}>
          <b>{approved}</b> {t("attn.readyForAgent")}
        </span>
        <span title={t("attn.blockedHint")}>
          <CircleAlert size={12} />
          <b>{blocked}</b> {t("attn.blocked")}
        </span>
      </div>
    </section>
  );
}

function HelpSettingsModal({ state, onClose }: { state: CmoState | null; onClose: () => void }) {
  const { t, mode, setMode } = useI18n();
  const cs = state?.config_summary;
  const accounts = cs?.accounts ?? [];
  return (
    <div className="modalHost" role="dialog" aria-modal="true" aria-label={t("help.title")}>
      <button
        className="modalBackdrop"
        type="button"
        aria-label={t("help.close")}
        onClick={onClose}
      />
      <div className="modal">
        <header className="modalHead">
          <h2>{t("help.title")}</h2>
          <button
            className="iconButton"
            type="button"
            title={t("help.close")}
            aria-label={t("help.close")}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="modalBody">
          <section className="settingsCard">
            <h3>{t("help.workspace")}</h3>
            <dl className="settingsList">
              <div>
                <dt>{t("help.language")}</dt>
                <dd>
                  <select
                    value={mode}
                    onChange={(event) =>
                      setMode(event.target.value as (typeof SUPPORTED_LANGS)[number]["code"])
                    }
                    title={t("help.language")}
                  >
                    {SUPPORTED_LANGS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt>{t("help.brand")}</dt>
                <dd>{cs?.brand || "CMO Console"}</dd>
              </div>
              <div>
                <dt>{t("help.dataProvider")}</dt>
                <dd>{state?.data_provider || cs?.data_provider || "local"}</dd>
              </div>
              <div>
                <dt>{t("help.configSource")}</dt>
                <dd>
                  <code>{cs?.config_source || "—"}</code>
                  {cs?.using_example ? " (example)" : null}
                </dd>
              </div>
              <div>
                <dt>{t("help.onboarding")}</dt>
                <dd>
                  {state?.onboarding?.completed ? t("help.completed") : t("help.notCompleted")}
                </dd>
              </div>
              <div>
                <dt>{t("help.agentTasks")}</dt>
                <dd>{state?.agent_tasks?.count ?? 0}</dd>
              </div>
              <div>
                <dt>{t("help.defaultLaunch")}</dt>
                <dd>{cs?.default_launch_status || "paused"}</dd>
              </div>
            </dl>
          </section>
          <section className="settingsCard">
            <h3>{t("help.accounts")}</h3>
            {accounts.length ? (
              <ul className="accountList">
                {accounts.map((account) => (
                  <li key={account.key ?? account.account_id} className="accountRow">
                    <span className="acctBadge">{account.platform}</span>
                    <span className="accountName">{account.display_name || account.platform}</span>
                    <code>{account.account_id || "—"}</code>
                    {account.status ? (
                      <span className={`statusPill ${account.status}`}>{account.status}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{t("help.noAccounts")}</p>
            )}
          </section>
          <section className="settingsCard">
            <h3>{t("help.references")}</h3>
            <dl className="settingsList">
              {cs?.api_docs ? (
                <div>
                  <dt>{t("help.redditApi")}</dt>
                  <dd>
                    <a href={cs.api_docs} target="_blank" rel="noreferrer">
                      {cs.api_docs}
                    </a>
                  </dd>
                </div>
              ) : null}
              {cs?.postman_workspace ? (
                <div>
                  <dt>{t("help.postman")}</dt>
                  <dd>
                    <a href={cs.postman_workspace} target="_blank" rel="noreferrer">
                      {cs.postman_workspace}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="muted">{t("help.secretsNote")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function MarketingError({ views }: { views: Array<{ error: string }> }) {
  const error = views.find((view) => view.error)?.error;
  return error ? <div className="errorBanner">{error}</div> : null;
}

function Overview({
  data,
  rows,
  platforms,
  snapshot,
  loading,
}: {
  data: MarketingOverview | null;
  rows: CampaignRow[];
  platforms: PlatformConfig[];
  snapshot: Record<string, PlatformSnapshot>;
  loading: boolean;
}) {
  const paidRows = sumMetrics(rows);
  if (loading || !data) return <LoadingState />;
  return (
    <div className="stack">
      <section className="summaryBand">
        <div>
          <span className="kicker">Marketing command center</span>
          <h3>Next actions across traffic, search, keywords, pages, and ads</h3>
          <p>
            CMO data now lives in this skill. Buda systemadmin should no longer own these screens.
          </p>
        </div>
        <div className="statGrid">
          <Stat label="Sessions" value={number(data.stats.sessions)} />
          <Stat label="Organic clicks" value={number(data.stats.organicClicks)} />
          <Stat
            label="Keyword gaps"
            value={number(data.coverageSummary.missingKeywords + data.coverageSummary.weakKeywords)}
          />
          <Stat
            label="Ad spend"
            value={moneyMicros(data.ads.totalCostMicros, data.ads.currencyCode)}
          />
        </div>
      </section>
      <section className="gridTwo">
        <article className="panel">
          <div className="panelHeader">
            <div>
              <span className="kicker">Priority queue</span>
              <h3>Next Actions</h3>
            </div>
            <Badge status="live" />
          </div>
          <ActionList actions={data.actions} />
        </article>
        <article className="panel">
          <div className="panelHeader">
            <div>
              <span className="kicker">Setup health</span>
              <h3>Integrations</h3>
            </div>
            <Badge
              status={data.integrations.every((item) => item.connected) ? "ready" : "needs_config"}
            />
          </div>
          <div className="integrationList">
            {data.integrations.map((item) => (
              <div key={item.provider}>
                <strong>{item.provider}</strong>
                <Badge status={item.connected ? "connected" : "not_synced"} />
                <span>{item.source}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="platformGrid">
        <ScorePanel
          title="Traffic"
          icon={TrendingUp}
          stats={[
            ["Pageviews", number(data.stats.pageviews)],
            ["Users", number(data.stats.users)],
            ["Bounce", percent(data.stats.bounceRate)],
          ]}
        />
        <ScorePanel
          title="Search"
          icon={Search}
          stats={[
            ["Impressions", number(data.stats.organicImpressions)],
            ["CTR", percent(data.stats.organicCtr)],
            ["Avg pos", String(data.stats.averagePosition || "-")],
          ]}
        />
        <ScorePanel
          title="Keywords"
          icon={Globe2}
          stats={[
            ["Hot", number(data.coverageSummary.hotKeywords)],
            ["Gap score", String(data.coverageSummary.averageGapScore)],
            ["GEO", `${data.coverageSummary.geoReadinessScore}/100`],
          ]}
        />
        <ScorePanel
          title="Paid media"
          icon={MousePointerClick}
          stats={[
            ["Platform rows", number(rows.length)],
            ["Synced spend", money(paidRows.cost)],
            ["Ads API spend", moneyMicros(data.ads.totalCostMicros, data.ads.currencyCode)],
          ]}
        />
      </section>
      <section className="platformGrid">
        {platforms.map((platform) => {
          const platformRows = rows.filter((row) => row.platform === platform.id);
          return (
            <article className="panel platformPanel" key={platform.id}>
              <div className="panelHeader">
                <div>
                  <span className="kicker">{platform.mode}</span>
                  <h3>{platform.name}</h3>
                </div>
                <Badge status={snapshot[platform.id]?.status ?? "not_synced"} />
              </div>
              <div className="miniStats">
                <Stat label="Rows" value={number(platformRows.length)} />
                <Stat label="Clicks" value={number(sumMetrics(platformRows).clicks)} />
                <Stat label="Cost" value={money(sumMetrics(platformRows).cost)} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function TrafficView({ data, loading }: { data: MarketingTraffic | null; loading: boolean }) {
  if (loading || !data) return <LoadingState />;
  return (
    <div className="stack trafficStack">
      <section className="summaryBand compact">
        <div>
          <span className="kicker">Traffic acquisition</span>
          <h3>GA4 Traffic Acquisition</h3>
          <p>
            View user growth trends, traffic sources, and acquisition channels so future marketing
            campaigns and ad spend can be backed by evidence and adjusted with confidence.
          </p>
        </div>
        <div className="statGrid">
          <Stat label="New users" value={number(data.stats.newUsers)} />
          <Stat label="Sessions" value={number(data.stats.sessions)} />
          <Stat label="Users" value={number(data.stats.users)} />
          <Stat label="Pageviews" value={number(data.stats.pageviews)} />
        </div>
      </section>
      <section className="statGrid wideStats trafficHealth">
        <Stat label="Sessions" value={number(data.stats.sessions)} />
        <Stat label="New users" value={number(data.stats.newUsers)} />
        <Stat label="Users" value={number(data.stats.users)} />
        <Stat label="Pageviews" value={number(data.stats.pageviews)} />
        <Stat label="Bounce rate" value={percent(data.stats.bounceRate)} />
        <Stat label="Avg duration" value={`${number(data.stats.avgDuration)}s`} />
      </section>
      <LineChart
        title="New Users Trend"
        description="Daily new users in the selected date range."
        rows={data.trend}
        series={[{ key: "newUsers", label: "New users", color: "var(--accent)" }]}
        showDailyValues
      />
      <SimpleTable
        title="Session manual source"
        rows={data.manualSources.slice(0, 50)}
        columns={["source", "sessions", "newUsers", "users", "engagedSessions", "conversions"]}
      />
      <section className="panel acquisitionPanel">
        <div className="panelHeader">
          <div>
            <span className="kicker">Traffic acquisition</span>
            <h3>Session primary channel group</h3>
          </div>
          <span className="muted">{data.sources.length} groups</span>
        </div>
        <LineChartFrame
          rows={data.trend}
          series={[{ key: "sessions", label: "Sessions", color: "var(--accent)" }]}
        />
        <SimpleTable
          title="Channel group table"
          rows={data.sources}
          columns={[
            "source",
            "sessions",
            "newUsers",
            "users",
            "engagedSessions",
            "engagementRate",
            "conversions",
          ]}
        />
      </section>
      <SimpleTable
        title="Top Pages by GA4"
        rows={data.topPages.slice(0, 12)}
        columns={["path", "views", "sessions", "dataSourceLabel"]}
      />
    </div>
  );
}

function SearchView({ data, loading }: { data: MarketingSearch | null; loading: boolean }) {
  if (loading || !data) return <LoadingState />;
  return (
    <div className="stack">
      <section className="summaryBand compact">
        <div>
          <span className="kicker">Search performance</span>
          <h3>Google Search Performance</h3>
          <p>
            Find high-impression, low-click keywords and use them to improve blog posts and landing
            page titles, content, and search promises so click-through rate can rise.
          </p>
        </div>
        <div className="statGrid">
          <Stat label="Total clicks" value={number(data.stats.organicClicks)} />
          <Stat label="Total impressions" value={number(data.stats.organicImpressions)} />
          <Stat label="CTR" value={percent(data.stats.organicCtr)} />
          <Stat label="Avg position" value={String(data.stats.averagePosition || "-")} />
        </div>
      </section>
      <section className="panel">
        <h3>Query Opportunities</h3>
        <div className="cardList">
          {data.opportunities.map((item) => (
            <article key={`${item.query}-${item.page}`} className="miniCard">
              <div className="panelHeader">
                <strong>{item.query}</strong>
                <Badge status={item.intent} />
              </div>
              <p>{item.reason || item.action}</p>
              <small>
                {item.page || "No mapped page"} · {number(item.impressions)} impressions ·{" "}
                {percent(item.ctr)} CTR · pos {item.position}
              </small>
            </article>
          ))}
        </div>
      </section>
      <SimpleTable
        title="All Queries"
        rows={data.queries.slice(0, 40)}
        columns={["query", "page", "clicks", "impressions", "ctr", "position", "intent", "action"]}
      />
    </div>
  );
}

function KeywordsView({ data, loading }: { data: MarketingKeywords | null; loading: boolean }) {
  if (loading || !data) return <LoadingState />;
  return (
    <div className="stack">
      <section className="summaryBand compact">
        <div>
          <span className="kicker">Active ICP</span>
          <h3>{data.activeIcp?.name || "No ICP"}</h3>
          <p>Coverage combines GSC mappings, Keyword Planner, SEM keywords, and GTM seed data.</p>
        </div>
        <div className="statGrid">
          <Stat label="Total" value={number(data.coverageSummary.totalKeywords)} />
          <Stat label="Weak" value={number(data.coverageSummary.weakKeywords)} />
          <Stat label="Missing" value={number(data.coverageSummary.missingKeywords)} />
          <Stat label="Gap score" value={String(data.coverageSummary.averageGapScore)} />
        </div>
      </section>
      <SimpleTable
        title="Keyword Coverage"
        rows={data.keywordCoverage.slice(0, 60)}
        columns={[
          "keyword",
          "recommendedChannel",
          "seoCoverageStatus",
          "semCoverageStatus",
          "averageMonthlySearches",
          "impressions",
          "clicks",
          "primaryPage",
          "recommendation",
        ]}
      />
    </div>
  );
}

function PagesView({ data, loading }: { data: MarketingPages | null; loading: boolean }) {
  if (loading || !data) return <LoadingState />;
  return (
    <div className="stack">
      <section className="statGrid">
        <Stat label="Pageviews" value={number(data.stats.pageviews)} />
        <Stat label="Sessions" value={number(data.stats.sessions)} />
        <Stat label="Organic clicks" value={number(data.stats.organicClicks)} />
        <Stat label="GEO readiness" value={`${data.stats.geoReadinessScore}/100`} />
      </section>
      <div className="cardList">
        {data.pages.slice(0, 24).map((page) => (
          <article
            className="panel"
            key={page.path}
            id={`page-${page.path.replace(/[^a-z0-9]+/gi, "-")}`}
          >
            <div className="panelHeader">
              <div>
                <span className="kicker">{page.opportunity}</span>
                <h3>{page.path}</h3>
              </div>
              <Badge status={page.opportunity} />
            </div>
            <div className="miniStats">
              <Stat label="Views" value={number(page.views)} />
              <Stat label="Clicks" value={number(page.organicClicks)} />
              <Stat label="Impressions" value={number(page.impressions)} />
            </div>
            <p>{page.recommendation}</p>
            <small>
              Covered:{" "}
              {page.coveredKeywords
                .slice(0, 5)
                .map((item) => item.keyword)
                .join(", ") || "None"}
            </small>
            <small>
              Missing:{" "}
              {page.missingKeywords
                .slice(0, 5)
                .map((item) => item.keyword)
                .join(", ") || "None"}
            </small>
          </article>
        ))}
      </div>
    </div>
  );
}

function GeoView({
  data,
  loading,
  promptSearch,
  selectedPromptId,
  domainSearch,
  onPromptSearchChange,
  onSelectPrompt,
  onDomainSearchChange,
}: {
  data: GeoSnapshot | null;
  loading: boolean;
  promptSearch: string;
  selectedPromptId: string;
  domainSearch: string;
  onPromptSearchChange: (value: string) => void;
  onSelectPrompt: (value: string) => void;
  onDomainSearchChange: (value: string) => void;
}) {
  if (loading || !data) return <LoadingState />;
  const window = data.window;
  const overview = window.overview;
  const prompts = window.prompts ?? [];
  const selectedPrompt =
    prompts.find((prompt) => prompt.id === (selectedPromptId || window.selected_prompt_id)) ??
    prompts[0] ??
    null;
  const sources = window.selected_citation_sources ?? [];
  const blockers = [...(data.blockers ?? []), ...(window.blockers ?? [])].filter(Boolean);
  return (
    <div className="stack">
      <section className="summaryBand">
        <div>
          <span className="kicker">GEO visibility</span>
          <h3>Brand: {data.brand?.name || "AI platform visibility"}</h3>
          <p>
            Use this page to audit how preset user prompts expose Buda across AI answer engines:
            where the brand is mentioned, which sources AI systems cite, and which high-citation
            domains still leave room for Buda content to earn visibility.
          </p>
        </div>
        <div className="statGrid">
          <Stat label="AIGVR" value={score(overview.aigvrScore)} />
          <Stat label="Mention rate" value={percent(overview.mentionRate)} />
          <Stat label="Citation rate" value={percent(overview.citationRate)} />
          <Stat label="Completed records" value={number(overview.completedRecords)} />
        </div>
      </section>
      {blockers.length ? (
        <section className="panel">
          <div className="panelHeader">
            <h3>Sync status</h3>
            <Badge status={data.status} />
          </div>
          {blockers.map((blocker) => (
            <p className="muted" key={blocker}>
              {blocker}
            </p>
          ))}
        </section>
      ) : null}
      <ContentOpportunitiesCard rows={window.content_opportunities ?? []} />
      <TopCitedDomainsCard
        rows={window.top_cited_domains ?? []}
        search={domainSearch}
        onSearchChange={onDomainSearchChange}
      />
      <section className="panel">
        <div className="toolbar">
          <div>
            <span className="kicker">Prompt lookup</span>
            <h3>Mentions, citations, and source visibility</h3>
          </div>
          <div className="filters">
            <input
              value={promptSearch}
              onChange={(event) => onPromptSearchChange(event.target.value)}
              placeholder="Search cached prompts"
            />
          </div>
        </div>
        <div className="geoWorkbench">
          <div className="geoPromptList">
            {prompts.slice(0, 30).map((prompt) => (
              <button
                type="button"
                key={prompt.id}
                className={selectedPrompt?.id === prompt.id ? "active" : ""}
                onClick={() => onSelectPrompt(prompt.id)}
              >
                <strong>{prompt.text || prompt.id}</strong>
                <span>
                  {percent(prompt.mentionRate)} mention · {percent(prompt.citationRate)} citation
                </span>
              </button>
            ))}
            {!prompts.length ? (
              <EmptyDetail message="No cached prompts yet. Run the GEOly sync script." />
            ) : null}
          </div>
          <div className="geoSourcePanel">
            <div className="panelHeader">
              <div>
                <span className="kicker">Citation sources</span>
                <h3>{selectedPrompt?.text || "Select a prompt"}</h3>
              </div>
              {selectedPrompt ? <Badge status={selectedPrompt.topic || "prompt"} /> : null}
            </div>
            {sources.length ? (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Domain</th>
                      <th>Share</th>
                      <th>Count</th>
                      <th>Platforms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.slice(0, 30).map((source) => (
                      <tr key={source.id || source.url}>
                        <td>
                          {source.url ? (
                            <a href={source.url} target="_blank" rel="noreferrer">
                              {source.title || source.url}
                            </a>
                          ) : (
                            source.title || "-"
                          )}
                        </td>
                        <td>{source.domain || "-"}</td>
                        <td>{percent(source.share)}</td>
                        <td>{number(source.count)}</td>
                        <td>{source.platforms?.join(", ") || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDetail message="No cached citation sources for this prompt." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ContentOpportunitiesCard({ rows }: { rows: GeoContentOpportunity[] }) {
  const [expanded, setExpanded] = useState(false);
  const [openDomain, setOpenDomain] = useState("");
  const visibleRows = expanded ? rows : rows.slice(0, 5);
  return (
    <section className="panel contentOpportunities">
      <div className="panelHeader">
        <div>
          <h3>
            <Lightbulb size={18} aria-hidden="true" />
            Content Opportunities
            <Info
              size={15}
              aria-label="Domains frequently cited by AI but with low brand coverage"
            />
          </h3>
          <p>
            Domains frequently cited by AI but with low brand coverage — potential targets for
            content optimization.
          </p>
        </div>
      </div>
      {visibleRows.length ? (
        <div className="opportunityTable">
          <div className="opportunityHeader">
            <b>Domain</b>
            <b>
              Opportunity{" "}
              <Info size={14} aria-label="Higher means more citation demand with room to improve" />
            </b>
            <b>
              Citations <Info size={14} aria-label="AI citation count in this cache window" />
            </b>
            <b>
              Brand Affinity{" "}
              <Info size={14} aria-label="Brand mention or affinity rate for this opportunity" />
            </b>
          </div>
          {visibleRows.map((row) => {
            const rowKey = row.id || row.domain || row.promptId;
            const isOpen = openDomain === rowKey;
            const promptRows = row.prompts ?? [];
            return (
              <div className={`opportunityGroup ${isOpen ? "open" : ""}`} key={rowKey}>
                <button
                  type="button"
                  className="opportunityRow"
                  aria-expanded={isOpen}
                  onClick={() => setOpenDomain(isOpen ? "" : rowKey)}
                >
                  <div className="domainCell">
                    <span className="domainIcon">
                      {domainInitial(row.domain || row.promptText)}
                    </span>
                    <div>
                      <strong>{row.domain || "Prompt opportunity"}</strong>
                      {row.promptText ? <small>{row.promptText}</small> : null}
                    </div>
                    <ChevronDown className="rowChevron" size={15} aria-hidden="true" />
                  </div>
                  <div className="opportunityScore">
                    <span>
                      <i style={{ width: `${Math.max(4, Math.min(100, row.opportunity))}%` }} />
                    </span>
                    <b>{number(row.opportunity)}</b>
                  </div>
                  <b>{number(row.citations)}</b>
                  <b>{percent(row.brandAffinity)}</b>
                </button>
                {isOpen ? (
                  <div className="opportunityPrompts">
                    {promptRows.length ? (
                      <>
                        <div className="promptHeader">
                          <b>Prompt</b>
                          <b>
                            Citations <Info size={13} aria-label="Citations tied to this prompt" />
                          </b>
                          <b>
                            Brand Affinity{" "}
                            <Info size={13} aria-label="Brand affinity inside this prompt set" />
                          </b>
                          <b>
                            Competitors <Info size={13} aria-label="Competitors mentioned by AI" />
                          </b>
                        </div>
                        {promptRows.map((prompt, index) => (
                          <div className="promptRow" key={prompt.id || `${rowKey}-${index}`}>
                            <span>{prompt.text || "Untitled prompt"}</span>
                            <b>{number(prompt.citations)}</b>
                            <span className="affinityPill">{percent(prompt.brandAffinity)}</span>
                            <span>{prompt.competitors?.join(", ") || "-"}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <EmptyDetail message="No prompt breakdown cached for this domain yet." />
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
          {rows.length > visibleRows.length ? (
            <button className="viewAllDomains" type="button" onClick={() => setExpanded(true)}>
              <ChevronDown size={16} />
              View All {rows.length} Domains
            </button>
          ) : expanded && rows.length > 5 ? (
            <button className="viewAllDomains" type="button" onClick={() => setExpanded(false)}>
              <ChevronDown className="chevronUp" size={16} />
              Show Top 5 Domains
            </button>
          ) : null}
        </div>
      ) : (
        <EmptyDetail message="No content opportunities cached yet." />
      )}
    </section>
  );
}

function TopCitedDomainsCard({
  rows,
  search,
  onSearchChange,
}: {
  rows: GeoTopCitedDomain[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const needle = search.trim().toLowerCase();
  const filteredRows = needle
    ? rows.filter((row) => row.domain.toLowerCase().includes(needle))
    : rows;
  return (
    <section className="panel topDomainsCard">
      <div className="topDomainsHead">
        <div>
          <h3>
            Top Cited Domains <span>({rows.length})</span>
          </h3>
          <p>See which websites are cited most frequently in AI responses</p>
        </div>
        <label className="domainSearch">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search domains"
          />
        </label>
      </div>
      <div className="topDomainsTable">
        <div className="topDomainsHeader">
          <b>Rank</b>
          <b>Domain</b>
          <b>Unique URLs</b>
          <b>Brand Affinity</b>
          <b>Citations</b>
        </div>
        {filteredRows.slice(0, 30).map((row, index) => (
          <div className="topDomainRow" key={row.id || row.domain}>
            <span>{row.rank || index + 1}.</span>
            <div className="domainCell">
              <span className={`domainIcon ${row.isBrandDomain ? "brandDomain" : ""}`}>
                {domainInitial(row.domain)}
              </span>
              <div>
                <strong>{row.domain}</strong>
                {row.subdomains ? <small>{row.subdomains} subdomains</small> : null}
              </div>
            </div>
            <b>{number(row.uniqueUrls)}</b>
            <span className={`affinityPill ${row.brandAffinity >= 100 ? "full" : ""}`}>
              {percent(row.brandAffinity)}
            </span>
            <b>{number(row.citations)}</b>
          </div>
        ))}
        {!filteredRows.length ? <EmptyDetail message="No domains match this search." /> : null}
      </div>
    </section>
  );
}

function domainInitial(value = "") {
  return (
    String(value || "?")
      .trim()
      .slice(0, 1)
      .toUpperCase() || "?"
  );
}

function AdsView(props: {
  rows: CampaignRow[];
  allRows: CampaignRow[];
  platformIds: string[];
  accountOptions: string[];
  query: string;
  platformFilter: string;
  accountFilter: string;
  statusFilter: string;
  reviewNotes: Record<string, string>;
  overview: MarketingOverview | null;
  isDetailRoute: boolean;
  onQueryChange: (value: string) => void;
  onPlatformFilterChange: (value: string) => void;
  onAccountFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  selectedId: string;
  onSelectCampaign: (id: string) => void;
  onOpenCampaign: (id: string) => void;
  onBackToCampaigns: () => void;
  onReviewNoteChange: (id: string, value: string) => void;
  onReview: (id: string, action: "approve" | "request_changes" | "block") => void;
}) {
  const apiAds = props.overview?.ads;
  const { onSelectCampaign, selectedId } = props;
  const selectedRow = props.isDetailRoute
    ? (props.allRows.find((row) => row.id === selectedId) ?? null)
    : (props.rows.find((row) => row.id === selectedId) ??
      props.allRows.find((row) => row.id === selectedId) ??
      props.rows.find((row) => row.source === "platform") ??
      props.rows[0] ??
      null);

  useEffect(() => {
    if (!selectedRow) {
      if (selectedId) onSelectCampaign("");
      return;
    }
    if (selectedId !== selectedRow.id) onSelectCampaign(selectedRow.id);
  }, [onSelectCampaign, selectedId, selectedRow]);

  return (
    <div className="stack">
      {!props.isDetailRoute && apiAds ? (
        <section className="statGrid">
          <Stat
            label="Ads API spend"
            value={moneyMicros(apiAds.totalCostMicros, apiAds.currencyCode)}
          />
          <Stat
            label="Campaigns"
            value={`${number(apiAds.activeCampaigns)}/${number(apiAds.totalCampaigns)}`}
          />
          <Stat label="Clicks" value={number(apiAds.totalClicks)} />
          <Stat label="Conversions" value={number(apiAds.totalConversions)} />
        </section>
      ) : null}
      {props.isDetailRoute ? (
        <CampaignDetail
          reviewNotes={props.reviewNotes}
          row={selectedRow}
          onBack={props.onBackToCampaigns}
          onReview={props.onReview}
          onReviewNoteChange={props.onReviewNoteChange}
        />
      ) : (
        <Campaigns {...props} selectedId={selectedRow?.id ?? ""} onSelect={props.onOpenCampaign} />
      )}
      {!props.isDetailRoute && apiAds?.campaigns?.length ? (
        <SimpleTable
          title="Google Ads API Campaigns"
          rows={apiAds.campaigns.slice(0, 20)}
          columns={["name", "status", "clicks", "costMicros", "conversions", "recommendation"]}
        />
      ) : null}
    </div>
  );
}

function AdsAssetsView({
  rows,
  onOpenCampaign,
}: {
  rows: CampaignRow[];
  onOpenCampaign: (campaignRowId: string) => void;
}) {
  const [assetQuery, setAssetQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedAssetKey, setSelectedAssetKey] = useState("");
  const assets = useMemo(() => collectAdsAssets(rows), [rows]);
  const sourceOptions = useMemo(
    () =>
      Array.from(
        new Set(assets.flatMap((asset) => asset.source.split(", ").map((source) => source.trim()))),
      ).filter(Boolean),
    [assets],
  );
  const filteredAssets = assets
    .filter((asset) => sourceFilter === "all" || asset.source.includes(sourceFilter))
    .filter((asset) => {
      const needle = assetQuery.trim().toLowerCase();
      if (!needle) return true;
      return [
        asset.videoId,
        asset.title,
        asset.language,
        asset.format,
        asset.source,
        asset.assetResourceName,
        asset.assetId,
        asset.proposalIds.join(" "),
        asset.campaignNames.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  const syncedAssets = assets.filter((asset) => asset.assetResourceName);
  const draftAssets = assets.filter((asset) => asset.proposalIds.length);
  const campaignLinkedAssets = assets.filter((asset) => asset.campaignIds.length);
  const selectedAsset =
    filteredAssets.find((asset) => asset.key === selectedAssetKey) ?? filteredAssets[0] ?? null;

  useEffect(() => {
    if (!selectedAsset) {
      if (selectedAssetKey) setSelectedAssetKey("");
      return;
    }
    if (selectedAsset.key !== selectedAssetKey) setSelectedAssetKey(selectedAsset.key);
  }, [selectedAsset, selectedAssetKey]);

  return (
    <div className="stack">
      <section className="statGrid">
        <Stat label="Ads assets" value={number(assets.length)} />
        <Stat label="Google synced" value={number(syncedAssets.length)} />
        <Stat label="Draft-linked" value={number(draftAssets.length)} />
        <Stat label="Campaign-linked" value={number(campaignLinkedAssets.length)} />
      </section>
      <section className="panel">
        <div className="toolbar">
          <div>
            <h3>Ads Assets</h3>
            <p className="muted">
              {filteredAssets.length}/{assets.length} video assets shown
            </p>
          </div>
          <div className="filters">
            <input
              value={assetQuery}
              placeholder="Search video, asset id, proposal..."
              onChange={(event) => setAssetQuery(event.target.value)}
            />
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="all">All sources</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="assetGrid">
          {filteredAssets.map((asset) => (
            <article
              className={asset.key === selectedAsset?.key ? "assetCard selected" : "assetCard"}
              key={asset.key}
              onClick={() => setSelectedAssetKey(asset.key)}
            >
              {asset.videoId ? (
                <a
                  href={asset.url || youtubeUrl(asset.videoId)}
                  rel="noreferrer"
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                >
                  <img
                    alt={asset.title || asset.videoId}
                    src={youtubeThumbnailUrl(asset.videoId)}
                  />
                </a>
              ) : (
                <div className="assetThumbFallback">Asset</div>
              )}
              <div className="assetBody">
                <div className="panelHeader">
                  <div>
                    <span className="kicker">
                      {[asset.source, asset.format, asset.language].filter(Boolean).join(" · ")}
                    </span>
                    <h3>{asset.title || asset.videoId || asset.assetId}</h3>
                  </div>
                  <Badge status={asset.status || (asset.assetResourceName ? "synced" : "draft")} />
                </div>
                <dl className="assetMeta">
                  <div>
                    <dt>Video ID</dt>
                    <dd>{asset.videoId || "-"}</dd>
                  </div>
                  <div>
                    <dt>Asset ID</dt>
                    <dd>{asset.assetId || "-"}</dd>
                  </div>
                  <div>
                    <dt>Synced</dt>
                    <dd>{formatSyncTime(asset.lastSynced)}</dd>
                  </div>
                  <div>
                    <dt>Proposals</dt>
                    <dd>{asset.proposalIds.join(", ") || "-"}</dd>
                  </div>
                  <div>
                    <dt>Campaigns</dt>
                    <dd>{asset.campaignRefs.length || "-"}</dd>
                  </div>
                  <div>
                    <dt>Ads</dt>
                    <dd>{asset.adIds.join(", ") || "-"}</dd>
                  </div>
                </dl>
                {asset.campaignRefs.length ? (
                  <div className="assetRefs">
                    {asset.campaignRefs.map((ref) => (
                      <button
                        className="assetRef"
                        key={ref.rowId || ref.id || ref.name}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenCampaign(ref.rowId);
                        }}
                      >
                        <b>{ref.name || ref.id}</b>
                        <small>
                          {[ref.platform, ref.account, ref.status, ...ref.sources]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                        {ref.adIds.length ? <small>Ads: {ref.adIds.join(", ")}</small> : null}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No campaign references are synced for this asset yet.</p>
                )}
                {asset.assetResourceName ? (
                  <code className="assetResource">{asset.assetResourceName}</code>
                ) : (
                  <p className="muted">No Google Ads asset resource name synced yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
        {!filteredAssets.length ? (
          <EmptyDetail message="No ads assets match the current filters." />
        ) : null}
      </section>
      <AdsAssetDetail asset={selectedAsset} onOpenCampaign={onOpenCampaign} />
    </div>
  );
}

function AdsAssetDetail({
  asset,
  onOpenCampaign,
}: {
  asset: AdsAssetRow | null;
  onOpenCampaign: (campaignRowId: string) => void;
}) {
  if (!asset) return <EmptyDetail message="Select an ads asset to inspect details." />;

  return (
    <section className="panel assetDetail">
      <div className="panelHeader detailHeader">
        <div>
          <span className="kicker">
            {[asset.source, asset.format, asset.language].filter(Boolean).join(" · ")}
          </span>
          <h3>{asset.title || asset.videoId || asset.assetId}</h3>
        </div>
        <Badge status={asset.status || (asset.assetResourceName ? "synced" : "draft")} />
      </div>
      <div className="assetDetailLayout">
        <div className="assetPreview">
          {asset.videoId ? (
            <VideoPreview title={asset.title} videoId={asset.videoId} />
          ) : (
            <div className="assetThumbFallback">Asset</div>
          )}
        </div>
        <div className="detailPanel">
          <div className="detailGrid">
            <DetailItem label="Video ID" value={asset.videoId || "-"} />
            <DetailItem label="Asset ID" value={asset.assetId || "-"} />
            <DetailItem label="Synced" value={formatSyncTime(asset.lastSynced)} />
            <DetailItem label="Campaign refs" value={asset.campaignRefs.length} />
            <DetailItem label="Proposal refs" value={asset.proposalIds.length} />
            <DetailItem label="Ad refs" value={asset.adIds.length} />
            <DetailItem label="Language" value={asset.language || "-"} />
            <DetailItem label="Format" value={asset.format || "-"} />
          </div>
          {asset.assetResourceName ? (
            <code className="assetResource">{asset.assetResourceName}</code>
          ) : null}
        </div>
      </div>
      <div className="fieldSection">
        <strong>Campaign References</strong>
        {asset.campaignRefs.length ? (
          <div className="assetRefs">
            {asset.campaignRefs.map((ref) => (
              <button
                className="assetRef"
                key={ref.rowId || ref.id || ref.name}
                type="button"
                onClick={() => onOpenCampaign(ref.rowId)}
              >
                <b>{ref.name || ref.id}</b>
                <small>
                  {[ref.platform, ref.account, ref.status, ...ref.sources]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {ref.adIds.length ? <small>Ads: {ref.adIds.join(", ")}</small> : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">No campaign references are synced for this asset yet.</p>
        )}
      </div>
      <div className="detailGrid">
        <DetailItem label="Proposals" value={asset.proposalIds.join(", ") || "-"} />
        <DetailItem label="Campaign IDs" value={asset.campaignIds.join(", ") || "-"} />
        <DetailItem label="Ad IDs" value={asset.adIds.join(", ") || "-"} />
        <DetailItem label="Source" value={asset.source || "-"} />
      </div>
    </section>
  );
}

function IntegrationsView({
  data,
  accounts,
  platforms,
}: {
  data: { integrations: IntegrationStatus[]; notes: string[] } | null;
  accounts: AccountConfig[];
  platforms: PlatformConfig[];
}) {
  return (
    <div className="stack">
      <section className="accountGrid">
        {(data?.integrations ?? []).map((integration) => (
          <article className="panel" key={integration.provider}>
            <div className="panelHeader">
              <div>
                <span className="kicker">{integration.source}</span>
                <h3>{integration.provider}</h3>
              </div>
              <Badge
                status={
                  integration.connected
                    ? "connected"
                    : integration.configured
                      ? "configured"
                      : "needs_config"
                }
              />
            </div>
            <p>{integration.setupHint}</p>
            {integration.missingEnv?.length ? (
              <small>Missing env: {integration.missingEnv.join(", ")}</small>
            ) : (
              <small>Required env present or not needed.</small>
            )}
          </article>
        ))}
      </section>
      <Accounts accounts={accounts} platforms={platforms} />
    </div>
  );
}

function AdsAccountsView({
  accounts,
  platforms,
  snapshot,
}: {
  accounts: AccountConfig[];
  platforms: PlatformConfig[];
  snapshot: Record<string, PlatformSnapshot>;
}) {
  return (
    <div className="stack">
      <section className="accountGrid">
        {platforms.map((platform) => {
          const platformAccounts = accounts.filter((account) => account.platform === platform.id);
          const platformSnapshot = snapshot[platform.id];
          const readyAccounts = platformAccounts.filter(
            (account) => account.status !== "needs_config",
          ).length;
          return (
            <article className="panel platformPanel" key={platform.id}>
              <div className="panelHeader">
                <div>
                  <span className="kicker">{platform.mode || "platform"}</span>
                  <h3>{platform.name}</h3>
                </div>
                <Badge status={platformSnapshot?.status || "not_synced"} />
              </div>
              <div className="miniStats">
                <Stat
                  label="Ready accounts"
                  value={`${readyAccounts}/${platformAccounts.length}`}
                />
                <Stat label="Campaigns" value={number(platformSnapshot?.campaign_count)} />
                <Stat label="Synced" value={formatSyncTime(platformSnapshot?.synced_at)} />
              </div>
              {platformSnapshot?.blockers?.length ? (
                <div className="chips">
                  {platformSnapshot.blockers.map((blocker) => (
                    <span key={blocker}>{blocker}</span>
                  ))}
                </div>
              ) : null}
              <ul>
                {(platform.capabilities ?? []).map((capability) => (
                  <li key={capability}>{capability}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
      <Accounts accounts={accounts} platforms={[]} />
    </div>
  );
}

function AdsRunsView({ state }: { state: CmoState | null }) {
  const report = state?.execution_report ?? null;
  const manifest = (report?.manifest as Record<string, unknown> | undefined) ?? {};
  const operations =
    (manifest.planned_operations as Record<string, number | undefined> | undefined) ?? {};
  const blockers = Array.isArray(manifest.blockers_before_write)
    ? manifest.blockers_before_write.map(String)
    : [];
  const reviews = (state?.decisions?.reviews as Record<string, unknown> | undefined) ?? {};
  const decision = (state?.decisions?.decision as Record<string, unknown> | undefined) ?? {};
  const decisionText = decision.action
    ? String(decision.action)
    : Object.keys(reviews).length
      ? `${Object.keys(reviews).length} reviews`
      : "none";

  return (
    <div className="gridTwo">
      <section className="panel">
        <h3>Runs</h3>
        <p className="muted">
          Agent writes read-only sync summaries, platform write reports, and verification results
          here. Platform APIs remain the source of truth.
        </p>
        <dl className="settingsList">
          <div>
            <dt>Latest report</dt>
            <dd>{String(report?.updated_at ?? report?.generated_at ?? "none yet")}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{String(report?.status ?? "none")}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{String(report?.type ?? "none")}</dd>
          </div>
          <div>
            <dt>Decision</dt>
            <dd>{decisionText}</dd>
          </div>
          <div>
            <dt>Batch</dt>
            <dd>{state?.batch?.batch_id || "-"}</dd>
          </div>
          {report?.output_dir ? (
            <div>
              <dt>Output</dt>
              <dd>{String(report.output_dir)}</dd>
            </div>
          ) : null}
        </dl>
        {report?.summary ? (
          <div className="nextStepBox">
            <strong>Summary</strong>
            <span>{String(report.summary)}</span>
          </div>
        ) : null}
      </section>
      <section className="panel">
        <h3>
          {report?.type === "reddit_campaign_dry_run"
            ? "Reddit dry-run config"
            : "Expected Agent Outputs"}
        </h3>
        {report?.type === "reddit_campaign_dry_run" ? (
          <>
            <div className="metricGrid">
              <Stat label="Campaigns" value={number(operations.campaigns)} />
              <Stat label="Ad groups" value={number(operations.ad_groups)} />
              <Stat label="Posts" value={number(operations.posts)} />
              <Stat label="Ads" value={number(operations.ads)} />
            </div>
            {blockers.length ? (
              <div className="chips">
                {blockers.map((blocker) => (
                  <span key={blocker}>{blocker}</span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="chips">
            <span>Google platform snapshot</span>
            <span>Reddit platform snapshot</span>
            <span>Proposal diffs</span>
            <span>Preflight evidence</span>
            <span>Write verification report</span>
          </div>
        )}
        {report ? <FieldSection title="Raw report" value={report} /> : null}
      </section>
    </div>
  );
}

function Campaigns({
  rows,
  allRows,
  platformIds,
  accountOptions,
  query,
  platformFilter,
  accountFilter,
  statusFilter,
  reviewNotes,
  onQueryChange,
  onPlatformFilterChange,
  onAccountFilterChange,
  onStatusFilterChange,
  onReviewNoteChange,
  onReview,
  selectedId,
  onSelect,
}: {
  rows: CampaignRow[];
  allRows: CampaignRow[];
  platformIds: string[];
  accountOptions: string[];
  query: string;
  platformFilter: string;
  accountFilter: string;
  statusFilter: string;
  reviewNotes: Record<string, string>;
  onQueryChange: (value: string) => void;
  onPlatformFilterChange: (value: string) => void;
  onAccountFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onReviewNoteChange: (id: string, value: string) => void;
  onReview: (id: string, action: "approve" | "request_changes" | "block") => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const scopedMetrics = sumMetrics(rows);
  const groups = rows.reduce<Record<string, number>>((memo, row) => {
    const group = campaignStatusGroup(row.status);
    memo[group] = (memo[group] ?? 0) + 1;
    return memo;
  }, {});

  return (
    <div className="stack">
      <section className="panel">
        <div className="toolbar">
          <div>
            <h3>Platform campaigns and proposals</h3>
            <p className="muted">
              {rows.length}/{allRows.length} rows shown
            </p>
          </div>
          <div className="filters">
            <input
              value={query}
              placeholder="Search campaigns, accounts, risks..."
              onChange={(event) => onQueryChange(event.target.value)}
            />
            <select
              value={platformFilter}
              onChange={(event) => onPlatformFilterChange(event.target.value)}
            >
              <option value="all">All platforms</option>
              {platformIds.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <select
              value={accountFilter}
              onChange={(event) => onAccountFilterChange(event.target.value)}
            >
              <option value="all">All accounts</option>
              {accountOptions.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="running">Running</option>
              <option value="draft">Drafts</option>
              <option value="paused">Paused</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
        <div className="campaignKpis">
          <Stat label="Spend" value={money(scopedMetrics.cost)} />
          <Stat label="Clicks" value={number(scopedMetrics.clicks)} />
          <Stat label="Conversions" value={number(scopedMetrics.conversions)} />
          <Stat label="Running" value={number(groups.running)} />
          <Stat label="Drafts" value={number(groups.draft)} />
          <Stat label="Paused" value={number(groups.paused)} />
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Platform</th>
                <th>Account</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Clicks</th>
                <th>Next</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className={row.id === selectedId ? "clickableRow selected" : "clickableRow"}
                  key={row.id}
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row.id);
                    }
                  }}
                >
                  <td>
                    <strong>{row.name}</strong>
                    <span>
                      {row.channel || row.source} · {formatSyncTime(row.updated_at)}
                    </span>
                  </td>
                  <td>{row.platformName}</td>
                  <td>{row.account || "-"}</td>
                  <td>
                    <Badge status={row.status} />
                  </td>
                  <td>{money(row.metrics?.cost)}</td>
                  <td>{number(row.metrics?.clicks)}</td>
                  <td>
                    <span>{row.next_step || row.risk || "Click to inspect"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="proposalGrid">
        {rows
          .filter((row) => row.proposal)
          .map((row) => {
            const proposal = row.proposal;
            return proposal ? (
              <article className="panel proposal" key={row.id}>
                <div className="panelHeader">
                  <div>
                    <span className="kicker">{row.platformName}</span>
                    <h3>{row.name}</h3>
                  </div>
                  <Badge status={row.status} />
                </div>
                <p>
                  {proposal.summary ||
                    row.next_step ||
                    "Review this draft before any platform write."}
                </p>
                <textarea
                  value={reviewNotes[proposal.id] ?? ""}
                  placeholder="Decision note"
                  onChange={(event) => onReviewNoteChange(proposal.id, event.target.value)}
                />
                <div className="buttonRow">
                  <button type="button" onClick={() => onReview(proposal.id, "approve")}>
                    Approve draft
                  </button>
                  <button type="button" onClick={() => onReview(proposal.id, "request_changes")}>
                    Request changes
                  </button>
                  <button
                    className="dangerButton"
                    type="button"
                    onClick={() => onReview(proposal.id, "block")}
                  >
                    Block
                  </button>
                </div>
              </article>
            ) : null;
          })}
      </section>
    </div>
  );
}

function Accounts({
  accounts,
  platforms,
}: {
  accounts: AccountConfig[];
  platforms: PlatformConfig[];
}) {
  return (
    <div className="accountGrid">
      {accounts.map((account) => (
        <article className="panel" key={account.key ?? account.display_name}>
          <div className="panelHeader">
            <div>
              <span className="kicker">{account.platform}</span>
              <h3>{account.display_name ?? account.key}</h3>
            </div>
            <Badge status={account.status ?? "needs_config"} />
          </div>
          <p className="muted">{account.account_id || "No account id configured"}</p>
          <div className="checkGrid">
            {Object.entries(account.checks ?? {}).map(([key, value]) => (
              <span key={key} className={value ? "check ok" : "check missing"}>
                {key.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        </article>
      ))}
      {platforms.map((platform) => (
        <article className="panel" key={`platform-${platform.id}`}>
          <span className="kicker">{platform.mode}</span>
          <h3>{platform.name}</h3>
          <ul>
            {(platform.capabilities ?? []).map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function CampaignDetail({
  row,
  reviewNotes,
  onBack,
  onReview,
  onReviewNoteChange,
}: {
  row: CampaignRow | null;
  reviewNotes: Record<string, string>;
  onBack: () => void;
  onReview: (id: string, action: "approve" | "request_changes" | "block") => void;
  onReviewNoteChange: (id: string, value: string) => void;
}) {
  const [tab, setTab] = useState<CampaignDetailTab>("overview");
  const [adGroupFilter, setAdGroupFilter] = useState("all");

  if (!row) {
    return (
      <section className="panel emptyDetail">
        <h3>Campaign detail</h3>
        <p className="muted">Select a campaign row to inspect Ads data.</p>
      </section>
    );
  }

  const ads = adsWithVideoFallback(row);
  const videos = row.videos ?? [];
  const adGroups = row.ad_groups ?? [];
  const proposal = row.proposal;
  const canReviewProposal = proposal && !["blocked", "done"].includes(proposal.status ?? "");
  const tabs: Array<[CampaignDetailTab, string, string]> = [
    ["overview", "Overview", row.channel || row.source],
    ["structure", "Structure", `${adGroups.length}/${ads.length}`],
    ["creatives", "Creatives", String(videos.length + ads.length || "")],
    ["performance", "Performance", row.metrics ? money(row.metrics.cost) : ""],
    ["raw", "Raw", ""],
  ];

  return (
    <section className="panel campaignDetail">
      <div className="panelHeader detailHeader">
        <div>
          <span className="kicker">
            {row.platformName} · {row.account}
          </span>
          <h3>{row.name}</h3>
        </div>
        <div className="detailActions">
          <button className="buttonLink" type="button" onClick={onBack}>
            Back to campaigns
          </button>
          {row.official_url ? (
            <a className="buttonLink" href={row.official_url} rel="noreferrer" target="_blank">
              Open in platform
            </a>
          ) : null}
          <Badge status={row.status} />
        </div>
      </div>

      <div className="detailSummary">
        <Stat label="Channel" value={row.channel || row.proposal?.type || "-"} />
        <Stat label="Budget" value={budgetText(row)} />
        <Stat label="Spend" value={row.metrics ? money(row.metrics.cost) : "-"} />
        <Stat label="Clicks" value={row.metrics ? number(row.metrics.clicks) : "-"} />
        <Stat
          label="Groups / Ads / Videos"
          value={`${adGroups.length}/${ads.length}/${videos.length}`}
        />
      </div>

      <div className="detailTabs" role="tablist">
        {tabs.map(([id, label, meta]) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            type="button"
            onClick={() => setTab(id)}
          >
            <span>{label}</span>
            {meta ? <small>{meta}</small> : null}
          </button>
        ))}
      </div>

      {tab === "overview" ? <CampaignOverview row={row} /> : null}
      {tab === "structure" ? (
        <CampaignStructure
          adGroupFilter={adGroupFilter}
          ads={ads}
          row={row}
          onAdGroupFilterChange={setAdGroupFilter}
        />
      ) : null}
      {tab === "creatives" ? <CampaignCreatives ads={ads} videos={videos} /> : null}
      {tab === "performance" ? <CampaignPerformance row={row} /> : null}
      {tab === "raw" ? <CampaignRaw row={row} /> : null}
      {canReviewProposal ? (
        <section className="reviewBox">
          <div>
            <strong>Review draft</strong>
            <span>
              Confirm only after platform, account, budget, destination, and launch status are
              understood.
            </span>
          </div>
          <textarea
            value={reviewNotes[proposal.id] ?? ""}
            placeholder="Decision note"
            onChange={(event) => onReviewNoteChange(proposal.id, event.target.value)}
          />
          <div className="buttonRow">
            <button type="button" onClick={() => onReview(proposal.id, "approve")}>
              Approve draft
            </button>
            <button type="button" onClick={() => onReview(proposal.id, "request_changes")}>
              Request changes
            </button>
            <button
              className="dangerButton"
              type="button"
              onClick={() => onReview(proposal.id, "block")}
            >
              Block
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function CampaignOverview({ row }: { row: CampaignRow }) {
  const campaignId = row.raw?.id ?? row.id.split(":").at(-1);
  return (
    <div className="detailPanel">
      <p className="detailLead">{row.summary || row.next_step || "Platform campaign snapshot."}</p>
      <div className="detailGrid">
        <DetailItem label="Campaign ID" value={String(campaignId ?? "-")} />
        <DetailItem label="Platform" value={row.platformName} />
        <DetailItem label="Account" value={row.account} />
        <DetailItem label="Status" value={row.status} />
        <DetailItem label="Serving" value={row.serving_status || row.primary_status || "-"} />
        <DetailItem label="Bidding" value={row.bidding_strategy_type || row.payment_mode || "-"} />
        <DetailItem label="Resource" value={row.resource_name || "-"} />
        <DetailItem
          label="Tracking suffix"
          value={row.final_url_suffix || row.tracking_url_template || "-"}
        />
      </div>
    </div>
  );
}

function CampaignStructure({
  row,
  ads,
  adGroupFilter,
  onAdGroupFilterChange,
}: {
  row: CampaignRow;
  ads: CampaignAd[];
  adGroupFilter: string;
  onAdGroupFilterChange: (value: string) => void;
}) {
  const adGroups = row.ad_groups ?? [];
  const terms = platformTerms(row.platform);
  const selectedGroup = adGroups.find((group) => String(group.id) === adGroupFilter);
  const visibleAds =
    adGroupFilter === "all" ? ads : ads.filter((ad) => String(ad.ad_group_id) === adGroupFilter);

  if (!adGroups.length && !ads.length) {
    return (
      <EmptyDetail
        message={`No ${terms.group.toLowerCase()} or ${terms.ad.toLowerCase()} detail is synced for this campaign.`}
      />
    );
  }

  return (
    <div className="structureWorkbench">
      <aside className="structureSidebar">
        <button
          className={adGroupFilter === "all" ? "active" : ""}
          type="button"
          onClick={() => onAdGroupFilterChange("all")}
        >
          <b>All {terms.groupPlural.toLowerCase()}</b>
          <small>
            {adGroups.length} groups · {ads.length} ads
          </small>
        </button>
        {adGroups.map((group) => {
          const count = ads.filter((ad) => String(ad.ad_group_id) === String(group.id)).length;
          return (
            <button
              className={adGroupFilter === String(group.id) ? "active" : ""}
              key={String(group.id ?? group.name)}
              type="button"
              onClick={() => onAdGroupFilterChange(String(group.id))}
            >
              <b>{group.name || group.id}</b>
              <small>
                {[group.status, group.type, `${count} ads`].filter(Boolean).join(" · ")}
              </small>
            </button>
          );
        })}
      </aside>
      <div className="structureMain">
        {selectedGroup ? (
          <div className="detailGrid">
            <DetailItem label={`${terms.group} ID`} value={selectedGroup.id || "-"} />
            <DetailItem label="Name" value={selectedGroup.name || "-"} />
            <DetailItem label="Status" value={selectedGroup.status || "-"} />
            <DetailItem label="Type" value={selectedGroup.type || "-"} />
            <DetailItem
              label="CPC"
              value={selectedGroup.cpc_bid ? money(selectedGroup.cpc_bid) : "-"}
            />
            <DetailItem label="Resource" value={selectedGroup.resource_name || "-"} />
          </div>
        ) : (
          <div className="structureMap">
            <span>
              <b>Campaign</b>
              <small>{row.name}</small>
            </span>
            <span>
              <b>{adGroups.length}</b>
              <small>{terms.groupPlural}</small>
            </span>
            <span>
              <b>{ads.length}</b>
              <small>{terms.adPlural}</small>
            </span>
          </div>
        )}
        <AdList ads={visibleAds} />
      </div>
    </div>
  );
}

function AdList({ ads }: { ads: CampaignAd[] }) {
  if (!ads.length) return <EmptyDetail message="No ads for this selection." />;
  return (
    <div className="adList">
      {ads.map((ad) => (
        <article className="miniCard" key={String(ad.id ?? ad.name)}>
          <div className="panelHeader">
            <strong>{ad.name || ad.id}</strong>
            <Badge status={ad.status} />
          </div>
          <dl className="miniMeta">
            <div>
              <dt>Ad ID</dt>
              <dd>{ad.id || "-"}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{ad.type || "-"}</dd>
            </div>
            <div>
              <dt>Ad group</dt>
              <dd>{ad.ad_group_id || "-"}</dd>
            </div>
          </dl>
          {ad.final_urls?.length ? (
            <div className="chips">
              {ad.final_urls.map((url) => (
                <a href={url} key={url} rel="noreferrer" target="_blank">
                  {url}
                </a>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function CampaignCreatives({ ads, videos }: { ads: CampaignAd[]; videos: CampaignVideo[] }) {
  if (!videos.length && !ads.length)
    return <EmptyDetail message="No creative or ad detail is synced for this campaign." />;
  return (
    <div className="detailPanel">
      {videos.length ? (
        <div className="videoList">
          {videos.map((video) => (
            <article className="videoCard" key={String(video.id ?? video.title)}>
              <VideoPreview title={video.title} videoId={video.id} />
              <div>
                <b>{video.title || video.id}</b>
                <span>
                  {[video.id, formatDuration(video.duration_millis)].filter(Boolean).join(" · ")}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <AdList ads={ads} />
    </div>
  );
}

function VideoPreview({ title, videoId }: { title?: string; videoId?: string }) {
  const [playing, setPlaying] = useState(false);
  if (!videoId) return null;
  if (playing) {
    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        src={youtubeEmbedUrl(videoId)}
        title={title || videoId}
      />
    );
  }
  return (
    <button
      className="videoPreview"
      type="button"
      title="Play video"
      onClick={() => setPlaying(true)}
    >
      <img alt={title || videoId} src={youtubeThumbnailUrl(videoId)} />
      <span>Play</span>
    </button>
  );
}

function CampaignPerformance({ row }: { row: CampaignRow }) {
  const metrics = row.metrics;
  const daily = row.daily ?? [];
  if (!metrics && !daily.length)
    return <EmptyDetail message="No performance data is synced for this campaign." />;
  return (
    <div className="detailPanel">
      <div className="metricGrid">
        <Stat label="Cost" value={money(metrics?.cost)} />
        <Stat label="Impressions" value={number(metrics?.impressions)} />
        <Stat label="Clicks" value={number(metrics?.clicks)} />
        <Stat label="CTR" value={rate(metrics?.clicks, metrics?.impressions)} />
        <Stat label="CPC" value={unitCost(metrics?.cost, metrics?.clicks)} />
        <Stat label="Conversions" value={number(metrics?.conversions)} />
      </div>
      {daily.length ? (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Cost</th>
                <th>Impr.</th>
                <th>Clicks</th>
                <th>Conv.</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{money(day.cost)}</td>
                  <td>{number(day.impressions)}</td>
                  <td>{number(day.clicks)}</td>
                  <td>{number(day.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function CampaignRaw({ row }: { row: CampaignRow }) {
  const raw = row.raw ?? {};
  const sections: Array<[string, unknown]> = [
    ["Campaign", raw],
    ["Budget", row.budget_detail],
    ["Metrics", row.metrics],
    ["Daily", row.daily],
    ["Ad groups", row.ad_groups],
    ["Ads", row.ads],
    ["Videos", row.videos],
  ];
  return (
    <div className="detailPanel">
      {sections.map(([title, value]) => (
        <FieldSection key={title} title={title} value={value} />
      ))}
      <pre className="jsonPanel">{JSON.stringify(raw, null, 2)}</pre>
    </div>
  );
}

function FieldSection({ title, value }: { title: string; value: unknown }) {
  const rows = flattenFields(value)
    .filter(([key]) => key)
    .slice(0, 120);
  if (!rows.length) return null;
  return (
    <section className="fieldSection">
      <strong>{title}</strong>
      <div className="fieldTable">
        {rows.map(([key, fieldValue]) => (
          <div className="fieldRow" key={key}>
            <span>{key}</span>
            <b>{fieldValue || "-"}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <span>
      <small>{label}</small>
      <b>{value || "-"}</b>
    </span>
  );
}

function EmptyDetail({ message }: { message: string }) {
  return (
    <article className="emptyDetail">
      <strong>{message}</strong>
    </article>
  );
}

function SettingsView({ state }: { state: CmoState | null }) {
  return (
    <div className="stack">
      <section className="panel">
        <h3>Configuration</h3>
        <dl className="settingsList">
          <div>
            <dt>Config source</dt>
            <dd>{state?.config_summary?.config_source}</dd>
          </div>
          <div>
            <dt>Using example</dt>
            <dd>{String(Boolean(state?.config_summary?.using_example))}</dd>
          </div>
          <div>
            <dt>Reddit API docs</dt>
            <dd>{state?.config_summary?.api_docs}</dd>
          </div>
          <div>
            <dt>Postman</dt>
            <dd>{state?.config_summary?.postman_workspace || "-"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function ActionList({ actions }: { actions: MarketingAction[] }) {
  return (
    <div className="cardList">
      {actions.map((action) => (
        <article className="miniCard" key={`${action.priority}-${action.title}`}>
          <div className="panelHeader">
            <strong>{action.title}</strong>
            <Badge status={action.priority} />
          </div>
          <p>{action.description}</p>
          <small>
            {action.pillar} · {action.ownerHint}
          </small>
        </article>
      ))}
      {!actions.length ? <p className="muted">No priority actions yet.</p> : null}
    </div>
  );
}

function ScorePanel({
  title,
  icon: Icon,
  stats,
}: {
  title: string;
  icon: typeof LayoutDashboard;
  stats: Array<[string, string]>;
}) {
  return (
    <article className="panel">
      <div className="panelHeader">
        <h3>{title}</h3>
        <Icon size={18} />
      </div>
      <div className="miniStats">
        {stats.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>
    </article>
  );
}

interface LineSeries {
  key: keyof TrendPoint;
  label: string;
  color: string;
}

function LineChart({
  title,
  description,
  rows,
  series,
  showDailyValues = false,
}: {
  title: string;
  description?: string;
  rows: TrendPoint[];
  series: LineSeries[];
  showDailyValues?: boolean;
}) {
  const dailySeries = series[0];
  return (
    <section className="panel lineChartPanel">
      <div className="panelHeader">
        <div>
          <h3>{title}</h3>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        <div className="chartLegend">
          {series.map((item) => (
            <span key={String(item.key)}>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <LineChartFrame rows={rows} series={series} />
      {showDailyValues && dailySeries ? (
        <ul className="dailyValueList" aria-label={`${dailySeries.label} by day`}>
          {rows.map((row) => (
            <li key={`${row.date}-${String(dailySeries.key)}`}>
              <small>{row.date}</small>
              <b>{number(Number(row[dailySeries.key] || 0))}</b>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function LineChartFrame({ rows, series }: { rows: TrendPoint[]; series: LineSeries[] }) {
  const width = 640;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 34, left: 48 };
  const visibleRows = rows.slice(-90);
  const values = visibleRows.flatMap((row) => series.map((item) => Number(row[item.key] || 0)));
  const maxValue = Math.max(1, ...values);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) =>
    padding.left + (visibleRows.length <= 1 ? 0 : (index / (visibleRows.length - 1)) * innerWidth);
  const yFor = (value: number) => padding.top + innerHeight - (value / maxValue) * innerHeight;
  const pathFor = (key: keyof TrendPoint) =>
    visibleRows
      .map(
        (row, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(Number(row[key] || 0))}`,
      )
      .join(" ");
  const tickRows = visibleRows.filter((_, index) => {
    if (visibleRows.length <= 7) return true;
    const interval = Math.ceil(visibleRows.length / 6);
    return index === 0 || index === visibleRows.length - 1 || index % interval === 0;
  });

  if (!visibleRows.length) return <EmptyDetail message="No GA4 trend data for this date range." />;

  return (
    <div className="lineChartFrame">
      <svg aria-label="Traffic line chart" role="img" viewBox={`0 0 ${width} ${height}`}>
        <line
          className="chartAxis"
          x1={padding.left}
          x2={padding.left + innerWidth}
          y1={padding.top + innerHeight}
          y2={padding.top + innerHeight}
        />
        {[0, 0.5, 1].map((ratio) => {
          const value = Math.round(maxValue * ratio);
          const y = yFor(value);
          return (
            <g key={ratio}>
              <line
                className="chartGridLine"
                x1={padding.left}
                x2={padding.left + innerWidth}
                y1={y}
                y2={y}
              />
              <text className="chartTick" x={padding.left - 10} y={y + 4}>
                {number(value)}
              </text>
            </g>
          );
        })}
        {series.map((item) => (
          <path
            className="chartLine"
            d={pathFor(item.key)}
            key={String(item.key)}
            stroke={item.color}
          />
        ))}
        {tickRows.map((row) => {
          const index = visibleRows.indexOf(row);
          return (
            <text
              className="chartTick chartDateTick"
              key={`${row.date}-${index}`}
              x={xFor(index)}
              y={height - 10}
            >
              {row.date}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function SimpleChart({
  title,
  rows,
  keys,
}: {
  title: string;
  rows: TrendPoint[];
  keys: Array<keyof TrendPoint>;
}) {
  const max = Math.max(1, ...rows.flatMap((row) => keys.map((key) => Number(row[key] || 0))));
  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="sparkGrid">
        {rows.slice(-18).map((row) => (
          <div className="sparkRow" key={row.date}>
            <span>{row.date}</span>
            <div>
              {keys.map((key) => (
                <i
                  key={String(key)}
                  style={{ width: `${Math.max(2, (Number(row[key] || 0) / max) * 100)}%` }}
                  title={`${String(key)}: ${row[key]}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimpleTable<T extends object>({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: T[];
  columns: string[];
}) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h3>{title}</h3>
        <span className="muted">{rows.length} rows</span>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const record = row as Record<string, unknown>;
              return (
                <tr
                  key={String(record.id ?? record.path ?? record.query ?? record.keyword ?? index)}
                >
                  {columns.map((column) => {
                    const value = record[column];
                    return (
                      <td key={column}>
                        {typeof value === "number" ? number(value) : String(value ?? "-")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="panel loadingPanel">
      <div className="spinner" />
      <span>Loading CMO data…</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="stat">
      <b>{value}</b>
      <small>{label}</small>
    </span>
  );
}

function Badge({ status }: { status?: string }) {
  return <span className={`badge ${statusTone(status)}`}>{statusLabel(status)}</span>;
}

export { App };
