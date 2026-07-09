#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { loadGeoSnapshot, readJson, saveGeoSnapshot, utcNow } from "../lib/common.mjs";
import { CONFIG_EXAMPLE_PATH, CONFIG_LOCAL_PATH } from "../lib/paths.mjs";

const VALID_RANGES = new Set(["7d", "30d"]);

function parseArgs(argv) {
  const args = {
    ranges: ["7d", "30d"],
    promptLimit: 40,
    blindLimit: 20,
    sourcesPerPrompt: 5,
    sourceLimit: 80,
    promptSearch: "",
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--range") {
      const value = argv[++index];
      if (!VALID_RANGES.has(value)) throw new Error("--range must be 7d or 30d");
      args.ranges = [value];
    } else if (arg === "--prompt-limit") args.promptLimit = Number(argv[++index]);
    else if (arg === "--blind-limit") args.blindLimit = Number(argv[++index]);
    else if (arg === "--sources-per-prompt") args.sourcesPerPrompt = Number(argv[++index]);
    else if (arg === "--source-limit") args.sourceLimit = Number(argv[++index]);
    else if (arg === "--prompt-search") args.promptSearch = argv[++index] || "";
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node .agents/skills/cmo/scripts/sync_geoly.mjs [options]

Read GEOly brand visibility data and write app/.data/geo_snapshot.json.
This is read-only; it never calls GEOly write tools.

Options:
  --range 7d|30d             Refresh one window instead of both
  --prompt-limit N           Prompt rows to cache per window (default 40)
  --blind-limit N            Blind-spot rows to cache per window (default 20)
  --sources-per-prompt N     Cache citation sources for the top N prompts (default 5)
  --source-limit N           Deduplicated citation source limit per prompt (default 80)
  --prompt-search TEXT       Optional GEOly prompt search filter
`);
}

async function loadConfig() {
  const local = await readJson(CONFIG_LOCAL_PATH, null).catch(() => null);
  const fallback = await readJson(CONFIG_EXAMPLE_PATH, {});
  return local || fallback;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 24,
    ...options,
  });
}

function ensureGeolyCli() {
  const probe = run("geoly", ["tools", "--json"]);
  if (probe.status === 0) return;
  const message =
    "GEOly CLI is not available or not authenticated. Install it with `curl -fsSL https://geoly.ai/install.sh | sh`, then run this script again. The first `geoly call` opens browser authorization.";
  const error = new Error(message);
  error.stderr = probe.stderr || probe.stdout;
  throw error;
}

const schemas = new Map();
function toolParams(tool) {
  if (schemas.has(tool)) return schemas.get(tool);
  const result = run("geoly", ["schema", tool]);
  if (result.status !== 0) {
    schemas.set(tool, null);
    return null;
  }
  try {
    const schema = JSON.parse(result.stdout);
    const properties =
      schema?.inputSchema?.properties || schema?.schema?.properties || schema?.properties || {};
    const params = new Set(Object.keys(properties));
    schemas.set(tool, params);
    return params;
  } catch {
    schemas.set(tool, null);
    return null;
  }
}

function allowedArgs(tool, args, config) {
  const params = toolParams(tool);
  const withContext = { ...args };
  if (config.geoly?.brand_id) withContext.brand_id = config.geoly.brand_id;
  if (config.geoly?.org_id) withContext.org_id = config.geoly.org_id;
  if (!params) return withContext;
  return Object.fromEntries(Object.entries(withContext).filter(([key]) => params.has(key)));
}

function callGeoly(tool, args = {}, config = {}) {
  const payload = allowedArgs(tool, args, config);
  const result = run("geoly", ["call", tool, "--data", JSON.stringify(payload)]);
  if (result.status !== 0) {
    const error = new Error(
      `GEOly ${tool} failed: ${String(result.stderr || result.stdout).trim()}`,
    );
    error.exitCode = result.status;
    throw error;
  }
  try {
    return JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`GEOly ${tool} returned non-JSON output: ${error.message}`);
  }
}

function rowsFrom(value) {
  if (Array.isArray(value)) return value;
  for (const key of ["rows", "items", "prompts", "data", "results", "citations", "sources"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function getServerDate(config) {
  try {
    const value = callGeoly("get_current_date", {}, config);
    const candidate = value.date || value.current_date || value.currentDate || value.today || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return candidate;
  } catch {
    // Local UTC date is acceptable fallback for a cache refresh script.
  }
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function promptId(prompt) {
  return String(prompt.id || prompt.prompt_id || prompt.promptId || "");
}

function sourceDomain(source) {
  return String(source.domain || source.hostname || "");
}

function citationCount(source) {
  return Number(source.count || source.occurrences || source.records || 0);
}

function citationTitle(source) {
  return String(source.title || source.pageTitle || source.url || "");
}

function opportunitiesFromCitationOverview(citationOverview = {}) {
  const domains = rowsFrom(citationOverview.topDomains || citationOverview.stats?.topDomains || []);
  const maxCitations = Math.max(
    1,
    ...domains
      .filter((domain) => !domain.isBrandDomain)
      .map((domain) => Number(domain.count || domain.citationCount || 0)),
  );
  return domains
    .map((domain, index) => {
      const citations = Number(domain.count || domain.citationCount || 0);
      const brandAffinity = domain.isBrandDomain ? 100 : Number(domain.brandAffinity || 0);
      const demandScore = Math.round((Math.log(citations + 1) / Math.log(maxCitations + 1)) * 100);
      const opportunity = Math.max(0, Math.round(demandScore * ((100 - brandAffinity) / 100)));
      return {
        id: String(domain.domain || `domain-${index + 1}`),
        domain: String(domain.domain || ""),
        promptId: "",
        promptText: "",
        opportunity: Math.min(100, opportunity),
        citations,
        brandAffinity,
      };
    })
    .filter((item) => item.domain && item.brandAffinity < 100);
}

function topDomainsFromCitationOverview(citationOverview = {}) {
  return rowsFrom(citationOverview.topDomains || citationOverview.stats?.topDomains || []).map(
    (domain, index) => ({
      id: String(domain.domain || `domain-${index + 1}`),
      domain: String(domain.domain || ""),
      rank: index + 1,
      citations: Number(domain.count || domain.citationCount || 0),
      uniqueUrls: Number(domain.uniqueUrls || 0),
      subdomains: Number(domain.subdomains || 0),
      brandAffinity: domain.isBrandDomain ? 100 : Number(domain.brandAffinity || 0),
      isBrandDomain: Boolean(domain.isBrandDomain),
    }),
  );
}

function domainFromHomepage(homepage = "") {
  if (!homepage) return "";
  try {
    const url = homepage.includes("://") ? homepage : `https://${homepage}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function resolveBrandIdentity(config, existing = {}) {
  try {
    const resolved = callGeoly("resolve_my_brand_public", {}, config);
    if (resolved.myBrand?.name || resolved.myBrand?.domain || resolved.myBrand?.brandId) {
      return {
        name: resolved.myBrand.name || "buda",
        homepage: resolved.myBrand.domain
          ? `https://${resolved.myBrand.domain}`
          : config.brand?.homepage || "https://buda.im",
        geoly_brand_id: resolved.myBrand.brandId || config.geoly?.brand_id || "",
        geoly_org_id: config.geoly?.org_id || "",
      };
    }
  } catch {
    // Brand identity is helpful metadata; dashboard sync can continue without it.
  }
  return {
    name: config.geoly?.brand_name || "buda",
    homepage: config.geoly?.brand_domain
      ? `https://${config.geoly.brand_domain}`
      : config.brand?.homepage || "https://buda.im",
    geoly_brand_id: config.geoly?.brand_id || existing.brand?.geoly_brand_id || "",
    geoly_org_id: config.geoly?.org_id || existing.brand?.geoly_org_id || "",
  };
}

async function syncWindow(timeRange, options, config, endDate) {
  const days = timeRange === "7d" ? 7 : 30;
  const startDate = addDays(endDate, -(days - 1));
  const overview = callGeoly("get_brand_overview", { time_range: timeRange }, config);
  const citationOverview = callGeoly(
    "get_citation_overview",
    { time_range: timeRange, platform: "all" },
    config,
  );
  const trend = rowsFrom(
    callGeoly("get_brand_citations_daily", { start_date: startDate, end_date: endDate }, config),
  );
  const prompts = rowsFrom(
    callGeoly(
      "get_prompt_list",
      {
        page: 1,
        page_size: options.promptLimit,
        search: options.promptSearch || undefined,
        sort_by: "visibility",
        sort_order: "desc",
        time_range: timeRange,
      },
      config,
    ),
  );
  const blindSpots = rowsFrom(
    callGeoly(
      "get_prompt_mention_rates",
      {
        time_range: timeRange,
        min_records: 1,
        limit: options.blindLimit,
        only_active: true,
      },
      config,
    ),
  );
  const brandDomain =
    domainFromHomepage(config.brand?.homepage) ||
    String(
      citationOverview.brandSubdomains?.[0]?.domain ||
        citationOverview.stats?.brandSubdomains?.[0]?.domain ||
        "",
    );
  const contentOpportunities = rowsFrom(
    brandDomain
      ? callGeoly(
          "get_content_opportunities",
          {
            domain: brandDomain,
            time_range: timeRange,
            platform: "all",
          },
          config,
        )
      : [],
  );
  const citationSources = {};
  for (const prompt of prompts.slice(0, options.sourcesPerPrompt)) {
    const id = promptId(prompt);
    if (!id) continue;
    citationSources[id] = rowsFrom(
      callGeoly(
        "get_prompt_citations",
        {
          prompt_id: id,
          deduplicate: true,
          limit: options.sourceLimit,
          time_range: timeRange,
        },
        config,
      ),
    );
  }
  const sourceOpportunities = new Map();
  for (const rows of Object.values(citationSources)) {
    for (const source of rows) {
      const domain = sourceDomain(source);
      if (!domain || domain === brandDomain) continue;
      const row = sourceOpportunities.get(domain) || {
        id: domain,
        domain,
        promptId: "",
        promptText: citationTitle(source),
        opportunity: 0,
        citations: 0,
        brandAffinity: 0,
      };
      row.citations += citationCount(source);
      row.opportunity = Math.min(100, Math.round(row.citations * 18));
      sourceOpportunities.set(domain, row);
    }
  }
  const inferredOpportunities = [...sourceOpportunities.values()]
    .sort((a, b) => b.opportunity - a.opportunity || b.citations - a.citations)
    .slice(0, 30);
  const topCitedDomains = topDomainsFromCitationOverview(citationOverview).slice(0, 30);
  for (const domain of topCitedDomains) {
    try {
      const detail = callGeoly(
        "get_domain_detail",
        { domain: domain.domain, time_range: timeRange, platform: "all" },
        config,
      );
      domain.uniqueUrls = rowsFrom(detail.pages || []).length || domain.uniqueUrls;
      domain.subdomains = 0;
      domain.prompts = rowsFrom(detail.prompts || []).map((prompt) => ({
        id: String(prompt.promptId || prompt.id || ""),
        text: String(prompt.promptText || prompt.text || ""),
        citations: Number(prompt.citations || prompt.citationCount || 0),
        brandAffinity: Number(prompt.brandAffinity || prompt.brandMentionRate || 0),
        competitors: Array.isArray(prompt.competitors) ? prompt.competitors : [],
      }));
    } catch {
      // Domain detail is enrichment only; keep overview data if unavailable.
    }
  }
  const opportunityRows = opportunitiesFromCitationOverview(citationOverview);
  const enrichedOpportunityRows = opportunityRows.map((row) => {
    const enriched = topCitedDomains.find((domain) => domain.domain === row.domain);
    return enriched ? { ...row, prompts: enriched.prompts || [] } : row;
  });
  return {
    time_range: timeRange,
    status: "synced",
    start_date: startDate,
    end_date: endDate,
    overview,
    trend,
    prompts,
    blind_spots: blindSpots,
    content_opportunities: enrichedOpportunityRows.length
      ? enrichedOpportunityRows
      : contentOpportunities.length
        ? contentOpportunities
        : inferredOpportunities,
    top_cited_domains: topCitedDomains,
    citation_sources_by_prompt: citationSources,
    notes: [
      "Headline KPI values come from get_brand_overview.",
      "Trend rows preserve GEOly daily gaps as missing monitoring days, not zeros.",
    ],
    blockers: [],
  };
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

const config = await loadConfig();
options.promptLimit = Number(config.geoly?.default_prompt_limit || options.promptLimit);
options.sourceLimit = Number(config.geoly?.default_source_limit || options.sourceLimit);

try {
  ensureGeolyCli();
  const endDate = getServerDate(config);
  const existing = await loadGeoSnapshot();
  const brand = resolveBrandIdentity(config, existing);
  const windows = { ...(existing.windows || {}) };
  for (const timeRange of options.ranges) {
    windows[timeRange] = await syncWindow(timeRange, options, config, endDate);
  }
  const snapshot = await saveGeoSnapshot({
    ...existing,
    source: "geoly",
    status: "synced",
    generated_at: existing.generated_at || utcNow(),
    updated_at: utcNow(),
    brand,
    windows,
    blockers: [],
    notes: ["Local cache generated by scripts/sync_geoly.mjs."],
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        path: "app/.data/geo_snapshot.json",
        updated_at: snapshot.updated_at,
        windows: options.ranges,
      },
      null,
      2,
    ),
  );
} catch (error) {
  const existing = await loadGeoSnapshot();
  await saveGeoSnapshot({
    ...existing,
    status: existing.status === "synced" ? "synced" : "blocked",
    blockers: [error.message],
    notes: [
      "GEOly cache refresh failed. Existing synced window data is preserved when available.",
      "Install/authenticate the GEOly CLI or refresh the cache from a Codex session with GEOly MCP access.",
    ],
  });
  console.error(error.message);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
}
