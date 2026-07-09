#!/usr/bin/env python3
"""Convert a local media file to SRT subtitles and a TXT transcript."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


def log(message: str) -> None:
    print(message, flush=True)


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True)


def require_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        raise SystemExit("ffmpeg not found. Install with: brew install ffmpeg")


def extract_wav(media_path: Path, wav_path: Path) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(media_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "wav",
        str(wav_path),
    ]
    result = run(cmd)
    if result.returncode != 0:
        raise SystemExit(f"ffmpeg failed:\n{result.stderr}")


def transcribe_mlx(audio_path: Path, model: str, language: str | None) -> dict[str, Any]:
    import mlx_whisper  # type: ignore

    kwargs: dict[str, Any] = {"path_or_hf_repo": f"mlx-community/whisper-{model}-mlx"}
    if language:
        kwargs["language"] = language
    return mlx_whisper.transcribe(str(audio_path), **kwargs)


def transcribe_openai(audio_path: Path, model: str, language: str | None) -> dict[str, Any]:
    import whisper  # type: ignore

    whisper_model = whisper.load_model(model)
    kwargs: dict[str, Any] = {}
    if language:
        kwargs["language"] = language
    return whisper_model.transcribe(str(audio_path), **kwargs)


def transcribe(audio_path: Path, model: str, language: str | None, backend: str) -> dict[str, Any]:
    if backend in {"auto", "mlx"}:
        try:
            log(f"Using mlx-whisper model={model}")
            return transcribe_mlx(audio_path, model, language)
        except ImportError:
            if backend == "mlx":
                raise SystemExit("mlx-whisper not installed. Install with: pip3 install --break-system-packages mlx-whisper")
            log("mlx-whisper not installed; trying openai-whisper")
        except RuntimeError as error:
            message = str(error)
            if "No Metal device available" in message:
                raise SystemExit(
                    "mlx-whisper could not access a Metal device. "
                    "Run outside sandbox/escalated on Apple Silicon, or use --backend openai."
                ) from error
            raise

    if backend in {"auto", "openai"}:
        try:
            log(f"Using openai-whisper model={model}")
            return transcribe_openai(audio_path, model, language)
        except ImportError:
            raise SystemExit(
                "No Whisper backend found. Install mlx-whisper or openai-whisper:\n"
                "  pip3 install --break-system-packages mlx-whisper\n"
                "  pip3 install --break-system-packages openai-whisper"
            )

    raise SystemExit(f"Unsupported backend: {backend}")


def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02}:{minutes:02}:{secs:06.3f}".replace(".", ",")


def write_srt(segments: list[dict[str, Any]], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as file:
        for index, segment in enumerate(segments, start=1):
            start = format_timestamp(float(segment["start"]))
            end = format_timestamp(float(segment["end"]))
            text = str(segment.get("text", "")).strip()
            file.write(f"{index}\n{start} --> {end}\n{text}\n\n")


def write_txt(segments: list[dict[str, Any]], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as file:
        for segment in segments:
            text = str(segment.get("text", "")).strip()
            if text:
                file.write(f"{text}\n")


def write_timeline(segments: list[dict[str, Any]], output_path: Path) -> None:
    with output_path.open("w", encoding="utf-8") as file:
        file.write("# Video Timeline\n\n")
        for segment in segments:
            start = format_timestamp(float(segment["start"])).replace(",", ".")
            end = format_timestamp(float(segment["end"])).replace(",", ".")
            text = str(segment.get("text", "")).strip()
            if text:
                file.write(f"[{start} -> {end}] {text}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert video/audio to SRT and TXT using Whisper.")
    parser.add_argument("media_path", help="Path to MP4/MOV/M4A/WAV/MP3/etc.")
    parser.add_argument("--output-dir", help="Output directory. Defaults to the media file directory.")
    parser.add_argument("--model", default="large-v3", help="Whisper model, e.g. tiny/base/small/medium/large-v3.")
    parser.add_argument("--language", "--lang", dest="language", default=None, help="Language hint, e.g. zh or en.")
    parser.add_argument("--backend", choices=["auto", "mlx", "openai"], default="auto")
    parser.add_argument("--keep-audio", action="store_true", help="Keep extracted WAV next to outputs.")
    parser.add_argument("--timeline", action="store_true", help="Also write <name>.timeline.txt with timestamps.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    media_path = Path(args.media_path).expanduser().resolve()
    if not media_path.exists():
        raise SystemExit(f"Media file not found: {media_path}")

    output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else media_path.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    srt_path = output_dir / f"{media_path.stem}.srt"
    txt_path = output_dir / f"{media_path.stem}.txt"
    timeline_path = output_dir / f"{media_path.stem}.timeline.txt"
    kept_audio_path = output_dir / f"{media_path.stem}.wav"

    require_ffmpeg()
    log(f"Input: {media_path}")
    log(f"Output dir: {output_dir}")

    with tempfile.TemporaryDirectory(prefix="video-transcribe-") as tmp:
        wav_path = kept_audio_path if args.keep_audio else Path(tmp) / "audio.wav"
        log("Extracting audio...")
        extract_wav(media_path, wav_path)

        log("Transcribing...")
        result = transcribe(wav_path, args.model, args.language, args.backend)

    segments = result.get("segments", [])
    if not segments:
        raise SystemExit("Transcription returned no segments.")

    write_srt(segments, srt_path)
    write_txt(segments, txt_path)
    if args.timeline:
        write_timeline(segments, timeline_path)

    log(f"Segments: {len(segments)}")
    log(f"SRT: {srt_path}")
    log(f"TXT: {txt_path}")
    if args.timeline:
        log(f"Timeline: {timeline_path}")
    if args.keep_audio:
        log(f"Audio: {kept_audio_path}")


if __name__ == "__main__":
    main()
