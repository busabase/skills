import { secrets } from "base44:runtime";
import { createClientFromRequest } from "npm:@base44/sdk";
import { createDeps } from "../../shared/config.ts";
import type { EntityMap } from "../../shared/types.ts";
import { handleBusabaseWebhook } from "../../shared/webhook.ts";

/**
 * Busabase -> Base44. Public endpoint: https://<your-app-domain>/functions/receive-busabase-webhook
 *
 * Authenticated only by the HMAC signature Busabase puts in `X-Busabase-Signature` (the webhook
 * rule's secret = the BUSABASE_WEBHOOK_SECRET app secret). Direct HTTP calls carry no user, so
 * writes use `asServiceRole`, as the Base44 docs prescribe for webhooks.
 */
export default async function (req: Request): Promise<Response> {
  if (req.method !== "POST") return Response.json({ error: "POST only" }, { status: 405 });
  try {
    const rawBody = await req.text(); // the signature covers the exact bytes, so read raw, parse later
    const base44 = createClientFromRequest(req);
    const deps = createDeps(
      base44.asServiceRole.entities as unknown as EntityMap,
      (name) => secrets.get(name),
      {
        needsBusabase: false,
      },
    );
    const result = await handleBusabaseWebhook(deps, {
      rawBody,
      signature: req.headers.get("x-busabase-signature"),
      secret: secrets.get("BUSABASE_WEBHOOK_SECRET"),
    });
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    // 5xx makes Busabase retry (3 attempts), which is what we want for a transient Base44 error.
    console.error(
      JSON.stringify({
        level: "error",
        event: "webhook.unhandled",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return Response.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
