// TanStack Start apps only. Copy to src/routes/api/busabase-webhook.js.
//
// Public endpoint for Busabase webhooks: https://<your-app-domain>/api/busabase-webhook
// Authenticated by the HMAC signature only (BUSABASE_WEBHOOK_SECRET); no sign-in middleware,
// because Busabase is not a Base44 user. Writes use asServiceRole, as Base44 prescribes for webhooks.
// Not yet run on a live Base44 app (docs/test-record.md).

import { secrets } from "base44:runtime";
import { createFileRoute } from "@tanstack/react-router";
import { createDeps } from "@/lib/busabase-kit/config.ts";
import { handleBusabaseWebhook } from "@/lib/busabase-kit/webhook.ts";

export const Route = createFileRoute("/api/busabase-webhook")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        try {
          const rawBody = await request.text(); // the signature covers the exact bytes
          const deps = createDeps(
            context.getBase44().asServiceRole.entities,
            (name) => secrets.get(name),
            {
              needsBusabase: false,
            },
          );
          const result = await handleBusabaseWebhook(deps, {
            rawBody,
            signature: request.headers.get("x-busabase-signature"),
            secret: secrets.get("BUSABASE_WEBHOOK_SECRET"),
          });
          return Response.json(result.body, { status: result.status });
        } catch {
          // 5xx makes Busabase retry (3 attempts). No detail in the body: the caller is unauthenticated.
          return Response.json({ ok: false, error: "internal error" }, { status: 500 });
        }
      },
    },
  },
});
