import { secrets } from "base44:runtime";
import { createClientFromRequest } from "npm:@base44/sdk";
import { createDeps } from "../../shared/config.ts";
import { handleSyncRequest } from "../../shared/sync-request.ts";
import type { EntityMap } from "../../shared/types.ts";

/**
 * Base44 -> Busabase. Called by workflows (see base44/workflows/*.jsonc), never by browsers.
 * Request body = the workflow step's `args`; see shared/sync-request.ts.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // A function's URL is public. Workflow steps call it as the app admin who created the
    // workflow (Base44 docs, "Important Notes"), so require that, and never a shared secret.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const deps = createDeps(
      base44.asServiceRole.entities as unknown as EntityMap,
      (name) => secrets.get(name),
      {
        needsBusabase: true,
      },
    );
    const result = await handleSyncRequest(deps, await req.json().catch(() => ({})));
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ level: "error", event: "sync.unhandled", error: message }));
    return Response.json({ error: message }, { status: 500 });
  }
}
