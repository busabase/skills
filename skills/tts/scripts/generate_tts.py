#!/usr/bin/env python3
"""Generate separate TTS audio files and a manifest.

This script intentionally does not merge audio files. Remotion should place each
audio segment on the timeline.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", value)
    value = value.strip("-")
    return value[:48] or "line"


def load_segments(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        data: Any = json.loads(text)
        if isinstance(data, dict):
            data = data.get("segments") or data.get("lines") or data.get("items")
        if not isinstance(data, list):
            raise SystemExit("JSON input must be a list or contain segments/lines/items list")
        segments: list[dict[str, str]] = []
        for index, item in enumerate(data, start=1):
            if isinstance(item, str):
                segment_id = f"line-{index:03d}"
                segment_text = item
            elif isinstance(item, dict):
                segment_text = str(item.get("text") or item.get("narration") or "").strip()
                segment_id = str(item.get("id") or item.get("key") or f"line-{index:03d}")
            else:
                continue
            if segment_text:
                segments.append({"id": segment_id, "text": segment_text})
        return segments

    segments = []
    for index, line in enumerate(text.splitlines(), start=1):
        line = line.strip()
        if line:
            segments.append({"id": f"line-{index:03d}", "text": line})
    return segments


def ffprobe_duration_ms(path: Path) -> int | None:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                str(path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        data = json.loads(result.stdout)
        return round(float(data["format"]["duration"]) * 1000)
    except Exception:
        return None


def run_fish_client(
    client: Path,
    text: str,
    output: Path,
    reference_audio: str | None,
    reference_text: str | None,
    extra_args: list[str],
) -> None:
    cmd = [sys.executable, str(client), "--text", text, "--output", str(output)]
    if reference_audio:
        cmd.extend(["--reference_audio", reference_audio])
    if reference_text:
        cmd.extend(["--reference_text", reference_text])
    cmd.extend(extra_args)
    subprocess.run(cmd, check=True)


def run_mlx_speech(
    text: str,
    output: Path,
    model: str,
    reference_audio: str | None,
    reference_text: str | None,
    voice: str | None,
    lang_code: str,
    speed: float,
    max_tokens: int,
    extra_args: list[str],
) -> None:
    del voice, lang_code, speed

    try:
        subprocess.run(
            [sys.executable, "-c", "import mlx_speech"],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        raise SystemExit(
            "mlx_speech is required for MLX engines. Install on Apple Silicon Macs with:\n"
            "  uv venv /tmp/kapps-mlx-speech-venv --python 3.14\n"
            "  uv pip install --python /tmp/kapps-mlx-speech-venv/bin/python -U mlx-speech 'huggingface_hub[hf_xet]'\n"
            "Then run this script with /tmp/kapps-mlx-speech-venv/bin/python."
        ) from exc

    cmd = [
        sys.executable,
        "-m",
        "mlx_speech.cli",
        "tts",
        "--model",
        model,
        "--text",
        text,
        "--output",
        str(output),
        "--max-new-tokens",
        str(max_tokens),
    ]
    if reference_audio:
        cmd.extend(["--reference-audio", reference_audio])
    if reference_text:
        cmd.extend(["--reference-text", reference_text])
    cmd.extend(extra_args)
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="JSON or text file with TTS segments")
    parser.add_argument("--out-dir", required=True, type=Path, help="Output directory for audio and manifest")
    parser.add_argument("--engine", choices=["fish-local", "mlx-fish", "mlx-longcat", "dry-run"], default="fish-local")
    parser.add_argument("--fish-client", type=Path, help="Path to fish-speech tools/api_client.py")
    parser.add_argument(
        "--mlx-model",
        default="fish-s2-pro",
        help="MLX Speech model alias, local path, or Hugging Face repo id",
    )
    parser.add_argument("--reference-audio", help="Reference voice audio path for Fish Speech")
    parser.add_argument("--reference-text", help="Transcript for the reference voice audio")
    parser.add_argument("--voice", help="Optional voice name for engines that support built-in voices")
    parser.add_argument("--lang-code", default="zh", help="Reserved for engines that need a language code")
    parser.add_argument("--speed", default=1.0, type=float, help="Reserved for engines that support speed control")
    parser.add_argument("--max-tokens", default=1200, type=int, help="Max generation tokens for MLX Fish")
    parser.add_argument("--ext", default="wav", choices=["wav", "mp3", "flac"], help="Expected output extension")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate existing audio files")
    args, extra_args = parser.parse_known_args()
    if extra_args and extra_args[0] == "--":
        extra_args = extra_args[1:]

    segments = load_segments(args.input)
    if not segments:
        raise SystemExit("No text segments found")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    generated = 0
    skipped = 0

    if args.engine == "fish-local":
        if not args.fish_client:
            raise SystemExit("--fish-client is required for --engine fish-local")
        if not args.fish_client.exists():
            raise SystemExit(f"Fish client not found: {args.fish_client}")

    for index, segment in enumerate(segments, start=1):
        safe_id = slugify(segment["id"])
        filename = f"{index:03d}-{safe_id}.{args.ext}"
        output = args.out_dir / filename

        if args.engine == "dry-run":
            output_path = ""
            duration_ms = None
        else:
            if output.exists() and not args.overwrite:
                skipped += 1
            else:
                print(f"→ {filename}: {segment['text'][:60]}")
                if args.engine == "fish-local":
                    run_fish_client(
                        args.fish_client,
                        segment["text"],
                        output,
                        args.reference_audio,
                        args.reference_text,
                        extra_args,
                    )
                elif args.engine in {"mlx-fish", "mlx-longcat"}:
                    mlx_model = args.mlx_model
                    if args.engine == "mlx-longcat" and mlx_model == "fish-s2-pro":
                        mlx_model = "longcat"
                    run_mlx_speech(
                        segment["text"],
                        output,
                        mlx_model,
                        args.reference_audio,
                        args.reference_text,
                        args.voice,
                        args.lang_code,
                        args.speed,
                        args.max_tokens,
                        extra_args,
                    )
                generated += 1
            output_path = filename
            duration_ms = ffprobe_duration_ms(output) if output.exists() else None

        manifest.append(
            {
                "id": segment["id"],
                "text": segment["text"],
                "audioFile": output_path,
                "durationMs": duration_ms,
            }
        )

    manifest_path = args.out_dir / "manifest.json"
    manifest_path.write_text(json.dumps({"segments": manifest}, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nManifest: {manifest_path}")
    print(f"Segments: {len(segments)} generated={generated} skipped={skipped}")
    unknown = [item["id"] for item in manifest if item["durationMs"] is None]
    if unknown:
        print(f"Unknown duration: {', '.join(unknown)}")


if __name__ == "__main__":
    main()
