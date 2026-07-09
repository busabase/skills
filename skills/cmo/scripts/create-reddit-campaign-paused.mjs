#!/usr/bin/env node
import path from "node:path";
import { loadBatch, loadConfigSummary, utcNow, writeJson } from "../lib/common.mjs";
import { redditAdGroupName, redditAdName, redditCampaignName } from "../lib/naming.mjs";
import { DATA_DIR, EXECUTION_REPORT_PATH } from "../lib/paths.mjs";
import { getRedditAccessToken } from "../lib/reddit-ads-client.mjs";

const API_BASE = "https://ads-api.reddit.com/api/v3";

function parseArgs(argv) {
  const args = {
    proposalId: "",
    confirmPausedCreate: false,
    profileId: "",
    campaignId: "",
    adGroupIds: [],
    postIds: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--proposal-id") args.proposalId = argv[++index] || "";
    else if (arg === "--profile-id") args.profileId = argv[++index] || "";
    else if (arg === "--campaign-id") args.campaignId = argv[++index] || "";
    else if (arg === "--ad-group-ids")
      args.adGroupIds = String(argv[++index] || "")
        .split(",")
        .filter(Boolean);
    else if (arg === "--post-ids")
      args.postIds = String(argv[++index] || "")
        .split(",")
        .filter(Boolean);
    else if (arg === "--confirm-paused-create") args.confirmPausedCreate = true;
  }
  return args;
}

function slugify(value) {
  return (
    String(value || "reddit-create")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "reddit-create"
  );
}

function microDollars(dollars) {
  return Math.round(Number(dollars || 0) * 1_000_000);
}

function redditDateTime(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function cta(value) {
  const map = {
    "Explore Buda": "Learn More",
    "See the workflow": "Learn More",
    "Try Buda": "Learn More",
  };
  return map[value] || "Learn More";
}

function proposalAccountConfig(proposal, config) {
  return (
    (config.accounts || []).find(
      (account) =>
        account.platform === "reddit" &&
        (account.display_name === proposal.account ||
          account.account_name === proposal.account ||
          account.key === proposal.account ||
          account.account_id === proposal.account),
    ) ||
    (config.accounts || []).find((account) => account.platform === "reddit") ||
    {}
  );
}

async function redditRequest(token, method, endpoint, body, outDir, label) {
  const url = `${API_BASE}${endpoint}`;
  const requestRecord = { method, url, body };
  await writeJson(path.join(outDir, "requests", `${label}.request.json`), requestRecord);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ads-skill/0.1 by BudaAI",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  const responseRecord = {
    ok: response.ok,
    status: response.status,
    status_text: response.statusText,
    body: json,
  };
  await writeJson(path.join(outDir, "responses", `${label}.response.json`), responseRecord);
  if (!response.ok) {
    const error = new Error(
      `Reddit API ${method} ${endpoint} failed: ${response.status} ${response.statusText}`,
    );
    error.response = responseRecord;
    throw error;
  }
  return json;
}

async function listProfiles(token, accountId, outDir) {
  const response = await redditRequest(
    token,
    "GET",
    `/ad_accounts/${encodeURIComponent(accountId)}/profiles`,
    null,
    outDir,
    "00_profiles",
  );
  return response.data || [];
}

function responseId(response) {
  return response?.data?.id || response?.id || "";
}

function campaignBody(proposal) {
  const structure = proposal.proposed_structure || {};
  return {
    data: {
      name: structure.campaign_name || redditCampaignName(proposal),
      configured_status: "PAUSED",
      objective: "CLICKS",
      is_campaign_budget_optimization: false,
      special_ad_categories: ["NONE"],
    },
  };
}

function adGroupBodies(proposal, campaignId) {
  const groups = proposal.proposed_structure?.ad_groups || [];
  const start = redditDateTime(new Date(Date.now() + 10 * 60 * 1000));
  const end = redditDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  return groups.map((group, index) => ({
    local_ref: `ad_group_${index + 1}`,
    body: {
      data: {
        name: group.name || redditAdGroupName(group, proposal, index),
        campaign_id: campaignId,
        configured_status: "PAUSED",
        start_time: start,
        end_time: end,
        goal_type: "DAILY_SPEND",
        goal_value: microDollars(20 / Math.max(groups.length, 1)),
        bid_type: "CPC",
        bid_strategy: "BIDLESS",
        optimization_goal: "CLICKS",
        targeting: {
          communities: (group.community_candidates || []).map((item) =>
            String(item).replace(/^r\//i, ""),
          ),
          locations: ["FEED"],
          platforms: ["ALL"],
          languages: ["EN"],
          expand_targeting: false,
        },
      },
    },
  }));
}

function postBodies(proposal) {
  const angles = proposal.proposed_structure?.creative_angles || [];
  return angles.map((angle, index) => ({
    local_ref: `post_${index + 1}`,
    body: {
      data: {
        type: "TEXT",
        headline: angle.headline || angle.angle || `Buda ad ${index + 1}`,
        body: angle.body || "",
        allow_comments: true,
      },
    },
  }));
}

function adBodies(proposal, adGroups, posts) {
  const bodies = [];
  const groups = proposal.proposed_structure?.ad_groups || [];
  const angles = proposal.proposed_structure?.creative_angles || [];
  for (const [groupIndex, group] of adGroups.entries()) {
    for (const [postIndex, post] of posts.entries()) {
      bodies.push({
        local_ref: `ad_${bodies.length + 1}`,
        body: {
          data: {
            name: redditAdName(
              groups[groupIndex] || group,
              angles[postIndex] || post,
              proposal,
              groupIndex,
              postIndex,
            ),
            ad_group_id: group.id,
            configured_status: "PAUSED",
            type: "UNSPECIFIED",
            post_id: post.id,
          },
        },
      });
    }
  }
  return bodies;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.confirmPausedCreate) {
    throw new Error(
      "Refusing platform write. Pass --confirm-paused-create to create PAUSED Reddit resources.",
    );
  }
  const batch = await loadBatch();
  const config = await loadConfigSummary();
  const proposal = (batch.proposals || []).find(
    (item) =>
      item.platform === "reddit" &&
      item.type === "campaign_create" &&
      (!args.proposalId || item.id === args.proposalId),
  );
  if (!proposal) throw new Error("No Reddit campaign_create proposal found.");
  if (["blocked", "done"].includes(proposal.status))
    throw new Error(`Proposal is ${proposal.status}; choose an active local draft.`);
  const account = proposalAccountConfig(proposal, config);
  if (!account.account_id) throw new Error("Missing Reddit account_id.");

  const now = utcNow();
  const outDir = path.join(
    DATA_DIR,
    "reddit_writes",
    `${slugify(proposal.id)}-${now.replace(/\D/g, "").slice(0, 14)}`,
  );
  const token = await getRedditAccessToken();
  const profiles = await listProfiles(token, account.account_id, outDir);
  const profile = args.profileId
    ? profiles.find((item) => item.id === args.profileId)
    : profiles[0];
  if (!profile?.id) throw new Error("No Reddit profile available for post creation.");

  const created = { campaign: null, ad_groups: [], posts: [], ads: [] };
  const campaign = args.campaignId
    ? { data: { id: args.campaignId, configured_status: "PAUSED", resumed_existing: true } }
    : await redditRequest(
        token,
        "POST",
        `/ad_accounts/${encodeURIComponent(account.account_id)}/campaigns`,
        campaignBody(proposal),
        outDir,
        "01_campaign_create",
      );
  const campaignId = args.campaignId || responseId(campaign);
  if (!campaignId) throw new Error("Campaign created but no id returned.");
  created.campaign = { id: campaignId, response: campaign };

  const adGroupInputs = adGroupBodies(proposal, campaignId);
  if (args.adGroupIds.length) {
    created.ad_groups = args.adGroupIds.map((id, index) => ({
      id,
      name: adGroupInputs[index]?.body?.data?.name || `Ad group ${index + 1}`,
      response: { data: { id, resumed_existing: true } },
    }));
  } else {
    for (const [index, item] of adGroupInputs.entries()) {
      const response = await redditRequest(
        token,
        "POST",
        `/ad_accounts/${encodeURIComponent(account.account_id)}/ad_groups`,
        item.body,
        outDir,
        `02_ad_group_${index + 1}_create`,
      );
      created.ad_groups.push({ id: responseId(response), name: item.body.data.name, response });
    }
  }

  const postInputs = postBodies(proposal);
  if (args.postIds.length) {
    created.posts = args.postIds.map((id, index) => ({
      id,
      name: postInputs[index]?.body?.data?.headline || `Post ${index + 1}`,
      response: { data: { id, resumed_existing: true } },
    }));
  } else {
    for (const [index, item] of postInputs.entries()) {
      const response = await redditRequest(
        token,
        "POST",
        `/profiles/${encodeURIComponent(profile.id)}/posts`,
        item.body,
        outDir,
        `03_post_${index + 1}_create`,
      );
      created.posts.push({ id: responseId(response), name: item.body.data.headline, response });
    }
  }

  const adInputs = adBodies(proposal, created.ad_groups, created.posts);
  for (const [index, item] of adInputs.entries()) {
    const response = await redditRequest(
      token,
      "POST",
      `/ad_accounts/${encodeURIComponent(account.account_id)}/ads`,
      item.body,
      outDir,
      `04_ad_${index + 1}_create`,
    );
    created.ads.push({ id: responseId(response), name: item.body.data.name, response });
  }

  const report = {
    type: "reddit_campaign_platform_create",
    status: "created_paused",
    generated_at: now,
    updated_at: utcNow(),
    proposal_id: proposal.id,
    account_id: account.account_id,
    profile_id: profile.id,
    output_dir: outDir,
    created: {
      campaign_id: created.campaign.id,
      ad_group_ids: created.ad_groups.map((item) => item.id),
      post_ids: created.posts.map((item) => item.id),
      ad_ids: created.ads.map((item) => item.id),
    },
    summary: `Created PAUSED Reddit campaign ${created.campaign.id}: ${created.ad_groups.length} ad groups, ${created.posts.length} posts, ${created.ads.length} ads.`,
  };
  await writeJson(path.join(outDir, "execution_report.json"), report);
  await writeJson(EXECUTION_REPORT_PATH, report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  if (error.response) console.error(JSON.stringify(error.response, null, 2));
  process.exitCode = 1;
});
