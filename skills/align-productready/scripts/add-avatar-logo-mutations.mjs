#!/usr/bin/env node

/**
 * Add Avatar and Logo Mutations Script
 *
 * Adds updateAvatar/removeAvatar and updateLogo/removeLogo mutations
 * to apps that are missing them.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPS_DIR = "apps";
const PRODUCTREADY_DIR = join(APPS_DIR, "productready");

// Apps that need avatar mutations
const APPS_NEED_AVATAR = [
  "geodrone",
  "aglist",
  "sandock",
  "previewfile",
  "buda",
  "salesdrone",
  "lastbackup",
  "lobbook",
  "npschimp",
  "memtable",
  "productready-app",
  "productdrone",
  "bazi",
  "maildrone",
];

// Apps that need logo mutations
const APPS_NEED_LOGO = [
  "geodrone",
  "aglist",
  "sandock",
  "previewfile",
  "buda",
  "salesdrone",
  "lastbackup",
  "lobbook",
  "npschimp",
  "memtable",
  "productready-app",
  "productdrone",
  "bazi",
  "maildrone",
  "zodiacdrone",
];

function extractMutations(filePath, mutationNames) {
  const content = readFileSync(filePath, "utf-8");
  const mutations = [];

  for (const name of mutationNames) {
    const regex = new RegExp(`(  ${name}:.*?\\n(?:  \\w+:|\\}\\);))`, "s");
    const match = content.match(regex);
    if (match) {
      mutations.push({ name, code: match[1] });
    }
  }

  return mutations;
}

function addMutationsToFile(filePath, mutations) {
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = readFileSync(filePath, "utf-8");

  // Find the last mutation/query before the closing });
  const lastMutationMatch = content.match(/(\n {2}\w+:.*?\n(?: {2}\}| {2}\w+:))/gs);
  if (!lastMutationMatch) {
    console.log(`  ⚠️  Could not find insertion point`);
    return false;
  }

  const lastMutation = lastMutationMatch[lastMutationMatch.length - 1];
  const insertIndex = content.lastIndexOf(lastMutation) + lastMutation.length;

  // Insert mutations
  const mutationCode = mutations.map((m) => `\n${m.code}`).join("\n");
  content = content.slice(0, insertIndex) + mutationCode + content.slice(insertIndex);

  writeFileSync(filePath, content, "utf-8");
  return true;
}

function addAvatarMutations(appName) {
  console.log(`\n📝 Adding avatar mutations to ${appName}...`);

  const preferencesPath = join(APPS_DIR, appName, "src/domains/user/trpc/preferences.ts");
  const productreadyPath = join(PRODUCTREADY_DIR, "src/domains/user/trpc/preferences.ts");

  if (!existsSync(productreadyPath)) {
    console.log(`  ❌ ProductReady preferences.ts not found`);
    return false;
  }

  const mutations = extractMutations(productreadyPath, ["updateAvatar", "removeAvatar"]);

  if (mutations.length === 0) {
    console.log(`  ❌ Could not extract mutations from ProductReady`);
    return false;
  }

  const success = addMutationsToFile(preferencesPath, mutations);
  if (success) {
    console.log(`  ✅ Added updateAvatar and removeAvatar mutations`);
  }

  return success;
}

function addLogoMutations(appName) {
  console.log(`\n📝 Adding logo mutations to ${appName}...`);

  const spacesPath = join(APPS_DIR, appName, "src/domains/spaces/trpc/spaces.ts");
  const productreadyPath = join(PRODUCTREADY_DIR, "src/domains/spaces/trpc/spaces.ts");

  if (!existsSync(productreadyPath)) {
    console.log(`  ❌ ProductReady spaces.ts not found`);
    return false;
  }

  const mutations = extractMutations(productreadyPath, ["updateLogo", "removeLogo"]);

  if (mutations.length === 0) {
    console.log(`  ❌ Could not extract mutations from ProductReady`);
    return false;
  }

  const success = addMutationsToFile(spacesPath, mutations);
  if (success) {
    console.log(`  ✅ Added updateLogo and removeLogo mutations`);
  }

  return success;
}

function main() {
  console.log("🚀 Adding Avatar and Logo Mutations to Apps\n");
  console.log("=".repeat(60));

  let avatarCount = 0;
  let logoCount = 0;

  // Add avatar mutations
  console.log("\n📸 Adding Avatar Mutations...");
  for (const app of APPS_NEED_AVATAR) {
    if (addAvatarMutations(app)) {
      avatarCount++;
    }
  }

  // Add logo mutations
  console.log("\n\n🎨 Adding Logo Mutations...");
  for (const app of APPS_NEED_LOGO) {
    if (addLogoMutations(app)) {
      logoCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n✅ Summary:`);
  console.log(`   Avatar mutations added: ${avatarCount}/${APPS_NEED_AVATAR.length}`);
  console.log(`   Logo mutations added: ${logoCount}/${APPS_NEED_LOGO.length}`);
  console.log(`\n⚠️  Next steps:`);
  console.log(`   1. Run: make typecheck`);
  console.log(`   2. Fix any errors`);
  console.log(`   3. Test avatar/logo upload in each app`);
}

main();
