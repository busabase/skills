---
name: video-transcribe
description: Convert local video or audio files such as MP4, MOV, M4A, WAV, and MP3 into SRT subtitle files and plain TXT transcripts. Use when the user asks to transcribe media, extract subtitles, create .srt/.txt output, or convert lecture/class/meeting recordings into text.
---

# Video Transcribe

## Workflow

Use this skill when the task is only transcription. If the user also asks to find highlights or render clips, use `video-pipeline` instead.

1. Resolve the media path exactly. Preserve spaces and non-ASCII characters by quoting paths.
2. Check dependencies:

```bash
which ffmpeg
python3 -c "import mlx_whisper" 2>/dev/null || python3 -c "import whisper" 2>/dev/null
```

For `mlx-whisper`, validate in the same execution context that will run transcription:

```bash
python3 -c "import mlx_whisper; print('mlx_whisper ok')"
```

If this fails with `No Metal device available`, rerun outside sandbox/escalated. MLX needs access to the macOS Metal device; sandboxed or headless contexts may import-fail even when the package is installed.

3. If dependencies are missing, tell the user the exact install command:

```bash
brew install ffmpeg
pip3 install --break-system-packages mlx-whisper
```

Use `openai-whisper` as a portable fallback only when `mlx-whisper` is unavailable or unsuitable:

```bash
pip3 install --break-system-packages openai-whisper
```

4. Run the bundled script. For Apple Silicon, prefer explicit MLX:

```bash
python3 .agents/skills/video-transcribe/scripts/transcribe_video.py "<MEDIA_PATH>" --language zh --model large-v3 --backend mlx
```

Default output is next to the media file:

- `<media-name>.srt`
- `<media-name>.txt`

Use `--output-dir <DIR>` when the user requests a different destination.

Use `--timeline` when another workflow needs a time-coded text file for AI analysis:

```bash
python3 .agents/skills/video-transcribe/scripts/transcribe_video.py "<MEDIA_PATH>" --language zh --model large-v3 --backend mlx --output-dir videos/buda-events/transcripts --timeline
```

This also writes `<media-name>.timeline.txt`.

## Script Notes

The script extracts a temporary 16 kHz mono WAV with ffmpeg, runs Whisper, writes SRT with timestamps, writes TXT as clean paragraphs, optionally writes a timeline text file, and removes the temporary audio unless `--keep-audio` is passed.

Prefer `--language zh` for Chinese lectures/classes. Use auto-detection only when the language is genuinely unknown.

For long videos, warn the user that local transcription can take several minutes to more than an hour depending on hardware and model size. `mlx-whisper` may print no progress during the decode phase; if it has printed `Using mlx-whisper model=...` and has not exited, assume it is still working.

Whisper output is written at the end, not incrementally. Do not expect partial `.srt` or `.txt` files while transcription is running.

## Completion Response

Report:

- absolute paths of the generated `.srt` and `.txt`
- timeline path when `--timeline` was used
- segment count, if the script printed it
- any dependency or model limitation encountered

Do not claim transcription quality manually unless you reviewed the output text.
