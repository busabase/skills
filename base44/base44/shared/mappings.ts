import type { EntityMapping } from "./types.ts";

/**
 * The mapping table. Edit this file (or set the `BUSABASE_MAPPINGS` secret to a JSON
 * array of the same shape, which replaces it) before deploying.
 *
 * For every entry:
 *  - `entity`        the Base44 entity name ("Order", "Customer", your own entity…)
 *  - `base`          the Busabase Base id. Replace the placeholder; the function refuses to
 *                    run against it rather than guessing.
 *  - `sourceIdField` a TEXT field you add to that Busabase Base; it receives the Base44
 *                    record id and is how a record is recognised again (no duplicates).
 *  - `fields`        Base44 field -> Busabase field slug. Create matching fields in the Base.
 *  - `writeBack`     Base44 fields Busabase may overwrite. Leave out for one-way sync.
 */
export const DEFAULT_MAPPINGS: EntityMapping[] = [
  {
    entity: "Order",
    base: "REPLACE_WITH_ORDERS_BASE_ID",
    sourceIdField: "base44_id",
    fields: {
      order_number: "order_number",
      customer_name: "customer",
      status: "status",
      total: "total",
      currency: "currency",
      notes: "notes",
    },
    writeBack: ["status", "notes"],
  },
  {
    entity: "Customer",
    base: "REPLACE_WITH_CUSTOMERS_BASE_ID",
    sourceIdField: "base44_id",
    fields: {
      name: "name",
      email: "email",
      company: "company",
      phone: "phone",
      notes: "notes",
    },
    writeBack: ["notes"],
  },
];

export const PLACEHOLDER_BASE = /^REPLACE_WITH_/;

/** Parse the optional `BUSABASE_MAPPINGS` override; throws a readable error on bad JSON. */
export const loadMappings = (override: string | undefined): EntityMapping[] => {
  if (!override) return DEFAULT_MAPPINGS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(override);
  } catch {
    throw new Error("BUSABASE_MAPPINGS is not valid JSON");
  }
  if (!Array.isArray(parsed)) throw new Error("BUSABASE_MAPPINGS must be a JSON array");
  for (const item of parsed) {
    const m = item as Partial<EntityMapping>;
    if (!m.entity || !m.base || !m.sourceIdField || !m.fields || typeof m.fields !== "object") {
      throw new Error("BUSABASE_MAPPINGS entries need entity, base, sourceIdField and fields");
    }
  }
  return parsed as EntityMapping[];
};
