#!/usr/bin/env node
/**
 * generate-from-slides.mjs
 * Build a PPTX from a slides.json file (same format as generate-app-gallery-pptx).
 * Exits with an error if slides.json is not found — use generate-from-stills.mjs
 * for stills-based generation instead.
 *
 * Usage:
 *   node generate-from-slides.mjs \
 *     --composition buda-intro-general-zh-CN \
 *     --video-dir videos/buda \
 *     --output videos/buda/out/buda-intro-general-zh-CN.pptx
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const composition = get("--composition");
const videoDir = get("--video-dir");
const outputPath = get("--output");

if (!composition || !videoDir || !outputPath) {
  console.error(
    "Usage: node generate-from-slides.mjs --composition <id> --video-dir <dir> --output <file.pptx>",
  );
  process.exit(1);
}

// ── Load slides.json ──────────────────────────────────────────────────────────
// Look in: <video-dir>/content/<composition>/slides.json
const slidesJsonPath = path.join(videoDir, "content", composition, "slides.json");

if (!fs.existsSync(slidesJsonPath)) {
  console.error(`slides.json not found: ${slidesJsonPath}`);
  console.error("Tip: Use --slides-source stills to generate from video frames instead.");
  process.exit(1);
}

const slidesJson = JSON.parse(fs.readFileSync(slidesJsonPath, "utf-8"));
const { slides } = slidesJson;

if (!slides || slides.length === 0) {
  console.error("No slides found in slides.json");
  process.exit(1);
}

console.log(`📄 Loaded ${slides.length} slides from ${slidesJsonPath}`);

// ── Asset resolution ──────────────────────────────────────────────────────────
// Images can be referenced relative to <video-dir>/content/<composition>/
const contentDir = path.join(videoDir, "content", composition);
const publicDir = path.join(videoDir, "public");

function resolveImage(filename) {
  if (!filename) return null;
  // Try content dir first, then public dir
  const candidates = [
    path.join(contentDir, filename),
    path.join(publicDir, filename),
    path.join(videoDir, filename),
    filename, // absolute path
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

// ── Build PPTX ────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9";
pptx.title = composition;
pptx.author = "publish-pptx skill";

for (const slideConfig of slides) {
  const slide = pptx.addSlide();

  // Background image
  if (slideConfig.bg) {
    const bgPath = resolveImage(slideConfig.bg);
    if (bgPath) {
      slide.background = { path: bgPath };
    } else {
      slide.background = { fill: { type: "solid", color: "FFFFFF" } };
    }
  } else {
    slide.background = { fill: { type: "solid", color: "FFFFFF" } };
  }

  // Layout rendering
  renderSlideLayout(slide, slideConfig, resolveImage);

  console.log(`  Slide ${slideConfig.index}: ${slideConfig.role} (${slideConfig.layout})`);
}

// ── Save ──────────────────────────────────────────────────────────────────────
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

await pptx.writeFile({ fileName: outputPath });

const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`\n✅ PPTX saved: ${outputPath} (${sizeKB} KB)`);
console.log(`PPTX_PATH=${outputPath}`);

// ── Layout renderers ──────────────────────────────────────────────────────────

function renderSlideLayout(slide, config, resolveImg) {
  switch (config.layout) {
    case "hero-left":
      renderHeroLeft(slide, config, resolveImg);
      break;
    case "hero-center":
      renderHeroCenter(slide, config, resolveImg);
      break;
    case "split-ui-left":
      renderSplitLeft(slide, config, resolveImg);
      break;
    case "split-ui-right":
      renderSplitRight(slide, config, resolveImg);
      break;
    case "workflow-3step":
      renderWorkflow(slide, config, resolveImg);
      break;
    case "problem-solution":
      renderSplitRight(slide, config, resolveImg);
      break;
    case "quote-proof":
      renderQuote(slide, config, resolveImg);
      break;
    default:
      renderHeroLeft(slide, config, resolveImg);
  }
}

function addScreenshot(slide, filename, x, y, w, h, resolveImg) {
  if (!filename) return;
  const imgPath = resolveImg(filename);
  if (!imgPath) return;
  slide.addImage({
    path: imgPath,
    x,
    y,
    w,
    h,
    sizing: { type: "contain" },
    shadow: { type: "outer", blur: 15, offset: 5, angle: 45, color: "000000", opacity: 0.15 },
  });
}

function renderHeroLeft(slide, config, resolveImg) {
  slide.addShape("rect", { x: 0, y: 0, w: "50%", h: "100%", fill: { color: "FFFFFF" } });
  slide.addText(config.headline, {
    x: "5%",
    y: "35%",
    w: "40%",
    h: "auto",
    fontSize: 44,
    bold: true,
    color: "1A1A1A",
    fontFace: "Arial",
    lineSpacing: 52,
    align: "left",
    valign: "middle",
  });
  if (config.subtext) {
    slide.addText(config.subtext, {
      x: "5%",
      y: "55%",
      w: "40%",
      fontSize: 20,
      color: "666666",
      fontFace: "Arial",
      lineSpacing: 30,
      align: "left",
    });
  }
  if (config.images?.[0]) {
    addScreenshot(slide, config.images[0], "52%", "10%", "43%", "80%", resolveImg);
  }
}

function renderHeroCenter(slide, config, resolveImg) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "FFFFFF" } });
  slide.addText(config.headline, {
    x: "10%",
    y: "25%",
    w: "80%",
    fontSize: 54,
    bold: true,
    color: "1A1A1A",
    align: "center",
    fontFace: "Arial",
  });
  if (config.subtext) {
    slide.addText(config.subtext, {
      x: "15%",
      y: "40%",
      w: "70%",
      fontSize: 24,
      color: "666666",
      align: "center",
      fontFace: "Arial",
    });
  }
  if (config.images?.[0]) {
    addScreenshot(slide, config.images[0], "15%", "55%", "70%", "35%", resolveImg);
  }
}

function renderSplitLeft(slide, config, resolveImg) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "FFFFFF" } });
  if (config.images?.[0]) {
    addScreenshot(slide, config.images[0], "5%", "10%", "43%", "80%", resolveImg);
  }
  slide.addText(config.headline, {
    x: "52%",
    y: "25%",
    w: "43%",
    fontSize: 36,
    bold: true,
    color: "1A1A1A",
    align: "left",
    fontFace: "Arial",
    lineSpacing: 44,
  });
  if (config.subtext) {
    slide.addText(config.subtext, {
      x: "52%",
      y: "45%",
      w: "43%",
      fontSize: 18,
      color: "666666",
      align: "left",
      fontFace: "Arial",
      lineSpacing: 26,
    });
  }
  if (config.bullets?.length) {
    slide.addText(
      config.bullets.map((b) => ({ text: b, options: { bullet: true } })),
      {
        x: "52%",
        y: "60%",
        w: "43%",
        fontSize: 16,
        color: "333333",
        fontFace: "Arial",
        lineSpacing: 28,
      },
    );
  }
}

function renderSplitRight(slide, config, resolveImg) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "FFFFFF" } });
  slide.addText(config.headline, {
    x: "5%",
    y: "25%",
    w: "43%",
    fontSize: 36,
    bold: true,
    color: "1A1A1A",
    align: "left",
    fontFace: "Arial",
    lineSpacing: 44,
  });
  if (config.subtext) {
    slide.addText(config.subtext, {
      x: "5%",
      y: "45%",
      w: "43%",
      fontSize: 18,
      color: "666666",
      align: "left",
      fontFace: "Arial",
      lineSpacing: 26,
    });
  }
  if (config.bullets?.length) {
    slide.addText(
      config.bullets.map((b) => ({ text: b, options: { bullet: true } })),
      {
        x: "5%",
        y: "60%",
        w: "43%",
        fontSize: 16,
        color: "333333",
        fontFace: "Arial",
        lineSpacing: 28,
      },
    );
  }
  if (config.images?.[0]) {
    addScreenshot(slide, config.images[0], "52%", "10%", "43%", "80%", resolveImg);
  }
}

function renderWorkflow(slide, config, resolveImg) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "FFFFFF" } });
  slide.addText(config.headline, {
    x: "10%",
    y: "10%",
    w: "80%",
    fontSize: 36,
    bold: true,
    color: "1A1A1A",
    align: "center",
    fontFace: "Arial",
  });
  const steps = config.bullets || ["Step 1", "Step 2", "Step 3"];
  for (let i = 0; i < Math.min(3, steps.length); i++) {
    const x = `${12.5 + i * 31}%`;
    slide.addShape("ellipse", { x, y: "35%", w: 0.8, h: 0.8, fill: { color: "4A90E2" } });
    slide.addText(`${i + 1}`, {
      x,
      y: "35%",
      w: 0.8,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: "FFFFFF",
      align: "center",
      valign: "middle",
      fontFace: "Arial",
    });
    slide.addText(steps[i], {
      x,
      y: "50%",
      w: "25%",
      fontSize: 18,
      color: "333333",
      align: "center",
      fontFace: "Arial",
      lineSpacing: 26,
    });
  }
  if (config.images?.[0]) {
    addScreenshot(slide, config.images[0], "25%", "70%", "50%", "20%", resolveImg);
  }
}

function renderQuote(slide, config, resolveImg) {
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "FFFFFF" } });
  slide.addText(config.headline, {
    x: "10%",
    y: "25%",
    w: "80%",
    fontSize: 40,
    italic: true,
    color: "1A1A1A",
    align: "center",
    fontFace: "Arial",
    lineSpacing: 52,
  });
  if (config.subtext) {
    slide.addText(config.subtext, {
      x: "10%",
      y: "50%",
      w: "80%",
      fontSize: 20,
      color: "666666",
      align: "center",
      fontFace: "Arial",
    });
  }
  if (config.images?.[0]) {
    addScreenshot(slide, config.images[0], "25%", "65%", "50%", "25%", resolveImg);
  }
}
