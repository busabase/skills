#!/usr/bin/env node
import {
  computeCountsFromProposals,
  effectiveProposals,
  loadBatch,
  loadConfigSummary,
  loadDecisions,
  loadGeoSnapshot,
  loadPlatformSnapshot,
  readJson,
} from "../lib/common.mjs";
import {
  CURRENT_BATCH_PATH,
  DECISIONS_PATH,
  GEO_SNAPSHOT_PATH,
  PLATFORM_SNAPSHOT_PATH,
} from "../lib/paths.mjs";

const VALID_PROPOSAL_STATUS = new Set(["draft", "running", "blocked", "done"]);
const VALID_SNAPSHOT_STATUS = new Set(["not_synced", "synced", "blocked"]);
const VALID_DECISION = new Set(["", "approve_dry_run", "request_changes", "block_launch"]);

const errors = [];
const batch = await loadBatch();
const decisions = await loadDecisions(batch.batch_id);
const configSummary = await loadConfigSummary();
const snapshot = await loadPlatformSnapshot();
const geoSnapshot = await loadGeoSnapshot();
const proposals = effectiveProposals(batch, snapshot, configSummary);
await readJson(CURRENT_BATCH_PATH, {});
await readJson(DECISIONS_PATH, {});
await readJson(PLATFORM_SNAPSHOT_PATH, {});
await readJson(GEO_SNAPSHOT_PATH, {});

if (!batch.batch_id) errors.push("current_batch.json missing batch_id");
if (!batch.campaign) errors.push("current_batch.json missing campaign");

for (const [platformId, platform] of Object.entries(snapshot.platforms || {})) {
  if (!VALID_SNAPSHOT_STATUS.has(platform.status))
    errors.push(`${platformId}.status invalid: ${platform.status}`);
  if (!Array.isArray(platform.campaigns)) errors.push(`${platformId}.campaigns must be an array`);
  if (!Array.isArray(platform.blockers)) errors.push(`${platformId}.blockers must be an array`);
}

for (const [listName, requiredFields] of [["qa", ["id", "label", "checked", "required"]]]) {
  const seen = new Set();
  for (const [index, item] of (batch[listName] || []).entries()) {
    for (const field of requiredFields) {
      if (!(field in item)) errors.push(`${listName}[${index}] missing ${field}`);
    }
    if (seen.has(item.id)) errors.push(`${listName}[${index}] duplicate id ${item.id}`);
    seen.add(item.id);
  }
}

const seenProposals = new Set();
for (const [index, item] of proposals.entries()) {
  for (const field of ["id", "platform", "type", "title", "summary", "status"]) {
    if (!(field in item)) errors.push(`proposals[${index}] missing ${field}`);
  }
  if (seenProposals.has(item.id)) errors.push(`proposals[${index}] duplicate id ${item.id}`);
  seenProposals.add(item.id);
  if (!VALID_PROPOSAL_STATUS.has(item.status))
    errors.push(`proposals[${index}] invalid status ${item.status}`);
}

const action = decisions.decision?.action || "";
if (!VALID_DECISION.has(action)) errors.push(`decision.action invalid: ${action}`);

if (!VALID_SNAPSHOT_STATUS.has(geoSnapshot.status)) {
  errors.push(`geo.status invalid: ${geoSnapshot.status}`);
}
for (const range of ["7d", "30d"]) {
  const window = geoSnapshot.windows?.[range];
  if (!window) {
    errors.push(`geo.windows.${range} missing`);
    continue;
  }
  if (!VALID_SNAPSHOT_STATUS.has(window.status)) {
    errors.push(`geo.windows.${range}.status invalid: ${window.status}`);
  }
  if (!window.overview) errors.push(`geo.windows.${range}.overview missing`);
  if (!Array.isArray(window.trend)) errors.push(`geo.windows.${range}.trend must be an array`);
  if (!Array.isArray(window.prompts)) errors.push(`geo.windows.${range}.prompts must be an array`);
  if (!Array.isArray(window.blind_spots)) {
    errors.push(`geo.windows.${range}.blind_spots must be an array`);
  }
}

console.log(
  JSON.stringify(
    {
      batch_id: batch.batch_id,
      counts: computeCountsFromProposals(batch, proposals, decisions),
      platform_status: Object.fromEntries(
        Object.entries(snapshot.platforms || {}).map(([key, value]) => [key, value.status]),
      ),
      geo_status: geoSnapshot.status,
      proposals: proposals.length,
      decision_action: action || "none",
      errors,
    },
    null,
    2,
  ),
);
process.exitCode = errors.length ? 1 : 0;
