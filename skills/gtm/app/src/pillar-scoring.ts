/**
 * GTM Pillar Scoring
 *
 * Commercial Loop Index evaluated per ICP:
 *   1. 🏗️ Foundation — sellable offer, landing assets, commerce readiness
 *   2. 📝 Content    — organic acquisition engine
 *   3. 📢 Paid       — paid acquisition and controlled test budget
 *   4. 💬 Retention  — fulfillment, onboarding, support, expansion
 *
 * Each item in a pillar is a heuristic check against the GTM data in data.ts.
 * Results are rolled up to a 0-100% Commercial Loop Index.
 */

import {
  COMMUNITY_PLATFORMS,
  type GTMData,
  hasLocalizedText,
  type ICP,
  INFLUENCER_KIT_CATEGORIES,
  INFLUENCER_KIT_REQUIRED_CATEGORIES,
} from "./data";

export interface HintLine {
  done?: boolean; // true=✓, false=✗, undefined=无序bullet
  text: string;
}

export interface PillarItem {
  label: string;
  done: boolean;
  hint?: string; // simple single-line hint
  hintLines?: HintLine[]; // structured multi-line hint
  url?: string; // optional — click to open the actual asset
}

export interface PillarStatus {
  items: PillarItem[];
  doneCount: number;
  totalCount: number;
  pct: number; // 0-100
  health: "green" | "yellow" | "red";
}

export interface IcpPillars {
  foundation: PillarStatus;
  content: PillarStatus;
  paid: PillarStatus;
  retention: PillarStatus;
  overallPct: number;
  overallHealth: "green" | "yellow" | "red";
  commercialLoopPct: number;
  commercialLoopHealth: "green" | "yellow" | "red";
  commercialLoopStage: "draft" | "prelaunch" | "testable" | "selling" | "closed-loop";
}

function toStatus(items: PillarItem[]): PillarStatus {
  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const health = pct >= 80 ? "green" : pct >= 40 ? "yellow" : "red";
  return { items, doneCount, totalCount, pct, health };
}

// ───── Pillar 1: Foundation ─────────────────────────────────────────────────

function scoreFoundation(icp: ICP, data: GTMData): PillarStatus {
  const hasAsset = (category: string) =>
    icp.assets.some(
      (a) => a.category === category && (a.status === "live" || a.status === "draft"),
    );
  const liveAsset = (category: string) =>
    icp.assets.some((a) => a.category === category && a.status === "live");
  const firstLiveUrl = (category: string) =>
    icp.assets.find((a) => a.category === category && a.status === "live" && a.url)?.url;
  const firstAnyUrl = (category: string) =>
    icp.assets.find((a) => a.category === category && a.url)?.url;

  const videoUrl = firstLiveUrl("video") ?? firstAnyUrl("video");
  const landingUrl = firstLiveUrl("landing-page");
  const salesPitchUrl = firstLiveUrl("sales-pitch") ?? firstAnyUrl("sales-pitch");
  // Influencer kit canonical set — single source of truth in data.ts
  const influencerKitItems = INFLUENCER_KIT_CATEGORIES.filter((it) =>
    (INFLUENCER_KIT_REQUIRED_CATEGORIES as readonly string[]).includes(it.category),
  );
  const influencerKitLive = influencerKitItems.filter((it) => liveAsset(it.category)).length;
  const influencerKitMissing = influencerKitItems
    .filter((it) => !liveAsset(it.category))
    .map((it) => it.label);
  const _influencerKitUrl =
    firstLiveUrl("influencer-product-brief") ?? firstAnyUrl("influencer-product-brief");
  // In-page anchors for messaging/competitors/landing-copy (resolved by <a href="#...">)
  const messagingAnchor = "#messaging";
  const competitorsAnchor = "#competitors";
  const landingCopyAnchor = "#landing-copy";
  const icpProductIds = new Set(icp.offers.map((offer) => offer.productId));
  const positionedProducts = data.products.filter((product) => icpProductIds.has(product.id));
  const positionedProductIds = new Set(positionedProducts.map((product) => product.id));
  const relatedSkus = data.skus.filter(
    (sku) =>
      (sku.productId && positionedProductIds.has(sku.productId)) ||
      icpProductIds.has(sku.productId ?? ""),
  );
  const relatedSkuIds = new Set(relatedSkus.map((sku) => sku.id));
  const activeOffers = data.offers.filter(
    (offer) =>
      offer.status === "active" &&
      (offer.targetIcpIds?.includes(icp.id) ||
        offer.productIds.some((productId) => positionedProductIds.has(productId))),
  );
  const relatedListings = data.channelListings.filter(
    (listing) =>
      listing.targetIcpIds?.includes(icp.id) ||
      (listing.productId ? positionedProductIds.has(listing.productId) : false) ||
      listing.variants.some((variant) => relatedSkuIds.has(variant.skuId)),
  );
  const readyListings = relatedListings.filter((listing) =>
    ["ready", "submitted", "live"].includes(listing.status),
  );
  const liveListings = relatedListings.filter((listing) => listing.status === "live");
  const hasPrice = relatedSkus.some((sku) => !!sku.pricing || !!sku.price);
  const hasFulfillment = relatedSkus.some((sku) => !!sku.fulfillment);
  const hasConversionFunnel = icp.funnels.some((step) =>
    ["pricing", "sign-up", "signup", "checkout", "demo", "contact"].some((keyword) =>
      `${step.name} ${step.url}`.toLowerCase().includes(keyword),
    ),
  );

  const items: PillarItem[] = [
    {
      label: "明确商品 / Product",
      done: positionedProducts.length >= 1,
      hint: `${positionedProducts.length} 个 product positioned for this ICP`,
      url: "/products",
    },
    {
      label: "可售 SKU + 价格",
      done: relatedSkus.length >= 1 && hasPrice,
      hint: `${relatedSkus.length} SKU · ${hasPrice ? "有价格" : "缺价格"}`,
      url: "/skus",
    },
    {
      label: "主推 Offer 已激活",
      done: activeOffers.length >= 1,
      hint: `${activeOffers.length} active offer`,
      url: "/offers",
    },
    {
      label: "上架 / Listing ready",
      done: readyListings.length >= 1,
      hint: `${liveListings.length} live / ${readyListings.length} ready+ / ${relatedListings.length} total`,
      url: "/listings",
    },
    {
      label: "主介绍视频",
      done: liveAsset("video"),
      hint: liveAsset("video") ? "✓ 视频已上线" : hasAsset("video") ? "⚠ 视频在草稿" : "✗ 还没制作",
      url: videoUrl,
    },
    {
      label: "专属落地页",
      done: liveAsset("landing-page"),
      hint: liveAsset("landing-page") ? "✓ 落地页已上线" : "✗ 还没落地页",
      url: landingUrl,
    },
    {
      label: "落地页文案（Hero / Features / Use Cases）",
      done: !!icp.landingCopy?.hero?.headline && (icp.landingCopy?.features?.length ?? 0) >= 3,
      hintLines: icp.landingCopy
        ? [
            { done: !!icp.landingCopy.hero, text: "Hero" },
            {
              done: (icp.landingCopy.features?.length ?? 0) >= 3,
              text: `Feature ${icp.landingCopy.features?.length ?? 0} 条（需≥3）`,
            },
            { text: `Use Case ${icp.landingCopy.useCases?.length ?? 0} 条` },
          ]
        : undefined,
      hint: icp.landingCopy ? undefined : "✗ 还没写落地页文案",
      url: landingCopyAnchor,
    },
    {
      label: "Sales Pitch（PPT + 演讲稿）",
      done: liveAsset("sales-pitch"),
      hint: liveAsset("sales-pitch")
        ? "✓ Sales Pitch 已就绪"
        : hasAsset("sales-pitch")
          ? "⚠ 在草稿中"
          : "✗ 还没有销售材料",
      url: salesPitchUrl,
    },
    {
      label: "Onboarding 流程",
      done: liveAsset("onboarding"),
      hint: liveAsset("onboarding")
        ? "✓ Onboarding 已上线"
        : hasAsset("onboarding")
          ? "⚠ 草稿中"
          : "✗ 还没有 onboarding 流程",
      url: firstLiveUrl("onboarding") ?? firstAnyUrl("onboarding"),
    },
    {
      label: "转化路径（Pricing / Sign-up / Checkout / Demo）",
      done: hasConversionFunnel,
      hint: hasConversionFunnel ? "✓ funnel 有转化入口" : "✗ funnel 还没有成交入口",
      url: "#landing-copy",
    },
    {
      label: "履约方式已定义",
      done: hasFulfillment,
      hint: hasFulfillment ? "✓ SKU/Listing 有 fulfillment" : "✗ 缺少购买后交付说明",
      url: "/skus",
    },
    {
      label: "Influencer Kit（4 canonical 物料全齐）",
      done: influencerKitLive === influencerKitItems.length,
      hint: `${influencerKitLive}/${influencerKitItems.length} live${influencerKitMissing.length ? ` · 缺: ${influencerKitMissing.join(", ")}` : ""}`,
      url: "/kit/influencer",
    },
    {
      label: "Value Proposition（核心价值主张）",
      done: hasLocalizedText(icp.valueProp),
      url: messagingAnchor,
    },
    {
      label: "Tagline（品牌口号）",
      done: hasLocalizedText(icp.tagline),
      url: messagingAnchor,
    },
    {
      label: "Key Messages (≥3)",
      done: icp.keyMessages.length >= 3,
      hint: `${icp.keyMessages.length} 条`,
      url: messagingAnchor,
    },
    {
      label: "Objection Handling (≥3)",
      done: icp.objections.length >= 3,
      hint: `${icp.objections.length} 条`,
      url: messagingAnchor,
    },
    {
      label: "Competitors 定义",
      done: icp.competitors.length >= 2,
      hint: `${icp.competitors.length} 个竞品`,
      url: competitorsAnchor,
    },
    {
      label: "Compare 落地页（vs 竞品）",
      done:
        icp.competitors.filter(
          (c) => c.comparePageStatus === "live" || c.comparePageStatus === "draft",
        ).length >= 1,
      hint: (() => {
        const live = icp.competitors.filter((c) => c.comparePageStatus === "live").length;
        const todo = icp.competitors.filter(
          (c) => c.comparePageStatus && c.comparePageStatus !== "live",
        ).length;
        return `${live} live / ${todo} todo`;
      })(),
      url: competitorsAnchor,
    },
  ];

  return toStatus(items);
}

// ───── Pillar 2: Content Engine ────────────────────────────────────────────

function scoreContent(icp: ICP, data: GTMData): PillarStatus {
  const pubContent = icp.content.filter((c) => c.status === "published");
  const blogCount = icp.content.filter((c) => c.type === "blog").length;
  const hasTemplate = icp.assets.some(
    (a) => (a.category === "template" || a.category === "skill") && a.status !== "todo",
  );

  // Accounts targeting this ICP for organic content
  const organicAccounts = data.accounts.filter(
    (a) => a.targetIcpIds.includes(icp.id) && a.status === "active",
  );

  // Channels defined for this ICP
  const hasChannelStrategy = icp.channels.length >= 2;

  const items: PillarItem[] = [
    {
      label: "已发布内容 (≥3)",
      done: pubContent.length >= 3,
      hint: `${pubContent.length} 篇已发布 / ${icp.content.length} 总数`,
    },
    {
      label: "Blog / 长文 (≥2)",
      done: blogCount >= 2,
      hint: `${blogCount} 篇 blog`,
    },
    {
      label: "渠道策略 (≥2)",
      done: hasChannelStrategy,
      hint: `定义了 ${icp.channels.length} 个渠道`,
    },
    {
      label: "Active 社媒账号 (≥1)",
      done: organicAccounts.length >= 1,
      hint: `${organicAccounts.length} 个 active 账号覆盖`,
    },
    {
      label: "模板 / Skill",
      done: hasTemplate,
      hint: hasTemplate ? "✓ 有可复用的模板" : "✗ 还没沉淀模板",
    },
  ];

  return toStatus(items);
}

// ───── Pillar 3: Paid Acquisition ──────────────────────────────────────────

function scorePaid(icp: ICP, data: GTMData): PillarStatus {
  const icpCampaigns = data.adCampaigns.filter((c) => c.targetIcpId === icp.id);
  const runningCount = icpCampaigns.filter((c) => c.status === "running").length;
  const minimumBudgetCampaigns = icpCampaigns.filter((c) => c.budgetDaily && c.budgetDaily > 0);
  const adPlatformPlans = icp.ads?.platforms ?? [];
  const hasPlannedAdCreative = adPlatformPlans.some((plan) =>
    plan.creatives.some((creative) =>
      ["briefed", "draft", "ready", "live"].includes(creative.status),
    ),
  );
  const hasAdCreative =
    icp.assets.some((a) => a.category === "ad-creative" && a.status !== "todo") ||
    hasPlannedAdCreative;

  // Platform coverage
  const platforms = new Set(icpCampaigns.map((c) => c.platform));
  const plannedPlatforms = new Set(adPlatformPlans.map((plan) => plan.platform));

  const items: PillarItem[] = [
    {
      label: "广告素材",
      done: hasAdCreative,
      hint: hasAdCreative ? "✓ 广告素材已就绪" : "✗ 还没做广告素材",
    },
    {
      label: "Search Ads (Google)",
      done:
        icpCampaigns.some((c) => c.platform === "google") ||
        plannedPlatforms.has("google-search") ||
        plannedPlatforms.has("google-display"),
      hint:
        platforms.has("google") || plannedPlatforms.has("google-search")
          ? "已配置 Google Ads campaign 或 ICP ads plan"
          : "暂无",
    },
    {
      label: "Video Ads (YouTube)",
      done: icpCampaigns.some((c) => c.platform === "youtube") || plannedPlatforms.has("youtube"),
      hint:
        platforms.has("youtube") || plannedPlatforms.has("youtube")
          ? "已配置 YouTube campaign 或 ICP ads plan"
          : "暂无",
    },
    {
      label: "Social Ads (TikTok/Meta)",
      done:
        icpCampaigns.some((c) => ["tiktok", "facebook", "meta", "twitter"].includes(c.platform)) ||
        (["tiktok", "facebook", "meta", "instagram", "x", "twitter", "reddit"] as const).some(
          (platform) => plannedPlatforms.has(platform),
        ),
      hint: "TikTok / FB / Meta / X / Reddit 任一有投放或 plan 即达标",
    },
    {
      label: "至少 1 个 campaign 在投",
      done: runningCount >= 1,
      hint: `${runningCount} running / ${icpCampaigns.length} total`,
    },
    {
      label: "最低额度测试预算",
      done: minimumBudgetCampaigns.length >= 1,
      hint: `${minimumBudgetCampaigns.length} campaign 有日预算`,
    },
    {
      label: "投放落地页已绑定",
      done: icpCampaigns.some((c) => !!c.landingPageUrl),
      hint: icpCampaigns.some((c) => !!c.landingPageUrl)
        ? "✓ campaign 有 landing page"
        : "✗ 缺 landing page",
    },
    {
      label: "阶梯投放计划",
      done: data.budget.some(
        (item) =>
          ["ads", "ad", "google", "influencer", "投流", "launch"].some((keyword) =>
            item.category.toLowerCase().includes(keyword),
          ) && item.allocated > 0,
      ),
      hint: "需要 test → validate → scale 的预算梯度",
      url: "/budget",
    },
  ];

  return toStatus(items);
}

// ───── Pillar 4: Retention Engine ──────────────────────────────────────────

function scoreRetention(icp: ICP, data: GTMData): PillarStatus {
  const hasEmailSeq = icp.assets.some(
    (a) => a.category === "email-sequence" && a.status !== "todo",
  );

  // Community presence: platforms defined as community in data.ts (single source of truth)
  const hasCommunity = data.accounts.some(
    (a) =>
      a.targetIcpIds.includes(icp.id) &&
      a.status === "active" &&
      (COMMUNITY_PLATFORMS as readonly string[]).includes(a.platform),
  );

  // Customer Support stream active
  const hasSupport = data.operationalStreams.some(
    (s) => s.category === "support" && s.status === "active" && s.health !== "red",
  );

  // Retro entries (feedback loop)
  const hasRetro = icp.retro.length >= 1;

  // Offer with upsell path (primary + upsell)
  const hasUpgradePath =
    icp.offers.some((o) => o.priority === "primary") &&
    icp.offers.some((o) => o.priority === "upsell" || o.priority === "secondary");
  const hasFulfillment = data.offers.some(
    (offer) =>
      !!offer.fulfillment &&
      (offer.targetIcpIds?.includes(icp.id) ||
        offer.productIds.some((productId) =>
          icp.offers.some((icpOffer) => icpOffer.productId === productId),
        )),
  );
  const hasBillingSpec = data.playbooks.some((playbook) =>
    `${playbook.slug} ${playbook.title} ${playbook.description}`.toLowerCase().includes("billing"),
  );
  const hasPolicyAsset = icp.assets.some((a) =>
    ["policy", "privacy", "terms", "refund", "security", "support-policy"].includes(a.category),
  );

  const items: PillarItem[] = [
    {
      label: "Email Sequence（邮件序列）",
      done: hasEmailSeq,
      hint: hasEmailSeq ? "✓ 邮件序列已配置" : "✗ 还没 email sequence",
    },
    {
      label: "社群 / Community",
      done: hasCommunity,
      hint: hasCommunity ? "✓ 有 active 社群渠道" : "✗ 暂无社群入口",
    },
    {
      label: "Customer Support（客服支持）",
      done: hasSupport,
      hint: hasSupport ? "✓ 支持流正常运作" : "✗ 支持流未激活",
    },
    {
      label: "Retro / 反馈已记录",
      done: hasRetro,
      hint: `${icp.retro.length} 条 retro`,
    },
    {
      label: "Upsell / 阶梯产品",
      done: hasUpgradePath,
      hint: hasUpgradePath ? "✓ 有主推+次推" : "✗ 缺少上升路径",
    },
    {
      label: "购买后履约 / Delivery",
      done: hasFulfillment,
      hint: hasFulfillment ? "✓ offer 定义了交付方式" : "✗ 缺购买后交付说明",
      url: "/offers",
    },
    {
      label: "Billing / 支付韧性说明",
      done: hasBillingSpec,
      hint: hasBillingSpec ? "✓ 有支付/计费说明" : "✗ 需要 checkout/webhook/人工测试证据",
    },
    {
      label: "政策 / 售后 / 安全资产",
      done: hasPolicyAsset,
      hint: hasPolicyAsset
        ? "✓ ICP 有政策类资产"
        : "✗ 缺 privacy/terms/refund/support/security 证据",
    },
  ];

  return toStatus(items);
}

// ───── Public API ───────────────────────────────────────────────────────────

export function computeIcpPillars(icp: ICP, data: GTMData): IcpPillars {
  const foundation = scoreFoundation(icp, data);
  const content = scoreContent(icp, data);
  const paid = scorePaid(icp, data);
  const retention = scoreRetention(icp, data);

  // Weighted commercial loop: Foundation is the ante, but the loop only closes
  // when acquisition, conversion, delivery, and retention all have evidence.
  const overallPct = Math.round(
    foundation.pct * 0.4 + content.pct * 0.2 + paid.pct * 0.2 + retention.pct * 0.2,
  );
  const overallHealth: IcpPillars["overallHealth"] =
    overallPct >= 75 ? "green" : overallPct >= 40 ? "yellow" : "red";
  const commercialLoopStage: IcpPillars["commercialLoopStage"] =
    overallPct >= 90
      ? "closed-loop"
      : overallPct >= 75
        ? "selling"
        : overallPct >= 60
          ? "testable"
          : overallPct >= 40
            ? "prelaunch"
            : "draft";

  return {
    foundation,
    content,
    paid,
    retention,
    overallPct,
    overallHealth,
    commercialLoopPct: overallPct,
    commercialLoopHealth: overallHealth,
    commercialLoopStage,
  };
}

export const PILLAR_LABELS = {
  foundation: { emoji: "🏗️", name: "Foundation Readiness", desc: "能不能卖：商品/落地页/上架/履约" },
  content: { emoji: "📝", name: "Organic Acquisition", desc: "能不能自然获客：内容与账号节奏" },
  paid: { emoji: "📢", name: "Paid Acquisition", desc: "能不能付费获客：预算/素材/落地页" },
  retention: { emoji: "💬", name: "Delivery & Retention", desc: "成交后能不能交付、留存、扩张" },
} as const;
