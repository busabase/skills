#!/usr/bin/env node
/**
 * Generate App Status table for README from package.json
 * Reads appStatus from each app's package.json and generates markdown table
 *
 * Usage: node scripts/generate-app-status-table.mjs
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const APPS_DIR = join(process.cwd(), "apps");

function getAppStatus(appName) {
  const packageJsonPath = join(APPS_DIR, appName, "package.json");

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.appStatus || null;
  } catch {
    return null;
  }
}

function formatCheck(value) {
  return value ? "✓" : "✗";
}

function generateTableRow(appName) {
  const status = getAppStatus(appName);

  if (!status) {
    return null;
  }

  const port = status.port || "-";
  const description = status.description || "";
  const statusIcon = status.status || "";

  const row = [
    `[${appName.charAt(0).toUpperCase() + appName.slice(1)}](apps/${appName}/)`,
    port,
    description,
    statusIcon,
    formatCheck(status.specs?.prd),
    formatCheck(status.specs?.icp),
    formatCheck(status.specs?.marketing),
    formatCheck(status.specs?.onboarding),
    formatCheck(status.specs?.designSystem),
    formatCheck(status.specs?.vi),
    formatCheck(status.structure?.content),
    formatCheck(status.structure?.langRoutes),
    formatCheck(status.legal?.privacy),
    formatCheck(status.legal?.terms),
    formatCheck(status.legal?.brand),
    formatCheck(status.theme?.aligned),
    formatCheck(status.features?.footer),
    formatCheck(status.features?.auth),
    formatCheck(status.features?.pricing),
    formatCheck(status.features?.icon),
    formatCheck(status.features?.screenshots),
    formatCheck(status.monitoring?.health),
    formatCheck(status.monitoring?.buildInfo),
    formatCheck(status.monitoring?.cron),
    formatCheck(status.backend?.admin),
    formatCheck(status.backend?.adminMcp),
    formatCheck(status.backend?.openapi),
    formatCheck(status.backend?.userMcp),
    formatCheck(status.integrations?.email),
    formatCheck(status.integrations?.billing),
    `${status.qualityScore || 0}%`,
  ];

  return `| ${row.join(" | ")} |`;
}

function main() {
  console.log("Generating App Status table from package.json files...\n");

  // Get all apps
  const apps = readdirSync(APPS_DIR)
    .filter((name) => {
      const appPath = join(APPS_DIR, name);
      return existsSync(join(appPath, "package.json"));
    })
    .filter((name) => getAppStatus(name) !== null);

  // Sort by quality score (descending)
  apps.sort((a, b) => {
    const statusA = getAppStatus(a);
    const statusB = getAppStatus(b);
    return (statusB?.qualityScore || 0) - (statusA?.qualityScore || 0);
  });

  console.log(`Found ${apps.length} apps with appStatus\n`);

  // Generate table header
  const header = `| App | Port | Description | Status | PRD | ICP | Marketing | Onboarding | DS | VI | Content | [lang] | Privacy | Terms | Brand | Theme | Footer | Auth | Pricing | Icon | Screenshots | Health | BuildInfo | Cron | Admin | AdminMCP | OpenAPI | UserMCP | Email | Billing | 质量评分 |`;
  const separator = `| ${"--".repeat(16)} | ---- | ----------------------------- | -------- | --- | --- | --------- | ---------- | --- | --- | ------- | ------ | ------- | ----- | ----- | ----- | ------ | ---- | ------- | ---- | ----------- | ------ | --------- | ---- | ----- | -------- | ------- | ------- | ----- | ------- | -------- |`;

  console.log(header);
  console.log(separator);

  for (const appName of apps) {
    const row = generateTableRow(appName);
    if (row) {
      console.log(row);
    }
  }

  console.log("\n✅ Table generated successfully");
  console.log("\n💡 Copy the output above and replace the table in README.md");
}

main();
