// CMO console API — a platform-neutral Hono app.
//
// Every handler is Web-standard `fetch(Request) -> Response` and reaches state
// only through lib/data-provider, so the exact same `app.fetch` runs:
//   - locally, mounted into the Vite dev server (see app/vite.config.ts),
//   - standalone under @hono/node-server (see app/server/index.mjs),
//   - and, once the data layer is cloud-backed, on Cloudflare Workers unchanged.
//
// No node:fs, no bundler, no server framework beyond Hono here.

import { Hono } from "hono";
import { getProvider } from "../../lib/data-provider/index.ts";
import { getMarketingInput } from "../../lib/marketing.mjs";

export function createApp() {
  const app = new Hono();
  const provider = getProvider();

  app.get("/api/health", (c) => c.json({ ok: true, skill: "cmo", data_provider: provider.name }));

  app.get("/api/state", async (c) => c.json(await provider.getState()));

  app.get("/api/marketing/:view", async (c) => {
    const view = c.req.param("view");
    const input = getMarketingInput(new URL(c.req.url).searchParams);
    return c.json(await provider.getMarketing(view, input));
  });

  app.get("/api/geo", async (c) => {
    const params = new URL(c.req.url).searchParams;
    const timeRange = params.get("timeRange") === "7d" ? "7d" : "30d";
    return c.json(
      await provider.getGeo({
        timeRange,
        promptSearch: params.get("promptSearch") ?? "",
        promptId: params.get("promptId") ?? "",
      }),
    );
  });

  app.post("/api/review-decision", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const review = body.review ?? {};
    try {
      return c.json(await provider.submitReviewDecision(review));
    } catch (error) {
      return c.json({ error: error.message }, error.statusCode ?? 400);
    }
  });

  app.get("/api/onboarding", async (c) => c.json(await provider.getOnboarding()));

  app.post("/api/onboarding", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    return c.json(await provider.completeOnboarding(body));
  });

  app.get("/api/agent-tasks", async (c) => c.json(await provider.getAgentTasks()));

  // Never let a stray /api/* request fall through to the frontend/static layer.
  app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

  return app;
}
