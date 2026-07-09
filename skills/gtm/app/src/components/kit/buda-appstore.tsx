import { ChevronRight, Grid2x2, ShieldCheck, Square, Star, UploadCloud } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { useGtmLocale } from "../../data";
import Link from "../../next-link-shim";
import "./inpomo-kit.css";

type StoreLocale = "en" | "zh-Hans" | "ja" | "ko";
type DeviceType = "iphone" | "ipad";

const storeLocales: Array<{ id: StoreLocale; label: string; appStoreName: string }> = [
  { id: "en", label: "English", appStoreName: "English" },
  { id: "zh-Hans", label: "简体中文", appStoreName: "Chinese, Simplified" },
  { id: "ja", label: "日本語", appStoreName: "Japanese" },
  { id: "ko", label: "한국어", appStoreName: "Korean" },
];

function toStoreLocale(locale: string): StoreLocale {
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("zh")) return "zh-Hans";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";
  return "en";
}

const STORE_LOCALE_KEY = "buda-appstore-locale";

function getInitialStoreLocale(gtmLocale: string): StoreLocale {
  if (typeof window === "undefined") return toStoreLocale(gtmLocale);

  const queryLocale = new URLSearchParams(window.location.search).get("locale");
  if (queryLocale) return toStoreLocale(queryLocale);

  const storedLocale = window.localStorage.getItem(STORE_LOCALE_KEY);
  if (storedLocale) return toStoreLocale(storedLocale);

  return toStoreLocale(window.navigator.language || gtmLocale);
}

function getInitialDevice(): DeviceType {
  if (typeof window === "undefined") return "iphone";
  return new URLSearchParams(window.location.search).get("device") === "ipad" ? "ipad" : "iphone";
}

type PosterVariant = "v-primary" | "v-accent" | "v-dark" | "v-cream";

const posterFrames: Array<{
  src: string;
  ipadSrc?: string;
  alt: string;
  variant: PosterVariant;
  deviceStyle?: CSSProperties;
  ipadDeviceStyle?: CSSProperties;
  imageStyle?: CSSProperties;
  ipadImageStyle?: CSSProperties;
}> = [
  {
    src: "/public-buda/assets/appstore/mobile/01-agent-detail-en.png",
    ipadSrc: "/public-buda/assets/appstore/ipad/01-agent-detail-en.png",
    alt: "Buda mobile agent detail screen",
    variant: "v-primary",
    imageStyle: {
      objectPosition: "50% top",
      transform: "scale(1.06)",
      transformOrigin: "50% top",
    },
    ipadImageStyle: {
      objectPosition: "50% top",
      transform: "scale(1)",
      transformOrigin: "50% top",
    },
  },
  {
    src: "/public-buda/assets/appstore/mobile/02-mobile-drawer-en.png",
    ipadSrc: "/public-buda/assets/appstore/ipad/02-mobile-drawer-en.png",
    alt: "Buda mobile workspace drawer",
    variant: "v-primary",
    imageStyle: { objectPosition: "left top" },
  },
  {
    src: "/public-buda/assets/appstore/mobile/01-agent-detail-en.png",
    ipadSrc: "/public-buda/assets/appstore/ipad/01-agent-detail-en.png",
    alt: "Buda mobile cited files and next steps",
    variant: "v-primary",
    deviceStyle: { top: "30%", width: "82%", height: "71%" },
    ipadDeviceStyle: { top: "34%", width: "72%", height: "68%" },
    imageStyle: {
      objectPosition: "50% 58%",
      transform: "scale(1.08)",
      transformOrigin: "50% 45%",
    },
    ipadImageStyle: {
      objectPosition: "50% 24%",
      transform: "scale(1)",
      transformOrigin: "50% 24%",
    },
  },
  {
    src: "/public-buda/assets/appstore/mobile/02-mobile-drawer-en.png",
    ipadSrc: "/public-buda/assets/appstore/ipad/02-mobile-drawer-en.png",
    alt: "Buda mobile task and session navigation",
    variant: "v-primary",
    deviceStyle: { top: "30%", width: "80%", height: "71%" },
    ipadDeviceStyle: { top: "34%", width: "72%", height: "68%" },
    imageStyle: { objectPosition: "left top" },
    ipadImageStyle: { objectPosition: "left top" },
  },
  {
    src: "/public-buda/assets/appstore/mobile/03-auth-preview-en.png",
    ipadSrc: "/public-buda/assets/appstore/ipad/03-auth-preview-en.png",
    alt: "Buda mobile authentication preview screen",
    variant: "v-primary",
    deviceStyle: { top: "29%", height: "73%", width: "74%" },
    ipadDeviceStyle: { top: "34%", height: "68%", width: "72%" },
    imageStyle: {
      objectPosition: "50% top",
      transform: "scale(1.04)",
      transformOrigin: "50% top",
    },
  },
];

interface PosterCaption {
  eyebrow: string;
  title: string;
}

interface AppStoreListing {
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

interface InformationRow {
  label: string;
  value: string;
}

interface AppStoreUiCopy {
  kicker: string;
  productHuntKit: string;
  previewLanguageLabel: string;
  deviceTypeLabel: string;
  get: string;
  noIap: string;
  noRatings: string;
  beFirst: string;
  age: string;
  yearsOld: string;
  category: string;
  categoryValue: string;
  developer: string;
  languages: string;
  price: string;
  free: string;
  developerRole: string;
  whatsNew: string;
  versionHistory: string;
  version: string;
  new: string;
  privacyTitle: string;
  privacyIntro: string;
  dataLinked: string;
  information: string;
  informationRows: InformationRow[];
  developerWebsite: string;
  privacyPolicy: string;
  submissionNote: string;
  screenshotExportTitle: string;
  screenshotExportLines: string[];
  appNameLabel: string;
  subtitleLabel: string;
  promotionalTextLabel: string;
  keywordsLabel: string;
  reviewNotesTitle: string;
  reviewNotes: string;
  encryptionTitle: string;
  encryptionNote: string;
  screenshotSpecsTitle: string;
  screenshotSpec: string;
}

const appStoreCopy: Record<StoreLocale, AppStoreListing> = {
  en: {
    appName: "Buda: Agents as a Company",
    subtitle: "AI agents that run your company",
    promotionalText:
      "Recruit cloud AI agents, coordinate work with Organizer, and inspect execution across Drive, browser, terminal, and Git.",
    keywords:
      "ai agent,agents,workspace,automation,cloud agent,productivity,copilot,claws,assistant,workflow",
    description: `Buda is a cloud-native AI agent workspace where you recruit, run, and scale teams of AI agents that actually do the work.

Instead of babysitting a local coding agent on one machine, Buda gives every Claw an isolated cloud runtime, persistent Drive memory, reviewable execution, and a shared workspace.

HOW IT WORKS
• Recruit a Claw for the workflow you want to run.
• Organizer coordinates the task, files, memory, and next steps.
• Watch reviewable execution across Drive, browser, terminal, and Git.
• Keep useful work in memory so agents can continue from the last run.

WHY BUDA
• Cloud agents run in parallel without a dedicated Mac mini.
• Every task stays inspectable, not hidden behind a black-box chat.
• Drive gives agents durable project memory.
• Designed for sales, support, content, operations, code, and research.

PRIVACY
No third-party tracking. File access is user-authorized and account-scoped. Screenshots use anonymized product flows.`,
    whatsNew: `First App Store launch kit.
• Mobile workspace for watching Buda agents work.
• Agent detail, workspace navigation, and secure sign-in flows.
• Localized listing copy for English, Simplified Chinese, Japanese, and Korean.`,
    posters: [
      { eyebrow: "Agents as a company", title: "Recruit Claws that execute." },
      { eyebrow: "Cloud workspace", title: "Track agent work from anywhere." },
      { eyebrow: "Context included", title: "Every answer cites the working files." },
      { eyebrow: "Work queues", title: "See tasks waiting for your response." },
      { eyebrow: "Secure access", title: "Preview secure sign-in." },
    ],
    languagesValue: "EN, 简中, 日, 한",
    privacySub:
      "Buda does not use third-party tracking. Files and workspaces are account-scoped, and access is controlled by the user.",
  },
  "zh-Hans": {
    appName: "Buda：用 Agents 开公司",
    subtitle: "真正把事情做完的 AI 智能体",
    promotionalText:
      "招募云端 AI agents，由 Organizer 协调任务，并在 Drive、浏览器、终端和 Git 中检查执行过程。",
    keywords: "ai agent,智能体,工作台,自动化,云端agent,效率,copilot,claws,助手,workflow",
    description: `Buda 是云原生 AI Agent 工作台，让你招募、运行并扩展一支真正干活的智能体团队。

它不是让你在一台电脑前一直盯着本地 agent，而是让每个 Claw 拥有隔离的云端运行环境、持久 Drive 记忆、可复盘的执行记录和共享工作空间。

如何运作
• 为你要运行的 workflow 招募一个 Claw。
• Organizer 统一协调任务、文件、记忆和下一步。
• 在 Drive、浏览器、终端和 Git 中查看可复盘的执行过程。
• 把有用的工作沉淀到记忆里，让 agent 能接着上次继续。

为什么是 Buda
• 云端 agents 可并行运行，不需要专门的 Mac mini。
• 每个任务都可检查，而不是藏在黑盒聊天里。
• Drive 给 agents 持久项目记忆。
• 适合销售、客服、内容、运营、代码和研究工作。

隐私
无第三方追踪。文件访问由用户授权，并限定在账号范围内。截图使用匿名化产品流程。`,
    whatsNew: `首个 App Store launch kit。
• 用手机查看 Buda agents 的执行状态。
• Agent 详情、工作区导航与安全登录流程。
• 已准备英文、简体中文、日文和韩文 listing copy。`,
    posters: [
      { eyebrow: "用 Agents 开公司", title: "招募真正执行的 Claws。" },
      { eyebrow: "云端工作台", title: "随时查看 agent 工作。" },
      { eyebrow: "带上上下文", title: "每次回复都引用工作文件。" },
      { eyebrow: "任务队列", title: "一眼看到等待你回复的任务。" },
      { eyebrow: "安全访问", title: "预览安全登录。" },
    ],
    languagesValue: "英、简中、日、韩",
    privacySub: "Buda 不使用第三方追踪。文件与工作区限定在账号范围内，访问由用户控制。",
  },
  ja: {
    appName: "Buda: Agents as a Company",
    subtitle: "会社を動かす AI エージェント",
    promotionalText:
      "クラウド AI エージェントを採用し、Organizer が作業を調整。Drive、ブラウザ、ターミナル、Git で実行を確認できます。",
    keywords:
      "ai agent,エージェント,workspace,automation,cloud agent,productivity,copilot,claws,assistant,workflow",
    description: `Buda は、実際に仕事を進める AI エージェントチームを採用、実行、拡張するためのクラウドネイティブなワークスペースです。

1台のマシンでローカルエージェントを見守る代わりに、Buda は各 Claw に隔離されたクラウド実行環境、永続的な Drive メモリ、レビュー可能な実行記録、共有ワークスペースを提供します。

仕組み
• 実行したいワークフローに合わせて Claw を採用。
• Organizer がタスク、ファイル、メモリ、次の一手を調整。
• Drive、ブラウザ、ターミナル、Git での実行をレビュー可能な形で確認。
• 有用な作業をメモリに残し、次回も続きから進めます。

Buda を選ぶ理由
• 専用 Mac mini なしでクラウドエージェントを並列実行。
• 各タスクはブラックボックスではなく、確認可能な実行として残ります。
• Drive がエージェントに永続的なプロジェクトメモリを提供。
• 営業、サポート、コンテンツ、運用、コード、リサーチに対応。

プライバシー
第三者トラッキングなし。ファイルアクセスはユーザー許可とアカウント範囲に限定。スクリーンショットは匿名化された製品フローを使用しています。`,
    whatsNew: `初回 App Store 公開キット。
• モバイルワークスペースで Buda エージェントの作業を確認。
• エージェント詳細、ワークスペースナビゲーション、安全なサインインフロー。
• 英語、簡体字中国語、日本語、韓国語の掲載文を準備。`,
    posters: [
      { eyebrow: "エージェントで会社を動かす", title: "実行する Claws を採用。" },
      { eyebrow: "クラウドワークスペース", title: "どこからでも作業を確認。" },
      { eyebrow: "コンテキスト込み", title: "回答は作業ファイルを参照。" },
      { eyebrow: "作業キュー", title: "返信待ちのタスクを確認。" },
      { eyebrow: "安全なアクセス", title: "安全なサインインを確認。" },
    ],
    languagesValue: "英・簡体中・日・韓",
    privacySub:
      "Buda は第三者トラッキングを使用しません。ファイルと workspace はアカウント範囲に限定され、アクセスはユーザーが管理します。",
  },
  ko: {
    appName: "Buda: Agents as a Company",
    subtitle: "회사를 운영하는 AI 에이전트",
    promotionalText:
      "클라우드 AI 에이전트를 채용하고 Organizer로 작업을 조율하세요. Drive, 브라우저, 터미널, Git에서 실행을 확인할 수 있습니다.",
    keywords:
      "ai agent,에이전트,workspace,automation,cloud agent,productivity,copilot,claws,assistant,workflow",
    description: `Buda는 실제 업무를 수행하는 AI 에이전트 팀을 채용, 실행, 확장하는 클라우드 네이티브 워크스페이스입니다.

한 대의 로컬 머신에서 에이전트를 지켜보는 대신, Buda는 각 Claw에 격리된 클라우드 실행 환경, 영구 Drive 메모리, 검토 가능한 실행 기록, 공유 워크스페이스를 제공합니다.

작동 방식
• 실행할 워크플로에 맞는 Claw를 채용합니다.
• Organizer가 작업, 파일, 메모리, 다음 단계를 조율합니다.
• Drive, 브라우저, 터미널, Git에서 검토 가능한 실행 과정을 확인합니다.
• 유용한 작업은 메모리에 남겨 다음 실행에서 이어갑니다.

Buda를 선택하는 이유
• 전용 Mac mini 없이 클라우드 에이전트가 병렬 실행됩니다.
• 모든 작업은 블랙박스 채팅이 아니라 검사 가능한 실행으로 남습니다.
• Drive가 에이전트에 지속적인 프로젝트 메모리를 제공합니다.
• 영업, 지원, 콘텐츠, 운영, 코드, 리서치 업무에 적합합니다.

개인정보 보호
타사 추적 없음. 파일 접근은 사용자 승인 및 계정 범위로 제한됩니다. 스크린샷은 익명화된 제품 흐름을 사용합니다.`,
    whatsNew: `첫 App Store 출시 키트.
• 모바일 워크스페이스에서 Buda 에이전트의 작업을 확인합니다.
• 에이전트 상세, 워크스페이스 탐색, 안전한 로그인 흐름.
• 영어, 중국어 간체, 일본어, 한국어 등록 문구 준비.`,
    posters: [
      { eyebrow: "에이전트로 회사를 운영", title: "실행하는 Claws를 채용하세요." },
      { eyebrow: "클라우드 워크스페이스", title: "어디서든 작업을 확인." },
      { eyebrow: "컨텍스트 포함", title: "답변마다 작업 파일을 함께 확인." },
      { eyebrow: "작업 대기열", title: "응답 대기 작업을 한눈에 확인." },
      { eyebrow: "안전한 접근", title: "보안 로그인을 미리 확인." },
    ],
    languagesValue: "영·간체·일·한",
    privacySub:
      "Buda는 타사 추적을 사용하지 않습니다. 파일과 workspace는 계정 범위로 제한되며 접근은 사용자가 제어합니다.",
  },
};

const appStoreUiCopy: Record<StoreLocale, AppStoreUiCopy> = {
  en: {
    kicker: "Launch kit · App Store preview",
    productHuntKit: "Product Hunt kit",
    previewLanguageLabel: "Preview language",
    deviceTypeLabel: "Device type",
    get: "Get",
    noIap: "No In-App Purchases",
    noRatings: "No Ratings",
    beFirst: "Be the first",
    age: "Age",
    yearsOld: "Years Old",
    category: "Category",
    categoryValue: "Productivity",
    developer: "Developer",
    languages: "Languages",
    price: "Price",
    free: "Free",
    developerRole: "Developer",
    whatsNew: "What's New",
    versionHistory: "Version History",
    version: "Version 1.0",
    new: "New",
    privacyTitle: "App Privacy",
    privacyIntro:
      "The developer, Buda, indicated that the app's privacy practices may include handling of data as described below.",
    dataLinked: "Data Linked to You",
    information: "Information",
    informationRows: [
      { label: "Seller", value: "Buda" },
      { label: "Size", value: "42 MB" },
      { label: "Category", value: "Productivity" },
      { label: "Compatibility", value: "iPhone and iPad — Requires iOS 17.0 or later" },
      { label: "Languages", value: "English, 简体中文, 日本語, 한국어" },
      { label: "Age Rating", value: "4+" },
      { label: "Copyright", value: "© 2026 Buda" },
      { label: "Price", value: "Free" },
    ],
    developerWebsite: "Developer Website",
    privacyPolicy: "Privacy Policy",
    submissionNote: "Submission notes · not shown on the App Store",
    screenshotExportTitle: "Screenshot export",
    screenshotExportLines: [
      "Toggle iPhone / iPad above to preview each format. Export sizes:",
      'iPhone 6.9" — 1290x2796 portrait',
      'iPad 13" — 2064x2752 portrait',
      "The first frame should explain Buda in one glance: agents as a company, not a chat app.",
    ],
    appNameLabel: "App name (30 char max)",
    subtitleLabel: "Subtitle (30 char max)",
    promotionalTextLabel: "Promotional text (170 char max)",
    keywordsLabel: "Keywords (100 char max)",
    reviewNotesTitle: "App Review notes",
    reviewNotes:
      "Buda is a cloud AI agent workspace. Reviewers can sign in with a test account to inspect the mobile workspace, agent detail, workspace navigation, and secure authentication flow. The screenshots use anonymized product data.",
    encryptionTitle: "Encryption",
    encryptionNote:
      "Exempt — uses only standard OS encryption (ITSAppUsesNonExemptEncryption = false).",
    screenshotSpecsTitle: "Screenshot specs",
    screenshotSpec:
      'Primary submission sets: iPhone 6.9" at 1290x2796 and iPad 13" at 2064x2752. Bundle ID com.buda.app · Primary category Productivity.',
  },
  "zh-Hans": {
    kicker: "Launch kit · App Store 预览",
    productHuntKit: "Product Hunt 套件",
    previewLanguageLabel: "预览语言",
    deviceTypeLabel: "设备类型",
    get: "获取",
    noIap: "无 App 内购买",
    noRatings: "暂无评分",
    beFirst: "成为第一位评分用户",
    age: "年龄",
    yearsOld: "岁以上",
    category: "类别",
    categoryValue: "效率",
    developer: "开发者",
    languages: "语言",
    price: "价格",
    free: "免费",
    developerRole: "开发者",
    whatsNew: "新功能",
    versionHistory: "版本历史",
    version: "版本 1.0",
    new: "最新",
    privacyTitle: "App 隐私",
    privacyIntro: "开发者 Buda 表示，此 App 的隐私实践可能包括如下所述的数据处理。",
    dataLinked: "与你关联的数据",
    information: "信息",
    informationRows: [
      { label: "销售商", value: "Buda" },
      { label: "大小", value: "42 MB" },
      { label: "类别", value: "效率" },
      { label: "兼容性", value: "iPhone 和 iPad — 需要 iOS 17.0 或更高版本" },
      { label: "语言", value: "English, 简体中文, 日本語, 한국어" },
      { label: "年龄分级", value: "4+" },
      { label: "版权", value: "© 2026 Buda" },
      { label: "价格", value: "免费" },
    ],
    developerWebsite: "开发者网站",
    privacyPolicy: "隐私政策",
    submissionNote: "提交备注 · 不会显示在 App Store",
    screenshotExportTitle: "截图导出",
    screenshotExportLines: [
      "在上方切换 iPhone / iPad 预览各格式。导出尺寸：",
      "iPhone 6.9 英寸 — 1290x2796 竖版",
      "iPad 13 英寸 — 2064x2752 竖版",
      "第一张截图应让用户一眼理解 Buda：它是 agents as a company，而不是聊天 app。",
    ],
    appNameLabel: "App 名称（最多 30 字符）",
    subtitleLabel: "副标题（最多 30 字符）",
    promotionalTextLabel: "宣传文本（最多 170 字符）",
    keywordsLabel: "关键词（最多 100 字符）",
    reviewNotesTitle: "App 审核备注",
    reviewNotes:
      "Buda 是云端 AI agent 工作台。审核员可以使用测试账号登录，检查移动端工作台、agent 详情、工作区导航和安全认证流程。截图使用匿名化产品数据。",
    encryptionTitle: "加密",
    encryptionNote: "豁免 — 仅使用标准操作系统加密（ITSAppUsesNonExemptEncryption = false）。",
    screenshotSpecsTitle: "截图规格",
    screenshotSpec:
      "主要提交截图集：iPhone 6.9 英寸 1290x2796，iPad 13 英寸 2064x2752。Bundle ID com.buda.app · 主类别 效率。",
  },
  ja: {
    kicker: "Launch kit · App Store プレビュー",
    productHuntKit: "Product Hunt キット",
    previewLanguageLabel: "プレビュー言語",
    deviceTypeLabel: "デバイス種別",
    get: "入手",
    noIap: "App内課金なし",
    noRatings: "評価なし",
    beFirst: "最初の評価を投稿",
    age: "年齢",
    yearsOld: "歳以上",
    category: "カテゴリ",
    categoryValue: "仕事効率化",
    developer: "デベロッパ",
    languages: "言語",
    price: "価格",
    free: "無料",
    developerRole: "デベロッパ",
    whatsNew: "新機能",
    versionHistory: "バージョン履歴",
    version: "バージョン 1.0",
    new: "新規",
    privacyTitle: "Appのプライバシー",
    privacyIntro:
      "デベロッパである Buda は、このAppのプライバシー慣行として以下のデータの取り扱いが含まれる可能性があると示しています。",
    dataLinked: "ユーザーに関連付けられたデータ",
    information: "情報",
    informationRows: [
      { label: "販売元", value: "Buda" },
      { label: "サイズ", value: "42 MB" },
      { label: "カテゴリ", value: "仕事効率化" },
      { label: "互換性", value: "iPhoneおよびiPad — iOS 17.0以降が必要" },
      { label: "言語", value: "English, 简体中文, 日本語, 한국어" },
      { label: "年齢", value: "4+" },
      { label: "著作権", value: "© 2026 Buda" },
      { label: "価格", value: "無料" },
    ],
    developerWebsite: "デベロッパWebサイト",
    privacyPolicy: "プライバシーポリシー",
    submissionNote: "提出メモ · App Store には表示されません",
    screenshotExportTitle: "スクリーンショット書き出し",
    screenshotExportLines: [
      "上の iPhone / iPad を切り替えて各フォーマットをプレビューします。書き出しサイズ：",
      "iPhone 6.9インチ — 1290x2796 縦向き",
      "iPad 13インチ — 2064x2752 縦向き",
      "最初のフレームでは、Buda がチャットアプリではなく agents as a company であることを一目で伝えます。",
    ],
    appNameLabel: "App名（最大30文字）",
    subtitleLabel: "サブタイトル（最大30文字）",
    promotionalTextLabel: "プロモーションテキスト（最大170文字）",
    keywordsLabel: "キーワード（最大100文字）",
    reviewNotesTitle: "App Review メモ",
    reviewNotes:
      "Buda はクラウド AI agent workspace です。レビュアーはテストアカウントでログインし、モバイル workspace、agent detail、workspace navigation、secure authentication flow を確認できます。スクリーンショットは匿名化された product data を使用しています。",
    encryptionTitle: "暗号化",
    encryptionNote:
      "免除 — 標準のOS暗号化のみを使用します（ITSAppUsesNonExemptEncryption = false）。",
    screenshotSpecsTitle: "スクリーンショット仕様",
    screenshotSpec:
      "主要提出セット：iPhone 6.9インチは1290x2796、iPad 13インチは2064x2752。Bundle ID com.buda.app · Primary category Productivity.",
  },
  ko: {
    kicker: "Launch kit · App Store 미리보기",
    productHuntKit: "Product Hunt 키트",
    previewLanguageLabel: "미리보기 언어",
    deviceTypeLabel: "기기 유형",
    get: "받기",
    noIap: "앱 내 구입 없음",
    noRatings: "평가 없음",
    beFirst: "첫 평가를 남겨보세요",
    age: "연령",
    yearsOld: "세 이상",
    category: "카테고리",
    categoryValue: "생산성",
    developer: "개발자",
    languages: "언어",
    price: "가격",
    free: "무료",
    developerRole: "개발자",
    whatsNew: "새로운 기능",
    versionHistory: "버전 기록",
    version: "버전 1.0",
    new: "신규",
    privacyTitle: "앱 개인정보 보호",
    privacyIntro:
      "개발자 Buda는 이 앱의 개인정보 처리 방식에 아래와 같은 데이터 처리가 포함될 수 있다고 밝혔습니다.",
    dataLinked: "사용자에게 연결된 데이터",
    information: "정보",
    informationRows: [
      { label: "판매자", value: "Buda" },
      { label: "크기", value: "42 MB" },
      { label: "카테고리", value: "생산성" },
      { label: "호환성", value: "iPhone 및 iPad — iOS 17.0 이상 필요" },
      { label: "언어", value: "English, 简体中文, 日本語, 한국어" },
      { label: "연령 등급", value: "4+" },
      { label: "저작권", value: "© 2026 Buda" },
      { label: "가격", value: "무료" },
    ],
    developerWebsite: "개발자 웹사이트",
    privacyPolicy: "개인정보 처리방침",
    submissionNote: "제출 메모 · App Store에는 표시되지 않음",
    screenshotExportTitle: "스크린샷 내보내기",
    screenshotExportLines: [
      "위의 iPhone / iPad를 전환해 각 형식을 미리 봅니다. 내보내기 크기:",
      'iPhone 6.9" — 1290x2796 세로',
      'iPad 13" — 2064x2752 세로',
      "첫 프레임은 Buda가 채팅 앱이 아니라 agents as a company임을 한눈에 보여줘야 합니다.",
    ],
    appNameLabel: "앱 이름(최대 30자)",
    subtitleLabel: "부제(최대 30자)",
    promotionalTextLabel: "프로모션 텍스트(최대 170자)",
    keywordsLabel: "키워드(최대 100자)",
    reviewNotesTitle: "App Review 메모",
    reviewNotes:
      "Buda는 클라우드 AI agent workspace입니다. 리뷰어는 테스트 계정으로 로그인해 모바일 workspace, agent detail, workspace navigation, secure authentication flow를 확인할 수 있습니다. 스크린샷에는 익명화된 product data가 사용됩니다.",
    encryptionTitle: "암호화",
    encryptionNote: "면제 — 표준 OS 암호화만 사용합니다(ITSAppUsesNonExemptEncryption = false).",
    screenshotSpecsTitle: "스크린샷 사양",
    screenshotSpec:
      '기본 제출 세트: iPhone 6.9" 1290x2796, iPad 13" 2064x2752. Bundle ID com.buda.app · Primary category Productivity.',
  },
};

function AppIcon() {
  return (
    <img className="as-icon" src="/public-buda/assets/logos/logo-icon.svg" alt="Buda app icon" />
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

export default function BudaAppStore() {
  const gtmLocale = useGtmLocale();
  const [locale, setLocale] = useState<StoreLocale>(() => getInitialStoreLocale(gtmLocale));
  const [device, setDevice] = useState<DeviceType>(() => getInitialDevice());
  const listing = appStoreCopy[locale];
  const ui = appStoreUiCopy[locale];

  useEffect(() => {
    const queryLocale =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("locale")
        : null;
    const storedLocale =
      typeof window !== "undefined" ? window.localStorage.getItem(STORE_LOCALE_KEY) : null;
    if (!queryLocale && !storedLocale) {
      setLocale(toStoreLocale(gtmLocale));
    }
  }, [gtmLocale]);

  const handleLocaleChange = (nextLocale: StoreLocale) => {
    setLocale(nextLocale);
    try {
      window.localStorage.setItem(STORE_LOCALE_KEY, nextLocale);
    } catch {
      // localStorage unavailable - ignore
    }
  };

  return (
    <main className="as-page">
      <div className="as">
        <div className="as-kicker">
          <span className="eyebrow">{ui.kicker}</span>
          <Link href="/launch-pages/buda/producthunt" className="as-kicker-link">
            {ui.productHuntKit} <ChevronRight size={15} />
          </Link>
        </div>

        <div className="as-langs" role="group" aria-label={ui.previewLanguageLabel}>
          {storeLocales.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className={`as-lang${loc.id === locale ? " is-active" : ""}`}
              aria-pressed={loc.id === locale}
              onClick={() => handleLocaleChange(loc.id)}
            >
              {loc.label}
            </button>
          ))}
        </div>

        <header className="as-head">
          <AppIcon />
          <div className="as-head-body">
            <h1 className="as-name">{listing.appName}</h1>
            <p className="as-tagline">{listing.subtitle}</p>
            <span className="as-dev">Buda</span>
            <div className="as-actions">
              <div>
                <button type="button" className="as-get">
                  {ui.get}
                </button>
                <span className="as-iap">{ui.noIap}</span>
              </div>
              <span className="as-share" aria-hidden>
                <UploadCloud size={22} />
              </span>
            </div>
          </div>
        </header>

        <div className="as-info">
          <div className="as-info-item">
            <div className="as-info-cap">{ui.noRatings}</div>
            <div className="as-info-val">
              <Stars />
            </div>
            <div className="as-info-sub">{ui.beFirst}</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">{ui.age}</div>
            <div className="as-info-val">
              <span className="as-strong">4+</span>
            </div>
            <div className="as-info-sub">{ui.yearsOld}</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">{ui.category}</div>
            <div className="as-info-val">
              <Grid2x2 size={14} />
              <span className="as-strong">{ui.categoryValue}</span>
            </div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">{ui.developer}</div>
            <div className="as-info-val">
              <Square size={13} fill="currentColor" strokeWidth={0} />
              <span className="as-strong">Buda</span>
            </div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">{ui.languages}</div>
            <div className="as-info-val">
              <span className="as-strong">4</span>
            </div>
            <div className="as-info-sub">{listing.languagesValue}</div>
          </div>
          <div className="as-info-item">
            <div className="as-info-cap">{ui.price}</div>
            <div className="as-info-val">
              <span className="as-strong">{ui.free}</span>
            </div>
          </div>
        </div>

        <section className="as-section">
          <div
            className="as-langs"
            role="group"
            aria-label={ui.deviceTypeLabel}
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
              const deviceStyle = isIpad
                ? { ...frame.deviceStyle, ...frame.ipadDeviceStyle }
                : frame.deviceStyle;
              const imageStyle = isIpad
                ? { ...frame.imageStyle, ...frame.ipadImageStyle }
                : frame.imageStyle;
              return (
                <div
                  className={`poster buda-appstore-poster ${frame.variant}${isIpad ? " is-ipad" : ""}`}
                  key={`${frame.src}-${device}`}
                >
                  <div className="poster-cap">
                    <p className="poster-eyebrow">{cap?.eyebrow}</p>
                    <p className="poster-title">{cap?.title}</p>
                  </div>
                  <div className="poster-device" style={deviceStyle}>
                    <img
                      src={isIpad ? (frame.ipadSrc ?? frame.src) : frame.src}
                      alt={cap?.title ?? frame.alt}
                      style={imageStyle}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {device === "ipad" && (
            <p className="poster-hint">iPad Pro 13&quot; · 2064 x 2752 px · portrait</p>
          )}
          {device === "iphone" && <p className="poster-hint">iPhone 6.9&quot; · 1290 x 2796 px</p>}
        </section>

        <section className="as-section">
          <p className="as-text">{listing.description}</p>
          <p className="as-dev" style={{ marginTop: 16 }}>
            Buda
          </p>
          <span className="as-text" style={{ color: "var(--as-text-2)", fontSize: 13 }}>
            {ui.developerRole}
          </span>
        </section>

        <section className="as-section">
          <div className="as-section-head">
            <h2>{ui.whatsNew}</h2>
            <span className="as-more">{ui.versionHistory}</span>
          </div>
          <div className="as-version-row">
            <span>{ui.version}</span>
            <span>{ui.new}</span>
          </div>
          <p className="as-text">{listing.whatsNew}</p>
        </section>

        <section className="as-section">
          <div className="as-section-head">
            <h2>{ui.privacyTitle}</h2>
          </div>
          <p className="as-privacy-intro">{ui.privacyIntro}</p>
          <div className="as-privacy">
            <div className="as-privacy-lead">
              <ShieldCheck size={26} />
              <div>
                <div className="as-privacy-tag">{ui.dataLinked}</div>
                <p className="as-privacy-sub">{listing.privacySub}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="as-section">
          <div className="as-section-head">
            <h2>{ui.information}</h2>
          </div>
          <dl className="as-meta">
            {ui.informationRows.map((row) => (
              <div className="as-meta-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
            <div className="as-meta-row">
              <dt>{ui.developerWebsite}</dt>
              <dd>
                <span className="as-more">buda.im</span>
              </dd>
            </div>
            <div className="as-meta-row">
              <dt>{ui.privacyPolicy}</dt>
              <dd>
                <span className="as-more">buda.im/privacy</span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="as-appendix">
        <p className="as-appendix-note">{ui.submissionNote}</p>

        <h3>{ui.screenshotExportTitle}</h3>
        <div className="copy-block">
          {ui.screenshotExportLines.map((line, index) => (
            <span key={line}>
              {index === 1 || index === 2 ? (
                <>
                  <strong>{line.split(" — ")[0]}</strong> — {line.split(" — ")[1]}
                </>
              ) : (
                line
              )}
              {index < ui.screenshotExportLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </div>

        {storeLocales.map((loc) => {
          const localized = appStoreCopy[loc.id];
          return (
            <div key={loc.id} className="as-appendix-locale">
              <h3>
                {loc.label} · {loc.appStoreName}
              </h3>
              <div className="copy-block">
                <strong>{ui.appNameLabel}</strong>
                <br />
                {localized.appName}
              </div>
              <div className="copy-block">
                <strong>{ui.subtitleLabel}</strong>
                <br />
                {localized.subtitle}
              </div>
              <div className="copy-block">
                <strong>{ui.promotionalTextLabel}</strong>
                <br />
                {localized.promotionalText}
              </div>
              <div className="copy-block">
                <strong>{ui.keywordsLabel}</strong>
                <br />
                {localized.keywords}
              </div>
            </div>
          );
        })}

        <h3>{ui.reviewNotesTitle}</h3>
        <div className="copy-block">{ui.reviewNotes}</div>

        <h3>{ui.encryptionTitle}</h3>
        <div className="copy-block">{ui.encryptionNote}</div>

        <h3>{ui.screenshotSpecsTitle}</h3>
        <div className="copy-block">{ui.screenshotSpec}</div>
      </div>
    </main>
  );
}
