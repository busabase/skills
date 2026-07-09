// The CMO data-provider interface — the polymorphic contract every provider
// (`local`, `busabase`, and future `postgres` / `aitable` / `notion`) implements.
//
// Providers are interchangeable: callers (the Hono app, scripts) get one from
// `getProvider()` and use it without knowing which backend is behind it. This is
// a real TypeScript `interface`, so `class X implements CmoDataProvider` is
// checked at author time by tsc / the editor. `assertProvider()` is the runtime
// backstop for dynamic/JS callers.
//
// Erasable TypeScript only (interfaces, type annotations, `as const`, `satisfies`)
// so Node ≥23.6 runs these files directly via native type-stripping — no build.
// Do NOT use `enum` / `namespace` / constructor parameter properties here.

/** Input to a human verdict on a proposal. */
export interface ReviewInput {
  id?: string;
  action?: string;
  comment?: string;
  /** revise: the operation to append a commit to (busabase). */
  operation_id?: string;
  /** revise: new field values (busabase). */
  fields?: Record<string, unknown>;
  /** approve: also merge to canonical when supported (busabase). */
  merge?: boolean;
}

/** Queued agent work returned by `getAgentTasks()`. */
export interface AgentTasks {
  updated_at: string;
  tasks: unknown[];
}

/**
 * The contract shared by every CMO data provider.
 *
 * Core members are required; the two marked optional are provider-specific
 * extensions a backend MAY add (e.g. busabase draft/connectivity).
 */
export interface CmoDataProvider {
  /** Stable provider id, e.g. `"local"` / `"busabase"`. Echoed in `/api/state`. */
  readonly name: string;

  // ── core (required) ────────────────────────────────────────────────────────
  /** Full `/api/state` payload (batch, decisions, counts, lock, config, snapshot, …). */
  getState(): Promise<Record<string, unknown>>;
  /** Marketing dashboard data for one view (`traffic|search|keywords|…`). */
  getMarketing(view: string, input: unknown): Promise<unknown>;
  /** GEO / AI visibility dashboard data, served from a local GEOly snapshot cache. */
  getGeo(input: unknown): Promise<unknown>;
  /** Sanitized config summary (never secrets); includes `data_provider`. */
  getConfigSummary(): Promise<Record<string, unknown>>;
  /** Lock status `{ locked, … }` guarding writes. */
  getLock(): Promise<Record<string, unknown>>;
  /** Onboarding marker `{ completed, … }`. */
  getOnboarding(): Promise<Record<string, unknown>>;
  /** Write the onboarding completion marker. */
  completeOnboarding(marker?: Record<string, unknown>): Promise<Record<string, unknown>>;
  /** Queued agent work (items in `changes_requested` or carrying an `@ai` comment). */
  getAgentTasks(): Promise<AgentTasks>;
  /** Apply a human verdict (`approve|request_changes|block|revise`) to a proposal. */
  submitReviewDecision(review: ReviewInput): Promise<Record<string, unknown>>;

  // ── optional extensions (provider-specific) ────────────────────────────────
  /** Draft a new proposal (e.g. busabase → a Change Request). Not on `local`. */
  createProposal?(
    fields: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  /** Probe connectivity + resolve actor/space (remote providers). */
  verifyConnection?(): Promise<Record<string, unknown>>;
}

/** Members every provider MUST implement (kept in sync with the interface above). */
export const CORE_METHODS = [
  "getState",
  "getMarketing",
  "getGeo",
  "getConfigSummary",
  "getLock",
  "getOnboarding",
  "completeOnboarding",
  "getAgentTasks",
  "submitReviewDecision",
] as const satisfies readonly (keyof CmoDataProvider)[];

/** Members a provider MAY implement; validated only when present. */
export const OPTIONAL_METHODS = [
  "createProposal",
  "verifyConnection",
] as const satisfies readonly (keyof CmoDataProvider)[];

/**
 * Assert that `provider` conforms to {@link CmoDataProvider}. Throws a single,
 * actionable error listing everything missing/mistyped. Called at registration so
 * drift (a new provider that forgot a method) fails immediately and clearly —
 * the runtime backstop to the compile-time `implements` check.
 */
export function assertProvider(name: string, provider: unknown): CmoDataProvider {
  if (!provider || (typeof provider !== "object" && typeof provider !== "function")) {
    throw new Error(`Data provider "${name}" is not an object.`);
  }
  const candidate = provider as Record<string, unknown>;
  const problems: string[] = [];
  if (typeof candidate.name !== "string" || !candidate.name) {
    problems.push("name (string)");
  }
  for (const method of CORE_METHODS) {
    if (typeof candidate[method] !== "function") problems.push(`${method}()`);
  }
  for (const method of OPTIONAL_METHODS) {
    if (method in candidate && typeof candidate[method] !== "function") {
      problems.push(`${method}() [optional, must be a function if present]`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Data provider "${name}" does not satisfy CmoDataProvider — missing/invalid: ${problems.join(", ")}. ` +
        `See lib/data-provider/provider-interface.ts.`,
    );
  }
  return provider as CmoDataProvider;
}
