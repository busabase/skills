#!/bin/bash
# GTM War Room — standalone skill app
# Reuses an existing GTM War Room Vite dev server when one is already running,
# otherwise starts one on the first port in 3000-4000 that is free on both IPv4
# and IPv6. Override with GTM_UI_PORT=3210.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ROOT_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"

if [ ! -x "$VITE_BIN" ]; then
  echo "Missing Vite dependency. Run pnpm install from $ROOT_DIR, then retry."
  exit 1
fi

pick_port() {
  GTM_UI_PORT="${GTM_UI_PORT:-}" python3 - <<'PY'
import os
import socket
import urllib.request

override = os.environ.get("GTM_UI_PORT")

def free(port):
    for family, addr in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        sock = socket.socket(family, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((addr, port))
        except OSError:
            sock.close()
            return False
        sock.close()
    return True

def is_gtm(port):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=0.5) as response:
            html = response.read(4096).decode("utf-8", errors="ignore")
            return "<title>GTM War Room</title>" in html
    except Exception:
        return False

if override:
    port = int(override)
    if is_gtm(port):
        print(f"REUSE {port}")
        raise SystemExit(0)
    if free(port):
        print(port)
        raise SystemExit(0)
    raise SystemExit(f"GTM_UI_PORT={port} is occupied by another service.")

for port in range(3000, 4001):
    if is_gtm(port):
        print(f"REUSE {port}")
        raise SystemExit(0)
    if free(port):
        print(port)
        raise SystemExit(0)

raise SystemExit("No free localhost port found in 3000-4000 (both IPv4 and IPv6).")
PY
}

RESULT="$(pick_port)" || { echo "$RESULT"; exit 1; }
case "$RESULT" in
  "REUSE "*)
    PORT="${RESULT#REUSE }"
    echo "GTM War Room already running at http://127.0.0.1:$PORT"
    exit 0
    ;;
esac

PORT="$RESULT"
echo "Starting GTM War Room at http://127.0.0.1:$PORT"
"$VITE_BIN" --host 127.0.0.1 --port "$PORT" --strictPort
