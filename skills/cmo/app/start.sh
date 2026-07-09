#!/bin/bash
# CMO Console — dev launcher (React frontend via Vite + in-process Hono API).
# Picks the first port in 3000-4000 that is free on BOTH IPv4 and IPv6 so that
# `http://localhost:<port>` (IPv6-first on macOS) resolves to us and not to
# another server squatting on the other stack. If a port is already serving this
# same app (health check), it is reused instead of starting a duplicate.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ROOT_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"

if [ ! -x "$VITE_BIN" ]; then
  echo "Missing Vite dependency. Run pnpm install from $ROOT_DIR, then retry."
  exit 1
fi

# Allow an explicit override, e.g. CMO_UI_PORT=3210 app/start.sh
pick_port() {
  CMO_UI_PORT="${CMO_UI_PORT:-}" python3 - <<'PY'
import os
import socket
import urllib.request

override = os.environ.get("CMO_UI_PORT")
if override:
    print(int(override)); raise SystemExit(0)

def free(port):
    for family, addr in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        s = socket.socket(family, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((addr, port))
        except OSError:
            s.close(); return False
        s.close()
    return True

def is_cmo(port):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=0.5) as r:
            import json
            return json.load(r).get("skill") == "cmo"
    except Exception:
        return False

for port in range(3000, 4001):
    if free(port):
        print(port); raise SystemExit(0)
    if is_cmo(port):
        raise SystemExit(f"REUSE {port}")

raise SystemExit("No free localhost port found in 3000-4000 (both IPv4 and IPv6).")
PY
}

RESULT="$(pick_port)" || { echo "$RESULT"; exit 1; }
case "$RESULT" in
  "REUSE "*)
    PORT="${RESULT#REUSE }"
    echo "CMO Console already running at http://127.0.0.1:$PORT"
    exit 0
    ;;
esac

PORT="$RESULT"
echo "Starting CMO Console at http://127.0.0.1:$PORT"
"$VITE_BIN" --host 127.0.0.1 --port "$PORT" --strictPort
