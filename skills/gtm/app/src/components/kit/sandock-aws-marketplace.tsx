import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Cloud,
  FileText,
  LifeBuoy,
  LockKeyhole,
  Server,
  ShieldCheck,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "../../next-link-shim";

const content = {
  en: {
    metaTitle: "AWS Marketplace Mock | Sandock Kit",
    metaDescription: "A post-listing AWS Marketplace SaaS product detail mock for Sandock.",
    back: "Back to Kit",
    marketplace: "AWS Marketplace",
    title: "Sandock Cloud Sandboxes for AI Coding Agents",
    soldBy: "Sold by: Sandock AI",
    deployed: "Deployed on AWS",
    saas: "Software as a Service (SaaS)",
    summary:
      "Persistent Docker workspaces for AI coding agents, with POSIX-compatible volumes, browser automation, terminal access, preview URLs, and usage-based cloud sandbox operations.",
    ctaPrimary: "View purchase options",
    ctaSecondary: "Request private offer",
    ctaTertiary: "Request demo",
    rating: "4.8",
    reviews: "27 reviews",
    vendorInsights: "Vendor Insights",
    nav: [
      ["overview", "Overview"],
      ["features", "Features"],
      ["pricing", "Pricing"],
      ["legal", "Legal"],
      ["usage", "Usage"],
      ["resources", "Resources"],
      ["support", "Support"],
      ["reviews", "Reviews"],
    ],
    overviewTitle: "Overview",
    overview:
      "Sandock gives AI coding agents a durable cloud workspace instead of a disposable execution box. Teams use Sandock to run Claude Code, Codex-style agents, browser tasks, build jobs, and MCP tools inside isolated Docker sandboxes that preserve filesystem state across long-running work.",
    highlightsTitle: "Highlights",
    highlights: [
      "100% POSIX-compatible SSD and NFS volumes for coding agents that expect a real filesystem.",
      "Long-running Docker sandboxes keep agent workspaces warm between tasks, retries, and reviews.",
      "Browser automation, terminal sessions, preview URLs, MCP hosting, and file APIs in one platform.",
    ],
    featureTitle: "Features",
    features: [
      {
        icon: Server,
        title: "Persistent agent workspaces",
        body: "Run coding agents in isolated Docker environments with durable volumes and predictable workspace paths.",
      },
      {
        icon: LockKeyhole,
        title: "Secure execution boundary",
        body: "Resource controls, network policy, lifecycle limits, and audit-friendly sandbox operations for untrusted code.",
      },
      {
        icon: Cloud,
        title: "Marketplace procurement ready",
        body: "Aligns with AWS Marketplace SaaS contracts, private offers, enterprise billing, and procurement workflows.",
      },
    ],
    detailsTitle: "Details",
    details: [
      ["Sold by", "Sandock AI"],
      ["Categories", "Developer Tools, DevOps, Artificial Intelligence"],
      ["Delivery method", "Software as a Service (SaaS)"],
      ["Deployed on AWS", "Yes"],
      ["Supported regions", "US East, US West, Europe, Asia Pacific"],
    ],
    purchaseDetails: [
      ["Pricing model", "Contract + usage"],
      ["Free trial", "14 days"],
      ["Fulfillment", "SaaS URL"],
    ],
    pricingTitle: "Pricing",
    pricingDescription:
      "Pricing is based on contract duration, committed sandbox capacity, persistent storage, and additional usage. Enterprise customers can request a private offer.",
    pricingHeaders: ["Dimension", "Description", "Cost"],
    pricingRows: [
      [
        "Starter sandbox pack",
        "10 concurrent sandboxes, 100 GB persistent volume pool",
        "$49.00 / month",
      ],
      [
        "Growth sandbox pack",
        "50 concurrent sandboxes, 1 TB persistent volume pool",
        "$299.00 / month",
      ],
      [
        "Enterprise private offer",
        "Custom concurrency, SSO, compliance review, dedicated support",
        "Custom pricing",
      ],
    ],
    supportTitle: "Support",
    supportBody:
      "Vendor support: marketplace@sandock.ai. Enterprise private offers include shared Slack channel, onboarding review, and priority sandbox operations support.",
    resourcesTitle: "Resources",
    resources: ["Architecture brief", "API documentation", "Security overview"],
    usageTitle: "Usage information",
    deliveryTitle: "Delivery details",
    deliveryBody:
      "Buyers subscribe through AWS Marketplace, then complete account registration from a SaaS fulfillment URL and manage Sandock usage from the web console.",
    infrastructureTitle: "AWS infrastructure support",
    infrastructureBody:
      "Production deployments use AWS-backed compute, storage, networking, and observability components with vendor support for the Sandock SaaS layer.",
    legalTitle: "Legal",
    legalBody:
      "This is a marketing mock for launch planning. Final AWS Marketplace legal terms, refund policy, EULA, and privacy documentation must be reviewed before publishing.",
    reviewsTitle: "Reviews",
    reviewHeadline: "Enterprise teams value persistent agent state",
    reviewBody:
      "Mock buyer signal: Sandock reduces agent retry loops by keeping code, dependencies, browser sessions, and terminal work available across review cycles.",
  },
  "zh-CN": {
    metaTitle: "AWS Marketplace 模拟页 | Sandock Kit",
    metaDescription: "Sandock 上架 AWS Marketplace 后的 SaaS 产品详情页模拟。",
    back: "返回 Kit",
    marketplace: "AWS Marketplace",
    title: "Sandock：面向 AI 编码 Agent 的云沙箱",
    soldBy: "销售方：Sandock AI",
    deployed: "部署于 AWS",
    saas: "软件即服务（SaaS）",
    summary:
      "为 AI 编码 Agent 提供持久 Docker 工作空间，包含 POSIX 兼容卷、浏览器自动化、终端访问、预览 URL，以及按用量计费的云沙箱运营能力。",
    ctaPrimary: "查看购买选项",
    ctaSecondary: "申请私有报价",
    ctaTertiary: "预约演示",
    rating: "4.8",
    reviews: "27 条评价",
    vendorInsights: "供应商洞察",
    nav: [
      ["overview", "概览"],
      ["features", "功能"],
      ["pricing", "定价"],
      ["legal", "法务"],
      ["usage", "使用方式"],
      ["resources", "资源"],
      ["support", "支持"],
      ["reviews", "评价"],
    ],
    overviewTitle: "概览",
    overview:
      "Sandock 给 AI 编码 Agent 一个可持续工作的云端环境，而不是一次性的执行盒子。团队可以在隔离 Docker 沙箱中运行 Claude Code、Codex 类 Agent、浏览器任务、构建任务和 MCP 工具，并在长任务、重试和 review 周期之间保留文件系统状态。",
    highlightsTitle: "亮点",
    highlights: [
      "100% POSIX 兼容的 SSD 与 NFS 卷，适配需要真实文件系统的编码 Agent。",
      "长时间运行的 Docker 沙箱可在任务、重试和 review 之间保持工作空间温热。",
      "浏览器自动化、终端会话、预览 URL、MCP 托管和文件 API 集成在一个平台。",
    ],
    featureTitle: "功能",
    features: [
      {
        icon: Server,
        title: "持久化 Agent 工作空间",
        body: "在隔离 Docker 环境中运行编码 Agent，并获得持久卷和可预测的工作目录路径。",
      },
      {
        icon: LockKeyhole,
        title: "安全执行边界",
        body: "通过资源控制、网络策略、生命周期限制和可审计沙箱操作来运行不可信代码。",
      },
      {
        icon: Cloud,
        title: "面向 Marketplace 采购",
        body: "贴合 AWS Marketplace SaaS 合同、私有报价、企业账单与采购审批流程。",
      },
    ],
    detailsTitle: "详情",
    details: [
      ["销售方", "Sandock AI"],
      ["分类", "开发者工具、DevOps、人工智能"],
      ["交付方式", "软件即服务（SaaS）"],
      ["部署于 AWS", "是"],
      ["支持区域", "美国东部、美国西部、欧洲、亚太"],
    ],
    purchaseDetails: [
      ["定价模型", "合同 + 用量"],
      ["免费试用", "14 天"],
      ["交付", "SaaS URL"],
    ],
    pricingTitle: "定价",
    pricingDescription:
      "定价基于合同期限、承诺沙箱容量、持久存储和额外用量。企业客户可以申请私有报价。",
    pricingHeaders: ["计费维度", "说明", "费用"],
    pricingRows: [
      ["Starter 沙箱包", "10 个并发沙箱，100 GB 持久卷池", "$49.00 / 月"],
      ["Growth 沙箱包", "50 个并发沙箱，1 TB 持久卷池", "$299.00 / 月"],
      ["Enterprise 私有报价", "自定义并发、SSO、合规审查、专属支持", "定制定价"],
    ],
    supportTitle: "支持",
    supportBody:
      "供应商支持：marketplace@sandock.ai。企业私有报价包含共享 Slack 频道、onboarding review 和优先沙箱运营支持。",
    resourcesTitle: "资源",
    resources: ["架构说明", "API 文档", "安全概览"],
    usageTitle: "使用信息",
    deliveryTitle: "交付详情",
    deliveryBody:
      "买家通过 AWS Marketplace 订阅后，从 SaaS fulfillment URL 完成账号注册，并在 Sandock Web 控制台管理用量。",
    infrastructureTitle: "AWS 基础设施支持",
    infrastructureBody:
      "生产部署使用 AWS 支撑的计算、存储、网络和可观测组件，并由 Sandock SaaS 层提供供应商支持。",
    legalTitle: "法务",
    legalBody:
      "这是用于发布规划的营销模拟页。正式发布前，AWS Marketplace 法务条款、退款政策、EULA 和隐私文档都需要完成审查。",
    reviewsTitle: "评价",
    reviewHeadline: "企业团队重视持久化 Agent 状态",
    reviewBody:
      "模拟买家信号：Sandock 通过保留代码、依赖、浏览器会话和终端工作状态，减少 Agent 在 review 周期中的重复执行。",
  },
  ja: {
    metaTitle: "AWS Marketplace モック | Sandock Kit",
    metaDescription:
      "Sandock の AWS Marketplace 掲載後を想定した SaaS 製品詳細ページのモックです。",
    back: "Kit に戻る",
    marketplace: "AWS Marketplace",
    title: "AI コーディング Agent 向け Sandock Cloud Sandboxes",
    soldBy: "販売元: Sandock AI",
    deployed: "AWS 上で稼働",
    saas: "Software as a Service (SaaS)",
    summary:
      "AI コーディング Agent のための永続 Docker ワークスペース。POSIX 互換ボリューム、ブラウザ自動化、ターミナル、プレビュー URL、使用量ベースのクラウドサンドボックス運用を提供します。",
    ctaPrimary: "購入オプションを見る",
    ctaSecondary: "プライベートオファーを依頼",
    ctaTertiary: "デモを依頼",
    rating: "4.8",
    reviews: "27 件のレビュー",
    vendorInsights: "Vendor Insights",
    nav: [
      ["overview", "概要"],
      ["features", "機能"],
      ["pricing", "料金"],
      ["legal", "法務"],
      ["usage", "利用方法"],
      ["resources", "リソース"],
      ["support", "サポート"],
      ["reviews", "レビュー"],
    ],
    overviewTitle: "概要",
    overview:
      "Sandock は AI コーディング Agent に、使い捨ての実行環境ではなく、長く使えるクラウドワークスペースを提供します。チームは Claude Code、Codex 系 Agent、ブラウザタスク、ビルドジョブ、MCP ツールを隔離 Docker サンドボックス内で実行し、長時間作業やレビューの間もファイルシステム状態を保持できます。",
    highlightsTitle: "ハイライト",
    highlights: [
      "実ファイルシステムを必要とするコーディング Agent 向けの 100% POSIX 互換 SSD / NFS ボリューム。",
      "長時間稼働する Docker サンドボックスで、タスク、リトライ、レビューの間もワークスペースを維持。",
      "ブラウザ自動化、ターミナル、プレビュー URL、MCP ホスティング、ファイル API を 1 つのプラットフォームに統合。",
    ],
    featureTitle: "機能",
    features: [
      {
        icon: Server,
        title: "永続 Agent ワークスペース",
        body: "隔離 Docker 環境でコーディング Agent を実行し、永続ボリュームと予測可能なワークスペースパスを利用できます。",
      },
      {
        icon: LockKeyhole,
        title: "安全な実行境界",
        body: "リソース制御、ネットワークポリシー、ライフサイクル制限、監査しやすいサンドボックス操作で信頼できないコードを扱えます。",
      },
      {
        icon: Cloud,
        title: "Marketplace 調達に対応",
        body: "AWS Marketplace SaaS 契約、プライベートオファー、企業請求、購買フローに合わせた提案ができます。",
      },
    ],
    detailsTitle: "詳細",
    details: [
      ["販売元", "Sandock AI"],
      ["カテゴリ", "Developer Tools, DevOps, Artificial Intelligence"],
      ["提供方法", "Software as a Service (SaaS)"],
      ["AWS 上で稼働", "はい"],
      ["対応リージョン", "米国東部、米国西部、欧州、アジアパシフィック"],
    ],
    purchaseDetails: [
      ["料金モデル", "契約 + 使用量"],
      ["無料トライアル", "14 日間"],
      ["Fulfillment", "SaaS URL"],
    ],
    pricingTitle: "料金",
    pricingDescription:
      "料金は契約期間、コミット済みサンドボックス容量、永続ストレージ、追加使用量に基づきます。エンタープライズ顧客はプライベートオファーを依頼できます。",
    pricingHeaders: ["ディメンション", "説明", "費用"],
    pricingRows: [
      ["Starter sandbox pack", "10 並列サンドボックス、100 GB 永続ボリュームプール", "$49.00 / 月"],
      ["Growth sandbox pack", "50 並列サンドボックス、1 TB 永続ボリュームプール", "$299.00 / 月"],
      [
        "Enterprise private offer",
        "カスタム並列数、SSO、コンプライアンスレビュー、専任サポート",
        "個別見積もり",
      ],
    ],
    supportTitle: "サポート",
    supportBody:
      "ベンダーサポート: marketplace@sandock.ai。エンタープライズ向けプライベートオファーには、共有 Slack チャンネル、オンボーディングレビュー、優先サンドボックス運用サポートが含まれます。",
    resourcesTitle: "リソース",
    resources: ["アーキテクチャ概要", "API ドキュメント", "セキュリティ概要"],
    usageTitle: "利用情報",
    deliveryTitle: "提供詳細",
    deliveryBody:
      "購入者は AWS Marketplace でサブスクライブした後、SaaS fulfillment URL からアカウント登録を完了し、Sandock の Web コンソールで使用量を管理します。",
    infrastructureTitle: "AWS インフラストラクチャサポート",
    infrastructureBody:
      "本番環境では AWS ベースのコンピュート、ストレージ、ネットワーク、可観測性コンポーネントを利用し、Sandock SaaS レイヤーのベンダーサポートを受けられます。",
    legalTitle: "法務",
    legalBody:
      "これはローンチ計画用のマーケティングモックです。正式公開前に、AWS Marketplace の法務条項、返金ポリシー、EULA、プライバシー文書の確認が必要です。",
    reviewsTitle: "レビュー",
    reviewHeadline: "エンタープライズチームは永続 Agent 状態を重視",
    reviewBody:
      "モック購入者シグナル: Sandock はコード、依存関係、ブラウザセッション、ターミナル作業をレビューサイクル間で保持し、Agent の再実行を減らします。",
  },
} as const;

type Locale = keyof typeof content;

const getContent = (lang: string) => content[(lang as Locale) in content ? (lang as Locale) : "en"];

export default function SandockAwsMarketplace() {
  const lang = "en";
  const page = getContent(lang);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <Link
            href={`/${lang}/kit`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {page.back}
          </Link>
        </div>
      </div>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_360px]">
          <div className="flex gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-card p-3">
              <Image
                src="/public-sandock/icon.svg"
                alt="Sandock logo"
                fill
                className="object-contain p-3"
              />
            </div>
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{page.marketplace}</span>
                <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
                  {page.saas}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-success-subtle px-2 py-1 text-xs text-success">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {page.deployed}
                </span>
              </div>
              <h1 className="max-w-4xl text-3xl font-bold leading-tight text-foreground md:text-4xl">
                {page.title}
              </h1>
              <p className="mt-3 text-sm font-medium text-muted-foreground">{page.soldBy}</p>
              <p className="mt-4 max-w-4xl text-base leading-7 text-muted-foreground">
                {page.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-foreground">{page.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">{page.reviews}</span>
                <span className="text-sm text-muted-foreground">{page.vendorInsights}</span>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-card p-5">
            <div className="space-y-3">
              <a
                href="#pricing"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {page.ctaPrimary}
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {page.ctaSecondary}
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {page.ctaTertiary}
              </button>
            </div>
            <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              {page.purchaseDetails.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <nav className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
          {page.nav.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section id="overview" className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">{page.overviewTitle}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{page.overview}</p>
            <h3 className="mt-8 text-lg font-semibold text-foreground">{page.highlightsTitle}</h3>
            <ul className="mt-4 space-y-3">
              {page.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="features" className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">{page.featureTitle}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {page.features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="pricing" className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">{page.pricingTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {page.pricingDescription}
            </p>
            <div className="mt-5 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr>
                    {page.pricingHeaders.map((header) => (
                      <th key={header} className="px-4 py-3 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.pricingRows.map((row) => (
                    <tr key={row[0]} className="border-t border-border">
                      <td className="px-4 py-4 font-medium text-foreground">{row[0]}</td>
                      <td className="px-4 py-4 text-muted-foreground">{row[1]}</td>
                      <td className="px-4 py-4 text-foreground">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="usage" className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">{page.usageTitle}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <Cloud className="h-5 w-5 text-primary" />
                  {page.deliveryTitle}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.deliveryBody}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  {page.infrastructureTitle}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {page.infrastructureBody}
                </p>
              </div>
            </div>
          </section>

          <section id="reviews" className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">{page.reviewsTitle}</h2>
            <div className="mt-5 rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">{page.reviewHeadline}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.reviewBody}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">{page.detailsTitle}</h2>
            <dl className="mt-4 space-y-4 text-sm">
              {page.details.map(([label, value]) => (
                <div key={label} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="resources" className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">{page.resourcesTitle}</h2>
            <div className="mt-4 space-y-3">
              {page.resources.map((item) => (
                <a
                  key={item}
                  href={`/${lang}/docs`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </section>

          <section id="support" className="rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <LifeBuoy className="h-5 w-5 text-primary" />
              {page.supportTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.supportBody}</p>
          </section>

          <section id="legal" className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">{page.legalTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.legalBody}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
