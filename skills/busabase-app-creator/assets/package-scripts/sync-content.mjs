#!/usr/bin/env node
/**
 * Regenerate a template package's `content/` from the app's own declaration,
 * or verify it is current.
 *
 *   node scripts/sync-content.mjs           # rewrite content/
 *   node scripts/sync-content.mjs --check   # exit non-zero if stale (use in CI)
 *
 * Copy this into `<package>/scripts/` and run it from the package root.
 *
 * The app declaration is canonical because the app must be able to provision
 * its own resources at runtime, and it cannot read `content/` from inside the
 * installed node. Deriving the package sidecars from it is what keeps the two
 * provisioning routes — `busabase-cli install` reading `base.json`, and the app
 * calling `provisionDeclaredResources` — from landing on different Bases.
 *
 * Hand-editing `content/**\/base.json` is therefore never correct: the next run
 * of this script overwrites it, and until then the two routes disagree.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");

const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

/**
 * Which `content/` directory holds the app. Declared by a template
 * (`template.airapp`, or the `primary` of `template.airapps`); a plain package
 * does not declare one, so fall back to the single directory that looks like an
 * app. Ambiguity is reported rather than guessed — picking the wrong app here
 * would silently regenerate `content/` from another app's schema.
 */
async function resolveAppDirectory() {
  const manifest = await readJson("busabase.json").catch(() => ({}));
  const declared =
    manifest.template?.airapp ??
    manifest.template?.airapps?.find((entry) => entry.role === "primary")?.slug;
  if (declared) return declared;

  const entries = await readdir(path.join(root, "content"), { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const config = path.join(root, "content", entry.name, "app", "js", "config.js");
    if (
      await readFile(config, "utf8")
        .then(() => true)
        .catch(() => false)
    ) {
      candidates.push(entry.name);
    }
  }
  if (candidates.length === 1) return candidates[0];
  throw new Error(
    candidates.length
      ? `Several content/ directories look like apps (${candidates.join(", ")}). Declare template.airapp in busabase.json.`
      : "No content/<name>/app/js/config.js found. Run this from the package root.",
  );
}

const appDirectory = await resolveAppDirectory();
const { appConfig } = await import(
  path.join(root, "content", appDirectory, "app", "js", "config.js")
);

const stale = [];
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

const emit = async (relativePath, contents) => {
  const target = path.join(root, relativePath);
  if (check) {
    const current = await readFile(target, "utf8").catch(() => null);
    if (current !== contents) stale.push(relativePath);
    return;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
};

let position = 0;
for (const base of appConfig.bases ?? []) {
  await emit(
    `content/${base.key}/base.json`,
    json({
      name: base.name,
      description: base.description ?? "",
      position: position++,
      fields: (base.fields ?? []).map((field, index) => ({
        slug: field.slug,
        name: field.name,
        type: field.type,
        required: Boolean(field.required),
        position: index,
        options: {
          ...(field.options ?? {}),
          // A relation points at another Base *in this package*, by its content/
          // directory name — which is not what the field carries at runtime, so
          // the mapping lives beside the schema rather than inside the field.
          ...(appConfig.templateRelations?.[`${base.key}.${field.slug}`]
            ? { targetBaseSlug: appConfig.templateRelations[`${base.key}.${field.slug}`] }
            : {}),
        },
      })),
      views: [],
    }),
  );
}

if (appConfig.drive) {
  await emit(
    `content/${appDirectory.replace(/-app$/, "")}-files/_node.json`,
    json({
      type: "drive",
      name: appConfig.drive.name,
      description: appConfig.drive.description ?? "",
      position: position++,
    }),
  );
}

await emit(
  "content/_folder.json",
  json({ name: appConfig.folder.name, description: appConfig.folder.description ?? "" }),
);

if (check && stale.length > 0) {
  console.error(
    `content/ is out of date with ${appDirectory}'s config.js:\n${stale
      .map((item) => `  ${item}`)
      .join("\n")}\n\nRun: node scripts/sync-content.mjs`,
  );
  process.exit(1);
}
console.log(check ? "content/ is up to date." : "content/ regenerated from config.js.");
