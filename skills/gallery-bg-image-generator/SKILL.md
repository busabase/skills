---
name: gallery-bg-image-generator
description: Generate cool background images for Product Hunt gallery slides. Only used when gallery-bg-*.png missing and user agrees to generate. Requires image model configuration.
disable-model-invocation: true
allowed-tools: Bash(python:*), Write
argument-hint: "[app-name] [style]"
---

# Gallery Background Image Generator

Generate background images suitable for Product Hunt Gallery slides - abstract, minimal, no product UI.

## Goal

Generate background-only images (no screenshots, no text) for:
- `apps/<app>/marketing/gallery/src/gallery-bg-0.png`
- Optionally: `gallery-bg-1.png`, `gallery-bg-2.png`, ...

## Hard Rules

1. **Always suggest user provides their own backgrounds first**
   - Only generate when user explicitly agrees
   
2. **Generated images must be suitable as backgrounds**
   - Large negative space for text/screenshots
   - Not overly busy or distracting
   - Avoid text overlays
   
3. **No copyright violations**
   - No brand logos
   - No watermarks
   - No copyrighted specific content
   
4. **Explicit style selection required**
   - User must choose A/B/C/D/E
   - Default to B (minimal-gradient) if not specified

## Inputs

- `appName`: string (required)
- `style`: "dark-neon" | "minimal-gradient" | "cyberpunk" | "soft-paper" | "glass" (required)
- `count`: 1-3 (default: 1)

## Output Files

Writes to `apps/<app>/marketing/gallery/src/`:
- `gallery-bg-0.png` (always)
- `gallery-bg-1.png` (if count > 1)
- `gallery-bg-2.png` (if count > 2)

## Style Presets

### A) Dark Neon
**Prompt:**
```
Dark background with neon gradients and subtle glow lines.
Modern tech vibe with plenty of negative space.
Abstract geometric shapes, vibrant accent colors (purple, cyan, pink).
Professional Product Hunt aesthetic.
Wide canvas ratio, no text, no logos.
```

**Use for:** Tech products, developer tools, SaaS platforms

### B) Minimal Gradient (Default)
**Prompt:**
```
Clean minimal gradient background with soft lighting.
Modern SaaS aesthetic with lots of negative space.
Subtle color transitions (blue to purple, or warm tones).
Professional, trustworthy, elegant.
Wide canvas ratio, no text, no logos.
```

**Use for:** Business tools, productivity apps, professional services

### C) Cyberpunk
**Prompt:**
```
High contrast cyberpunk abstract background.
Kept minimal with controlled detail and negative space.
Futuristic geometric patterns, neon accents.
Dark base with bright highlights.
Wide canvas ratio, no text, no logos.
```

**Use for:** Gaming, AI tools, cutting-edge tech

### D) Soft Paper
**Prompt:**
```
Soft paper texture with pastel colors.
Friendly, approachable, minimal pattern.
Plenty of negative space, warm feeling.
Subtle texture, not flat but not busy.
Wide canvas ratio, no text, no logos.
```

**Use for:** Consumer apps, wellness, education, family products

### E) Glassmorphism
**Prompt:**
```
Glassmorphism abstract background with translucent shapes.
Subtle blur effects, modern frosted glass aesthetic.
Clean, sophisticated, plenty of negative space.
Layered semi-transparent elements.
Wide canvas ratio, no text, no logos.
```

**Use for:** Modern apps, design tools, premium products

## Image Generation Prompt Template

**Base requirements for all styles:**
```
Create a wide background image suitable for presentation slides.
Ratio: 16:9 or wider
Safe areas: 
  - Center-left: clear space for headline text
  - Center-right: clear space for product screenshots
No readable text, no logos, no watermarks.
High quality, professional, modern.
Abstract/geometric only - no realistic photos.
```

**Final prompt structure:**
```
{style_preset}

Technical requirements:
- Aspect ratio: 16:9 (1920x1080 or higher)
- Safe zones for text and UI overlays
- High contrast but balanced
- Export ready for PPTX use
```

## User Interaction

**When invoked from generate-app-gallery:**

```
I can generate a background image now. Pick a style:

A) Dark neon (Product Hunt vibe)
B) Minimal gradient (clean SaaS) ⭐ Recommended
C) Cyberpunk (high contrast)
D) Soft paper (friendly)
E) Glassmorphism (modern)

If you don't pick, I'll use B (minimal gradient).
```

**After generation:**

```
✨ Generated background image!

📁 Saved to: apps/<app>/marketing/gallery/src/gallery-bg-0.png

Style: {style}
Resolution: {width}x{height}

Tip: You can replace this with your own background anytime.
Just name it gallery-bg-0.png and keep it in the src/ folder.
```

## Requirements

- Image generation model configured (DALL-E, Midjourney, Stable Diffusion, etc.)
- API credentials available
- Output directory writable

## Error Handling

**If image model not configured:**
```
❌ Image generation requires an image model to be configured.

Please either:
1. Add your own background image to apps/<app>/marketing/gallery/src/
   - Name it: gallery-bg-0.png
   - Recommended size: 1920x1080 or larger
   
2. Configure an image generation API:
   - DALL-E (OpenAI)
   - Stable Diffusion
   - Midjourney
```

**If generation fails:**
```
❌ Background generation failed: {error}

Please add your own background image instead:
1. Create/download a suitable background
2. Save as: apps/<app>/marketing/gallery/src/gallery-bg-0.png
3. Make sure it has clear space for text and screenshots
```

## Done Criteria

✅ At least `gallery-bg-0.png` exists in target `src/` folder
✅ Image is suitable aspect ratio (16:9 or wider)
✅ Image has sufficient negative space for overlays

## Example Usage

```bash
# From generate-app-gallery (automatic prompt)
# User selects style A-E when asked

# Manual invocation
/gallery-bg-image-generator productready dark-neon

# Generate multiple backgrounds
/gallery-bg-image-generator memtable minimal-gradient --count 3
```

## Best Practices

1. **Always prefer user-provided backgrounds**
   - User knows their brand better
   - Can match existing marketing materials
   - No API costs

2. **Generate only when necessary**
   - Don't auto-generate without asking
   - Explain what will be generated
   - Offer preview/regeneration option

3. **Quality over speed**
   - Use highest quality settings
   - Allow time for generation
   - Offer to regenerate if unsatisfied

## Related Skills

- `/generate-app-gallery` - Main command (calls this skill when needed)
- `/generate-app-gallery-pptx` - PPTX generator (uses generated backgrounds)
- `/optimize-images` - Optimize images after generation
