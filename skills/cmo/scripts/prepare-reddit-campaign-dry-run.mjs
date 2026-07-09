#!/usr/bin/env node
import path from "node:path";
import { loadBatch, loadConfigSummary, utcNow, writeJson } from "../lib/common.mjs";
import {
  redditAdGroupName,
  redditAdName,
  redditCampaignName,
  redditPostName,
} from "../lib/naming.mjs";
import { DATA_DIR, EXECUTION_REPORT_PATH } from "../lib/paths.mjs";

function slugify(value) {
  return (
    String(value || "reddit-campaign")
      .toLowerCase()
      .replace(/https?:\/\//g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "reddit-campaign"
  );
}

function parseArgs(argv) {
  const args = { proposalId: "", dryRun: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--proposal-id") args.proposalId = argv[++index] || "";
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--execute") args.dryRun = false;
  }
  return args;
}

function requireDryRun(args) {
  if (!args.dryRun) {
    throw new Error("Refusing live Reddit write. This script only prepares dry-run payloads.");
  }
}

function proposalAccountConfig(proposal, config) {
  const accounts = config.accounts || [];
  return (
    accounts.find(
      (account) =>
        account.platform === "reddit" &&
        (account.display_name === proposal.account ||
          account.account_name === proposal.account ||
          account.key === proposal.account ||
          account.account_id === proposal.account),
    ) ||
    accounts.find((account) => account.platform === "reddit") ||
    {}
  );
}

function normalizeBudget(proposal) {
  return {
    source_text: proposal.budget || "",
    daily_budget_amount: 20,
    currency: "USD",
    duration_days: 7,
    split: "even_across_ad_groups",
  };
}

function campaignPayload(proposal, account) {
  const structure = proposal.proposed_structure || {};
  return {
    dry_run: true,
    platform: "reddit",
    operation: "create_campaign",
    account_id: account.account_id || "",
    account_key: account.key || "",
    name: structure.campaign_name || redditCampaignName(proposal),
    objective: proposal.objective || "traffic",
    configured_status: proposal.launch_status || "paused",
    destination_url: proposal.destination_url || "",
    budget: normalizeBudget(proposal),
    notes: {
      source_proposal_id: proposal.id,
      risk: proposal.risk || "",
      write_gate: "No Reddit API write is executed by this dry-run script.",
    },
  };
}

function adGroupPayloads(proposal, account) {
  const budget = normalizeBudget(proposal);
  const groups = proposal.proposed_structure?.ad_groups || [];
  const perGroupBudget = groups.length
    ? Number((budget.daily_budget_amount / groups.length).toFixed(2))
    : budget.daily_budget_amount;
  return groups.map((group, index) => ({
    dry_run: true,
    platform: "reddit",
    operation: "create_ad_group",
    account_id: account.account_id || "",
    campaign_ref: "campaign:01_campaign",
    local_ref: `ad_group:${index + 1}`,
    name: group.name || redditAdGroupName(group, proposal, index),
    configured_status: proposal.launch_status || "paused",
    bid_strategy: "lowest_cost",
    daily_budget_amount: perGroupBudget,
    currency: budget.currency,
    targeting: {
      community_candidates: group.community_candidates || [],
      intent: group.intent || "",
      exclusions: group.exclusions || [],
      validation_required: true,
    },
  }));
}

function postPayloads(proposal, account) {
  const angles = proposal.proposed_structure?.creative_angles || [];
  return angles.map((angle, index) => ({
    dry_run: true,
    platform: "reddit",
    operation: "create_post_or_creative",
    account_id: account.account_id || "",
    local_ref: `post:${index + 1}`,
    name: angle.name || redditPostName(angle, index),
    headline: angle.headline || "",
    body: angle.body || "",
    call_to_action: angle.cta || "Learn More",
    destination_url: proposal.destination_url || "",
    policy_notes: [
      "Avoid implying affiliation with named AI tools or vendors.",
      "Preview in Reddit Ads before enabling spend.",
    ],
  }));
}

function adPayloads(proposal, account, adGroups, posts) {
  const ads = [];
  const groups = proposal.proposed_structure?.ad_groups || [];
  const angles = proposal.proposed_structure?.creative_angles || [];
  for (const [groupIndex, group] of adGroups.entries()) {
    for (const [postIndex, post] of posts.entries()) {
      ads.push({
        dry_run: true,
        platform: "reddit",
        operation: "create_ad",
        account_id: account.account_id || "",
        campaign_ref: "campaign:01_campaign",
        ad_group_ref: group.local_ref,
        post_ref: post.local_ref,
        name: redditAdName(
          groups[groupIndex] || group,
          angles[postIndex] || post,
          proposal,
          groupIndex,
          postIndex,
        ),
        configured_status: proposal.launch_status || "paused",
        destination_url: proposal.destination_url || "",
      });
    }
  }
  return ads;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  requireDryRun(args);
  const batch = await loadBatch();
  const config = await loadConfigSummary();
  const proposal = (batch.proposals || []).find(
    (item) =>
      item.platform === "reddit" &&
      item.type === "campaign_create" &&
      (!args.proposalId || item.id === args.proposalId),
  );
  if (!proposal) throw new Error("No Reddit campaign_create proposal found.");
  if (["blocked", "done"].includes(proposal.status)) {
    throw new Error(
      `Proposal ${proposal.id} is ${proposal.status}; choose a draft proposal for dry-run payload generation.`,
    );
  }
  const account = proposalAccountConfig(proposal, config);
  if (!account.account_id) throw new Error("No configured Reddit Ads account_id found.");

  const now = utcNow();
  const runSlug = `${slugify(proposal.id)}-${now.replace(/\D/g, "").slice(0, 14)}`;
  const outDir = path.join(DATA_DIR, "reddit_dry_runs", runSlug);
  const campaign = campaignPayload(proposal, account);
  const adGroups = adGroupPayloads(proposal, account);
  const posts = postPayloads(proposal, account);
  const ads = adPayloads(proposal, account, adGroups, posts);
  const manifest = {
    dry_run: true,
    generated_at: now,
    proposal_id: proposal.id,
    proposal_title: proposal.title,
    account: {
      key: account.key || "",
      display_name: account.display_name || proposal.account || "",
      account_id: account.account_id || "",
    },
    destination_url: proposal.destination_url || "",
    launch_status: proposal.launch_status || "paused",
    planned_operations: {
      campaigns: 1,
      ad_groups: adGroups.length,
      posts: posts.length,
      ads: ads.length,
    },
    blockers_before_write: [
      "Verify Reddit API v3 create endpoint field names against official docs.",
      "Validate community targeting availability in the Ads account.",
      "Confirm billing/account review readiness.",
      "Get separate explicit confirmation before any platform write.",
    ],
    files: {
      campaign: "01_campaign.dry-run.json",
      ad_groups: "02_ad_groups.dry-run.json",
      posts: "03_posts.dry-run.json",
      ads: "04_ads.dry-run.json",
    },
  };

  await writeJson(path.join(outDir, manifest.files.campaign), campaign);
  await writeJson(path.join(outDir, manifest.files.ad_groups), adGroups);
  await writeJson(path.join(outDir, manifest.files.posts), posts);
  await writeJson(path.join(outDir, manifest.files.ads), ads);
  await writeJson(path.join(outDir, "execution_manifest.json"), manifest);

  const report = {
    type: "reddit_campaign_dry_run",
    status: "dry_run_ready",
    generated_at: now,
    updated_at: now,
    proposal_id: proposal.id,
    account_id: account.account_id || "",
    output_dir: outDir,
    manifest,
    summary: `Prepared Reddit dry-run config: 1 campaign, ${adGroups.length} ad groups, ${posts.length} posts, ${ads.length} ads. No platform write executed.`,
  };
  await writeJson(EXECUTION_REPORT_PATH, report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
