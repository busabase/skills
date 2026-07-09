import { ArrowUpRight, Check, Copy, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { type Localized, pickLocale, useGtmLocale } from "../../data";
import Link from "../../next-link-shim";
import "./inpomo-kit.css";

// ── Inlined from apps/inpomo/src/content/copy.ts ──────────────────────────

export type PosterVariant = "v-primary" | "v-accent" | "v-dark" | "v-cream";

export interface PosterCaption {
  eyebrow: Localized<string>;
  title: Localized<string>;
}

interface CommentDraft {
  title: string;
  copy: string;
}

interface ShareDraft {
  channel: string;
  title: string;
  copy: string;
}

/** Product Hunt gallery frames — same captures, PH rhythm (alternating side). */
const phGalleryFrames: Array<{ src: string; variant: PosterVariant; rev?: boolean }> = [
  { src: "/public-inpomo/screens/timer-running.png", variant: "v-primary" },
  { src: "/public-inpomo/screens/timer-light.png", variant: "v-dark", rev: true },
  { src: "/public-inpomo/screens/prompts-light.png", variant: "v-accent" },
  { src: "/public-inpomo/screens/settings-dark.png", variant: "v-cream", rev: true },
  { src: "/public-inpomo/screens/prompts-dark.png", variant: "v-primary" },
];

const phCopy = {
  title: {
    en: "Inpomo: Inverted Pomodoro for AI agent work",
    "zh-CN": "Inpomo：给 AI 陪跑型 vibe coder 的反向番茄钟",
  },
  tagline: {
    en: "Give the long work block to Claude Code, Codex, or Cursor — and come back only when a human is needed",
    "zh-CN": "把长工作块交给 Claude Code、Codex 或 Cursor，只在真正需要人类时回来",
  },
  shortDescription: {
    en: "Inpomo flips Pomodoro for the AI-agent era: give Claude Code, Codex, or Cursor the long work block, keep a short human handoff window, and get pulled back by an alarm-style local notification only when review is needed.",
    "zh-CN":
      "Inpomo 是 AI agent 时代的反向番茄钟：把长工作块交给 Claude Code、Codex 或 Cursor，人类只保留短交接窗口，等需要 review 时再用闹钟式本地通知把你叫回来。",
  },
  description: {
    en: "Inpomo is the inverted Pomodoro for vibe coders — the people babysitting Claude Code, Codex, and Cursor all day. Classic Pomodoro maximizes the time you stare at the screen — but when Claude Code, Codex, or Cursor is doing the work, staring is the problem. Inpomo flips it: the agent gets the long work block, you get a short handoff window. Give the agent a command, start a tomato, swipe the app away — and an alarm-style notification pulls you back exactly when a human is needed. While you're away, park ideas in the Prompts tab and check them off later. Private by design: no account, no cloud, no tracking — everything lives in a local database on your device. iPhone + desktop tray app.",
    "zh-CN":
      "Inpomo 是给 vibe coder 用的反向番茄钟，尤其是那些整天陪跑 Claude Code、Codex、Cursor 的人。传统番茄钟默认你要一直盯着屏幕工作；但当 AI agent 在执行任务时，盯屏本身反而成了问题。Inpomo 把节奏反过来：agent 拿走长工作块，人类只保留短交接窗口。给 agent 一个指令，开始一个 tomato，划走 app，等真正需要人类介入时再用闹钟式通知把你叫回来。离开期间，可以把突然想到的 prompt 放进 Prompts tab，之后再处理。隐私优先：无账号、无云、无追踪，所有数据都存在本机。支持 iPhone 和桌面托盘 app。",
  },
  firstComment: {
    en: `Hi Product Hunt 👋

I kept catching myself babysitting AI agents — firing off Claude Code, then staring at a log I couldn't speed up. So I built Inpomo (short for Inverted Pomodoro): the Pomodoro, inverted.

The agent gets the long block. You get a short, deliberate handoff window. Start the tomato, swipe the app away, and an alarm-style notification (the kind you have to dismiss) pulls you back when a human is actually needed. While you're away, the Prompts tab lets you park a quick thought — type or dictate — and check it off once you've acted on it back at your desk. It even tracks "overripe" time: every minute you relapse into hovering, so you can train the gap longer.

Two tabs, nothing more. Fully on-device — no account, no cloud, no tracking. iPhone, plus a desktop tray app.

Would love your feedback on the AI/human ratios that work for your workflow!`,
    "zh-CN": `Hi Product Hunt 👋

我一直发现自己在“陪跑”AI agent：给 Claude Code 发完任务，然后盯着一段我根本加速不了的日志。所以我做了 Inpomo，意思是 Inverted Pomodoro：反过来的番茄钟。

长工作块交给 agent。人类只保留一个短而明确的交接窗口。开始 tomato，划走 app，等真正需要人类判断、review 或继续提示时，再用闹钟式通知把你叫回来。离开期间，Prompts tab 可以让你快速记下一个想法，可以打字也可以语音输入，回到桌前再勾掉。它还会记录 overripe time：每一分钟忍不住回去盯 agent 的时间，都会变成可以训练的信号。

只有两个 tab，不多做。完全本地：无账号、无云、无追踪。iPhone，加一个桌面托盘 app。

很想听听大家在 AI / human 协作里，什么时间比例最顺手。`,
  },
  topics: ["Productivity", "Artificial Intelligence", "Mac", "iPhone", "Time tracking"],
} as const;

const appStoreCopy_en_posters: PosterCaption[] = [
  {
    eyebrow: {
      en: "AI agent work",
      "zh-CN": "AI Agent 工作流",
    },
    title: {
      en: "The inverted Pomodoro for agent-era work.",
      "zh-CN": "给 AI Agent 工作流的反向番茄钟。",
    },
  },
  {
    eyebrow: { en: "Start & leave", "zh-CN": "启动，然后离开" },
    title: {
      en: "Start the agent. Leave the screen.",
      "zh-CN": "启动 Agent，然后离开屏幕。",
    },
  },
  {
    eyebrow: { en: "Prompt parking", "zh-CN": "Prompt 暂存" },
    title: {
      en: "Park prompts without watching the log.",
      "zh-CN": "有想法先暂存，不回去盯日志。",
    },
  },
  {
    eyebrow: { en: "Handoff ratio", "zh-CN": "交接节奏" },
    title: {
      en: "Tune the AI / human handoff ratio.",
      "zh-CN": "调整 AI / 人类的交接节奏。",
    },
  },
  {
    eyebrow: { en: "Private by design", "zh-CN": "隐私优先" },
    title: {
      en: "No account. On-device. No tracking.",
      "zh-CN": "无账号，本机保存，不追踪。",
    },
  },
];

// ── End inlined copy ────────────────────────────────────────────────────────

const captions = appStoreCopy_en_posters;

const uiCopy = {
  appStoreKit: { en: "App Store kit", "zh-CN": "App Store Kit" },
  addToCollection: { en: "Add to collection", "zh-CN": "加入收藏" },
  visitWebsite: { en: "Visit website", "zh-CN": "访问官网" },
  launchKit: { en: "developer launch kit", "zh-CN": "开发者 launch kit" },
  aiWorkflow: { en: "AI workflow timer", "zh-CN": "AI 工作流计时器" },
  categories: {
    en: ["AI", "Productivity", "Developer Tools", "iPhone", "Mac"],
    "zh-CN": ["AI", "Productivity", "Developer Tools", "iPhone", "Mac"],
  },
  introOne: {
    en: "Inpomo is an inverted Pomodoro for people working with AI coding agents. Classic Pomodoro assumes the human is doing the work; Inpomo assumes the agent is often executing and the human should come back for handoff, review, or the next prompt.",
    "zh-CN":
      "Inpomo 是给 AI 编程 agent 工作流设计的反向番茄钟。传统番茄钟默认人类在执行任务；Inpomo 默认 agent 经常在执行，人类只需要在交接、review 或下一条 prompt 时回来。",
  },
  introTwo: {
    en: "Start a tomato, leave the screen, park ideas in Prompts while you are away, and get pulled back by an alarm-style local notification. No account, no cloud, no tracking.",
    "zh-CN":
      "开始一个 tomato 后离开屏幕，离开期间把想法暂存在 Prompts，等需要人类介入时再用闹钟式本地通知把你叫回来。无账号、无云、无追踪。",
  },
  overview: { en: "Overview", "zh-CN": "总览" },
  launches: { en: "Launches", "zh-CN": "发布" },
  reviews: { en: "Reviews", "zh-CN": "评论" },
  alternatives: { en: "Alternatives", "zh-CN": "替代品" },
  customers: { en: "Customers", "zh-CN": "客户" },
  more: { en: "More", "zh-CN": "更多" },
  makerFirstComment: { en: "Maker Comment", "zh-CN": "Maker 评论" },
  makerMeta: { en: "Maker · just now", "zh-CN": "Maker · 刚刚" },
  companyInfo: { en: "Company Info", "zh-CN": "公司信息" },
  listingCopy: { en: "Product Hunt Listing Copy", "zh-CN": "Product Hunt Listing 文案" },
  listingHelp: {
    en: "Copy-ready title, tagline, and short description for the Product Hunt draft.",
    "zh-CN": "Product Hunt 草稿可直接复制的标题、tagline 和短描述。",
  },
  title: { en: "Title", "zh-CN": "标题" },
  tagline: { en: "Tagline", "zh-CN": "Tagline" },
  shortDescription: { en: "Short description", "zh-CN": "短描述" },
  commentDraftsHelp: {
    en: "Supporter comments that each reinforce a different part of the Inpomo story.",
    "zh-CN": "每条 supporter comment 对应强化 Inpomo 故事里的一个不同角度。",
  },
  launchShareHelp: {
    en: "Copy drafts for X, LinkedIn, community posts, and Chinese sharing.",
    "zh-CN": "用于 X、LinkedIn、社群和中文分享的发布文案草稿。",
  },
  submissionNote: {
    en: "Submission notes · not shown on Product Hunt",
    "zh-CN": "提交备注 · 不会展示在 Product Hunt",
  },
  taglineMax: { en: "Tagline (60 char max)", "zh-CN": "Tagline（最多 60 字符）" },
  galleryExport: { en: "Gallery export", "zh-CN": "Gallery 导出" },
  galleryExportBody: {
    en: "The gallery frames above are landscape posters (caption beside a real iOS capture). Export each at 1270x760 (Product Hunt gallery). First frame is the thumbnail — keep its caption benefit-led and high-contrast.",
    "zh-CN":
      "上方 gallery 是横版海报，真实 iOS 截图旁边配一句利益点文案。每张导出为 1270x760（Product Hunt gallery）。第一张会作为缩略图，标题要清楚、利益点明确、对比强。",
  },
  supporterCommentDrafts: { en: "Supporter comment drafts", "zh-CN": "Supporter 评论草稿" },
  launchShareCopy: { en: "Launch share copy", "zh-CN": "Launch 分享文案" },
} as const;

const links: Array<{ label: Localized<string>; value: Localized<string> }> = [
  { label: { en: "Website", "zh-CN": "官网" }, value: "inpomo.app" },
  {
    label: { en: "Positioning", "zh-CN": "定位" },
    value: {
      en: "AI-agent workflow timer for vibe coders",
      "zh-CN": "给 vibe coder 的 AI Agent 工作流计时器",
    },
  },
  {
    label: { en: "App Store", "zh-CN": "App Store" },
    value: { en: "inpomo.app (link once live)", "zh-CN": "inpomo.app（上线后替换为正式链接）" },
  },
  { label: { en: "Privacy", "zh-CN": "隐私" }, value: "inpomo.app/privacy" },
  { label: { en: "Support", "zh-CN": "支持" }, value: "inpomo.app/support" },
];

const supporterComments: Localized<CommentDraft[]> = {
  en: [
    {
      title: "AI babysitting",
      copy: "The AI-babysitting framing is painfully accurate. I often start Claude Code or Codex and then waste the whole block watching logs. Giving the agent the long timer and the human a short handoff window makes a lot of sense.",
    },
    {
      title: "Inverted Pomodoro",
      copy: "Classic Pomodoro is built for human execution, but AI coding agents changed the loop. Inpomo feels like the right inversion: start the agent, leave, come back only when a decision or review is needed.",
    },
    {
      title: "Prompt parking",
      copy: "The Prompts tab is a small but useful detail. When I walk away from an agent run, ideas still show up. Parking them without falling back into the log is exactly the behavior I want.",
    },
    {
      title: "Private by design",
      copy: "No account, no cloud, no tracking is the right call for this kind of utility. A focus timer and prompt scratchpad should not need a SaaS backend.",
    },
    {
      title: "Overripe time",
      copy: "Tracking overripe time is clever. It turns the bad habit into something visible: every extra minute spent hovering over the agent becomes a signal you can improve.",
    },
    {
      title: "Desktop + mobile",
      copy: "The iPhone plus desktop tray direction fits the workflow. I want the timer close enough to pull me back, but not another tab that keeps me staring at the work.",
    },
    {
      title: "Agent-era productivity",
      copy: "A lot of productivity tools still assume the human is doing the work. Inpomo starts from the new reality: the AI is often executing, and the human needs a better review cadence.",
    },
    {
      title: "Question",
      copy: "Congrats on the launch. Curious what ratio works best for people so far: 25 minutes agent / 5 minutes human, or something much longer?",
    },
  ],
  "zh-CN": [
    {
      title: "AI 陪跑",
      copy: "AI 陪跑这个说法太准确了。我也经常启动 Claude Code 或 Codex，然后把整段时间浪费在盯日志上。把长工作块交给 agent，把短交接窗口留给人类，这个思路很合理。",
    },
    {
      title: "反向番茄钟",
      copy: "传统番茄钟是为人类执行任务设计的，但 AI 编程 agent 改变了工作循环。Inpomo 像是正确的反转：启动 agent，离开，只有需要判断或 review 时再回来。",
    },
    {
      title: "Prompt 暂存",
      copy: "Prompts tab 是个小但很有用的细节。离开 agent run 的时候，想法还是会冒出来。能先记下它，而不是重新打开日志继续盯着，这正是我需要的行为。",
    },
    {
      title: "隐私优先",
      copy: "无账号、无云、无追踪很适合这种工具。一个专注计时器和 prompt 草稿板，不应该非要接一个 SaaS 后端。",
    },
    {
      title: "Overripe time",
      copy: "记录 overripe time 很聪明。它把坏习惯变得可见：每一分钟多余的盯屏时间，都会变成可以改进的信号。",
    },
    {
      title: "桌面 + 手机",
      copy: "iPhone 加桌面托盘的方向很贴合这个工作流。计时器要足够近，能把我叫回来，但又不应该变成另一个让我一直盯着的标签页。",
    },
    {
      title: "Agent 时代的效率工具",
      copy: "很多效率工具还默认人类在执行任务。Inpomo 从新的现实出发：AI 经常在执行，人类需要的是更好的 review 节奏。",
    },
    {
      title: "问题",
      copy: "恭喜发布。很好奇目前大家用下来什么比例最顺：25 分钟 agent / 5 分钟人类，还是更长的 agent block？",
    },
  ],
};

const launchShareDrafts: Localized<ShareDraft[]> = {
  en: [
    {
      channel: "X thread",
      title: "Founder launch thread",
      copy: `I kept catching myself babysitting AI coding agents.

Start Claude Code.
Watch the log.
Refresh the terminal.
Pretend I was "supervising."

So I built Inpomo: the inverted Pomodoro for vibe coders.

Classic Pomodoro gives the human a work block.
Inpomo gives the agent the work block.

You give the agent a task, start a tomato, swipe the app away, and an alarm-style notification pulls you back when a human is actually needed.

While away, you can park quick ideas in the Prompts tab without falling back into log-watching.

No account. No cloud. No tracking. Everything stays on device.

The goal is simple: stop hovering over AI work, and build a healthier handoff rhythm.`,
    },
    {
      channel: "LinkedIn",
      title: "Professional launch post",
      copy: `We are preparing Inpomo, an inverted Pomodoro timer for people working with AI coding agents.

The traditional Pomodoro assumes the human is doing the work. But with Claude Code, Codex, Cursor, and other coding agents, the human often assigns work, waits, reviews, and gives the next instruction.

Inpomo is designed around that loop.

The agent gets the longer work block. The human gets a short handoff window. The app uses an alarm-style local notification to bring you back when a review or next prompt is needed.

It also includes a simple Prompts tab for parking ideas while away from the desk.

Inpomo is fully local: no account, no cloud, no tracking.`,
    },
    {
      channel: "Community",
      title: "Short forum post",
      copy: `I built Inpomo because I kept babysitting AI coding agents instead of stepping away.

It is an inverted Pomodoro:
- agent gets the long work block
- human gets a short handoff window
- alarm-style notification pulls you back
- Prompts tab parks ideas while you are away
- no account, no cloud, no tracking

Would love to hear what AI/human timing ratios work for others.`,
    },
    {
      channel: "WeChat",
      title: "中文介绍",
      copy: `我们在准备 Inpomo 的 Product Hunt 页面。

一句话：Inpomo 是给 vibe coder 用的「反向番茄钟」。

传统番茄钟是人类工作 25 分钟，休息 5 分钟。
但现在很多时候是 Claude Code / Codex / Cursor 在跑任务，人类反而在旁边盯日志、刷终端、假装自己在监督。

Inpomo 把这个节奏反过来：
- AI agent 拿走长工作块
- 人类只保留短交接窗口
- 时间到后用闹钟式本地通知把你叫回来
- 离开期间有 Prompts tab 可以随手记想法
- 无账号、无云、无追踪，数据都在本地

目标不是让你更久地盯屏幕，而是帮你真的离开屏幕。`,
    },
  ],
  "zh-CN": [
    {
      channel: "X thread",
      title: "Founder launch thread",
      copy: `我发现自己总是在陪跑 AI 编程 agent。

启动 Claude Code。
盯着日志。
刷新终端。
假装自己在“监督”。

所以我做了 Inpomo：给 vibe coder 用的反向番茄钟。

传统番茄钟把工作块给人类。
Inpomo 把工作块给 agent。

你给 agent 一个任务，开始一个 tomato，划走 app。等真正需要人类判断、review 或继续提示时，闹钟式通知再把你叫回来。

离开期间，如果突然想到 prompt，可以先放进 Prompts tab，不用重新打开日志。

无账号。无云。无追踪。所有数据都在本机。

目标很简单：停止盯着 AI 工作，建立更健康的人机交接节奏。`,
    },
    {
      channel: "LinkedIn",
      title: "Professional launch post",
      copy: `我们正在准备 Inpomo，一个为 AI 编程 agent 工作流设计的反向番茄钟。

传统番茄钟默认人类在执行任务。但在 Claude Code、Codex、Cursor 等工具出现之后，人类经常是在分配任务、等待、review，然后给出下一条指令。

Inpomo 就是围绕这个循环设计的。

agent 获得更长的工作块，人类保留更短的交接窗口。app 会用闹钟式本地通知，把你在需要 review 或下一个 prompt 时叫回来。

它还带一个简单的 Prompts tab，用来在离开桌面时暂存想法。

Inpomo 完全本地：无账号、无云、无追踪。`,
    },
    {
      channel: "Community",
      title: "Short forum post",
      copy: `我做 Inpomo，是因为我发现自己经常在陪跑 AI 编程 agent，而不是真的离开屏幕。

它是一个反向番茄钟：
- agent 拿走长工作块
- 人类只保留短交接窗口
- 闹钟式通知把你叫回来
- Prompts tab 用来暂存离开期间冒出来的想法
- 无账号、无云、无追踪

很想听听大家在 AI / human 协作里，什么时间比例最顺手。`,
    },
    {
      channel: "WeChat",
      title: "中文介绍",
      copy: `我们在准备 Inpomo 的 Product Hunt 页面。

一句话：Inpomo 是给 vibe coder 用的「反向番茄钟」。

传统番茄钟是人类工作 25 分钟，休息 5 分钟。
但现在很多时候是 Claude Code / Codex / Cursor 在跑任务，人类反而在旁边盯日志、刷终端、假装自己在监督。

Inpomo 把这个节奏反过来：
- AI agent 拿走长工作块
- 人类只保留短交接窗口
- 时间到后用闹钟式本地通知把你叫回来
- 离开期间有 Prompts tab 可以随手记想法
- 无账号、无云、无追踪，数据都在本地

目标不是让你更久地盯屏幕，而是帮你真的离开屏幕。`,
    },
  ],
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      className="copy-button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy"}
      title={copied ? "Copied" : "Copy"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function CopyBlock({ children, value }: { children: ReactNode; value: string }) {
  return (
    <div className="copy-block-with-action">
      <CopyButton value={value} />
      <div className="copy-block">{children}</div>
    </div>
  );
}

function AppIcon() {
  return (
    <img
      className="ph-icon"
      src="/public-inpomo/assets/icons/app-store-icon.png"
      alt="Inpomo app icon"
    />
  );
}

export default function InpomoProductHunt() {
  const locale = useGtmLocale();
  const t = (value: Localized<string>) => pickLocale(value, locale) ?? "";
  const copy = {
    title: t(phCopy.title),
    tagline: t(phCopy.tagline),
    shortDescription: t(phCopy.shortDescription),
    description: t(phCopy.description),
    firstComment: t(phCopy.firstComment),
  };
  const categories = pickLocale(uiCopy.categories, locale) ?? [];
  const localizedSupporterComments = pickLocale(supporterComments, locale) ?? [];
  const localizedLaunchShareDrafts = pickLocale(launchShareDrafts, locale) ?? [];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
                <AppIcon />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                {copy.title}
              </h1>
              <p className="mb-2 text-base text-muted-foreground">{copy.tagline}</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">5.0</span>
                </div>
                <span className="text-sm text-muted-foreground">{t(uiCopy.launchKit)}</span>
                <span className="text-sm text-muted-foreground">{t(uiCopy.aiWorkflow)}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:w-auto">
            <Link
              href="https://inpomo.app"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              {t(uiCopy.visitWebsite)}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/launch-pages/inpomo/appstore"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
            >
              {t(uiCopy.appStoreKit)}
            </Link>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          {categories.map((category, index) => (
            <span key={category} className="contents">
              {index > 0 && <span>·</span>}
              <span>{category}</span>
            </span>
          ))}
        </div>

        <div className="mb-8">
          <div className="space-y-3 text-base leading-relaxed text-foreground">
            <p>{t(uiCopy.introOne)}</p>
            <p>{t(uiCopy.introTwo)}</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground"
          >
            {t(uiCopy.overview)}
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(uiCopy.launches)} <span className="ml-1">1</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(uiCopy.reviews)} <span className="ml-1">0</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(uiCopy.alternatives)}
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(uiCopy.customers)}
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(uiCopy.more)}
          </button>
        </div>

        <div className="mb-8">
          <div className="ph-gallery">
            {phGalleryFrames.map((frame, i) => {
              const cap = captions[i];
              const captionTitle = cap ? t(cap.title) : "Inpomo screen";
              return (
                <div
                  className={`ph-shot ${frame.variant}${frame.rev ? " rev" : ""}`}
                  key={frame.src}
                >
                  <div className="ph-shot-cap">
                    <p className="ph-shot-eyebrow">{cap ? t(cap.eyebrow) : ""}</p>
                    <p className="ph-shot-title">{captionTitle}</p>
                  </div>
                  <div className="ph-shot-device">
                    <img src={frame.src} alt={captionTitle} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground">{t(uiCopy.makerFirstComment)}</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {copy.firstComment}
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">{t(uiCopy.listingCopy)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(uiCopy.listingHelp)}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CopyBlock value={copy.title}>
              <strong>{t(uiCopy.title)}</strong>
              <span>{copy.title}</span>
            </CopyBlock>
            <CopyBlock value={copy.tagline}>
              <strong>{t(uiCopy.tagline)}</strong>
              <span>{copy.tagline}</span>
            </CopyBlock>
            <div className="lg:col-span-2">
              <CopyBlock value={copy.shortDescription}>
                <strong>{t(uiCopy.shortDescription)}</strong>
                <span>{copy.shortDescription}</span>
              </CopyBlock>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {t(uiCopy.supporterCommentDrafts)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(uiCopy.commentDraftsHelp)}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localizedSupporterComments.map((draft) => (
              <CopyBlock key={draft.title} value={draft.copy}>
                <strong>{draft.title}</strong>
                <span>{draft.copy}</span>
              </CopyBlock>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">{t(uiCopy.launchShareCopy)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(uiCopy.launchShareHelp)}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {localizedLaunchShareDrafts.map((draft) => (
              <CopyBlock key={draft.title} value={draft.copy}>
                <strong>
                  {draft.channel} · {draft.title}
                </strong>
                <span>{draft.copy}</span>
              </CopyBlock>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">{t(uiCopy.companyInfo)}</h2>
          <div className="space-y-3">
            {links.map((link) => (
              <div key={t(link.label)}>
                <div className="mb-1 text-xs text-muted-foreground">{t(link.label)}</div>
                <div className="text-sm text-foreground">{t(link.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
