/**
 * Generate Expo (iOS/Android) app icons for the mobile apps.
 *
 * Why this is separate from generate-app-icons.ts:
 *   - generate-app-icons.ts produces WEB icons (favicon / PWA), capped at 512px — 512 is the PWA
 *     maximum, so that's correct there.
 *   - The App Store **marketing icon must be 1024×1024 with NO alpha channel** (Apple's upload
 *     validator rejects any alpha). Expo reads `ios.icon` from `assets/icon.png`. This script
 *     renders that at 1024×1024 flattened over the brand background, plus upscales the Android
 *     adaptive foreground to 1024 (keeping its transparency).
 *
 * Run (from repo root):
 *   tsx .claude/skills/generate-app-icons/scripts/generate-mobile-icons.ts            # all mobile apps
 *   tsx .claude/skills/generate-app-icons/scripts/generate-mobile-icons.ts --app buda-mobile
 *
 * To add a new mobile app, append an entry to TARGETS below. `iconSource` may be an SVG (rendered
 * from the vector) or a ≥1024 PNG master. `background` flattens any transparency for the iOS icon.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const ICON_SIZE = 1024;
const root = process.cwd();

interface Target {
  /** apps/<app> directory name */
  app: string;
  /** dir (relative to the app) holding the Expo image assets */
  assetsDir: string;
  /** source for the iOS icon — SVG or ≥1024 PNG, relative to repo root */
  iconSource: string;
  /** opaque brand background used to flatten the iOS icon (Apple forbids alpha) */
  background: string;
  /** Android adaptive foreground source (kept transparent), relative to repo root; optional */
  adaptiveSource?: string;
}

// Per-app config. buda/inpomo use their own 1024 PNG masters (their SVGs are non-square / a PNG
// wrapper); busabase renders from the canonical square vector at apps/busabase/public/icon.svg.
const TARGETS: Target[] = [
  {
    app: "buda-mobile",
    assetsDir: "assets/images",
    iconSource: "apps/buda-mobile/assets/images/icon.png",
    background: "#FAF8F2",
    adaptiveSource: "apps/buda-mobile/assets/images/adaptive-icon.png",
  },
  {
    app: "busabase-mobile",
    assetsDir: "assets",
    iconSource: "apps/busabase/public/icon.svg",
    background: "#F7F4ED",
    adaptiveSource: "apps/busabase-mobile/assets/adaptive-icon.png",
  },
  {
    app: "inpomo-mobile",
    assetsDir: "assets",
    iconSource: "apps/inpomo-mobile/assets/icon.png",
    background: "#F6F4ED",
    adaptiveSource: "apps/inpomo-mobile/assets/adaptive-icon.png",
  },
];

const { values } = parseArgs({ options: { app: { type: "string", short: "a" } } });

/** Read a source into a sharp pipeline, rendering SVGs at a density that yields a crisp 1024px. */
function load(sourceAbs: string) {
  // For SVG, density ~96 over a 1024 viewBox rasterizes near target size; the resize then snaps it.
  return sourceAbs.toLowerCase().endsWith(".svg")
    ? sharp(sourceAbs, { density: 96 })
    : sharp(sourceAbs);
}

async function processTarget(t: Target): Promise<void> {
  const iconSrcAbs = join(root, t.iconSource);
  if (!existsSync(iconSrcAbs)) {
    console.warn(`[skip] ${t.app}: icon source not found: ${t.iconSource}`);
    return;
  }
  const iconOut = join(root, "apps", t.app, t.assetsDir, "icon.png");

  // iOS App Store icon: 1024×1024, flattened over the brand bg → no alpha channel.
  // toBuffer() first so we can safely overwrite a file that is also (sometimes) the source.
  const iconBuf = await load(iconSrcAbs)
    .resize(ICON_SIZE, ICON_SIZE, { fit: "cover" })
    .flatten({ background: t.background })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(iconBuf).toFile(iconOut);
  const m = await sharp(iconOut).metadata();
  console.log(`[ok] ${t.app}: icon.png → ${m.width}×${m.height} hasAlpha=${m.hasAlpha}`);

  // Android adaptive foreground: 1024×1024, KEEP transparency (it sits on adaptiveIcon.backgroundColor).
  if (t.adaptiveSource) {
    const advSrcAbs = join(root, t.adaptiveSource);
    if (existsSync(advSrcAbs)) {
      const advOut = join(root, "apps", t.app, t.assetsDir, "adaptive-icon.png");
      const advBuf = await load(advSrcAbs)
        .resize(ICON_SIZE, ICON_SIZE, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
      await sharp(advBuf).toFile(advOut);
      const am = await sharp(advOut).metadata();
      console.log(`       adaptive-icon.png → ${am.width}×${am.height} hasAlpha=${am.hasAlpha}`);
    }
  }
}

async function main() {
  const targets = values.app ? TARGETS.filter((t) => t.app === values.app) : TARGETS;
  if (targets.length === 0) {
    console.error(
      `No target for --app ${values.app}. Known: ${TARGETS.map((t) => t.app).join(", ")}`,
    );
    process.exit(1);
  }
  for (const t of targets) await processTarget(t);
  console.log("\nDone. iOS icons are 1024×1024 with no alpha; rebuild the app to pick them up.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
