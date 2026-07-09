#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DISCORD_WEBHOOK_URL_B64, X_OAUTH1_B64 } from "./social-config.mjs";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith("--")) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) {
    args.set(key, "true");
    continue;
  }
  args.set(key, next);
  i += 1;
}

const app = args.get("app");
const version = args.get("version");
const publish = (args.get("publish") ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const sendXReplyLink = args.get("x-reply-link") === "true";
const dryRun = args.get("dry-run") === "true";
const mode = args.get("mode") ?? "generate";
const xPrimaryPostMaxLength = 1000;

if (!app || !version) {
  console.error(
    "Usage: node release-social.mjs --app <app> --version <version> [--mode generate|send] [--publish discord,x] [--x-reply-link true] [--dry-run true]",
  );
  process.exit(1);
}

if (mode !== "generate" && mode !== "send") {
  console.error("Unsupported mode. Use --mode generate or --mode send.");
  process.exit(1);
}

const releaseDir = path.join("apps", app, "content", "release-notes");
const socialCopyPath = path.join(releaseDir, `_v${version}.md`);
const releaseNotePath = path.join(releaseDir, "en", `v${version}.mdx`);
const releaseUrl = `https://buda.im/release-notes/v${version}`;

function getReleaseNoteParts() {
  if (!fs.existsSync(releaseNotePath)) {
    return {
      body: "",
      description: "",
      title: `${app} v${version}`,
    };
  }

  const source = fs.readFileSync(releaseNotePath, "utf8");
  const title = source.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? `${app} v${version}`;
  const description = source.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const body = source
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/^> Released: .+$/m, "")
    .replace(/^> 發佈時間：.+$/m, "")
    .replace(/^> 发布时间：.+$/m, "")
    .replace(/^---$/gm, "")
    .trim();

  return { body, description, title };
}

function extractSection(source, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(?:^|\\n)## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`));
  return match ? match[1].trim() : "";
}

function upsertSection(source, heading, body) {
  const section = `## ${heading}\n\n${body.trim()}\n`;
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|\\n)## ${escaped}\\n\\n[\\s\\S]*?(?=\\n## |$)`);
  const match = source.match(pattern);
  if (match) {
    const prefix = match[1] ?? "";
    return source.replace(pattern, `${prefix}${section.trimEnd()}\n`);
  }
  return `${source.trimEnd()}\n\n${section}`;
}

function createDefaultSocialCopy() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "---",
    `title: ${app} v${version} social copy`,
    `version: "${version}"`,
    `date: "${today}"`,
    "type: release-social-copy",
    "youtubeUrl: null",
    "---",
    "",
    `# ${app} v${version} Social Copy`,
    "",
    "## X Primary Post",
    "",
    "<Write one reviewed X primary post here. Do not include external links in this section.>",
    "",
    "## X Reply",
    "",
    `Full release notes: ${releaseUrl}`,
    "",
    "## Discord Primary Message",
    "",
    "<Write one reviewed Discord primary message here. Optionally include the YouTube URL at the end.>",
    "",
    "## Discord Follow-up",
    "",
    `Release notes: ${releaseUrl}`,
    "",
  ].join("\n");
}

function buildGeneratedXReply() {
  if (!fs.existsSync(releaseNotePath)) {
    return `Full release notes: ${releaseUrl}`;
  }

  const { body, description, title } = getReleaseNoteParts();

  let xContent = `🚀 ${title} is live!\n\n`;

  if (description) {
    xContent += `${description}\n\n`;
  } else {
    const firstParagraph =
      body.split("\n\n").find((p) => !p.startsWith("#") && !p.startsWith("-")) || "";
    xContent += `${firstParagraph.slice(0, 150)}...\n\n`;
  }

  xContent += `📖 Read the full release notes: ${releaseUrl}\n\n#ai #agent`;
  return xContent;
}

function buildGeneratedDiscordFollowUp() {
  if (!fs.existsSync(releaseNotePath)) {
    return `Release notes: ${releaseUrl}`;
  }

  const { body, title } = getReleaseNoteParts();
  const plainBullets = body
    .split("\n")
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.trim().replace(/^-\s*/, "").replace(/\*\*/g, ""))
    .slice(0, 3);

  return [
    `## ${title} is live`,
    "",
    ...plainBullets.map((line) => `- ${line}`),
    "",
    `Release notes: ${releaseUrl}`,
  ]
    .join("\n")
    .trim();
}

// Generate only version-summary follow-ups. Human-written primary copy is preserved.
if (mode === "generate") {
  const source = fs.existsSync(socialCopyPath)
    ? fs.readFileSync(socialCopyPath, "utf8")
    : createDefaultSocialCopy();
  const nextSource = upsertSection(
    upsertSection(source, "X Reply", buildGeneratedXReply()),
    "Discord Follow-up",
    buildGeneratedDiscordFollowUp(),
  );
  fs.writeFileSync(socialCopyPath, `${nextSource.trimEnd()}\n`);
  console.log(`Updated social follow-up copy: ${socialCopyPath}`);

  if (publish.length === 0) {
    process.exit(0);
  }
}

const socialSource = fs.existsSync(socialCopyPath) ? fs.readFileSync(socialCopyPath, "utf8") : "";
const legacyDiscordContentToSend = extractSection(socialSource, "Discord");
const discordPrimaryContentToSend =
  extractSection(socialSource, "Discord Primary Message") || legacyDiscordContentToSend;
const discordFollowUpContentToSend = extractSection(socialSource, "Discord Follow-up");
const xPrimaryContentToSend = extractSection(socialSource, "X Primary Post");
const xReplyContentToSend = extractSection(socialSource, "X Reply");

const decode = (value) => {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8").trim();
};

const postDiscord = async (content, label) => {
  if (!content) {
    console.error(`No Discord message found in ${socialCopyPath}.`);
    return;
  }
  if (dryRun) {
    console.log(`Dry run: Discord ${label} is ready.`);
    return;
  }
  const webhookUrl = decode(DISCORD_WEBHOOK_URL_B64);
  if (!webhookUrl) {
    console.log("Discord is not configured: DISCORD_WEBHOOK_URL_B64 is empty.");
    return;
  }
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error(`Discord publish failed: ${response.status} ${await response.text()}`);
  }
  console.log(`Published Discord ${label}.`);
};

const encodeRFC3986 = (str) =>
  encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const postX = async (text, replyToTweetId) => {
  if (dryRun) {
    console.log(
      replyToTweetId ? "Dry run: X release reply is ready." : "Dry run: X release update is ready.",
    );
    return replyToTweetId ? "" : "dry-run-tweet-id";
  }
  const raw = decode(X_OAUTH1_B64);
  if (!raw) {
    console.log("X is not configured: X_OAUTH1_B64 is empty.");
    return "";
  }
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = JSON.parse(raw);

  const url = "https://api.twitter.com/2/tweets";
  const method = "POST";

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(oauthParams[k])}`)
    .join("&");

  const baseString = `${method}&${encodeRFC3986(url)}&${encodeRFC3986(paramString)}`;
  const signingKey = `${encodeRFC3986(consumerSecret)}&${encodeRFC3986(accessTokenSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  const authHeader =
    "OAuth " +
    Object.entries({ ...oauthParams, oauth_signature: signature })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeRFC3986(k)}="${encodeRFC3986(v)}"`)
      .join(", ");

  const response = await fetch(url, {
    method,
    headers: {
      authorization: authHeader,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      ...(replyToTweetId ? { reply: { in_reply_to_tweet_id: replyToTweetId } } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`X publish failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  const tweetId = body?.data?.id ?? "";
  console.log(replyToTweetId ? "Published X release reply." : "Published X release update.");
  return tweetId;
};

for (const target of publish) {
  if (target === "discord") {
    await postDiscord(discordPrimaryContentToSend, "primary message");
    if (discordFollowUpContentToSend) {
      await postDiscord(discordFollowUpContentToSend, "follow-up");
    }
  } else if (target === "x" || target === "twitter") {
    if (!xPrimaryContentToSend) {
      console.error(`No X primary post found in ${socialCopyPath}.`);
      continue;
    }
    if (/https?:\/\//.test(xPrimaryContentToSend)) {
      throw new Error("X primary post must not include external links. Put links in X Reply.");
    }
    if (xPrimaryContentToSend.length > xPrimaryPostMaxLength) {
      throw new Error(
        `X primary post is ${xPrimaryContentToSend.length} characters; keep it <= ${xPrimaryPostMaxLength}.`,
      );
    }
    const tweetId = await postX(xPrimaryContentToSend);
    if (sendXReplyLink) {
      if (!xReplyContentToSend) {
        console.error(`No X reply found in ${socialCopyPath}.`);
      } else if (tweetId) {
        await postX(xReplyContentToSend, tweetId);
      }
    }
  } else console.log(`Unknown publish target skipped: ${target}`);
}
