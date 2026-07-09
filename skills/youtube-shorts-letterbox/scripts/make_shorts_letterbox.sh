#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  make_shorts_letterbox.sh <input-video> [--output <output-video>] [--size <WIDTHxHEIGHT>] [--cover <image-path>] [--cover-duration <seconds>] [--transition-duration <seconds>] [--crf <CRF>] [--preset <PRESET>]

Examples:
  make_shorts_letterbox.sh "./clip.mov"
  make_shorts_letterbox.sh "./clip.mov" --output "./clip-shorts.mp4"
  make_shorts_letterbox.sh "./clip.mov" --size 720x1280
  make_shorts_letterbox.sh "./clip.mov" --cover "./cover.png"
  make_shorts_letterbox.sh "./clip.mov" --cover "./cover.png" --cover-duration 2
  make_shorts_letterbox.sh "./clip.mov" --cover "./cover.png" --transition-duration 0.35
USAGE
}

if [[ $# -eq 1 && ( "$1" == "--help" || "$1" == "-h" ) ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

input=""
output=""
size="1080x1920"
crf="18"
preset="medium"
cover=""
cover_duration="1.5"
transition_duration="0.35"

input="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output|-o)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --output" >&2
        exit 2
      fi
      output="$2"
      shift 2
      ;;
    --size)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --size" >&2
        exit 2
      fi
      size="$2"
      shift 2
      ;;
    --cover)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --cover" >&2
        exit 2
      fi
      cover="$2"
      shift 2
      ;;
    --cover-duration)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --cover-duration" >&2
        exit 2
      fi
      cover_duration="$2"
      shift 2
      ;;
    --transition-duration)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --transition-duration" >&2
        exit 2
      fi
      transition_duration="$2"
      shift 2
      ;;
    --crf)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --crf" >&2
        exit 2
      fi
      crf="$2"
      shift 2
      ;;
    --preset)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --preset" >&2
        exit 2
      fi
      preset="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required. Install with: brew install ffmpeg" >&2
  exit 127
fi

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe is required. Install with: brew install ffmpeg" >&2
  exit 127
fi

if [[ ! -f "$input" ]]; then
  echo "Input file not found: $input" >&2
  exit 1
fi

if [[ ! "$size" =~ ^[0-9]+x[0-9]+$ ]]; then
  echo "--size must look like WIDTHxHEIGHT, for example 1080x1920" >&2
  exit 2
fi

if [[ -n "$cover" && ! -f "$cover" ]]; then
  echo "Cover file not found: $cover" >&2
  exit 1
fi

if [[ ! "$cover_duration" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "--cover-duration must be a positive number of seconds, for example 1.5" >&2
  exit 2
fi

if [[ ! "$transition_duration" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "--transition-duration must be a non-negative number of seconds, for example 0.35" >&2
  exit 2
fi

if ! awk "BEGIN { exit !($cover_duration > 0) }"; then
  echo "--cover-duration must be greater than 0" >&2
  exit 2
fi

if ! awk "BEGIN { exit !($transition_duration >= 0) }"; then
  echo "--transition-duration must be greater than or equal to 0" >&2
  exit 2
fi

if [[ -n "$cover" ]] && ! awk "BEGIN { exit !($transition_duration < $cover_duration) }"; then
  echo "--transition-duration must be shorter than --cover-duration" >&2
  exit 2
fi

target_width="${size%x*}"
target_height="${size#*x}"

if [[ -z "$output" ]]; then
  input_dir="$(dirname "$input")"
  input_base="$(basename "$input")"
  input_name="${input_base%.*}"
  output="${input_dir}/${input_name}-shorts.mp4"
fi

mkdir -p "$(dirname "$output")"

audio_args=(-an)
has_audio="no"
if ffprobe -v error -select_streams a:0 -show_entries stream=index -of csv=p=0 "$input" | grep -q .; then
  audio_args=(-c:a aac -b:a 192k)
  has_audio="yes"
fi

vf="scale=${target_width}:${target_height}:force_original_aspect_ratio=decrease,pad=${target_width}:${target_height}:(ow-iw)/2:(oh-ih)/2:black,setsar=1"
concat_vf="${vf},fps=30"

if [[ -z "$cover" ]]; then
  ffmpeg -hide_banner -y -i "$input" \
    -vf "$vf" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
    "${audio_args[@]}" \
    -movflags +faststart \
    "$output"
else
  tmp_dir="$(mktemp -d)"
  cleanup() {
    rm -rf "$tmp_dir"
  }
  trap cleanup EXIT

  cover_segment="${tmp_dir}/cover.mp4"
  content_segment="${tmp_dir}/content.mp4"
  fade_offset="$(awk -v cover="$cover_duration" -v transition="$transition_duration" 'BEGIN { printf "%.6f", cover - transition }')"

  if [[ "$has_audio" == "yes" ]]; then
    ffmpeg -hide_banner -y \
      -loop 1 -t "$cover_duration" -i "$cover" \
      -f lavfi -t "$cover_duration" -i "anullsrc=channel_layout=stereo:sample_rate=48000" \
      -vf "$concat_vf" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
      -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest \
      "$cover_segment"

    ffmpeg -hide_banner -y -i "$input" \
      -vf "$concat_vf" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
      -c:a aac -b:a 192k -ar 48000 -ac 2 \
      "$content_segment"

    if awk "BEGIN { exit !($transition_duration > 0) }"; then
      ffmpeg -hide_banner -y \
        -i "$cover_segment" -i "$content_segment" \
        -filter_complex "[0:v:0][1:v:0]xfade=transition=fade:duration=${transition_duration}:offset=${fade_offset},format=yuv420p[v];[0:a:0][1:a:0]acrossfade=d=${transition_duration}:c1=tri:c2=tri[a]" \
        -map "[v]" -map "[a]" \
        -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
        -c:a aac -b:a 192k \
        -movflags +faststart \
        "$output"
    else
      ffmpeg -hide_banner -y \
        -i "$cover_segment" -i "$content_segment" \
        -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[v][a]" \
        -map "[v]" -map "[a]" \
        -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
        -c:a aac -b:a 192k \
        -movflags +faststart \
        "$output"
    fi
  else
    ffmpeg -hide_banner -y \
      -loop 1 -t "$cover_duration" -i "$cover" \
      -vf "$concat_vf" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
      -an \
      "$cover_segment"

    ffmpeg -hide_banner -y -i "$input" \
      -vf "$concat_vf" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
      -an \
      "$content_segment"

    if awk "BEGIN { exit !($transition_duration > 0) }"; then
      ffmpeg -hide_banner -y \
        -i "$cover_segment" -i "$content_segment" \
        -filter_complex "[0:v:0][1:v:0]xfade=transition=fade:duration=${transition_duration}:offset=${fade_offset},format=yuv420p[v]" \
        -map "[v]" \
        -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
        -an \
        -movflags +faststart \
        "$output"
    else
      ffmpeg -hide_banner -y \
        -i "$cover_segment" -i "$content_segment" \
        -filter_complex "[0:v:0][1:v:0]concat=n=2:v=1:a=0[v]" \
        -map "[v]" \
        -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" -preset "$preset" \
        -an \
        -movflags +faststart \
        "$output"
    fi
  fi
fi

actual_size="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$output")"
duration="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$output" | awk '{printf "%.2f", $1}')"

if [[ "$actual_size" != "$size" ]]; then
  echo "Output dimension check failed: expected ${size}, got ${actual_size}" >&2
  exit 1
fi

echo "output=$output"
echo "size=$actual_size"
echo "duration_seconds=$duration"
echo "audio=$has_audio"
if [[ -n "$cover" ]]; then
  echo "cover=$cover"
  echo "cover_duration_seconds=$cover_duration"
  echo "transition_duration_seconds=$transition_duration"
fi
