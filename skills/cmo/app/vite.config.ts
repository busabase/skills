import path from "node:path";
import { getRequestListener } from "@hono/node-server";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Dev-only bridge: mount the SAME platform-neutral Hono app that the standalone
// Node host and (later) Cloudflare Workers use, so /api/* has one source of
// truth (app/server/hono.mjs → lib/data-provider). Vite still owns the React
// frontend + HMR; it just forwards API requests into `app.fetch`.
function cmoApiPlugin(): Plugin {
  return {
    name: "cmo-api",
    async configureServer(server) {
      // Untyped .mjs server module (no .d.ts) — the same Hono app the standalone
      // host and Cloudflare path use. `createApp` flows in as `any`.
      // @ts-expect-error TS7016: no declaration file for ./server/hono.mjs
      const { createApp } = await import("./server/hono.mjs");
      const listener = getRequestListener(createApp().fetch);
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        listener(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [cmoApiPlugin(), react()],
  resolve: {
    alias: {
      "share-domains": path.resolve(__dirname, "../../../../packages/share-domains"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    open: false,
  },
});
