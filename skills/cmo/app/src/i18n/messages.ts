// UI chrome message catalog for the CMO console.
//
// Only UI chrome is translated here (nav, panels, buttons, Help & Settings).
// Domain/account data (campaign names, account ids, snapshots) is never
// translated. Default language mode is `Auto` (follows the browser); an explicit
// override lives in Help & Settings and persists to localStorage.

export type Lang = "en" | "zh";
export type LangMode = "auto" | Lang;

export const SUPPORTED_LANGS: { code: LangMode; label: string }[] = [
  { code: "auto", label: "Auto" },
  { code: "en", label: "English" },
  { code: "zh", label: "简体中文" },
];

type Catalog = Record<string, string>;

const en: Catalog = {
  "nav.overview": "Command Center",
  "nav.traffic": "Traffic",
  "nav.search": "Search",
  "nav.keywords": "Keywords",
  "nav.pages": "Landing Pages",
  "nav.geo": "GEO",
  "nav.ads": "Campaigns",
  "nav.ads-assets": "Ads Assets",
  "nav.ads-accounts": "Accounts",
  "nav.ads-runs": "Runs",
  "nav.integrations": "Integrations",
  "nav.settings": "Settings",
  "navGroup.ads": "Ads",
  "brand.summary": "{platforms} platforms · {accounts} accounts",
  "sidebar.collapse": "Collapse sidebar",
  "sidebar.expand": "Expand sidebar",
  "sidebar.openNav": "Open navigation",
  "sidebar.closeNav": "Close navigation",
  "attn.aria": "What needs your attention",
  "attn.primary": "Need a note or decision",
  "attn.primaryHint": "Review proposals that need a note or decision",
  "attn.readyForAgent": "Ready for agent",
  "attn.readyHint": "Approved and ready for the agent to act next",
  "attn.blocked": "Blocked",
  "attn.blockedHint": "Blocked — needs new info or configuration",
  "topbar.subtitle": "Traffic, search, keywords, landing pages, GEO, ads, and integrations.",
  "topbar.timeRange": "Time range",
  "footer.help": "Help & Settings",
  "footer.refresh": "Refresh",
  "help.title": "Help & Settings",
  "help.close": "Close",
  "help.workspace": "Workspace",
  "help.brand": "Brand",
  "help.dataProvider": "Data provider",
  "help.configSource": "Config source",
  "help.onboarding": "Onboarding",
  "help.completed": "Completed",
  "help.notCompleted": "Not completed",
  "help.agentTasks": "Agent tasks queued",
  "help.defaultLaunch": "Default launch",
  "help.accounts": "Accounts",
  "help.noAccounts": "No accounts configured.",
  "help.references": "References",
  "help.redditApi": "Reddit API",
  "help.postman": "Postman",
  "help.language": "Language",
  "help.secretsNote":
    "Secrets are never shown here. Tokens and client secrets stay in environment variables; only account ids and non-secret settings are summarized.",
};

const zh: Catalog = {
  "nav.overview": "指挥中心",
  "nav.traffic": "流量",
  "nav.search": "搜索",
  "nav.keywords": "关键词",
  "nav.pages": "落地页",
  "nav.geo": "GEO",
  "nav.ads": "广告系列",
  "nav.ads-assets": "广告素材",
  "nav.ads-accounts": "账户",
  "nav.ads-runs": "执行记录",
  "nav.integrations": "集成",
  "nav.settings": "设置",
  "navGroup.ads": "广告",
  "brand.summary": "{platforms} 个平台 · {accounts} 个账户",
  "sidebar.collapse": "折叠侧栏",
  "sidebar.expand": "展开侧栏",
  "sidebar.openNav": "打开导航",
  "sidebar.closeNav": "关闭导航",
  "attn.aria": "需要你处理的事项",
  "attn.primary": "需要备注或决定",
  "attn.primaryHint": "查看需要备注或决定的提案",
  "attn.readyForAgent": "待 agent 处理",
  "attn.readyHint": "已批准,等待 agent 执行下一步",
  "attn.blocked": "已阻塞",
  "attn.blockedHint": "已阻塞 —— 需要新信息或配置",
  "topbar.subtitle": "流量、搜索、关键词、落地页、GEO、广告与集成。",
  "topbar.timeRange": "时间范围",
  "footer.help": "帮助与设置",
  "footer.refresh": "刷新",
  "help.title": "帮助与设置",
  "help.close": "关闭",
  "help.workspace": "工作区",
  "help.brand": "品牌",
  "help.dataProvider": "数据源",
  "help.configSource": "配置来源",
  "help.onboarding": "引导",
  "help.completed": "已完成",
  "help.notCompleted": "未完成",
  "help.agentTasks": "排队的 agent 任务",
  "help.defaultLaunch": "默认投放状态",
  "help.accounts": "账户",
  "help.noAccounts": "尚未配置账户。",
  "help.references": "参考",
  "help.redditApi": "Reddit API",
  "help.postman": "Postman",
  "help.language": "语言",
  "help.secretsNote":
    "此处不显示任何密钥。令牌与 client secret 仅存放在环境变量中;这里只汇总账户 ID 和非敏感设置。",
};

export const messages: Record<Lang, Catalog> = { en, zh };

// Resolve the effective language from an explicit mode, falling back to the
// browser's languages for `auto`.
export function resolveLang(mode: LangMode, browserLangs: readonly string[] = []): Lang {
  if (mode === "en" || mode === "zh") return mode;
  const preferred = browserLangs.find((tag) => /^zh\b/i.test(tag) || /^en\b/i.test(tag));
  return preferred && /^zh\b/i.test(preferred) ? "zh" : "en";
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = messages[lang]?.[key] ?? messages.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
