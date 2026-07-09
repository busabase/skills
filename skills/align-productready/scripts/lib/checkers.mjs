#!/usr/bin/env node
/**
 * Alignment Checkers Library
 *
 * Reusable functions for checking alignment with productready
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Use process.cwd() to get the project root (where the script is run from)
const ROOT_DIR = process.cwd();
const APPS_DIR = join(ROOT_DIR, "apps");

/**
 * Check infrastructure files alignment
 */
export async function checkInfrastructure(appName) {
  const results = {
    infrastructure: [],
    structure: { icon: "", message: "", items: [] },
    designSystem: { icon: "", message: "" },
    features: { icon: "", message: "", items: [] },
    dependencies: { icon: "", message: "", items: [] },
    qualityScore: 0,
  };

  // Check config files (only those that exist in productready)
  const configFiles = [
    "tsconfig.json",
    "next.config.mjs",
    ".env.example",
    "drizzle.config.ts",
    "postcss.config.mjs",
    "vitest.config.ts",
  ];

  for (const file of configFiles) {
    const productreadyPath = join(APPS_DIR, "productready", file);
    const appPath = join(APPS_DIR, appName, file);

    if (!existsSync(productreadyPath)) {
      results.infrastructure.push({
        file,
        matches: false,
        reason: "File not found in productready (reference missing)",
      });
      continue;
    }

    if (!existsSync(appPath)) {
      results.infrastructure.push({
        file,
        matches: false,
        severity: "error",
        reason: "File missing in app",
      });
      continue;
    }

    const productreadyContent = readFileSync(productreadyPath, "utf8");
    const appContent = readFileSync(appPath, "utf8");

    // Simple content comparison (can be enhanced with semantic comparison)
    const matches = productreadyContent === appContent;

    results.infrastructure.push({
      file,
      matches,
      severity: matches ? "success" : "warning",
      reason: matches ? null : "Content differs from productready",
    });
  }

  // Check structure
  results.structure = checkStructure(appName);

  // Check design system
  results.designSystem = checkDesignSystem(appName);

  // Check features
  results.features = checkFeatures(appName);

  // Check dependencies
  results.dependencies = checkDependencies(appName);

  // Calculate quality score
  results.qualityScore = calculateQualityScore(appName);

  return results;
}

/**
 * Check structure (domains, content, etc.)
 */
function checkStructure(appName) {
  const appPath = join(APPS_DIR, appName);
  const items = [];

  // Check domains/
  const domainsPath = join(appPath, "src/domains");
  items.push({
    icon: existsSync(domainsPath) ? "✅" : "❌",
    message: existsSync(domainsPath) ? "src/domains/ exists" : "src/domains/ missing",
  });

  // Check systemadmin domain
  const systemadminPath = join(domainsPath, "systemadmin");
  items.push({
    icon: existsSync(systemadminPath) ? "✅" : "❌",
    message: existsSync(systemadminPath)
      ? "src/domains/systemadmin/ exists"
      : "src/domains/systemadmin/ missing",
  });

  // Check content/spec/
  const specPath = join(appPath, "content/spec");
  const specFiles = [
    "product-design.md",
    "icp-guide.md",
    "marketing-guide.md",
    "onboarding-story.md",
    "design-system.md",
    "vi.md",
  ];

  let specCount = 0;
  if (existsSync(specPath)) {
    for (const file of specFiles) {
      if (existsSync(join(specPath, file))) {
        specCount++;
      }
    }
  }

  items.push({
    icon: specCount === 6 ? "✅" : specCount >= 3 ? "⚠️" : "❌",
    message: `content/spec/: ${specCount}/6 files present`,
  });

  // Overall structure status
  const allGood = items.every((item) => item.icon === "✅");
  const someGood = items.some((item) => item.icon === "✅");

  return {
    icon: allGood ? "✅" : someGood ? "⚠️" : "❌",
    message: allGood ? "Complete" : someGood ? "Partially complete" : "Incomplete",
    items,
  };
}

/**
 * Check design system alignment
 */
function checkDesignSystem(appName) {
  const appPath = join(APPS_DIR, appName);

  const globalCssPath = join(appPath, "src/app/global.css");
  const viPath = join(appPath, "content/spec/vi.md");
  const designSystemPath = join(appPath, "content/spec/design-system.md");

  const hasGlobalCss = existsSync(globalCssPath);
  const hasVi = existsSync(viPath);
  const hasDesignSystem = existsSync(designSystemPath);

  if (hasGlobalCss && hasVi && hasDesignSystem) {
    return {
      icon: "✅",
      message: "Fully aligned (global.css + vi.md + design-system.md)",
    };
  }

  if (hasGlobalCss && (hasVi || hasDesignSystem)) {
    return {
      icon: "⚠️",
      message: "Partially aligned (missing some design docs)",
    };
  }

  return {
    icon: "❌",
    message: "Not aligned (missing design system files)",
  };
}

/**
 * Check features implementation
 */
function checkFeatures(appName) {
  const appPath = join(APPS_DIR, appName);
  const items = [];

  // Check Auth (check multiple possible paths)
  const authPaths = [join(appPath, "src/domains/auth"), join(appPath, "src/lib/auth")];
  const hasAuth = authPaths.some((path) => existsSync(path));
  items.push({
    icon: hasAuth ? "✅" : "❌",
    message: hasAuth ? "Auth implemented" : "Auth missing",
  });

  // Check Footer (check multiple possible paths)
  const footerPaths = [
    join(appPath, "src/components/layout/footer.tsx"),
    join(appPath, "src/components/footer.tsx"),
  ];
  const hasFooter = footerPaths.some((path) => existsSync(path));
  items.push({
    icon: hasFooter ? "✅" : "❌",
    message: hasFooter ? "Footer exists" : "Footer missing",
  });

  // Check Health endpoint
  const healthPath = join(appPath, "src/app/api/health/route.ts");
  items.push({
    icon: existsSync(healthPath) ? "✅" : "❌",
    message: existsSync(healthPath) ? "Health endpoint exists" : "Health endpoint missing",
  });

  const implementedCount = items.filter((item) => item.icon === "✅").length;
  const totalCount = items.length;

  return {
    icon: implementedCount === totalCount ? "✅" : implementedCount >= totalCount / 2 ? "⚠️" : "❌",
    message: `${implementedCount}/${totalCount} implemented`,
    items,
  };
}

/**
 * Calculate quality score based on spec files
 */
function calculateQualityScore(appName) {
  const appPath = join(APPS_DIR, appName);
  const specPath = join(appPath, "content/spec");

  const specFiles = [
    "product-design.md",
    "icp-guide.md",
    "marketing-guide.md",
    "onboarding-story.md",
    "design-system.md",
    "vi.md",
  ];

  let count = 0;
  if (existsSync(specPath)) {
    for (const file of specFiles) {
      if (existsSync(join(specPath, file))) {
        count++;
      }
    }
  }

  return Math.round((count / 6) * 100);
}

/**
 * Check dependencies versions
 */
function checkDependencies(appName) {
  const appPath = join(APPS_DIR, appName);
  const productreadyPath = join(APPS_DIR, "productready");

  const appPackageJsonPath = join(appPath, "package.json");
  const productreadyPackageJsonPath = join(productreadyPath, "package.json");

  if (!existsSync(appPackageJsonPath) || !existsSync(productreadyPackageJsonPath)) {
    return {
      icon: "❌",
      message: "Cannot check dependencies",
      items: [],
    };
  }

  const appPackageJson = JSON.parse(readFileSync(appPackageJsonPath, "utf8"));
  const productreadyPackageJson = JSON.parse(readFileSync(productreadyPackageJsonPath, "utf8"));

  const coreDeps = [
    "better-auth",
    "drizzle-orm",
    "@trpc/server",
    "@trpc/client",
    "@trpc/react-query",
    "next",
    "react",
    "react-dom",
    "typesafe-i18n",
    "zod",
  ];

  const items = [];
  let mismatchCount = 0;

  for (const dep of coreDeps) {
    const appVersion = appPackageJson.dependencies?.[dep] || appPackageJson.devDependencies?.[dep];
    const productreadyVersion =
      productreadyPackageJson.dependencies?.[dep] || productreadyPackageJson.devDependencies?.[dep];

    if (!appVersion) {
      items.push({
        icon: "❌",
        message: `${dep}: Missing`,
      });
      mismatchCount++;
    } else if (appVersion !== productreadyVersion) {
      items.push({
        icon: "⚠️",
        message: `${dep}: ${appVersion} (productready: ${productreadyVersion})`,
      });
      mismatchCount++;
    } else {
      items.push({
        icon: "✅",
        message: `${dep}: ${appVersion}`,
      });
    }
  }

  return {
    icon: mismatchCount === 0 ? "✅" : mismatchCount < coreDeps.length / 2 ? "⚠️" : "❌",
    message: `${coreDeps.length - mismatchCount}/${coreDeps.length} match`,
    items,
  };
}
