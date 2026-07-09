// Local file-backed data provider for the CMO console.
//
// The default implementation of CmoDataProvider. Reads/writes the App-in-Skill
// handoff files under app/.data and reaches the marketing dashboard behind
// lib/marketing.mjs. The Hono app depends only on the interface, so a future
// `postgres` / `busabase` / Cloudflare provider can replace it without touching
// the server or the frontend.
//
// Erasable-TS only (Node ≥23.6 native strip; no build).

import fs from "node:fs/promises";
import {
  defaultBatch,
  defaultPlatformSnapshot,
  loadAgentTasks,
  loadGeoSnapshot,
  loadOnboarding,
  pathExists,
  readJson,
  saveOnboarding,
  syncAgentTasks,
  toFrontendStatus,
  utcNow,
  verdictToState,
  writeJson,
} from "../common.mjs";
import { marketingPayload } from "../marketing.mjs";
import {
  CONFIG_EXAMPLE_PATH,
  CONFIG_LOCAL_PATH,
  CURRENT_BATCH_PATH,
  DATA_DIR,
  DECISIONS_PATH,
  EXECUTION_REPORT_PATH,
  LOCK_PATH,
  PLATFORM_SNAPSHOT_PATH,
} from "../paths.mjs";
import type { AgentTasks, CmoDataProvider, ReviewInput } from "./provider-interface.ts";

const PROVIDER_NAME = "local";

const configSummary = async (): Promise<Record<string, unknown>> => {
  const hasLocal = await pathExists(CONFIG_LOCAL_PATH);
  const config = await readJson(hasLocal ? CONFIG_LOCAL_PATH : CONFIG_EXAMPLE_PATH, {});
  const accounts = Array.isArray(config.accounts) ? config.accounts : [];
  const platforms = [
    {
      id: "google",
      name: "Google Ads",
      mode: "execution scripts",
      capabilities: ["SEM Search create/dry-run/pause", "YouTube video create/dry-run/pause"],
      write_risk: "Can create or pause real Google Ads campaigns after confirmation",
    },
    {
      id: "reddit",
      name: "Reddit Ads",
      mode: "platform sync",
      capabilities: [
        "Read-only sync",
        "Proposal diffs",
        "Preflight evidence",
        "Paused platform writes",
      ],
      write_risk: "No live API execution in the app",
    },
  ];
  return {
    provider: "platform",
    data_provider: PROVIDER_NAME,
    config_source: hasLocal ? CONFIG_LOCAL_PATH : CONFIG_EXAMPLE_PATH,
    using_example: !hasLocal,
    brand: config.brand?.name ?? "CMO workspace",
    homepage: config.brand?.homepage ?? "",
    positioning: config.brand?.positioning ?? "",
    accounts,
    platforms,
    api_docs: config.reddit_ads?.official_api_docs ?? "https://ads-api.reddit.com/docs/v3/",
    postman_workspace: config.reddit_ads?.official_postman_workspace ?? "",
    default_launch_status: config.reddit_ads?.default_launch_status ?? "paused",
  };
};

const lockPayload = async (): Promise<Record<string, unknown>> => {
  if (!(await pathExists(LOCK_PATH))) return { locked: false };
  const raw = await readJson(LOCK_PATH, {});
  return {
    locked: true,
    path: LOCK_PATH,
    owner: raw.owner ?? "cmo",
    message: raw.message ?? "$cmo is writing local app files.",
    started_at: raw.started_at ?? "",
  };
};

const countsFrom = (proposals: Array<Record<string, unknown>>) => ({
  needs_review: proposals.filter((item) => item.status === "draft").length,
  blocked: proposals.filter((item) => item.status === "blocked").length,
  drafts: proposals.filter((item) => item.status === "draft").length,
  running: proposals.filter((item) => item.status === "running").length,
  approved: proposals.filter((item) => item.status === "approved").length,
});

const platformSnapshotProposals = (snapshot: Record<string, any>, summary: Record<string, any>) => {
  const platforms = snapshot.platforms ?? {};
  const accounts = Array.isArray(summary.accounts) ? summary.accounts : [];
  return Object.entries(platforms).flatMap(([platformId, platform]: [string, any]) => {
    if (platform.status === "synced") return [];
    const account = accounts.find((item: any) => item.platform === platformId) ?? {};
    const blockers = Array.isArray(platform.blockers) ? platform.blockers : [];
    return [
      {
        id: `${platformId}-sync-required`,
        platform: platformId,
        type: "platform_snapshot",
        title: `Sync ${platformId === "google" ? "Google Ads" : "Reddit Ads"} platform data`,
        summary: blockers.length
          ? blockers.join("; ")
          : "CMO needs a read-only platform snapshot before drafting campaign changes.",
        status: account.status === "needs_config" ? "blocked" : "draft",
        account: account.display_name ?? platform.account_name ?? "",
        budget: "read-only",
        risk: "read-only account access; no writes",
        next_step:
          account.status === "needs_config"
            ? "Configure account credentials/env first."
            : "Run platform sync, then draft proposals from synced account state.",
        evidence: ["platform API", "read-only sync"],
        updated_at: platform.synced_at ?? snapshot.updated_at ?? utcNow(),
      },
    ];
  });
};

export class LocalFileProvider implements CmoDataProvider {
  readonly name = PROVIDER_NAME;

  async getState(): Promise<Record<string, unknown>> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const batch = await readJson(CURRENT_BATCH_PATH, defaultBatch());
    const decisions = await readJson(DECISIONS_PATH, {
      batch_id: batch.batch_id,
      updated_at: utcNow(),
      decision: {},
    });
    const summary = await configSummary();
    const snapshot = await readJson(PLATFORM_SNAPSHOT_PATH, defaultPlatformSnapshot());
    const storedProposals = Array.isArray(batch.proposals) ? batch.proposals : [];
    const proposals = [...storedProposals, ...platformSnapshotProposals(snapshot, summary)];
    const report = (await pathExists(EXECUTION_REPORT_PATH))
      ? await readJson(EXECUTION_REPORT_PATH, null)
      : null;
    const onboarding = await loadOnboarding();
    const agentTasks = await loadAgentTasks();
    return {
      skill: "cmo",
      data_provider: this.name,
      batch: { ...batch, proposals },
      decisions,
      counts: countsFrom(proposals),
      lock: await lockPayload(),
      config_summary: summary,
      platform_snapshot: snapshot,
      execution_report: report,
      onboarding: { completed: Boolean(onboarding.completed), ...onboarding },
      agent_tasks: { count: (agentTasks.tasks || []).length, updated_at: agentTasks.updated_at },
    };
  }

  getMarketing(view: string, input: unknown): Promise<unknown> {
    return marketingPayload(view, input);
  }

  async getGeo(input: unknown): Promise<unknown> {
    const params = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const timeRange = params.timeRange === "7d" ? "7d" : "30d";
    const promptSearch = String(params.promptSearch ?? "")
      .trim()
      .toLowerCase();
    const promptId = String(params.promptId ?? "");
    const snapshot = await loadGeoSnapshot();
    const window = snapshot.windows?.[timeRange] ?? snapshot.windows?.["30d"];
    const prompts = Array.isArray(window?.prompts) ? window.prompts : [];
    const filteredPrompts = promptSearch
      ? prompts.filter((item: any) =>
          [item.text, item.topic, item.platform]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(promptSearch),
        )
      : prompts;
    const selectedPromptId = promptId || String(filteredPrompts[0]?.id ?? "");
    return {
      ...snapshot,
      selected_time_range: timeRange,
      window: {
        ...window,
        prompts: filteredPrompts,
        selected_prompt_id: selectedPromptId,
        selected_citation_sources:
          window?.citation_sources_by_prompt?.[selectedPromptId] ??
          window?.citation_sources_by_prompt?.[String(prompts[0]?.id ?? "")] ??
          [],
      },
    };
  }

  getConfigSummary(): Promise<Record<string, unknown>> {
    return configSummary();
  }

  getLock(): Promise<Record<string, unknown>> {
    return lockPayload();
  }

  getOnboarding(): Promise<Record<string, unknown>> {
    return loadOnboarding();
  }

  completeOnboarding(marker: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return saveOnboarding({ completed: true, ...marker });
  }

  getAgentTasks(): Promise<AgentTasks> {
    return loadAgentTasks();
  }

  // Record a human verdict on a proposal. Writes the legacy frontend status onto
  // the batch (so the current UI keeps working) while persisting the canonical
  // review state + verdict into decisions and refreshing the agent task queue.
  async submitReviewDecision(review: ReviewInput): Promise<Record<string, unknown>> {
    const lock = await lockPayload();
    if (lock.locked) {
      const error: any = new Error(String(lock.message));
      error.statusCode = 423;
      throw error;
    }
    const proposalId = String(review.id ?? "");
    const action = String(review.action ?? "");
    const batch = await readJson(CURRENT_BATCH_PATH, defaultBatch());
    const proposals = Array.isArray(batch.proposals) ? [...batch.proposals] : [];
    const proposal = proposals.find((item: any) => item.id === proposalId);
    if (!proposal) {
      const error: any = new Error("Only persisted proposal diffs can be reviewed.");
      error.statusCode = 400;
      throw error;
    }
    const reviewState = verdictToState(action);
    proposal.review_state = reviewState;
    proposal.status = toFrontendStatus(reviewState);
    proposal.decision = { action, comment: review.comment ?? "", decided_at: utcNow() };
    proposal.updated_at = utcNow();
    const updatedBatch = { ...batch, proposals, updated_at: utcNow() };

    const decisions = await readJson(DECISIONS_PATH, {
      batch_id: batch.batch_id,
      updated_at: utcNow(),
      reviews: {},
    });
    const reviews = { ...(decisions.reviews ?? {}) };
    reviews[proposalId] = {
      id: proposalId,
      action,
      review_state: reviewState,
      comment: review.comment ?? "",
      decided_at: utcNow(),
    };
    const updatedDecisions = {
      ...decisions,
      batch_id: batch.batch_id,
      updated_at: utcNow(),
      reviews,
    };
    await writeJson(CURRENT_BATCH_PATH, updatedBatch);
    await writeJson(DECISIONS_PATH, updatedDecisions);
    await syncAgentTasks(updatedBatch, updatedDecisions);
    return { ok: true, decisions: updatedDecisions };
  }
}

/** Singleton used by the provider registry. */
export const localFileProvider = new LocalFileProvider();
