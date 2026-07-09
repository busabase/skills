#!/usr/bin/env node

/**
 * Update README.md App Status table
 *
 * Generates the app status table and updates README.md automatically
 *
 * Usage: node update-readme.mjs
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const README_PATH = join(ROOT_DIR, "README.md");

function generateStatusTable() {
  console.log("📊 Generating app status table...\n");

  // Run the generate-status-table script and capture output
  const scriptPath = join(
    ROOT_DIR,
    ".claude/skills/align-productready/scripts/generate-status-table.mjs",
  );

  try {
    const output = execSync(`node "${scriptPath}"`, {
      encoding: "utf8",
      cwd: ROOT_DIR,
    });

    // Extract the table from output (skip the header lines)
    const lines = output.split("\n");
    const tableStart = lines.findIndex((line) => line.startsWith("| App"));

    if (tableStart === -1) {
      throw new Error("Could not find table in output");
    }

    // Get table lines (header + separator + data rows)
    const tableLines = [];
    for (let i = tableStart; i < lines.length; i++) {
      if (lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
      } else if (tableLines.length > 0) {
        // Stop when we hit a non-table line after starting the table
        break;
      }
    }

    return tableLines.join("\n");
  } catch (error) {
    console.error("❌ Error generating table:", error.message);
    return null;
  }
}

function updateReadme(newTable) {
  console.log("📝 Updating README.md...\n");

  if (!existsSync(README_PATH)) {
    console.error("❌ README.md not found");
    return false;
  }

  const content = readFileSync(README_PATH, "utf8");

  // Find the table section
  const tableStartMarker = "| App";
  const tableEndMarker = "*Showing top";

  const tableStartIndex = content.indexOf(tableStartMarker);
  if (tableStartIndex === -1) {
    console.error("❌ Could not find app status table in README.md");
    return false;
  }

  const tableEndIndex = content.indexOf(tableEndMarker, tableStartIndex);
  if (tableEndIndex === -1) {
    console.error("❌ Could not find end of app status table in README.md");
    return false;
  }

  // Replace the table
  const before = content.substring(0, tableStartIndex);
  const after = content.substring(tableEndIndex);
  const newContent = `${before + newTable}\n\n${after}`;

  writeFileSync(README_PATH, newContent);
  console.log("✅ README.md updated successfully\n");

  return true;
}

function main() {
  console.log("🔄 Updating README.md App Status table\n");
  console.log(`${"=".repeat(60)}\n`);

  // Step 1: Generate new table
  const newTable = generateStatusTable();
  if (!newTable) {
    console.error("❌ Failed to generate table");
    process.exit(1);
  }

  console.log("✅ Table generated\n");

  // Step 2: Update README
  const success = updateReadme(newTable);
  if (!success) {
    console.error("❌ Failed to update README.md");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("✅ README.md App Status table updated successfully!");
  console.log("\n💡 Next steps:");
  console.log("   1. Review the changes: git diff README.md");
  console.log(
    "   2. Commit if looks good: git add README.md && git commit -m 'Update app status table'",
  );
}

main();
