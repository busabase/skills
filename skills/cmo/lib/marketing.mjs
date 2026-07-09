// Marketing dashboard data for the CMO console.
//
// This is the one place that reaches the kapps `share-domains/marketing` logic.
// It is deliberately isolated behind the data provider so the Hono app stays
// platform-neutral: a Node host (local or standalone) imports the TS source
// directly (Node strips types), while a future Cloudflare/Busabase provider can
// serve a precomputed marketing snapshot instead of importing share-domains.

import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT_DIR } from "./paths.mjs";

const marketingRanges = new Set(["7d", "30d", "90d"]);

const hasText = (value) => Boolean(value && String(value).trim());

const oauthConfigured = () =>
  hasText(process.env.GOOGLE_ADS_ACCESS_TOKEN) ||
  (hasText(process.env.GOOGLE_ADS_CLIENT_ID) &&
    hasText(process.env.GOOGLE_ADS_CLIENT_SECRET) &&
    hasText(process.env.GOOGLE_ADS_REFRESH_TOKEN));

// Local ICP seeds so the dashboard renders without the full kapps repo checkout.
const localIcpSeeds = [
  {
    id: "seo-marketer",
    name: "SEO marketer",
    description: "Teams using AI agents to plan, write, publish, and measure search content.",
    valueProp: "Turn SEO workflows into repeatable agent-driven execution loops.",
    seo: {
      primaryKeywords: ["ai seo agent", "seo automation", "ai content workflow"],
      longTailKeywords: ["ai agent for seo teams", "automated keyword research workflow"],
      geoKeywords: ["ai seo agent US", "ai seo automation Singapore"],
    },
    sem: {
      keywords: [
        { keyword: "ai seo agent" },
        { keyword: "seo automation software" },
        { keyword: "ai content operations" },
      ],
    },
  },
  {
    id: "ai-agent-workspace",
    name: "AI agent workspace",
    description: "Builders coordinating multiple agents, apps, sessions, and published sites.",
    valueProp: "A workspace for running and reviewing multi-agent work from one place.",
    seo: {
      primaryKeywords: ["ai agent workspace", "multi agent workspace", "coding agent workspace"],
      longTailKeywords: ["workspace for ai coding agents", "manage multiple ai agents"],
      geoKeywords: ["ai agent workspace US", "ai agent workspace Hong Kong"],
    },
    sem: {
      keywords: [
        { keyword: "ai agent workspace" },
        { keyword: "multi agent workspace" },
        { keyword: "ai coding agents" },
      ],
    },
  },
];

const pickEnglish = (value, fallback = "") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.en ?? Object.values(value).find(Boolean) ?? fallback;
};

const getIcpSeeds = (limit = 12) =>
  localIcpSeeds.slice(0, limit).map((icp) => ({
    id: icp.id,
    name: pickEnglish(icp.name, icp.id),
    description: pickEnglish(icp.description),
    valueProp: pickEnglish(icp.valueProp),
    primaryKeywords: icp.seo?.primaryKeywords?.slice(0, 8) ?? [],
    longTailKeywords: icp.seo?.longTailKeywords?.slice(0, 8) ?? [],
    geoKeywords: icp.seo?.geoKeywords?.slice(0, 10) ?? [],
    semKeywords: icp.sem?.keywords?.map((item) => item.keyword).slice(0, 8) ?? [],
  }));

export function getMarketingInput(searchParams) {
  const timeRange = searchParams.get("timeRange") ?? "30d";
  const seedKeywords = searchParams
    .get("seedKeywords")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    timeRange: marketingRanges.has(timeRange) ? timeRange : "30d",
    icpId: searchParams.get("icpId") ?? undefined,
    seedKeywords: seedKeywords?.length ? seedKeywords : undefined,
  };
}

// Node imports the share-domains TS source directly (type stripping). This
// module's real path is .agents/skills/cmo/lib, from which the bare
// `share-domains` specifier does not resolve, so import it by absolute path off
// the repo root. Cached so repeated dashboard calls do not re-resolve the graph.
let sharedLogicPromise = null;
const getSharedLogic = () => {
  if (!sharedLogicPromise) {
    const entry = path.join(ROOT_DIR, "packages/share-domains/marketing/logic/index.ts");
    sharedLogicPromise = import(pathToFileURL(entry).href).catch(
      () =>
        // Fall back to bare specifier for hosts where it does resolve (e.g. app/).
        import("share-domains/marketing/logic"),
    );
  }
  return sharedLogicPromise;
};

const getMarketingData = async (input) => {
  const { getMarketingCommandCenter } = await getSharedLogic();
  return getMarketingCommandCenter({
    timeRange: input.timeRange,
    icpId: input.icpId,
    seedKeywords: input.seedKeywords,
    icpSeeds: getIcpSeeds(),
    fallbackIcpId: "seo-marketer",
    brandKeywords: ["buda", "openclaw"],
    appAttributionIntegration: {
      provider: "Buda Attribution",
      connected: true,
      source: "buda_vid cookie + CRM touchpoints + checkout metadata",
      setupHint:
        "Already records UTM/ref touchpoints and can attach them to contacts/users/payments.",
    },
  });
};

const withIntegrationDiagnostics = (integration) => {
  if (integration.provider === "GA4") {
    const checks = [
      {
        key: "GA_SERVICE_ACCOUNT_CREDENTIALS",
        configured: hasText(process.env.GA_SERVICE_ACCOUNT_CREDENTIALS),
      },
      { key: "GA_PROPERTY_ID", configured: hasText(process.env.GA_PROPERTY_ID) },
    ];
    return {
      ...integration,
      configured: checks.every((check) => check.configured),
      requiredEnv: checks.map((check) => check.key),
      missingEnv: checks.filter((check) => !check.configured).map((check) => check.key),
    };
  }
  if (integration.provider === "Google Search Console") {
    const hasCredentials =
      hasText(process.env.GSC_SERVICE_ACCOUNT_CREDENTIALS) ||
      hasText(process.env.GA_SERVICE_ACCOUNT_CREDENTIALS);
    const checks = [
      { key: "GSC_SITE_URL", configured: hasText(process.env.GSC_SITE_URL) },
      {
        key: "GSC_SERVICE_ACCOUNT_CREDENTIALS or GA_SERVICE_ACCOUNT_CREDENTIALS",
        configured: hasCredentials,
      },
    ];
    return {
      ...integration,
      configured: checks.every((check) => check.configured),
      requiredEnv: checks.map((check) => check.key),
      missingEnv: checks.filter((check) => !check.configured).map((check) => check.key),
    };
  }
  if (
    integration.provider === "Google Ads Keyword Planner" ||
    integration.provider === "Google Ads Campaigns"
  ) {
    const checks = [
      {
        key: "GOOGLE_ADS_DEVELOPER_TOKEN",
        configured: hasText(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
      },
      { key: "GOOGLE_ADS_CUSTOMER_ID", configured: hasText(process.env.GOOGLE_ADS_CUSTOMER_ID) },
      { key: "GOOGLE_ADS_OAUTH", configured: oauthConfigured() },
    ];
    return {
      ...integration,
      configured: checks.every((check) => check.configured),
      requiredEnv: [
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID",
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN",
      ],
      missingEnv: checks.filter((check) => !check.configured).map((check) => check.key),
    };
  }
  return { ...integration, configured: true, requiredEnv: [], missingEnv: [] };
};

const scoreSearchPriority = (query) => {
  if (query.impressions >= 100 && query.ctr < 2) return 90;
  if (query.position >= 8 && query.position <= 20) return 76;
  if (query.intent === "geo") return 68;
  if (query.intent === "sem") return 60;
  return 40;
};

const getSearchReason = (query) => {
  if (query.impressions >= 100 && query.ctr < 2) return "High impressions with weak CTR.";
  if (query.position >= 8 && query.position <= 20) return "Striking distance ranking.";
  if (query.intent === "geo") return "Answer-engine friendly query.";
  if (query.intent === "sem") return "Commercial query worth paid validation.";
  return "Monitor as a cluster signal.";
};

const getChannelSummary = (ideas) =>
  ["SEO", "GEO", "SEM", "Mixed"].map((channel) => {
    const channelIdeas = ideas.filter((idea) => idea.recommendedChannel === channel);
    return {
      channel,
      count: channelIdeas.length,
      averageMonthlySearches: channelIdeas.reduce(
        (sum, idea) => sum + idea.averageMonthlySearches,
        0,
      ),
      topOpportunityScore: channelIdeas.reduce(
        (max, idea) => Math.max(max, idea.opportunityScore),
        0,
      ),
    };
  });

export async function marketingPayload(view, input) {
  const data = await getMarketingData(input);
  if (view === "traffic") {
    return {
      integrations: data.integrations,
      stats: {
        pageviews: data.stats.pageviews,
        sessions: data.stats.sessions,
        newUsers: data.stats.newUsers,
        users: data.stats.users,
        bounceRate: data.stats.bounceRate,
        avgDuration: data.stats.avgDuration,
        organicClicks: data.stats.organicClicks,
        organicImpressions: data.stats.organicImpressions,
        organicCtr: data.stats.organicCtr,
        averagePosition: data.stats.averagePosition,
      },
      trend: data.trend,
      sources: data.sources,
      manualSources: data.manualSources,
      topPages: data.topPages,
      notes: data.notes,
    };
  }
  if (view === "search") {
    return {
      integration: data.integrations.find((item) => item.provider === "Google Search Console"),
      stats: {
        organicClicks: data.stats.organicClicks,
        organicImpressions: data.stats.organicImpressions,
        organicCtr: data.stats.organicCtr,
        averagePosition: data.stats.averagePosition,
      },
      queries: data.searchQueries,
      opportunities: data.searchQueries
        .map((query) => ({
          ...query,
          priorityScore: scoreSearchPriority(query),
          reason: getSearchReason(query),
        }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 10),
      actions: data.actions.filter((action) => action.pillar === "SEO" || action.pillar === "GEO"),
      notes: data.notes,
    };
  }
  if (view === "keywords") {
    const activeIcp =
      data.icpSeeds.find((item) => item.id === input.icpId) ??
      data.icpSeeds.find((item) => item.id === "seo-marketer") ??
      data.icpSeeds[0] ??
      null;
    return {
      integration: data.integrations.find((item) => item.provider === "Google Ads Keyword Planner"),
      icpSeeds: data.icpSeeds,
      activeIcp,
      keywordIdeas: data.keywordIdeas,
      keywordCoverage: data.keywordCoverage,
      coverageSummary: data.coverageSummary,
      landingPages: data.landingPageCoverage.map((page) => ({
        path: page.path,
        coveredKeywords: page.coveredKeywords.map((keyword) => keyword.keyword),
        missingKeywords: page.missingKeywords.map((keyword) => keyword.keyword),
        geoReadinessScore: page.geoReadinessScore,
        aiOptimizationScore: page.aiOptimizationScore,
      })),
      channelSummary: getChannelSummary(data.keywordIdeas),
      actions: data.actions.filter(
        (action) => action.pillar === "SEO" || action.pillar === "GEO" || action.pillar === "SEM",
      ),
      notes: data.notes,
    };
  }
  if (view === "landing-pages") {
    return {
      integrations: data.integrations.filter(
        (item) => item.provider === "GA4" || item.provider === "Google Search Console",
      ),
      stats: {
        pageviews: data.stats.pageviews,
        sessions: data.stats.sessions,
        organicClicks: data.stats.organicClicks,
        organicImpressions: data.stats.organicImpressions,
        geoReadinessScore: data.coverageSummary.geoReadinessScore,
        aiOptimizationScore: data.coverageSummary.aiOptimizationScore,
      },
      coverageSummary: data.coverageSummary,
      pages: data.landingPageCoverage,
      notes: data.notes,
    };
  }
  if (view === "integrations") {
    return {
      integrations: data.integrations.map(withIntegrationDiagnostics),
      notes: data.notes,
    };
  }
  if (view === "ads") {
    return {
      integration: data.integrations.find((item) => item.provider === "Google Ads Campaigns"),
      ads: data.ads,
      actions: data.actions.filter((action) => action.pillar === "SEM"),
      notes: data.notes,
    };
  }
  return data;
}
