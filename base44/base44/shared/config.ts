import { createBusabaseClient } from "./busabase-client.ts";
import { loadMappings } from "./mappings.ts";
import type { BusabaseApi, EntityMap, JsonObject, Logger, SyncDeps } from "./types.ts";

export type SecretReader = (name: string) => string | undefined;

/** One JSON line per event, ids and statuses only: no record contents, never a secret. */
export const jsonLogger: Logger = {
  info: (event, data) => console.log(JSON.stringify({ level: "info", event, ...data })),
  error: (event, data) => console.error(JSON.stringify({ level: "error", event, ...data })),
};

const missingBusabase: BusabaseApi = {
  findRecordBySource: () => Promise.reject(new Error("Busabase client is not configured")),
  createRecord: () => Promise.reject(new Error("Busabase client is not configured")),
  updateRecord: () => Promise.reject(new Error("Busabase client is not configured")),
};

/**
 * Secrets (app Secrets page, or `base44 secrets set`):
 *   BUSABASE_API_KEY         required to call Busabase (sync function)
 *   BUSABASE_SPACE_ID        optional; target space when the key spans several
 *   BUSABASE_BASE_URL        optional; defaults to https://busabase.com (set for self-hosted)
 *   BUSABASE_WEBHOOK_SECRET  required by the webhook receiver
 *   BUSABASE_MAPPINGS        optional JSON array replacing shared/mappings.ts
 */
export const createDeps = (
  entities: EntityMap,
  getSecret: SecretReader,
  options: { needsBusabase: boolean },
): SyncDeps => {
  let busabase = missingBusabase;
  if (options.needsBusabase) {
    const apiKey = getSecret("BUSABASE_API_KEY");
    if (!apiKey) throw new Error("Secret BUSABASE_API_KEY is not set");
    busabase = createBusabaseClient({
      baseUrl: getSecret("BUSABASE_BASE_URL") || "https://busabase.com",
      apiKey,
      spaceId: getSecret("BUSABASE_SPACE_ID") || undefined,
    });
  }
  return {
    entities,
    busabase,
    mappings: loadMappings(getSecret("BUSABASE_MAPPINGS")),
    log: jsonLogger,
  };
};

export const asObject = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
