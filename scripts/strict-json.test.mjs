import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseStrictJson } from "./lib/strict-json.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("rejects decoded duplicate keys, including arrays, Unicode and escapes", () => {
  for (const source of [
    '{"version":1,"version":2}',
    String.raw`{"mcpServers":{"busabase":{},"\u0062usabase":{}}}`,
    String.raw`{"items":[{"层":1,"\u5c42":2}]}`,
    String.raw`{"items":[{"\uD83D\uDE00":1,"😀":2}]}`,
    '{"nested":{"headers":{"Authorization":"private"},"headers":{}}}',
  ]) {
    assert.throws(() => parseStrictJson(source, "release.json"), /duplicate JSON object key/);
  }
});

test("does not confuse repeated keys in separate objects or key-looking string values", () => {
  for (const source of [
    '{"one":{"name":"a"},"two":{"name":"b"}}',
    '[{"name":"a"},{"name":"b"}]',
    String.raw`{"text":"\"name\":{}","name":"fine"}`,
    String.raw`{"层":"中文","😀":"emoji","\u0061":1,"b":"\u0061"}`,
  ]) {
    assert.deepEqual(parseStrictJson(source, "release.json"), JSON.parse(source));
  }
});

test("never echoes malformed or overwritten credential values", () => {
  for (const source of [
    '{"token":"PRIVATE_FIXTURE_SENTINEL"',
    '{"token":"PRIVATE_FIXTURE_SENTINEL","token":"public"}',
    Buffer.from([0x7b, 0x22, 0xff, 0x22, 0x3a, 0x31, 0x7d]),
  ]) {
    assert.throws(() => parseStrictJson(source, "release.json"), (error) => {
      assert.match(error.message, /release\.json/);
      assert.doesNotMatch(error.message, /PRIVATE_FIXTURE_SENTINEL/);
      return true;
    });
  }
});

test("missing Python fails closed without a JSON.parse fallback", () => {
  const helper = fileURLToPath(new URL("./lib/strict-json.mjs", import.meta.url));
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", [
    `import {parseStrictJson} from ${JSON.stringify(helper)};`,
    "try { parseStrictJson('{}', 'release.json'); process.exit(2); }",
    "catch (error) { console.log(error.message); }",
  ].join("\n")], {
    env: { ...process.env, PATH: path.join(root, "missing-interpreter-directory") },
    encoding: "utf8",
  });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /Python 3 is required for strict JSON release validation/);
});

test("actual repository validator rejects overwritten manifest and MCP bytes", async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "busabase-public-json-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const checkout = path.join(temp, "checkout");
  await cp(root, checkout, {
    recursive: true,
    filter: (source) => ![".git", "node_modules"].includes(path.basename(source)),
  });
  const manifestPath = path.join(checkout, "doubao/plugin.json");
  const originalManifest = await readFile(manifestPath, "utf8");
  const mcpPath = path.join(checkout, "doubao/mcp.json");
  const originalMcp = await readFile(mcpPath, "utf8");
  const server = JSON.parse(originalMcp).mcpServers.busabase;
  for (const [target, bad, original] of [
    [manifestPath, `{"version":"0.0.0",${originalManifest.trimStart().slice(1)}`, originalManifest],
    [mcpPath, `{"mcpServers":{"busabase":{"headers":{"Authorization":"PRIVATE_FIXTURE_SENTINEL"}},"busabase":${JSON.stringify(server)}}}`, originalMcp],
  ]) {
    await writeFile(target, bad);
    const checked = spawnSync(process.execPath, [path.join(checkout, "scripts/validate-agent-plugin.mjs")], {
      cwd: checkout,
      encoding: "utf8",
    });
    assert.notEqual(checked.status, 0);
    assert.match(checked.stderr, /duplicate JSON object key/);
    assert.doesNotMatch(checked.stderr, /PRIVATE_FIXTURE_SENTINEL/);
    await writeFile(target, original);
  }
});
