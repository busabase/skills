import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  "app/js/rpc-client.js",
  "app/js/providers/busabase-provider.js",
  "app/js/providers/demo-provider.js",
  "app/vendor/busabase-sdk.js",
];

const contents = {};
for (const relative of required)
  contents[relative] = await readFile(path.join(root, relative), "utf8");

const packageJson = JSON.parse(contents["package.json"]);
const blueprint = JSON.parse(contents["airapp-blueprint.json"]);
const configUrl = `${pathToFileURL(path.join(root, "app/js/config.js")).href}?check=${Date.now()}`;
const { appConfig } = await import(configUrl);
const sdkVersion = packageJson.dependencies?.["busabase-sdk"] || "";
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(sdkVersion))
  throw new Error("busabase-sdk must use an exact version.");
if (packageJson.dependencies?.react || packageJson.dependencies?.vite)
  throw new Error("Unsupported frontend dependency.");
if (
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.devDependencies?.["esbuild-wasm"] || "")
) {
  throw new Error("esbuild-wasm must use an exact version.");
}
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

const runtimeSource = [
  contents["server.js"],
  contents["app/js/app.js"],
  contents["app/js/config.js"],
  contents["app/js/rpc-client.js"],
  contents["app/js/providers/busabase-provider.js"],
].join("\n");
if (!runtimeSource.includes("createBusabaseRpcClient")) throw new Error("SDK RPC client missing.");
const expectedPath =
  appConfig.deployment === "cloud" ? "/__busabase_api__/api/rpc/core" : "/__busabase_api__/api/rpc";
if (!runtimeSource.includes(expectedPath)) throw new Error(`RPC path missing: ${expectedPath}`);
if (!runtimeSource.includes("const INITIAL_RECORD_LIMIT = 50"))
  throw new Error("Bounded initial record limit is missing.");
if (/while\s*\(\s*cursor\s*\)|client\.bases\.list\s*\(/.test(runtimeSource))
  throw new Error("Unbounded loading or runtime Base discovery found.");
if (/BUSABASE_API_KEY/i.test(runtimeSource))
  throw new Error("API key reference found in runtime source.");
if (/authorization\s*[:=]\s*["'`]Bearer/i.test(runtimeSource))
  throw new Error("Bearer header found.");
if (appConfig.readOnly && appConfig.permissions.change_request_procedures.length) {
  throw new Error("Read-only app declares write procedures.");
}

console.log(
  `AirApp checks OK. ${appConfig.demoRecords.length} demo records; busabase-sdk ${sdkVersion}; ${appConfig.deployment} RPC.`,
);
