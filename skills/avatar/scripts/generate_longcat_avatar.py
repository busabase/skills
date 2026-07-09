#!/usr/bin/env python3
"""Generate a talking-avatar video with WaveSpeed LongCat Avatar.

Inputs must be public URLs. Upload local image/audio files before running.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


MODEL = "wavespeed-ai/longcat-avatar"
BASE_URL = "https://api.wavespeed.ai/api/v3"


def request_json(method: str, url: str, api_key: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = None
    headers = {"Authorization": f"Bearer {api_key}"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {error.code}: {detail}") from error

    try:
        return json.loads(body)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Invalid JSON response: {body[:500]}") from error


def find_prediction_id(response: dict[str, Any]) -> str:
    data = response.get("data") if isinstance(response.get("data"), dict) else response
    for key in ("id", "request_id", "prediction_id"):
        value = data.get(key)
        if isinstance(value, str) and value:
            return value
    raise SystemExit(f"Could not find prediction id in response: {json.dumps(response, ensure_ascii=False)[:1000]}")


def status_value(response: dict[str, Any]) -> str:
    data = response.get("data") if isinstance(response.get("data"), dict) else response
    value = data.get("status") or data.get("state")
    return str(value or "").lower()


def output_urls(response: dict[str, Any]) -> list[str]:
    data = response.get("data") if isinstance(response.get("data"), dict) else response
    candidates: list[Any] = []
    for key in ("outputs", "output", "result", "results", "urls"):
        if key in data:
            candidates.append(data[key])

    urls: list[str] = []

    def collect(value: Any) -> None:
        if isinstance(value, str) and value.startswith(("http://", "https://")):
            urls.append(value)
        elif isinstance(value, list):
            for item in value:
                collect(item)
        elif isinstance(value, dict):
            for item in value.values():
                collect(item)

    for candidate in candidates:
        collect(candidate)
    return urls


def download(url: str, path: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "codex-avatar-skill/1.0"})
    with urllib.request.urlopen(request, timeout=300) as response:
        path.write_bytes(response.read())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image-url", required=True, help="Public portrait image URL")
    parser.add_argument("--audio-url", required=True, help="Public narration audio URL")
    parser.add_argument("--out-dir", required=True, type=Path, help="Directory for metadata and optional video")
    parser.add_argument("--prompt", default="A professional presenter speaking naturally to camera.")
    parser.add_argument("--resolution", default="720p", choices=["480p", "720p"])
    parser.add_argument("--seed", type=int, default=-1)
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--poll-interval", type=int, default=5)
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--download", action="store_true", help="Download the first output URL to avatar.mp4")
    args = parser.parse_args()

    api_key = os.environ.get("WAVESPEED_API_KEY")
    if not api_key:
        raise SystemExit("WAVESPEED_API_KEY is required")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "image": args.image_url,
        "audio": args.audio_url,
        "prompt": args.prompt,
        "resolution": args.resolution,
        "seed": args.seed,
    }

    create_url = f"{BASE_URL}/{args.model}"
    response = request_json("POST", create_url, api_key, payload)
    prediction_id = find_prediction_id(response)
    print(f"Prediction: {prediction_id}")

    deadline = time.time() + args.timeout
    final_response = response
    status = status_value(response)

    while status not in {"completed", "succeeded", "success", "failed", "error", "canceled", "cancelled"}:
        if time.time() > deadline:
            raise SystemExit(f"Timed out waiting for prediction {prediction_id}; last status={status or 'unknown'}")
        time.sleep(args.poll_interval)
        final_response = request_json("GET", f"{BASE_URL}/predictions/{prediction_id}/result", api_key)
        status = status_value(final_response)
        print(f"Status: {status or 'unknown'}")

    metadata_path = args.out_dir / "prediction.json"
    metadata_path.write_text(json.dumps(final_response, ensure_ascii=False, indent=2), encoding="utf-8")

    if status in {"failed", "error", "canceled", "cancelled"}:
        raise SystemExit(f"Prediction ended with status={status}; metadata={metadata_path}")

    urls = output_urls(final_response)
    if not urls:
        raise SystemExit(f"Completed but no output URL found; metadata={metadata_path}")

    result_url = urls[0]
    (args.out_dir / "result-url.txt").write_text(result_url + "\n", encoding="utf-8")
    print(f"Result URL: {result_url}")
    print(f"Metadata: {metadata_path}")

    if args.download:
        video_path = args.out_dir / "avatar.mp4"
        download(result_url, video_path)
        print(f"Downloaded: {video_path}")


if __name__ == "__main__":
    main()
