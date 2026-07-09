#!/usr/bin/env node
/**
 * Product Ready Boilerplate Detection Script (Option A: Lightweight)
 *
 * Detects apps based on Product Ready Boilerplate using:
 * - package.json "productready" field (explicit marker)
 * - Pattern detection (dependencies, folder structure)
 *
 * Usage:
 *   node scripts/detect-productready-apps.mjs [--validate]
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use process.cwd() to get the project root (where the script is run from)
const ROOT_DIR = process.cwd();
const APPS_DIR = join(ROOT_DIR, "apps");

/**
 * Check if a file exists in the app directory
 */
function checkFile(appPath, file) {
  return existsSync(join(appPath, file));
}

/**
 * Check if app has required dependencies
 */
function checkDependencies(packageJson) {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return {
    hasBetterAuth: !!deps["better-auth"],
    hasDrizzle: !!deps["drizzle-orm"],
    hasTRPC: !!deps["@trpc/server"],
  };
}

/**
 * Detect if an app is based on Product Ready Boilerplate
 */
function detectProductReady(appName) {
  const appPath = join(APPS_DIR, appName);
  const result = {
    app: appName,
    isProductReady: false,
    hasExplicitMarker: false,
    confidence: 0,
    patterns: {
      hasDrizzle: false,
      hasBetterAuth: false,
      hasTRPC: false,
      hasAuthScripts: false,
      hasAuthFolder: false,
      hasDrizzleConfig: false,
    },
    features: null,
    aligned: null,
    missingFeatures: [],
    issues: [],
  };

  // Check for package.json
  const packageJsonPath = join(appPath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return result;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  // Check for explicit marker in package.json
  result.hasExplicitMarker = !!packageJson.productready;

  // Extract feature information if available
  if (packageJson.productready) {
    result.features = packageJson.productready.features || null;
    result.aligned = packageJson.productready.aligned ?? null;
    result.missingFeatures = packageJson.productready.missingFeatures || [];
  }

  // Check dependencies
  const deps = checkDependencies(packageJson);
  result.patterns.hasBetterAuth = deps.hasBetterAuth;
  result.patterns.hasDrizzle = deps.hasDrizzle;
  result.patterns.hasTRPC = deps.hasTRPC;

  // Check scripts and structure
  result.patterns.hasAuthScripts = !!packageJson.scripts?.["auth:generate"];
  result.patterns.hasAuthFolder = checkFile(appPath, "src/lib/auth");
  result.patterns.hasDrizzleConfig = checkFile(appPath, "drizzle.config.ts");

  // Calculate confidence score based on patterns
  let score = 0;
  const patternValues = Object.values(result.patterns);
  patternValues.forEach((value) => {
    if (value) score += 100 / patternValues.length;
  });

  result.confidence = Math.round(score);

  // App is Product Ready if:
  // 1. Has explicit marker in package.json, OR
  // 2. Has ≥80% pattern match (very strong signal)
  result.isProductReady = result.hasExplicitMarker || result.confidence >= 80;

  // Validation issues (only for apps with explicit marker)
  if (result.hasExplicitMarker && result.confidence < 60) {
    result.issues.push("Has productready marker but missing expected patterns");
  }

  return result;
}

/**
 * Main detection function
 */
function main() {
  const args = process.argv.slice(2);
  const shouldValidate = args.includes("--validate");

  console.log("🔍 Product Ready Boilerplate Detection (Option A: Lightweight)\n");

  const apps = readdirSync(APPS_DIR).filter((name) => {
    const appPath = join(APPS_DIR, name);
    try {
      const stat = readdirSync(appPath);
      return stat && Array.isArray(stat);
    } catch {
      return false;
    }
  });

  const results = [];

  for (const app of apps) {
    try {
      const result = detectProductReady(app);
      results.push(result);
    } catch (error) {
      console.error(`Error checking ${app}:`, error);
    }
  }

  // Sort by confidence (descending)
  results.sort((a, b) => b.confidence - a.confidence);

  // Print results
  const productReadyApps = results.filter((r) => r.isProductReady);
  const otherApps = results.filter((r) => !r.isProductReady);

  console.log("✅ Product Ready Apps (Explicit Marker or Strong Pattern Match):\n");

  if (productReadyApps.length === 0) {
    console.log("   (none found)");
  } else {
    for (const result of productReadyApps) {
      const marker = result.hasExplicitMarker ? "📦" : "🔍";
      const status = result.hasExplicitMarker ? "marked" : "detected";
      const alignmentIcon = result.aligned === true ? "✅" : result.aligned === false ? "⚠️" : "";
      const alignmentText =
        result.aligned === true
          ? "fully aligned"
          : result.aligned === false
            ? "partially aligned"
            : "";

      console.log(
        `${marker} ${alignmentIcon} ${result.app.padEnd(23)} (${result.confidence}% pattern, ${status}${alignmentText ? `, ${alignmentText}` : ""})`,
      );

      // Show missing features if not aligned
      if (result.aligned === false && result.missingFeatures.length > 0) {
        console.log(`      Missing: ${result.missingFeatures.join(", ")}`);
      }

      if (shouldValidate && result.issues.length > 0) {
        result.issues.forEach((issue) => {
          console.log(`      ⚠️  ${issue}`);
        });
      }
    }
  }

  console.log(`\n📊 Other Apps (${otherApps.length}):\n`);
  console.log(`   ${otherApps.length} apps don't match Product Ready patterns`);

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📈 Summary:`);
  console.log(`   Total apps scanned: ${results.length}`);
  console.log(`   Product Ready apps: ${productReadyApps.length}`);

  const explicitlyMarked = productReadyApps.filter((r) => r.hasExplicitMarker);
  const autoDetected = productReadyApps.filter((r) => !r.hasExplicitMarker);
  console.log(`   - Explicitly marked (package.json): ${explicitlyMarked.length}`);
  console.log(`   - Auto-detected (pattern match): ${autoDetected.length}`);

  // Feature alignment summary
  const fullyAligned = productReadyApps.filter((r) => r.aligned === true);
  const partiallyAligned = productReadyApps.filter((r) => r.aligned === false);
  if (explicitlyMarked.length > 0) {
    console.log(`\n   Feature Alignment:`);
    console.log(`   - Fully aligned: ${fullyAligned.length}`);
    console.log(`   - Partially aligned: ${partiallyAligned.length}`);
  }

  const appsWithIssues = productReadyApps.filter((r) => r.issues.length > 0);
  if (appsWithIssues.length > 0) {
    console.log(`\n   Apps with validation issues: ${appsWithIssues.length}`);
  }

  console.log("=".repeat(60));

  // Exit code
  if (shouldValidate && appsWithIssues.length > 0) {
    console.log("\n⚠️  Validation failed. Please fix the issues above.");
    process.exit(1);
  }
}

main();
