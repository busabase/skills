---
name: publish-pptx
description: Generate a PPTX from a Remotion composition (via still-frame extraction) or slides.json, then upload to Cloudflare R2 and optionally update an MDX docs file.
disable-model-invocation: false
allowed-tools: Bash(node:*), Bash(npx:*), Bash(tsx:*)
user-invocable: true
---

# Publish PPTX

从 Remotion composition 或 `slides.json` 生成 PPTX，上传到 Cloudflare R2，可选更新 MDX 文档。

## Arguments

- `composition` (required): Remotion composition ID，例如 `buda-intro-general-zh-CN`
- `video-dir` (optional): Remotion 项目路径，默认 `videos/buda`
- `slides-source` (optional): `stills`（截帧，默认）或 `slides-json`（读 slides.json）
- `frames` (optional): 截帧数量，默认 `8`（均匀分布）
- `docs-file` (optional): 要更新的 MDX 文件路径

---

## Step 1 — 确认输入

检查 composition 是否存在于 `<video-dir>/src/Root.tsx`。

如果不存在，列出可用的 composition ID，让用户选择。

---

## Step 2 — 生成 PPTX

### 方式 A：截帧模式（默认，`slides-source=stills`）

用 Remotion `still` 命令在视频时间轴上均匀截取 N 帧，每帧生成一页幻灯片：

```bash
# 计算均匀分布的帧号（0, duration/N, 2*duration/N, ...）
# 对每个帧号执行：
npx remotion still <composition> \
  --frame <frameNumber> \
  --output <video-dir>/out/stills/<composition>/<frameNumber>.png
```

然后运行生成脚本：

```bash
node .agents/skills/publish-pptx/scripts/generate-from-stills.mjs \
  --composition <composition> \
  --stills-dir <video-dir>/out/stills/<composition> \
  --output <video-dir>/out/<composition>.pptx
```

### 方式 B：slides.json 模式（`slides-source=slides-json`）

直接读取 `<video-dir>/content/<composition>/slides.json`（如果存在），调用 PptxGenJS 生成：

```bash
node .agents/skills/publish-pptx/scripts/generate-from-slides.mjs \
  --composition <composition> \
  --video-dir <video-dir> \
  --output <video-dir>/out/<composition>.pptx
```

---

## Step 3 — 确认

展示：
- 幻灯片数量
- 文件大小
- 输出路径

**询问用户："PPTX 已生成，是否上传到 R2？"**

→ 如果否：停止，告知本地路径。

---

## Step 4 — 上传 R2

Key 路径规则：`presentations/<video-dir-name>/<composition>.pptx`

```bash
node .agents/skills/cdn-upload/scripts/upload.mjs \
  --file <video-dir>/out/<composition>.pptx \
  --key presentations/buda/<composition>.pptx
```

脚本会自动比对 MD5，文件未变则跳过上传。

打印公开 URL，格式：`R2_URL=https://...`

---

## Step 5 — 创建 / 更新 MDX 文件

每个 PPTX **必须**在 `apps/buda/content/slides/<lang>/` 下有对应的 MDX 文件。

文件不存在则创建，存在则更新 frontmatter 和下载链接。

### MDX frontmatter（必填字段）

```yaml
---
title: "<演示文稿标题 — 60 字符以内>"
description: "<一句话描述>"
pptxUrl: "<R2_PUBLIC_URL>"
videoUrl: "<对应视频的 R2 URL（可选）>"
lang: <en | zh-CN | ja | pt | zh-TW>
publishedAt: "<YYYY-MM-DD>"
tags:
  - <tag1>
  - <tag2>
---
```

### MDX body 结构

```mdx
<a
  href="<R2_PUBLIC_URL>"
  download
  style={{ display: "inline-block", marginBottom: "16px", fontSize: "14px" }}
>
  📊 Download Presentation (.pptx)
</a>

## <标题>

<2-3 句简介，说明这份 PPT 的用途和内容。>

## Slides Preview

<如果有截帧图片，可以在这里展示 1-2 张预览图>

## Related Video

<如果有对应视频，附上链接>
```

展示变更内容，**询问用户确认后再写入**。

同时更新对应语言的 `meta.json`，把新 slug 加入 `pages` 数组。

---

## 命名规则

**Composition ID = R2 key 文件名 = MDX slug，全部 kebab-case。**

```
Composition ID:  buda-intro-general-zh-CN
R2 key:          presentations/buda/buda-intro-general-zh-CN.pptx
本地输出:         videos/buda/out/buda-intro-general-zh-CN.pptx
截帧目录:         videos/buda/out/stills/buda-intro-general-zh-CN/
MDX 文件:         apps/buda/content/slides/zh-CN/buda-intro-general.mdx
页面 URL:         buda.im/zh-CN/slides/buda-intro-general
```

### Language suffix → MDX directory

| Composition suffix | MDX directory |
|---|---|
| (none / `-en`) | `slides/en/` |
| `-zh-CN` | `slides/zh-CN/` |
| `-zh-TW` | `slides/zh-TW/` |
| `-ja` | `slides/ja/` |
| `-pt` | `slides/pt/` |

---

## Keyframes 配置文件

每个 composition 可以有一个手工确认的 `keyframes.json`，记录精确帧号，避免每次重新截图时手动调整。

**位置：** `<video-dir>/content/<composition>/keyframes.json`

**格式：**
```json
[
  { "frame": 13,  "name": "01-cover",       "note": "Cover card" },
  { "frame": 87,  "name": "02-hook",        "note": "Hook title" },
  { "frame": 154, "name": "03-agent-spawn", "note": "Short demo 1" }
]
```

**已有配置的 compositions：**
- `buda-intro-general` → `videos/buda/content/buda-intro-general/keyframes.json`（40 帧，手工确认）

**使用优先级：**
1. 如果 `keyframes.json` 存在 → 直接用，跳过 `extract-keyframes.mjs`
2. 如果不存在 → 用 `extract-keyframes.mjs` 自动提取（结果需人工确认）

---

## 截帧策略

默认截取 8 帧，均匀分布在整个时间轴：

```
frame_0 = 0
frame_i = round(i * (durationInFrames - 1) / (N - 1))
```

从 `Root.tsx` 读取 `durationInFrames`，或通过 `npx remotion compositions` 获取。

每帧对应 PPTX 的一页，标题为 `Slide N / Total`，无额外文字（保持视觉干净）。

---

## 批量生成所有 composition

```bash
node .agents/skills/publish-pptx/scripts/generate-and-upload-all.mjs
```

对 `COMPOSITIONS` 列表中的每个 composition 依次执行截帧 → 生成 → 上传，跳过未变更文件，失败继续，最后打印汇总。

---

## 环境变量

与 `publish-video` 共用同一套 R2 配置（已内置默认值，无需额外设置）：

```bash
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
```

---

## 依赖

- Node.js 24.18.0 LTS
- `pptxgenjs`：`pnpm add -w pptxgenjs`
- `@aws-sdk/client-s3`：已在 workspace root 安装
- Remotion CLI：已在 `videos/buda` 安装

---

## Known Gotchas

- **截帧速度**：Remotion `still` 每帧约 3-10 秒，8 帧约 1 分钟，提前告知用户。
- **`__dirname` in ESM**：`.mjs` 文件中用 `path.dirname(fileURLToPath(import.meta.url))` 获取脚本目录。
- **PPTX 尺寸**：默认 16:9（1920×1080 对应 10×5.625 英寸），与 Remotion composition 保持一致。
- **截帧输出目录**：如果目录已存在且帧文件比 mp4 新，跳过重新截帧。
