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
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  "app/styles.css":
    "body { margin: 0; } .metrics { display: grid; grid-template-columns: repeat(3, 1fr); }",
  "app/js/config.js": `export const appConfig = ${JSON.stringify(
    opts.node ? APP_CONFIG : { ...APP_CONFIG, hostedOnly: true },
    null,
    2,
  )};`,
  "app/js/messages.js": "export const messages = {};",
  "app/js/runtime.js": `import { detectAirAppRuntime } from "../vendor/busabase-airapp.js";
export const getRuntime = () => detectAirAppRuntime();`,
  "app/js/busabase-client.js": `import { createBusabaseClient } from "busabase-sdk";
export const client = createBusabaseClient({ baseUrl: window.location.origin });`,
  "app/js/providers/busabase-provider.js": `export const load = async (client, base) =>
  client.records.list({ baseId: base.baseId, limit: base.readLimit });`,
  "app/js/providers/demo-provider.js": "export const demo = [];",
  // The real template mounts the gate in both runtimes: for a hosted-only Python
  // app it is where a standalone run is told it cannot work.
  "app/js/app.js": `import { getRuntime } from "./runtime.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
export const blocked = (appConfig, runtime) => appConfig.hostedOnly && !runtime.hosted;
export async function main() {
  const metrics = [
    ["Items", 3],
  ];
  const runtime = await getRuntime();
  createAirAppConnectGate({ shouldGate: () => !runtime.hosted });
}`,
});

const NODE_SERVER = `import { createBusabaseAirAppLocalGateway, describeBusabaseAirAppRuntime } from "busabase-sdk/airapp-node";
const gateway = createBusabaseAirAppLocalGateway({});
const airappRuntime = describeBusabaseAirAppRuntime();
// routes: "/auth/status" "/auth/start" "/auth/callback" "/auth/space" "/auth/logout"
// runtime: "/__airapp/runtime"
export { gateway, airappRuntime };
`;

// The check only looks for the helper names a bundle built from busabase-sdk
// 0.99.0 exports, so a stand-in naming them is enough.
const VENDORED_AIRAPP = `// vendored airapp
export { detectAirAppRuntime, shouldUseLocalAirAppGateway, createAirAppRecords, airAppWriteMessage };`;

const NODE_PACKAGE = {
  name: APP_SLUG,
  private: true,
  type: "module",
  scripts: { dev: "node server.js", start: "node server.js" },
  dependencies: { "busabase-sdk": "0.99.0" },
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

  // The browser half imports the three bundles at load whatever serves it, so a
  // Python app needs them as much as a Node one. Only the length is asserted for
  // the client, so a plausible stand-in is enough.
  files["app/vendor/busabase-sdk.js"] = `// vendored\n${"x".repeat(10_050)}`;
  files["app/vendor/busabase-airapp.js"] = VENDORED_AIRAPP;
  files["app/vendor/busabase-airapp-gate.js"] = "// vendored gate";
  if (isNode) {
    files["package.json"] = JSON.stringify(NODE_PACKAGE, null, 2);
    files["server.js"] = NODE_SERVER;
  } else {
    files["airapp.json"] = JSON.stringify(
      { runtime: "python", start: "python3 server.py" },
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

  it("rejects a Python app without its vendored bundles, which would open as an empty page", () => {
    // How this bit: the check required the bundles only of a Node app, yet the
    // browser half imports them at load whatever serves it. A Python app passed,
    // was deployed, and rendered a blank shell with a 404 for the gate bundle as
    // the only clue.
    const root = build("python");
    rmSync(path.join(root, "app/vendor"), { recursive: true });
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing: app\/vendor\/busabase-sdk\.js/);
    assert.match(result.stderr, /--runtime python/);
  });

  it("holds a Python app to the same helper rules as a Node one", () => {
    const root = build("python");
    writeFileSync(path.join(root, "app/vendor/busabase-airapp.js"), "// bundle from an old SDK\n");
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /busabase-airapp\.js lacks detectAirAppRuntime/);
  });

  it("requires a Python app to be marked hosted-only and to say so standalone", () => {
    // How this bit: the gate reads a missing /auth/status as "hosted" and steps
    // aside, so a Python app run standalone called /api/v1 with no credential and
    // showed a bare "Not Found" plus a hint pointing at a connect screen that never
    // appeared.
    const unmarked = build("python");
    writeFileSync(
      path.join(unmarked, "app/js/config.js"),
      `export const appConfig = ${JSON.stringify(APP_CONFIG, null, 2)};`,
    );
    const noConfig = run(unmarked);
    assert.notEqual(noConfig.status, 0);
    assert.match(noConfig.stderr, /hosted-only: set hostedOnly in its config/);

    const silent = build("python");
    writeFileSync(
      path.join(silent, "app/js/app.js"),
      readFileSync(path.join(silent, "app/js/app.js"), "utf8").replace(
        /^export const blocked.*$/m,
        "",
      ),
    );
    const noMessage = run(silent);
    assert.notEqual(noMessage.status, 0);
    assert.match(noMessage.stderr, /have app\.js stop with an explanation/);

    // A comment naming it does not count: prose about a rule never satisfies the rule.
    const comment = build("python");
    writeFileSync(
      path.join(comment, "app/js/app.js"),
      readFileSync(path.join(comment, "app/js/app.js"), "utf8").replace(
        /^export const blocked.*$/m,
        "// TODO: hostedOnly",
      ),
    );
    assert.notEqual(run(comment).status, 0);
  });

  it("does not ask a Node app to be hosted-only", () => {
    const result = run(build("node"));
    assert.equal(result.status, 0, result.stderr);
  });

  it("requires a Python app to mount the connect gate too", () => {
    // Run standalone it is the gate that tells the user a Python app is hosted-only.
    const root = build("python");
    writeFileSync(
      path.join(root, "app/js/app.js"),
      `import { getRuntime } from "./runtime.js";
export async function main() {
  const metrics = [
    ["Items", 3],
  ];
  const runtime = await getRuntime();
  if (!runtime.hosted) throw new Error("hosted only");
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /createAirAppConnectGate/);
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
  const metrics = [
    ["Items", 3],
  ];
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
  const metrics = [
    ["Items", 3],
  ];
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
      `import { detectAirAppRuntime } from "../vendor/busabase-airapp.js";
const HOSTED = new Set(["nodepod", "local-node", "srt", "embed"]);
export async function getRuntime() {
  const body = await detectAirAppRuntime();
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
      `import { detectAirAppRuntime } from "../vendor/busabase-airapp.js";
const WHATEVER = new Set(["nodepod", "srt"]);
export async function getRuntime() {
  const body = await detectAirAppRuntime();
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
      `import { detectAirAppRuntime } from "../vendor/busabase-airapp.js";
const STORAGE_MODES = ["local", "browser"];
export async function getRuntime() {
  const body = await detectAirAppRuntime();
  return { ...body, modes: STORAGE_MODES, hosted: body.hosted === true };
}`,
    );
    const result = run(root);
    assert.equal(result.status, 0, `ordinary vocabulary rejected: ${result.stderr}`);
  });

  it("rejects a runtime.js that carries its own probe instead of the SDK's", () => {
    // 64 apps each carried a copy of this probe, and each copy had drifted:
    // one without the JSON content-type check, one with an engine list that was
    // two renames stale. The SDK owns the rules now; a hand-written fetch brings
    // the copies back.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/runtime.js"),
      `export async function getRuntime() {
  const response = await fetch("__airapp/runtime");
  return response.json();
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /detectAirAppRuntime/);
  });

  it("rejects a hand-written probe even when the SDK's is also called", () => {
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/runtime.js"),
      `import { detectAirAppRuntime } from "../vendor/busabase-airapp.js";
export const getRuntime = async () => {
  const mine = await fetch("__airapp/runtime").then((response) => response.json());
  return { ...(await detectAirAppRuntime()), ...mine };
};`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Hand-written __airapp\/runtime probe/);
  });

  it("still rejects a probe with a leading slash", () => {
    // Under the Local Node engine a leading slash resolves against Busabase's
    // origin root. The SDK never does this; an app that fetches it by hand can.
    const root = build("node");
    const appPath = path.join(root, "app/js/app.js");
    writeFileSync(
      appPath,
      `${readFileSync(appPath, "utf8")}\nexport const probe = () => fetch("/__airapp/runtime");\n`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Hand-written __airapp\/runtime probe|relative path/);
  });

  it("requires the connect gate to be told explicitly whether it applies", () => {
    // Left to itself the gate probes /auth/status and treats an unreachable or
    // non-JSON answer as hosted: it infers a fact the host already stated.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/app.js"),
      `import { getRuntime } from "./runtime.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
export async function main() {
  const metrics = [
    ["Items", 3],
  ];
  await getRuntime();
  createAirAppConnectGate({ appName: "Fixture" });
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be given shouldGate/);
  });

  it("requires shouldGate to come from the runtime, not a constant", () => {
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/app.js"),
      `import { getRuntime } from "./runtime.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
export async function main() {
  const metrics = [
    ["Items", 3],
  ];
  await getRuntime();
  createAirAppConnectGate({ shouldGate: () => true });
}`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /derived from the runtime/);
  });

  it("accepts shouldGate derived through the SDK's shouldUseLocalAirAppGateway", () => {
    const root = build("node");
    writeFileSync(
      path.join(root, "app/js/app.js"),
      `import { getRuntime, shouldUseLocalGateway } from "./runtime.js";
import { createAirAppConnectGate } from "../vendor/busabase-airapp-gate.js";
export async function main() {
  const metrics = [
    ["Items", 3],
  ];
  const runtime = await getRuntime();
  const isDemo = () => false;
  createAirAppConnectGate({ shouldGate: () => !isDemo() && shouldUseLocalGateway(runtime) });
}`,
    );
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
  });

  it("rejects an SDK that predates the AirApp helpers", () => {
    // The app imports `busabase-sdk/airapp` from a vendored bundle; an older SDK
    // has none of it, so the failure would otherwise show up as a blank page.
    const root = build("node");
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        ...NODE_PACKAGE,
        dependencies: { "busabase-sdk": "0.98.0" },
      }),
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /has no AirApp helpers/);
  });

  it("accepts a newer SDK than the floor", () => {
    const root = build("node");
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        ...NODE_PACKAGE,
        dependencies: { "busabase-sdk": "0.100.2" },
      }),
    );
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
  });

  it("rejects a vendored AirApp bundle built from an SDK without the helpers", () => {
    const root = build("node");
    writeFileSync(path.join(root, "app/vendor/busabase-airapp.js"), "// old bundle");
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /busabase-airapp\.js lacks detectAirAppRuntime/);
  });

  // Each shape below shipped in a real AirApp (2026-10 layout migration).
  const fullScanShapes = {
    "capped cursor loop":
      "let cursor = null; let pageCount = 0;\n  do { const page = await load(cursor); cursor = page.nextCursor; pageCount += 1; } while (cursor && pageCount < 4);",
    "plain cursor walk":
      "let cursor = first.nextCursor;\n  while (cursor) {\n    const page = await client.records.list({ baseId, cursor });\n    cursor = page.nextCursor;\n  }",
    "fan-out over totalPages":
      "const pages = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => i + 2).map(load));",
    "for loop to totalPages":
      "for (let page = 2; page <= first.totalPages; page += 1) await load(page);",
    "jump to page by loading forward":
      "while (getLoadedCount() <= page * pageSize) {\n    const next = state.cursors[key];\n    if (!next) break;\n    await loadMoreBase(key);\n  }",
  };
  for (const [name, snippet] of Object.entries(fullScanShapes)) {
    it(`rejects a full scan in disguise: ${name}`, () => {
      const root = build("node");
      const appPath = path.join(root, "app/js/app.js");
      writeFileSync(
        appPath,
        `${readFileSync(appPath, "utf8")}\nexport async function scan() {\n  ${snippet}\n}\n`,
      );
      const result = run(root);
      assert.notEqual(result.status, 0, `${name} was accepted`);
      assert.match(result.stderr, /Unbounded loading/);
    });
  }

  it("accepts one-page reads that merely mention a cursor or a page count", () => {
    // The other side of the rule: Load More passing a cursor, a numbered pager
    // reading exactly the requested page, and a loop that is not about paging.
    const root = build("node");
    const appPath = path.join(root, "app/js/app.js");
    writeFileSync(
      appPath,
      `${readFileSync(appPath, "utf8")}
export async function loadMore(cursor) {
  const page = await client.records.list({ baseId, limit: 50, cursor });
  const numbered = await client.records.listPage({ baseId, page: target, pageSize: 50 });
  const label = \`\${numbered.page} / \${numbered.totalPages}\`;
  while (queue.length) await render(queue.shift());
  const cursor = new Date(start);
  while (cursor <= last) cursor.setUTCDate(cursor.getUTCDate() + 1);
  return { page, label };
}
`,
    );
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
  });

  it("rejects a metrics band above a record view", () => {
    const root = build("node");
    writeFileSync(
      path.join(root, "app/index.html"),
      `<!doctype html><html><head><link rel="stylesheet" href="styles.css" /></head><body>
<section id="overviewPage"></section>
<section id="viewPage"><section class="metrics" id="metrics"></section><table></table></section>
<script type="module" src="js/app.js"></script></body></html>`,
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must sit inside #overviewPage/);
  });

  it("accepts the metrics band on the overview page", () => {
    // The other side of the rule above: the band itself is fine, only its
    // placement over a list is not.
    const root = build("node");
    writeFileSync(
      path.join(root, "app/index.html"),
      `<!doctype html><html><head><link rel="stylesheet" href="styles.css" /></head><body>
<section id="overviewPage"><header class="page-hero"></header><section class="metrics" id="metrics"></section></section>
<section id="viewPage"><table></table></section>
<script type="module" src="js/app.js"></script></body></html>`,
    );
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
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
