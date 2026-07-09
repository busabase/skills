import { ChevronRight, Grid2x2, ShieldCheck, Square, Star, UploadCloud } from "lucide-react";
import { useState } from "react";
import Link from "../../next-link-shim";
import "./inpomo-kit.css";

// ── Inlined from apps/inpomo/src/content/copy.ts ──────────────────────────

export type StoreLocale = "en" | "zh-Hans" | "ja" | "ko";

export const storeLocales: Array<{ id: StoreLocale; label: string; appStoreName: string }> = [
  { id: "en", label: "English", appStoreName: "English" },
  { id: "zh-Hans", label: "简体中文", appStoreName: "Chinese, Simplified" },
  { id: "ja", label: "日本語", appStoreName: "Japanese" },
  { id: "ko", label: "한국어", appStoreName: "Korean" },
];

export type PosterVariant = "v-primary" | "v-accent" | "v-dark" | "v-cream";

export const posterFrames: Array<{ src: string; alt: string; variant: PosterVariant }> = [
  {
    src: "/public-inpomo/screens/timer-running.png",
    alt: "Timer counting down while the AI works",
    variant: "v-primary",
  },
  {
    src: "/public-inpomo/screens/timer-light.png",
    alt: "Timer ready to start",
    variant: "v-cream",
  },
  {
    src: "/public-inpomo/screens/prompts-light.png",
    alt: "Prompts tab with parked ideas",
    variant: "v-accent",
  },
  {
    src: "/public-inpomo/screens/settings-dark.png",
    alt: "Settings with presets and durations",
    variant: "v-dark",
  },
  {
    src: "/public-inpomo/screens/prompts-dark.png",
    alt: "On-device notes, dark mode",
    variant: "v-cream",
  },
];

export interface PosterCaption {
  eyebrow: string;
  title: string;
}

export interface AppStoreListing {
  appName: string;
  subtitle: string;
  promotionalText: string;
  keywords: string;
  description: string;
  whatsNew: string;
  posters: PosterCaption[];
  languagesValue: string;
  privacySub: string;
}

export const appStoreCopy: Record<StoreLocale, AppStoreListing> = {
  en: {
    appName: "Inpomo: Inverted Pomodoro",
    subtitle: "Beat the AI-babysitting habit",
    promotionalText:
      "The inverted Pomodoro for vibe coders: your AI agent takes the long work block, you take a short handoff window. Fire off Claude Code, then actually walk away.",
    keywords:
      "pomodoro,focus timer,claude code,codex,cursor,ai agent,vibe coding,deep work,timer,productivity",
    description: `Inpomo is the inverted Pomodoro for vibe coders — the people babysitting Claude Code, Codex, and Cursor all day.

Classic Pomodoro maximizes the time you stare at the screen. But when Claude Code, Codex, or Cursor is doing the work, staring is the problem — not the solution. Inpomo flips the timer: the agent gets the long work block, and you get a short, deliberate handoff window.

THE LOOP
• Give the agent a command, start a tomato, and swipe the app away.
• When the block ends, an alarm-style notification pulls you back — the kind you actually dismiss.
• While you're away, pop open the Prompts tab to park a thought (type it; dictation works too).
• Back at your desk, check off the ideas you acted on. Train the gap longer over time.

TWO TABS, NOTHING MORE
• Timer — one big ring, Start & leave, and your "overripe" overrun (the time you relapse into babysitting).
• Prompts — a quick local list to park ideas while away, with tap-to-complete.

WHY INPOMO
• Built for the agent era — Claude Code, Codex, Cursor run long; you check in short.
• Background-safe — the timer is timestamp-based, so it's correct even after your phone sleeps.
• An alarm-grade local notification brings you back exactly on time.
• Three presets (Rotten Pomodoro, Reverse Pomodoro, Overripe Long Run) or fully custom durations.

PRIVATE BY DESIGN
No account. No cloud. No tracking. Everything — settings and your prompts — stays on your device in a local database. Inpomo collects nothing.`,
    whatsNew: `First release.
• Inverted AI / human focus timer with three presets and custom durations.
• Background-safe countdown with an alarm-style come-back notification.
• Prompts tab: park ideas while away, check them off when done.
• Fully private — no account, no cloud. Everything stays on-device.`,
    posters: [
      {
        eyebrow: "For people who babysit AI coding agents",
        title: "The inverted Pomodoro for vibe coders.",
      },
      { eyebrow: "Start & leave", title: "Claude Code cooks. You touch grass." },
      { eyebrow: "Capture & move on", title: "Idea hits? Jot it and go — don't look back." },
      { eyebrow: "Three presets or custom", title: "Pick a vibe, or tune your own." },
      { eyebrow: "Private by design", title: "No account. No cloud. No tracking." },
    ],
    languagesValue: "EN, 简中, 日, 한",
    privacySub:
      "The developer does not collect any data from this app. No account, no cloud, no tracking — everything stays on your device.",
  },

  "zh-Hans": {
    appName: "Inpomo 反向番茄钟",
    subtitle: "专治 Vibe Coding 上瘾",
    promotionalText:
      "为 Vibe Coder 打造的反向番茄钟：AI agent 拿走长长的工作块，你只留一个短交接窗口。给 Claude Code 派个活，然后真正离开屏幕。",
    keywords: "番茄钟,专注计时,claude code,codex,cursor,ai agent,vibe coding,深度工作,计时器,效率",
    description: `Inpomo 是为 Vibe Coder 打造的「反向番茄钟」——写给天天给 Claude Code、Codex、Cursor 当保姆的人。

传统番茄工作法最大化你盯着屏幕的时间。但当干活的是 Claude Code、Codex 或 Cursor 时，盯着看才是问题，而不是解法。Inpomo 把计时器反过来：机器拿长长的工作块，你只留一个短小、刻意的交接窗口。

工作循环
• 给 agent 派个活，开一个番茄，然后把 app 划走。
• 工作块结束时，闹钟级的通知会把你叫回来——是那种你必须手动关掉的。
• 离开期间，打开「灵感」页随手记下念头（打字、语音都行）。
• 回到桌前，勾掉你已经动手的想法。慢慢把交接间隔训练得更长。

只有两个 Tab
• 计时 —— 一个大大的圆环，开始即走，外加你的「过熟」超时（你复发式围观的时间）。
• 灵感 —— 离开时随手记想法的本地清单，点一下即可完成。

为什么是 Inpomo
• 为 agent 时代而生 —— Claude Code、Codex、Cursor 跑得久，你只需短暂查看。
• 后台安全 —— 计时基于时间戳，手机休眠后依然准确。
• 闹钟级的本地通知，准时把你叫回来。
• 三个预设（Rotten Pomodoro、Reverse Pomodoro、Overripe Long Run），也可完全自定义时长。

隐私至上
无账号、无云、无追踪。所有设置和你的灵感都只存在本地设备的数据库里。Inpomo 什么都不收集。`,
    whatsNew: `首个版本。
• 反向的 AI / 人类专注计时器，含三个预设与自定义时长。
• 后台安全的倒计时，配闹钟级的「叫你回来」通知。
• 灵感页：离开时记下想法，回来后逐条勾掉。
• 完全私密 —— 无账号、无云，一切都在本地。`,
    posters: [
      {
        eyebrow: "写给天天给 AI coding agent 当保姆的人",
        title: "为 Vibe Coder 打造的反向番茄钟。",
      },
      { eyebrow: "开始即走", title: "当 Claude Code 干活时，你去晒太阳。" },
      { eyebrow: "记下就走", title: "灵感来了？记一笔就走，别回头。" },
      { eyebrow: "三个预设或自定义", title: "挑个节奏，或自己调。" },
      { eyebrow: "隐私至上", title: "无账号。无云。无追踪。" },
    ],
    languagesValue: "英、简中、日、韩",
    privacySub: "开发者不会从本 app 收集任何数据。无账号、无云、无追踪——一切都留在你的设备上。",
  },

  ja: {
    appName: "Inpomo：逆ポモドーロ",
    subtitle: "AI のお守り依存を治す",
    promotionalText:
      "Vibe Coder のための逆ポモドーロ。長い作業ブロックは AI エージェントへ、あなたには短い引き継ぎの窓を。Claude Code に投げたら、本当に離席。",
    keywords:
      "ポモドーロ,集中タイマー,claude code,codex,cursor,ai エージェント,vibe coding,深い作業,タイマー,生産性",
    description: `Inpomo は Vibe Coder のための「逆ポモドーロ」です。Claude Code・Codex・Cursor のお守りを一日中している人のために。

従来のポモドーロは、画面を見つめる時間を最大化します。でも作業しているのが Claude Code・Codex・Cursor なら、見つめること自体が問題で、解決策ではありません。Inpomo はタイマーを反転させます。長い作業ブロックはエージェントへ、あなたには短く意図的な引き継ぎの窓を。

ループ
• エージェントに指示を出し、トマトを開始して、アプリをスワイプして閉じる。
• ブロックが終わると、アラーム級の通知が呼び戻します。きちんと解除するタイプの通知です。
• 離れている間は、プロンプトタブに思いつきを置いておく（入力も音声入力もOK）。
• 机に戻ったら、対応したアイデアにチェック。引き継ぎの間隔を少しずつ長く鍛えましょう。

タブは2つだけ
• タイマー — 大きなリング、開始して離席、そして「熟しすぎ」の超過時間（お守りに逆戻りした時間）。
• プロンプト — 離席中に思いつきを置くローカルなリスト。タップで完了。

Inpomo を選ぶ理由
• エージェント時代のために — Claude Code・Codex・Cursor は長く走り、あなたは短く確認。
• バックグラウンド安全 — タイムスタンプ方式なので、スリープ後も正確。
• アラーム級のローカル通知が、ぴったりの時刻に呼び戻します。
• 3つのプリセット（Rotten Pomodoro / Reverse Pomodoro / Overripe Long Run）、または完全カスタム。

プライバシー第一
アカウント不要。クラウドなし。トラッキングなし。設定もあなたのひらめきも、すべて端末内のローカルDBに留まります。Inpomo は何も収集しません。`,
    whatsNew: `初回リリース。
• 反転した AI／人間の集中タイマー。3つのプリセットとカスタム時間。
• バックグラウンド安全なカウントダウンと、アラーム級の呼び戻し通知。
• プロンプトタブ：離席中に思いつきを置き、戻ったらチェック。
• 完全プライベート — アカウントもクラウドもなし。すべて端末内。`,
    posters: [
      {
        eyebrow: "AI コーディングエージェントのお守りをする人へ",
        title: "Vibe Coder のための逆ポモドーロ。",
      },
      { eyebrow: "開始して離席", title: "Claude Code が働く間、あなたは日向ぼっこ。" },
      { eyebrow: "メモして離れる", title: "ひらめいた？さっとメモして、振り返らない。" },
      { eyebrow: "3つのプリセット／カスタム", title: "リズムを選ぶ、または自分で調整。" },
      { eyebrow: "プライバシー第一", title: "アカウントなし。クラウドなし。追跡なし。" },
    ],
    languagesValue: "英・簡体中・日・韓",
    privacySub:
      "開発者はこのアプリからいかなるデータも収集しません。アカウントなし、クラウドなし、トラッキングなし — すべて端末内に留まります。",
  },

  ko: {
    appName: "Inpomo: 거꾸로 포모도로",
    subtitle: "AI 보모 중독 치료",
    promotionalText:
      "바이브 코더를 위한 거꾸로 포모도로. 긴 작업 블록은 AI 에이전트에게, 당신에게는 짧은 인계 시간을. Claude Code에 맡기고 정말로 자리를 뜨세요.",
    keywords:
      "포모도로,집중 타이머,claude code,codex,cursor,ai 에이전트,바이브 코딩,딥워크,타이머,생산성",
    description: `Inpomo는 바이브 코더를 위한 '거꾸로 포모도로'입니다. Claude Code, Codex, Cursor를 하루 종일 돌보는 사람들을 위해.

전통적인 포모도로는 화면을 응시하는 시간을 극대화합니다. 하지만 일을 하는 주체가 Claude Code, Codex, Cursor라면 응시하는 것 자체가 문제이지 해법이 아닙니다. Inpomo는 타이머를 뒤집습니다. 긴 작업 블록은 에이전트에게, 당신에게는 짧고 의도적인 인계 시간을.

루프
• 에이전트에 명령을 내리고, 토마토를 시작한 뒤 앱을 밀어 닫습니다.
• 블록이 끝나면 알람 형식의 알림이 불러옵니다. 직접 꺼야 하는 그런 알림이죠.
• 자리를 비운 동안 프롬프트 탭에 떠오른 생각을 적어 두세요(입력도 받아쓰기도 가능).
• 책상에 돌아오면 실행한 아이디어를 체크하세요. 인계 간격을 점점 더 길게 단련하세요.

탭은 단 두 개
• 타이머 — 큰 링 하나, 시작하고 자리 뜨기, 그리고 '너무 익음' 초과 시간(보모 노릇으로 되돌아간 시간).
• 프롬프트 — 자리를 비운 동안 생각을 적어 두는 로컬 목록. 탭 한 번으로 완료.

왜 Inpomo인가
• 에이전트 시대를 위해 — Claude Code, Codex, Cursor는 길게 돌고, 당신은 짧게 확인합니다.
• 백그라운드 안전 — 타임스탬프 기반이라 휴대폰이 잠든 뒤에도 정확합니다.
• 알람급 로컬 알림이 정확한 시각에 불러옵니다.
• 세 가지 프리셋(Rotten Pomodoro, Reverse Pomodoro, Overripe Long Run) 또는 완전 커스텀.

설계부터 프라이빗
계정 없음. 클라우드 없음. 추적 없음. 설정도 당신의 영감도 모두 기기 내 로컬 DB에 남습니다. Inpomo는 아무것도 수집하지 않습니다.`,
    whatsNew: `첫 출시.
• 거꾸로 된 AI / 사람 집중 타이머. 세 가지 프리셋과 커스텀 시간.
• 백그라운드 안전 카운트다운과 알람 형식의 복귀 알림.
• 프롬프트 탭: 자리를 비운 동안 생각을 적고, 돌아와 체크.
• 완전 프라이빗 — 계정도 클라우드도 없음. 모두 기기 내.`,
    posters: [
      {
        eyebrow: "AI 코딩 에이전트를 돌보는 사람을 위해",
        title: "바이브 코더를 위한 거꾸로 포모도로.",
      },
      {
        eyebrow: "시작하고 자리 뜨기",
        title: "Claude Code가 일하는 동안, 당신은 햇볕이나 쬐세요.",
      },
      { eyebrow: "적고 떠나기", title: "영감 떠올랐다? 얼른 적고 떠나기, 뒤돌아보지 말고." },
      { eyebrow: "프리셋 또는 커스텀", title: "리듬을 고르거나, 직접 조정." },
      { eyebrow: "설계부터 프라이빗", title: "계정 없음. 클라우드 없음. 추적 없음." },
    ],
    languagesValue: "영·간체·일·한",
    privacySub:
      "개발자는 이 앱에서 어떤 데이터도 수집하지 않습니다. 계정 없음, 클라우드 없음, 추적 없음 — 모두 기기 내에 남습니다.",
  },
};

export const reviewNotes =
  'Inpomo is a fully local, single-user focus timer. There is no login, no account, no server, and no network calls — the reviewer can use every feature immediately on launch. The only permission requested is Notifications, used solely to schedule a local "come back" reminder when an AI work block ends.';

export const encryptionNote =
  "Exempt — uses only standard OS encryption (ITSAppUsesNonExemptEncryption = false).";

export const screenshotSpec =
  'iPhone: export at 1290×2796 (6.7") and 1179×2556 (6.1"). iPad: export at 2064×2752 (Pro 13") and 1668×2388 (Pro 11"). Bundle ID com.inpomo.app · Primary category Productivity · Secondary Health & Fitness.';

// ── End inlined copy ────────────────────────────────────────────────────────

type DeviceType = "iphone" | "ipad";

function AppIcon() {
  return (
    <img
      className="as-icon"
      src="/public-inpomo/assets/icons/app-store-icon.png"
      alt="Inpomo app icon"
    />
  );
}

function Stars() {
  return (
    <span className="as-info-stars" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function InpomoAppStore() {
  const [locale, setLocale] = useState<StoreLocale>("en");
  const [device, setDevice] = useState<DeviceType>("iphone");
  const listing = appStoreCopy[locale];

  const information: Array<{ label: string; value: string }> = [
    { label: "Seller", value: "Inpomo" },
    { label: "Size", value: "12 MB" },
    { label: "Category", value: "Productivity" },
    {
      label: "Compatibility",
      value: "iPhone and iPad — Requires iOS 17.0 or later",
    },
    { label: "Languages", value: "English, 简体中文, 日本語, 한국어" },
    { label: "Age Rating", value: "4+" },
    { label: "Copyright", value: "© 2026 Inpomo" },
    { label: "Price", value: "Free" },
  ];

  return (
    <main className="as-page">
      <div className="as">
        <div className="as-kicker">
          <span className="eyebrow">Launch kit · App Store preview</span>
          <Link href="/launch-pages/inpomo/producthunt" className="as-kicker-link">
            Product Hunt kit <ChevronRight size={15} />
          </Link>
        </div>

        {/* Language switcher */}
        <div className="as-langs" role="group" aria-label="Preview language">
          {storeLocales.map((loc) => (
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

        {/* Product header */}
        <header className="as-head">
          <AppIcon />
          <div className="as-head-body">
            <h1 className="as-name">{listing.appName}</h1>
            <p className="as-tagline">{listing.subtitle}</p>
            <span className="as-dev">Inpomo</span>
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

        {/* Info strip */}
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
              <span className="as-strong">Productivity</span>
            </div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Developer</div>
            <div className="as-info-val">
              <Square size={13} fill="currentColor" strokeWidth={0} />
              <span className="as-strong">Inpomo</span>
            </div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Languages</div>
            <div className="as-info-val">
              <span className="as-strong">4</span>
            </div>
            <div className="as-info-sub">{listing.languagesValue}</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">Price</div>
            <div className="as-info-val">
              <span className="as-strong">Free</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <section className="as-section">
          <div
            className="as-langs"
            role="group"
            aria-label="Device type"
            style={{ marginBottom: 16 }}
          >
            <button
              type="button"
              className={`as-lang${device === "iphone" ? " is-active" : ""}`}
              aria-pressed={device === "iphone"}
              onClick={() => setDevice("iphone")}
            >
              iPhone
            </button>
            <button
              type="button"
              className={`as-lang${device === "ipad" ? " is-active" : ""}`}
              aria-pressed={device === "ipad"}
              onClick={() => setDevice("ipad")}
            >
              iPad
            </button>
          </div>

          <div className="as-shots">
            {posterFrames.map((frame, i) => {
              const cap = listing.posters[i];
              const isIpad = device === "ipad";
              return (
                <div
                  className={`poster ${frame.variant}${isIpad ? " is-ipad" : ""}`}
                  key={`${frame.src}-${device}`}
                >
                  <div className="poster-cap">
                    <p className="poster-eyebrow">{cap?.eyebrow}</p>
                    <p className="poster-title">{cap?.title}</p>
                  </div>
                  <div className="poster-device">
                    <img src={frame.src} alt={cap?.title ?? frame.alt} />
                  </div>
                </div>
              );
            })}
          </div>

          {device === "ipad" && (
            <p className="poster-hint">iPad Pro 13&Prime; · 2064 × 2752 px · portrait</p>
          )}
          {device === "iphone" && <p className="poster-hint">iPhone 6.7&Prime; · 1290 × 2796 px</p>}
        </section>

        {/* Description */}
        <section className="as-section">
          <p className="as-text">{listing.description}</p>
          <p className="as-dev" style={{ marginTop: 16 }}>
            Inpomo
          </p>
          <span className="as-text" style={{ color: "var(--as-text-2)", fontSize: 13 }}>
            Developer
          </span>
        </section>

        {/* What's New */}
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

        {/* App Privacy */}
        <section className="as-section">
          <div className="as-section-head">
            <h2>App Privacy</h2>
          </div>
          <p className="as-privacy-intro">
            The developer, Inpomo, indicated that the app&apos;s privacy practices may include
            handling of data as described below.
          </p>
          <div className="as-privacy">
            <div className="as-privacy-lead">
              <ShieldCheck size={26} />
              <div>
                <div className="as-privacy-tag">Data Not Collected</div>
                <p className="as-privacy-sub">{listing.privacySub}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Information table */}
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
                <span className="as-more">inpomo.app</span>
              </dd>
            </div>
            <div className="as-meta-row">
              <dt>Privacy Policy</dt>
              <dd>
                <span className="as-more">inpomo.app/privacy</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Internal submission data */}
      <div className="as-appendix">
        <p className="as-appendix-note">Submission notes · not shown on the App Store</p>

        <h3>Screenshot export</h3>
        <div className="copy-block">
          Toggle iPhone / iPad above to preview each format. Export sizes:
          <br />
          <strong>iPhone</strong> — 1290×2796 (6.7&Prime;) and 1179×2556 (6.1&Prime;)
          <br />
          <strong>iPad</strong> — 2064×2752 (Pro 13&Prime;) and 1668×2388 (Pro 11&Prime;)
          <br />
          The first two frames carry ~90% of the decision — keep their captions benefit-led and
          readable at thumbnail size.
        </div>

        {storeLocales.map((loc) => {
          const l = appStoreCopy[loc.id];
          return (
            <div key={loc.id} className="as-appendix-locale">
              <h3>
                {loc.label} · {loc.appStoreName}
              </h3>
              <div className="copy-block">
                <strong>App name (30 char max)</strong>
                <br />
                {l.appName}
              </div>
              <div className="copy-block">
                <strong>Subtitle (30 char max)</strong>
                <br />
                {l.subtitle}
              </div>
              <div className="copy-block">
                <strong>Promotional text (170 char max)</strong>
                <br />
                {l.promotionalText}
              </div>
              <div className="copy-block">
                <strong>Keywords (100 char max)</strong>
                <br />
                {l.keywords}
              </div>
            </div>
          );
        })}

        <h3>App Review notes</h3>
        <div className="copy-block">{reviewNotes}</div>

        <h3>Encryption</h3>
        <div className="copy-block">{encryptionNote}</div>

        <h3>Screenshot specs</h3>
        <div className="copy-block">{screenshotSpec}</div>
      </div>
    </main>
  );
}

export default InpomoAppStore;
