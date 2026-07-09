#!/usr/bin/env node
/**
 * Update package.json appStatus fields
 *
 * Updates appStatus in package.json with:
 * - Port numbers
 * - Descriptions
 * - Theme alignment status
 *
 * Usage: node update-app-status.mjs [app-name]
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const APPS_DIR = join(ROOT_DIR, "apps");

// Port mappings
const PORT_MAPPINGS = {
  productready: 3000,
  npschimp: 3050,
  incorpbase: 3012,
  productdrone: 3013,
  sandock: 3030,
  cashlens: 3090,
  apppods: 3095,
  notesite: 3007,
  previewfile: 3707,
  grello: 3010,
  maildrone: 3002,
  geodrone: 3005,
  gitradar: 3040,
  lastbackup: 3018,
  slidesfilm: 3003,
  storybio: 3015,
};

// Description mappings
const DESCRIPTION_MAPPINGS = {
  productready: "The Product Ready Boilerplate",
  statusdrone: "Uptime monitoring",
  incorpbase: "Company registration",
  fapiaomei: "Invoice management",
  productdrone: "AI collaboration tool",
  sandock: "Development sandbox",
  npschimp: "NPS survey tool",
  maildrone: "Email campaign management",
  geodrone: "Location-based services",
  gitradar: "GitHub repository analytics",
  lastbackup: "Backup solution",
  slidesfilm: "Presentation and slides",
  storybio: "AI-powered biography",
};

// Theme alignment status
const THEME_ALIGNMENT = {
  productready: true,
  statusdrone: true,
  maildrone: true,
  sandock: true,
  cashlens: true,
  emmacmo: true,
  incorpbase: true,
  productdrone: true,
  npschimp: "partial",
  previewfile: "partial",
};

function updateAppStatus(appName) {
  const appPath = join(APPS_DIR, appName);
  const packageJsonPath = join(appPath, "package.json");

  if (!existsSync(packageJsonPath)) {
    console.log(`❌ ${appName}: package.json not found`);
    return null;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (!packageJson.appStatus) {
    console.log(`⚠️  ${appName}: No appStatus field, skipping`);
    return null;
  }

  let updated = false;

  // Update port
  if (!packageJson.appStatus.port && PORT_MAPPINGS[appName]) {
    packageJson.appStatus.port = PORT_MAPPINGS[appName];
    updated = true;
    console.log(`  ✓ Updated port: ${PORT_MAPPINGS[appName]}`);
  }

  // Update description
  if (!packageJson.appStatus.description || packageJson.appStatus.description === "") {
    if (DESCRIPTION_MAPPINGS[appName]) {
      packageJson.appStatus.description = DESCRIPTION_MAPPINGS[appName];
      updated = true;
      console.log(`  ✓ Updated description: ${DESCRIPTION_MAPPINGS[appName]}`);
    } else if (packageJson.description) {
      packageJson.appStatus.description = packageJson.description;
      updated = true;
      console.log(`  ✓ Updated description from package.json`);
    }
  }

  // Update theme alignment
  if (packageJson.appStatus.theme && THEME_ALIGNMENT[appName]) {
    const newAlignment = THEME_ALIGNMENT[appName];
    if (packageJson.appStatus.theme.aligned !== newAlignment) {
      packageJson.appStatus.theme.aligned = newAlignment;
      updated = true;
      console.log(`  ✓ Updated theme alignment: ${newAlignment}`);
    }
  }

  if (updated) {
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log(`✅ Updated ${appName}\n`);
    return { appName, updated: true };
  }

  console.log(`  ${appName}: Already up-to-date\n`);
  return { appName, updated: false };
}

function main() {
  const args = process.argv.slice(2);
  const targetApp = args[0];

  console.log("🔄 Updating appStatus fields...\n");

  if (targetApp) {
    // Update specific app
    updateAppStatus(targetApp);
  } else {
    // Update all apps
    const apps = readdirSync(APPS_DIR).filter((name) => {
      const appPath = join(APPS_DIR, name);
      return existsSync(join(appPath, "package.json"));
    });

    let updatedCount = 0;

    for (const appName of apps) {
      const result = updateAppStatus(appName);
      if (result?.updated) {
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} apps`);
    console.log(`📊 Total apps processed: ${apps.length}`);
  }
}

main();
