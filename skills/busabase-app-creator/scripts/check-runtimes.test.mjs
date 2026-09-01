/**
 * The template's `check.mjs` is the gate an agent's generated app must pass, so
 * "does it still accept a correct Node app, and does it now accept a correct
 * Python one" is the whole question this file answers.
 *
 * It builds each fixture from scratch rather than copying a shipped app: the
 * deployed apps have their own drifted copy of `check.mjs`, so testing against
 * one would be testing a different script than the one this skill hands out.
 *
 * Run: node --test scripts/check-runtimes.test.mjs
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const templateRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets/airapp-template",
);

const APP_SLUG = "fixture-app";

const BLUEPRINT = {
  app: { slug: APP_SLUG },
  workspace: { bases: [{ read_limit: 25 }] },
};

const APP_CONFIG = {
  appSlug: APP_SLUG,
  deployment: "desktop",
  readOnly: true,
  permissions: { change_request_procedures: [] },
  schema: {
    folder: { nodeId: "nod_folder" },
    bases: [{ key: "items", nodeId: "nod_base", baseId: "bas_1", readLimit: 25, views: [] }],
    vaultRequirements: [],
  },
  demoRecords: [{ id: 1 }, { id: 2 }, { id: 3 }],
};

/**
 * Browser sources that satisfy every language-agnostic rule in `check.mjs`.
 * Kept as literal strings so a rule change surfaces here as a failing test
 * rather than as a fixture that silently drifts alongside it.
 */
const browserFiles = (opts) => ({
  "app/index.html": `<!doctype html><html><head><link rel="stylesheet" href="styles.css" /></head><body><script type="module" src="js/app.js"></script></body></html>`,
  "app/styles.css": "body { margin: 0; }",
  "app/js/config.js": `export const appConfig = ${JSON.stringify(APP_CONFIG, null, 2)};`,
  "app/js/messages.js": "export const messages = {};",
  "app/js/runtime.js": `export async function getRuntime() {
  const response = await fetch("__airapp/runtime");
  return response.json();
}`,
  "app/js/busabase-client.js": `import { createBusabaseClient } from "busabase-sdk";
export const client = createBusabaseClient({ baseUrl: window.location.origin });`,
  "app/js/providers/busabase-provider.js": `export const load = async (client, base) =>
  client.records.list({ baseId: base.baseId, limit: base.readLimit });`,
  "app/js/providers/demo-provider.js": "export const demo = [];",
  "app/js/app.js": `import { getRuntime } from "./runtime.js";
${opts.node ? 'import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";\n' : ""}export async function main() {
  const runtime = await getRuntime();
  ${opts.node ? "createAirAppConnectGate({ shouldGate: () => !runtime.hosted });" : "if (!runtime.hosted) throw new Error('hosted only');"}
}`,
});

const NODE_SERVER = `import { createBusabaseAirAppLocalGateway, describeBusabaseAirAppRuntime } from "busabase-sdk/airapp-node";
const gateway = createBusabaseAirAppLocalGateway({});
const airappRuntime = describeBusabaseAirAppRuntime();
// routes: "/auth/status" "/auth/start" "/auth/callback" "/auth/space" "/auth/logout"
// runtime: "/__airapp/runtime"
export { gateway, airappRuntime };
`;

const NODE_PACKAGE = {
  name: APP_SLUG,
  private: true,
  type: "module",
  scripts: { dev: "node server.js", start: "node server.js" },
  dependencies: { "busabase-sdk": "0.30.1" },
  devDependencies: { "esbuild-wasm": "0.25.0" },
};

const roots = [];

const build = (runtime) => {
  const root = mkdtempSync(path.join(tmpdir(), `airapp-check-${runtime}-`));
  roots.push(root);
  const isNode = runtime === "node";
  const files = {
    "airapp-blueprint.json": JSON.stringify(BLUEPRINT, null, 2),
    ...browserFiles({ node: isNode }),
  };

  if (isNode) {
    files["package.json"] = JSON.stringify(NODE_PACKAGE, null, 2);
    files["server.js"] = NODE_SERVER;
    // Only the length is asserted, so a plausible stand-in is enough.
    files["app/vendor/busabase-sdk.js"] = `// vendored\n${"x".repeat(10_050)}`;
    files["app/vendor/busabase-airapp-gate.js"] = "// vendored gate";
  } else {
    files["airapp.json"] = JSON.stringify(
      { runtime: "python", start: "python3 server.py", port: 3000 },
      null,
      2,
    );
    files["server.py"] = spawnSync("cat", [path.join(templateRoot, "server.py")], {
      encoding: "utf8",
    }).stdout;
  }

  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  mkdirSync(path.join(root, "scripts"), { recursive: true });
  writeFileSync(
    path.join(root, "scripts/check.mjs"),
    spawnSync("cat", [path.join(templateRoot, "scripts/check.mjs")], { encoding: "utf8" }).stdout,
  );
  return root;
};

const run = (root) => spawnSync("node", ["scripts/check.mjs"], { cwd: root, encoding: "utf8" });

after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe("airapp template check — runtimes", () => {
  it("still accepts a correct Node app", () => {
    const result = run(build("node"));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /AirApp checks OK \(node\)/);
  });

  it("accepts a correct Python app", () => {
    // The reason this skill existed only for Node: the check demanded a
    // package.json whose `dev` script was exactly `node server.js`.
    const result = run(build("python"));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /AirApp checks OK \(python\)/);
  });

  it("still rejects a Node app whose dev script is not what Busabase runs", () => {
    const root = build("node");
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ ...NODE_PACKAGE, scripts: { dev: "vite", start: "node server.js" } }),
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /dev must be exactly/);
  });

  it("rejects a Python app that never says how to start", () => {
    // Without npm scripts, `airapp.json` is the only place the start command
    // can live — an app declaring neither would install and then have nothing
    // to run.
    const root = build("python");
    writeFileSync(path.join(root, "airapp.json"), JSON.stringify({ runtime: "python" }));
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must declare a `start` command/);
  });

  it("rejects an unknown runtime rather than falling back to Node's rules", () => {
    const root = build("python");
    writeFileSync(path.join(root, "airapp.json"), JSON.stringify({ runtime: "cobol" }));
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unsupported runtime/);
  });

  it("holds both runtimes to the same browser-source rules", () => {
    // The browser half is identical in either language, so a leaked credential
    // is exactly as dangerous in a Python app.
    for (const runtime of ["node", "python"]) {
      const root = build(runtime);
      writeFileSync(
        path.join(root, "app/js/messages.js"),
        'export const messages = { key: "BUSABASE_API_KEY" };',
      );
      const result = run(root);
      assert.notEqual(result.status, 0, `${runtime} accepted an API key reference`);
    }
  });

  it("refuses a host that decides hosting from a hardcoded engine list", () => {
    // The exact shape that broke 66 shipped apps when `local-node` became
    // `local`: each carried its own copy of the list and answered `hosted` from
    // membership in it, so every one of them claimed "standalone" inside a
    // hosted preview. Moving the list into an app is how that comes back — and
    // the list below is now doubly stale (`nodepod`/`srt` are gone), which is
    // exactly the rot this rejects.
    const root = build("node");
    writeFileSync(
      path.join(root, "server.js"),
      `${NODE_SERVER}
const AIRAPP_HOSTED_RUNTIMES = new Set(["nodepod", "local", "srt", "embed"]);
export const hosted = AIRAPP_HOSTED_RUNTIMES.has(airappRuntime);
`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /hardcoded engine list/);
  });

  it("rejects the engine-name list on the CLIENT, which is where 66 apps actually carry it", () => {
    // The exact bytes shipped in 66 apps. Server-side they are all correct
    // (`hosted: airappRuntime !== ""`), so the old server-only rule passed them
    // while the list sat in the browser bundle one file away.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/runtime.js"),
      `const HOSTED = new Set(["nodepod", "local-node", "srt", "embed"]);
export async function getRuntime() {
  const response = await fetch("__airapp/runtime");
  const body = await response.json();
  return { ...body, hosted: body.hosted === true || HOSTED.has(body.runtime) };
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0, "client-side engine list was accepted");
    assert.match(result.stderr, /hardcoded engine list/);
  });

  it("names the list it found, rather than only the rule it broke", () => {
    // An author who wrote `HOSTED` does not recognise themselves in a message
    // about `AIRAPP_HOSTED_RUNTIMES`. Echo the literal back.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/runtime.js"),
      `const WHATEVER = new Set(["nodepod", "srt"]);
export async function getRuntime() {
  const response = await fetch("__airapp/runtime");
  const body = await response.json();
  return { ...body, hosted: WHATEVER.has(body.runtime) };
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /nodepod/);
    assert.match(result.stderr, /PRESENCE/);
  });

  it("still accepts ordinary vocabulary that merely overlaps an engine name", () => {
    // "local" and "browser" are words an app may legitimately use — a rule that
    // fires on those would be untrue often enough to get switched off.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/runtime.js"),
      `const STORAGE_MODES = ["local", "browser"];
export async function getRuntime() {
  const response = await fetch("__airapp/runtime");
  const body = await response.json();
  return { ...body, modes: STORAGE_MODES, hosted: body.hosted === true };
}`,
    );
    const result = run(root);
    assert.equal(result.status, 0, `ordinary vocabulary rejected: ${result.stderr}`);
  });

  it("does not let a comment mentioning the SDK helper stand in for reading the variable", () => {
    // How this bit: the shipped template's comment *names*
    // `readBusabaseAirAppRuntime()` while explaining why it is not called yet,
    // and the assertion matched that mention — so a server that had stopped
    // reading the variable entirely still passed. Prose about a rule must never
    // satisfy the rule.
    const root = build("node");
    writeFileSync(
      path.join(root, "server.js"),
      `import { createBusabaseAirAppLocalGateway } from "busabase-sdk/airapp-node";
const gateway = createBusabaseAirAppLocalGateway({});
// One day this will call readBusabaseAirAppRuntime() from the SDK.
const airappRuntime = "";
// routes: "/auth/status" "/auth/start" "/auth/callback" "/auth/space" "/auth/logout"
// runtime: "/__airapp/runtime"
export { gateway, airappRuntime };
`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must read BUSABASE_AIRAPP_RUNTIME/);
  });
});
