import { BusabaseError } from "./busabase-client.ts";
import { hashContent, stableStringify } from "./hash.ts";
import { PLACEHOLDER_BASE } from "./mappings.ts";
import type {
  EntityHandler,
  EntityMapping,
  JsonObject,
  SyncDeps,
  SyncOutcome,
  SyncState,
  SyncStatus,
} from "./types.ts";

const STATE_ENTITY = "BusabaseSyncState";
/** After this many failed attempts the scheduled retry stops and leaves the row for a human. */
export const MAX_ATTEMPTS = 10;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export const findMapping = (mappings: EntityMapping[], entity: string): EntityMapping | undefined =>
  mappings.find((m) => m.entity === entity);

export const isNotFound = (error: unknown): boolean => {
  const e = error as { status?: number; message?: string } | null;
  return e?.status === 404 || /not found/i.test(e?.message ?? "");
};

const clip = (text: string, max = 500) => (text.length > max ? `${text.slice(0, max)}…` : text);

const handlerFor = (deps: SyncDeps, name: string): EntityHandler => {
  const handler = deps.entities[name];
  if (!handler) throw new ConfigError(`Base44 entity "${name}" does not exist in this app`);
  return handler;
};

/** Base44 record -> Busabase fields, using only the mapped fields. Missing fields are skipped. */
export const mapFields = (record: JsonObject, mapping: EntityMapping): JsonObject => {
  const out: JsonObject = {};
  for (const [b44Field, slug] of Object.entries(mapping.fields)) {
    if (record[b44Field] !== undefined) out[slug] = record[b44Field];
  }
  return out;
};

const withoutNulls = (fields: JsonObject): JsonObject =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));

/** True when every mapped field already has the same value in the Busabase record. */
const payloadMatches = (payload: JsonObject | undefined, fields: JsonObject): boolean =>
  !!payload &&
  Object.entries(fields).every(
    ([slug, v]) => stableStringify(payload[slug] ?? null) === stableStringify(v ?? null),
  );

export const findState = async (
  deps: SyncDeps,
  entity: string,
  entityId: string,
): Promise<SyncState | null> => {
  const page = await handlerFor(deps, STATE_ENTITY).filter(
    { entity, entity_id: entityId },
    { limit: 1 },
  );
  return (page.items[0] as SyncState | undefined) ?? null;
};

export const saveState = async (
  deps: SyncDeps,
  existing: SyncState | null,
  entity: string,
  entityId: string,
  patch: JsonObject,
): Promise<void> => {
  const handler = handlerFor(deps, STATE_ENTITY);
  const data = { ...patch, last_synced_at: (deps.now?.() ?? new Date()).toISOString() };
  if (existing) await handler.update(existing.id, data);
  else await handler.create({ entity, entity_id: entityId, ...data });
};

const assertConfigured = (mapping: EntityMapping) => {
  if (PLACEHOLDER_BASE.test(mapping.base)) {
    throw new ConfigError(`Mapping for ${mapping.entity} still has a placeholder Busabase Base id`);
  }
  if (Object.values(mapping.fields).includes(mapping.sourceIdField)) {
    // the id field is the dedupe key; a mapped field writing to it would overwrite the key
    throw new ConfigError(
      `sourceIdField "${mapping.sourceIdField}" must not also be a mapped field`,
    );
  }
};

/**
 * Push one Base44 record to Busabase. Safe to call any number of times for the same record:
 *  - unchanged content (hash equal to the last sync) -> no Busabase call at all;
 *  - the Busabase record is found by the stored link, else by the Base44 id field, else created
 *    with idempotencyKey `base44:<Entity>:<id>`, so a retry never makes a second record.
 * Failures are stored on the state row (status "failed") and returned, not thrown, so one bad
 * record neither fails the workflow run nor hides behind a stack trace.
 */
export const syncEntityRecord = async (
  deps: SyncDeps,
  input: { entity: string; entityId: string; eventType?: string },
): Promise<SyncOutcome> => {
  const mapping = findMapping(deps.mappings, input.entity);
  if (!mapping) return { status: "skipped", reason: `no mapping for entity "${input.entity}"` };
  if (input.eventType === "delete") {
    return { status: "skipped", reason: "deletes are not synced (Busabase keeps its own history)" };
  }
  assertConfigured(mapping);

  let record: JsonObject;
  try {
    record = await handlerFor(deps, mapping.entity).get(input.entityId);
  } catch (error) {
    if (isNotFound(error)) return { status: "skipped", reason: "record no longer exists" };
    throw error;
  }

  const fields = mapFields(record, mapping);
  const hash = await hashContent(fields);
  const state = await findState(deps, mapping.entity, input.entityId);
  if (state?.status === "synced" && state.content_hash === hash) {
    return { status: "unchanged", recordId: state.busabase_record_id ?? undefined };
  }

  const attempts = (state?.attempts ?? 0) + 1;
  const label = `${mapping.entity} ${input.entityId}`;
  try {
    let recordId = state?.busabase_record_id ?? undefined;
    let existingPayload: JsonObject | undefined;
    if (!recordId) {
      const found = await deps.busabase.findRecordBySource(
        mapping.base,
        mapping.sourceIdField,
        input.entityId,
      );
      recordId = found?.id;
      existingPayload = found?.headCommit?.payload;
    }

    let status: SyncStatus;
    let outcome: SyncOutcome["status"];
    if (!recordId) {
      const created = await deps.busabase.createRecord(
        mapping.base,
        { ...withoutNulls(fields), [mapping.sourceIdField]: input.entityId },
        {
          idempotencyKey: `base44:${mapping.entity}:${input.entityId}`,
          message: `Base44 ${label} created`,
        },
      );
      recordId = created.recordId;
      if (created.landed && !recordId) {
        recordId = (
          await deps.busabase.findRecordBySource(
            mapping.base,
            mapping.sourceIdField,
            input.entityId,
          )
        )?.id;
      }
      status = created.landed ? "synced" : "pending_review";
      outcome = created.landed ? "created" : "pending_review";
    } else if (existingPayload && payloadMatches(existingPayload, fields)) {
      // found by lookup and already identical (e.g. a pending create was merged by a reviewer)
      status = "synced";
      outcome = "unchanged";
    } else {
      const updated = await deps.busabase.updateRecord(recordId, fields, {
        message: `Base44 ${label} updated`,
      });
      status = updated.landed ? "synced" : "pending_review";
      outcome = updated.landed ? "updated" : "pending_review";
    }

    await saveState(deps, state, mapping.entity, input.entityId, {
      busabase_record_id: recordId ?? null,
      content_hash: hash,
      status,
      direction: "to_busabase",
      attempts: 0,
      last_error: null,
    });
    deps.log.info("sync.ok", {
      entity: mapping.entity,
      id: input.entityId,
      outcome,
      busabaseRecord: recordId ?? null,
    });
    return { status: outcome as "created" | "updated" | "unchanged" | "pending_review", recordId };
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    const message = clip(error instanceof Error ? error.message : String(error));
    const retryable = !(error instanceof BusabaseError) || error.retryable || error.status === 404;
    deps.log.error("sync.failed", {
      entity: mapping.entity,
      id: input.entityId,
      attempts,
      error: message,
    });
    await saveState(deps, state, mapping.entity, input.entityId, {
      status: "failed",
      // a stale link (record deleted in Busabase) is cleared so the next attempt looks it up again
      ...(error instanceof BusabaseError && error.status === 404
        ? { busabase_record_id: null }
        : {}),
      attempts: retryable ? attempts : MAX_ATTEMPTS,
      last_error: message,
    }).catch((saveError) => deps.log.error("sync.state_save_failed", { error: String(saveError) }));
    return { status: "failed", error: message, attempts };
  }
};

/** Scheduled catch-up: re-run every record whose last sync failed or is still waiting for review. */
export const retryFailed = async (deps: SyncDeps, options: { limit?: number } = {}) => {
  const page = await handlerFor(deps, STATE_ENTITY).filter(
    { status: { $in: ["failed", "pending_review"] }, attempts: { $lt: MAX_ATTEMPTS } },
    { limit: options.limit ?? 50 },
  );
  const results: Record<string, number> = {};
  for (const row of page.items as SyncState[]) {
    const outcome = await syncEntityRecord(deps, {
      entity: row.entity,
      entityId: row.entity_id,
      eventType: "update",
    });
    results[outcome.status] = (results[outcome.status] ?? 0) + 1;
  }
  return { scanned: page.items.length, results };
};

/**
 * Catch-up for writes that never fire entity workflows (bulkCreate, bulkUpdate, updateMany,
 * imports): re-check records updated recently. Records already in sync cost no Busabase call.
 */
export const reconcile = async (
  deps: SyncDeps,
  options: { entity?: string; sinceMinutes?: number; maxRecords?: number; budgetMs?: number } = {},
) => {
  const now = deps.now?.() ?? new Date();
  const since = new Date(now.getTime() - (options.sinceMinutes ?? 60) * 60_000).toISOString();
  const budgetMs = options.budgetMs ?? 150_000; // function limit is 5 minutes
  const maxRecords = options.maxRecords ?? 500;
  const started = Date.now();
  const results: Record<string, number> = {};
  let scanned = 0;
  let truncated = false;

  for (const mapping of deps.mappings) {
    if (options.entity && mapping.entity !== options.entity) continue;
    let cursor: string | undefined;
    do {
      const page = await handlerFor(deps, mapping.entity).filter(
        { updated_date: { $gte: since } },
        { limit: 100, cursor },
      );
      for (const item of page.items) {
        if (scanned >= maxRecords || Date.now() - started > budgetMs) {
          truncated = true;
          return { scanned, truncated, results };
        }
        scanned++;
        const outcome = await syncEntityRecord(deps, {
          entity: mapping.entity,
          entityId: String(item.id),
          eventType: "update",
        });
        results[outcome.status] = (results[outcome.status] ?? 0) + 1;
      }
      cursor = page.has_more ? (page.next_cursor ?? undefined) : undefined;
    } while (cursor);
  }
  return { scanned, truncated, results };
};
