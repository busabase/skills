import { createBusabaseClient } from "busabase-sdk";
import { airAppRecordFields, createAirAppRecords } from "busabase-sdk/airapp";
import { appConfig } from "./app/js/config.js";

// The website is a read-only projection of the blueprint's declared Bases.
// Its key stays in the Worker: never proxy a visitor-selected API route.
export function createSiteWorker(config = appConfig, makeClient = createBusabaseClient) {
  const bases = new Map(config.schema.bases.map((base) => [base.key, base]));
  const visible = (record, base) => ({
    id: record.id,
    baseKey: base.key,
    fields: Object.fromEntries(
      base.fields.map((field) => [field.slug, airAppRecordFields(record)[field.slug]]),
    ),
  });
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (request.method !== "GET")
        return Response.json({ error: "READ_ONLY_SITE" }, { status: 405 });
      if (url.pathname === "/__airapp/runtime") {
        return Response.json({
          runtime: "site",
          knownRuntime: "site",
          hosted: true,
          devProxy: false,
          determined: true,
        });
      }
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
        return Response.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      if (!url.pathname.startsWith("/site/")) return env.ASSETS.fetch(request);
      const match = /^\/site\/(page|record|count)\/([^/]+)(?:\/([^/]+))?$/.exec(url.pathname);
      const base = match && bases.get(match[2]);
      if (!base || (match[1] === "record") !== Boolean(match[3]))
        return Response.json({ error: "NOT_FOUND" }, { status: 404 });
      const procedure =
        match[1] === "record"
          ? "records.get"
          : match[1] === "count"
            ? "records.count"
            : "records.list";
      if (!config.permissions.read_procedures.includes(procedure))
        return Response.json({ error: "PROCEDURE_DENIED" }, { status: 403 });
      const client = makeClient({
        baseUrl: env.BUSABASE_BASE_URL,
        apiKey: env.BUSABASE_API_KEY,
        spaceId: env.BUSABASE_SPACE_ID,
      });
      try {
        if (match[1] === "record") {
          const record = await client.records.get({ recordId: match[3] });
          if (record.baseId !== base.baseId)
            return Response.json({ error: "NOT_FOUND" }, { status: 404 });
          return Response.json(visible(record, base));
        }
        if (match[1] === "count") {
          const { total } = await client.records.count({ baseId: base.baseId });
          return Response.json({ total });
        }
        const cursor = url.searchParams.get("cursor") || undefined;
        if (cursor && cursor.length > 2048)
          return Response.json({ error: "INVALID_CURSOR" }, { status: 400 });
        const page = await createAirAppRecords(client, { appId: config.appSlug }).readPage({
          baseId: base.baseId,
          limit: Math.min(50, Math.max(1, base.readLimit || 50)),
          cursor,
        });
        return Response.json({
          records: page.records.map((record) => visible(record, base)),
          nextCursor: page.nextCursor || null,
          limit: Math.min(50, Math.max(1, base.readLimit || 50)),
        });
      } catch {
        return Response.json({ error: "SITE_DATA_UNAVAILABLE" }, { status: 502 });
      }
    },
  };
}

export default createSiteWorker();
