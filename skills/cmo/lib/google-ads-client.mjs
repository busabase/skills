/**
 * google-ads-client.mjs
 * Shared Google Ads API helpers: OAuth token, Customer init, geo/language constants.
 *
 * Used by:
 *   - create-sem-campaign.mjs / pause-sem-campaign.mjs
 *   - create-video-campaign.mjs / pause-video-campaign.mjs
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_NODE_MODULES = path.join(SKILL_DIR, ".cache", "node", "node_modules");

async function importDependency(name) {
  try {
    return await import(name);
  } catch (error) {
    try {
      return await import(
        pathToFileURL(require.resolve(name, { paths: [LOCAL_NODE_MODULES] })).href
      );
    } catch {
      throw error;
    }
  }
}

export const CONFIG_DIR = path.join(os.homedir(), ".config", "google-ads");
export const SECRET_FILE = path.join(CONFIG_DIR, "client_secret.json");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");
export const ENV_FILE = path.join(CONFIG_DIR, "env.json");

function readLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ENV_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Language code → Google Ads criterion ID
// https://developers.google.com/google-ads/api/data/codes-formats#languages
export const LANGUAGE_CRITERION_IDS = {
  "zh-CN": "1017", // Chinese (Simplified)
  "zh-TW": "1018", // Chinese (Traditional)
  en: "1000",
  ja: "1005",
  pt: "1014",
  es: "1003",
  fr: "1002",
  de: "1001",
  ko: "1012",
};

// Country code → Google Ads geo target constant
// https://developers.google.com/google-ads/api/data/geotargets
export const GEO_TARGET_IDS = {
  TW: "2158", // Taiwan
  HK: "2344", // Hong Kong
  SG: "2702", // Singapore
  US: "2840", // United States
  CN: "2156", // China
  JP: "2392", // Japan
  KR: "2410", // South Korea
  AU: "2036", // Australia
  GB: "2826", // United Kingdom
  CA: "2124", // Canada
  DE: "2276", // Germany
  FR: "2250", // France
  IN: "2356", // India
  BR: "2076", // Brazil
  MY: "2458", // Malaysia
  ID: "2360", // Indonesia
  TH: "2764", // Thailand
  PH: "2608", // Philippines
  VN: "2704", // Vietnam
};

export function getCustomerId() {
  const raw = process.env.GOOGLE_ADS_CUSTOMER_ID || readLocalEnv().GOOGLE_ADS_CUSTOMER_ID;
  if (!raw) {
    console.error("Missing env var: GOOGLE_ADS_CUSTOMER_ID (format: xxx-xxx-xxxx)");
    process.exit(1);
  }
  return raw.replace(/-/g, "");
}

export function getDeveloperToken() {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || readLocalEnv().GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) {
    console.error("Missing env var: GOOGLE_ADS_DEVELOPER_TOKEN");
    process.exit(1);
  }
  return token;
}

function normalizeAuthorizationCode(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.searchParams.get("code") || "";
  } catch {
    return value;
  }
}

function looksLikeIntermediateGoogleUrl(input) {
  try {
    const url = new URL(String(input || "").trim());
    return /(^|\.)accounts\.google\.com$/.test(url.hostname) && !url.searchParams.get("code");
  } catch {
    return false;
  }
}

/**
 * Load or perform OAuth flow, returning an OAuth2Client with credentials set.
 */
export async function getOAuthClient() {
  if (!fs.existsSync(SECRET_FILE)) {
    console.error(`\nMissing OAuth credentials: ${SECRET_FILE}`);
    console.error("Ask your team for the company Google Cloud client_secret.json");
    console.error("and place it at the path above.\n");
    process.exit(1);
  }

  let google;
  try {
    ({ google } = await importDependency("googleapis"));
  } catch {
    console.error("Missing dependency: pnpm add -w googleapis");
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(SECRET_FILE, "utf8"));
  const { client_id, client_secret, redirect_uris } = secret.installed ?? secret.web ?? {};

  const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_FILE)) {
    oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")));
    return oauth2;
  }

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/adwords"],
  });

  console.log("\nGoogle Ads — first-time authorization required.");
  console.log("Open this URL in your browser (use the COMPANY Google account):\n");
  console.log(authUrl);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) =>
    rl.question("Paste the authorization code: ", resolve),
  );
  rl.close();

  const normalizedCode = normalizeAuthorizationCode(code);
  if (!normalizedCode) {
    console.error("\nNo OAuth authorization code found.");
    if (looksLikeIntermediateGoogleUrl(code)) {
      console.error(
        "That looks like a Google sign-in/challenge page, not the final OAuth redirect.",
      );
    }
    console.error(
      "Finish the Google consent flow, then paste either the code value or the final localhost URL containing ?code=...\n",
    );
    process.exit(1);
  }

  const { tokens } = await oauth2.getToken(normalizedCode);
  oauth2.setCredentials(tokens);
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log(`Token saved to ${TOKEN_FILE}\n`);

  return oauth2;
}

/**
 * Initialise a google-ads-api Customer using the OAuth refresh token.
 */
export async function getCustomer({ oauth2, customerId, developerToken, loginCustomerId = "" }) {
  let GoogleAdsApi;
  try {
    ({ GoogleAdsApi } = await importDependency("google-ads-api"));
  } catch {
    console.error("\nMissing dependency: pnpm add -w google-ads-api");
    process.exit(1);
  }

  const secret = JSON.parse(fs.readFileSync(SECRET_FILE, "utf8"));
  const oauthConfig = secret.installed ?? secret.web;

  const client = new GoogleAdsApi({
    client_id: oauthConfig?.client_id,
    client_secret: oauthConfig?.client_secret,
    developer_token: developerToken,
  });

  const customerConfig = {
    customer_id: customerId,
    refresh_token: oauth2.credentials.refresh_token,
  };
  if (loginCustomerId) customerConfig.login_customer_id = String(loginCustomerId).replace(/-/g, "");
  return client.Customer(customerConfig);
}

export const toMicros = (usd) => Math.round(Number(usd) * 1_000_000);
