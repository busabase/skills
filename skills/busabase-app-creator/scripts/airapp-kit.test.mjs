import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkGeneratedProject,
  scaffoldProject,
  validateBlueprint,
  verifyInstalledSdk,
} from "./airapp-kit.mjs";

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
    read_procedures: ["records.listPaged", "changeRequests.listPaged"],
    change_request_procedures: [],
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
  assert.match(config, /nodeId:|"nodeId": "node-base-launches"/);
  assert.match(config, /baseId:|"baseId": "base-launches"/);
  assert.match(config, /"viewId": "view-launch-calendar"/);
  assert.match(config, /"nodeId": "node-doc-launch-brief"/);
  assert.match(config, /"nodeId": "node-drive-launch-files"/);
  assert.match(config, /"key": "PUBLISH_API_KEY"/);
  assert.match(provider, /const INITIAL_RECORD_LIMIT = 50/);
  assert.match(provider, /status: PENDING_STATUSES/);
  assert.doesNotMatch(provider, /client\.bases\.list\s*\(/);
  assert.doesNotMatch(provider, /while\s*\(\s*cursor\s*\)/);
  const check = await checkGeneratedProject(outputPath, { requireBundle: false });
  assert.equal(check.ok, true);
  assert.equal(check.deployment, "cloud");
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

test("scaffolds the Desktop RPC path without requiring a Space id", async () => {
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
  const source = await readFile(path.join(outputPath, "app/js/rpc-client.js"), "utf8");
  assert.match(source, /\/__busabase_api__\/api\/rpc/);
  const check = await checkGeneratedProject(outputPath, { requireBundle: false });
  assert.equal(check.deployment, "desktop");
});

test("verifies the installed SDK RPC export", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "busabase-app-creator-sdk-test-"));
  const modulePath = path.join(temporary, "node_modules", "busabase-sdk");
  await mkdir(modulePath, { recursive: true });
  await writeFile(
    path.join(modulePath, "package.json"),
    JSON.stringify({ name: "busabase-sdk", type: "module", exports: "./index.js" }),
    "utf8",
  );
  await writeFile(
    path.join(modulePath, "index.js"),
    "export const createBusabaseRpcClient = () => ({});\n",
    "utf8",
  );
  await verifyInstalledSdk(temporary);
});
