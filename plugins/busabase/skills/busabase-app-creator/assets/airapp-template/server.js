import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createBusabaseAirAppLocalGateway } from "busabase-sdk/airapp-node";
import { Hono } from "hono";

const app = new Hono();
const gateway = createBusabaseAirAppLocalGateway({
  appId: "__APP_SLUG__",
  successPath: "/",
  errorPath: "/",
});

app.get("/health", (context) => context.json({ ok: true, app: "__APP_SLUG__" }));

// These routes are used only by a standalone top-level loopback preview. In a
// Busabase-hosted Run, the browser skips this gate and Busabase owns /api/v1.
app.get("/auth/status", (context) => gateway.statusResponse(context.req.raw));
app.post("/auth/start", (context) => gateway.start(context.req.raw));
app.get("/auth/callback", (context) => gateway.callback(context.req.raw));
app.post("/auth/space", (context) => gateway.selectSpace(context.req.raw));
app.post("/auth/logout", (context) => gateway.logout(context.req.raw));
app.all("/api/v1/*", (context) => gateway.proxy(context.req.raw));

/**
 * The ONLY sanctioned way for browser code to learn where it is running.
 *
 * Busabase spawns this very process when it hosts the app, and injects
 * `BUSABASE_AIRAPP_RUNTIME` (`browser` | `local` | `remote` | `embed`).
 * Nobody else sets it, so its absence is the positive fact "standalone".
 * This route re-exposes that to the browser, which cannot read env vars.
 *
 * Never classify the environment by hostname. A Busabase-hosted AirApp is
 * routinely served from `localhost` (Desktop/OSS runs on
 * `http://localhost:15419`), and a standalone `npm run dev` is routinely
 * reached over a LAN IP or a signed dev tunnel such as
 * `https://3111-….dev.budaapps.com`. Either hostname test misfires, and the
 * "not localhost ⇒ hosted" direction fails the worst: the app hides its own
 * connection gate, calls `/api/v1` with no credential, and shows the user an
 * error they have no way to act on.
 *
 * `devProxy` is a separate axis on purpose. "Where am I running" and "do I
 * have credentials" are two different states, and collapsing them into one
 * boolean is what produces UI claiming to be connected when it isn't. It
 * reports only the non-interactive env bootstrap; the interactive answer is
 * the gateway's own `/auth/status`.
 *
 * Browser code must fetch this RELATIVELY (`__airapp/runtime`, no leading
 * slash). Under the Local Node engine the app is reverse-proxied onto a
 * sub-path of busabase's origin, so a leading slash resolves against the
 * origin root — busabase itself — and 404s.
 */
// Hosted is decided from PRESENCE, never from membership of a list of known
// engine names. A local list is what broke 66 shipped apps when `local-node`
// became `local`: each answered "standalone" inside a hosted preview, showed
// its own connection gate, called /api/v1 with no credential, and left the
// operator with nothing to act on. The names moved again since — `nodepod` and
// `sandock` became `browser` and `remote`, and `srt` was removed — which cost
// nothing precisely because this reads presence. Only Busabase sets this
// variable, so any non-empty value means it spawned this process, including an
// engine this app has never heard of.
//
// The same rule now also lives in busabase-sdk, which is where it belongs, and
// `describeBusabaseAirAppRuntime()` returns this whole body — so the swap deletes
// the `hosted:` line rather than restating it. That matters: this exact line has
// regressed twice, both times by an app being copied from an older source, and
// both times with every test still green.
//
// It is NOT used here yet on purpose: the scaffold pins the latest *published*
// SDK, and that export ships in the next release. Importing it now would generate
// apps that crash on boot against every SDK currently on npm. Once a release
// carrying it is out, this whole block becomes:
//
//   import { describeBusabaseAirAppRuntime } from "busabase-sdk/airapp-node";
//   app.get("/__airapp/runtime", (context) => context.json(describeBusabaseAirAppRuntime()));
const airappRuntime = (process.env.BUSABASE_AIRAPP_RUNTIME || "").trim();
app.get("/__airapp/runtime", (context) =>
  context.json({
    runtime: airappRuntime || "standalone",
    hosted: airappRuntime !== "",
    devProxy: Boolean((process.env.BUSABASE_BASE_URL || "").trim()),
  }),
);
console.log(`AirApp runtime: ${airappRuntime || "standalone"}`);

app.use("/*", serveStatic({ root: "./app" }));

const port = Number.parseInt(process.env.PORT || "3000", 10);
serve({ fetch: app.fetch, port }, () => {
  // Both Busabase runners discover the preview port from this exact phrase.
  console.log(`AirApp listening on port ${port}`);
});
