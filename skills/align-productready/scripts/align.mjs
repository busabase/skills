#!/usr/bin/env node
/**
 * ProductReady Alignment Script
 *
 * The main script for aligning apps with apps/productready.
 * Supports three scenarios:
 * 1. Active Audit: Check and fix specific app
 * 2. Propagate Forward: Apply productready changes to other apps
 * 3. Backport & Verify: Check compliance and backport improvements
 *
 * Usage:
 *   node align.mjs <app-name> --check      # Scenario 1: Check alignment
 *   node align.mjs <app-name> --fix        # Scenario 1: Fix alignment
 *   node align.mjs <app-name> --diff       # Scenario 1: Show detailed diff
 *   node align.mjs --all                   # Scenario 1: Check all apps
 *   node align.mjs --propagate             # Scenario 2: Propagate from productready
 *   node align.mjs <app-name> --verify     # Scenario 3: Verify compliance
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkInfrastructure } from "./lib/checkers.mjs";
import { fixInfrastructure } from "./lib/fixers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use process.cwd() to get the project root (where the script is run from)
const ROOT_DIR = process.cwd();
const APPS_DIR = join(ROOT_DIR, "apps");

// Parse command line arguments
const args = process.argv.slice(2);
const appName = args.find((arg) => !arg.startsWith("--"));
const flags = {
  check: args.includes("--check"),
  fix: args.includes("--fix"),
  diff: args.includes("--diff"),
  all: args.includes("--all"),
  propagate: args.includes("--propagate"),
  verify: args.includes("--verify"),
};

/**
 * Main entry point
 */
async function main() {
  console.log("🎯 ProductReady Alignment System\n");

  // Determine scenario
  if (flags.propagate) {
    await scenario2_propagate();
  } else if (flags.verify && appName) {
    await scenario3_verify(appName);
  } else if (appName || flags.all) {
    await scenario1_audit(appName, flags);
  } else {
    showUsage();
    process.exit(1);
  }
}

/**
 * Scenario 1: Active Audit
 */
async function scenario1_audit(appName, flags) {
  console.log("📍 Scenario 1: Active Audit\n");

  if (flags.all) {
    console.log("Checking all apps...\n");
    // TODO: Implement check all apps
    console.log("⚠️  Not implemented yet. Use: node align.mjs <app-name> --check");
    return;
  }

  if (!appName) {
    console.error("❌ Error: App name required");
    showUsage();
    process.exit(1);
  }

  const appPath = join(APPS_DIR, appName);
  if (!existsSync(appPath)) {
    console.error(`❌ Error: App '${appName}' not found in apps/`);
    process.exit(1);
  }

  console.log(`Target: apps/${appName}\n`);

  // Step 1: Check infrastructure
  console.log("🔍 Checking infrastructure files...\n");
  const infraResults = await checkInfrastructure(appName);

  // Step 2: Generate report
  generateReport(appName, infraResults);

  // Step 3: Apply fixes if requested
  if (flags.fix) {
    console.log("\n🔧 Applying fixes...\n");
    await fixInfrastructure(appName, infraResults);
    console.log("\n✅ Fixes applied. Run 'make typecheck && pnpm lint:err' to verify.");
  } else if (flags.check) {
    console.log(
      "\n💡 Review the differences above. Use AI to analyze and fix manually. Do NOT use --fix blindly.",
    );
  }
}

/**
 * Scenario 2: Propagate Forward
 */
async function scenario2_propagate() {
  console.log("🔄 Scenario 2: Propagate Forward\n");
  console.log("⚠️  Not implemented yet.");
  console.log("This will detect changes in apps/productready and propagate to other apps.");
}

/**
 * Scenario 3: Backport & Verify
 */
async function scenario3_verify(appName) {
  console.log("⬅️  Scenario 3: Backport & Verify\n");
  console.log(`Target: apps/${appName}\n`);
  console.log("⚠️  Not implemented yet.");
  console.log("This will check compliance and suggest backporting improvements.");
}

/**
 * Generate alignment report
 */
function generateReport(appName, results) {
  console.log(`\n📊 Alignment Report for ${appName}\n`);
  console.log("=".repeat(60));

  // Infrastructure files
  const infraMatches = results.infrastructure.filter((r) => r.matches).length;
  const infraTotal = results.infrastructure.length;
  const infraIcon = infraMatches === infraTotal ? "✅" : "⚠️";

  console.log(`\n${infraIcon} Config Files: ${infraMatches}/${infraTotal} match`);
  for (const result of results.infrastructure) {
    let icon = "❌";
    if (result.matches) {
      icon = "✅";
    } else if (result.severity === "warning") {
      icon = "⚠️";
    }

    console.log(`   ${icon} ${result.file}`);
    if (!result.matches && result.reason) {
      console.log(`      ${result.reason}`);
    }
  }

  // Structure
  console.log(`\n${results.structure.icon} Structure: ${results.structure.message}`);
  for (const item of results.structure.items) {
    console.log(`   ${item.icon} ${item.message}`);
  }

  // Design System
  console.log(`\n${results.designSystem.icon} Design System: ${results.designSystem.message}`);

  // Features
  console.log(`\n${results.features.icon} Features: ${results.features.message}`);
  for (const item of results.features.items) {
    console.log(`   ${item.icon} ${item.message}`);
  }

  // Dependencies
  console.log(`\n${results.dependencies.icon} Dependencies: ${results.dependencies.message}`);
  if (results.dependencies.items.length > 0) {
    for (const item of results.dependencies.items) {
      console.log(`   ${item.icon} ${item.message}`);
    }
  }

  // Quality Score
  console.log(`\n📈 Quality Score: ${results.qualityScore}%`);

  console.log(`\n${"=".repeat(60)}`);
}

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
Usage:
  Scenario 1 (Active Audit):
    node align.mjs <app-name> --check      Check alignment
    node align.mjs <app-name> --fix        Fix alignment
    node align.mjs <app-name> --diff       Show detailed diff
    node align.mjs --all                   Check all apps

  Scenario 2 (Propagate Forward):
    node align.mjs --propagate             Propagate productready changes

  Scenario 3 (Backport & Verify):
    node align.mjs <app-name> --verify     Verify compliance

Examples:
  node align.mjs npschimp --check
  node align.mjs maildrone --fix
  node align.mjs --propagate
  `);
}

// Run main
main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
