"""
Python host for an AirApp — the Python counterpart of `server.js`.

Everything in `app/` is unchanged: the browser half of an AirApp is plain HTML,
CSS and JavaScript, so it does not care what serves it. Only the process behind
it differs, and that is the whole difference between a Node AirApp and a Python
one.

**Standard library only, on purpose.** A host whose job is to serve static files
and answer one JSON endpoint has no reason to pull in a framework, and a
dependency-free app installs instantly and offline — which matters because
`pip install` is *refused outright* on any PEP 668 host (Debian, Ubuntu, Fedora,
Homebrew Python) outside a virtualenv. Busabase builds a per-run virtualenv for
apps that do have dependencies; this one needs none.

**What this host deliberately does NOT do: the OAuth gateway.** `server.js` uses
`busabase-sdk/airapp-node`'s `createBusabaseAirAppLocalGateway` for `/auth/*`
and to proxy `/api/v1` with credentials attached server-side. That exists for
the *standalone* case — an app running outside Busabase, which has to obtain a
credential of its own. It is not reimplemented here: porting an OAuth flow into
a second language is how two implementations drift apart, and the one that
drifts is a security boundary.

The consequence, stated plainly rather than discovered: **a Python AirApp is
hosted-only.** Inside Busabase the browser's `/api/v1` calls are same-origin and
carry the viewer's session, so no gateway is involved and everything works. Run
standalone, this host says so at `/auth/start` instead of 404ing at it.
"""

from __future__ import annotations

import http.server
import json
import os
import posixpath
import socketserver
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent / "app"
APP_SLUG = "__APP_SLUG__"

# Set by Busabase in every hosted row, and by nobody else — so its ABSENCE is the
# positive fact "standalone". Never classify this by hostname, iframe nesting or
# path: a hosted AirApp is served from localhost on Desktop/OSS, and a standalone
# run is routinely reached over a LAN IP or a signed dev tunnel, so both
# directions of that guess are wrong.
AIRAPP_RUNTIME = (os.environ.get("BUSABASE_AIRAPP_RUNTIME") or "").strip()

STANDALONE_NOTICE = {
    "error": "standalone_unsupported",
    "message": (
        "This is a Python AirApp, which runs inside Busabase only. The OAuth "
        "gateway that lets an app authenticate itself when run standalone is "
        "provided by busabase-sdk for Node hosts and is not reimplemented here. "
        "Open this app from its Busabase node instead."
    ),
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def _json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _route(self) -> str:
        return posixpath.normpath(self.path.split("?", 1)[0])

    def do_GET(self) -> None:  # noqa: N802 - stdlib-mandated name
        route = self._route()
        if route == "/health":
            self._json({"ok": True, "app": APP_SLUG})
            return
        # The browser cannot read environment variables, so the host hands the
        # answer over. `hosted` is "any non-empty value", never a check against a
        # list of known engine names: Busabase adds and renames engines, and an
        # app pinned to yesterday's list would answer "standalone" inside a
        # hosted preview and show its own connection gate there.
        if route == "/__airapp/runtime":
            self._json(
                {
                    "runtime": AIRAPP_RUNTIME or "standalone",
                    "hosted": AIRAPP_RUNTIME != "",
                    "devProxy": False,
                }
            )
            return
        if route.startswith("/auth/"):
            self._json(STANDALONE_NOTICE, status=501)
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - stdlib-mandated name
        if self._route().startswith("/auth/"):
            self._json(STANDALONE_NOTICE, status=501)
            return
        self.send_error(405)

    def log_message(self, *_args: object) -> None:
        # The Logs tab shows this app's own output; one line per asset request
        # would bury the messages that matter.
        return


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    port = int(os.environ.get("PORT", "3000"))
    server = Server(("0.0.0.0", port), Handler)
    # Bind BEFORE announcing: Busabase watches this line to learn the port, and
    # printing first would tell it the server is up while the socket is still
    # unbound.
    print(f"AirApp runtime: {AIRAPP_RUNTIME or 'standalone'}", flush=True)
    print(f"listening on port {port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
        sys.exit(0)


if __name__ == "__main__":
    main()
