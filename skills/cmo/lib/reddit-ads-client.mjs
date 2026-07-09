import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

export const CONFIG_DIR = path.join(os.homedir(), ".config", "reddit-ads");
export const CLIENT_FILE = path.join(CONFIG_DIR, "client.json");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");
export const ENV_FILE = path.join(CONFIG_DIR, "env.json");

const DEFAULT_REDIRECT_URI = "http://localhost:8080/callback";
const DEFAULT_SCOPES = ["adsread", "identity", "history"];

export function readRedditLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ENV_FILE, "utf8"));
  } catch {
    return {};
  }
}

function readJson(pathname, fallback = {}) {
  if (!fs.existsSync(pathname)) return fallback;
  return JSON.parse(fs.readFileSync(pathname, "utf8"));
}

function writePrivateJson(pathname, value) {
  fs.mkdirSync(path.dirname(pathname), { recursive: true, mode: 0o700 });
  fs.writeFileSync(pathname, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(pathname, 0o600);
}

export function getRedditClientConfig() {
  const file = readJson(CLIENT_FILE, {});
  const clientId = process.env.REDDIT_ADS_CLIENT_ID || file.client_id;
  const clientSecret = process.env.REDDIT_ADS_CLIENT_SECRET || file.client_secret;
  const redirectUri =
    process.env.REDDIT_ADS_REDIRECT_URI || file.redirect_uri || DEFAULT_REDIRECT_URI;
  const scopes = String(
    process.env.REDDIT_ADS_SCOPES || file.scopes?.join(" ") || DEFAULT_SCOPES.join(" "),
  )
    .split(/[\s,]+/)
    .filter(Boolean);
  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing Reddit Ads client config. Create ${CLIENT_FILE} with client_id and client_secret.`,
    );
  }
  return { clientId, clientSecret, redirectUri, scopes };
}

export function normalizeAuthorizationCode(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.searchParams.get("code") || "";
  } catch {
    return value;
  }
}

export function authorizationUrl({ state = "ads-reddit", scopes } = {}) {
  const config = getRedditClientConfig();
  const url = new URL("https://www.reddit.com/api/v1/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("duration", "permanent");
  url.searchParams.set("scope", (scopes || config.scopes).join(" "));
  return url.toString();
}

async function tokenRequest(body) {
  const config = getRedditClientConfig();
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "ads-skill/0.1 by BudaAI",
    },
    body,
  });
  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text };
  }
  if (!response.ok || json.error) {
    const detail = json.error_description || json.error || text || "empty response body";
    throw new Error(
      `Reddit OAuth failed: ${response.status} ${response.statusText || ""}: ${detail}`,
    );
  }
  return json;
}

export async function exchangeAuthorizationCode(codeInput) {
  const config = getRedditClientConfig();
  const code = normalizeAuthorizationCode(codeInput);
  if (!code) throw new Error("No OAuth authorization code found in input.");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });
  const token = await tokenRequest(body);
  const payload = {
    ...token,
    saved_at: new Date().toISOString(),
    expires_at: token.expires_in ? Date.now() + Number(token.expires_in) * 1000 : 0,
  };
  writePrivateJson(TOKEN_FILE, payload);
  return payload;
}

export async function refreshRedditAccessToken() {
  const token = readJson(TOKEN_FILE, {});
  if (!token.refresh_token)
    throw new Error("Missing Reddit refresh_token. Run authorize-reddit-ads.mjs first.");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
  });
  const refreshed = await tokenRequest(body);
  const payload = {
    ...token,
    ...refreshed,
    refresh_token: refreshed.refresh_token || token.refresh_token,
    saved_at: new Date().toISOString(),
    expires_at: refreshed.expires_in ? Date.now() + Number(refreshed.expires_in) * 1000 : 0,
  };
  writePrivateJson(TOKEN_FILE, payload);
  return payload.access_token;
}

export async function getRedditAccessToken() {
  if (process.env.REDDIT_ADS_ACCESS_TOKEN) return process.env.REDDIT_ADS_ACCESS_TOKEN;
  const token = readJson(TOKEN_FILE, {});
  if (token.access_token && Number(token.expires_at || 0) > Date.now() + 60_000)
    return token.access_token;
  return refreshRedditAccessToken();
}

export async function promptForAuthorizationCode() {
  console.log("\nReddit Ads authorization required.");
  console.log("Open this URL with the Reddit user that can access the Ads account:\n");
  console.log(authorizationUrl());
  console.log();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) =>
    rl.question("Paste the final redirect URL or code: ", resolve),
  );
  rl.close();
  return exchangeAuthorizationCode(code);
}
