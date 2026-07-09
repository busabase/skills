#!/usr/bin/env node
/**
 * sync-google-video-assets.mjs
 * Create Google Ads YouTube video assets from CMO campaign draft video_assets.
 *
 * Default mode is dry-run and makes no Google Ads API calls. To write asset
 * library entries, pass both:
 *   --execute --confirm-asset-write
 *
 * This creates assets only. It does not create campaigns, ad groups, ads,
 * budgets, targeting, or enabled spend.
 */

import fs from "node:fs";
import path from "node:path";

import {
  getCustomer,
  getCustomerId,
  getDeveloperToken,
  getOAuthClient,
} from "../lib/google-ads-client.mjs";

const args = process.argv.slice(2);
const get = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const repoRoot = process.cwd();
const defaultBatchPath = path.join(repoRoot, ".agents/skills/cmo/app/.data/current_batch.json");
const defaultReportPath = path.join(repoRoot, ".agents/skills/cmo/app/.data/execution_report.json");
const batchPath = path.resolve(get("--batch") || defaultBatchPath);
const reportPath = path.resolve(get("--report") || defaultReportPath);
const proposalId = get("--proposal-id");
const execute = hasFlag("--execute");
const confirmed = hasFlag("--confirm-asset-write");
const writeReport = execute || hasFlag("--write-report");
const updateBatch = execute && !hasFlag("--no-update-batch");

if (hasFlag("--help") || hasFlag("-h")) {
  console.log(
    [
      "Usage:",
      "  node .agents/skills/cmo/scripts/sync-google-video-assets.mjs [options]",
      "",
      "Options:",
      "  --batch <path>              CMO current_batch.json path",
      "  --proposal-id <id>          Only sync one proposal's video assets",
      "  --execute                   Create missing Google Ads assets",
      "  --confirm-asset-write       Required with --execute",
      "  --write-report              Write execution_report.json during dry-run",
      "  --report <path>             Report output path",
      "  --no-update-batch           Do not write asset resource names into batch",
      "",
      "Safety:",
      "  Dry-run is default. --execute creates asset library entries only.",
      "  It does not create campaigns, ad groups, ads, budgets, or enabled spend.",
    ].join("\n"),
  );
  process.exit(0);
}

if (!fs.existsSync(batchPath)) {
  console.error(`Batch file not found: ${batchPath}`);
  process.exit(1);
}

if (execute && !confirmed) {
  console.error(
    "Refusing to write Google Ads assets without --confirm-asset-write. " +
      "Re-run with --execute --confirm-asset-write after confirming the account.",
  );
  process.exit(1);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const normalizeTitle = (title = "") =>
  String(title)
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const validYoutubeVideoId = (value) => /^[A-Za-z0-9_-]{11}$/.test(String(value || ""));

function collectVideoAssets(batch) {
  const assetsById = new Map();
  for (const proposal of batch.proposals || []) {
    if (proposalId && proposal.id !== proposalId) continue;
    if (proposal.platform !== "google") continue;
    const videoAssets = proposal.proposed_structure?.video_assets || [];
    for (const asset of videoAssets) {
      const videoId = String(asset.video_id || asset.youtube_id || "").trim();
      if (!validYoutubeVideoId(videoId)) continue;
      const existing = assetsById.get(videoId);
      assetsById.set(videoId, {
        video_id: videoId,
        title: normalizeTitle(asset.title || existing?.title || ""),
        url: asset.url || existing?.url || `https://www.youtube.com/watch?v=${videoId}`,
        language: asset.language || existing?.language || "",
        format: asset.format || existing?.format || "",
        proposal_ids: [
          ...new Set([...(existing?.proposal_ids || []), proposal.id].filter(Boolean)),
        ],
        current_resource_name:
          asset.google_ads_asset_resource_name ||
          asset.resource_name ||
          existing?.current_resource_name ||
          "",
      });
    }
  }
  return [...assetsById.values()].sort((a, b) => a.video_id.localeCompare(b.video_id));
}

async function queryExistingYoutubeAssets(customer) {
  const query = `
    SELECT
      asset.id,
      asset.name,
      asset.resource_name,
      asset.youtube_video_asset.youtube_video_id,
      asset.youtube_video_asset.youtube_video_title
    FROM asset
    WHERE asset.type = 'YOUTUBE_VIDEO'
    LIMIT 10000
  `;
  const rows = await customer.query(query);
  const byVideoId = new Map();
  for (const row of rows || []) {
    const asset = row.asset || {};
    const youtube = asset.youtube_video_asset || {};
    const videoId = String(youtube.youtube_video_id || "");
    if (!validYoutubeVideoId(videoId)) continue;
    byVideoId.set(videoId, {
      video_id: videoId,
      title: youtube.youtube_video_title || asset.name || "",
      resource_name: asset.resource_name || "",
      asset_id: String(asset.id || ""),
      status: "existing",
    });
  }
  return byVideoId;
}

async function createYoutubeVideoAsset(customer, video) {
  const name = `Buda YouTube video ${video.video_id}`;
  const result = await customer.assets.create([
    {
      name,
      youtube_video_asset: {
        youtube_video_id: video.video_id,
      },
    },
  ]);
  const resourceName = result.results?.[0]?.resource_name || "";
  if (!resourceName) {
    throw new Error(`Google Ads did not return a resource_name for ${video.video_id}`);
  }
  return {
    video_id: video.video_id,
    title: video.title,
    resource_name: resourceName,
    asset_id: resourceName.split("/").pop() || "",
    status: "created",
  };
}

function attachAssetResults(batch, assetResults, syncedAt) {
  const byId = new Map(assetResults.map((asset) => [asset.video_id, asset]));
  for (const proposal of batch.proposals || []) {
    const videoAssets = proposal.proposed_structure?.video_assets || [];
    for (const videoAsset of videoAssets) {
      const result = byId.get(videoAsset.video_id);
      if (!result?.resource_name) continue;
      videoAsset.google_ads_asset_resource_name = result.resource_name;
      videoAsset.google_ads_asset_id = result.asset_id;
      videoAsset.google_ads_asset_status = result.status;
      videoAsset.google_ads_asset_synced_at = syncedAt;
    }
  }
  batch.updated_at = syncedAt;
  batch.campaign = {
    ...(batch.campaign || {}),
    google_video_assets_synced_at: syncedAt,
    google_video_assets_synced: assetResults.filter((asset) => asset.resource_name).length,
  };
  return batch;
}

const batch = readJson(batchPath);
const videoAssets = collectVideoAssets(batch);

console.log("Google Ads YouTube Video Asset Sync");
console.log(`Batch: ${batchPath}`);
console.log(`Mode: ${execute ? "EXECUTE" : "dry-run"}`);
if (proposalId) console.log(`Proposal: ${proposalId}`);
console.log(`Assets in draft: ${videoAssets.length}`);

if (videoAssets.length === 0) {
  console.log("No Google video assets found in the selected batch/proposal.");
  process.exit(0);
}

if (!execute) {
  for (const asset of videoAssets) {
    console.log(`  DRY-RUN create/check: ${asset.video_id} ${asset.title}`);
  }
  console.log("\nDry run complete. No Google Ads API calls made.");
  console.log("To create missing assets, re-run with --execute --confirm-asset-write.");
  if (writeReport) {
    writeJson(reportPath, {
      report_id: `google-video-assets-dry-run-${new Date().toISOString()}`,
      generated_at: new Date().toISOString(),
      source: "cmo",
      status: "dry_run",
      action: "sync_google_video_assets",
      batch_id: batch.batch_id || "",
      assets: videoAssets,
      summary: `Dry-run planned ${videoAssets.length} YouTube video asset checks/creates.`,
    });
  }
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

console.log(`Google Ads customer: ${customerId}`);
console.log("Querying existing YOUTUBE_VIDEO assets...");
const existingByVideoId = await queryExistingYoutubeAssets(customer);

const results = [];
for (const asset of videoAssets) {
  const existing = existingByVideoId.get(asset.video_id);
  if (existing?.resource_name) {
    console.log(`  Existing: ${asset.video_id} -> ${existing.resource_name}`);
    results.push(existing);
    continue;
  }

  console.log(`  Creating: ${asset.video_id} ${asset.title}`);
  try {
    const created = await createYoutubeVideoAsset(customer, asset);
    console.log(`    Created: ${created.resource_name}`);
    results.push(created);
  } catch (error) {
    console.error(`    Failed: ${asset.video_id}: ${error.message}`);
    results.push({
      video_id: asset.video_id,
      title: asset.title,
      resource_name: "",
      asset_id: "",
      status: "failed",
      error: error.message,
    });
  }
}

const syncedAt = new Date().toISOString();
const createdCount = results.filter((asset) => asset.status === "created").length;
const existingCount = results.filter((asset) => asset.status === "existing").length;
const failedCount = results.filter((asset) => asset.status === "failed").length;

if (updateBatch) {
  attachAssetResults(batch, results, syncedAt);
  writeJson(batchPath, batch);
}

writeJson(reportPath, {
  report_id: `google-video-assets-${syncedAt}`,
  generated_at: syncedAt,
  updated_at: syncedAt,
  source: "cmo",
  status: failedCount > 0 ? "partial_failure" : "assets_synced",
  action: "sync_google_video_assets",
  batch_id: batch.batch_id || "",
  customer_id: customerId,
  summary: {
    total: results.length,
    created: createdCount,
    existing: existingCount,
    failed: failedCount,
    updated_batch: updateBatch,
  },
  assets: results,
});

console.log(
  `Done. total=${results.length} created=${createdCount} existing=${existingCount} failed=${failedCount}`,
);
if (updateBatch) console.log(`Updated batch: ${batchPath}`);
console.log(`Report: ${reportPath}`);
