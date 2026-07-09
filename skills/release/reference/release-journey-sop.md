# Release Journey SOP — CRM Email Authoring

This SOP is loaded by `/release` only at **Step 5.6** (Buda only). It defines how to
write the bulk release-note email that goes out to existing registered users via the
CRM journey scheduler. Out-of-scope: release-notes MDX, social copy, version bump —
those steps live in the parent SKILL.md.

---

## 1. Inputs you must read before writing

Read these files first; do not write copy from memory:

- `apps/buda/content/release-notes/en/v<version>.mdx` — canonical user-facing changes. Use this as the source for the `intro` summary and the candidate hero features.
- The latest 3 visible blog posts in `apps/buda/content/blog/<locale>/` (sort by frontmatter `date` desc; exclude slugs starting with `_`)
- The previous release journey (`apps/buda/src/domains/crm/automations/journeys/release-v<prev-version>.ts`) — copy its locale set, exit-rule strings, and structure

Do **not** read `apps/buda/content/release-notes/_v<version>.md` for hero selection. In the release workflow, social copy is written after the CRM journey, so this file may not exist yet and must not be a dependency.

If `youtubeVideoId` was passed as a `/release` argument, capture it. It is **optional** — if no companion video shipped, leave it `undefined`.

---

## 2. Human-in-the-loop hero selection

Before writing `releaseCurrentContent`, pause and ask the user to choose the hero feature for the email.

Workflow:

1. Read `apps/buda/content/release-notes/en/v<version>.mdx`.
2. Extract 2-4 user-facing candidate hero features from the release notes.
3. Present those candidates to the user in plain language, with one short reason each.
4. Stop and wait for the user's choice.
5. Use the chosen feature as `hero.title` and make the first highlight reinforce that choice.

Rules:

- The agent may recommend a candidate, but the user makes the final decision.
- Do not invent a hero feature that is not in the release notes.
- Match the exact product label when the chosen feature has one, such as a sidebar entry, settings tab, or menu item.
- If the user has already explicitly chosen a hero feature in the `/release` prompt, treat that as the human decision and continue without asking again.

---

## 3. Files to create / change

| File | Action |
| --- | --- |
| `apps/buda/src/domains/crm/automations/journeys/release-current.ts` | Update in place — overwrite the previous release content, id, dates, preview URL, and metadata |
| `apps/buda/src/domains/crm/automations/journeys/index.ts` | Ensure it imports and registers `releaseCurrentJourney` |

**One release journey at a time.** Use `release-current.ts` as the only current release-note journey file. Do not create a new `release-v<version>.ts` file for every release, and delete old unregistered `release-v*.ts` files if they exist. Git history is the archive for past release email content. Keep all non-release journeys (lifecycle, newsletter, announcement, examples) untouched.

---

## 4. Journey object shape

```ts
export const releaseCurrentJourney: AutomationJourneyDefinition = {
  id: "release-v<version>-email",
  category: "release-note",
  channel: "email",
  tags: ["broadcast", "release-note", "announcement", "product-update"],
  name: "Release notes v<version>",
  description: "Send the Buda v<version> release notes to users registered before the release date.",
  trigger: "Once on <YYYY-MM-DD>",
  copy: releaseJourneyCopy("<version>", "<YYYY-MM-DD>"),
  providerId: "email-buda-notify",
  kind: "production",
  audience: { kind: "registered_before", cutoffDate: "<YYYY-MM-DD>" },
  schedule: { kind: "once", sendAt: "<YYYY-MM-DD>" },
  nodes: releaseJourneyNodes(
    "<YYYY-MM-DD>",
    releaseCurrentContent,
    "/api/kit/email-preview?sequence=release-v<version>-email&step=release-v<version>-email-step-1",
  ),
  edges: [
    { from: "scheduled-release-trigger", to: "select-registered-before" },
    { from: "select-registered-before", to: "send-release-email", label: "eligible" },
    { from: "send-release-email", to: "complete", label: "sent/failed" },
  ],
  exitRules: ["Paused automation", "Not due yet", "User already received this journey"],
  metadata: { releaseVersion: "<version>", releaseDate: "<YYYY-MM-DD>" },
};
```

Runtime invariants:

- `templateId` for the send node must be `"release-newsletter"` (not `"notification"`).
- The preview URL shape must stay exactly: `/api/kit/email-preview?sequence=release-v<version>-email&step=release-v<version>-email-step-1`.
- Default behavior is **off** — admins enable in `/systemadmin/crm/automations`.
- Send dedup: `outreach_logs.automation_id = release-v<version>-email` with `status = sent`.
- The release skill never sends email. The CRM scheduler does after enable.

---

## 5. Content schema (`releaseCurrentContent`)

Hero (with optional YouTube thumbnail) + intro + 3 numbered highlights + single primary CTA + 3 blog posts.

```ts
const releaseCurrentContent = {
  releaseVersion: "<version>",
  releaseDate: "<YYYY-MM-DD>",

  // Inbox
  subject:    { en, "zh-CN", "zh-TW", ja, pt },   // benefit-first, ≤ 60 chars en
  preheader:  { en, "zh-CN", "zh-TW", ja, pt },   // extends subject, never repeats it

  // Hero block at the top of the email — the place where the headline feature lives
  hero: {
    title:    { en, "zh-CN", "zh-TW", ja, pt },   // single user-benefit headline. Match the **exact** product label (sidebar entry / settings tab) so users do not get a mismatch when they click in.
    subtitle: { en, "zh-CN", "zh-TW", ja, pt },   // 1 short line that explains the headline's user value
    youtubeVideoId: "<id-or-undefined>",          // optional; thumbnail auto-resolves to https://i.ytimg.com/vi/<id>/maxresdefault.jpg
  },

  // Body intro summary (3–5 short sentences, generated only from release notes)
  intro: { en, "zh-CN", "zh-TW", ja, pt },

  // 3 numbered highlights — feature + user value, one sentence each
  highlights: [
    { en, "zh-CN", "zh-TW", ja, pt },
    { en, "zh-CN", "zh-TW", ja, pt },
    { en, "zh-CN", "zh-TW", ja, pt },
  ],

  // Single primary action — the only Button in the email
  primaryCta: {
    text: { en, "zh-CN", "zh-TW", ja, pt },   // e.g. "Open Buda"
    url: "https://buda.im",                    // default destination; overrideable
  },

  // Soft link below the primary button
  releaseNotesUrl: "/release-notes/v<version>",

  // 3 blog posts under "Latest from the blog"
  blogPosts: [
    { title: { en, ... }, description: { en, ... }, href: "/blog/<slug>" },
    { title: { en, ... }, description: { en, ... }, href: "/blog/<slug>" },
    { title: { en, ... }, description: { en, ... }, href: "/blog/<slug>" },
  ],
} satisfies JourneyNode["content"];
```

Locale set: `en`, `zh-CN`, `zh-TW`, `ja`, `pt`. Match the previous release exactly. Do not invent new locale keys. If a locale string is missing, fall back to `en` content for that key.

---

## 6. Copy rules

### Subject

- Benefit-first. Concrete user value, not version announcement.
- Avoid: `"Buda v<version> is live"`, `"Buda v<version> released"`, translated equivalents.
- Prefer: `"Apps & Skills — open every app, skill, and site fast"`, `"Cleaner files, clearer Agent work"`, `"Less digging through Agent changes"`.
- Keep ≤ 60 characters in English when possible. Localizations stay short and benefit-led.
- The version may appear in the preheader, not the subject.

### Preheader

- Extends the subject; second dimension of value (e.g. supporting features that did not make the headline).
- Example: `"Plus Commander beta for cross-space sessions, in-chat search, and Buda Desktop public Beta."`

### Hero `title`

- Single-benefit headline. Usually the **exact name of the headline feature as it appears in the product** (sidebar entry, settings tab, menu item). If users see "Apps & Skills" in the sidebar, the email hero must say "Apps & Skills" — not a marketing rephrasing — or they will not believe it is the same thing.
- Brand-light: header already shows the Buda logo; hero already shows "Buda AI Product Update". Avoid repeating those.
- Good: `"Apps & Skills"`, `"Commander"`, `"More control, less friction"`.
- Avoid: `"Buda v<version> is live"`, `"What's new in v<version>"`, marketing rephrasings that diverge from the product label (e.g. emailing about `"Apps & Sites"` when the sidebar says `"Apps & Skills"`).

### Hero `subtitle`

- One short line. Explains what the headline feature does for the user, in plain language.
- Example: `"Every app and published site in your space, all in one place."`

### Hero `youtubeVideoId`

- Optional. If `/release youtubeVideoId=<id>` was provided, fill it. Otherwise omit.
- The template renders `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` as a clickable thumbnail linking to `https://youtu.be/<id>`. **Do not upload anything** — YouTube serves the static thumbnail at a stable URL.
- If absent, the hero falls back to text-only.

### `intro`

- 3-5 short sentences. Talks to a registered user, not a marketing audience.
- Generate it as an AI summary from `apps/buda/content/release-notes/en/v<version>.mdx` only. Do not summarize or borrow from `_v<version>.md`; social copy is written later in the workflow and is not an input here.
- Write a release thesis, not mini release notes. Explain the user problem or workflow friction this release improves, then the overall benefit.
- Avoid naming every highlighted feature in the intro. Let `highlights` carry the concrete feature list and feature-by-feature value.
- The content split should be: `hero` = one chosen headline feature, `intro` = the broader problem/value theme, `highlights` = 3 concrete feature details, `primaryCta` = open the product.
- Keep it simple and easy to understand.
- Avoid technical terms, internal implementation words, and feature-name lists with no explanation. Use product labels only when they help users find the feature.
- Set up *why this release exists* in one breath. Do not just paraphrase the hero subtitle.

### `highlights`

- Exactly 3 bullets. The first highlight should reinforce the headline feature; the other two cover supporting work.
- Each bullet is one sentence connecting feature → user value.
- Avoid: `"smoother automations, steadier panels, faster long chats"` (keyword list with no value).
- Prefer: `"Agent sessions and Projects now support Archive, so cleanup no longer has to be destructive."`

### `primaryCta`

- Text: `"Open Buda"` (en), localized.
- URL: default `https://buda.im`. Use a different URL only when the release directly justifies it.
- This is the **only** Button in the email. Treat it as scarce.

### `releaseNotesUrl`

- Always `/release-notes/v<version>`. Renders as a soft link below the primary button.

### `blogPosts` (3 cards)

- The latest 3 visible blog posts from `apps/buda/content/blog/<locale>/`, sorted by frontmatter `date` desc, excluding slugs starting with `_`.
- Use the English blog list as the canonical slug order; fill localized `title` and `description` from matching locale files when they exist. Fall back to English when a locale file does not exist.
- `href` is the canonical unlocalized path like `/blog/<slug>`. The journey executor localizes the base URL for actual sends.
- Use exactly 3 posts unless fewer visible posts exist.
- Do not include WordPress posts; release journey content must be reviewable in code.

---

## 7. YouTube thumbnail mechanics

- Stable URL pattern: `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` (1280×720). Falls back to `hqdefault.jpg` (480×360) if `maxresdefault` is missing for very new uploads.
- The `release-newsletter` template renders the thumbnail wrapped in `<a href="https://youtu.be/<id>">`. Email clients that block remote images will hide the thumbnail but keep the underlying link intact.
- Do not commit the thumbnail to git. Do not re-upload to R2. Just pass `youtubeVideoId`.

---

## 8. Anti-patterns

- ❌ Hero headline repeats the version (`"Buda v<version> is live"`).
- ❌ Subject crams 2-3 features into one line.
- ❌ `intro` paraphrases the hero subtitle.
- ❌ More than 3 highlights, or fewer than 3.
- ❌ Multiple Buttons (one for each highlight, plus `Open Buda`, plus release notes). The email must have exactly one Button.
- ❌ `templateId: "notification"` on the send node. Always use `release-newsletter`.
- ❌ Fetching blog posts at runtime. Always inline 3 reviewed `blogPosts` in the journey file.
- ❌ Choosing the hero feature from `_v<version>.md` or waiting for social copy to exist. Ask the user at Step 5.6 instead.

---

## 9. Reference example

Use `apps/buda/src/domains/crm/automations/journeys/release-current.ts` as the reference and the file to update. Keep the helper layout, replace the current release content, and preserve the `releaseCurrentJourney` export.
