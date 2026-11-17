#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { parseStrictJson } from "./lib/strict-json.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const mcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const pluginNamePattern = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;
const skillNamePattern = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

async function readJson(relativePath) {
  return parseStrictJson(await readFile(path.join(root, relativePath)), relativePath);
}

function assertOnlyKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    assert(allowedKeys.has(key), `${label} contains unsupported key: ${key}`);
  }
}

function validatePluginManifest(plugin) {
  assertOnlyKeys(
    plugin,
    new Set([
      "$schema",
      "name",
      "version",
      "description",
      "author",
      "homepage",
      "repository",
      "license",
      "keywords",
      "extensions",
    ]),
    "plugin.json",
  );
  assert.equal(plugin.$schema, pluginSchema);
  assert.match(plugin.name, pluginNamePattern);

  for (const key of ["version", "description", "homepage", "repository", "license"]) {
    if (key in plugin) assert.equal(typeof plugin[key], "string", `${key} must be a string`);
  }

  if (plugin.author) {
    assert.equal(typeof plugin.author, "object");
    assertOnlyKeys(plugin.author, new Set(["name", "email", "url"]), "plugin.json author");
    for (const value of Object.values(plugin.author)) assert.equal(typeof value, "string");
  }

  if (plugin.keywords) {
    assert(Array.isArray(plugin.keywords));
    for (const keyword of plugin.keywords) assert.equal(typeof keyword, "string");
  }

  if (plugin.extensions) assert.equal(typeof plugin.extensions, "object");
}

function validateMcpServer(name, server) {
  assert.equal(typeof server, "object", `MCP server ${name} must be an object`);

  if (server.type === "stdio") {
    assertOnlyKeys(
      server,
      new Set(["type", "command", "args", "env", "cwd"]),
      `MCP server ${name}`,
    );
    assert.equal(typeof server.command, "string");
    if (server.command.startsWith(".")) assert(server.command.startsWith("./"));
    if (server.args) {
      assert(Array.isArray(server.args));
      for (const argument of server.args) assert.equal(typeof argument, "string");
    }
    if (server.env) {
      assert.equal(typeof server.env, "object");
      for (const value of Object.values(server.env)) assert.equal(typeof value, "string");
    }
    if (server.cwd?.startsWith(".")) assert(server.cwd.startsWith("./"));
    return;
  }

  assert(
    ["streamable-http", "sse"].includes(server.type),
    `Unsupported MCP transport: ${server.type}`,
  );
  assertOnlyKeys(server, new Set(["type", "url", "headers"]), `MCP server ${name}`);
  const url = new URL(server.url);
  assert(["http:", "https:"].includes(url.protocol));
  assert.equal(url.username, "");
  assert.equal(url.password, "");
  assert.equal(url.hash, "");
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname))
    assert.equal(url.protocol, "https:");
  if (server.headers) {
    assert.equal(typeof server.headers, "object");
    for (const value of Object.values(server.headers)) assert.equal(typeof value, "string");
  }
}

function validateMcpConfig(mcp) {
  assertOnlyKeys(mcp, new Set(["$schema", "mcpServers"]), "mcp.json");
  assert.equal(mcp.$schema, mcpSchema);
  assert.equal(typeof mcp.mcpServers, "object");
  for (const [name, server] of Object.entries(mcp.mcpServers)) validateMcpServer(name, server);
}

async function validateSkills() {
  const skillsRoot = path.join(root, "skills");
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const skillDirectories = entries.filter((entry) => entry.isDirectory());
  assert(skillDirectories.length > 0, "skills/ must contain at least one skill");

  for (const entry of skillDirectories) {
    const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
    assert((await stat(skillPath)).isFile(), `${entry.name}/SKILL.md must be a regular file`);
    const content = await readFile(skillPath, "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    assert(match, `${entry.name}/SKILL.md must start with YAML frontmatter`);

    // Only the TOP-LEVEL keys are checked below, so only top-level lines are
    // parsed: an indented line belongs to a nested mapping or a list, and
    // demanding a `key: value` shape from those rejected ordinary YAML. A list
    // like `metadata.tags` passed only because every item happened to contain a
    // colon of its own.
    const frontmatter = Object.fromEntries(
      match[1]
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith(" ") && !line.startsWith("\t"))
        .filter((line) => !line.trimStart().startsWith("#"))
        .map((line) => {
          const separator = line.indexOf(":");
          assert(separator > 0, `${entry.name}/SKILL.md has invalid frontmatter: ${line}`);
          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
        }),
    );

    assertOnlyKeys(
      frontmatter,
      new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]),
      `${entry.name}/SKILL.md frontmatter`,
    );
    assert.equal(frontmatter.name, entry.name);
    assert.match(frontmatter.name, skillNamePattern);
    assert(frontmatter.description?.length >= 1 && frontmatter.description.length <= 1024);
  }
}

async function validateClientCompatibility() {
  const claude = await readJson("claude/.claude-plugin/plugin.json");
  assert.equal(claude.name, "busabase");
  assert.equal(claude.skills, "./skills/");
  assert.equal(claude.mcpServers, "./.mcp.json");

  const codex = await readJson("plugins/busabase/.codex-plugin/plugin.json");
  assert.equal(codex.name, "busabase");
  assert.equal(codex.skills, "./skills/");
  assert.equal(codex.mcpServers, "./.mcp.json");

  const rootLegacyMcp = await readJson(".mcp.json");
  assert.equal(rootLegacyMcp.mcpServers.busabase.url, "http://localhost:15419/api/mcp");
  const claudeMcp = await readJson("claude/.mcp.json");
  assert.equal(claudeMcp.mcpServers.busabase.url, "https://busabase.com/api/mcp");
  const codexMcp = await readJson("plugins/busabase/.mcp.json");
  assert.equal(codexMcp.mcpServers.busabase.url, "https://busabase.com/api/mcp");
}

validatePluginManifest(await readJson("plugin.json"));
validateMcpConfig(await readJson("mcp.json"));
/**
 * The plugin-bundled `busabase` skills are what a plugin user's agent reads
 * first. Both must open every task by reading the space instructions and then looking
 * up a playbook, so an edit to one of them cannot quietly drop the rule the
 * other still carries.
 */
async function validatePlaybookRule() {
  const heading =
    "**Before you work anything out, read the space instructions, then look for a playbook.**";
  for (const skillPath of [
    "claude/skills/busabase/SKILL.md",
    "plugins/busabase/skills/busabase/SKILL.md",
    "workbuddy/skills/busabase/SKILL.md",
    "doubao/skills/busabase/SKILL.md",
    ...["gemini", "cursor", "grok", "kimi", "kiro", "copilot", "perplexity", "antigravity"].map(
      (client) => `${client}/skills/busabase/SKILL.md`,
    ),
  ]) {
    const content = await readFile(path.join(root, skillPath), "utf8");
    assert(content.includes(heading), `${skillPath} must carry the playbook-first rule`);
    assert(
      content.includes("`space_instructions_get`"),
      `${skillPath} must name space_instructions_get`,
    );
    assert(content.includes("`playbooks_search`"), `${skillPath} must name playbooks_search`);
    assert(content.includes("`playbooks_get`"), `${skillPath} must name playbooks_get`);
  }
}

/**
 * The WorkBuddy connector is submitted to WorkBuddy's marketplace rather than
 * installed from this repo, and its review rejected a package that omitted the
 * server-side OAuth declaration. Pin the fields that review checks.
 */
async function validateWorkBuddyConnector() {
  const meta = await readJson("workbuddy/connector-meta.json");
  assert.equal(meta.type, "mcp");
  assert.equal(meta.source, "busabase");
  assert.match(meta.version, /^\d+\.\d+\.\d+$/);
  for (const field of ["name_zh", "name_en", "description_zh", "description_en"]) {
    assert(
      typeof meta[field] === "string" && meta[field].length > 0,
      `connector-meta.json ${field}`,
    );
  }
  for (const field of ["examples_zh", "examples_en"]) {
    assert(Array.isArray(meta[field]) && meta[field].length > 0, `connector-meta.json ${field}`);
  }
  assert.equal(meta.auth_mode, "server-side");
  assert.equal(meta.server_auth?.auth_type, "mcp_oauth");
  const oauth = meta.server_auth?.data?.mcp_oauth;
  assert.equal(oauth?.server_url, "https://busabase.com/api/mcp");
  for (const reserved of ["client_id", "client_secret", "redirect_uri"]) {
    assert(
      !(reserved in (oauth ?? {})),
      `server_auth must not set ${reserved}; WorkBuddy writes it`,
    );
  }
  // server_auth takes effect from WorkBuddy 4.24.0.
  const [major, minor] = String(meta.minWorkbuddyVersion).split(".").map(Number);
  assert(major > 4 || (major === 4 && minor >= 24), "minWorkbuddyVersion must be >= 4.24.0");

  const mcp = await readJson("workbuddy/mcp.json");
  const servers = Object.entries(mcp.mcpServers ?? {});
  assert.equal(servers.length, 1, "workbuddy/mcp.json must hold exactly one server");
  assert.equal(servers[0][1].type, "streamableHttp");
  assert.equal(servers[0][1].url, oauth.server_url);

  await stat(path.join(root, "workbuddy/icon.svg"));
}

async function validateDoubaoPlugin() {
  const plugin = await readJson("doubao/plugin.json");
  assert.equal(plugin.name, "busabase");
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
  assertOnlyKeys(
    plugin,
    new Set(["name", "version", "description", "extensions"]),
    "Doubao plugin",
  );
  const display = plugin.extensions["com.doubao"];
  const mcp = await readJson("doubao/mcp.json");
  assert.deepEqual(Object.keys(mcp.mcpServers), ["busabase"]);
  assert.deepEqual(Object.keys(display.mcpServers), ["busabase"]);
  assert.deepEqual(mcp.mcpServers.busabase, {
    type: "streamable-http",
    url: "https://busabase.com/api/mcp",
  });
  for (const item of [display, display.mcpServers.busabase]) {
    assert(item.displayName.zh.trim());
    assert(item.displayDescription.zh.trim());
    assert.equal(item.icon, "./com.doubao/assets/plugin-icon.png");
  }
  const source = await readFile(path.join(root, "doubao/skills/busabase/SKILL.md"), "utf8");
  const description = JSON.parse(source.match(/^description: (".*")$/m)[1]);
  assert([...description].length <= 300, "Doubao discovery description exceeds 300 code points");
  for (const file of ["com.doubao/assets/plugin-icon.png", "skills/busabase/assets/icon.png"]) {
    const png = await readFile(path.join(root, "doubao", file));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 512);
    assert(png.length <= 500 * 1024);
  }
}

await validateSkills();
await validatePlaybookRule();
await validateClientCompatibility();
await validateWorkBuddyConnector();

async function validateNativeAdapters() {
  for (const [descriptor, source] of [
    [".github/plugin/marketplace.json", "./copilot"],
    [".cursor-plugin/marketplace.json", "./cursor"],
  ]) {
    const marketplace = await readJson(descriptor);
    assert.equal(marketplace.name, "busabase");
    assert.equal(marketplace.plugins.length, 1);
    assert.equal(marketplace.plugins[0].name, "busabase");
    assert.equal(marketplace.plugins[0].source, source);
    await stat(path.join(root, source, "skills/busabase/SKILL.md"));
  }
  const endpoint = "https://busabase.com/api/mcp";
  for (const client of ["cursor", "kiro", "copilot", "perplexity"]) {
    validatePluginManifest(await readJson(`${client}/plugin.json`));
    const config = await readJson(`${client}/mcp.json`);
    validateMcpConfig(config);
    assert.deepEqual(config.mcpServers, {
      busabase: { type: "streamable-http", url: endpoint },
    });
  }
  for (const [client, filename] of [
    ["gemini", "gemini-extension.json"],
    ["grok", ".grok-plugin/plugin.json"],
    ["kimi", "kimi.plugin.json"],
    ["antigravity", "plugin.json"],
    ["minimax", ".minimax-plugin/plugin.json"],
  ]) {
    const manifest = await readJson(`${client}/${filename}`);
    assert.equal(manifest.name, "busabase");
    assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
    let config = manifest;
    if (client === "grok") config = await readJson("grok/.mcp.json");
    if (client === "antigravity") config = await readJson("antigravity/mcp_config.json");
    if (client === "minimax") {
      assert.deepEqual(manifest.mcpServers, []);
      assert.deepEqual(manifest.apps, []);
      const canonical = path.join(root, "skills/busabase");
      const actual = path.join(root, "minimax/skills/busabase");
      const compare = async (relative = "") => {
        const entries = await readdir(path.join(canonical, relative), {
          withFileTypes: true,
        });
        assert.deepEqual(
          (await readdir(path.join(actual, relative))).sort(),
          entries.map((e) => e.name).sort(),
        );
        for (const entry of entries) {
          const name = path.join(relative, entry.name);
          if (entry.isDirectory()) await compare(name);
          else
            assert.deepEqual(
              await readFile(path.join(actual, name)),
              await readFile(path.join(canonical, name)),
            );
        }
      };
      await compare();
    } else {
      const expected =
        client === "gemini"
          ? { httpUrl: endpoint }
          : client === "antigravity"
            ? { serverUrl: endpoint }
            : client === "grok"
              ? { type: "http", url: endpoint, oauth_resource: endpoint }
              : { url: endpoint };
      assert.deepEqual(config.mcpServers, { busabase: expected });
    }
  }
}

await validateDoubaoPlugin();
await validateNativeAdapters();
console.log("Agent Plugins v1.0.0 package and client compatibility checks passed.");
