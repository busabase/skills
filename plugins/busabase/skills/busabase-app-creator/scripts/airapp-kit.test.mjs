import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  checkGeneratedProject,
  scaffoldProject,
  validateBlueprint,
  verifyInstalledSdk,
} from "./airapp-kit.mjs";

const execFileAsync = promisify(execFile);

const validBlueprint = () => ({
  schema_version: 1,
  app: {
    name: "Launch Tracker",
    slug: "launch-tracker",
    description: "Track launches and their owners.",
    locale: "en",
    deployment: "cloud",
    space_id: "space-test",
    read_only: true,
    brand: { mode: "inferred", accent: "#176B5B", logo_path: "" },
  },
  workspace: {
    folder: {
      name: "Launch Tracker",
      slug: "launch-tracker",
      node_id: "node-folder-launch-tracker",
    },
    bases: [
      {
        key: "launches",
        name: "Launches",
        slug: "launches",
        node_id: "node-base-launches",
        base_id: "base-launches",
        description: "Launch records.",
        views: [
          {
            key: "launch-calendar",
            name: "Launch calendar",
            type: "calendar",
            config: { dateFieldSlug: "launch-date" },
            view_id: "view-launch-calendar",
          },
        ],
        fields: [
          { slug: "name", name: "Name", type: "text", required: true },
          {
            slug: "status",
            name: "Status",
            type: "select",
            required: true,
            options: {
              choices: [
                { id: "active", name: "Active" },
                { id: "done", name: "Done" },
              ],
            },
          },
          {
            slug: "map",
            name: "Map",
            type: "whiteboard",
            required: false,
          },
          { slug: "launch-date", name: "Launch date", type: "date", required: false },
        ],
        seed_records: [
          { name: "Summer release", status: "active" },
          { name: "Docs refresh", status: "done" },
          { name: "Mobile beta", status: "active" },
        ],
      },
    ],
    docs: [
      {
        key: "launch-brief",
        name: "Launch brief",
        slug: "launch-brief",
        description: "Long-form launch guidance.",
        node_id: "node-doc-launch-brief",
      },
    ],
    drives: [
      {
        key: "launch-files",
        name: "Launch files",
        slug: "launch-files",
        description: "Launch assets and exports.",
        node_id: "node-drive-launch-files",
        files: [{ path: "exports/", purpose: "Generated launch exports" }],
      },
    ],
    vault_requirements: [
      {
        key: "PUBLISH_API_KEY",
        kind: "secret",
        scope: "space",
        required: false,
        purpose: "Used by a trusted publishing workflow, never by the AirApp browser.",
      },
    ],
    integrations: [
      {
        key: "publisher",
        name: "Publisher",
        purpose: "Publish an approved launch through trusted execution.",
        execution: "trusted_workflow",
        vault_refs: ["PUBLISH_API_KEY"],
      },
    ],
    relations: [],
  },
  ui: {
    primary_base: "launches",
    summary: "See launch health.",
    screens: [
      {
        id: "overview",
        name: "Overview",
        purpose: "Status summary",
        data_sources: ["launches", "launch-brief"],
      },
    ],
    attention_states: ["active"],
    actions: [],
  },
  permissions: {
    read_procedures: ["records.list", "changeRequests.list"],
    change_request_procedures: [],
  },
  onboarding: {
    version: 1,
    required_fields: [],
    completion_resource: "launches",
    rationale: "This read-only tracker has no operator-specific configuration.",
  },
});

test("validates a coherent read-only blueprint", () => {
  const result = validateBlueprint(validBlueprint());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test("rejects direct mutation-shaped actions and bad relations", () => {
  const blueprint = validBlueprint();
  blueprint.ui.actions = [{ id: "merge", kind: "direct_mutation", base: "missing" }];
  blueprint.workspace.relations = [
    {
      source_base: "launches",
      target_base: "missing",
      field_slug: "project",
      required: true,
      multiple: false,
    },
  ];
  const result = validateBlueprint(blueprint);
  assert.ok(result.errors.some((message) => message.includes("direct_mutation")));
  assert.ok(result.errors.some((message) => message.includes("target_base")));
});

test("scaffolds and checks a project without network access", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-test-"));
  const blueprintPath = path.join(temporary, "blueprint.json");
  const outputPath = path.join(temporary, "generated");
  await writeFile(blueprintPath, JSON.stringify(validBlueprint(), null, 2), "utf8");
  const result = await scaffoldProject({
    blueprintPath,
    outputPath,
    sdkVersion: "0.9.7",
    skipInstall: true,
  });
  assert.equal(result.sdkVersion, "0.9.7");
  const packageJson = JSON.parse(await readFile(path.join(outputPath, "package.json"), "utf8"));
  assert.equal(packageJson.dependencies["busabase-sdk"], "0.9.7");
  const config = await readFile(path.join(outputPath, "app/js/config.js"), "utf8");
  const provider = await readFile(
    path.join(outputPath, "app/js/providers/busabase-provider.js"),
    "utf8",
  );
  const server = await readFile(path.join(outputPath, "server.js"), "utf8");
  const browser = await readFile(path.join(outputPath, "app/js/app.js"), "utf8");
  assert.match(config, /nodeId:|"nodeId": "node-base-launches"/);
  assert.match(config, /baseId:|"baseId": "base-launches"/);
  assert.match(config, /"viewId": "view-launch-calendar"/);
  assert.match(config, /"nodeId": "node-doc-launch-brief"/);
  assert.match(config, /"nodeId": "node-drive-launch-files"/);
  assert.match(config, /"key": "PUBLISH_API_KEY"/);
  assert.match(config, /"onboarding"/);
  assert.match(config, /"readLimit": 50/);
  assert.match(provider, /base\.readLimit/);
  assert.match(provider, /limit: base\.readLimit/);
  assert.match(provider, /status: PENDING_STATUSES/);
  assert.doesNotMatch(provider, /client\.bases\.list\s*\(/);
  assert.doesNotMatch(provider, /while\s*\(\s*cursor\s*\)/);
  assert.match(server, /createBusabaseAirAppLocalGateway/);
  assert.match(server, /describeBusabaseAirAppRuntime/);
  assert.match(server, /appId: "launch-tracker"/);
  assert.match(server, /\/auth\/space/);
  assert.doesNotMatch(server, /context\.req\.header\("x-busabase-space"\)/);
  assert.match(browser, /createAirAppConnectGate/);
  const check = await checkGeneratedProject(outputPath, { requireBundle: false });
  assert.equal(check.ok, true);
  assert.equal(check.deployment, "cloud");
});

test("emits and consumes custom per-Base read budgets", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-budget-test-"));
  const blueprintPath = path.join(temporary, "blueprint.json");
  const outputPath = path.join(temporary, "generated");
  const blueprint = validBlueprint();
  blueprint.workspace.bases[0].key = "reports";
  blueprint.onboarding.completion_resource = "reports";
  blueprint.workspace.bases[0].name = "Reports";
  blueprint.workspace.bases[0].slug = "reports";
  blueprint.workspace.bases[0].read_limit = 14;
  blueprint.workspace.bases[0].node_id = "node-base-reports";
  blueprint.workspace.bases[0].base_id = "base-reports";
  blueprint.workspace.bases[0].views = [];
  blueprint.workspace.bases.push({
    key: "issues",
    name: "Issues",
    slug: "issues",
    read_limit: 50,
    node_id: "node-base-issues",
    base_id: "base-issues",
    fields: [{ slug: "title", name: "Title", type: "text", required: true }],
    views: [],
    seed_records: [],
  });
  blueprint.ui.primary_base = "reports";
  blueprint.ui.screens[0].data_sources = ["reports", "issues"];
  await writeFile(blueprintPath, JSON.stringify(blueprint, null, 2), "utf8");
  await scaffoldProject({
    blueprintPath,
    outputPath,
    sdkVersion: "0.9.7",
    skipInstall: true,
  });
  const config = await readFile(path.join(outputPath, "app/js/config.js"), "utf8");
  const provider = await readFile(
    path.join(outputPath, "app/js/providers/busabase-provider.js"),
    "utf8",
  );
  assert.match(config, /"key": "reports"[\s\S]*?"readLimit": 14/);
  assert.match(config, /"key": "issues"[\s\S]*?"readLimit": 50/);
  assert.match(provider, /base\.readLimit/);
  assert.match(provider, /limit: base\.readLimit/);
  const check = await checkGeneratedProject(outputPath, { requireBundle: false });
  assert.equal(check.ok, true);
  const vendorPath = path.join(outputPath, "app/vendor");
  await mkdir(vendorPath, { recursive: true });
  await writeFile(path.join(vendorPath, "busabase-sdk.js"), "x".repeat(10_001), "utf8");
  await writeFile(path.join(vendorPath, "busabase-airapp-gate.js"), "x".repeat(1_001), "utf8");
  const generatedCheck = await execFileAsync(process.execPath, ["scripts/check.mjs"], {
    cwd: outputPath,
  });
  assert.match(generatedCheck.stdout, /AirApp checks OK/);
});

test("rejects invalid per-Base read budgets", () => {
  for (const readLimit of [0, 51, 1.5]) {
    const blueprint = validBlueprint();
    blueprint.workspace.bases[0].read_limit = readLimit;
    const result = validateBlueprint(blueprint);
    assert.ok(result.errors.some((message) => message.includes("read_limit")));
  }
});

test("refuses to scaffold before Busabase ids are materialized", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-id-test-"));
  const blueprintPath = path.join(temporary, "blueprint.json");
  const blueprint = validBlueprint();
  delete blueprint.workspace.folder.node_id;
  delete blueprint.workspace.bases[0].base_id;
  delete blueprint.workspace.docs[0].node_id;
  await writeFile(blueprintPath, JSON.stringify(blueprint, null, 2), "utf8");
  await assert.rejects(
    scaffoldProject({
      blueprintPath,
      outputPath: path.join(temporary, "generated"),
      sdkVersion: "0.9.7",
      skipInstall: true,
    }),
    /must be materialized.*folder\.node_id.*base_id.*docs\[0\]\.node_id/s,
  );
});

test("rejects Vault values and unknown resource references", () => {
  const blueprint = validBlueprint();
  blueprint.workspace.vault_requirements[0].value = "must-not-be-stored";
  blueprint.ui.screens[0].data_sources.push("missing-resource");
  const result = validateBlueprint(blueprint);
  assert.ok(result.errors.some((message) => message.includes("must never contain a Vault value")));
  assert.ok(result.errors.some((message) => message.includes("unknown resource missing-resource")));
});

test("rejects malformed resource, Drive file, Vault, and integration entries", () => {
  const blueprint = validBlueprint();
  blueprint.workspace.docs.push("not-an-object");
  blueprint.workspace.drives[0].files.push("not-an-object");
  blueprint.workspace.vault_requirements.push("not-an-object");
  blueprint.workspace.integrations.push("not-an-object");
  const result = validateBlueprint(blueprint);
  assert.ok(
    result.errors.some((message) => message.includes("workspace.docs[1] must be an object")),
  );
  assert.ok(
    result.errors.some((message) =>
      message.includes("workspace.drives[0].files[1] must be an object"),
    ),
  );
  assert.ok(
    result.errors.some((message) =>
      message.includes("workspace.vault_requirements[1] must be an object"),
    ),
  );
  assert.ok(
    result.errors.some((message) =>
      message.includes("workspace.integrations[1] must be an object"),
    ),
  );
});

test("requires an explicit versioned product-onboarding contract", () => {
  const missing = validBlueprint();
  delete missing.onboarding;
  assert.ok(validateBlueprint(missing).errors.includes("onboarding contract is required."));

  const configured = validBlueprint();
  configured.onboarding = {
    version: 1,
    required_fields: [
      {
        key: "operator-profile",
        resource: "launches",
        validation: "non-empty",
        unlocks: ["review"],
      },
    ],
    completion_resource: "launches",
  };
  assert.deepEqual(validateBlueprint(configured).errors, []);

  const emptyWithoutReason = validBlueprint();
  delete emptyWithoutReason.onboarding.rationale;
  assert.ok(
    validateBlueprint(emptyWithoutReason).errors.includes(
      "onboarding.rationale is required when required_fields is empty.",
    ),
  );
});

test("rejects invalid native View field configuration", () => {
  const blueprint = validBlueprint();
  blueprint.workspace.bases[0].views.push({
    key: "launch-board",
    name: "Launch board",
    type: "kanban",
    config: { stackByFieldSlug: "launch-date" },
    view_id: "view-launch-board",
  });
  const result = validateBlueprint(blueprint);
  assert.ok(
    result.errors.some((message) =>
      message.includes("config.stackByFieldSlug must reference a select field"),
    ),
  );
});

test("scaffolds a Desktop app without requiring a Space id", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-desktop-test-"));
  const blueprintPath = path.join(temporary, "blueprint.json");
  const outputPath = path.join(temporary, "generated");
  const blueprint = validBlueprint();
  blueprint.app.deployment = "desktop";
  blueprint.app.space_id = "";
  await writeFile(blueprintPath, JSON.stringify(blueprint, null, 2), "utf8");
  await scaffoldProject({
    blueprintPath,
    outputPath,
    sdkVersion: "0.9.7",
    skipInstall: true,
  });
  const source = await readFile(path.join(outputPath, "app/js/busabase-client.js"), "utf8");
  // Same-origin in every environment — no Cloud/Desktop path fork any more.
  assert.match(source, /window\.location\.origin/);
  assert.doesNotMatch(source, /__busabase_api__/);
  const check = await checkGeneratedProject(outputPath, { requireBundle: false });
  assert.equal(check.deployment, "desktop");
});

test("verifies the installed SDK client export", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-sdk-test-"));
  const modulePath = path.join(temporary, "node_modules", "busabase-sdk");
  await mkdir(path.join(modulePath, "dist"), { recursive: true });
  await writeFile(
    path.join(modulePath, "package.json"),
    JSON.stringify({
      name: "busabase-sdk",
      type: "module",
      exports: {
        ".": "./dist/index.js",
        "./airapp-node": "./dist/airapp-node.js",
      },
    }),
    "utf8",
  );
  await writeFile(
    path.join(modulePath, "dist", "index.js"),
    "export const createBusabaseClient = () => ({});\n",
    "utf8",
  );
  await writeFile(
    path.join(modulePath, "dist", "airapp-node.js"),
    "export const createBusabaseAirAppLocalGateway = () => ({});\nexport const describeBusabaseAirAppRuntime = () => ({});\n",
    "utf8",
  );
  await verifyInstalledSdk(temporary);
});

test("rejects an installed SDK without the local AirApp gateway export", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-sdk-gateway-test-"));
  const sdkRoot = path.join(temporary, "node_modules", "busabase-sdk");
  await mkdir(path.join(sdkRoot, "dist"), { recursive: true });
  await writeFile(
    path.join(sdkRoot, "package.json"),
    JSON.stringify({
      type: "module",
      exports: {
        ".": "./dist/index.js",
        "./airapp-node": "./dist/airapp-node.js",
      },
    }),
    "utf8",
  );
  await writeFile(
    path.join(sdkRoot, "dist", "index.js"),
    "export const createBusabaseClient = () => ({});\n",
    "utf8",
  );
  await writeFile(path.join(sdkRoot, "dist", "airapp-node.js"), "export {};\n", "utf8");

  await assert.rejects(verifyInstalledSdk(temporary), /required AirApp gateway export/);
});

test("rejects an installed SDK without the runtime report export", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-sdk-runtime-test-"));
  const sdkRoot = path.join(temporary, "node_modules", "busabase-sdk");
  await mkdir(path.join(sdkRoot, "dist"), { recursive: true });
  await writeFile(
    path.join(sdkRoot, "package.json"),
    JSON.stringify({
      type: "module",
      exports: {
        ".": "./dist/index.js",
        "./airapp-node": "./dist/airapp-node.js",
      },
    }),
    "utf8",
  );
  await writeFile(
    path.join(sdkRoot, "dist", "index.js"),
    "export const createBusabaseClient = () => ({});\n",
    "utf8",
  );
  await writeFile(
    path.join(sdkRoot, "dist", "airapp-node.js"),
    "export const createBusabaseAirAppLocalGateway = () => ({});\n",
    "utf8",
  );

  await assert.rejects(verifyInstalledSdk(temporary), /required runtime export/);
});
