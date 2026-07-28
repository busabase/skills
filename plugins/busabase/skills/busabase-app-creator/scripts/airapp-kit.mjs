#!/usr/bin/env node

import { execFile } from "node:child_process";
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const templateDir = path.join(skillDir, "assets", "airapp-template");

const FIELD_TYPES = new Set([
  "text",
  "longtext",
  "markdown",
  "html",
  "number",
  "date",
  "checkbox",
  "select",
  "multiselect",
  "url",
  "email",
  "phone",
  "attachment",
  "code",
  "json",
  "yaml",
  "whiteboard",
  "relation",
]);
const READ_PROCEDURES = new Set([
  "bases.listViews",
  "records.listPaged",
  "records.count",
  "records.get",
  "records.search",
  "docs.get",
  "docs.readLines",
  "drives.get",
  "drives.listFiles",
  "drives.readFile",
  "files.get",
  "assets.get",
  "assets.download",
  "changeRequests.listPaged",
]);
const VIEW_TYPES = new Set(["table", "gallery", "kanban", "calendar", "gantt"]);
const RESOURCE_COLLECTIONS = ["docs", "drives", "whiteboards", "forms", "workflows", "html"];
const VAULT_KEY = /^[A-Z][A-Z0-9_]*$/;
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const asArray = (value) => (Array.isArray(value) ? value : []);

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return { command, flags };
}

export function validateBlueprint(blueprint) {
  const errors = [];
  const warnings = [];
  const error = (message) => errors.push(message);
  const warn = (message) => warnings.push(message);

  if (!isObject(blueprint)) return { errors: ["Blueprint must be a JSON object."], warnings };
  if (blueprint.schema_version !== 1) error("schema_version must be 1.");

  const app = isObject(blueprint.app) ? blueprint.app : {};
  if (!String(app.name || "").trim()) error("app.name is required.");
  if (!SLUG.test(String(app.slug || ""))) error("app.slug must be lowercase kebab-case.");
  if (!String(app.description || "").trim()) error("app.description is required.");
  if (!String(app.locale || "").trim()) error("app.locale is required.");
  if (!["cloud", "desktop"].includes(app.deployment))
    error("app.deployment must be cloud or desktop.");
  if (app.deployment === "cloud" && !String(app.space_id || "").trim()) {
    error("app.space_id is required for Cloud deployment.");
  }
  if (app.read_only !== true && app.read_only !== false) error("app.read_only must be boolean.");

  const workspace = isObject(blueprint.workspace) ? blueprint.workspace : {};
  const folder = isObject(workspace.folder) ? workspace.folder : {};
  if (!String(folder.name || "").trim()) error("workspace.folder.name is required.");
  if (!SLUG.test(String(folder.slug || "")))
    error("workspace.folder.slug must be lowercase kebab-case.");

  const bases = asArray(workspace.bases);
  if (bases.length === 0) error("workspace.bases must contain at least one Base.");
  const baseKeys = new Set();
  const baseSlugs = new Set();
  const resourceKeys = new Set();
  const resourceSlugs = new Set([String(folder.slug || "")]);
  let seedCount = 0;
  for (const [baseIndex, base] of bases.entries()) {
    const prefix = `workspace.bases[${baseIndex}]`;
    if (!isObject(base)) {
      error(`${prefix} must be an object.`);
      continue;
    }
    const key = String(base.key || "");
    const slug = String(base.slug || "");
    if (!SLUG.test(key)) error(`${prefix}.key must be lowercase kebab-case.`);
    if (baseKeys.has(key)) error(`${prefix}.key duplicates ${key}.`);
    baseKeys.add(key);
    resourceKeys.add(key);
    if (!SLUG.test(slug)) error(`${prefix}.slug must be lowercase kebab-case.`);
    if (baseSlugs.has(slug)) error(`${prefix}.slug duplicates ${slug}.`);
    baseSlugs.add(slug);
    resourceSlugs.add(slug);
    if (!String(base.name || "").trim()) error(`${prefix}.name is required.`);
    if (
      base.read_limit !== undefined &&
      (!Number.isInteger(base.read_limit) || base.read_limit < 1 || base.read_limit > 50)
    ) {
      error(`${prefix}.read_limit must be an integer from 1 to 50.`);
    }
    const fields = asArray(base.fields);
    if (fields.length === 0) error(`${prefix}.fields must contain at least one field.`);
    const fieldSlugs = new Set();
    for (const [fieldIndex, field] of fields.entries()) {
      const fieldPrefix = `${prefix}.fields[${fieldIndex}]`;
      if (!isObject(field)) {
        error(`${fieldPrefix} must be an object.`);
        continue;
      }
      const fieldSlug = String(field.slug || "");
      if (!SLUG.test(fieldSlug)) error(`${fieldPrefix}.slug must be lowercase kebab-case.`);
      if (fieldSlugs.has(fieldSlug)) error(`${fieldPrefix}.slug duplicates ${fieldSlug}.`);
      fieldSlugs.add(fieldSlug);
      if (!String(field.name || "").trim()) error(`${fieldPrefix}.name is required.`);
      if (!FIELD_TYPES.has(field.type)) error(`${fieldPrefix}.type is unsupported: ${field.type}.`);
      if (field.required !== true && field.required !== false)
        error(`${fieldPrefix}.required must be boolean.`);
      if (["select", "multiselect"].includes(field.type)) {
        const choices = asArray(field.options?.choices);
        if (choices.length === 0) error(`${fieldPrefix} needs options.choices.`);
      }
    }
    const primary = fields[0];
    if (primary && (primary.type !== "text" || primary.required !== true)) {
      error(`${prefix}.fields[0] must be a required text primary field.`);
    }
    const fieldsBySlug = new Map(fields.map((field) => [field.slug, field]));
    const viewKeys = new Set();
    for (const [viewIndex, view] of asArray(base.views).entries()) {
      const viewPrefix = `${prefix}.views[${viewIndex}]`;
      const viewKey = String(view?.key || "");
      if (!SLUG.test(viewKey)) error(`${viewPrefix}.key must be lowercase kebab-case.`);
      if (viewKeys.has(viewKey)) error(`${viewPrefix}.key duplicates ${viewKey}.`);
      viewKeys.add(viewKey);
      if (!String(view?.name || "").trim()) error(`${viewPrefix}.name is required.`);
      if (!VIEW_TYPES.has(view?.type)) error(`${viewPrefix}.type is unsupported: ${view?.type}.`);
      const config = isObject(view?.config) ? view.config : {};
      const requireViewField = (configKey, expectedType) => {
        const fieldSlug = String(config[configKey] || "");
        if (!fieldSlug) {
          error(`${viewPrefix}.config.${configKey} is required for ${view.type} views.`);
          return;
        }
        const field = fieldsBySlug.get(fieldSlug);
        if (!field) {
          error(`${viewPrefix}.config.${configKey} references unknown field ${fieldSlug}.`);
        } else if (expectedType && field.type !== expectedType) {
          error(`${viewPrefix}.config.${configKey} must reference a ${expectedType} field.`);
        }
      };
      if (view?.type === "kanban") requireViewField("stackByFieldSlug", "select");
      if (view?.type === "calendar") requireViewField("dateFieldSlug", "date");
      if (view?.type === "gantt") {
        requireViewField("startFieldSlug", "date");
        requireViewField("endFieldSlug", "date");
      }
      if (view?.type === "gallery" && config.coverFieldSlug) {
        requireViewField("coverFieldSlug", "attachment");
      }
    }
    seedCount += asArray(base.seed_records).length;
  }

  for (const collection of RESOURCE_COLLECTIONS) {
    for (const [resourceIndex, resource] of asArray(workspace[collection]).entries()) {
      const prefix = `workspace.${collection}[${resourceIndex}]`;
      if (!isObject(resource)) {
        error(`${prefix} must be an object.`);
        continue;
      }
      const key = String(resource.key || "");
      const slug = String(resource.slug || "");
      if (!SLUG.test(key)) error(`${prefix}.key must be lowercase kebab-case.`);
      if (resourceKeys.has(key)) error(`${prefix}.key duplicates workspace resource ${key}.`);
      resourceKeys.add(key);
      if (!SLUG.test(slug)) error(`${prefix}.slug must be lowercase kebab-case.`);
      if (resourceSlugs.has(slug)) error(`${prefix}.slug duplicates workspace node ${slug}.`);
      resourceSlugs.add(slug);
      if (!String(resource.name || "").trim()) error(`${prefix}.name is required.`);
      if (collection === "drives") {
        for (const [pathIndex, file] of asArray(resource.files).entries()) {
          const filePrefix = `${prefix}.files[${pathIndex}]`;
          if (!isObject(file)) {
            error(`${filePrefix} must be an object.`);
            continue;
          }
          if (!String(file?.path || "").trim()) error(`${filePrefix}.path is required.`);
          if (!String(file?.purpose || "").trim()) error(`${filePrefix}.purpose is required.`);
          if ("content" in file) error(`${filePrefix}.content is forbidden in blueprints.`);
        }
      }
    }
  }

  const vaultKeys = new Set();
  for (const [requirementIndex, requirement] of asArray(workspace.vault_requirements).entries()) {
    const prefix = `workspace.vault_requirements[${requirementIndex}]`;
    if (!isObject(requirement)) {
      error(`${prefix} must be an object.`);
      continue;
    }
    const key = String(requirement?.key || "");
    if (!VAULT_KEY.test(key)) error(`${prefix}.key must use uppercase env-style syntax.`);
    if (vaultKeys.has(key)) error(`${prefix}.key duplicates ${key}.`);
    vaultKeys.add(key);
    if (!["secret", "variable"].includes(requirement?.kind))
      error(`${prefix}.kind must be secret or variable.`);
    if (!["user", "space", "api_key"].includes(requirement?.scope))
      error(`${prefix}.scope must be user, space, or api_key.`);
    if (requirement?.required !== true && requirement?.required !== false)
      error(`${prefix}.required must be boolean.`);
    if (!String(requirement?.purpose || "").trim()) error(`${prefix}.purpose is required.`);
    if ("value" in requirement || "secret_value" in requirement)
      error(`${prefix} must never contain a Vault value.`);
    const allowedKeys = new Set(["key", "kind", "scope", "required", "purpose"]);
    const unknownKeys = Object.keys(requirement).filter((name) => !allowedKeys.has(name));
    if (unknownKeys.length)
      error(`${prefix} contains unsupported keys: ${unknownKeys.join(", ")}.`);
  }

  for (const [integrationIndex, integration] of asArray(workspace.integrations).entries()) {
    const prefix = `workspace.integrations[${integrationIndex}]`;
    if (!isObject(integration)) {
      error(`${prefix} must be an object.`);
      continue;
    }
    if (!SLUG.test(String(integration?.key || "")))
      error(`${prefix}.key must be lowercase kebab-case.`);
    if (!String(integration?.name || "").trim()) error(`${prefix}.name is required.`);
    if (!String(integration?.purpose || "").trim()) error(`${prefix}.purpose is required.`);
    if (!["agent", "trusted_workflow"].includes(integration?.execution))
      error(`${prefix}.execution must be agent or trusted_workflow.`);
    const allowedKeys = new Set(["key", "name", "purpose", "execution", "vault_refs"]);
    const unknownKeys = Object.keys(integration).filter((name) => !allowedKeys.has(name));
    if (unknownKeys.length)
      error(`${prefix} contains unsupported keys: ${unknownKeys.join(", ")}.`);
    for (const ref of asArray(integration?.vault_refs)) {
      if (!vaultKeys.has(ref)) error(`${prefix}.vault_refs references unknown Vault key ${ref}.`);
    }
  }

  const relations = asArray(workspace.relations);
  for (const [relationIndex, relation] of relations.entries()) {
    const prefix = `workspace.relations[${relationIndex}]`;
    if (!baseKeys.has(relation?.source_base)) error(`${prefix}.source_base does not exist.`);
    if (!baseKeys.has(relation?.target_base)) error(`${prefix}.target_base does not exist.`);
    const source = bases.find((base) => base.key === relation?.source_base);
    const field = asArray(source?.fields).find((item) => item.slug === relation?.field_slug);
    if (!field || field.type !== "relation")
      error(`${prefix}.field_slug must name a relation field in source_base.`);
    if (relation?.required !== true && relation?.required !== false)
      error(`${prefix}.required must be boolean.`);
    if (relation?.multiple !== true && relation?.multiple !== false)
      error(`${prefix}.multiple must be boolean.`);
  }

  const ui = isObject(blueprint.ui) ? blueprint.ui : {};
  if (!baseKeys.has(ui.primary_base)) error("ui.primary_base must reference a Base key.");
  if (!String(ui.summary || "").trim()) error("ui.summary is required.");
  if (asArray(ui.screens).length === 0) error("ui.screens must contain at least one screen.");
  for (const [screenIndex, screen] of asArray(ui.screens).entries()) {
    for (const source of asArray(screen?.data_sources)) {
      if (!resourceKeys.has(source))
        error(`ui.screens[${screenIndex}].data_sources references unknown resource ${source}.`);
    }
  }
  const actions = asArray(ui.actions);
  for (const [actionIndex, action] of actions.entries()) {
    if (!["read", "change_request"].includes(action?.kind)) {
      error(
        `ui.actions[${actionIndex}].kind must be read or change_request; received ${action?.kind}.`,
      );
    }
    if (action?.base && !baseKeys.has(action.base))
      error(`ui.actions[${actionIndex}].base does not exist.`);
  }
  if (app.read_only === true && actions.some((action) => action?.kind === "change_request")) {
    error("read_only app cannot declare change_request actions.");
  }

  const permissions = isObject(blueprint.permissions) ? blueprint.permissions : {};
  for (const procedure of asArray(permissions.read_procedures)) {
    if (!READ_PROCEDURES.has(procedure)) error(`Unsupported read procedure: ${procedure}.`);
  }
  for (const procedure of asArray(permissions.change_request_procedures)) {
    if (/\b(?:merge|review|delete)\b/i.test(String(procedure))) {
      error(`Forbidden change-request procedure: ${procedure}.`);
    }
  }
  if (seedCount < 3 || seedCount > 5) warn(`Expected 3-5 total seed records; found ${seedCount}.`);
  if (bases.length > 5)
    warn(`Large first version: ${bases.length} Bases. Confirm the user accepted this scope.`);

  return { errors, warnings };
}

export async function readBlueprint(filePath) {
  const raw = await readFile(path.resolve(filePath), "utf8");
  return JSON.parse(raw);
}

export async function resolveSdkVersion(requestedVersion) {
  if (requestedVersion) {
    if (!EXACT_VERSION.test(requestedVersion))
      throw new Error("--sdk-version must be an exact version.");
    return requestedVersion;
  }
  const { stdout } = await execFileAsync("npm", ["view", "busabase-sdk", "version", "--json"], {
    timeout: 30_000,
  });
  const version = JSON.parse(stdout);
  if (typeof version !== "string" || !EXACT_VERSION.test(version)) {
    throw new Error("npm returned an invalid busabase-sdk version.");
  }
  return version;
}

export async function verifyInstalledSdk(projectPath) {
  const probe = [
    'import("busabase-sdk")',
    ".then((sdk) => {",
    '  if (typeof sdk.createBusabaseClient !== "function") process.exit(2);',
    "})",
    ".catch((error) => { console.error(error.message); process.exit(1); });",
  ].join("");
  try {
    await execFileAsync(process.execPath, ["--input-type=module", "--eval", probe], {
      cwd: path.resolve(projectPath),
      timeout: 30_000,
    });
  } catch (error) {
    if (error?.code === 2)
      throw new Error("Installed busabase-sdk does not export createBusabaseClient.");
    throw new Error(
      `Unable to import installed busabase-sdk: ${error?.stderr || error?.message || error}`,
    );
  }
}

const pathExists = async (filePath) =>
  access(filePath)
    .then(() => true)
    .catch(() => false);

const ensureEmptyOutput = async (output) => {
  if (!(await pathExists(output))) return;
  const info = await stat(output);
  if (!info.isDirectory()) throw new Error(`Output exists and is not a directory: ${output}`);
  const entries = await readdir(output);
  if (entries.length > 0) throw new Error(`Refusing to overwrite non-empty output: ${output}`);
};

const resourceConfig = (resource) => ({
  ...resource,
  nodeId: resource.node_id,
  node_id: undefined,
});

const deploymentConfig = (blueprint) => ({
  appName: blueprint.app.name,
  appSlug: blueprint.app.slug,
  description: blueprint.app.description,
  locale: blueprint.app.locale,
  deployment: blueprint.app.deployment,
  spaceId: blueprint.app.space_id || "",
  readOnly: blueprint.app.read_only,
  brand: blueprint.app.brand || { mode: "inferred", accent: "#176B5B", logo_path: "" },
  schema: {
    folder: {
      name: blueprint.workspace.folder.name,
      slug: blueprint.workspace.folder.slug,
      nodeId: blueprint.workspace.folder.node_id,
    },
    bases: blueprint.workspace.bases.map((base) => ({
      key: base.key,
      name: base.name,
      slug: base.slug,
      nodeId: base.node_id,
      baseId: base.base_id,
      readLimit: base.read_limit ?? 50,
      description: base.description || "",
      fields: base.fields,
      views: asArray(base.views).map((view) => ({
        ...view,
        viewId: view.view_id,
        view_id: undefined,
      })),
    })),
    relations: blueprint.workspace.relations || [],
    docs: asArray(blueprint.workspace.docs).map(resourceConfig),
    drives: asArray(blueprint.workspace.drives).map(resourceConfig),
    whiteboards: asArray(blueprint.workspace.whiteboards).map(resourceConfig),
    forms: asArray(blueprint.workspace.forms).map(resourceConfig),
    workflows: asArray(blueprint.workspace.workflows).map(resourceConfig),
    html: asArray(blueprint.workspace.html).map(resourceConfig),
    vaultRequirements: blueprint.workspace.vault_requirements || [],
    integrations: blueprint.workspace.integrations || [],
  },
  ui: blueprint.ui,
  permissions: blueprint.permissions,
  demoRecords: blueprint.workspace.bases.flatMap((base) =>
    asArray(base.seed_records).map((fields, index) => ({
      id: `demo-${base.key}-${index + 1}`,
      baseKey: base.key,
      fields,
    })),
  ),
});

export async function scaffoldProject({
  blueprintPath,
  outputPath,
  sdkVersion,
  skipInstall = false,
}) {
  if (!blueprintPath) throw new Error("--blueprint is required.");
  if (!outputPath) throw new Error("--output is required.");
  const blueprint = await readBlueprint(blueprintPath);
  const result = validateBlueprint(blueprint);
  if (result.errors.length) throw new Error(`Blueprint invalid:\n- ${result.errors.join("\n- ")}`);
  const unmaterialized = [
    ...(!String(blueprint.workspace.folder.node_id || "").trim()
      ? ["workspace.folder.node_id"]
      : []),
    ...blueprint.workspace.bases.flatMap((base, index) => [
      ...(!String(base.node_id || "").trim() ? [`workspace.bases[${index}].node_id`] : []),
      ...(!String(base.base_id || "").trim() ? [`workspace.bases[${index}].base_id`] : []),
      ...asArray(base.views).flatMap((view, viewIndex) =>
        !String(view.view_id || "").trim()
          ? [`workspace.bases[${index}].views[${viewIndex}].view_id`]
          : [],
      ),
    ]),
    ...RESOURCE_COLLECTIONS.flatMap((collection) =>
      asArray(blueprint.workspace[collection]).flatMap((resource, index) =>
        !String(resource.node_id || "").trim() ? [`workspace.${collection}[${index}].node_id`] : [],
      ),
    ),
  ];
  if (unmaterialized.length) {
    throw new Error(
      `Blueprint must be materialized before scaffolding; missing:\n- ${unmaterialized.join("\n- ")}`,
    );
  }
  const version = await resolveSdkVersion(sdkVersion);
  const output = path.resolve(outputPath);
  await ensureEmptyOutput(output);
  await mkdir(output, { recursive: true });
  await cp(templateDir, output, { recursive: true });

  const packageTemplate = path.join(output, "package.json.template");
  const packageJson = (await readFile(packageTemplate, "utf8"))
    .replaceAll("__APP_SLUG__", blueprint.app.slug)
    .replaceAll("__SDK_VERSION__", version);
  await writeFile(path.join(output, "package.json"), packageJson, "utf8");
  await rm(packageTemplate);

  const configPath = path.join(output, "app", "js", "config.js");
  const configTemplate = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    configTemplate.replace("__APP_CONFIG__", JSON.stringify(deploymentConfig(blueprint), null, 2)),
    "utf8",
  );
  await writeFile(
    path.join(output, "airapp-blueprint.json"),
    `${JSON.stringify(blueprint, null, 2)}\n`,
    "utf8",
  );

  if (!skipInstall) {
    await execFileAsync("npm", ["install", "--save-exact"], { cwd: output, timeout: 120_000 });
    await verifyInstalledSdk(output);
    await execFileAsync("npm", ["run", "build:sdk"], { cwd: output, timeout: 120_000 });
  }
  await checkGeneratedProject(output, { requireBundle: !skipInstall });
  return { output, sdkVersion: version, warnings: result.warnings };
}

const collectTextFiles = async (root, current = root) => {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (["node_modules", ".git", "vendor"].includes(entry.name)) continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await collectTextFiles(root, fullPath)));
    else if (!/package-lock\.json$/.test(entry.name)) files.push(fullPath);
  }
  return files;
};

export async function checkGeneratedProject(projectPath, { requireBundle = true } = {}) {
  const root = path.resolve(projectPath);
  const required = [
    "package.json",
    "server.js",
    "airapp-blueprint.json",
    "app/index.html",
    "app/styles.css",
    "app/js/app.js",
    "app/js/config.js",
    "app/js/busabase-client.js",
    "app/js/providers/busabase-provider.js",
    "app/js/providers/demo-provider.js",
    "scripts/check.mjs",
  ];
  const missing = [];
  for (const relative of required)
    if (!(await pathExists(path.join(root, relative)))) missing.push(relative);
  const bundlePath = path.join(root, "app/vendor/busabase-sdk.js");
  if (requireBundle && !(await pathExists(bundlePath))) missing.push("app/vendor/busabase-sdk.js");
  if (missing.length) throw new Error(`Generated project missing: ${missing.join(", ")}`);

  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const sdkVersion = packageJson.dependencies?.["busabase-sdk"];
  if (!EXACT_VERSION.test(String(sdkVersion || "")))
    throw new Error("busabase-sdk must use an exact version.");
  if (!EXACT_VERSION.test(String(packageJson.devDependencies?.["esbuild-wasm"] || ""))) {
    throw new Error("esbuild-wasm must use an exact version.");
  }
  if (packageJson.scripts?.start !== "node server.js") {
    throw new Error("start must not build or spawn subprocesses.");
  }
  if (packageJson.dependencies?.react || packageJson.dependencies?.vite)
    throw new Error("React/Vite are forbidden.");
  if (requireBundle && (await stat(bundlePath)).size < 10_000)
    throw new Error("Browser SDK bundle is incomplete.");

  const blueprint = JSON.parse(await readFile(path.join(root, "airapp-blueprint.json"), "utf8"));
  const validation = validateBlueprint(blueprint);
  if (validation.errors.length)
    throw new Error(`Embedded blueprint invalid: ${validation.errors.join("; ")}`);
  if (
    !blueprint.workspace.folder.node_id ||
    blueprint.workspace.bases.some(
      (base) => !base.node_id || !base.base_id || asArray(base.views).some((view) => !view.view_id),
    ) ||
    RESOURCE_COLLECTIONS.some((collection) =>
      asArray(blueprint.workspace[collection]).some((resource) => !resource.node_id),
    )
  ) {
    throw new Error(
      "Embedded blueprint must include all materialized Folder/Node/Base/View/resource ids.",
    );
  }
  // `server.js` is checked separately: it is the one file allowed to mention a
  // credential, because its dev proxy reads it from the environment.
  const serverSource = await readFile(path.join(root, "server.js"), "utf8");
  const configSource = await readFile(path.join(root, "app/js/config.js"), "utf8");
  const configMatch = configSource.match(/^\s*export const appConfig = ([\s\S]+);\s*$/);
  if (!configMatch) throw new Error("Generated config must export one JSON appConfig object.");
  const appConfig = JSON.parse(configMatch[1]);
  const configuredBases = asArray(appConfig.schema?.bases);
  for (const [index, base] of configuredBases.entries()) {
    if (!Number.isInteger(base.readLimit) || base.readLimit < 1 || base.readLimit > 50) {
      throw new Error(`Configured Base ${base.key || index} has an invalid readLimit.`);
    }
    const expected = blueprint.workspace.bases[index]?.read_limit ?? 50;
    if (base.readLimit !== expected) {
      throw new Error(`Configured Base ${base.key || index} readLimit does not match blueprint.`);
    }
  }
  const files = await collectTextFiles(path.join(root, "app"));
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  if (!source.includes("createBusabaseClient"))
    throw new Error("SDK client integration is missing.");
  const providerSource = await readFile(
    path.join(root, "app/js/providers/busabase-provider.js"),
    "utf8",
  );
  if (!/limit:\s*base\.readLimit/.test(providerSource)) {
    throw new Error("Busabase provider must consume each configured Base readLimit.");
  }
  if (/while\s*\(\s*cursor\s*\)/.test(source))
    throw new Error("Automatic cursor exhaustion is forbidden during initial loading.");
  if (/client\.bases\.list\s*\(/.test(source))
    throw new Error("Runtime Base discovery is forbidden; use materialized Base ids.");
  // The app talks to its own origin in every environment — same-origin inside
  // Busabase, this project's dev proxy when run standalone. Anything absolute or
  // prefixed would only work in one of them.
  if (!source.includes("window.location.origin"))
    throw new Error("Runtime client must target its own origin.");
  if (source.includes("__busabase_api__"))
    throw new Error("Obsolete /__busabase_api__ bridge prefix found.");
  // Asset references must be RELATIVE. Under the Local Node engine the app is
  // reverse-proxied onto a sub-path of busabase's origin, so `src="/js/app.js"`
  // resolves against the origin root (busabase itself) and 404s — the app renders
  // under Nodepod but not under Local Node. `/api/v1/...` is deliberately absolute
  // and unaffected: it is an API call, not an asset.
  const absoluteAssetRef = /(?:src|href)="\/(?!\/)|from\s+["']\/(?!\/)/;
  if (absoluteAssetRef.test(source))
    throw new Error(
      "Absolute asset path found; use relative paths so the Local Node sub-path proxy works.",
    );
  const forbidden = [
    [/baseUrl\s*:\s*["'`]https?:\/\//, "hard-coded Busabase URL"],
    [/BUSABASE_API_KEY/i, "API key reference"],
    [/Bearer/i, "Bearer authorization"],
    [/\b(?:react|vite|jsx)\b/i, "frontend build stack"],
  ];
  for (const [pattern, label] of forbidden)
    if (pattern.test(source)) throw new Error(`Forbidden ${label} found in browser source.`);
  if (/Bearer\s+(?!\$\{)[A-Za-z0-9_-]{8,}/.test(serverSource))
    throw new Error("Literal Bearer token found in server.js.");
  return {
    ok: true,
    sdkVersion,
    deployment: blueprint.app.deployment,
    warnings: validation.warnings,
  };
}

const usage = () => {
  console.log(`Usage:
  airapp-kit.mjs validate-blueprint --blueprint <file>
  airapp-kit.mjs scaffold --blueprint <file> --output <dir> [--sdk-version <exact>] [--skip-install]
  airapp-kit.mjs check --project <dir>`);
};

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === "validate-blueprint") {
    const blueprint = await readBlueprint(flags.blueprint);
    const result = validateBlueprint(blueprint);
    console.log(JSON.stringify({ ok: result.errors.length === 0, ...result }, null, 2));
    if (result.errors.length) process.exitCode = 1;
    return;
  }
  if (command === "scaffold") {
    const result = await scaffoldProject({
      blueprintPath: flags.blueprint,
      outputPath: flags.output,
      sdkVersion: flags["sdk-version"],
      skipInstall: Boolean(flags["skip-install"]),
    });
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }
  if (command === "check") {
    console.log(JSON.stringify(await checkGeneratedProject(flags.project), null, 2));
    return;
  }
  usage();
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
