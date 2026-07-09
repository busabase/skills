---
name: youtube-shorts-letterbox
description: Convert local horizontal or non-9:16 video files into YouTube Shorts-ready vertical 9:16 MP4s by centering the original video on a black canvas without cropping. Use when the user wants to upload landscape footage to YouTube Shorts, add black bars, pad video to 1080x1920, or make a Shorts version while preserving the full frame.
---

# YouTube Shorts Letterbox

## Workflow

Use this skill when the user provides a local video and wants a YouTube Shorts-ready 9:16 version with the original frame preserved. Also use it when the user needs a YouTube Shorts cover: Shorts cannot always upload a separate custom cover image, so this skill can prepend a short cover image segment as the first video frames.

1. Resolve the input video path exactly. Quote paths because media filenames often contain spaces or non-ASCII characters.
2. Check `ffmpeg` and `ffprobe`:

```bash
which ffmpeg
which ffprobe
```

If missing, tell the user to install them:

```bash
brew install ffmpeg
```

3. Run the bundled script:

```bash
.agents/skills/youtube-shorts-letterbox/scripts/make_shorts_letterbox.sh "<VIDEO_PATH>"
```

Default output is next to the media file:

```text
<media-name>-shorts.mp4
```

Use `--output <PATH>` when the user requests a specific destination:

```bash
.agents/skills/youtube-shorts-letterbox/scripts/make_shorts_letterbox.sh "<VIDEO_PATH>" --output "<OUTPUT_PATH>"
```

Use `--size 720x1280` only when the user explicitly wants smaller output. Default is `1080x1920`.

Use `--cover <IMAGE_PATH>` when the user wants a specific image to be selectable as the Shorts cover. The image is scaled, centered, and padded to the same 9:16 canvas, then prepended to the output video:

```bash
.agents/skills/youtube-shorts-letterbox/scripts/make_shorts_letterbox.sh "<VIDEO_PATH>" --cover "<IMAGE_PATH>"
```

Default cover duration is 1.5 seconds. Use `--cover-duration <SECONDS>` when the user requests a longer or shorter first-frame segment:

```bash
.agents/skills/youtube-shorts-letterbox/scripts/make_shorts_letterbox.sh "<VIDEO_PATH>" --cover "<IMAGE_PATH>" --cover-duration 2
```

When a cover is prepended, the script applies a short smooth transition into the source video by default: 0.35 seconds of video crossfade plus audio acrossfade. Use `--transition-duration <SECONDS>` to tune it, or `--transition-duration 0` only when the user explicitly wants a hard cut:

```bash
.agents/skills/youtube-shorts-letterbox/scripts/make_shorts_letterbox.sh "<VIDEO_PATH>" --cover "<IMAGE_PATH>" --transition-duration 0.5
```

## Conversion Rules

- Preserve the full original video frame; do not crop unless the user explicitly asks.
- Use a black background canvas.
- Center the video on a 9:16 canvas.
- Keep audio when present; encode audio as AAC for upload compatibility.
- When `--cover` is provided, prepend the cover image as a short video segment before the original video.
- When `--cover` is provided, use a short smooth transition into the source video by default rather than a hard visual cut.
- If the source video has audio, add silent AAC audio to the cover segment so ffmpeg concatenation remains stable.
- Output MP4 with H.264 video for broad YouTube compatibility.
- Keep metadata minimal and verify the final dimensions with `ffprobe`.

## Completion Response

Report:

- absolute output path
- final width and height
- duration, if printed
- whether audio was included
- cover path and cover duration, if a cover was prepended
- transition duration, if a cover was prepended
- any dependency or conversion failure

Do not claim upload success unless you actually uploaded the video.
