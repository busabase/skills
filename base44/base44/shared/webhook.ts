import { hashContent, stableStringify } from "./hash.ts";
import { verifyBusabaseSignature } from "./signature.ts";
import { findState, isNotFound, mapFields, saveState } from "./sync.ts";
import type { JsonObject, SyncDeps } from "./types.ts";

export interface WebhookResult {
  status: number;
  body: JsonObject;
}

const ignored = (reason: string): WebhookResult => ({
  status: 200,
  body: { ok: true, ignored: reason },
});

/**
 * Busabase `record.updated` / `record.created` -> Base44 entity update.
 *
 * Only fields listed in the mapping's `writeBack` are ever written, and only when the value really
 * differs, so the write is idempotent (Busabase retries non-2xx, and the signature scheme has no
 * timestamp, so replays are possible). Records Busabase created itself (no Base44 id) are not
 * created in Base44: this is update write-back only.
 *
 * Loop guard: the entity update below fires the `sync-to-busabase` workflow. The new content hash
 * is stored on the state row BEFORE the entity is touched, so that run sees "unchanged" and stops.
 */
export const handleBusabaseWebhook = async (
  deps: SyncDeps,
  input: { rawBody: string; signature: string | null; secret: string | undefined },
): Promise<WebhookResult> => {
  if (!input.secret) {
    // Fail closed: an unset secret must never mean "accept everything".
    return { status: 500, body: { ok: false, error: "BUSABASE_WEBHOOK_SECRET is not configured" } };
  }
  if (!(await verifyBusabaseSignature(input.rawBody, input.signature, input.secret))) {
    return { status: 401, body: { ok: false, error: "invalid signature" } };
  }

  let payload: JsonObject;
  try {
    payload = JSON.parse(input.rawBody) as JsonObject;
  } catch {
    return { status: 400, body: { ok: false, error: "body is not JSON" } };
  }

  const event = payload.event;
  if (event !== "record.updated" && event !== "record.created")
    return ignored(`event ${String(event)}`);

  const mapping = deps.mappings.find((m) => m.base === payload.baseId);
  if (!mapping) return ignored("no mapping for this Base");
  if (!mapping.writeBack?.length) return ignored("mapping is one-way");

  const fields = (payload.fields ?? {}) as JsonObject;
  const entityId = fields[mapping.sourceIdField];
  if (typeof entityId !== "string" || !entityId)
    return ignored("record has no Base44 id (not created by Base44)");

  const handler = deps.entities[mapping.entity];
  if (!handler)
    return { status: 500, body: { ok: false, error: `entity ${mapping.entity} does not exist` } };

  let current: JsonObject;
  try {
    current = await handler.get(entityId);
  } catch (error) {
    if (isNotFound(error)) return ignored("Base44 record no longer exists");
    throw error;
  }

  const patch: JsonObject = {};
  for (const b44Field of mapping.writeBack) {
    const slug = mapping.fields[b44Field];
    if (!slug || !(slug in fields)) continue;
    if (stableStringify(current[b44Field] ?? null) !== stableStringify(fields[slug] ?? null)) {
      patch[b44Field] = fields[slug];
    }
  }
  if (Object.keys(patch).length === 0) return ignored("already in sync");

  const nextHash = await hashContent(mapFields({ ...current, ...patch }, mapping));
  const state = await findState(deps, mapping.entity, entityId);
  await saveState(deps, state, mapping.entity, entityId, {
    content_hash: nextHash,
    busabase_record_id:
      typeof payload.recordId === "string" ? payload.recordId : (state?.busabase_record_id ?? null),
    status: "synced",
    direction: "from_busabase",
    attempts: 0,
    last_error: null,
  });
  await handler.update(entityId, patch);
  deps.log.info("webhook.applied", {
    entity: mapping.entity,
    id: entityId,
    changed: Object.keys(patch),
    changeRequest: typeof payload.changeRequestId === "string" ? payload.changeRequestId : null,
  });
  return { status: 200, body: { ok: true, applied: Object.keys(patch) } };
};
