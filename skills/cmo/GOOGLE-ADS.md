# Google Ads 自动化投放

Google Ads 自动化投放技能：覆盖 **YouTube 视频广告**（由 video MDX 驱动）和 **Google Search SEM 关键词广告**（由 Buda GTM ICP 数据驱动）。CMO 保留旧 `$ads` skill 的脚本名和配置约定，便于现有流程直接迁移。

---

## 两条投放线

| 投放线 | 配置来源 | 创建脚本 | 暂停脚本 |
|--------|---------|---------|---------|
| Search（SEM） | `apps/buda/src/domains/gtm/data/icps/<icp>.ts` 的 `sem` 块 | `create-sem-campaign.mjs` | `pause-sem-campaign.mjs` |
| Video（YouTube） | `apps/buda/content/videos/<lang>/*.mdx` 的 `ads` frontmatter | `create-video-campaign.mjs` | `pause-video-campaign.mjs` |

两条线共用 OAuth 凭证和 Google Ads 账号，共用 `lib/google-ads-client.mjs`。

兼容说明：
- 旧 `$ads` 的四个脚本名在 CMO 中仍可用：`create-sem-campaign.mjs`、`pause-sem-campaign.mjs`、`create-video-campaign.mjs`、`pause-video-campaign.mjs`。
- 新的显式 Google 脚本名也可用：`create-google-sem-campaign.mjs`、`pause-google-sem-campaign.mjs`、`create-google-video-campaign.mjs`、`pause-google-video-campaign.mjs`。
- SEM 状态写入 `.agents/skills/cmo/state/sem-state.json`。脚本读取时会兼容旧位置 `.agents/skills/ads/state/sem-state.json` 和 CMO 早期的 `app/.data/google-sem-state.json`。
- CMO 没有自己的 `config.local.json` 时，会读取 `.agents/skills/ads/config.local.json`，再读取 `~/Documents/sourcing/.agents/skills/ads/config.local.json` 作为旧配置 fallback；不要把真实账号 ID、access token 或 OAuth secret 写进提交。

---

## SEM（Google Search）关键词广告

### 配置来源：ICP 数据

每个 ICP 文件里已经包含 `sem` 块，Source of truth 在代码里：

```ts
// apps/buda/src/domains/gtm/data/icps/seo-marketer.ts
sem: {
  keywords: [
    { keyword: "ai seo agency tool", matchType: "phrase", maxCpc: 4.0 },
    { keyword: "jasper alternative", matchType: "phrase", maxCpc: 5.0, notes: "Jasper 迁移目标" },
    // ...
  ],
  negativeKeywords: ["free seo tool", "seo tutorial", ...],
  adCopy: {
    headlines: ["Run 20 Clients Like 1", "AI SEO Agency OS", ...],   // 最多 15 条，每条 ≤ 30 字符
    descriptions: ["One agent per client. ...", ...],                 // 最多 4 条，每条 ≤ 90 字符
    callToActions: ["Try Free", ...],
  },
}
```

Landing page 的解析优先级：
1. `icp.landingCopy.hero.primaryCta.href`（必须是 `https://` 开头的绝对 URL）
2. `icp.funnels[]` 中第一个绝对 URL
3. CLI `--landing-page` 覆盖

### 使用

```bash
# 列出可用 ICP（不带 --icp 参数时会提示）
node .agents/skills/cmo/scripts/create-sem-campaign.mjs

# 预览某个 ICP 的投放计划
node .agents/skills/cmo/scripts/create-sem-campaign.mjs --icp seo-marketer --dry-run

# 实际创建（默认 PAUSED 状态，需要在 Google Ads UI 里 review 后启用）
node .agents/skills/cmo/scripts/create-sem-campaign.mjs --icp seo-marketer

# 覆盖默认配置
node .agents/skills/cmo/scripts/create-sem-campaign.mjs \
  --icp seo-marketer \
  --daily-budget 20 \
  --regions US,TW,HK \
  --language en \
  --landing-page https://buda.app/seo

# 重新创建（已有 campaign 的情况下）
node .agents/skills/cmo/scripts/create-sem-campaign.mjs --icp seo-marketer --force

# 暂停
node .agents/skills/cmo/scripts/pause-sem-campaign.mjs --icp seo-marketer
node .agents/skills/cmo/scripts/pause-sem-campaign.mjs --campaign-id 12345678
```

### CLI 默认值

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--daily-budget` | `10` | 美元/日，最低 $1 |
| `--regions` | `US,TW,HK,SG` | ISO 国家码，见 `lib/google-ads-client.mjs` 的 `GEO_TARGET_IDS` |
| `--language` | `en` | 见 `lib/google-ads-client.mjs` 的 `LANGUAGE_CRITERION_IDS` |
| `--landing-page` | 从 ICP 推断 | 覆盖 ICP 里的 landing |

### 状态文件

已创建的 SEM campaign 记录在：
`.agents/skills/cmo/state/sem-state.json`

如果你从旧 `$ads` 迁移，旧文件 `.agents/skills/ads/state/sem-state.json` 会作为 fallback 被读取；新的创建/暂停记录会写回 CMO 自己的 state 文件。

```json
{
  "seo-marketer": {
    "campaignId": "12345678",
    "adGroupId": "87654321",
    "adId": "11223344",
    "budgetResourceName": "customers/.../campaignBudgets/...",
    "dailyBudget": 10,
    "regions": ["US", "TW", "HK", "SG"],
    "language": "en",
    "landingPage": "https://buda.app",
    "keywordCount": 10,
    "createdAt": "2026-05-12T10:00:00.000Z",
    "history": []
  }
}
```

再次运行 `create-sem-campaign.mjs --icp seo-marketer` 会直接跳过，除非 `--force`。

### Campaign 默认是 PAUSED

SEM 广告刚创建时状态为 **PAUSED**，便于先在 Google Ads 后台检查关键词 / 出价 / RSA 通过情况再启用。这是 SEM 和 Video 的一个关键差异（Video 默认 ENABLED）。

### 第一版限制 / 待办

- 一个 ICP = 一个 Campaign + 一个 Ad Group + 一条 RSA。后续可按 `matchType` 或关键词主题拆分 Ad Group。
- 出价策略：Manual CPC。后续可加 Target CPA / Maximize Conversions（需要先有转化数据）。
- RSA headlines 自动截断到 30 字符，descriptions 截断到 90 字符——如果 ICP 里的文案过长会被裁剪。
- 没有设备 / 时段 / audience 层的 bid adjustment。

---

## Video（YouTube）广告

### 配置来源：MDX frontmatter

在每个视频的 MDX frontmatter 中添加 `ads` 块：

```yaml
---
title: "用 Buda AI 提升工作效率"
description: "一分钟了解 Buda AI 如何帮你自动化日常任务"
videoUrl: "https://cdn.buda.ai/videos/buda/buda-intro-general-zh-CN.mp4"
youtubeId: "abc123"
playlistId: "PLuHcfaOt6gxt3jBbVHC9CZ-Q-PUmwKyZo"
duration: "1:23"
lang: zh-CN
publishedAt: "2026-05-08"
tags:
  - buda
  - ai agent

# Google Ads 配置
ads:
  enabled: true          # 必须 true 才会创建
  dailyBudget: 5         # 美元/日，最低 1
  targetCPV: 0.02        # 每次观看出价，最低 0.01
  regions:
    - TW
    - HK
    - SG
  language: zh-CN
  landingPage: https://buda.ai

# 投放后自动写入，不要手动修改
  campaignId: ""
  adGroupId: ""
  adId: ""
---
```

| 字段 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | ✅ | `false` | `true` 才会创建广告 |
| `dailyBudget` | ✅ | `5` | 每日预算，美元，最低 $1 |
| `targetCPV` | ✅ | `0.02` | 每次观看费用，美元，最低 $0.01 |
| `regions` | ✅ | `[TW, HK, SG]` | ISO 国家代码列表 |
| `language` | ✅ | `zh-CN` | 受众语言 |
| `landingPage` | ✅ | `https://buda.ai` | 点击广告后的落地页 |
| `campaignId` | 自动写入 | — | 创建后由脚本回写 |
| `adGroupId` | 自动写入 | — | 创建后由脚本回写 |
| `adId` | 自动写入 | — | 创建后由脚本回写 |

### 预算 / 出价关系

```
每日最多观看 ≈ dailyBudget ÷ targetCPV
示例：$5 ÷ $0.02 = 250 次/天，月 $150 约 7500~12000 次观看
```

### 使用

```bash
# 单个视频投放
node .agents/skills/cmo/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx

# Dry run
node .agents/skills/cmo/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
  --dry-run

# 强制重建
node .agents/skills/cmo/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
  --force

# 暂停（视频被替换时由 publish-video 自动调用）
node .agents/skills/cmo/scripts/pause-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx

# 或直接按 ID 暂停
node .agents/skills/cmo/scripts/pause-video-campaign.mjs --campaign-id 12345678
```

### 与 publish-video 联动

```bash
# 渲染 → 上传 R2 → 上传 YouTube → 创建 Google Ads Video Campaign
node .agents/skills/publish-video/scripts/publish-changed.mjs --yes --youtube --ads
```

`--ads` 会针对每个有 `ads.enabled: true` 的 MDX 调用 `create-video-campaign.mjs`。

### 广告类型

创建的是 **YouTube In-Stream 跳过广告（Skippable In-Stream Ad）**：
- 视频开始播放 5 秒后可跳过
- 观看超过 30 秒（或看完）才计费
- 适合品牌曝光和产品介绍

### 已知限制

`create-video-campaign.mjs` 里用了 `customers/{customerId}/assets/{youtubeId}` 作为 video asset resource name。Google Ads 实际要求先通过 `assets.create` 创建 YouTube video asset 拿到真实 resource name。目前这一步是 **TODO**（代码里有注释）。真实投放前需要补完这个 asset 创建步骤，否则 `ads.create` 会报错。

---

## 认证配置

Google Ads API 需要以下凭证，**必须使用公司账号**：

### 需要的文件

```
~/.config/google-ads/
├── client_secret.json    ← 公司 Google Cloud 项目的 OAuth 凭证
└── token.json            ← 首次授权后自动生成
```

### 需要的环境变量

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export GOOGLE_ADS_DEVELOPER_TOKEN="your_developer_token"
export GOOGLE_ADS_CUSTOMER_ID="xxx-xxx-xxxx"   # 公司 Google Ads 账号 ID
```

### 首次授权步骤

1. 向同事获取：
   - 公司 Google Cloud 项目的 `client_secret.json`（需要 Google Ads API 权限）
   - Google Ads Developer Token（在 Google Ads API Center 申请）
   - 公司 Google Ads 账号 ID（格式 `xxx-xxx-xxxx`，在 Google Ads 后台右上角）

2. 把 `client_secret.json` 放到 `~/.config/google-ads/client_secret.json`

3. 设置环境变量后运行任意 create 脚本，会自动弹出授权链接

4. 在浏览器里用**公司 Google 账号**完成授权，把 code 粘回终端

> ⚠️ YouTube 上传和 Google Ads 投放需要分别授权：
> - YouTube 上传 → `~/.config/youtube-upload/token.json`（YouTube 频道所有者账号）
> - Google Ads 投放 → `~/.config/google-ads/token.json`（公司 Ads 账号）

---

## 幂等性设计

| 行为 | SEM | Video |
|------|-----|-------|
| 重复运行不创建重复广告 | ✅ 看 `state/sem-state.json` | ✅ 看 MDX 里的 `campaignId` |
| 用 `--force` 可以强制重建 | ✅ | ✅ |
| 旧广告自动暂停 | ❌（需要手动 `pause-sem-campaign`） | 计划中 |

---

## 依赖

```bash
pnpm add -w googleapis google-ads-api
```

两个脚本都是按需 `import()`，不装也能 `--dry-run`。

---

## 常见问题

**Q: `ads.enabled = false` 的视频会怎样？**
跳过广告创建，R2 / YouTube 上传正常。

**Q: ICP 里没有 `sem` 块会怎样？**
`create-sem-campaign.mjs` 会在校验阶段报错：`icp.sem.keywords must be a non-empty array`。去对应 ICP `.ts` 文件里补齐 `sem` 块即可。

**Q: 能不能共享 keyword 集在多个 ICP 之间？**
目前不行。每个 ICP 的 `sem` 是独立的。如果未来需要共享，可以在 `packages/share-domains/gtm/data/` 加一个 shared-sem 常量，让多个 ICP 引用。

**Q: SEM campaign 创建后默认是 ENABLED 还是 PAUSED？**
PAUSED。Google Search 广告花钱很快，脚本默认让你先在 UI review 过再启用。Video 默认 ENABLED（CPV 模式成本可控）。

**Q: 能不能只更新预算不重新创建？**
当前 `--force` 是删了重建。后续可以加 `update-sem-campaign.mjs` / `update-video-campaign.mjs` 做原地 update。

**Q: 为什么不用 Service Account 而用 OAuth？**
Google Ads API 不支持 Service Account 直接认证，必须用 OAuth。公司的那份 Service Account JSON 是用来读 GA4 数据的，两者独立。

---

## 文件结构

```
.agents/skills/cmo/
├── SKILL.md                           # 入口
├── GOOGLE-ADS.md                      # 本文件
├── scripts/
│   ├── lib/
│   │   ├── google-ads-client.mjs     # OAuth + Customer 初始化 + GEO / LANG 常量
│   │   └── icp-loader.mjs            # 从 apps/buda 加载 ICP 数据
│   ├── create-google-sem-campaign.mjs # SEM Search 广告
│   ├── pause-google-sem-campaign.mjs
│   ├── create-google-video-campaign.mjs # YouTube Video 广告
│   ├── pause-google-video-campaign.mjs
│   ├── create-sem-campaign.mjs       # 旧 ads 兼容入口
│   ├── pause-sem-campaign.mjs
│   ├── create-video-campaign.mjs
│   └── pause-video-campaign.mjs
└── state/
    └── sem-state.json                # SEM campaign 状态（auto-created）
```
