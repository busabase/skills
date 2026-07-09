/**
 * icp-loader.mjs
 * Load an ICP definition from apps/buda/src/domains/gtm/data/icps/
 *
 * Uses `tsx` to import the TypeScript source directly so the ICP file stays
 * the single source of truth. Shells out once per call (cached via LRU-ish
 * in-memory cache for the current process).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = findRepoRoot();
const BUDA_DIR = path.join(REPO_ROOT, "apps", "buda");
const ICPS_DIR = path.join(BUDA_DIR, "src", "domains", "gtm", "data", "icps");

function findRepoRoot() {
  if (process.env.ADS_GOOGLE_REPO_ROOT) {
    const root = path.resolve(process.env.ADS_GOOGLE_REPO_ROOT);
    if (fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) return root;
    throw new Error(`ADS_GOOGLE_REPO_ROOT does not look like the kapps repo: ${root}`);
  }
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const defaultKapps = path.join(process.env.HOME || "/Users/kelly", "Documents", "kapps");
  if (fs.existsSync(path.join(defaultKapps, "pnpm-workspace.yaml"))) return defaultKapps;
  throw new Error("Could not locate kapps repo root. Run from kapps or set ADS_GOOGLE_REPO_ROOT.");
}

export function listICPIds() {
  if (!fs.existsSync(ICPS_DIR)) return [];
  return fs
    .readdirSync(ICPS_DIR)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .map((f) => f.replace(/\.ts$/, ""));
}

/**
 * Load a single ICP by id. Returns the full ICP object.
 * @param {string} icpId - e.g. "seo-marketer"
 */
export function loadICP(icpId) {
  const ids = listICPIds();
  if (!ids.includes(icpId)) {
    throw new Error(`ICP not found: "${icpId}". Available: ${ids.join(", ")}`);
  }

  // Write a tiny loader script inside apps/buda so relative TS imports resolve.
  // Using a file (not -e) so the inline code isn't subject to shell quoting.
  const tmpPath = path.join(BUDA_DIR, `.ads-icp-loader-${icpId}-${process.pid}.mjs`);

  // The TS module uses \`export const icps = [...]\` but under tsx's
  // CJS interop it comes through as a default export. Try both.
  const loaderSource = `
import * as mod from "./src/domains/gtm/data/icps/index.ts";
const icps = mod.icps ?? mod.default?.icps;
if (!Array.isArray(icps)) {
  process.stderr.write("icps export not found\\n");
  process.exit(3);
}
const match = icps.find((i) => i.id === ${JSON.stringify(icpId)});
if (!match) {
  process.stderr.write("ICP not found at runtime: ${icpId}\\n");
  process.exit(2);
}
process.stdout.write(JSON.stringify(match));
`;

  fs.writeFileSync(tmpPath, loaderSource, "utf8");

  try {
    const raw = execFileSync("npx", ["-y", "tsx", tmpPath], {
      cwd: BUDA_DIR,
      stdio: ["ignore", "pipe", "inherit"],
      maxBuffer: 50 * 1024 * 1024,
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    return JSON.parse(raw.toString("utf8"));
  } catch (err) {
    throw new Error(`Failed to load ICP "${icpId}": ${err.message}`);
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup failures
    }
  }
}

/**
 * Resolve the landing page URL for an ICP.
 * Priority: landingCopy.hero.primaryCta.href (absolute) > first absolute funnels[].url > null
 */
export function resolveLandingPage(icp) {
  const heroHref = icp?.landingCopy?.hero?.primaryCta?.href;
  if (heroHref && /^https?:\/\//i.test(heroHref)) return heroHref;

  const funnels = Array.isArray(icp?.funnels) ? icp.funnels : [];
  const funnelUrl = funnels.find((f) => /^https?:\/\//i.test(f?.url))?.url;
  if (funnelUrl) return funnelUrl;

  return null;
}
