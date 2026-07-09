#!/usr/bin/env node
/**
 * Alignment Fixers Library
 *
 * Auto-fix functions for aligning apps with productready
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use process.cwd() to get the project root (where the script is run from)
const ROOT_DIR = process.cwd();
const APPS_DIR = join(ROOT_DIR, "apps");

/**
 * Fix infrastructure files
 */
export async function fixInfrastructure(appName, checkResults) {
  const appPath = join(APPS_DIR, appName);
  const productreadyPath = join(APPS_DIR, "productready");

  let fixedCount = 0;

  // Fix config files
  for (const result of checkResults.infrastructure) {
    if (!result.matches) {
      const sourcePath = join(productreadyPath, result.file);
      const targetPath = join(appPath, result.file);

      if (existsSync(sourcePath)) {
        try {
          // Ensure directory exists
          const targetDir = dirname(targetPath);
          if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
          }

          // Copy file
          copyFileSync(sourcePath, targetPath);
          console.log(`✅ Fixed: ${result.file}`);
          fixedCount++;
        } catch (error) {
          console.error(`❌ Failed to fix ${result.file}:`, error.message);
        }
      }
    }
  }

  // Fix structure (create missing directories)
  await fixStructure(appName);

  console.log(`\n✅ Fixed ${fixedCount} infrastructure files`);
}

/**
 * Fix structure (create missing directories)
 */
async function fixStructure(appName) {
  const appPath = join(APPS_DIR, appName);

  // Create src/domains/ if missing
  const domainsPath = join(appPath, "src/domains");
  if (!existsSync(domainsPath)) {
    mkdirSync(domainsPath, { recursive: true });
    console.log("✅ Created: src/domains/");
  }

  // Create content/spec/ if missing
  const specPath = join(appPath, "content/spec");
  if (!existsSync(specPath)) {
    mkdirSync(specPath, { recursive: true });
    console.log("✅ Created: content/spec/");
  }

  // Create content/docs/ if missing
  const docsPath = join(appPath, "content/docs");
  if (!existsSync(docsPath)) {
    mkdirSync(docsPath, { recursive: true });
    console.log("✅ Created: content/docs/");
  }

  // Create content/changelog/ if missing
  const changelogPath = join(appPath, "content/changelog");
  if (!existsSync(changelogPath)) {
    mkdirSync(changelogPath, { recursive: true });
    console.log("✅ Created: content/changelog/");
  }
}

/**
 * Copy systemadmin domain from productready
 */
export async function copySystemadminDomain(appName) {
  const appPath = join(APPS_DIR, appName);
  const productreadyPath = join(APPS_DIR, "productready");

  const sourcePath = join(productreadyPath, "src/domains/systemadmin");
  const _targetPath = join(appPath, "src/domains/systemadmin");

  if (!existsSync(sourcePath)) {
    console.error("❌ systemadmin domain not found in productready");
    return;
  }

  // TODO: Implement recursive directory copy
  console.log("⚠️  systemadmin domain copy not implemented yet");
  console.log("   Please manually copy from apps/productready/src/domains/systemadmin");
}
