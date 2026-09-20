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
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

  it("still sees a violation when a line comment contains a /* sequence", () => {
    // Regression: comment stripping used one greedy `/\*[\s\S]*?\*/` pass over
    // the whole source. A path written in an ordinary line comment —
    // `content/*/base.json`, which every template package's config.js names —
    // opens a block comment that never legitimately closes, so the pass ate
    // everything up to the next `*/` in the file. The rules downstream then
    // ran against a near-empty string and passed unconditionally.
    //
    // The trailing JSDoc block is load-bearing, not decoration: a non-greedy
    // `[\s\S]*?\*/` only matches when some later `*/` exists to close it, so
    // the bypass needs one. Every real app has documentation, which is why this
    // reproduced in practice and not in a minimal fixture.
    //
    // The point of the gate is that these two rules cannot be bypassed, so a
    // bypass reachable by writing a file path is the whole bug.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/app.js"),
      `// content/*/base.json is generated from this config
import { getRuntime } from "./runtime.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
export async function main() {
  const runtime = await getRuntime();
  const hosted = location.hostname !== "localhost";
  createAirAppConnectGate({ shouldGate: () => !runtime.hosted && !hosted });
}
/** Any ordinary documentation block closes the comment the path opened. */
export const VERSION = 1;`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0, "hostname detection must still be rejected");
    assert.match(result.stderr, /Hostname-based runtime detection/);
  });

  it("keeps ignoring a // that is part of a URL inside a string", () => {
    // The other direction: stripping must not treat `https://` as a comment,
    // or everything after it on that line stops being inspected.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/app.js"),
      `import { getRuntime } from "./runtime.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
const DOCS = "https://example.com/docs";
export async function main() {
  const runtime = await getRuntime();
  const hosted = location.hostname === "localhost"; // must still be caught
  createAirAppConnectGate({ shouldGate: () => !runtime.hosted && !hosted });
  return DOCS;
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0, "a URL must not shield later code from inspection");
    assert.match(result.stderr, /Hostname-based runtime detection/);
  });

  it("refuses a template package whose app pins resource ids", () => {
    // A template materializes fresh resources in the installer's Space, so
    // pinned ids can only name the author's. Publishing one succeeds, and the
    // app then reads nothing — or, if an id resolves, a stranger's data.
    // "Is this id from this Space" is not answerable statically, so refusing
    // the combination is the only place it can be caught.
    const root = build("node");
    mkdirSync(path.join(root, "../fixture-package/content"), { recursive: true });
    const packageRoot = mkdtempSync(path.join(tmpdir(), "airapp-template-pkg-"));
    roots.push(packageRoot);
    const appRoot = path.join(packageRoot, "content", APP_SLUG);
    mkdirSync(appRoot, { recursive: true });
    cpSync(root, appRoot, { recursive: true });
    writeFileSync(
      path.join(packageRoot, "busabase.json"),
      JSON.stringify({
        format: "busabase-package@1",
        name: "fixture",
        template: { category: "x" },
      }),
    );
    const result = spawnSync("node", ["scripts/check.mjs"], { cwd: appRoot, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /template must bind runtime/);
  });

  it("still accepts a template package whose app carries no ids", () => {
    const root = build("node");
    const packageRoot = mkdtempSync(path.join(tmpdir(), "airapp-template-ok-"));
    roots.push(packageRoot);
    const appRoot = path.join(packageRoot, "content", APP_SLUG);
    mkdirSync(appRoot, { recursive: true });
    cpSync(root, appRoot, { recursive: true });
    // Same fixture minus the pinned ids the workspace-first route would carry.
    const runtimeBound = {
      ...APP_CONFIG,
      schema: { ...APP_CONFIG.schema, bases: [{ key: "items", readLimit: 25, views: [] }] },
    };
    writeFileSync(
      path.join(appRoot, "app/js/config.js"),
      `export const appConfig = ${JSON.stringify(runtimeBound, null, 2)};`,
    );
    // With no ids in the config, the provider must resolve them itself.
    writeFileSync(
      path.join(appRoot, "app/js/providers/busabase-provider.js"),
      `import { inspectProvisionedResources } from "../../vendor/busabase-airapp.js";
export const load = async (client, config) => {
  const resources = await inspectProvisionedResources(client, config);
  // Resolved ids merged onto the declaration, which is where readLimit lives.
  const declared = config.schema.bases[0];
  const base = { ...declared, ...resources.bases.find((item) => item.key === declared.key) };
  return client.records.list({ baseId: base.baseId, limit: base.readLimit });
};`,
    );
    writeFileSync(
      path.join(packageRoot, "busabase.json"),
      JSON.stringify({
        format: "busabase-package@1",
        name: "fixture",
        template: { category: "x" },
      }),
    );
    const result = spawnSync("node", ["scripts/check.mjs"], { cwd: appRoot, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  });

  it("rejects a relation field that names no target", () => {
    // Provisioning accepts this and creates options:{} — a field that exists,
    // is named, and links to nothing. Nothing fails until someone opens the
    // picker and finds it empty, by which time the schema is long written.
    // One Base, so the unrelated blueprint/readLimit pairing stays satisfied
    // and the assertion is about the relation rule alone.
    const root = build("node");
    const withRelation = {
      ...APP_CONFIG,
      schema: {
        ...APP_CONFIG.schema,
        bases: [
          {
            ...APP_CONFIG.schema.bases[0],
            slug: "fixture-items",
            fields: [{ slug: "parent", name: "Parent", type: "relation" }],
          },
        ],
      },
    };
    writeFileSync(
      path.join(root, "app/js/config.js"),
      `export const appConfig = ${JSON.stringify(withRelation, null, 2)};`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /declares no target/);
  });

  it("rejects a relation whose target is not a Base in this app", () => {
    const root = build("node");
    const withBadTarget = {
      ...APP_CONFIG,
      schema: {
        ...APP_CONFIG.schema,
        bases: [
          {
            key: "items",
            nodeId: "nod_a",
            baseId: "bas_1",
            slug: "fixture-items",
            readLimit: 25,
            views: [],
            fields: [
              {
                slug: "owner",
                name: "Owner",
                type: "relation",
                options: { targetBaseSlug: "fixture-absent" },
              },
            ],
          },
        ],
      },
    };
    writeFileSync(
      path.join(root, "app/js/config.js"),
      `export const appConfig = ${JSON.stringify(withBadTarget, null, 2)};`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not a Base in this app/);
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
