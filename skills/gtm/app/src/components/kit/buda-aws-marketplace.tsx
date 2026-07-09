import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  Cloud,
  FileText,
  Lock,
  MessageSquare,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "../../next-link-shim";

const COPY = {
  en: {
    breadcrumb: "AWS Marketplace mock",
    tags: {
      saas: "SaaS",
      deployedOnAws: "Deployed on AWS",
      quickLaunch: "Quick Launch",
    },
    title: "Buda Agent Workspace",
    soldBy: "Sold by: Bika.ai Limited",
    heroDescription:
      "Buda is an AI agent workspace for teams that need persistent drives, isolated sandboxes, browser automation, terminal execution, and chat-channel delivery in one operational console.",
    reviewsCount: "27 AWS Marketplace reviews",
    latestVersion: "Latest version: 2026.04",
    nav: ["Overview", "Features", "Pricing", "Legal", "Usage", "Support", "Reviews"],
    purchaseTitle: "Purchase options",
    purchaseDescription: "Contract pricing with optional private offers.",
    viewPurchaseOptions: "View purchase options",
    requestPrivateOffer: "Request private offer",
    requestDemo: "Request demo",
    consolidatedBilling: "AWS consolidated billing",
    standardContract: "Standard contract available",
    privateLinkRoadmap: "PrivateLink-ready roadmap",
    overviewTitle: "Product overview",
    overviewBody:
      "This mock listing positions Buda as an AWS Marketplace SaaS product for teams that want to run AI agents without operating their own browser, terminal, file, and chat infrastructure. Buyers subscribe through AWS Marketplace, then complete onboarding in Buda to create a workspace, connect channels, and assign agents.",
    overviewCards: [
      ["Fulfillment method", "SaaS"],
      ["Delivery model", "Seller-hosted web console"],
      ["Buyer setup", "Register from AWS Marketplace token"],
    ],
    featuresTitle: "Features",
    features: [
      "Browser, terminal, drive, git, and agent chat in one workspace",
      "Persistent AWS-backed agent volumes with automatic sandbox sleep and wake",
      "Chat channel integrations for WeChat, WhatsApp, Slack, Discord, Teams, and web",
      "Usage controls, audit history, system admin dashboards, and team permissions",
      "Marketplace-ready agents, skills, templates, and delivery workflows",
    ],
    pricingTitle: "Pricing information",
    pricingHeaders: ["Plan", "Contract", "Estimated price", "Included"],
    pricingRows: [
      [
        "Buda Team",
        "SaaS contract",
        "$1,200 / month",
        "10 seats, 10 agents, pooled usage credits, standard support",
      ],
      [
        "Buda Business",
        "SaaS contract",
        "$4,800 / month",
        "50 seats, 100 agents, higher sandbox limits, priority support",
      ],
      [
        "Buda Enterprise",
        "Private offer",
        "Custom",
        "Dedicated onboarding, custom limits, procurement terms, security review",
      ],
    ],
    usageTitle: "Usage instructions",
    usageSteps: [
      "Subscribe through AWS Marketplace and choose the Buda contract plan.",
      "AWS Marketplace redirects the buyer to the Buda registration landing page.",
      "Buda exchanges the marketplace token, creates the workspace, and maps the buyer entitlement.",
      "The buyer creates agents, connects chat channels, and starts using the Buda workspace.",
    ],
    supportTitle: "Support information",
    standardSupport: "Standard support",
    standardSupportBody:
      "Email support, onboarding documentation, and help center access for all subscribed AWS Marketplace customers.",
    enterpriseSupport: "Enterprise support",
    enterpriseSupportBody:
      "Private offer customers can request onboarding workshops, security review materials, and solution architecture support.",
    customerReviews: "Customer reviews",
    reviews: [
      [
        "Unified agent operations without maintaining our own sandbox fleet",
        "Buda helped our team test browser workflows, run scripts, and keep project context in persistent drives.",
      ],
      [
        "Useful procurement path for AWS-first teams",
        "The AWS Marketplace route would make budget approval and vendor management much easier for us.",
      ],
    ],
    highlights: "Highlights",
    highlightItems: [
      "Category: AI agents, developer tools, business automation",
      "Industries: Software, consulting, marketing, operations",
      "Availability: United States, Hong Kong, Singapore, Japan, EU",
      "Security: Workspace isolation, audit logs, role-based access",
    ],
    mockNoteTitle: "Mock listing note",
    mockNoteBody:
      "This page is an internal Buda kit mockup for marketplace positioning and sales enablement. It is not an actual AWS Marketplace listing.",
  },
  "zh-CN": {
    breadcrumb: "AWS Marketplace 模拟页",
    tags: { saas: "SaaS", deployedOnAws: "部署于 AWS", quickLaunch: "快速启动" },
    title: "Buda Agent Workspace",
    soldBy: "销售方：Bika.ai Limited",
    heroDescription:
      "Buda 是一套面向团队的 AI Agent 工作空间，把持久 Drive、隔离沙箱、浏览器自动化、终端执行和聊天渠道交付放进同一个运营控制台。",
    reviewsCount: "27 条 AWS Marketplace 评价",
    latestVersion: "最新版本：2026.04",
    nav: ["概览", "功能", "定价", "法务", "使用方式", "支持", "评价"],
    purchaseTitle: "购买选项",
    purchaseDescription: "支持合同定价和私有报价。",
    viewPurchaseOptions: "查看购买选项",
    requestPrivateOffer: "申请私有报价",
    requestDemo: "申请演示",
    consolidatedBilling: "AWS 合并账单",
    standardContract: "提供标准合同",
    privateLinkRoadmap: "PrivateLink 路线图已规划",
    overviewTitle: "产品概览",
    overviewBody:
      "这个模拟页将 Buda 定位为一款适合通过 AWS Marketplace 采购的 SaaS，面向不想自建浏览器、终端、文件和聊天基础设施的 AI Agent 团队。买家通过 AWS Marketplace 订阅后，在 Buda 内完成注册、创建工作空间、连接渠道并分配 Agent。",
    overviewCards: [
      ["交付方式", "SaaS"],
      ["部署模式", "卖方托管 Web 控制台"],
      ["买家配置", "通过 AWS Marketplace token 注册"],
    ],
    featuresTitle: "功能",
    features: [
      "浏览器、终端、Drive、Git 和 Agent 对话集中在一个工作空间",
      "持久化 AWS Agent 卷，支持自动休眠与唤醒",
      "支持微信、WhatsApp、Slack、Discord、Teams 与 Web 聊天渠道集成",
      "用量控制、审计历史、系统管理看板和团队权限",
      "面向 Marketplace 的 Agent、Skill、模板与交付工作流",
    ],
    pricingTitle: "定价信息",
    pricingHeaders: ["方案", "合同形式", "预估价格", "包含内容"],
    pricingRows: [
      ["Buda Team", "SaaS 合同", "$1,200 / 月", "10 个席位，10 个 Agent，共享用量积分，标准支持"],
      [
        "Buda Business",
        "SaaS 合同",
        "$4,800 / 月",
        "50 个席位，100 个 Agent，更高 sandbox 限额，优先支持",
      ],
      ["Buda Enterprise", "私有报价", "定制", "专属 onboarding、自定义限额、采购条款和安全审查"],
    ],
    usageTitle: "使用说明",
    usageSteps: [
      "通过 AWS Marketplace 订阅并选择 Buda 合同方案。",
      "AWS Marketplace 会将买家重定向到 Buda 注册落地页。",
      "Buda 交换 marketplace token、创建工作空间并映射买家 entitlement。",
      "买家创建 Agent、连接聊天渠道，并开始使用 Buda 工作空间。",
    ],
    supportTitle: "支持信息",
    standardSupport: "标准支持",
    standardSupportBody:
      "所有已订阅 AWS Marketplace 的客户都可获得邮件支持、onboarding 文档和帮助中心访问权限。",
    enterpriseSupport: "企业支持",
    enterpriseSupportBody:
      "私有报价客户可申请 onboarding workshop、安全审查材料和解决方案架构支持。",
    customerReviews: "客户评价",
    reviews: [
      [
        "无需自建沙箱集群也能统一管理 Agent 运营",
        "Buda 帮助我们的团队测试浏览器工作流、运行脚本，并把项目上下文保留在持久 Drive 中。",
      ],
      [
        "对 AWS-first 团队来说是更好走的采购路径",
        "AWS Marketplace 这条路会让我们的预算审批和供应商管理轻松很多。",
      ],
    ],
    highlights: "亮点",
    highlightItems: [
      "分类：AI agents、开发者工具、业务自动化",
      "行业：软件、咨询、营销、运营",
      "可用区域：美国、香港、新加坡、日本、欧盟",
      "安全：工作空间隔离、审计日志、基于角色的访问控制",
    ],
    mockNoteTitle: "模拟页说明",
    mockNoteBody:
      "该页面是 Buda 内部用于 marketplace 定位和销售 enablement 的 kit mockup，不是真实的 AWS Marketplace 列表页。",
  },
} as const;

export default function BudaAwsMarketplace() {
  const locale = "en";
  const copy = COPY[locale];
  const backHref = "/launch-pages";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3 text-sm text-muted-foreground">
          <Link href={backHref} className="hover:text-foreground">
            Buda Kit
          </Link>
          <ChevronRight className="size-4" />
          <span>{copy.breadcrumb}</span>
        </div>
      </div>

      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted text-2xl font-bold">
                B
              </div>
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border px-2.5 py-1 font-medium text-muted-foreground">
                    {copy.tags.saas}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary">
                    <BadgeCheck className="size-3" />
                    {copy.tags.deployedOnAws}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium text-muted-foreground">
                    <Cloud className="size-3" />
                    {copy.tags.quickLaunch}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    {copy.title}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">{copy.soldBy}</p>
                </div>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  {copy.heroDescription}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1 font-medium">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="size-4 fill-current text-amber-500" />
                    ))}
                    <span className="ml-1">4.8</span>
                  </span>
                  <span className="text-muted-foreground">{copy.reviewsCount}</span>
                  <span className="text-muted-foreground">{copy.latestVersion}</span>
                </div>
              </div>
            </div>

            <nav className="flex gap-6 border-b text-sm font-medium text-muted-foreground">
              {copy.nav.map((item, index) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`border-b-2 py-3 transition-colors hover:text-foreground ${
                    index === 0 ? "border-primary text-foreground" : "border-transparent"
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          <aside className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {copy.purchaseTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{copy.purchaseDescription}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {copy.viewPurchaseOptions}
                <ArrowUpRight className="size-4" />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                {copy.requestPrivateOffer}
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                {copy.requestDemo}
              </button>
              <div className="space-y-3 border-t pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {copy.consolidatedBilling}
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  {copy.standardContract}
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-primary" />
                  {copy.privateLinkRoadmap}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section id="overview" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.overviewTitle}</h2>
            <p className="leading-7 text-muted-foreground">{copy.overviewBody}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {copy.overviewCards.map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-card p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                  <p className="mt-2 font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="features" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.featuresTitle}</h2>
            <div className="grid gap-3">
              {copy.features.map((feature) => (
                <div key={feature} className="flex gap-3 rounded-lg border bg-card p-4">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-sm leading-6">{feature}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="pricing" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.pricingTitle}</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    {copy.pricingHeaders.map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {copy.pricingRows.map((row) => (
                    <tr key={row[0]} className="border-t">
                      <td className="px-4 py-4 font-medium">{row[0]}</td>
                      <td className="px-4 py-4 text-muted-foreground">{row[1]}</td>
                      <td className="px-4 py-4 font-semibold">{row[2]}</td>
                      <td className="px-4 py-4 text-muted-foreground">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="usage" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.usageTitle}</h2>
            <ol className="grid gap-3 text-sm">
              {copy.usageSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg border bg-card p-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="support" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.supportTitle}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <MessageSquare className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{copy.standardSupport}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy.standardSupportBody}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <Building2 className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{copy.enterpriseSupport}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy.enterpriseSupportBody}
                </p>
              </div>
            </div>
          </section>

          <section id="reviews" className="space-y-4">
            <h2 className="text-2xl font-semibold">{copy.customerReviews}</h2>
            <div className="grid gap-4">
              {copy.reviews.map((review) => (
                <article key={review[0]} className="rounded-lg border bg-card p-5">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <h3 className="mt-3 font-semibold">{review[0]}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{review[1]}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-semibold">{copy.highlights}</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {copy.highlightItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-5">
            <h3 className="font-semibold">{copy.mockNoteTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.mockNoteBody}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
