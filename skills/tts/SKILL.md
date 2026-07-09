---
name: tts
description: Generate per-line text-to-speech audio assets from narration or caption text, especially for Remotion videos. Use when the user asks for TTS, voiceover, narration audio, Fish Audio/Fish Speech audio generation, or per-caption audio files. This skill only creates separate audio files and a manifest; it does not merge audio or edit Remotion timing.
---

# TTS

Generate separate narration audio files from text segments.

## Boundary

This skill only does:

- Convert segmented text into separate audio files.
- Write a manifest with `id`, `text`, `audioFile`, and `durationMs`.
- Optionally estimate/probe duration with `ffprobe`.

This skill does not:

- Merge audio files.
- Render video.
- Decide Remotion sequence timing.
- Rewrite Remotion timelines unless the user separately asks for that.

Remotion should consume the generated manifest and place each audio file where the video needs it.

## Preferred Input

Use JSON when possible:

```json
[
  { "id": "intro-01", "text": "Introducing Qin." },
  { "id": "intro-02", "text": "Think Git for knowledge bases." }
]
```

Plain text is also acceptable: one non-empty line becomes one audio segment.

## Engines

Supported engines:

- `dry-run`: writes only `manifest.json`, useful when TTS is not configured yet.
- `mlx-fish`: recommended Mac local engine for Fish S2 Pro; supports voice cloning and emotion/prosody tags via `mlx-speech`.
- `mlx-longcat`: Mac local LongCat AudioDiT engine; useful when the user asks for LongCat or wants a second local voice option.
- `fish-local`: talks to a separately configured Fish Speech API server via `tools/api_client.py`.

## Mac Local MLX Workflow

For Apple Silicon Macs, prefer the MLX engines. They run local 8-bit MLX models and do not need an API server.

Recommended environment:

```bash
uv venv /tmp/kapps-mlx-speech-venv --python 3.14
uv pip install --python /tmp/kapps-mlx-speech-venv/bin/python -U mlx-speech "huggingface_hub[hf_xet]"
```

Use Fish S2 Pro for voice cloning and emotion/prosody tags:

```bash
/tmp/kapps-mlx-speech-venv/bin/python .agents/skills/tts/scripts/generate_tts.py \
  --input /tmp/qin-lines.json \
  --out-dir videos/buda/public/audio/qin/media/zh-CN \
  --engine mlx-fish \
  --mlx-model fish-s2-pro
```

Use LongCat when the user asks for LongCat or wants an alternate local TTS voice:

```bash
/tmp/kapps-mlx-speech-venv/bin/python .agents/skills/tts/scripts/generate_tts.py \
  --input /tmp/qin-lines.json \
  --out-dir videos/buda/public/audio/qin/media/zh-CN \
  --engine mlx-longcat
```

The first run downloads model files from Hugging Face:

- `mlx-fish`: `appautomaton/fishaudio-s2-pro-8bit-mlx`, about 6 GB.
- `mlx-longcat`: `appautomaton/longcat-audiodit-3.5b-8bit-mlx`, about 5 GB.

Use Hugging Face cache commands to inspect or clean local models:

```bash
hf cache ls
du -sh ~/.cache/huggingface/hub/models--*
```

For voice cloning, pass a clean reference recording and its exact transcript:

```bash
/tmp/kapps-mlx-speech-venv/bin/python .agents/skills/tts/scripts/generate_tts.py \
  --input /tmp/qin-lines.json \
  --out-dir videos/buda/public/audio/qin/media/zh-CN \
  --engine mlx-fish \
  --reference-audio /path/to/reference.wav \
  --reference-text "exact transcript of the reference audio"
```

If basic non-reference generation is garbled, use reference audio; Fish S2 Pro is much more stable when conditioned on a real speaker sample.

For talking-avatar or digital-human requests that mention LongCat, prefer LongCat audio first, then hand off to the avatar skill with `longcat-video-avatar` when available.

## Fish Speech API Workflow

Use the bundled script:

```bash
python3 .agents/skills/tts/scripts/generate_tts.py \
  --input path/to/narration.json \
  --out-dir videos/buda/public/audio/qin/intro-media/zh-CN \
  --engine fish-local \
  --fish-client /path/to/fish-speech/tools/api_client.py \
  --reference-audio /path/to/reference.wav \
  --reference-text "reference transcript"
```

For a local Fish Speech server/client, pass extra arguments after `--` and the script will forward them to the Fish client.

Example:

```bash
python3 .agents/skills/tts/scripts/generate_tts.py \
  --input /tmp/qin-lines.json \
  --out-dir videos/buda/public/audio/qin/media/en \
  --engine fish-local \
  --fish-client ~/fish-speech/tools/api_client.py \
  -- \
  --server http://127.0.0.1:8080
```

If Fish Speech is not configured yet, run dry-run to create the manifest scaffold:

```bash
python3 .agents/skills/tts/scripts/generate_tts.py \
  --input /tmp/qin-lines.json \
  --out-dir videos/buda/public/audio/qin/media/en \
  --engine dry-run
```

## Output

The script writes:

- `NNN-<id>.wav` or `NNN-<id>.mp3` per segment, depending on engine output.
- `manifest.json` in the output directory.

Use the manifest from Remotion. Keep audio files separate.

## Checks

Before generating real audio:

```bash
which ffprobe || true
test -f /path/to/fish-speech/tools/api_client.py
```

After generation, report:

- manifest path
- number of generated/skipped segments
- output directory
- any segments with unknown duration
