#!/usr/bin/env node
import http from "node:http";
import {
  authorizationUrl,
  CLIENT_FILE,
  exchangeAuthorizationCode,
  getRedditClientConfig,
  promptForAuthorizationCode,
  TOKEN_FILE,
} from "../lib/reddit-ads-client.mjs";

const codeArgIndex = process.argv.findIndex((arg) => arg === "--code" || arg === "--url");
const scopesArgIndex = process.argv.findIndex((arg) => arg === "--scopes" || arg === "--scope");
const printUrl = process.argv.includes("--print-url");
const listen = process.argv.includes("--listen");

function requestedScopes() {
  if (scopesArgIndex < 0) return undefined;
  return String(process.argv[scopesArgIndex + 1] || "")
    .split(/[\s,]+/)
    .filter(Boolean);
}

function listenForCallback() {
  const config = getRedditClientConfig();
  const redirect = new URL(config.redirectUri);
  const port = Number(redirect.port || (redirect.protocol === "https:" ? 443 : 80));
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || "/", config.redirectUri);
        if (url.pathname !== redirect.pathname) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        const error = url.searchParams.get("error");
        if (error) throw new Error(`Reddit authorization denied: ${error}`);
        const code = url.searchParams.get("code");
        if (!code) throw new Error("Missing code in Reddit callback.");
        const token = await exchangeAuthorizationCode(code);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>Reddit Ads connected</h1><p>You can close this tab and return to Codex.</p>");
        server.close(() => resolve(token));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(error.message);
        server.close(() => reject(error));
      }
    });
    server.once("error", reject);
    server.listen(port, redirect.hostname, () => {
      console.log(`Listening for Reddit OAuth callback on ${config.redirectUri}`);
      console.log("Open this URL:\n");
      console.log(authorizationUrl({ scopes: requestedScopes() }));
      console.log();
    });
  });
}

try {
  if (printUrl) {
    console.log(authorizationUrl({ scopes: requestedScopes() }));
    process.exit(0);
  }
  const token = listen
    ? await listenForCallback()
    : codeArgIndex >= 0
      ? await exchangeAuthorizationCode(process.argv[codeArgIndex + 1] || "")
      : await promptForAuthorizationCode();
  console.log(
    JSON.stringify(
      {
        ok: true,
        token_file: TOKEN_FILE,
        client_file: CLIENT_FILE,
        scope: token.scope || "",
        expires_in: token.expires_in || 0,
        has_refresh_token: Boolean(token.refresh_token),
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
