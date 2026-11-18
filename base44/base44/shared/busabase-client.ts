import type { BusabaseApi, BusabaseRecord, JsonObject, WriteResult } from "./types.ts";

export interface BusabaseClientConfig {
  /** Origin only, e.g. https://busabase.com or your self-hosted URL. */
  baseUrl: string;
  apiKey: string;
  /** Sent as `x-busabase-space`; required when the key belongs to several spaces. */
  spaceId?: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  timeoutMs?: number;
}

export class BusabaseError extends Error {
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(message: string, status: number | null, retryable: boolean) {
    super(message);
    this.name = "BusabaseError";
    this.status = status;
    this.retryable = retryable;
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const retryableStatus = (status: number) => status === 408 || status === 429 || status >= 500;

/** Backoff 300ms, 900ms, … or the server's Retry-After (seconds), capped at 5s. */
const backoffMs = (attempt: number, retryAfter: string | null): number => {
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 5000);
  return Math.min(300 * 3 ** (attempt - 1), 5000);
};

export const createBusabaseClient = (config: BusabaseClientConfig): BusabaseApi => {
  const fetchImpl = config.fetchImpl ?? fetch;
  const sleep = config.sleep ?? defaultSleep;
  const maxAttempts = config.maxAttempts ?? 3;
  const origin = config.baseUrl.replace(/\/+$/, "");

  const request = async (
    method: "GET" | "POST",
    path: string,
    body?: JsonObject,
  ): Promise<{ status: number; json: JsonObject | null }> => {
    const headers: Record<string, string> = {
      authorization: `Bearer ${config.apiKey}`,
      accept: "application/json",
    };
    if (config.spaceId) headers["x-busabase-space"] = config.spaceId;
    if (body) headers["content-type"] = "application/json";

    let lastError: BusabaseError | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let retryAfter: string | null = null;
      try {
        const response = await fetchImpl(`${origin}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(config.timeoutMs ?? 8000),
        });
        const text = await response.text();
        let json: JsonObject | null = null;
        try {
          json = text ? (JSON.parse(text) as JsonObject) : null;
        } catch {
          json = null;
        }
        if (response.ok || response.status === 404) return { status: response.status, json };
        retryAfter = response.headers.get("retry-after");
        // Never echo the response body into the error: it can carry record data.
        const reason = typeof json?.error === "string" ? json.error : `HTTP ${response.status}`;
        lastError = new BusabaseError(
          `Busabase ${method} ${path.split("?")[0]} failed: ${reason}`,
          response.status,
          retryableStatus(response.status),
        );
      } catch (error) {
        lastError = new BusabaseError(
          `Busabase ${method} ${path.split("?")[0]} network error: ${error instanceof Error ? error.message : String(error)}`,
          null,
          true,
        );
      }
      if (!lastError.retryable || attempt === maxAttempts) throw lastError;
      await sleep(backoffMs(attempt, retryAfter));
    }
    throw lastError ?? new BusabaseError("Busabase request failed", null, false);
  };

  const toWriteResult = (json: JsonObject | null): WriteResult => {
    if (!json) throw new BusabaseError("Busabase returned an empty response", null, false);
    // A merged write returns the record itself (`materialized: true`); a write waiting for review
    // returns the Change Request instead (docs: "Create ChangeRequests… materialized").
    if (json.materialized === true || typeof json.headCommitId === "string") {
      return { landed: true, recordId: json.id as string };
    }
    const status = typeof json.status === "string" ? json.status : undefined;
    return {
      landed: status === "merged",
      changeRequestId: json.id as string | undefined,
      changeRequestStatus: status,
    };
  };

  return {
    async findRecordBySource(baseId, fieldSlug, value) {
      const query = new URLSearchParams({ baseId, fieldSlug, valueText: value });
      const { status, json } = await request("GET", `/api/v1/records/get?${query}`);
      if (status === 404 || !json) return null;
      return json as unknown as BusabaseRecord;
    },

    async createRecord(baseId, fields, options) {
      const { json } = await request(
        "POST",
        `/api/v1/bases/${encodeURIComponent(baseId)}/change-requests`,
        {
          fields,
          message: options.message,
          submittedBy: "base44",
          idempotencyKey: options.idempotencyKey,
        },
      );
      return toWriteResult(json);
    },

    async updateRecord(recordId, fields, options) {
      const { status, json } = await request(
        "POST",
        `/api/v1/records/${encodeURIComponent(recordId)}/change-requests`,
        { operation: "update", fields, message: options.message, submittedBy: "base44" },
      );
      if (status === 404)
        throw new BusabaseError(`Busabase record ${recordId} not found`, 404, false);
      return toWriteResult(json);
    },
  };
};
