import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

type Json = Record<string, unknown>;
const root = new URL("..", import.meta.url).pathname;

// The files are JSONC (comments allowed); strip whole-line // comments, keeping strings intact.
const readJsonc = (file: string): Json =>
  JSON.parse(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n"),
  ) as Json;

const flavours = [
  { dir: "base44/workflows", activity: "invoke_backend_function", target: "function_name" },
  { dir: "tanstack/base44/workflows", activity: "invoke_server_route", target: "path" },
];

for (const { dir, activity, target } of flavours) {
  const files = readdirSync(join(root, dir)).filter((f) => f.endsWith(".jsonc"));

  test(`${dir}: ${files.length} workflows follow Base44's documented authoring rules`, () => {
    assert.equal(files.length, 3);
    for (const file of files) {
      const wf = readJsonc(join(root, dir, file));
      assert.ok(wf.name && wf.description && wf.trigger && wf.definition, file);
      const trigger = (wf.trigger as { config: Json }).config;
      assert.ok(["entity", "scheduled"].includes(String(trigger.trigger_type)), file);
      const doc = (wf.definition as { document: Json }).document;
      assert.deepEqual([doc.dsl, doc.namespace], ["1.0.0", "base44"]);
      assert.match(String(doc.name), /^[a-z0-9_]+$/);

      const tasks = (wf.definition as { do: Record<string, Json>[] }).do;
      const names = tasks.map((t) => Object.keys(t)[0]);
      tasks.forEach((entry, i) => {
        const [name, task] = Object.entries(entry)[0];
        assert.match(name, /^[a-z][a-z0-9_]*$/, "task names are snake_case");
        assert.equal(task.call, activity);
        // every call task needs an explicit `then`: the next task or "end"
        assert.ok(
          task.then === "end" || names.includes(String(task.then)),
          `${file}: ${name}.then`,
        );
        assert.equal(task.then === "end", i === tasks.length - 1);
        // no secret ever goes in a workflow
        assert.doesNotMatch(JSON.stringify(task.with), /bb_|secret|api[_-]?key|token/i);
        assert.ok((task.with as Json)[target]);
      });
    }
  });
}

test("backend-function workflows call functions that exist; server-route workflows call the shipped route", () => {
  for (const file of readdirSync(join(root, "base44/workflows"))) {
    const wf = JSON.stringify(readJsonc(join(root, "base44/workflows", file)));
    for (const [, name] of wf.matchAll(/"function_name":"([^"]+)"/g)) {
      assert.ok(existsSync(join(root, "base44/functions", name, "entry.ts")), name);
    }
  }
  const route = readFileSync(join(root, "tanstack/src/routes/api/busabase-sync.js"), "utf8");
  for (const file of readdirSync(join(root, "tanstack/base44/workflows"))) {
    const wf = JSON.stringify(readJsonc(join(root, "tanstack/base44/workflows", file)));
    for (const [, path] of wf.matchAll(/"path":"([^"]+)"/g))
      assert.ok(route.includes(`createFileRoute("${path}")`), path);
  }
});

test("order and customer workflows pass the entity name the mapping table uses", () => {
  const mappings = readFileSync(join(root, "base44/shared/mappings.ts"), "utf8");
  for (const entity of ["Order", "Customer"]) {
    assert.ok(mappings.includes(`entity: "${entity}"`));
    for (const dir of ["base44/workflows", "tanstack/base44/workflows"]) {
      const file = readdirSync(join(root, dir)).find((f) => f.includes(`${entity}s`));
      assert.ok(
        file && readFileSync(join(root, dir, file), "utf8").includes(`"entity": "${entity}"`),
        `${dir} ${entity}`,
      );
    }
  }
});
