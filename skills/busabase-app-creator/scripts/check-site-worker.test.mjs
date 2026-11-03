import assert from "node:assert/strict";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkSiteWorker } from "../assets/airapp-template/scripts/check-site-worker.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "site-worker-parse-"));
await mkdir(path.join(root, "vendor"));
await mkdir(path.join(root, "node_modules"));
await writeFile(path.join(root, "package.json"), '{"type":"module"}');
await symlink(
  path.dirname(createRequire(import.meta.url).resolve("esbuild/package.json")),
  path.join(root, "node_modules/esbuild-wasm"),
  "dir",
);

test("parses real Worker imports and exports, ignoring comments and strings", async () => {
  await writeFile(
    path.join(root, "vendor/worker.js"),
    `// inline import() of an ESM path
const text = ${JSON.stringify('import("not-a-dependency")')};
export default { fetch() { return new Response(text); } };`,
  );
  await checkSiteWorker(root);
  for (const source of [
    'import value from "external"; export default value;',
    'export default { fetch() { return import("external"); } };',
    'export const fetch = () => new Response("no default");',
  ]) {
    await writeFile(path.join(root, "vendor/worker.js"), source);
    await assert.rejects(checkSiteWorker(root), /bundled import-free module/);
  }
});
