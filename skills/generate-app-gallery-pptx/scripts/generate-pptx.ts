#!/usr/bin/env tsx

// Generate PPTX from slides.json and assets
// Usage: tsx generate-pptx.ts --app <appName> [options]
// Options: --language en|zh|bilingual, --tone minimal|bold|playful|serious, --slides-count 3-5

import { existsSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import PptxGenJS from "pptxgenjs";

interface SlideConfig {
  index: number;
  role: "hero" | "problem" | "solution" | "workflow" | "proof" | "cta";
  headline: string;
  subtext?: string;
  layout: string;
  bg?: string;
  images?: string[];
  bullets?: string[];
}

interface SlidesJson {
  meta: {
    app: string;
    generatedAt: string;
    language: string;
    tone: string;
  };
  slides: SlideConfig[];
}

interface GenerateOptions {
  app: string;
  language: "en" | "zh" | "bilingual";
  tone: "minimal" | "bold" | "playful" | "serious";
  slidesCount: number;
}

const DEFAULT_OPTIONS: Partial<GenerateOptions> = {
  language: "en",
  tone: "bold",
  slidesCount: 5,
};

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): GenerateOptions {
  const options: Partial<GenerateOptions> = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--app":
        options.app = args[++i];
        break;
      case "--language":
        options.language = args[++i] as "en" | "zh" | "bilingual";
        break;
      case "--tone":
        options.tone = args[++i] as "minimal" | "bold" | "playful" | "serious";
        break;
      case "--slides-count":
        options.slidesCount = Number.parseInt(args[++i], 10);
        break;
    }
  }

  if (!options.app) {
    console.error("❌ Error: --app argument is required");
    process.exit(1);
  }

  return options as GenerateOptions;
}

/**
 * Find all screenshots in the app's public directory
 */
function findScreenshots(appDir: string): string[] {
  const screenshotDirs = [
    join(appDir, "public", "screenshots"),
    join(appDir, "public", "assets", "screenshots"),
  ];

  const screenshots: string[] = [];
  for (const dir of screenshotDirs) {
    if (existsSync(dir)) {
      const files = readdirSync(dir).filter(
        (f) => f.match(/\.(png|jpg|jpeg|webp)$/i) && !f.includes(".original."),
      );
      screenshots.push(...files.map((f) => join(dir, f)));
    }
  }

  return screenshots;
}

/**
 * Generate default slides.json if it doesn't exist
 */
async function generateSlidesJson(
  galleryDir: string,
  options: GenerateOptions,
  screenshots: string[],
): Promise<SlidesJson> {
  const slidesJsonPath = join(galleryDir, "slides.json");

  if (existsSync(slidesJsonPath)) {
    const content = await readFile(slidesJsonPath, "utf-8");
    return JSON.parse(content);
  }

  // Generate default slides configuration
  const slides: SlideConfig[] = [
    {
      index: 1,
      role: "hero",
      headline: "Build Products That Ship",
      subtext: "Turn ideas into revenue-generating products in minutes",
      layout: "hero-left",
      bg: "gallery-bg-0.png",
      images: screenshots.slice(0, 1).map((s) => s.split("/").pop() || ""),
    },
    {
      index: 2,
      role: "problem",
      headline: "The Problem: Too Much Time, Too Little Value",
      subtext: "Professional results in minutes",
      layout: "split-ui-right",
      bg: "gallery-bg-0.png",
      images: screenshots.slice(1, 2).map((s) => s.split("/").pop() || ""),
    },
    {
      index: 3,
      role: "solution",
      headline: "The Solution: One Process, Perfect Results",
      subtext: "Streamlined workflow that just works",
      layout: "split-ui-left",
      bg: "gallery-bg-0.png",
      images: screenshots.slice(2, 3).map((s) => s.split("/").pop() || ""),
      bullets: ["Upload", "Transform", "Done"],
    },
    {
      index: 4,
      role: "workflow",
      headline: "How It Works: 3 Simple Steps",
      subtext: "",
      layout: "workflow-3step",
      bg: "gallery-bg-0.png",
      images: screenshots.slice(3, 4).map((s) => s.split("/").pop() || ""),
      bullets: ["Step 1: Input", "Step 2: Process", "Step 3: Output"],
    },
    {
      index: 5,
      role: "proof",
      headline: '"Built by Developers, For Developers"',
      subtext: "Professional-grade platform",
      layout: "split-ui-right",
      bg: "gallery-bg-0.png",
      images: screenshots.slice(4, 5).map((s) => s.split("/").pop() || ""),
    },
  ].slice(0, options.slidesCount);

  const slidesJson: SlidesJson = {
    meta: {
      app: options.app,
      generatedAt: new Date().toISOString().split("T")[0],
      language: options.language,
      tone: options.tone,
    },
    slides,
  };

  await writeFile(slidesJsonPath, JSON.stringify(slidesJson, null, 2));
  console.log(`✅ Generated: ${slidesJsonPath}`);

  return slidesJson;
}

/**
 * Create a Product Hunt quality slide layout
 */
function createSlide(
  pptx: PptxGenJS,
  slide: SlideConfig,
  srcDir: string,
  screenshotsFullPaths: string[],
) {
  const pptxSlide = pptx.addSlide();

  // Background - use solid gradient instead of transparent black overlay
  if (slide.bg) {
    const bgPath = join(srcDir, slide.bg);
    if (existsSync(bgPath)) {
      pptxSlide.background = { path: bgPath };
    }
  } else {
    // Clean gradient background
    pptxSlide.background = {
      fill: {
        type: "solid",
        color: "FFFFFF",
      },
    };
  }

  // Layout-specific implementations with Product Hunt quality
  switch (slide.layout) {
    case "hero-left":
      createHeroLeftLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    case "hero-center":
      createHeroCenterLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    case "split-ui-left":
      createSplitUILeftLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    case "split-ui-right":
      createSplitUIRightLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    case "workflow-3step":
      createWorkflow3StepLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    case "problem-solution":
      createProblemSolutionLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    case "quote-proof":
      createQuoteProofLayout(pptxSlide, slide, screenshotsFullPaths);
      break;
    default:
      createHeroLeftLayout(pptxSlide, slide, screenshotsFullPaths);
  }
}

/**
 * Hero Left Layout - Product Hunt style
 */
function createHeroLeftLayout(slide: PptxGenJS.Slide, config: SlideConfig, screenshots: string[]) {
  // White content area on left (50%)
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "50%",
    h: "100%",
    fill: { color: "FFFFFF" },
  });

  // Headline - large, bold
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

  // Subtext - elegant spacing
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

  // Screenshot on right with subtle shadow
  if (config.images && config.images.length > 0) {
    const screenshotPath = findScreenshotPath(config.images[0], screenshots);
    if (screenshotPath && existsSync(screenshotPath)) {
      slide.addImage({
        path: screenshotPath,
        x: "52%",
        y: "10%",
        w: "43%",
        h: "80%",
        sizing: { type: "contain" },
        shadow: {
          type: "outer",
          blur: 15,
          offset: 5,
          angle: 45,
          color: "000000",
          opacity: 0.15,
        },
      });
    }
  }
}

/**
 * Hero Center Layout
 */
function createHeroCenterLayout(
  slide: PptxGenJS.Slide,
  config: SlideConfig,
  screenshots: string[],
) {
  // Clean white background
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "FFFFFF" },
  });

  // Centered headline
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

  // Centered subtext
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

  // Centered screenshot below
  if (config.images && config.images.length > 0) {
    const screenshotPath = findScreenshotPath(config.images[0], screenshots);
    if (screenshotPath && existsSync(screenshotPath)) {
      slide.addImage({
        path: screenshotPath,
        x: "15%",
        y: "55%",
        w: "70%",
        h: "35%",
        sizing: { type: "contain" },
        shadow: {
          type: "outer",
          blur: 15,
          offset: 5,
          angle: 45,
          color: "000000",
          opacity: 0.15,
        },
      });
    }
  }
}

/**
 * Split UI Left Layout - Screenshot on left, content on right
 */
function createSplitUILeftLayout(
  slide: PptxGenJS.Slide,
  config: SlideConfig,
  screenshots: string[],
) {
  // White background
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "FFFFFF" },
  });

  // Screenshot on left
  if (config.images && config.images.length > 0) {
    const screenshotPath = findScreenshotPath(config.images[0], screenshots);
    if (screenshotPath && existsSync(screenshotPath)) {
      slide.addImage({
        path: screenshotPath,
        x: "5%",
        y: "10%",
        w: "43%",
        h: "80%",
        sizing: { type: "contain" },
        shadow: {
          type: "outer",
          blur: 15,
          offset: 5,
          angle: 45,
          color: "000000",
          opacity: 0.15,
        },
      });
    }
  }

  // Content on right
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

  // Bullets if present
  if (config.bullets && config.bullets.length > 0) {
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

/**
 * Split UI Right Layout - Content on left, screenshot on right
 */
function createSplitUIRightLayout(
  slide: PptxGenJS.Slide,
  config: SlideConfig,
  screenshots: string[],
) {
  // White background
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "FFFFFF" },
  });

  // Content on left
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

  // Bullets if present
  if (config.bullets && config.bullets.length > 0) {
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

  // Screenshot on right
  if (config.images && config.images.length > 0) {
    const screenshotPath = findScreenshotPath(config.images[0], screenshots);
    if (screenshotPath && existsSync(screenshotPath)) {
      slide.addImage({
        path: screenshotPath,
        x: "52%",
        y: "10%",
        w: "43%",
        h: "80%",
        sizing: { type: "contain" },
        shadow: {
          type: "outer",
          blur: 15,
          offset: 5,
          angle: 45,
          color: "000000",
          opacity: 0.15,
        },
      });
    }
  }
}

/**
 * Workflow 3-Step Layout
 */
function createWorkflow3StepLayout(
  slide: PptxGenJS.Slide,
  config: SlideConfig,
  screenshots: string[],
) {
  // White background
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "FFFFFF" },
  });

  // Title at top
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

  // 3 steps in columns
  const steps = config.bullets || ["Step 1", "Step 2", "Step 3"];
  const stepWidth = "25%";
  const startX = 12.5;

  for (let i = 0; i < Math.min(3, steps.length); i++) {
    const x = `${startX + i * 31}%`;

    // Step number circle
    slide.addShape("ellipse", {
      x,
      y: "35%",
      w: 0.8,
      h: 0.8,
      fill: { color: "4A90E2" },
    });

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

    // Step text
    slide.addText(steps[i], {
      x,
      y: "50%",
      w: stepWidth,
      fontSize: 18,
      color: "333333",
      align: "center",
      fontFace: "Arial",
      lineSpacing: 26,
    });
  }

  // Optional screenshot at bottom
  if (config.images && config.images.length > 0) {
    const screenshotPath = findScreenshotPath(config.images[0], screenshots);
    if (screenshotPath && existsSync(screenshotPath)) {
      slide.addImage({
        path: screenshotPath,
        x: "25%",
        y: "70%",
        w: "50%",
        h: "20%",
        sizing: { type: "contain" },
      });
    }
  }
}

/**
 * Problem-Solution Layout
 */
function createProblemSolutionLayout(
  slide: PptxGenJS.Slide,
  config: SlideConfig,
  screenshots: string[],
) {
  createSplitUIRightLayout(slide, config, screenshots);
}

/**
 * Quote/Proof Layout
 */
function createQuoteProofLayout(
  slide: PptxGenJS.Slide,
  config: SlideConfig,
  screenshots: string[],
) {
  // White background
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "FFFFFF" },
  });

  // Large quote
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

  // Attribution
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

  // Supporting screenshot
  if (config.images && config.images.length > 0) {
    const screenshotPath = findScreenshotPath(config.images[0], screenshots);
    if (screenshotPath && existsSync(screenshotPath)) {
      slide.addImage({
        path: screenshotPath,
        x: "25%",
        y: "65%",
        w: "50%",
        h: "25%",
        sizing: { type: "contain" },
      });
    }
  }
}

/**
 * Find screenshot path by filename
 */
function findScreenshotPath(filename: string, allScreenshots: string[]): string | null {
  return allScreenshots.find((s) => s.endsWith(filename)) || null;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  console.log("🎨 Generating App Gallery PPTX\n");
  console.log("Configuration:");
  console.log(`  - App: ${options.app}`);
  console.log(`  - Language: ${options.language}`);
  console.log(`  - Tone: ${options.tone}`);
  console.log(`  - Slides: ${options.slidesCount}\n`);

  const baseDir = process.cwd();
  const appDir = join(baseDir, "apps", options.app);
  const galleryDir = join(appDir, "marketing", "gallery");
  const srcDir = join(galleryDir, "src");

  // Verify prerequisites
  if (!existsSync(galleryDir)) {
    console.error(`❌ Error: Gallery directory not found: ${galleryDir}`);
    process.exit(1);
  }

  if (!existsSync(srcDir)) {
    console.error(`❌ Error: Source directory not found: ${srcDir}`);
    process.exit(1);
  }

  const bgExists = existsSync(join(srcDir, "gallery-bg-0.png"));
  if (!bgExists) {
    console.error("❌ Error: gallery-bg-0.png not found in src/");
    process.exit(1);
  }

  // Find all screenshots
  const screenshots = findScreenshots(appDir);
  console.log(`📸 Found ${screenshots.length} screenshots`);

  if (screenshots.length === 0) {
    console.error("❌ Error: No screenshots found");
    process.exit(1);
  }

  // Generate or load slides.json
  console.log("\n📄 Loading slides configuration...");
  const slidesJson = await generateSlidesJson(galleryDir, options, screenshots);

  // Create PPTX
  console.log("\n🎬 Creating PPTX presentation...");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "App Gallery Generator";
  pptx.title = `${options.app} Gallery`;

  // Generate each slide
  for (const slideConfig of slidesJson.slides) {
    console.log(`  - Slide ${slideConfig.index}: ${slideConfig.role} (${slideConfig.layout})`);
    createSlide(pptx, slideConfig, srcDir, screenshots);
  }

  // Save PPTX
  const outputPath = join(galleryDir, "gallery.pptx");
  await pptx.writeFile({ fileName: outputPath });

  console.log("\n✅ PPTX generated successfully!");
  console.log(`📦 Output: ${outputPath}\n`);
}

main().catch((error) => {
  console.error("❌ Generation failed:", error);
  process.exit(1);
});
