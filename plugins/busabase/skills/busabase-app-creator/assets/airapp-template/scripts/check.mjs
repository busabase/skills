import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "package.json",
  "server.js",
  "airapp-blueprint.json",
  "app/index.html",
  "app/styles.css",
  "app/js/app.js",
  "app/js/config.js",
  "app/js/messages.js",
  "app/js/busabase-client.js",
  "app/js/runtime.js",
  "app/js/providers/busabase-provider.js",
  "app/js/providers/demo-provider.js",
  "app/vendor/busabase-sdk.js",
];

const contents = {};
for (const relative of required)
  contents[relative] = await readFile(path.join(root, relative), "utf8");

const packageJson = JSON.parse(contents["package.json"]);
const blueprint = JSON.parse(contents["airapp-blueprint.json"]);
const configMatch = contents["app/js/config.js"].match(
  /^\s*export const appConfig = ([\s\S]+);\s*$/,
);
if (!configMatch) throw new Error("Generated config must export one JSON appConfig object.");
const appConfig = JSON.parse(configMatch[1]);
const sdkVersion = packageJson.dependencies?.["busabase-sdk"] || "";
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(sdkVersion))
  throw new Error("busabase-sdk must use an exact version.");
// Scan BOTH dependency maps: a bundler declared under devDependencies is just as unable to
// boot under Nodepod as one under dependencies, and only `dependencies` was being checked.
const declaredDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const unsupportedDep = ["react", "vite", "webpack", "next", "parcel", "react-scripts"].find(
  (name) => declaredDeps[name],
);
if (unsupportedDep) throw new Error(`Unsupported frontend dependency: ${unsupportedDep}.`);
if (
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.devDependencies?.["esbuild-wasm"] || "")
) {
  throw new Error("esbuild-wasm must use an exact version.");
}
// `dev` is the script that matters: BOTH AirApp engines run `npm run dev` (nodepod-runner.ts
// and local-node-runtime.ts). This check only ever asserted `start`, so a project that dropped
// `dev` — the exact shape a Vite scaffold produces — passed here and then died at run time on
// `npm error Missing script: "dev"`. `start` is still checked because deployment uses it.
if (packageJson.scripts?.dev !== "node server.js")
  throw new Error('dev must be exactly "node server.js" — it is what Busabase runs.');
if (packageJson.scripts?.start !== "node server.js")
  throw new Error("start must not build or spawn subprocesses.");
if (contents["app/vendor/busabase-sdk.js"].length < 10_000)
  throw new Error("Browser SDK bundle is missing or incomplete.");
if (!["cloud", "desktop"].includes(appConfig.deployment))
  throw new Error("Invalid deployment mode.");
if (appConfig.deployment === "cloud" && !appConfig.spaceId)
  throw new Error("Cloud app requires spaceId.");
if (!Array.isArray(appConfig.schema?.bases) || !appConfig.schema.bases.length)
  throw new Error("Configured Bases are missing.");
if (!appConfig.schema.folder?.nodeId) throw new Error("Configured Folder node id is missing.");
if (appConfig.schema.bases.some((base) => !base.nodeId || !base.baseId))
  throw new Error("Configured Base node/base ids are missing.");
if (
  appConfig.schema.bases.some(
    (base) => !Number.isInteger(base.readLimit) || base.readLimit < 1 || base.readLimit > 50,
  )
) {
  throw new Error("Every configured Base requires an integer readLimit from 1 to 50.");
}
for (const [index, base] of appConfig.schema.bases.entries()) {
  const expected = blueprint.workspace?.bases?.[index]?.read_limit ?? 50;
  if (base.readLimit !== expected)
    throw new Error(`Configured Base ${base.key || index} readLimit does not match blueprint.`);
}
if (appConfig.schema.bases.some((base) => (base.views || []).some((view) => !view.viewId)))
  throw new Error("Configured View ids are missing.");
const resourceCollections = ["docs", "drives", "whiteboards", "forms", "workflows", "html"];
if (
  resourceCollections.some((collection) =>
    (appConfig.schema[collection] || []).some((resource) => !resource.nodeId),
  )
) {
  throw new Error("Configured resource node ids are missing.");
}
if (
  (appConfig.schema.vaultRequirements || []).some(
    (requirement) => "value" in requirement || "secret_value" in requirement,
  )
) {
  throw new Error("Vault values are forbidden in generated config.");
}
if (
  !Array.isArray(appConfig.demoRecords) ||
  appConfig.demoRecords.length < 3 ||
  appConfig.demoRecords.length > 5
) {
  throw new Error("Demo provider requires 3-5 records.");
}
if (blueprint.app?.slug !== appConfig.appSlug)
  throw new Error("Blueprint/config app slug mismatch.");

// Everything the browser downloads. `server.js` is deliberately NOT here: it is
// the only file allowed to know about credentials, because its dev proxy reads
// them from the environment and attaches them server-side.
const browserSource = [
  contents["app/js/app.js"],
  contents["app/js/config.js"],
  contents["app/js/busabase-client.js"],
  contents["app/js/runtime.js"],
  contents["app/js/providers/busabase-provider.js"],
].join("\n");

if (!browserSource.includes("createBusabaseClient")) throw new Error("SDK client missing.");
// One relative path, every environment: same-origin inside Busabase, this app's
// own dev proxy when run standalone. A hard-coded absolute Busabase URL or a
// leftover bridge prefix would work in exactly one of them.
if (!browserSource.includes("window.location.origin"))
  throw new Error("Runtime client must target its own origin.");
if (browserSource.includes("__busabase_api__"))
  throw new Error("Obsolete /__busabase_api__ bridge prefix found.");
if (/baseUrl\s*:\s*["'`]https?:\/\//.test(browserSource))
  throw new Error("Hard-coded Busabase URL found in browser source.");
const providerSource = contents["app/js/providers/busabase-provider.js"];
if (!/limit:\s*base\.readLimit/.test(providerSource))
  throw new Error("Busabase provider must consume each configured Base readLimit.");
if (/while\s*\(\s*cursor\s*\)|client\.bases\.list\s*\(/.test(browserSource))
  throw new Error("Unbounded loading or runtime Base discovery found.");
// Asset references must be RELATIVE. Under the Local Node engine the app is
// reverse-proxied onto a sub-path of busabase's origin, so `src="/js/app.js"`
// resolves against the origin root (busabase itself) and 404s — the app renders
// under Nodepod but not under Local Node. `/api/v1/...` is deliberately absolute
// and unaffected: it is an API call, not an asset.
const absoluteAssetRef = /(?:src|href)="\/(?!\/)|from\s+["']\/(?!\/)/;
if (absoluteAssetRef.test(browserSource) || absoluteAssetRef.test(contents["app/index.html"]))
  throw new Error(
    "Absolute asset path found; use relative paths so the Local Node sub-path proxy works.",
  );
// --- Runtime detection -----------------------------------------------------
// The app must learn where it runs from `BUSABASE_AIRAPP_RUNTIME`, which
// Busabase injects into the process it spawns and `server.js` re-exposes at
// `__airapp/runtime`. Hostname tests are wrong in BOTH directions: a
// Busabase-hosted AirApp is served from `localhost` on Desktop/OSS, and a
// standalone `npm run dev` is reached over LAN IPs and signed dev tunnels
// (`https://3111-….dev.budaapps.com`). The "not localhost ⇒ hosted" direction
// is the damaging one — the app hides its own connection gate, calls
// `/api/v1` unauthenticated, and reports an error the user cannot act on.
// Comments are stripped first so the reasoning may name `localhost` in prose.
const withoutComments = browserSource
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, "$1 ");
if (/location\s*\.\s*(?:hostname|host)\b/.test(withoutComments))
  throw new Error(
    "Hostname-based runtime detection found; read the runtime from __airapp/runtime instead.",
  );
if (
  /(?:===|!==|==|!=)\s*["'`][^"'`]*(?:localhost|127\.0\.0\.1)|(?:includes|startsWith|endsWith|indexOf|search|match|test)\s*\(\s*\/?["'`]?[^"'`)]*(?:localhost|127\.0\.0\.1)/.test(
    withoutComments,
  )
) {
  throw new Error("Loopback host comparison found; runtime detection must not depend on the URL.");
}
if (!/getRuntime\s*\(/.test(contents["app/js/app.js"]))
  throw new Error("app.js must resolve the runtime via runtime.js's getRuntime().");
if (!browserSource.includes("__airapp/runtime"))
  throw new Error("Browser source must probe the __airapp/runtime endpoint.");
// Relative on purpose — under the Local Node engine a leading slash resolves
// against busabase's origin root instead of the app's preview sub-path.
if (/["'`]\/__airapp\/runtime/.test(browserSource))
  throw new Error("Runtime probe must use the relative path __airapp/runtime, without a slash.");
if (!/process\.env\.BUSABASE_AIRAPP_RUNTIME\b/.test(contents["server.js"]))
  throw new Error("server.js must read BUSABASE_AIRAPP_RUNTIME.");
if (!/["'`]\/__airapp\/runtime["'`]/.test(contents["server.js"]))
  throw new Error("server.js must serve the /__airapp/runtime endpoint.");

if (/BUSABASE_API_KEY/i.test(browserSource))
  throw new Error("API key reference found in browser source.");
if (/Bearer/i.test(browserSource)) throw new Error("Bearer header found in browser source.");
// The dev proxy may reference the env var; it may never carry a literal token.
if (/Bearer\s+(?!\$\{)[A-Za-z0-9_-]{8,}/.test(contents["server.js"]))
  throw new Error("Literal Bearer token found in server.js.");
if (!contents["server.js"].includes("createBusabaseAirAppLocalGateway"))
  throw new Error("Server must use the SDK local AirApp OAuth/Space gateway.");
for (const route of [
  "/auth/status",
  "/auth/start",
  "/auth/callback",
  "/auth/space",
  "/auth/logout",
]) {
  if (!contents["server.js"].includes(route)) throw new Error(`Server is missing ${route}.`);
}
if (!contents["app/js/app.js"].includes("/auth/space"))
  throw new Error("Browser setup must implement explicit multi-Space selection.");
if (appConfig.readOnly && appConfig.permissions.change_request_procedures.length) {
  throw new Error("Read-only app declares write procedures.");
}

console.log(
  `AirApp checks OK. ${appConfig.demoRecords.length} demo records; busabase-sdk ${sdkVersion}; ${appConfig.deployment} deployment.`,
);
