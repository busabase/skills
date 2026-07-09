import {
  Check,
  ChevronRight,
  Copy,
  Grid2x2,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Square,
  Star,
  Tag,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import Link from "../../next-link-shim";
import "./inpomo-kit.css";

// Locales mirror busabase-cloud's i18n config (src/lib/i18n/config.ts): en, zh-CN, ja.
// The App Store kit previews each localization so the matching App Store Connect
// language can be filled by switching + copying field by field.
type KitLocale = "en" | "zh-CN" | "ja";

const kitLocales: Array<{ id: KitLocale; label: string; appStoreName: string }> = [
  { id: "en", label: "English", appStoreName: "English" },
  { id: "zh-CN", label: "简体中文", appStoreName: "Chinese, Simplified" },
  { id: "ja", label: "日本語", appStoreName: "Japanese" },
];

interface AppStoreListing {
  /** App name (≤30). Brand stays "Busabase" across locales. */
  name: string;
  /** Subtitle (≤30). */
  subtitle: string;
  /** Promotional text (≤170). */
  promotionalText: string;
  /** Keywords, comma-separated (≤100). */
  keywords: string;
  whatsNew: string;
  description: string;
  category: string;
  /** Privacy nutrition-label summary. */
  privacy: string;
}

// App Store Connect listing fields, per locale. Char limits noted so copy stays submittable.
const appStoreCopy: Record<KitLocale, AppStoreListing> = {
  en: {
    name: "Busabase",
    subtitle: "Review database for AI output",
    promotionalText:
      "Approval-first, auditable database for AI agents. Agents open change requests; you review the diff, comment, approve, and merge — every record keeps full provenance.",
    keywords:
      "AI agents,database,review,approve,audit,change request,merge,records,local-first,workflow",
    whatsNew:
      "v1.0 — First public release.\n• Change requests: create, update, delete, revise with an AI agent\n• Review diffs, comment, approve, and merge\n• Canonical records with full audit history\n• Node types: base, skill, doc, folder\n• Local-first, no login, REST API for agents",
    description: `Busabase is an approval-first, auditable database for teams using AI agents to produce content, datasets, and operational records.

AI agents increasingly produce real data — blog drafts, cleaned datasets, product records, structured rows other systems depend on. The missing layer isn't generation; it's approval, provenance, and merge.

In Busabase, every change starts as a Change Request: create a record, update a field, delete it, or ask an AI agent to revise the proposal. You review the diff, preview the result, comment, approve, and merge. The approved result becomes canonical data — and the history stays attached.

Think of it as GitHub Pull Requests, but for structured data instead of code.

Two principles:
• Approval-first — proposed data is reviewed before it becomes canonical.
• Auditable by default — every change answers who proposed it, what changed, why, who reviewed it, which agent helped, and when it merged.

Busabase is local-first: it runs on your machine with no account required, and exposes a REST API so agents can submit change requests directly.`,
    category: "Primary: Productivity · Secondary: Developer Tools",
    privacy:
      "Data Not Collected. The local / Desktop edition stores all workspace data in a database on the user's device. No data is transmitted off the device; there is no account, tracking, or analytics in the open-source / Desktop edition.",
  },

  "zh-CN": {
    name: "Busabase",
    subtitle: "AI 内容与数据的审核数据库",
    promotionalText:
      "面向 AI Agent 的「审批优先、可审计」数据库。Agent 提交变更请求，你审阅 diff、评论、批准并合并——每一条记录都保留完整的来源信息。",
    keywords: "AI Agent,数据库,审阅,批准,审计,变更请求,合并,记录,本地优先,工作流",
    whatsNew:
      "v1.0 — 首个公开版本。\n• 变更请求：创建、更新、删除，或让 AI Agent 修改提案\n• 审阅 diff、评论、批准并合并\n• 规范化记录，附带完整审计历史\n• 节点类型：base、skill、doc、folder\n• 本地优先、无需登录、为 Agent 提供 REST API",
    description: `Busabase 是一个「审批优先、可审计」的数据库，面向使用 AI Agent 生产内容、数据集与运营记录的团队。

AI Agent 正在产出越来越多的真实数据——博客草稿、清洗后的数据集、产品记录、其他系统依赖的结构化行。缺失的并不是「生成」这一环，而是审批、来源追溯与合并。

在 Busabase 中，每一次改动都从「变更请求」开始：创建记录、更新字段、删除记录，或让 AI Agent 修改提案。你审阅 diff、预览结果、评论、批准并合并。批准后的结果成为规范数据——历史记录始终保留。

可以把它理解为 GitHub 的 Pull Request，只不过对象是结构化数据，而不是代码。

两条原则：
• 审批优先——提案数据在成为规范数据之前先经过审阅。
• 默认可审计——每一次改动都能回答：谁提出的、改了什么、为什么、谁审阅的、哪个 Agent 参与了、何时合并的。

Busabase 本地优先：在你的设备上运行，无需账号；并提供 REST API，方便 Agent 直接提交变更请求。`,
    category: "主要：效率 · 次要：开发者工具",
    privacy:
      "不收集数据。本地 / 桌面版将所有工作区数据存储在用户设备上的数据库中。不会向设备外传输任何数据；开源 / 桌面版没有账号、追踪或分析。",
  },

  ja: {
    name: "Busabase",
    subtitle: "AI出力のレビューデータベース",
    promotionalText:
      "AI エージェントのための「承認ファースト・監査可能」なデータベース。エージェントが変更リクエストを出し、あなたは差分を確認・コメント・承認してマージ。すべての記録に完全な来歴が残ります。",
    keywords:
      "AIエージェント,データベース,レビュー,承認,監査,変更リクエスト,マージ,レコード,ローカルファースト,ワークフロー",
    whatsNew:
      "v1.0 — 初回公開リリース。\n• 変更リクエスト：作成・更新・削除、AI エージェントによる修正\n• 差分のレビュー、コメント、承認、マージ\n• 完全な監査履歴を持つ正規レコード\n• ノード種別：base、skill、doc、folder\n• ローカルファースト、ログイン不要、エージェント向け REST API",
    description: `Busabase は、AI エージェントでコンテンツ・データセット・運用記録を生み出すチームのための「承認ファースト・監査可能」なデータベースです。

AI エージェントは、本物のデータをますます生み出しています——ブログ下書き、整えたデータセット、製品レコード、他のシステムが依存する構造化された行。足りないのは「生成」ではなく、承認・来歴・マージです。

Busabase では、あらゆる変更が「変更リクエスト」から始まります。レコードの作成、フィールドの更新、削除、または AI エージェントに提案の修正を依頼。あなたは差分を確認し、結果をプレビューし、コメントし、承認してマージします。承認された結果が正規データになり、履歴はそのまま残ります。

GitHub の Pull Request を、コードではなく構造化データに対して行うものだと考えてください。

2つの原則：
• 承認ファースト — 提案データは正規になる前にレビューされる。
• デフォルトで監査可能 — すべての変更が、誰が提案し、何が変わり、なぜ、誰がレビューし、どのエージェントが関わり、いつマージされたかに答える。

Busabase はローカルファースト。アカウント不要であなたのマシン上で動き、エージェントが直接変更リクエストを送れる REST API を備えています。`,
    category: "メイン：仕事効率化 · サブ：開発ツール",
    privacy:
      "データを収集しません。ローカル / デスクトップ版は、すべてのワークスペースデータをユーザーの端末内のデータベースに保存します。データが端末外に送信されることはなく、オープンソース / デスクトップ版にはアカウント・トラッキング・分析がありません。",
  },
};

// Locale-independent listing fields (URLs are the same across localizations).
const listingUrls = {
  marketing: "https://busabase.com",
  support: "https://busabase.com/docs",
  privacy: "https://busabase.com/legal/privacy",
};

function primaryCategory(category: string) {
  const parts = category.split("·")[0].split(/[:：]/);
  return parts[parts.length - 1]?.trim();
}

// App Review notes are read by Apple's reviewers in English — kept locale-independent.
const reviewNotes = `Busabase (local / Desktop edition) is local-first and requires NO account, server, or purchase to review.

On first launch it seeds demo data, so every feature — change requests, diff review, approve & merge, records, and the audit trail — is usable immediately.

To test the core loop: open the Inbox, pick a pending change request, review the diff, approve, then Merge. The record appears under Records with its full history.

No login is required. There is no in-app purchase in the Desktop edition.`;

const mobileScreenshotImages = [
  "/public-busabase/assets/readme/mobile-raw/mobile-inbox.png",
  "/public-busabase/assets/readme/mobile-raw/mobile-change-request.png",
  "/public-busabase/assets/readme/mobile-raw/mobile-record.png",
] as const;

const macScreenshotImages = [
  "/public-busabase/assets/gallery/hero.png",
  "/public-busabase/assets/gallery/slide2-prs-for-data.png",
  "/public-busabase/assets/gallery/slide3-preview-before-truth.png",
  "/public-busabase/assets/gallery/slide4-flexible-auditable.png",
  "/public-busabase/assets/gallery/slide5-headless-cms.png",
  "/public-busabase/assets/gallery/slide-cta.png",
] as const;

const screenshotCaptions: Record<KitLocale, Array<{ eyebrow: string; title: string }>> = {
  en: [
    { eyebrow: "Inbox", title: "Review agent-submitted Change Requests on mobile" },
    { eyebrow: "Approval gate", title: "Inspect proposed fields before they merge" },
    { eyebrow: "Trusted records", title: "See approved data with history attached" },
  ],
  "zh-CN": [
    { eyebrow: "收件箱", title: "手机审核 Agent 变更请求" },
    { eyebrow: "审核关口", title: "合并前检查字段改动" },
    { eyebrow: "可信记录", title: "查看已批准数据历史" },
  ],
  ja: [
    { eyebrow: "受信箱", title: "エージェントの変更リクエストをモバイルで確認" },
    { eyebrow: "承認ゲート", title: "マージ前に提案フィールドを検査" },
    { eyebrow: "信頼済みレコード", title: "承認済みデータと履歴を確認" },
  ],
};

// Internal submission checklist (English — App Store Connect tooling is English).
const assetChecklist = [
  "App icon 1024×1024 (no alpha, no rounded corners)",
  "Mac screenshots 2560×1600 (or 1280×800) — export from the gallery set above",
  'iPhone 6.7" screenshots 1290×2796 (only if the mobile app ships)',
  "Signed + notarized build (Developer ID for direct; App Store distribution cert for MAS)",
  "Privacy policy URL live (busabase.com/legal/privacy)",
  "Privacy nutrition labels filled (Data Not Collected for the local edition)",
  "Age rating questionnaire completed (expected 4+)",
  "Primary + secondary category selected",
  "Localized listings filled: English, 简体中文, 日本語 (switch above to copy each)",
  "Demo data seeds on first launch (so review is self-serve, no login)",
  "App Review notes pasted into App Store Connect",
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      type="button"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CopyCard({
  title,
  value,
  hint,
  multiline,
}: {
  title: string;
  value: string;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
        </div>
        <CopyButton value={value} />
      </div>
      <p
        className={`text-muted-foreground text-sm leading-6 ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Stars() {
  const stars = ["one", "two", "three", "four", "five"];

  return (
    <span className="as-info-stars" title="No ratings">
      {stars.map((star) => (
        <Star key={star} size={13} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

function AppIcon() {
  return (
    <img src="/public-busabase/assets/icons/icon512.png" alt="Busabase icon" className="as-icon" />
  );
}

export default function BusabaseAppStore() {
  const [locale, setLocale] = useState<KitLocale>("en");
  const listing = appStoreCopy[locale];
  const captions = screenshotCaptions[locale];
  const languagesValue =
    locale === "zh-CN" ? "EN, 简中, 日" : locale === "ja" ? "EN, 簡中, 日" : "EN, 简中, JA";

  const information: Array<{ label: string; value: string }> = [
    { label: "Seller", value: "Busabase" },
    { label: "Size", value: "36 MB" },
    { label: "Category", value: listing.category },
    { label: "Compatibility", value: "Mac — Requires macOS 14.0 or later" },
    { label: "Languages", value: "English, 简体中文, 日本語" },
    { label: "Age Rating", value: "4+" },
    { label: "Copyright", value: "© 2026 Busabase" },
    { label: "Price", value: "Free" },
  ];

  return (
    <main className="as-page">
      <div className="as">
        <div className="as-kicker">
          <span className="eyebrow">Launch kit · App Store preview</span>
          <Link href="/launch-pages/busabase/producthunt" className="as-kicker-link">
            Product Hunt kit <ChevronRight size={15} />
          </Link>
        </div>

        <div className="as-langs" role="group" aria-label="Preview language">
          {kitLocales.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className={`as-lang${loc.id === locale ? " is-active" : ""}`}
              aria-pressed={loc.id === locale}
              onClick={() => setLocale(loc.id)}
            >
              {loc.label}
            </button>
          ))}
        </div>

        <header className="as-head">
          <AppIcon />
          <div className="as-head-body">
            <h1 className="as-name">{listing.name}</h1>
            <p className="as-tagline">{listing.subtitle}</p>
            <span className="as-dev">Busabase</span>
            <div className="as-actions">
              <div>
                <button type="button" className="as-get">
                  Get
                </button>
                <span className="as-iap">No In-App Purchases</span>
              </div>
              <span className="as-share" aria-hidden>
                <UploadCloud size={22} />
              </span>
            </div>
          </div>
        </header>

        <div className="as-info">
          <div className="as-info-item">
            <div className="as-info-cap">No Ratings</div>
            <div className="as-info-val">
              <Stars />
            </div>
            <div className="as-info-sub">Be the first</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Age</div>
            <div className="as-info-val">
              <span className="as-strong">4+</span>
            </div>
            <div className="as-info-sub">Years Old</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Category</div>
            <div className="as-info-val">
              <Grid2x2 size={14} />
              <span className="as-strong">{primaryCategory(listing.category)}</span>
            </div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Developer</div>
            <div className="as-info-val">
              <Square size={13} fill="currentColor" strokeWidth={0} />
              <span className="as-strong">Busabase</span>
            </div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Languages</div>
            <div className="as-info-val">
              <span className="as-strong">3</span>
            </div>
            <div className="as-info-sub">{languagesValue}</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Price</div>
            <div className="as-info-val">
              <span className="as-strong">Free</span>
            </div>
          </div>
        </div>

        <section className="as-section">
          <div className="as-shots">
            {mobileScreenshotImages.map((src, index) => {
              const cap = captions[index];
              return (
                <div
                  className={`poster busabase-poster v-${index === 1 ? "accent" : index === 2 ? "cream" : "primary"}`}
                  key={src}
                >
                  <div className="poster-cap">
                    <p className="poster-eyebrow">{cap?.eyebrow}</p>
                    <p className="poster-title">{cap?.title}</p>
                  </div>
                  <div className="poster-device">
                    <img src={src} alt={cap?.title ?? "Busabase App Store screenshot"} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="poster-hint">
            iPhone 6.7&quot; screenshot source · mobile App Store poster mockups
          </p>
        </section>

        <section className="as-section">
          <p className="as-text">{listing.description}</p>
          <p className="as-dev" style={{ marginTop: 16 }}>
            Busabase
          </p>
          <span className="as-text" style={{ color: "var(--as-text-2)", fontSize: 13 }}>
            Developer
          </span>
        </section>

        <section className="as-section">
          <div className="as-section-head">
            <h2>What&apos;s New</h2>
            <span className="as-more">Version History</span>
          </div>
          <div className="as-version-row">
            <span>Version 1.0</span>
            <span>New</span>
          </div>
          <p className="as-text">{listing.whatsNew}</p>
        </section>

        <section className="as-section">
          <div className="as-section-head">
            <h2>App Privacy</h2>
          </div>
          <p className="as-privacy-intro">
            The developer, Busabase, indicated that the app&apos;s privacy practices may include
            handling of data as described below.
          </p>
          <div className="as-privacy">
            <div className="as-privacy-lead">
              <ShieldCheck size={26} />
              <div>
                <div className="as-privacy-tag">Data Not Collected</div>
                <p className="as-privacy-sub">{listing.privacy}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="as-section">
          <div className="as-section-head">
            <h2>Information</h2>
          </div>
          <dl className="as-meta">
            {information.map((row) => (
              <div className="as-meta-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            <div className="as-meta-row">
              <dt>Developer Website</dt>
              <dd>
                <span className="as-more">busabase.com</span>
              </dd>
            </div>
            <div className="as-meta-row">
              <dt>Privacy Policy</dt>
              <dd>
                <span className="as-more">busabase.com/legal/privacy</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="as-appendix">
        <p className="as-appendix-note">Submission notes · not shown on the App Store</p>

        <h3>Screenshot export</h3>
        <div className="copy-block">
          Use the vertical mobile screenshots above for iPhone / iPad App Store previews. The
          Product Hunt gallery can still be reused for Mac App Store screenshots:
          <br />
          <strong>Mobile</strong> — source frames are 1440×3004; crop/export to 1290×2796 and
          1179×2556 as needed
          <br />
          <strong>Mac</strong> — {macScreenshotImages.length} landscape gallery masters are
          available for 2560×1600 or 1280×800
          <br />
          Keep the headline consistent: approval-first and auditable.
        </div>

        {kitLocales.map((loc) => {
          const localized = appStoreCopy[loc.id];
          return (
            <div key={loc.id} className="as-appendix-locale">
              <h3>
                {loc.label} · {loc.appStoreName}
              </h3>
              <div className="grid gap-4">
                <CopyCard hint="≤30 chars" title="App name" value={localized.name} />
                <CopyCard hint="≤30 chars" title="Subtitle" value={localized.subtitle} />
                <CopyCard
                  hint="≤170 chars"
                  title="Promotional text"
                  value={localized.promotionalText}
                />
                <CopyCard
                  hint="≤100 chars, comma-separated"
                  title="Keywords"
                  value={localized.keywords}
                />
                <CopyCard title="Category" value={localized.category} />
                <CopyCard multiline title="Description" value={localized.description} />
                <CopyCard multiline title="What's New (v1.0)" value={localized.whatsNew} />
                <CopyCard multiline title="Privacy (nutrition labels)" value={localized.privacy} />
              </div>
            </div>
          );
        })}

        <h3>App Review notes</h3>
        <CopyCard multiline title="App Review notes (English)" value={reviewNotes} />

        <h3>URLs</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <CopyCard title="Marketing URL" value={listingUrls.marketing} />
          <CopyCard title="Support URL" value={listingUrls.support} />
          <CopyCard title="Privacy URL" value={listingUrls.privacy} />
        </div>

        <h3>Submission asset checklist</h3>
        <div className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            <h2 className="font-semibold text-base text-foreground">Submission asset checklist</h2>
          </div>
          <ul className="space-y-3">
            {assetChecklist.map((item) => (
              <li className="flex gap-3 text-muted-foreground text-sm leading-6" key={item}>
                <Check className="mt-1 size-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-md border border-border/70 bg-muted/30 p-3 text-muted-foreground text-sm leading-6">
            <Sparkles className="mb-2 size-4 text-primary" />
            Keep the App Store headline the same as everywhere else: approval-first and auditable.
            The screenshots should show the diff → approve → merge → record loop in four taps.
          </div>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
            <Tag className="size-3.5" /> Mac App Store first; reuse the same copy for the iOS App
            Store if the mobile app ships.
          </div>
        </div>
      </div>
    </main>
  );
}
