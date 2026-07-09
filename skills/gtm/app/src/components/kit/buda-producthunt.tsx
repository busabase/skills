import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "../../next-link-shim";

/**
 * Gallery images are generated from Remotion video frames.
 *
 * Source: videos/buda/src/buda-producthunt/BudaProductHunt.tsx
 *
 * To regenerate gallery images after updating Remotion slides:
 * 1. cd apps/buda
 * 2. pnpm gallery:generate
 *
 * This will capture frames from the Remotion composition and save them to public/gallery/
 *
 * ⚠️ IMPORTANT: Run this command whenever you modify the Remotion slides to keep gallery in sync!
 */
const gallerySlides = [
  {
    id: 1,
    title: "Agents as a Company",
    image: "/public-buda/gallery/slide0-agents-company.png",
    caption: "From goals to issues to teams, one AI company runs in a single workspace.",
  },
  {
    id: 2,
    title: "No Mac Mini Needed",
    image: "/public-buda/gallery/slide1-no-mac-mini.png",
    caption: "Before: 8 Linux machines, 2 Mac Minis, 30+ chat channels. After: one browser tab.",
  },
  {
    id: 3,
    title: "Watch Your Agents Work. Not Just Hope They Did.",
    image: "/public-buda/gallery/slide2-watch-agents.png",
    caption:
      "Every agent has a live Browser and Terminal. See exactly what it's doing, in real time. No black box.",
  },
  {
    id: 4,
    title: "Meet the Organizer and the Claws",
    image: "/public-buda/gallery/slide3-organizer-claws.png",
    caption:
      "🐰 Buda Organizer schedules and coordinates. 🦞 Claw Computer runs the work — isolated sandboxes on Kubernetes, persistent disks, automatic sleep when idle.",
  },
  {
    id: 5,
    title: "Agents with Memory. Your Drive is Their Brain.",
    image: "/public-buda/gallery/slide4-drive-memory.png",
    caption:
      "Unlike chat-based agents that forget everything, Buda agents work from a persistent Drive — files, decisions, task history. They get smarter the longer they run.",
  },
  {
    id: 6,
    title: "Sell Your Skills, Agents and Teams",
    image: "/public-buda/gallery/slide5-marketplace.png",
    caption:
      "Buda Marketplace lets developers package their work into Skills, Agents, and Teams — and let anyone recruit them in one click.",
  },
  {
    id: 7,
    title: "Your Agents, Wherever Your Team Works.",
    image: "/public-buda/gallery/slide6-everywhere-agents.png",
    caption:
      "Connect Buda agents to Slack, Discord, WeChat, Microsoft Teams — or use the web app. Same agent, every channel.",
  },
  {
    id: 8,
    title: "Build Your Agent Company",
    image: "/public-buda/gallery/slide-cta.png",
    caption: "No Mac Mini. No setup. No model keys. Try It Free at buda.im",
  },
];

const toBudaAsset = (path: string, assetBasePath: string) =>
  `${assetBasePath}${path.replace(/^\/public-buda/, "")}`;

const productHuntCommentDrafts = [
  {
    title: "Agent company",
    comment:
      "Congrats on the launch! The 'agent company' framing is what makes Buda click for me. Most AI tools still feel like one-off chats, but this feels more like a real workspace where agents have roles, files, and visible work.",
  },
  {
    title: "Ops angle",
    comment:
      "Love that this is not only aimed at engineers. Ops, HR, legal, and admin teams are the ones drowning in files every day. Curious which team type has been the easiest to onboard so far?",
  },
  {
    title: "No Mac Mini",
    comment:
      "The no-Mac-Mini part is very real. Running agents across local machines, random chat channels, and setup scripts gets messy fast. Putting the browser, terminal, and persistent storage in one cloud workspace is a big UX win.",
  },
  {
    title: "Watch work happen",
    comment:
      "The live browser and terminal are my favorite part. I do not want to assign an agent a task and just hope it worked. Watching the work happen makes the whole thing feel much more trustworthy.",
  },
  {
    title: "Drive memory",
    comment:
      "Buda Drive is a strong idea. Agent memory should not just be chat history. Files, versions, task history, and source links feel like the kind of memory a real team can actually depend on.",
  },
  {
    title: "Marketplace",
    comment:
      "The marketplace angle is exciting. If someone builds a great workflow once and other teams can recruit it as a Skill, Agent, or Team, that could make agent adoption much less custom and much more repeatable.",
  },
  {
    title: "AI manager",
    comment:
      "This feels closer to the 'AI manager' future than another chatbot. Humans set the direction, agents do the repetitive work, and the workspace keeps the record. That is a much more useful framing.",
  },
  {
    title: "Channels",
    comment:
      "I like that Buda does not force everyone into one app. Slack, Discord, WeChat, Teams, and web as entry points to the same agents is much closer to how teams actually work.",
  },
  {
    title: "Non-technical users",
    comment:
      "A lot of agent products still assume the user is technical. I like that Buda is thinking about the people who manage files, policies, contracts, and operations every day. That is where a lot of hidden company work lives.",
  },
  {
    title: "Sources matter",
    comment:
      "Grounded answers with source files are a big deal. If an agent answers a policy or contract question, I want to know exactly where it came from and whether the file is current.",
  },
  {
    title: "Beyond chat",
    comment:
      "This feels like the shift from chatting with AI to operating an AI system. Goals, issues, Drive, agents, teams, and live work surfaces are the pieces I would expect if agents are going to do real company work.",
  },
  {
    title: "Persistent state",
    comment:
      "Persistent state is underrated. If an agent is doing meaningful work, it needs files, logs, history, and continuity. Disposable sessions are fine for demos, but not for real tasks.",
  },
  {
    title: "Organizer",
    comment:
      "The Organizer concept makes sense. Multi-agent work is not just about having more bots. Someone has to schedule, route, and coordinate the work, so making that a first-class part of the product is smart.",
  },
  {
    title: "Founder use case",
    comment:
      "I can see founders using this just to stop being the person everyone asks for the same file, process, or decision history. Turning scattered company memory into something the team can actually query is valuable.",
  },
  {
    title: "Observability",
    comment:
      "Agent observability is going to matter a lot. Seeing what happened in the terminal, browser, Drive, and task history is the difference between trusting an agent and guessing what it did.",
  },
  {
    title: "One workspace",
    comment:
      "The 'one browser tab' promise is compelling. If Buda can reduce the mess of chat channels, local machines, file drives, and agent logs into one operational workspace, that is a huge quality-of-life improvement.",
  },
  {
    title: "Skills",
    comment:
      "I like the Skill idea because the value is not just the model. It is the repeatable workflow around a sales task, HR question, legal review, or ops request. Packaging that is powerful.",
  },
  {
    title: "Data safety",
    comment:
      "The Drive safety details matter: version history, trash, delete protection, backups, and source links. For ops, HR, and legal workflows, using the wrong file is not a small mistake.",
  },
  {
    title: "Real usage",
    comment:
      "The launch story feels grounded because it comes from actually running a company with agents. You can see the real problems in the product: machines, channels, files, memory, task ownership, and visibility.",
  },
  {
    title: "Question",
    comment:
      "Congrats team. What is the first workflow you recommend people try in Buda: file Q&A, agent task execution, marketplace teams, or something else?",
  },
];

const launchShareDrafts = [
  {
    channel: "WeChat Group",
    title: "微信群拉票",
    copy: `👋 大家好，我们的产品 Buda 今天在 Product Hunt 正式上线啦，想请大家帮忙支持一下 🙏

巧的是，今天 Anthropic 也发布了 Claude Managed Agents。定位不一样：
- Claude Managed Agents：给开发者用，还是要写代码配置
- Buda：给公司里的非开发者用，行政、运营、销售，打开网站点 hire，AI 员工就开工

我们用 30 只 Claw agents 跑了整家公司。每只 agent 都有自己的电脑、浏览器、硬盘，不是聊天机器人，是真的在干活。两周后，40% 的同事不知道周报写什么了，因为 agents 把他们的活全干完了。

帮忙点个 upvote + 留个评论，对我们非常重要 🙏
https://www.producthunt.com/products/buda

🎁 专属福利：注册 buda.im 后输入 promo code DAY1-PHLAUNCH，立得 $10 / 1000 credits，可以直接用来跑第一只 agent。

如果你们也有 launch / 项目需要支持，欢迎告诉我，我们互相支持 🤝`,
  },
  {
    channel: "WeChat DM",
    title: "私发熟人",
    copy: `嘿，我们产品今天在 Product Hunt 上线了，能帮我投个票吗？🙏

点这个链接 upvote 一下就行，30 秒：
https://www.producthunt.com/products/buda

产品叫 Buda，一句话：用 AI agents 帮你开公司的平台。每个 agent 有自己的电脑、浏览器和硬盘，真的在跑任务，不是聊天机器人。

另外有个福利给你：注册 buda.im 用 code DAY1-PHLAUNCH，送 $10 / 1000 credits，可以直接试用。

谢谢你！`,
  },
  {
    channel: "WeChat DM",
    title: "私发半熟朋友",
    copy: `Hi，打扰一下 🙏

我们做了个产品叫 Buda，今天在 Product Hunt 上线。核心就一句话：用 AI agents 帮你开公司。每个 agent 有自己的电脑和硬盘，真的在跑任务，不是聊天那种。

我们是小团队，PH 的票数对我们很重要，能帮忙点个 upvote 吗？
https://www.producthunt.com/products/buda

注册可以用 code DAY1-PHLAUNCH，送 $10 credits 直接用。

如果你也有项目要支持，告诉我，我们互相帮 🤝`,
  },
  {
    channel: "WeChat Article",
    title: "公众号正文骨架",
    copy: `标题：Buda: 用 AI agents 帮你开公司，我们今天上线了

摘要：我们把公司 90% 的日常工作交给 AI agents。两周后，40% 的同事不知道周报写什么。不是没干活，是 agents 把他们的 to-do list 清空了。

我们做了一个产品，核心逻辑就一句话：

用 AI agents 帮你开公司。

每个 agent 有自己的电脑、自己的浏览器、自己的硬盘。不是聊天机器人，而是真的在开网页、跑代码、处理文件。

这不是概念，我们自己就在用。春节后开工第一天，我们开始把工作交给 agents。客服、运营、内容整理、发票处理、bug 修复，一个个任务慢慢被接管。

两周后我们发现一个现象：40% 的同事不知道周报写什么。不是因为没干活，而是 agents 把他们的 to-do list 悄悄清空了。他们从做事的人，变成了管理 agents 的人。

今天，Buda 在 Product Hunt 上线了。我们是一支很小的团队，PH 的票数对我们很重要。

如果你觉得"让 AI 真正帮你干活"这件事值得存在，帮我们投一票吧：
https://www.producthunt.com/products/buda

🎁 注册 buda.im，输入 promo code DAY1-PHLAUNCH，立得 $10 / 1000 credits。

AI 应该让人变得更强，而不是取代人。每一只 Claw agent 的出厂设置都写着同一句话：
Protect Human. Push humanity forward.

转发给可能感兴趣的朋友，帮我们冲一冲 🙏`,
  },
  {
    channel: "Twitter/X",
    title: "Founder thread",
    copy: `We ran our company on 30 AI agents.

40% of our team didn't know what to put in their weekly update.

Not because they weren't working.
Because the agents had quietly cleared their to-do lists.

So we built Buda — hire Claw agents as your company.

Each agent gets its own computer, browser, and disk.
Not a chatbot. Actually doing things.`,
  },
  {
    channel: "Twitter/X Reply",
    title: "PH link reply",
    copy: `Launching on Product Hunt today:
https://www.producthunt.com/products/buda

What Buda does:
- Each Claw agent gets its own computer, browser, and disk
- Isolated K8s sandbox, auto-sleep when idle
- Buda Organizer schedules work and coordinates agents
- Live Drive, Terminal, and Browser for every agent
- Marketplace to recruit or sell Skills, Agents, and Teams
- Works across WeChat, Slack, Discord, Teams, and web

Use DAY1-PHLAUNCH at buda.im for $10 / 1000 free credits.`,
  },
  {
    channel: "LinkedIn",
    title: "Founder story",
    copy: `I used to be CTO of HeyTea. Then I built Vika, a Notion-style tool used by millions.

Then I did something that felt a little crazy:

I handed 90% of our company's work to 30 AI agents.

Two weeks later, 40% of my team didn't know what to put in their weekly update.

Not because they weren't working.
Because the agents had quietly cleared their to-do lists.

They stopped doing the work and started managing the agents who did.

That shift changed how I think about companies. So we built Buda.

Not another chatbot. Each Claw agent gets its own computer, browser, and disk. You open a website, click hire, and your agent starts working.

Buda is live on Product Hunt today. If this resonates, an upvote means a lot to a small team:
https://www.producthunt.com/products/buda

Use DAY1-PHLAUNCH at buda.im for $10 free credits.

What would you give your first agent to do?`,
  },
  {
    channel: "Reddit",
    title: "SideProject post",
    copy: `Title:
We built an AI agent platform where every agent has its own computer, browser, and disk — launched on Product Hunt today

Body:
Hey Reddit,

We just launched Buda on Product Hunt today and would love your support.

One-liner: Buda is a platform to run your company with Claw agents. Each agent gets its own isolated sandbox, SSD volume, browser, and terminal. Not a chatbot. Actually doing things.

The backstory: We were running our own company on AI agents across 8 Linux machines, 2 Mac Minis, and 30+ chat channels. It worked so well that 90%+ of internal jobs were handled by agents. Two weeks in, 40% of our team didn't know what to put in their weekly update because agents had quietly cleared their to-do lists.

What Buda does:
- Claw Computer: isolated sandboxes on K8s, persistent SSD, auto-sleep when idle
- Buda Organizer: schedules work and coordinates agents
- Live visibility: every agent has a Drive, Terminal, and Browser
- Marketplace: recruit or sell Skills, Agents, and Teams
- Multi-channel: WeChat, Slack, Discord, Teams, and web

Would really appreciate an upvote + comment on Product Hunt if this resonates:
https://www.producthunt.com/products/buda

Use DAY1-PHLAUNCH at buda.im for $10 / 1000 free credits.`,
  },
  {
    channel: "Product Hunt Forum",
    title: "AMA first post",
    copy: `Title:
We ran our company on 30 AI agents for a month. 40% of our team didn't know what to write in their weekly update. AMA.

Body:
Hey PH,

I'm Kelly, founder of Buda, launching today:
https://www.producthunt.com/products/buda

Earlier this year, I handed 90% of our company's daily work to AI agents.

Two weeks in, 40% of my team didn't know what to put in their weekly update. Not because they weren't working, but because agents had quietly cleared their to-do lists.

They stopped doing the work and started managing the agents who did. Support, ops, design: all became AI managers overnight.

The infrastructure was chaos though: 8 Linux machines, 2 Mac Minis, 30+ chat channels. So we rebuilt it into a product: Buda.

Each Claw agent gets its own computer, browser, and disk. You open a website, click hire, and your agent starts working. No Mac Mini. No setup. No model config.

Happy to talk about agent management, token costs, what actually works vs. hype, building in public, or anything else.

AMA.`,
  },
  {
    channel: "Hacker News",
    title: "Show HN",
    copy: `Title:
Show HN: Buda – Run your company with AI agents, each in an isolated K8s sandbox

Body:
We've been running our own company on 30 AI agents for the past month: support, ops, content, code review, invoice processing. 90%+ of daily work handled by agents.

The infrastructure problem: agents scattered across 8 Linux machines, 2 Mac Minis, 30+ chat channels. No unified visibility, no cost control. Daily token burn hit 700M.

So we built Buda.

Technical approach:
- Each agent runs in an isolated Kubernetes sandbox with a persistent SSD volume
- Sandboxes auto-sleep when idle
- Shared memory layer for multi-agent coordination
- Works across WeChat, Slack, Discord, Teams, and web

What we learned:
- Token costs are a management problem, not only a technical one
- Non-technical teammates adopted agents faster than engineers
- The bottleneck is humans with enough taste to review output

Happy to answer questions about architecture, token optimization, or multi-agent coordination.

buda.im`,
  },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-all hover:bg-muted"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function CommentDraftsSection() {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-bold text-foreground">Product Hunt Comment Drafts</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          20 copy-ready comments for supporters. Pick one that matches their real angle and edit
          lightly before posting.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {productHuntCommentDrafts.map((draft, index) => (
          <div key={draft.title} className="rounded-xl border border-border bg-muted/20 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Comment {index + 1}
                </div>
                <h3 className="font-semibold text-foreground">{draft.title}</h3>
              </div>
              <CopyButton value={draft.comment} label="Copy" />
            </div>
            <p className="text-sm leading-relaxed text-foreground">{draft.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LaunchShareCopySection() {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-bold text-foreground">Launch Share Copy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Channel-specific copy for upvotes, reposts, social threads, forum posts, and one-to-one
          asks. Replace the Product Hunt link if the final launch URL changes.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {launchShareDrafts.map((draft) => (
          <div
            key={`${draft.channel}-${draft.title}`}
            className="rounded-xl border border-border p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {draft.channel}
                </div>
                <h3 className="font-semibold text-foreground">{draft.title}</h3>
              </div>
              <CopyButton value={draft.copy} label="Copy" />
            </div>
            <pre className="max-h-[360px] whitespace-pre-wrap rounded-lg bg-muted/30 p-4 font-sans text-sm leading-relaxed text-foreground">
              {draft.copy}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryCarousel({ assetBasePath }: { assetBasePath: string }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowLeft" && selectedImage > 0) {
        setSelectedImage(selectedImage - 1);
      } else if (e.key === "ArrowRight" && selectedImage < gallerySlides.length - 1) {
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
          className="flex gap-6 overflow-x-auto px-4 sm:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const slideWidth = 368 + 24; // width + gap
            const newIndex = Math.round(scrollLeft / slideWidth);
            setCurrentSlide(newIndex);
          }}
        >
          {gallerySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSelectedImage(index)}
              className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border transition-all hover:shadow-lg"
              style={{ width: "368px", height: "220px" }}
            >
              <img
                src={toBudaAsset(slide.image, assetBasePath)}
                alt={slide.title}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {gallerySlides.map((slide) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => {
                const container = document.getElementById("gallery-carousel");
                if (container) {
                  const slideWidth = 368 + 24;
                  const slideIndex = gallerySlides.findIndex((s) => s.id === slide.id);
                  container.scrollTo({ left: slideWidth * slideIndex, behavior: "smooth" });
                }
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                gallerySlides.findIndex((s) => s.id === slide.id) === currentSlide
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${slide.id}`}
            />
          ))}
        </div>
      </div>

      {/* Modal for enlarged image */}
      {selectedImage !== null && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              setSelectedImage(null);
            }
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Previous button */}
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

          {/* Next button */}
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

          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={toBudaAsset(gallerySlides[selectedImage].image, assetBasePath)}
              alt={gallerySlides[selectedImage].title}
              className="h-auto max-h-[90vh] w-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Pagination dots in modal */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {gallerySlides.map((slide) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const slideIndex = gallerySlides.findIndex((s) => s.id === slide.id);
                    setSelectedImage(slideIndex);
                  }}
                  className={`h-2 w-2 rounded-full transition-all ${
                    gallerySlides.findIndex((s) => s.id === slide.id) === selectedImage
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                  aria-label={`Go to slide ${slide.id}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function BudaProductHunt({ assetBasePath = "/public-buda" }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {/* Header - Horizontal Layout */}
        <div className="mb-6 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
                <img
                  src={toBudaAsset("/public-buda/icon.svg", assetBasePath)}
                  alt="Buda Logo"
                  className="object-contain p-2 w-full h-full"
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="flex-1">
              <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                Buda: Agents as a Company
              </h1>
              <p className="mb-2 text-base text-muted-foreground">
                🐰 A company of 🦞 Claw agents. Cloud-native, no Mac Mini.
              </p>
              {/* Rating & Followers - directly under description */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">5.0</span>
                </div>
                <span className="text-sm text-muted-foreground">3 reviews</span>
                <span className="text-sm text-muted-foreground">709 followers</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-shrink-0 flex-col gap-2">
            <Link
              href="https://buda.im"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
            >
              Visit website
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
            >
              Add to collection
            </button>
          </div>
        </div>

        {/* Topics with icon */}
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
          <span>Productivity</span>
        </div>

        {/* Description Paragraph */}
        <div className="mb-8">
          <div className="space-y-3 text-base leading-relaxed text-foreground">
            <p>OpenClaw gave you an agent. Buda gives you a company.</p>
            <p>
              Recruit or sell Skills, Agents, and Teams from a Marketplace, coordinate them with an
              Organizer, and watch every agent work live in Browser and Terminal — all in one
              screen. Long-running isolated sandboxes with SSD volumes — secure by design, no Mac
              Mini needed. No setup, no model config. Works across Slack, Discord, WeChat, Teams,
              and web. Buda runs your entire company. Actually doing things.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground"
          >
            Overview
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Launches <span className="ml-1">2</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Reviews <span className="ml-1">3</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Alternatives
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Customers
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            More
          </button>
        </div>

        {/* Gallery Carousel */}
        <div className="mb-8">
          <GalleryCarousel assetBasePath={assetBasePath} />
        </div>

        {/* Maker Comment */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground">Maker Comment</h2>
          <div className="space-y-4 text-sm leading-relaxed text-foreground">
            <p>Hey PH! 👋</p>

            <p>
              This started on a flight from Honolulu to Las Vegas — Record of Ragnarok on screen,
              Spam Musubi in hand, headphones on.
            </p>
            <p>
              It's an anime — the gods put humanity on trial and decide to wipe us out. And then
              Buddha, a god worshipped by billions, walks over to the human side and says:{" "}
              <em>I'll fight for them.</em>
            </p>

            <p>
              I paused the episode and kept thinking: this is exactly what's happening with AI right
              now. The question isn't whether AI gets powerful. It's whether the people building it
              stand with humans or against them.
            </p>

            <p>That's where the name Buda came from.</p>

            <p>
              Then we actually tried to run our company on AI agents — OpenClaw teams spread across
              8 Linux machines, 2 Mac Minis, and 30+ chat channels. It worked well enough that{" "}
              <strong>90%+ of our internal jobs could be handled by agents</strong>.
            </p>

            <p>
              Two weeks in, 40% of our teammates didn't know what to put on their weekly update. The
              agents had quietly taken their to-do lists.
            </p>

            <p>
              That wasn't a failure. It was a promotion. They stopped doing the work — and started
              managing the agents who did. Support, ops, design: all became AI managers overnight.
            </p>

            <p>But the infrastructure was chaos. So we rebuilt it.</p>

            <p>
              <strong>Buda is an AI agent company platform:</strong>
            </p>

            <div className="space-y-3 pl-4">
              <p>
                🦞 <strong>Claw Computer</strong> — Kubernetes-based cluster. Agents run in
                isolated, long-running sandboxes with high-performance SSD volumes. No Mac Mini, no
                gateway. Auto-sleep when idle — saves 80%+ compute and 30%+ token costs.
              </p>

              <p>
                🐰 <strong>Buda Organizer</strong> — schedules work, coordinates agents, runs daily
                automations across your whole team.
              </p>

              <p>
                👁️ <strong>Watch Them Work</strong> — live Drive, Terminal, and Browser for every
                agent. No black box.
              </p>

              <p>
                🗄️ <strong>Buda Drive</strong> — Trash, version history, delete protection,
                auto-backup, and sync. Three layers of data safety, built in.
              </p>

              <p>
                👥 <strong>Teams & Collaboration</strong> — invite members, share agents, coordinate
                humans and AI in one workspace. Self-hosted option available.
              </p>

              <p>
                ⚡ <strong>No setup</strong> — no config, no model keys, no installation. Don't
                build. Just hire and go.
              </p>

              <p>
                🛒 <strong>Marketplace</strong> — recruit or sell Skills, Agents, and Teams in one
                click. Publish public or private GitHub repos and monetize them directly.
              </p>
            </div>

            <p>
              We believe AI should make humans more powerful, not replace them. That's why we named
              it Buda.
            </p>

            <p>People killin', people dyin', dropping bombs — we've got enough of that.</p>

            <p>Buda, buda, buda — help us. To the moon, not the battlefield. 🐰</p>

            <p>
              Every Claw we ship has one system prompt:{" "}
              <strong>Protect Human. Push humanity forward.</strong>
            </p>

            <p>What's your first job for 🐰 Buda and her 🦞 Claws?</p>
          </div>
        </div>

        <CommentDraftsSection />

        <LaunchShareCopySection />

        {/* Company Info */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Company Info</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Website</div>
              <Link
                href="https://buda.im"
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                buda.im
              </Link>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">GitHub</div>
              <Link
                href="https://github.com/mr-kelly/far"
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                github.com/mr-kelly/far
              </Link>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Launched</div>
              <div className="text-sm text-foreground">2024</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
