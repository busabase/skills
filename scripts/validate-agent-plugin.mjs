#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const mcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const pluginNamePattern = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/;
const skillNamePattern = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
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
    assertOnlyKeys(server, new Set(["type", "command", "args", "env", "cwd"]), `MCP server ${name}`);
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

  assert(["streamable-http", "sse"].includes(server.type), `Unsupported MCP transport: ${server.type}`);
  assertOnlyKeys(server, new Set(["type", "url", "headers"]), `MCP server ${name}`);
  const url = new URL(server.url);
  assert(["http:", "https:"].includes(url.protocol));
  assert.equal(url.username, "");
  assert.equal(url.password, "");
  assert.equal(url.hash, "");
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) assert.equal(url.protocol, "https:");
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

    const frontmatter = Object.fromEntries(
      match[1]
        .split("\n")
        .filter((line) => line.trim())
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
await validateSkills();
await validateClientCompatibility();

console.log("Agent Plugins v1.0.0 package and client compatibility checks passed.");
