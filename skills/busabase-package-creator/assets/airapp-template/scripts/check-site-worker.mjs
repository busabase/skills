import { createRequire } from "node:module";
import path from "node:path";

// Parse the JavaScript itself. Comments and string literals describing import()
// are ordinary bundle content, not dependencies.
export async function checkSiteWorker(root) {
  const require = createRequire(path.join(root, "package.json"));
  const { build } = require("esbuild-wasm");
  const result = await build({
    entryPoints: [path.join(root, "vendor/worker.js")],
    write: false,
    metafile: true,
    bundle: false,
    format: "esm",
    platform: "neutral",
    logLevel: "silent",
  });
  const outputs = Object.values(result.metafile.outputs);
  if (
    outputs.length !== 1 ||
    outputs[0].imports.length ||
    !outputs[0].exports.includes("default")
  ) {
    throw new Error(
      "Site Worker must be a bundled import-free module with a default export; run npm run build:site.",
    );
  }
}
