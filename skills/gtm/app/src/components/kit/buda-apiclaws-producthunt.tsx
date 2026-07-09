import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  KeyRound,
  MonitorCog,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type Localized, pickLocale, useGtmLocale } from "../../data";
import Link from "../../next-link-shim";

interface CopyDraft {
  title: string;
  value: string;
}

interface ShareDraft extends CopyDraft {
  channel: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

const tLocale = (value: Localized<string>, locale: Parameters<typeof pickLocale<string>>[1]) =>
  pickLocale(value, locale) ?? "";

const productHuntCopy = {
  title: {
    en: "API Claws: Cloud AI agents for your product",
    "zh-CN": "API Claws：给你的产品接入云端 AI Agent",
  },
  tagline: {
    en: "Add managed AI agents with Drive memory, sessions, and runtime through Buda's OpenAPI",
    "zh-CN": "通过 Buda OpenAPI 接入带 Drive 记忆、Sessions 和运行时的托管 AI Agent",
  },
  shortDescription: {
    en: "API Claws is Buda's developer-facing Agent API. Create hosted API agents, give them durable Drive knowledge, start chat sessions, embed them in apps or devices, and let Buda handle model access, runtime, tenant isolation, and wake/sleep orchestration.",
    "zh-CN":
      "API Claws 是 Buda 面向开发者的 Agent API。你可以创建托管 API Agent，给它持久 Drive 知识，启动会话，把它嵌入 app 或设备，并让 Buda 处理模型访问、运行时、租户隔离和唤醒/休眠调度。",
  },
  makerComment: {
    en: `Hey Product Hunt,

We built API Claws for developers who want an AI agent inside their product, but do not want to build the entire agent backend.

A raw model API gives you completions. API Claws gives you a managed agent capability layer:

- API Agents for role, instructions, and runtime identity
- Drive files for durable knowledge and memory
- Sessions for conversations and async runs
- Spaces for tenant, customer, or device isolation
- Embed URLs for frontend-safe chat experiences

The developer path is intentionally small: create an agent, put files into its Drive, start a session, and fetch the session result.

POST /api/v1/api-agents
PUT /api/v1/api-agents/{agentId}/drive/files
POST /api/v1/api-agents/{agentId}/sessions
GET /api/v1/api-agents/{agentId}/sessions/{sessionId}

That means you can add a hosted agent to your own product without first understanding the full Buda workspace UI.

This is useful for smart hardware, SaaS copilots, customer support widgets, browser extensions, vertical apps, and internal enterprise tools.

Our belief is that many products will need an agent layer, not just a model endpoint. The agent should remember files, run with isolated context, sleep when idle, wake on demand, and stay visible to the developer operating it.

Would love feedback from developers building AI-native products: what would you rather outsource first, the model layer, the session layer, the knowledge layer, or the runtime layer?`,
    "zh-CN": `Hey Product Hunt,

我们做 API Claws，是给那些想把 AI Agent 放进自己产品里、但不想从零搭完整 agent 后端的开发者。

裸模型 API 给你的是 completions。API Claws 给你的是一层托管好的 Agent 能力：

- API Agents：角色、指令和运行身份
- Drive files：持久知识和记忆
- Sessions：对话和异步运行
- Spaces：租户、客户或设备隔离
- Embed URLs：前端安全的聊天体验

开发者路径刻意保持很小：创建 agent、把文件放进 Drive、启动 session、读取 session 结果。

POST /api/v1/api-agents
PUT /api/v1/api-agents/{agentId}/drive/files
POST /api/v1/api-agents/{agentId}/sessions
GET /api/v1/api-agents/{agentId}/sessions/{sessionId}

这意味着开发者不需要先理解完整的 Buda 工作区 UI，就可以把一个托管 agent 接进自己的产品。

它适合智能硬件、SaaS copilot、客服组件、浏览器插件、垂直应用和企业内部工具。

我们的判断是，很多产品需要的不只是一个模型端点，而是一层 agent layer。Agent 应该能记住文件、在隔离上下文中运行、空闲时休眠、按需唤醒，并且对负责运营它的开发者保持可见。

很想听听正在做 AI-native 产品的开发者反馈：你最想先外包掉哪一层，模型层、session 层、知识层，还是 runtime 层？`,
  },
};

const commentDrafts: Localized<CopyDraft[]> = {
  en: [
    {
      title: "Agent layer",
      value:
        "Congrats on the launch. The distinction between raw model API and managed agent layer is the strongest part for me. Sessions, Drive memory, runtime, and tenant isolation are where a lot of product teams quietly lose time.",
    },
    {
      title: "Vertical apps",
      value:
        "This feels especially useful for vertical app builders. A finance, education, support, or field-service product usually needs a persistent agent with domain files and user context, not just a one-off completion endpoint.",
    },
    {
      title: "Hardware use case",
      value:
        "The smart hardware angle is clear. Let the device handle input/output, and let the cloud agent handle memory, reasoning, and updates. Much cleaner than pushing intelligence into firmware.",
    },
    {
      title: "Drive memory",
      value:
        "Drive-based knowledge is the bit I would want first. Upload manuals, policies, product docs, or customer state once, then let sessions use that durable context instead of repeating giant prompts.",
    },
    {
      title: "Embed API",
      value:
        "Short-lived embed URLs are a practical touch. A web app, extension, or mini program should not hold the main API key just to talk to an agent.",
    },
    {
      title: "Developer portal",
      value:
        "I like that API-created resources stay visible in the developer portal. When agents, sessions, computers, and drives are real infrastructure, developers need to inspect them.",
    },
  ],
  "zh-CN": [
    {
      title: "Agent layer",
      value:
        "恭喜发布。对我来说，裸模型 API 和托管 agent layer 的区别是最关键的点。Sessions、Drive memory、runtime 和租户隔离，正是很多产品团队会悄悄消耗大量时间的地方。",
    },
    {
      title: "垂直应用",
      value:
        "这对垂直应用开发者尤其有用。金融、教育、客服、现场服务这类产品通常需要一个带领域文件和用户上下文的持久 agent，而不是一次性的 completion endpoint。",
    },
    {
      title: "智能硬件场景",
      value:
        "智能硬件这个角度很清晰。设备负责输入输出，云端 agent 负责记忆、推理和更新，比把智能都塞进固件里干净很多。",
    },
    {
      title: "Drive memory",
      value:
        "Drive-based knowledge 是我最想先用的部分。手册、策略、产品文档或客户状态上传一次，sessions 就能复用持久上下文，不需要反复塞巨大 prompt。",
    },
    {
      title: "Embed API",
      value:
        "短期 embed URL 是个很实用的细节。Web app、浏览器插件或小程序不应该为了和 agent 对话就持有主 API key。",
    },
    {
      title: "开发者门户",
      value:
        "我喜欢 API 创建出来的资源还能在 developer portal 里看见。Agents、sessions、computers、drives 一旦成为真实基础设施，开发者就需要能检查它们。",
    },
  ],
};

const launchShareDrafts: Localized<ShareDraft[]> = {
  en: [
    {
      channel: "X thread",
      title: "Founder launch thread",
      value: `Most products do not need another raw LLM endpoint.

They need an agent layer.

Today we are preparing API Claws: Buda's OpenAPI for creating cloud AI agents with:

- API Agents
- Drive memory
- Chat sessions
- tenant Spaces
- frontend-safe embed URLs
- managed runtime and wake/sleep orchestration

The flow:

POST /api/v1/api-agents
PUT /api/v1/api-agents/{agentId}/drive/files
POST /api/v1/api-agents/{agentId}/sessions
GET /api/v1/api-agents/{agentId}/sessions/{sessionId}

Use it to add AI agents to SaaS copilots, smart hardware, support widgets, browser extensions, vertical apps, or internal tools.

Raw model APIs return text.
API Claws gives your product an operating agent.`,
    },
    {
      channel: "LinkedIn",
      title: "Developer audience post",
      value: `We are preparing API Claws, Buda's developer-facing Agent API.

The idea is simple: product teams should not have to build their own model orchestration, session management, knowledge base, tenant isolation, runtime, and wake/sleep infrastructure just to add an AI agent to their app.

API Claws exposes hosted API Agents through Buda OpenAPI. Developers can create an agent, seed its Drive with durable knowledge, start sessions, read results, and embed a frontend-safe chat surface when needed.

This is designed for SaaS copilots, vertical apps, smart hardware, customer support widgets, browser extensions, and internal tools.`,
    },
    {
      channel: "Community",
      title: "Short launch note",
      value: `API Claws is Buda's managed Agent API.

Instead of integrating a raw model endpoint and building the rest yourself, you can create hosted API Agents with Drive memory, sessions, tenant isolation, and embed URLs.

Useful for apps, devices, widgets, and SaaS products that need a real agent layer.`,
    },
    {
      channel: "WeChat",
      title: "中文介绍",
      value: `我们在准备 API Claws 的 Product Hunt 页面。

一句话：API Claws 是 Buda 面向开发者的 Agent API。

它不是裸 LLM API，而是一层托管好的 Agent 能力层：

- API Agents：Agent 的角色、指令和运行身份
- Drive：长期知识库和记忆
- Sessions：对话和异步运行
- Spaces：客户、设备或租户隔离
- Embed URLs：前端安全的嵌入式聊天

适合 SaaS copilot、智能硬件、客服组件、浏览器插件、垂直应用和企业内部系统。`,
    },
  ],
  "zh-CN": [
    {
      channel: "X thread",
      title: "Founder launch thread",
      value: `大多数产品不需要再接一个裸 LLM endpoint。

它们需要的是一层 agent layer。

我们正在准备 API Claws：Buda 用来创建云端 AI agents 的 OpenAPI：

- API Agents
- Drive memory
- Chat sessions
- tenant Spaces
- frontend-safe embed URLs
- 托管 runtime 和 wake/sleep 调度

主流程：

POST /api/v1/api-agents
PUT /api/v1/api-agents/{agentId}/drive/files
POST /api/v1/api-agents/{agentId}/sessions
GET /api/v1/api-agents/{agentId}/sessions/{sessionId}

你可以用它给 SaaS copilots、智能硬件、客服组件、浏览器插件、垂直应用或内部工具接入 AI agents。

裸模型 API 返回文本。
API Claws 给你的产品一个可运营的 agent。`,
    },
    {
      channel: "LinkedIn",
      title: "Developer audience post",
      value: `我们正在准备 API Claws，Buda 面向开发者的 Agent API。

想法很简单：产品团队不应该为了在自己的 app 里加入一个 AI agent，就必须自己搭模型编排、session 管理、知识库、租户隔离、runtime 和 wake/sleep 基础设施。

API Claws 通过 Buda OpenAPI 暴露托管 API Agents。开发者可以创建 agent，把持久知识放进 Drive，启动 sessions，读取结果，并在需要时嵌入前端安全的聊天界面。

它面向 SaaS copilots、垂直应用、智能硬件、客服组件、浏览器插件和企业内部工具。`,
    },
    {
      channel: "Community",
      title: "Short launch note",
      value: `API Claws 是 Buda 的托管 Agent API。

相比接一个裸模型 endpoint 然后自己搭剩下所有东西，你可以直接创建带 Drive memory、sessions、租户隔离和 embed URLs 的 hosted API Agents。

适合需要真实 agent layer 的 apps、devices、widgets 和 SaaS 产品。`,
    },
    {
      channel: "WeChat",
      title: "中文介绍",
      value: `我们在准备 API Claws 的 Product Hunt 页面。

一句话：API Claws 是 Buda 面向开发者的 Agent API。

它不是裸 LLM API，而是一层托管好的 Agent 能力层：

- API Agents：Agent 的角色、指令和运行身份
- Drive：长期知识库和记忆
- Sessions：对话和异步运行
- Spaces：客户、设备或租户隔离
- Embed URLs：前端安全的嵌入式聊天

适合 SaaS copilot、智能硬件、客服组件、浏览器插件、垂直应用和企业内部系统。`,
    },
  ],
};

const faqItems: Localized<FaqItem[]> = {
  en: [
    {
      question: "Is API Claws just another LLM API?",
      answer:
        "No. The positioning is managed Agent capability layer: model access, runtime, Drive knowledge, sessions, tenant isolation, and wake/sleep orchestration are handled together.",
    },
    {
      question: "Why is the public REST resource called API Agents?",
      answer:
        "API Claws is the product and marketing name. The implementation-facing REST resource is `/api/v1/api-agents`, which is versioned, plural, and clear for developers.",
    },
    {
      question: "Who is it for?",
      answer:
        "Smart hardware makers, SaaS builders, chat apps, browser extensions, customer support widgets, vertical app developers, and internal enterprise tools.",
    },
    {
      question: "What should developers put in Drive?",
      answer:
        "Manuals, product docs, policies, FAQs, lesson plans, tenant context, device state snapshots, and durable working memory the agent should reuse across sessions.",
    },
  ],
  "zh-CN": [
    {
      question: "API Claws 只是另一个 LLM API 吗？",
      answer:
        "不是。它的定位是托管 Agent 能力层：模型访问、runtime、Drive 知识、sessions、租户隔离和 wake/sleep 调度会一起处理。",
    },
    {
      question: "为什么公开 REST 资源叫 API Agents？",
      answer:
        "API Claws 是产品和营销名称。面向实现的 REST 资源是 `/api/v1/api-agents`，有版本前缀、复数资源名，对开发者更清晰。",
    },
    {
      question: "它适合谁？",
      answer:
        "智能硬件厂商、SaaS 开发者、聊天应用、浏览器插件、客服组件、垂直应用开发者和企业内部工具团队。",
    },
    {
      question: "开发者应该把什么放进 Drive？",
      answer:
        "手册、产品文档、策略、FAQ、课程计划、租户上下文、设备状态快照，以及 agent 需要跨 sessions 复用的长期工作记忆。",
    },
  ],
};

const assetChecklist: Localized<string[]> = {
  en: [
    "Nine 1270x760 Product Hunt gallery images generated from source, matching the Busabase SVG-to-PNG pipeline",
    "HyperFrames Product Hunt preview source in videos/buda/api-claws-producthunt",
    "Product Hunt title, tagline, short description, and maker comment",
    "Supporter comment drafts covering agent layer, vertical apps, hardware, Drive, embed, and portal",
    "Distribution copy for X, LinkedIn, community, and WeChat",
    "FAQ aligned with docs/use-cases/api-claws and OpenAPI route naming",
  ],
  "zh-CN": [
    "9 张 1270x760 Product Hunt gallery 图，沿用 Busabase 的 SVG-to-PNG 生成流程",
    "HyperFrames Product Hunt preview 源文件位于 videos/buda/api-claws-producthunt",
    "Product Hunt 标题、tagline、短描述和 maker comment",
    "覆盖 agent layer、垂直应用、硬件、Drive、embed、portal 的 supporter comment drafts",
    "X、LinkedIn、community 和 WeChat 的分发文案",
    "FAQ 对齐 docs/use-cases/api-claws 和 OpenAPI 路由命名",
  ],
};

const pageCopy = {
  copy: { en: "Copy", "zh-CN": "复制" },
  copied: { en: "Copied", "zh-CN": "已复制" },
  headline: {
    en: "Buda API Claws: Cloud AI agents for your product",
    "zh-CN": "Buda API Claws：给你的产品接入云端 AI Agent",
  },
  subhead: {
    en: "Buda's managed Agent API for apps, devices, widgets, and SaaS copilots.",
    "zh-CN": "Buda 面向 app、设备、组件和 SaaS copilot 的托管 Agent API。",
  },
  developerLaunchKit: { en: "Developer launch kit", "zh-CN": "开发者 launch kit" },
  productLine: { en: "Buda product line", "zh-CN": "Buda 产品线" },
  visitWebsite: { en: "Visit website", "zh-CN": "访问官网" },
  addToCollection: { en: "Add to collection", "zh-CN": "加入收藏" },
  descriptionOne: {
    en: "API Claws is Buda's developer-facing Agent API. Create hosted API agents, give them durable Drive knowledge, start chat sessions, embed them in apps or devices, and let Buda handle model access, runtime, tenant isolation, and wake/sleep orchestration.",
    "zh-CN":
      "API Claws 是 Buda 面向开发者的 Agent API。你可以创建托管 API Agent，给它持久 Drive 知识，启动聊天 sessions，把它嵌入 app 或设备，并让 Buda 处理模型访问、runtime、租户隔离和 wake/sleep 调度。",
  },
  descriptionTwo: {
    en: "It is built for smart hardware, SaaS copilots, customer support widgets, browser extensions, vertical apps, and internal tools that need a real agent layer rather than another raw model endpoint.",
    "zh-CN":
      "它面向智能硬件、SaaS copilot、客服组件、浏览器插件、垂直应用和企业内部工具，适合那些需要真实 agent layer，而不是又一个裸模型端点的产品。",
  },
  overview: { en: "Overview", "zh-CN": "总览" },
  launches: { en: "Launches", "zh-CN": "发布" },
  reviews: { en: "Reviews", "zh-CN": "评论" },
  alternatives: { en: "Alternatives", "zh-CN": "替代品" },
  customers: { en: "Customers", "zh-CN": "客户" },
  more: { en: "More", "zh-CN": "更多" },
  budaMainKit: { en: "Buda main PH kit", "zh-CN": "Buda 主 Product Hunt kit" },
  apiClawsDocs: { en: "API Claws docs", "zh-CN": "API Claws 文档" },
  makerComment: { en: "Maker Comment", "zh-CN": "Maker 评论" },
  listingCopy: { en: "Product Hunt Listing Copy", "zh-CN": "Product Hunt Listing 文案" },
  listingCopyHelp: {
    en: "Copy-ready title, tagline, and short description for the API Claws Product Hunt draft.",
    "zh-CN": "API Claws Product Hunt 草稿可直接复制的标题、tagline 和短描述。",
  },
  title: { en: "Title", "zh-CN": "标题" },
  tagline: { en: "Tagline", "zh-CN": "Tagline" },
  shortDescription: { en: "Short description", "zh-CN": "短描述" },
  commentDrafts: { en: "Product Hunt Comment Drafts", "zh-CN": "Product Hunt 评论草稿" },
  commentDraftsHelp: {
    en: "Supporter comments that each reinforce a different part of the API Claws story.",
    "zh-CN": "每条 supporter comment 对应强化 API Claws 故事里的一个不同角度。",
  },
  launchShareCopy: { en: "Launch Share Copy", "zh-CN": "Launch 分享文案" },
  launchShareHelp: {
    en: "Founder, community, and Chinese launch notes for the first wave of promotion.",
    "zh-CN": "用于第一波推广的 founder、community 和中文 launch notes。",
  },
  faq: { en: "FAQ", "zh-CN": "FAQ" },
  faqHelp: {
    en: "Keep the route naming and product framing crisp: API Claws is the product; API Agents is the REST resource.",
    "zh-CN": "保持路由命名和产品定位清楚：API Claws 是产品名；API Agents 是 REST 资源名。",
  },
  launchAssetChecklist: { en: "Launch asset checklist", "zh-CN": "Launch 资产清单" },
  apiKeyNote: {
    en: "API key authenticates OpenAPI calls.",
    "zh-CN": "API key 用于认证 OpenAPI 调用。",
  },
  driveNote: { en: "Drive stores durable knowledge.", "zh-CN": "Drive 存放持久知识。" },
  runtimeNote: {
    en: "Buda handles the agent runtime.",
    "zh-CN": "Buda 负责托管 agent runtime。",
  },
  companyInfo: { en: "Company Info", "zh-CN": "公司信息" },
  website: { en: "Website", "zh-CN": "官网" },
  openApi: { en: "OpenAPI", "zh-CN": "OpenAPI" },
  motionSource: { en: "Motion Source", "zh-CN": "Motion 源文件" },
} as const;

// Final 1270x760 gallery images exported from the HyperFrames DOM preview.
// English is the Product Hunt-facing set; Chinese is a GTM review-only preview set.
// Source: videos/buda/api-claws-producthunt/index.html
// Output: apps/buda/public/gallery/api-claws*.png
const gallerySlides = [
  {
    id: 1,
    title: "API Claws Hero",
    caption: "Cloud AI agents for your product",
    image: "hero.png",
  },
  {
    id: 2,
    title: "Developer Center",
    caption: "Developer portal overview",
    image: "developer-center.png",
  },
  {
    id: 3,
    title: "Hosted API Agents",
    caption: "Agents as product infrastructure",
    image: "api-agents.png",
  },
  {
    id: 4,
    title: "Drive Memory",
    caption: "Upload durable agent knowledge",
    image: "drive-memory.png",
  },
  {
    id: 5,
    title: "Sessions And Runs",
    caption: "Every agent run leaves a record",
    image: "sessions-runs.png",
  },
  {
    id: 6,
    title: "Agent Computers",
    caption: "Managed runtime visibility",
    image: "agent-computers.png",
  },
  {
    id: 7,
    title: "OpenAPI Reference",
    caption: "Versioned REST surface",
    image: "openapi-reference.png",
  },
  {
    id: 8,
    title: "Session API Flow",
    caption: "Start tasks and watch them live",
    image: "embed-url-flow.png",
  },
  {
    id: 9,
    title: "Build With API Claws",
    caption: "Docs and OpenAPI CTA",
    image: "slide-cta.png",
  },
];

function CopyCard({
  title,
  value,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  multiline = false,
}: {
  title: string;
  value: string;
  copyLabel?: string;
  copiedLabel?: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <p
        className={
          multiline
            ? "whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
            : "text-sm leading-6 text-muted-foreground"
        }
      >
        {value}
      </p>
    </article>
  );
}

function GalleryCarousel() {
  const locale = useGtmLocale();
  const imageBase =
    locale === "zh-CN" ? "/public-buda/gallery/api-claws-zh" : "/public-buda/gallery/api-claws";
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
      else if (e.key === "ArrowLeft" && selectedImage > 0) setSelectedImage(selectedImage - 1);
      else if (e.key === "ArrowRight" && selectedImage < gallerySlides.length - 1) {
        setSelectedImage(selectedImage + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  return (
    <>
      <div>
        <div
          id="apiclaws-gallery-carousel"
          className="flex gap-5 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={(e) => {
            const slideWidth = 368 + 20;
            setCurrentSlide(Math.round(e.currentTarget.scrollLeft / slideWidth));
          }}
        >
          {gallerySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSelectedImage(index)}
              className="group flex-shrink-0 cursor-pointer text-left"
              style={{ width: "368px" }}
            >
              <div
                className="relative overflow-hidden rounded-xl border border-border bg-card transition-all group-hover:border-primary/40 group-hover:shadow-lg"
                style={{ width: "368px", height: "220px" }}
              >
                <img
                  src={`${imageBase}/${slide.image}`}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 px-1 text-xs font-medium text-muted-foreground">
                {slide.id}. {slide.caption}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {gallerySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => {
                const container = document.getElementById("apiclaws-gallery-carousel");
                if (container) container.scrollTo({ left: (368 + 20) * index, behavior: "smooth" });
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${slide.id}`}
            />
          ))}
        </div>
      </div>

      {selectedImage !== null && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") setSelectedImage(null);
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {selectedImage > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {selectedImage < gallerySlides.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          <div className="relative aspect-[1270/760] max-h-[82vh] w-[92vw] max-w-[1270px] overflow-hidden rounded-lg">
            <img
              src={`${imageBase}/${gallerySlides[selectedImage].image}`}
              alt={gallerySlides[selectedImage].title}
              className="h-full w-full object-contain bg-white"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="mt-3 text-center text-sm font-medium text-white/80">
              {gallerySlides[selectedImage].title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function BudaApiClawsProductHunt() {
  const locale = useGtmLocale();
  const t = (value: Localized<string>) => tLocale(value, locale);
  const copy = {
    title: t(productHuntCopy.title),
    tagline: t(productHuntCopy.tagline),
    shortDescription: t(productHuntCopy.shortDescription),
    makerComment: t(productHuntCopy.makerComment),
  };
  const localizedCommentDrafts = pickLocale(commentDrafts, locale) ?? [];
  const localizedLaunchShareDrafts = pickLocale(launchShareDrafts, locale) ?? [];
  const localizedFaqItems = pickLocale(faqItems, locale) ?? [];
  const localizedAssetChecklist = pickLocale(assetChecklist, locale) ?? [];
  const copyButtonLabels = {
    copy: t(pageCopy.copy),
    copied: t(pageCopy.copied),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
                <img
                  src="/public-buda/icon.svg"
                  alt="Buda Logo"
                  className="h-full w-full object-contain p-2"
                />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                {t(pageCopy.headline)}
              </h1>
              <p className="mb-2 text-base text-muted-foreground">{t(pageCopy.subhead)}</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">5.0</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t(pageCopy.developerLaunchKit)}
                </span>
                <span className="text-sm text-muted-foreground">{t(pageCopy.productLine)}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:w-auto">
            <Link
              href="https://buda.im"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              {t(pageCopy.visitWebsite)}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
            >
              {t(pageCopy.addToCollection)}
            </button>
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
          <span>AI</span>
          <span>·</span>
          <span>Developer Tools</span>
          <span>·</span>
          <span>API</span>
          <span>·</span>
          <span>Productivity</span>
        </div>

        <div className="mb-8">
          <div className="space-y-3 text-base leading-relaxed text-foreground">
            <p>{t(pageCopy.descriptionOne)}</p>
            <p>{t(pageCopy.descriptionTwo)}</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground"
          >
            {t(pageCopy.overview)}
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(pageCopy.launches)} <span className="ml-1">1</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(pageCopy.reviews)} <span className="ml-1">0</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(pageCopy.alternatives)}
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(pageCopy.customers)}
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            {t(pageCopy.more)}
          </button>
        </div>

        <div className="mb-8">
          <GalleryCarousel />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/launch-pages/buda/producthunt"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Star className="size-4" />
              {t(pageCopy.budaMainKit)}
            </Link>
            <Link
              href="/docs/use-cases/api-claws"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(pageCopy.apiClawsDocs)}
            </Link>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground">{t(pageCopy.makerComment)}</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {copy.makerComment}
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">{t(pageCopy.listingCopy)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(pageCopy.listingCopyHelp)}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CopyCard title={t(pageCopy.title)} value={copy.title} {...copyButtonLabels} />
            <CopyCard title={t(pageCopy.tagline)} value={copy.tagline} {...copyButtonLabels} />
            <div className="lg:col-span-2">
              <CopyCard
                title={t(pageCopy.shortDescription)}
                value={copy.shortDescription}
                {...copyButtonLabels}
              />
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">{t(pageCopy.commentDrafts)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(pageCopy.commentDraftsHelp)}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localizedCommentDrafts.map((draft) => (
              <CopyCard
                key={draft.title}
                title={draft.title}
                value={draft.value}
                {...copyButtonLabels}
              />
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">
              {t(pageCopy.launchShareCopy)}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(pageCopy.launchShareHelp)}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {localizedLaunchShareDrafts.map((draft) => (
              <CopyCard
                key={draft.title}
                title={`${draft.channel} - ${draft.title}`}
                value={draft.value}
                multiline
                {...copyButtonLabels}
              />
            ))}
          </div>
        </div>

        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-bold text-foreground">{t(pageCopy.faq)}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(pageCopy.faqHelp)}</p>
            </div>
            <div className="space-y-3">
              {localizedFaqItems.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-lg border border-border/70 bg-card p-4 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
          <aside className="rounded-lg border border-border/70 bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <MonitorCog className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                {t(pageCopy.launchAssetChecklist)}
              </h2>
            </div>
            <ul className="space-y-3">
              {localizedAssetChecklist.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <Check className="mt-1 size-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3 rounded-md border border-border/70 bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                {t(pageCopy.apiKeyNote)}
              </div>
              <div className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                {t(pageCopy.driveNote)}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                {t(pageCopy.runtimeNote)}
              </div>
            </div>
          </aside>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">{t(pageCopy.companyInfo)}</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t(pageCopy.website)}</div>
              <Link
                href="https://buda.im"
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                buda.im
              </Link>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t(pageCopy.openApi)}</div>
              <Link href="/api/v1/openapi.json" className="text-sm text-primary hover:underline">
                /api/v1/openapi.json
              </Link>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t(pageCopy.motionSource)}</div>
              <div className="text-sm text-foreground">videos/buda/api-claws-producthunt</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
