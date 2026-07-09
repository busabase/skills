---
name: video-pipeline
description: 把活动视频转录成 SRT，让 AI 找出精彩片段，用 Remotion 渲染成 20 个竖屏+横屏短视频。转录步骤委托 video-transcribe skill；仅需要 SRT/TXT 转写时直接使用 video-transcribe。
allowed-tools: Bash(python3:*), Bash(npx:*), Bash(make:*)
---

# Video Pipeline

把一个活动录像变成 20 个短视频的完整流水线，每个环节都可以 review 和打磨：

```
视频文件（MOV/MP4）
  ↓ Step 1: 转录（使用 video-transcribe）
transcripts/<视频名>.srt + .txt + .timeline.txt
  ↓ Step 2: AI 分析
scripts/<视频名>/clip-01.md ... clip-20.md   ← 每个片段独立文件，可 review/编辑
  ↓ Step 3: /videocut（AI 命令）
clips/<视频名>-clips.json → 渲染 → output/*.mp4
```

## 使用方式

用户说「处理这个视频」或「帮我剪辑活动视频」或「从这个公开视频找 20 个短视频片段」时触发此 skill。

如果用户只说「转录 xxx.mov/mp4」「生成 srt/txt」，直接使用 `$video-transcribe`，不要启动完整剪辑流水线。

---

## Step 1 — 转录视频

Step 1 委托 `$video-transcribe`。加载并遵循 `.agents/skills/video-transcribe/SKILL.md`，不要在本 skill 里重复维护 Whisper/ffmpeg/MLX 依赖说明。

Pipeline 需要把产物放到 `videos/buda-events/transcripts/`，并额外生成 timeline：

```bash
python3 .agents/skills/video-transcribe/scripts/transcribe_video.py "<VIDEO_PATH>" --language zh --model large-v3 --backend mlx --output-dir videos/buda-events/transcripts --timeline
```

**输出到 `videos/buda-events/transcripts/`：**
- `<视频名>.srt` — 字幕文件（带时间戳）
- `<视频名>.txt` — 纯文本转写稿
- `<视频名>.timeline.txt` — 时间线文本（供 AI 分析用）

转录完成后告诉用户：「转录完成，共 X 个片段，时长约 X 分钟。」

---

## Step 2 — AI 分析精彩片段

```bash
npx tsx scripts/ai-clip-analyzer.ts "videos/buda-events/transcripts/<视频名>.srt" --count 20
```

**输出到 `videos/buda-events/scripts/<视频名>/`：**
- `clip-01.md` ... `clip-20.md` — 每个片段一个独立文件

每个 `.md` 文件格式：
```markdown
---
id: clip-01
title: "片段标题"
orientation: portrait
startSec: 651
endSec: 691
durationSec: 40
src: "buda-events/hk-buda-event-0416-h264.mp4"
tags: ["开场hook", "核心概念"]
---

# 片段标题

**格式**：竖屏 9:16 | **时长**：40秒

**描述**：为什么这段精彩

**时间**：视频第 10分51秒 → 第 11分31秒

## 字幕

- 1s: 综合管理部
- 3s: 他们都在这里躺着
...
```

分析完成后展示片段列表：
```
clip-01 | 📱 竖屏 | 40s | 被30只AI接管的公司
clip-02 | 🖥  横屏 | 60s | 5分钟自动生成公众号
...
```

告知用户：「已生成 20 个 script 文件，可以 review 和编辑后运行 /videocut 渲染。」

---

## Step 3 — /videocut 渲染

用户说「/videocut」或「开始渲染」或「渲染 clip-03」时触发。

### 渲染全部

```bash
npx tsx scripts/videocut.ts <视频名>
```

### 只渲染某一个片段

```bash
npx tsx scripts/videocut.ts <视频名> --clip clip-03
```

### 只生成 JSON，不渲染（预览用）

```bash
npx tsx scripts/videocut.ts <视频名> --dry-run
```

videocut 会：
1. 读取 `scripts/<视频名>/*.md` 所有文件
2. 解析 frontmatter + 字幕
3. 生成 `clips/<视频名>-clips.json`
4. 调用 `render-events.sh` 渲染

渲染结果保存到 `videos/buda-events/output/`。

---

## 打磨 Script 的方式

### 方式 1：直接编辑文件

打开 `scripts/<视频名>/clip-03.md`，直接修改：
- `startSec` / `endSec` — 调整时间点
- `title` — 改标题
- `orientation` — 改竖横屏
- `## 字幕` 下的内容 — 修改字幕文字

### 方式 2：跟 AI 对话

用户说：「clip-03 的结束时间往后延 10 秒」
→ AI 读取 `clip-03.md`，修改 `endSec` 和 `durationSec`，更新字幕

用户说：「clip-07 改成横屏」
→ AI 修改 `orientation: landscape`，更新 `width`/`height`

用户说：「clip-01 的标题改成『AI接管公司』」
→ AI 修改 frontmatter 的 `title` 字段

---

## 目录结构

```
videos/buda-events/
├── raw/           → 软链接到外接硬盘（原始视频）
├── transcripts/   → .srt + .txt + .timeline.txt（提交 git）
├── scripts/       → 每个视频一个子目录，每个片段一个 .md（提交 git）
│   └── 直播回放-04月16日/
│       ├── clip-01.md
│       ├── clip-02.md
│       └── ...clip-20.md
├── clips/         → AI 生成的 clips.json（提交 git，由 videocut 生成）
└── output/        → 渲染结果（不提交 git）
```

## 常用场景

### 场景 1：全流程处理新视频

用户说：「帮我处理这个视频 /Volumes/xxx/直播回放.mp4」

按顺序执行 Step 1 → Step 2，完成后告知用户可以 review scripts/ 目录。

### 场景 2：只转录

用户说：「转录一下这个视频」→ 使用 `$video-transcribe`，不要继续 Step 2/Step 3。

### 场景 3：已有 SRT，只分析

用户说：「分析一下这个 SRT」→ 只执行 Step 2。

### 场景 4：review 完毕，开始渲染

用户说：「/videocut」或「开始渲染」→ 执行 Step 3（全部）。

### 场景 5：只渲染某一个

用户说：「渲染 clip-03」→ `npx tsx scripts/videocut.ts <视频名> --clip clip-03`

### 场景 6：修改某个片段后重新渲染

用户说：「clip-05 的结束时间改到第 15 分 30 秒」
→ AI 计算秒数（15*60+30=930），修改 `clip-05.md` 的 `endSec: 930`，更新 `durationSec`
→ 然后运行 `npx tsx scripts/videocut.ts <视频名> --clip clip-05`

## 注意事项

- 转录依赖、MLX/Metal 权限、长时间无进度输出等注意事项，以 `$video-transcribe` 为准。
- 渲染需要视频文件在 `videos/buda-events/raw/` 可访问
- `scripts/` 和 `clips/` 提交到 git，换机器后只需重建软链接即可继续渲染
- `videocut --clip` 模式会合并到现有 clips.json，不会覆盖其他片段
