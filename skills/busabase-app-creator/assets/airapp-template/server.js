import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (context) => context.json({ ok: true, app: "busabase-airapp" }));
app.use("/*", serveStatic({ root: "./app" }));

const port = Number.parseInt(process.env.PORT || "3000", 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`AirApp ready on port ${port}`);
});
