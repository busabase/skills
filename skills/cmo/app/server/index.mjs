// Standalone Node host for the CMO console.
//
// Runs the platform-neutral Hono API (app/server/hono.mjs) under
// @hono/node-server and serves the built frontend from app/dist. This is the
// Cloudflare-ready path expressed for Node: the same createApp().fetch would run
// on Workers once the data provider is cloud-backed; only this host file and the
// disk-touching static handler are Node-specific.
//
// Dev (React HMR) does NOT use this file — it runs Vite, which mounts the same
// Hono app for /api/* (see app/vite.config.ts).

import fs from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { serve } from "@hono/node-server";
import {
  DEFAULT_HOST,
  DIST_DIR,
  PREFERRED_PORT_MAX,
  PREFERRED_PORT_MIN,
} from "../../lib/paths.mjs";
import { createApp } from "./hono.mjs";

const HOST = process.env.CMO_UI_HOST || DEFAULT_HOST;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const readFileSafe = async (pathname) => {
  try {
    return await fs.readFile(pathname);
  } catch {
    return null;
  }
};

// Serve the built SPA with a path-traversal guard and index.html fallback.
const serveFrontend = async (c) => {
  const url = new URL(c.req.url);
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const resolved = path.resolve(DIST_DIR, rel);
  // Guard: never escape DIST_DIR.
  if (resolved !== DIST_DIR && !resolved.startsWith(`${DIST_DIR}${path.sep}`)) {
    return c.text("Forbidden", 403);
  }
  let file = rel && !rel.endsWith("/") ? await readFileSafe(resolved) : null;
  let filePath = resolved;
  if (!file) {
    filePath = path.join(DIST_DIR, "index.html");
    file = await readFileSafe(filePath);
  }
  if (!file) {
    return c.text(
      "CMO console frontend is not built. Run `npm run build` in app/, or use start.sh for dev.",
      404,
    );
  }
  return c.body(file, 200, {
    "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
  });
};

const isFree = (port, host) =>
  new Promise((resolve) => {
    const tester = createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => tester.close(() => resolve(true)));
    tester.listen(port, host);
  });

const healthIsCmo = async (port) => {
  try {
    const res = await fetch(`http://${DEFAULT_HOST}:${port}/api/health`, {
      signal: AbortSignal.timeout(500),
    });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.skill === "cmo";
  } catch {
    return false;
  }
};

const pickPort = async () => {
  const envPort = Number(process.env.CMO_UI_PORT || 0);
  if (envPort) return { port: envPort, reuse: false };
  for (let port = PREFERRED_PORT_MIN; port <= PREFERRED_PORT_MAX; port += 1) {
    // Require the port free on both stacks so `localhost` (IPv6-first) resolves
    // to us, not to another server squatting on the other stack.
    const free = (await isFree(port, "127.0.0.1")) && (await isFree(port, "::1"));
    if (free) return { port, reuse: false };
    if (await healthIsCmo(port)) return { port, reuse: true };
  }
  throw new Error(`No free port in ${PREFERRED_PORT_MIN}-${PREFERRED_PORT_MAX}.`);
};

const { port, reuse } = await pickPort();
if (reuse) {
  console.log(`CMO Console already running at http://${DEFAULT_HOST}:${port}`);
  process.exit(0);
}

const app = createApp();
app.get("/*", serveFrontend);

serve({ fetch: app.fetch, hostname: HOST, port }, (info) => {
  console.log(`CMO Console (Hono) at http://${DEFAULT_HOST}:${info.port}`);
});
