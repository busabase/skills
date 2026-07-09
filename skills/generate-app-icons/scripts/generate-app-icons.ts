import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
// Import png-to-ico with proper ESM syntax
import pngToIcoModule from "png-to-ico";
import sharp from "sharp";

const pngToIco = pngToIcoModule as unknown as (files: string[]) => Promise<Buffer>;

const appsDir = join(process.cwd(), "apps");
const FULL_SIZES = [16, 32, 48, 128, 180, 192, 512];

type Shape = "circle" | "rounded";

interface Options {
  app?: string; // limit to one app
  faviconOnly: boolean; // skip the PNG set, only (re)write favicon.ico
  shape: Shape; // themed favicon shape
  bg?: string; // themed favicon background — presence switches to themed mode
  radius: number; // rounded-corner radius (% of size)
}

type AppResult = { app: string; svg: boolean; iconTs: boolean; ico: boolean };

// ── CLI ──────────────────────────────────────────────────────────────────────
const { values } = parseArgs({
  options: {
    app: { type: "string", short: "a" },
    "favicon-only": { type: "boolean", default: false },
    shape: { type: "string", short: "s" },
    bg: { type: "string", short: "b" },
    radius: { type: "string", short: "r", default: "20" },
  },
});

const shapeArg = values.shape as Shape | undefined;
if (shapeArg && !["circle", "rounded"].includes(shapeArg)) {
  console.error("Error: --shape must be 'circle' or 'rounded'");
  process.exit(1);
}

const options: Options = {
  app: values.app,
  faviconOnly: Boolean(values["favicon-only"]),
  shape: shapeArg ?? "rounded",
  bg: values.bg, // themed mode when provided
  radius: Number.parseInt(values.radius || "20", 10),
};

// ── Themed favicon helpers (from the former generate-favicon skill) ────────────
function createMaskSvg(size: number, shapeType: Shape, radius: number): string {
  if (shapeType === "circle") {
    const c = size / 2;
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${c}" cy="${c}" r="${c}" fill="white"/></svg>`;
  }
  const cornerRadius = (size * radius) / 100;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/></svg>`;
}

function parseColor(color: string): { r: number; g: number; b: number; alpha: number } {
  if (color === "transparent") return { r: 0, g: 0, b: 0, alpha: 0 };
  const hex = color.replace("#", "");
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      alpha: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }
  console.warn(`Warning: could not parse color '${color}', using transparent`);
  return { r: 0, g: 0, b: 0, alpha: 0 };
}

/** Build a theme-aware favicon.ico (icon centered on a shaped, colored background). */
async function writeThemedFavicon(
  svgBuffer: Buffer,
  icoPath: string,
  outDir: string,
  opts: Options,
): Promise<void> {
  const bgRgba = parseColor(opts.bg as string);
  const sizes = [16, 32];
  const tempPngPaths: string[] = [];

  for (const size of sizes) {
    const tempPath = join(outDir, `.favicon-temp-${size}.png`);
    tempPngPaths.push(tempPath);

    const maskBuffer = Buffer.from(createMaskSvg(size, opts.shape, opts.radius));
    const iconSize = Math.round(size * 0.75); // 75% leaves padding
    const padding = Math.round((size - iconSize) / 2);

    const resizedIcon = await sharp(svgBuffer)
      .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const background = await sharp({
      create: { width: size, height: size, channels: 4, background: bgRgba },
    })
      .png()
      .toBuffer();

    const maskedBackground = await sharp(background)
      .composite([
        { input: await sharp(maskBuffer).resize(size, size).png().toBuffer(), blend: "dest-in" },
      ])
      .png()
      .toBuffer();

    await sharp(maskedBackground)
      .composite([{ input: resizedIcon, top: padding, left: padding }])
      .png()
      .toFile(tempPath);
  }

  const icoBuffer = await pngToIco(tempPngPaths);
  writeFileSync(icoPath, icoBuffer);
  for (const p of tempPngPaths) await unlink(p).catch(() => {});
}

// ── Core ───────────────────────────────────────────────────────────────────────
function resolveIcoPath(appName: string): string {
  const srcAppDir = join(appsDir, appName, "src", "app");
  return existsSync(srcAppDir)
    ? join(srcAppDir, "favicon.ico")
    : join(appsDir, appName, "public", "favicon.ico");
}

async function processApp(appName: string, opts: Options): Promise<AppResult> {
  const iconsDir = join(appsDir, appName, "public", "assets", "icons");
  const svgPath = join(iconsDir, "icon.svg");

  if (!existsSync(svgPath)) {
    console.log(`[skip] ${appName} - no ${svgPath}`);
    return { app: appName, svg: false, iconTs: false, ico: false };
  }

  const svgBuffer = readFileSync(svgPath);
  if (svgBuffer.toString("utf-8").startsWith("version https://git-lfs.github.com/spec/v1")) {
    console.log(`[skip] ${appName} - icon.svg is a Git LFS pointer file`);
    return { app: appName, svg: false, iconTs: false, ico: false };
  }

  const themed = Boolean(opts.bg);
  console.log(
    `[ok] ${appName} - found icon.svg${themed ? ` (themed favicon: ${opts.shape}/${opts.bg})` : ""}`,
  );
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

  // PNG set — skipped in --favicon-only mode. Themed-only runs need no PNGs.
  const sizesToGen = opts.faviconOnly ? (themed ? [] : [16, 32]) : FULL_SIZES;
  try {
    for (const size of sizesToGen) {
      const outPath = join(iconsDir, `icon${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);
      console.log(`  -> wrote ${outPath}`);
    }
  } catch (unknownErr) {
    const e = unknownErr as Error;
    console.warn(`  ! could not generate PNGs for ${appName}:`, e.message || e);
    return { app: appName, svg: false, iconTs: false, ico: false };
  }

  // favicon.ico — themed (shaped + colored bg) or plain (from icon16/32).
  const icoPath = resolveIcoPath(appName);
  try {
    if (themed) {
      await writeThemedFavicon(svgBuffer, icoPath, iconsDir, opts);
    } else {
      const icoPngs = [16, 32].map((s) => join(iconsDir, `icon${s}.png`));
      writeFileSync(icoPath, await pngToIco(icoPngs));
    }
    console.log(`  -> wrote ${icoPath}`);
  } catch (unknownErr) {
    const e = unknownErr as Error;
    console.warn(`  ! could not generate favicon.ico for ${appName}:`, e.message || e);
  }

  const hasIconTs = existsSync(join(appsDir, appName, "src", "app", "icon.tsx"));
  const hasFavicon =
    existsSync(join(appsDir, appName, "src", "app", "favicon.ico")) ||
    existsSync(join(appsDir, appName, "public", "favicon.ico"));

  return { app: appName, svg: true, iconTs: hasIconTs, ico: hasFavicon };
}

async function main() {
  if (options.app && !existsSync(join(appsDir, options.app))) {
    console.error(`Error: app directory not found at apps/${options.app}`);
    const apps = readdirSync(appsDir).filter((d) => {
      try {
        return statSync(join(appsDir, d)).isDirectory();
      } catch {
        return false;
      }
    });
    console.error(`Available apps: ${apps.join(", ")}`);
    process.exit(1);
  }

  const entries = options.app
    ? [options.app]
    : readdirSync(appsDir).filter((d) => {
        try {
          return statSync(join(appsDir, d)).isDirectory();
        } catch {
          return false;
        }
      });

  const results: AppResult[] = [];
  for (const app of entries) {
    results.push(await processApp(app, options));
  }

  console.log("\nSummary:\n");
  console.table(
    results.map((r) => ({
      App: r.app,
      "assets/icons/icon.svg": r.svg,
      "src/app/icon.tsx": r.iconTs,
      "public/favicon.ico": r.ico,
    })),
  );

  // Status markdown only for full-batch runs.
  if (!options.app) {
    const mdLines = [
      "| App | assets/icons/icon.svg | src/app/icon.tsx | public/favicon.ico |",
      "| --- | ---: | ---: | ---: |",
      ...results.map(
        (r) =>
          `| ${r.app} | ${r.svg ? "✓" : "✗"} | ${r.iconTs ? "✓" : "✗"} | ${r.ico ? "✓" : "✗"} |`,
      ),
    ];
    const mdPath = join(process.cwd(), "scripts", "icon-status.md");
    writeFileSync(mdPath, `${mdLines.join("\n")}\n`);
    console.log(`\nWrote ${mdPath}`);
  }

  if (options.bg) {
    console.log("\n💡 Themed favicon tips:");
    console.log("   - Test in browser with both dark and light themes");
    console.log("   - Clear browser cache if the favicon doesn't update");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
