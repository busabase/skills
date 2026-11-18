// Types shared by both backend functions. Nothing in base44/shared imports the
// Base44 runtime (`base44:runtime`, `npm:@base44/sdk`): the entry.ts files wire
// those in and pass them down, so everything here runs (and is tested) on Node.

/** One Base44 entity <-> one Busabase Base. Edit `shared/mappings.ts` to change it. */
export interface EntityMapping {
  /** Base44 entity name, exactly as `base44.entities.<Name>` spells it, e.g. "Order". */
  entity: string;
  /** Busabase Base id (`GET /api/v1/bases` lists them). */
  base: string;
  /** Slug of the Busabase text field that stores the Base44 record id. This is the dedupe key. */
  sourceIdField: string;
  /** Base44 field name -> Busabase field slug. Only these fields are synced. */
  fields: Record<string, string>;
  /**
   * Base44 field names that a Busabase edit may overwrite (must also appear in `fields`).
   * Empty or missing = one-way sync, the webhook receiver never writes this entity.
   */
  writeBack?: string[];
}

export type JsonObject = Record<string, unknown>;

/** The slice of `base44.asServiceRole.entities.<Name>` this kit uses. */
export interface EntityHandler {
  get(id: string): Promise<JsonObject>;
  filter(
    query: JsonObject,
    options?: { limit?: number; cursor?: string; sort?: string },
  ): Promise<{ items: JsonObject[]; next_cursor?: string | null; has_more?: boolean }>;
  create(data: JsonObject): Promise<JsonObject>;
  update(id: string, data: JsonObject): Promise<JsonObject>;
}

export type EntityMap = Record<string, EntityHandler>;

export interface BusabaseRecord {
  id: string;
  /** Present on records returned by the API: the current field values, keyed by field slug. */
  headCommit?: { payload?: JsonObject };
}

export interface WriteResult {
  /** True when the change merged into the Base (a write-level key). False = waiting for review. */
  landed: boolean;
  recordId?: string;
  changeRequestId?: string;
  changeRequestStatus?: string;
}

export interface BusabaseApi {
  findRecordBySource(
    baseId: string,
    fieldSlug: string,
    value: string,
  ): Promise<BusabaseRecord | null>;
  createRecord(
    baseId: string,
    fields: JsonObject,
    options: { idempotencyKey: string; message: string },
  ): Promise<WriteResult>;
  updateRecord(
    recordId: string,
    fields: JsonObject,
    options: { message: string },
  ): Promise<WriteResult>;
}

export interface Logger {
  info(event: string, data?: JsonObject): void;
  error(event: string, data?: JsonObject): void;
}

export interface SyncDeps {
  entities: EntityMap;
  busabase: BusabaseApi;
  mappings: EntityMapping[];
  log: Logger;
  now?: () => Date;
}

/** Row of the `BusabaseSyncState` entity: one per synced Base44 record. */
export type SyncStatus = "synced" | "pending_review" | "failed";

export interface SyncState extends JsonObject {
  id: string;
  entity: string;
  entity_id: string;
  busabase_record_id?: string | null;
  content_hash?: string | null;
  status: SyncStatus;
  direction?: "to_busabase" | "from_busabase" | null;
  attempts?: number;
  last_error?: string | null;
  last_synced_at?: string | null;
}

export type SyncOutcome =
  | { status: "created" | "updated" | "unchanged" | "pending_review"; recordId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string; attempts: number };
