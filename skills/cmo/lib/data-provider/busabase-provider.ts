// Busabase-backed data provider for the CMO console.
//
// Backs the CMO *review model* (proposals / decisions / agent tasks) with a
// Busabase instance — either a local `busabase server` (:15419, open, no key) or
// Busabase Cloud (busabase.com, API key). Everything that is NOT a review item —
// the marketing dashboard, the platform snapshot, config, lock, onboarding —
// delegates to a LocalFileProvider, so the console keeps working unchanged.
//
// CMO proposals map onto Busabase Change Requests; the same review vocabulary is
// preserved end to end:
//   approve         → changeRequests.review({ verdict: "approved" })  (+ merge)
//   request_changes → changeRequests.review({ verdict: "rejected" })  → changes_requested
//   block           → changeRequests.close()                           → rejected (terminal)
//   revise          → operations.revise({ operationId, fields })
//
// The SDK + its transport deps load lazily so the base app runs without them
// unless CMO_DATA_PROVIDER=busabase. Erasable-TS only (Node ≥23.6 native strip).

import path from "node:path";
import { pathToFileURL } from "node:url";
import { utcNow } from "../common.mjs";
import { ROOT_DIR } from "../paths.mjs";
import { LocalFileProvider } from "./local-file-provider.ts";
import type { AgentTasks, CmoDataProvider, ReviewInput } from "./provider-interface.ts";

const PROVIDER_NAME = "busabase";

// Load the SDK by absolute path off the repo root (the skill does not declare it,
// and this file's real path cannot resolve the bare specifier). Built dist first,
// then TS source, then bare specifier — so busabase mode works with zero build.
async function importSdk(): Promise<any> {
  const candidates = [
    path.join(ROOT_DIR, "apps/busabase-sdk/dist/index.js"),
    path.join(ROOT_DIR, "apps/busabase-sdk/src/index.ts"),
  ];
  for (const entry of candidates) {
    try {
      return await import(pathToFileURL(entry).href);
    } catch {
      // try the next candidate
    }
  }
  // The skill does not declare busabase-sdk, so this bare specifier only resolves
  // in hosts that bundle it; the absolute paths above are the real path.
  // @ts-expect-error optional bare specifier — no local type declarations
  return import("busabase-sdk");
}

let clientPromise: Promise<any> | null = null;
async function getClient(): Promise<any> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { Busabase } = await importSdk();
      return new Busabase({
        baseUrl: process.env.BUSABASE_BASE_URL || "http://localhost:15419",
        apiKey: process.env.BUSABASE_API_KEY,
        spaceId: process.env.BUSABASE_SPACE_ID,
      });
    })().catch((error) => {
      clientPromise = null; // allow retry after a transient/config failure
      throw error;
    });
  }
  return clientPromise;
}

// Restrict proposals to a single "CMO proposals" base; unset = all CRs in the space.
const proposalBaseId = (): string => process.env.BUSABASE_CMO_BASE_ID || "";

// Canonical Busabase CR status -> legacy proposal status the React UI reads.
const CR_STATUS_TO_FRONTEND: Record<string, string> = {
  in_review: "draft",
  changes_requested: "draft",
  approved: "approved",
  merged: "done",
  rejected: "blocked",
  abandoned: "blocked",
  conflict: "blocked",
};

const str = (value: unknown): string => (value == null ? "" : String(value));

function crToProposal(cr: any): Record<string, unknown> {
  const op = cr.primaryOperation || cr.operations?.[0] || {};
  const fields = op.headCommit?.fields || {};
  const lastReview = Array.isArray(cr.reviews) && cr.reviews.length ? cr.reviews.at(-1) : null;
  return {
    id: cr.id,
    source: "busabase",
    cr_status: cr.status,
    status: CR_STATUS_TO_FRONTEND[cr.status] || "draft",
    platform: str(fields.platform),
    type: "change_request",
    title: str(fields.title || fields.name || cr.id),
    summary: str(fields.summary || fields.reason),
    account: str(fields.account),
    budget: fields.budget != null ? str(fields.budget) : "",
    risk: str(fields.risk),
    next_step: str(fields.next_step),
    operation_id: str(op.id),
    base_id: str(cr.baseId),
    official_url: str(cr.url),
    decision: lastReview
      ? {
          action: lastReview.verdict === "approved" ? "approve" : "request_changes",
          comment: str(lastReview.reason),
          decided_at: str(cr.reviewedAt),
        }
      : undefined,
    updated_at: str(cr.updatedAt || cr.createdAt),
  };
}

function countProposals(proposals: Array<Record<string, unknown>>) {
  const by = (status: string) => proposals.filter((p) => p.status === status).length;
  return {
    needs_review: by("draft"),
    blocked: by("blocked"),
    drafts: by("draft"),
    running: 0,
    approved: by("approved"),
    done: by("done"),
  };
}

async function listProposals(bb: any): Promise<Array<Record<string, unknown>>> {
  const crs = await bb.changeRequests.list({ limit: 100 });
  const wantedBase = proposalBaseId();
  const filtered = wantedBase ? crs.filter((cr: any) => cr.baseId === wantedBase) : crs;
  return filtered.map(crToProposal);
}

export class BusabaseProvider implements CmoDataProvider {
  readonly name = PROVIDER_NAME;
  // Non-review surfaces are served from local files.
  #local = new LocalFileProvider();

  // ── read ───────────────────────────────────────────────────────────────────
  async getState(): Promise<Record<string, unknown>> {
    const base = await this.#local.getState();
    try {
      const bb = await getClient();
      const [proposals, tasks] = await Promise.all([listProposals(bb), bb.agent.listTasks()]);
      return {
        ...base,
        data_provider: this.name,
        batch: { ...(base.batch as Record<string, unknown>), proposals },
        counts: countProposals(proposals),
        agent_tasks: { count: tasks.length, updated_at: utcNow() },
      };
    } catch (error: any) {
      return { ...base, data_provider: this.name, provider_error: error.message };
    }
  }

  async getAgentTasks(): Promise<AgentTasks> {
    const bb = await getClient();
    const tasks = await bb.agent.listTasks();
    return {
      updated_at: utcNow(),
      tasks: tasks.map((task: any) => ({
        id: task.changeRequest?.id,
        title: crToProposal(task.changeRequest || {}).title,
        reason: task.trigger,
        comment: str(task.reviewReason),
        mentions_ai: task.trigger === "ai_mention",
        ai_comments: Array.isArray(task.aiComments) ? task.aiComments.length : 0,
        queued_at: utcNow(),
      })),
    };
  }

  async getConfigSummary(): Promise<Record<string, unknown>> {
    const summary = await this.#local.getConfigSummary();
    return { ...summary, data_provider: this.name };
  }

  // Marketing / lock / onboarding are not review items — delegate to local.
  getMarketing(view: string, input: unknown): Promise<unknown> {
    return this.#local.getMarketing(view, input);
  }
  getGeo(input: unknown): Promise<unknown> {
    return this.#local.getGeo(input);
  }
  getLock(): Promise<Record<string, unknown>> {
    return this.#local.getLock();
  }
  getOnboarding(): Promise<Record<string, unknown>> {
    return this.#local.getOnboarding();
  }
  completeOnboarding(marker?: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.#local.completeOnboarding(marker);
  }

  // ── write ────────────────────────────────────────────────────────────────────
  async submitReviewDecision(review: ReviewInput): Promise<Record<string, unknown>> {
    const bb = await getClient();
    const changeRequestId = str(review.id);
    const action = str(review.action);
    const reason = str(review.comment);
    if (!changeRequestId) {
      const error: any = new Error("A change request id is required.");
      error.statusCode = 400;
      throw error;
    }
    try {
      switch (action) {
        case "approve": {
          await bb.changeRequests.review({ changeRequestId, verdict: "approved" });
          if (review.merge) await bb.changeRequests.merge({ changeRequestId });
          break;
        }
        case "request_changes": {
          // A "rejected" verdict is NOT terminal in Busabase — it moves the CR to
          // `changes_requested` and re-queues it for the agent.
          await bb.changeRequests.review({ changeRequestId, verdict: "rejected", reason });
          break;
        }
        case "block": {
          await bb.changeRequests.close({ changeRequestId, reason });
          break;
        }
        case "revise": {
          const operationId = str(review.operation_id);
          if (!operationId) {
            const error: any = new Error("revise requires operation_id.");
            error.statusCode = 400;
            throw error;
          }
          await bb.operations.revise({
            operationId,
            fields: review.fields || {},
            message: reason || "Revise from CMO",
          });
          break;
        }
        default: {
          const error: any = new Error(`Unknown review action: ${action}`);
          error.statusCode = 400;
          throw error;
        }
      }
    } catch (error: any) {
      if (!error.statusCode) error.statusCode = 502;
      throw error;
    }
    return { ok: true };
  }

  // Draft a new proposal as a Busabase Change Request against the CMO proposals
  // base. Used by the skill's proposal-generation step in busabase mode.
  async createProposal(
    fields: Record<string, unknown>,
    options: Record<string, any> = {},
  ): Promise<unknown> {
    const bb = await getClient();
    const baseId = str(options.baseId || proposalBaseId());
    if (!baseId) {
      throw new Error(
        "createProposal requires a base id (BUSABASE_CMO_BASE_ID or options.baseId).",
      );
    }
    return bb.bases.createChangeRequest({
      baseId,
      fields,
      message: options.message || "CMO proposal",
      submittedBy: options.submittedBy || "cmo",
    });
  }

  // Verify connectivity + resolve the acting user/space. `/api/v1/auth` works on
  // both local OSS (open) and cloud (keyed); a bare CR listing is the fallback.
  async verifyConnection(): Promise<Record<string, unknown>> {
    const bb = await getClient();
    let auth: any = null;
    let reachable = false;
    try {
      auth = await bb.client.auth.verify({});
      reachable = true;
    } catch {
      try {
        await bb.changeRequests.list({ limit: 1 });
        reachable = true;
      } catch {
        // leave reachable = false
      }
    }
    return {
      base_url: bb.config?.baseUrl,
      has_api_key: Boolean(bb.config?.apiKey),
      healthy: reachable,
      user: auth?.user ?? null,
      space: auth?.space ?? null,
      spaces: auth?.spaces ?? [],
    };
  }
}

/** Singleton used by the provider registry. */
export const busabaseProvider = new BusabaseProvider();
