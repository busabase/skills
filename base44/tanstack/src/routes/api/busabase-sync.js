// TanStack Start apps only. Copy to src/routes/api/busabase-sync.js and copy base44/shared/ to
// src/lib/busabase-kit/ (see README, "Which kind of app do I have?").
//
// Called by the workflows in tanstack/base44/workflows/ through the `invoke_server_route` step.
// Written from Base44's "Server functions and server routes (TanStack Start)" skill page; it has
// not been run on a live Base44 app, so check it with the first workflow run (docs/test-record.md).

import { secrets } from "base44:runtime";
import { createFileRoute } from "@tanstack/react-router";
import { requireUserRoute } from "@/lib/auth-middleware";
import { createDeps } from "@/lib/busabase-kit/config.ts";
import { handleSyncRequest } from "@/lib/busabase-kit/sync-request.ts";

export const Route = createFileRoute("/api/busabase-sync")({
  server: {
    // Workflow steps call as the app admin who created the workflow. The URL is public, so:
    // signed-in admin only, never a shared secret.
    middleware: [requireUserRoute],
    handlers: {
      POST: async ({ request, context }) => {
        if (context.user?.role !== "admin")
          return Response.json({ error: "Forbidden" }, { status: 403 });
        try {
          const deps = createDeps(
            context.getBase44().asServiceRole.entities,
            (name) => secrets.get(name),
            {
              needsBusabase: true,
            },
          );
          const result = await handleSyncRequest(deps, await request.json().catch(() => ({})));
          return Response.json(result.body, { status: result.status });
        } catch (error) {
          // console.log from server code is not shown anywhere in TanStack apps, so say why here
          return Response.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 },
          );
        }
      },
    },
  },
});
