import { execSync } from "node:child_process";
import { Stagehand } from "@browserbasehq/stagehand";

const appName = process.env.TARGET_APP || "productready";
const port = process.env.TARGET_PORT || "3020";
const url = `http://localhost:${port}`;

/** Gather git changes to build context-aware test instructions */
const getChangeSummary = (): string => {
  const root = process.cwd();
  let diff = "";
  try {
    // Try PR changes first, fallback to uncommitted changes
    diff = execSync("git diff --stat origin/develop...HEAD 2>/dev/null || git diff --stat HEAD", {
      cwd: root,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "No changes detected";
  }

  // Get the actual diff for the target app (limited to keep prompt small)
  let appDiff = "";
  try {
    appDiff = execSync(
      `git diff origin/develop...HEAD -- 'apps/${appName}/src/**' 2>/dev/null | head -200`,
      { cwd: root, encoding: "utf-8" },
    ).trim();
  } catch {}

  // Categorize changed files
  const files = diff.split("\n").filter((l) => l.includes("|"));
  const categories = {
    pages: files.filter((f) => /app\/.*page|app\/.*layout|app\/\(home\)/.test(f)),
    components: files.filter((f) => /components\//.test(f)),
    api: files.filter((f) => /api\/|server\/|trpc\/|routers\//.test(f)),
    styles: files.filter((f) => /\.css|global\.css|design-system/.test(f)),
    config: files.filter((f) => /\.env|next\.config|package\.json/.test(f)),
  };

  const parts = [`Changed files:\n${diff}`];
  if (categories.pages.length) parts.push(`\nPage changes:\n${categories.pages.join("\n")}`);
  if (categories.components.length)
    parts.push(`\nComponent changes:\n${categories.components.join("\n")}`);
  if (categories.api.length) parts.push(`\nAPI changes:\n${categories.api.join("\n")}`);
  if (categories.styles.length) parts.push(`\nStyle changes:\n${categories.styles.join("\n")}`);
  if (appDiff) parts.push(`\nCode diff (truncated):\n${appDiff}`);

  return parts.join("\n");
};

/** Build test instructions based on what changed */
const buildTestPlan = (changes: string): string[] => {
  const instructions: string[] = [];

  // Always: verify homepage loads
  instructions.push(
    "Verify the homepage loads correctly. Check for any error messages, broken layouts, or missing content. Report what you see.",
  );

  // Route/page changes → navigate to affected pages
  if (/page\.(tsx|ts)|layout\.(tsx|ts)|\(home\)|\/dashboard|\/pricing|\/docs/.test(changes)) {
    instructions.push(
      "Navigate through all visible navigation links (Pricing, Documentation, Dashboard, etc). For each page, check that it loads without errors and the layout looks correct.",
    );
  }

  // Component/UI changes → check visual elements
  if (/components\/|\.css|design-system|global\.css|footer|header|hero/.test(changes)) {
    instructions.push(
      "Scroll through the entire page and check the visual layout. Look for broken styling, overlapping elements, missing images, or text that looks wrong. Pay attention to the header, footer, and any hero sections.",
    );
  }

  // Auth changes → test login flow
  if (/auth|clerk|login|sign-in|sign-up/.test(changes)) {
    instructions.push(
      "Click on the Login or Sign In button if visible. Verify the authentication page loads correctly.",
    );
  }

  // API/backend changes → test interactive features
  if (/api\/|server\/|trpc\/|routers\/|mutation|query/.test(changes)) {
    instructions.push(
      "Try interacting with any forms, buttons, or interactive elements on the page. Check that they respond and don't show errors.",
    );
  }

  // Pricing/billing changes
  if (/pricing|billing|subscription|plan/.test(changes)) {
    instructions.push(
      "Navigate to the Pricing page if available. Verify pricing cards display correctly with plan names, prices, and feature lists.",
    );
  }

  // i18n changes → check language switching
  if (/i18n|locale|lang|\[lang\]|dictionary/.test(changes)) {
    instructions.push(
      "If there's a language switcher, try switching languages and verify the page content updates.",
    );
  }

  // Fallback: general exploration
  if (instructions.length <= 1) {
    instructions.push(
      "Click on the first 3 navigation links one by one. For each, verify the page loads without errors.",
    );
  }

  return instructions;
};

/** Find Xwayland auth for headful Chrome on Wayland desktops */
const getXAuthority = (): string => {
  if (process.env.XAUTHORITY) return process.env.XAUTHORITY;
  try {
    return execSync("find /run/user/$(id -u) -name '.mutter-Xwaylandauth*' 2>/dev/null | head -1", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
};

async function runTest() {
  console.log(`🧪 Testing ${appName} at ${url}...`);

  // Analyze changes
  const changes = getChangeSummary();
  console.log("\n📋 Change Summary:");
  console.log(changes.split("\n").slice(0, 20).join("\n"));
  if (changes.split("\n").length > 20) console.log("  ... (truncated)");

  const testPlan = buildTestPlan(changes);
  console.log(`\n🎯 Test Plan (${testPlan.length} steps):`);
  for (let i = 0; i < testPlan.length; i++) {
    console.log(`  ${i + 1}. ${testPlan[i].slice(0, 100)}...`);
  }

  // Set display env for headful mode
  process.env.DISPLAY = process.env.DISPLAY || ":0";
  const xauth = getXAuthority();
  if (xauth) process.env.XAUTHORITY = xauth;

  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    model: "gpt-4o",
    localBrowserLaunchOptions: {
      headless: false,
      executablePath: "/usr/bin/google-chrome",
      port: 9222,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--user-data-dir=/tmp/stagehand-chrome",
      ],
    },
  });
  await stagehand.init();

  const results: { step: string; status: "pass" | "fail"; detail: string }[] = [];

  try {
    const page = stagehand.context.pages()[0];
    await page.goto(url);

    for (const instruction of testPlan) {
      console.log(`\n🔄 Running: ${instruction.slice(0, 80)}...`);
      try {
        const result = await stagehand.act(instruction);
        results.push({
          step: instruction.slice(0, 80),
          status: "pass",
          detail: result.message || "OK",
        });
        console.log(`  ✅ Passed`);
      } catch (err: any) {
        results.push({
          step: instruction.slice(0, 80),
          status: "fail",
          detail: err.message?.slice(0, 200) || "Unknown error",
        });
        console.log(`  ❌ Failed: ${err.message?.slice(0, 100)}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  } finally {
    await stagehand.close();
  }

  // Report
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Test Results:");
  console.log("=".repeat(60));
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  for (const r of results) {
    console.log(`  ${r.status === "pass" ? "✅" : "❌"} ${r.step}`);
    if (r.status === "fail") console.log(`     → ${r.detail}`);
  }
  console.log(`\n  Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

runTest().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
