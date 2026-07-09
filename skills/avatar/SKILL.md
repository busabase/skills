---
name: avatar
description: Generate talking-avatar videos from a portrait image and voice audio, especially with LongCat Avatar on WaveSpeed. Use when the user asks for LongCat Avatar, talking head/avatar video, lip-sync avatar generation, or converting TTS audio plus an image into an avatar video. This skill creates avatar video assets only; it does not generate TTS, merge audio, or edit Remotion timelines unless separately requested.
---

# Avatar

Generate a talking-avatar video from:

- a portrait/headshot image URL
- a narration audio URL
- an optional motion prompt

## Boundary

This skill only does:

- Submit image + audio to a talking-avatar model.
- Poll the prediction until it completes.
- Save the result URL and metadata.
- Optionally download the generated video.

This skill does not:

- Generate narration audio; use `$tts` first.
- Upload local files; use `cdn-upload` or another public asset host first.
- Edit or render Remotion timelines unless the user separately asks for that.


## Preferred: Local Open-Source LongCat

LongCat-Video-Avatar is open source from Meituan LongCat. Use this route when the user wants local/offline generation, no hosted API, or full control over model weights and inference code.

Primary resources to check before running locally:

- GitHub/code: `https://github.com/meituan-longcat/LongCat-Video`
- Hugging Face v1.5 weights: `https://huggingface.co/meituan-longcat/LongCat-Video-Avatar-1.5`
- Hugging Face v1.0 weights: `https://huggingface.co/meituan-longcat/LongCat-Video-Avatar`
- Project page v1.5: `https://meigen-ai.github.io/LongCat-Video-Avatar-1.5-Page/`

Local generation is heavier than the hosted API. Before attempting it, confirm:

- GPU/CUDA environment and VRAM are sufficient for the selected checkpoint.
- The current GitHub README install/inference commands have been checked, because they may change.
- Model weights are downloaded through Hugging Face.
- Source assets are local image/audio files. Public URLs are not required for local inference.

Typical setup shape:

```bash
git clone --single-branch --branch main https://github.com/meituan-longcat/LongCat-Video
cd LongCat-Video
# Follow the repository README for environment setup.
huggingface-cli download meituan-longcat/LongCat-Video-Avatar-1.5 \
  --local-dir ./weights/LongCat-Video-Avatar-1.5
```

Then run the repo's current avatar/image+audio inference command. Put generated videos under the product video asset folder, for example:

```bash
/home/kelly/Documents/kapps3/videos/buda/public/avatar/qin/intro/avatar.mp4
```

## Optional: Hosted WaveSpeed LongCat

LongCat Avatar on WaveSpeed expects public URLs. If the user gives local files, first upload them to CDN/R2.

Required environment:

```bash
export WAVESPEED_API_KEY="..."
```

Generate:

```bash
python3 .agents/skills/avatar/scripts/generate_longcat_avatar.py \
  --image-url "https://cdn.example.com/avatar.png" \
  --audio-url "https://cdn.example.com/narration.wav" \
  --out-dir videos/buda/public/avatar/qin/intro \
  --prompt "A professional presenter speaking naturally to camera" \
  --resolution 720p \
  --download
```

The script writes:

- `prediction.json` with request/status/result metadata
- `result-url.txt` with the generated video URL
- `avatar.mp4` when `--download` is used

To use the 1.5 variant instead, pass:

```bash
--model wavespeed-ai/longcat-avatar-1.5
```

## Practical Prompting

Keep prompts short and physical:

- good: `A calm product presenter speaks naturally, subtle head movement, steady eye contact.`
- good: `A friendly SaaS founder explains the workflow, natural lipsync, clean posture.`
- avoid: product UI instructions, long scripts, or editing directions

## Checks

Before running:

```bash
test -n "$WAVESPEED_API_KEY"
```

After generation, report:

- metadata path
- output video URL
- downloaded video path, if any
- whether the source image/audio were public URLs
