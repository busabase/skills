import { asObject } from "./config.ts";
import { reconcile, retryFailed, syncEntityRecord } from "./sync.ts";
import type { JsonObject, SyncDeps } from "./types.ts";

export interface HandlerResult {
  status: number;
  body: JsonObject;
}

/**
 * The body a workflow step sends (its `args`):
 *   { entity: "Order", entity_id: "…", event_type: "create" | "update" | "delete" }   one record
 *   { mode: "retry" }                                                                   failed rows
 *   { mode: "reconcile", entity?: "Order", since_minutes?: 60 }                         bulk catch-up
 *
 * Shared by the backend function (Vite apps) and the server route (TanStack Start apps); each
 * adapter checks the caller is an admin before calling this.
 */
export const handleSyncRequest = async (
  deps: SyncDeps,
  rawArgs: unknown,
): Promise<HandlerResult> => {
  const args = asObject(rawArgs);

  if (args.mode === "retry")
    return { status: 200, body: { ok: true, ...(await retryFailed(deps)) } };
  if (args.mode === "reconcile") {
    const result = await reconcile(deps, {
      entity: typeof args.entity === "string" ? args.entity : undefined,
      sinceMinutes: typeof args.since_minutes === "number" ? args.since_minutes : undefined,
    });
    return { status: 200, body: { ok: true, ...result } };
  }

  const entity = typeof args.entity === "string" ? args.entity : "";
  const entityId = typeof args.entity_id === "string" ? args.entity_id : "";
  if (!entity || !entityId) {
    return {
      status: 400,
      body: {
        error: "expected { entity, entity_id } or { mode }",
        received_keys: Object.keys(args),
      },
    };
  }
  const outcome = await syncEntityRecord(deps, {
    entity,
    entityId,
    eventType: typeof args.event_type === "string" ? args.event_type : undefined,
  });
  // A failed sync is stored on its BusabaseSyncState row and retried by the schedule; the run
  // itself returns 200 so Base44 does not count a Busabase outage as repeated workflow failures.
  return { status: 200, body: { ok: outcome.status !== "failed", outcome } };
};
