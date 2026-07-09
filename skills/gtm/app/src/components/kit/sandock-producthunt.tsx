import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Mail, Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Gallery images for Sandock ProductHunt kit.
 * Place screenshots in public/gallery/ directory.
 * Product Hunt recommends 1270x760px gallery images.
 */
const gallerySlides = [
  {
    id: 1,
    title: "Coding Agents Just Work.",
    image: "/public-sandock/gallery/slide1.png",
    caption:
      "100% POSIX-compatible SSD volumes. Claude Code, Codex, Anthropic Agent SDK, OpenClaw, and Hermes — no broken symlinks, no permission errors.",
  },
  {
    id: 2,
    title: "The Only Sandbox That Does All Three.",
    image: "/public-sandock/gallery/slide2.png",
    caption:
      "Persistent volumes. 100% POSIX. Actually affordable. Every other option forces a tradeoff. Sandock doesn't.",
  },
  {
    id: 3,
    title: "Your Agent's Work Is Never Lost.",
    image: "/public-sandock/gallery/slide3.png",
    caption:
      "Long-running containers stay alive between calls. SSD-backed volumes persist across restarts. Sub-second warm starts.",
  },
  {
    id: 4,
    title: "SSD vs NFS — Two Volume Modes, One API.",
    image: "/public-sandock/gallery/slide4.png",
    caption:
      "SSD for speed, NFS for scalable shared storage. Both 100% POSIX compatible. Switch in one line.",
  },
  {
    id: 5,
    title: "5 Lines. Your Agent Has a Home.",
    image: "/public-sandock/gallery/slide5.png",
    caption:
      "No Docker expertise. No compose files. Python and Node.js SDK. Works with any coding agent.",
  },
  {
    id: 6,
    title: "Claude Code. Codex. OpenClaw. Hermes. All of Them.",
    image: "/public-sandock/gallery/slide6.png",
    caption:
      "Any coding agent that needs a real filesystem. Run them yourself or embed a cloud coding-agent experience in your own product.",
  },
  {
    id: 7,
    title: "One More Thing — Everything Included.",
    image: "/public-sandock/gallery/slide7.png",
    caption:
      "SSD & NFS volumes · Proxy · Browser & IDE · Terminal multiplexer · Long-running Docker · transparent pricing.",
  },
];

const hunterInvitationSubject =
  "Product Hunt launches for Sandock + Buda - would love your help again";

const hunterInvitationBody = `Hey Kevin,

Me again, Kelly.

First, thank you again for helping us with the Buda launch last time. I really appreciated your advice around opening it for self-serve and your help accepting the hunter invite.

Quick context: after that launch setup, we ran into Product Hunt's Alpha Day / launch mechanism and the launch ended up getting paused. We were still learning how that flow worked, so instead of pushing through with a confusing launch, we decided to pause and relaunch properly.

This time, I'm preparing two related launches and would love to ask if you'd be open to hunting them:

1. Sandock
Product Hunt invite:
https://www.producthunt.com/posts/hunter-invite/LKO46WKH3YYKWL

Sandock is persistent Docker workspaces for AI coding agents. Use it to run agents directly or embed a cloud coding-agent experience into your product: long-running Docker containers, 100% POSIX-compatible SSD/NFS volumes, terminal, browser, preview, git, and MCP workflows, with pricing from $5/month.

2. Buda
Product Hunt invite:
https://www.producthunt.com/posts/hunter-invite/RZX7O4XGZW2I3D

Buda is our AI company / multi-agent organization product. The reason we're bringing it back is that the previous PH launch did not really get a clean launch window after the Alpha Day issue, and we want to do it properly this time.

The products are connected:
- Buda is the agent company users interact with.
- Sandock is the real sandbox/workspace infrastructure that lets coding agents run reliably.
- Together, they tell the full story: AI agents need both organization and execution infrastructure.

If you're open to being the hunter again, it would mean a lot. Happy to send over the final Product Hunt preview links, launch copy, images, and anything else you need.

No pressure either way, and thank you again for helping us last time.

Thanks,
Kelly`;

const productHuntCommentDrafts = [
  {
    title: "Real filesystem",
    comment:
      "Congrats on the launch! The real filesystem point is the part that stands out to me. Symlinks, permissions, file watching, caches, and long-lived state stop being edge cases once coding agents do actual dev work.",
  },
  {
    title: "Persistent workspaces",
    comment:
      "I like the idea of giving every coding agent a persistent home instead of a disposable execution session. Clone a repo, install deps, keep caches, run previews, and come back later without losing the thread.",
  },
  {
    title: "Pricing",
    comment:
      "The pricing is refreshing. A lot of sandbox tools look great until you need longer sessions or real concurrency. Starting from $5/mo makes this much more approachable for indie builders and small teams.",
  },
  {
    title: "Embedded agents",
    comment:
      "The embedded coding-agent use case is compelling. If I were adding an agent experience to a product, I would rather provision one persistent Docker workspace per user than build all of this infrastructure from scratch.",
  },
  {
    title: "MCP hosting",
    comment:
      "Persistent MCP server hosting is a great use case. A server that stays alive between calls removes a lot of cold-start and environment-management friction for agent workflows.",
  },
  {
    title: "Docker simplicity",
    comment:
      "This feels like the right level of abstraction: simple like Docker, but with lifecycle, API, browser, terminal, preview, git, and storage handled. That is exactly the infrastructure agents need.",
  },
  {
    title: "POSIX matters",
    comment:
      "POSIX compatibility sounds boring until your agent hits a permission error or broken symlink halfway through npm install. For coding agents, filesystem correctness is product quality.",
  },
  {
    title: "Warm workspaces",
    comment:
      "Long-running containers are underrated for agent UX. If the workspace stays warm, the agent can keep services running, preserve caches, and continue from the last state instead of rebuilding everything.",
  },
  {
    title: "Agent-agnostic",
    comment:
      "I appreciate that Sandock is agent-agnostic. Claude Code, Codex, Anthropic Agent SDK, OpenClaw, Hermes, Pi Coding Agent, or a custom agent all need the same basic thing: a reliable workspace with real files.",
  },
  {
    title: "Developer DX",
    comment:
      "The 5-line SDK story is strong. Most teams do not want to become sandbox infrastructure experts just to let an agent run code safely. A clean API over persistent Docker workspaces is the right DX.",
  },
  {
    title: "More than exec",
    comment:
      "This is more than code execution. Terminal, browser, preview, git, MCP workflows, persistent volumes, and VS Code in the browser make it feel closer to a complete agent workspace.",
  },
  {
    title: "DIY pain",
    comment:
      "Anyone who has built this internally knows the hidden work: cleanup, resource limits, previews, ports, persistent volumes, auth, logs, and cost controls. Packaging that into one product is valuable.",
  },
  {
    title: "For startups",
    comment:
      "This seems especially useful for startups building AI developer tools. You get the core workspace infrastructure without committing to a heavy enterprise sandbox setup before you know what UX will work.",
  },
  {
    title: "Volume modes",
    comment:
      "Having both SSD and NFS volume modes is smart. Some agent workloads need fast storage, others need shared scalable storage. Keeping both behind one API should make the architecture easier.",
  },
  {
    title: "Previews",
    comment:
      "Browser and preview support matters because coding agents increasingly build actual apps, not just scripts. Run the service, inspect it, and continue in the same workspace is the right flow.",
  },
  {
    title: "Silent failures",
    comment:
      "The story about npm install failing silently because the sandbox was not a real filesystem is painfully believable. This is one of those infra problems that only becomes obvious after agents start doing serious work.",
  },
  {
    title: "Cloud OpenClaw",
    comment:
      "The 'cloud OpenClaw without the laptop' use case is very clear. Give the agent a persistent cloud workspace, keep files and services alive, and stop depending on someone's local machine.",
  },
  {
    title: "Security boundary",
    comment:
      "I like that Sandock treats untrusted AI-generated code as something that needs isolation, resource limits, and a clean workspace boundary. Much better than running everything on a shared dev box.",
  },
  {
    title: "Agent infra",
    comment:
      "Agent infrastructure is becoming its own category. Models are not enough; agents need durable workspaces, terminals, browsers, previews, storage, and integrations. Sandock is a focused bet on that layer.",
  },
  {
    title: "Question",
    comment:
      "Congrats team. What are people using Sandock for most right now: running their own coding agents, embedding agents in products, MCP hosting, or browser IDE workflows?",
  },
];

const launchShareDrafts = [
  {
    channel: "WeChat Group",
    title: "微信群拉票",
    copy: `👋 大家好，我们的产品 Sandock 今天在 Product Hunt 上线啦，想请大家帮忙支持一下 🙏

一句话：Sandock 是给 AI coding agents 用的持久 Docker 工作区。

为什么要做这个？我们在做 coding agent 的时候发现，普通 sandbox 经常不是“代码错了”，而是文件系统不够真：symlink 坏、权限不对、npm install 静默失败、session 结束后状态丢失。

Sandock 解决的是 agent 真正干活时需要的基础设施：
- 长时间运行的 Docker workspace
- 100% POSIX-compatible SSD / NFS volumes
- Terminal、browser、preview、git、MCP workflows 都内置
- Claude Code、Codex、Anthropic Agent SDK、OpenClaw、Hermes、Pi Coding Agent 都能跑
- 可以直接跑自己的 coding agent，也可以嵌入到自己的产品里
- $5/mo 起，Pro 从 $15/mo 起

帮忙点个 upvote + 留个评论，对我们非常重要 🙏
https://www.producthunt.com/products/sandock

如果你正在做 AI agent、MCP server、代码执行平台、浏览器 IDE，欢迎试试 sandock.ai。`,
  },
  {
    channel: "WeChat DM",
    title: "私发熟人",
    copy: `嘿，我们产品 Sandock 今天在 Product Hunt 上线了，能帮我投个票吗？🙏

点这个链接 upvote 一下就行，30 秒：
https://www.producthunt.com/products/sandock

Sandock 是给 AI coding agents 用的持久 Docker 工作区。每个 agent 都有真实文件系统、SSD/NFS 持久卷、terminal、browser、preview、git 和 MCP workflows。

如果你有朋友在做 AI agent / developer tools，也欢迎转给他。谢谢！`,
  },
  {
    channel: "WeChat DM",
    title: "私发开发者朋友",
    copy: `Hi，打扰一下 🙏

我们做的 Sandock 今天在 Product Hunt 上线。它解决的是 AI coding agent 的基础设施问题：agent 需要一个真实、持久、POSIX-compatible 的工作区，而不是一次性 sandbox。

典型问题你可能也遇到过：symlink 不支持、权限不对、npm install 失败、file watcher 不工作、下次调用状态没了。

Sandock 给每个 agent 一个 long-running Docker workspace，带 SSD/NFS persistent volumes、terminal、browser、preview、git、MCP workflows。可以直接跑 Claude Code / Codex / OpenClaw / Hermes，也可以嵌进自己的产品里。

能帮忙点个 upvote 吗？
https://www.producthunt.com/products/sandock`,
  },
  {
    channel: "WeChat Article",
    title: "公众号正文骨架",
    copy: `标题：Sandock 上线 Product Hunt：给 AI coding agents 一个真正的家

摘要：AI coding agent 不只是需要“能执行代码”的 sandbox。它需要真实文件系统、持久状态、terminal、browser、preview、git 和 MCP workflows。

我们在做 coding agent 的时候遇到一个很具体的问题：

agent 经常失败，不是因为代码错了，而是因为 sandbox 不像一台真正的开发机器。

symlink 不支持。文件权限不对。npm install 静默失败。file watcher 不工作。session 结束后，状态和缓存都没了。

一次性 code execution sandbox 很适合跑小片段代码，但 coding agent 真正在开发时，需要的是一个长期存在的 workspace。

所以我们做了 Sandock。

Sandock 是 persistent Docker workspaces for AI coding agents：
- 长时间运行的 Docker containers
- 100% POSIX-compatible SSD / NFS persistent volumes
- Terminal、browser、preview、git、MCP workflows 内置
- 5 行 Python / Node.js SDK 即可开始
- Claude Code、Codex、Anthropic Agent SDK、OpenClaw、Hermes、Pi Coding Agent 都能跑
- 可以直接跑自己的 coding agent，也可以嵌入到你的产品里

今天 Sandock 在 Product Hunt 上线了。我们是小团队，PH 的票数和评论对我们很重要。

如果你觉得 AI agents 需要一个真正能工作的云端 workspace，帮我们投一票：
https://www.producthunt.com/products/sandock

也欢迎转发给正在做 AI agent、MCP server、developer tools、browser IDE 的朋友。`,
  },
  {
    channel: "Twitter/X",
    title: "Founder post",
    copy: `We built Sandock because our coding agent kept failing.

Not because the code was wrong.

Because the sandbox did not have a real filesystem.

Broken symlinks.
Wrong permissions.
npm install failing silently.
State gone after the next call.

Coding agents need persistent Docker workspaces, not disposable sessions.`,
  },
  {
    channel: "Twitter/X Reply",
    title: "PH link reply",
    copy: `Launching Sandock on Product Hunt today:
https://www.producthunt.com/products/sandock

Sandock gives coding agents:
- Long-running Docker workspaces
- 100% POSIX SSD/NFS volumes
- Terminal, browser, preview, git, MCP workflows
- Python and Node.js SDK
- Claude Code, Codex, OpenClaw, Hermes support
- Run agents directly or embed them into your product

Starts at $5/mo. Pro from $15/mo.`,
  },
  {
    channel: "LinkedIn",
    title: "Technical story",
    copy: `We kept seeing the same failure mode while building coding agents:

The model was not the problem.
The code was not the problem.
The sandbox was the problem.

Coding agents need a real workspace. They clone repos, install dependencies, keep build caches, run preview servers, use file watchers, and continue from previous work.

Session-only sandboxes are great for quick execution, but serious coding agents need persistent Docker workspaces with real filesystem behavior.

So we built Sandock.

Persistent Docker workspaces for AI coding agents:
- 100% POSIX-compatible SSD/NFS volumes
- Long-running containers
- Terminal, browser, preview, git, and MCP workflows
- Python and Node.js SDK
- Works with Claude Code, Codex, Anthropic Agent SDK, OpenClaw, Hermes, Pi Coding Agent, or your own agent

Sandock is live on Product Hunt today. If this resonates, an upvote or comment means a lot:
https://www.producthunt.com/products/sandock`,
  },
  {
    channel: "Reddit",
    title: "Developer post",
    copy: `Title:
We built persistent Docker workspaces for AI coding agents — launched on Product Hunt today

Body:
Hey Reddit,

We just launched Sandock on Product Hunt and would love feedback from people building AI agents and developer tools.

The problem: coding agents often fail because their sandbox does not behave like a real development environment. Symlinks break, permissions are wrong, file watchers fail, npm install gets weird, and state disappears after the session.

Sandock gives each agent a long-running Docker workspace with:
- 100% POSIX-compatible SSD/NFS persistent volumes
- Terminal, browser, preview, git, and MCP workflows
- Python and Node.js SDK
- Support for Claude Code, Codex, Anthropic Agent SDK, OpenClaw, Hermes, Pi Coding Agent, or custom agents
- Pricing from $5/mo

You can run your own coding agents directly, host MCP servers, or embed a cloud coding-agent workspace into your own product.

Product Hunt link:
https://www.producthunt.com/products/sandock

Happy to answer technical questions.`,
  },
  {
    channel: "Product Hunt Forum",
    title: "AMA first post",
    copy: `Title:
We built persistent Docker workspaces for coding agents because session sandboxes kept breaking real dev workflows. AMA.

Body:
Hey PH,

We launched Sandock today:
https://www.producthunt.com/products/sandock

We were building coding agents and kept hitting failures that were not model failures. They were workspace failures: broken symlinks, permission issues, file watchers not working, npm install behaving strangely, and state disappearing between calls.

So we built Sandock: persistent Docker workspaces for AI coding agents.

Each workspace can include:
- Long-running Docker container
- 100% POSIX-compatible SSD/NFS volume
- Terminal
- Browser + preview
- Git workflows
- MCP server hosting
- Python and Node.js SDK

Use it to run Claude Code, Codex, OpenClaw, Hermes, Pi Coding Agent, or your own agent directly. Or embed a cloud coding-agent experience into your own product.

Happy to talk about agent infrastructure, POSIX volumes, Docker vs VM tradeoffs, MCP hosting, or embedded coding-agent UX.

AMA.`,
  },
  {
    channel: "Hacker News",
    title: "Show HN",
    copy: `Title:
Show HN: Sandock – Persistent Docker workspaces for AI coding agents

Body:
We built Sandock after running into a repeated problem while building coding agents: the agent was not failing because the model was wrong. It was failing because the sandbox did not behave like a real filesystem.

Examples:
- broken symlinks
- permission errors
- npm install failing silently
- file watchers not working
- build caches lost after the session
- preview servers killed between calls

Sandock gives each coding agent a long-running Docker workspace with a 100% POSIX-compatible SSD or NFS volume. Terminal, browser, preview, git, and MCP workflows are built in.

You can use it to run Claude Code, Codex, OpenClaw, Hermes, Pi Coding Agent, or custom agents directly, or embed one persistent workspace per user into your own product.

Pricing starts at $5/month, Pro from $15/month.

Happy to answer questions about Docker vs VM tradeoffs, POSIX volumes, MCP hosting, or coding-agent infrastructure.

sandock.ai`,
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
          {productHuntCommentDrafts.length} copy-ready comments for supporters. Pick one that
          matches their real angle and edit lightly before posting.
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

function GalleryCarousel() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (selectedImage === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
      else if (e.key === "ArrowLeft" && selectedImage > 0) setSelectedImage(selectedImage - 1);
      else if (e.key === "ArrowRight" && selectedImage < gallerySlides.length - 1)
        setSelectedImage(selectedImage + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  return (
    <>
      <div>
        <div
          id="gallery-carousel"
          className="flex gap-6 overflow-x-auto px-4 sm:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={(e) => {
            const newIndex = Math.round(e.currentTarget.scrollLeft / (368 + 24));
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
              <Image src={slide.image} alt={slide.title} fill className="object-cover" />
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          {gallerySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => {
                const container = document.getElementById("gallery-carousel");
                container?.scrollTo({ left: (368 + 24) * index, behavior: "smooth" });
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

          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={gallerySlides[selectedImage].image}
              alt={gallerySlides[selectedImage].title}
              width={1920}
              height={1080}
              className="h-auto max-h-[90vh] w-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 flex items-center justify-center gap-2">
              {gallerySlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === selectedImage ? "bg-white" : "bg-white/30"
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

export default function SandockProductHunt() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
                <Image
                  src="/public-sandock/icon.svg"
                  alt="Sandock Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                Sandock: Persistent Docker Workspaces for Coding Agents
              </h1>
              <p className="mb-2 text-base text-muted-foreground">
                Run or embed coding agents in persistent Docker workspaces.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">5.0</span>
                </div>
                <span className="text-sm text-muted-foreground">0 reviews</span>
                <span className="text-sm text-muted-foreground">0 followers</span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col gap-2">
            <Link
              href="https://sandock.ai"
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

        {/* Topics */}
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
          <span>Infrastructure</span>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="space-y-3 text-base leading-relaxed text-foreground">
            <p>
              Your coding agent needs a real filesystem — not a sandbox that forgets everything.
            </p>
            <p>
              Sandock gives it one: long-running Docker containers with SSD-backed persistent
              volumes and 100% POSIX compatibility. Run Claude Code, Codex, Anthropic Agent SDK,
              OpenClaw, Hermes, Pi Coding Agent, or your own agents directly — or embed them into
              your product. Terminal, browser, preview, git, and MCP workflows are built in, with
              pricing from $5/mo.
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
            Launches <span className="ml-1">1</span>
          </button>
          <button
            type="button"
            className="rounded-full bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Reviews <span className="ml-1">0</span>
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
            More
          </button>
        </div>

        {/* Launch card with a Product Hunt-style pink border */}
        <div className="mb-8 rounded-xl border-2 border-[#ff6154]/40 p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  Sandock: Persistent Docker Workspaces for Coding Agents
                </h3>
                <span className="shrink-0 rounded-full bg-[#ff6154] px-3 py-0.5 text-xs font-semibold text-white">
                  Launching today
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Run or embed coding agents in persistent Docker workspaces.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <ArrowUpRight className="h-4 w-4" />
              Visit
            </button>
          </div>

          {/* Gallery */}
          <div className="mb-4">
            <GalleryCarousel />
          </div>

          {/* Description */}
          <div className="mb-4 space-y-2 text-sm leading-relaxed text-foreground">
            <p>
              The Docker workspace for coding agents that need all three: persistent volumes, 100%
              POSIX, and pricing from $5/mo.
            </p>
            <p>
              Long-running Docker containers with SSD-backed persistent volumes and 100% POSIX
              compatibility. Run Claude Code, Codex, Anthropic Agent SDK, OpenClaw, Hermes, Pi
              Coding Agent, or your own agents directly — or embed them into your product. Terminal,
              browser, preview, git, and MCP workflows are built in.
            </p>
          </div>

          {/* Free Options + Launch tags */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Launch tags:</span>
            {["Developer Tools", "Artificial Intelligence", "API"].map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-muted-foreground">
                🏷 {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Maker Comment + Hunter Invite */}
        <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-xl border border-border p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Sandock Team</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Maker
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  First comment · posted upon launch
                </span>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-foreground">
              <p>Hey PH! 👋</p>
              <p>
                We were building a coding agent on top of Claude Code. It kept failing — not because
                the code was wrong, but because the sandbox didn't have a real filesystem. Symlinks
                broken. File permissions wrong.{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npm install</code>{" "}
                failing silently.
              </p>
              <p>
                Session-only sandboxes are great for quick code execution, but coding agents often
                need a real workspace: symlinks, file permissions, file watching, caches, and state
                that survives the next call.
              </p>
              <p>
                We tried the alternatives. E2B has great DX, but longer sessions and higher
                concurrency move you toward a $150/mo Pro base plus usage. Daytona is powerful, but
                its persistent volumes are FUSE-based and designed around a different set of
                tradeoffs.
              </p>
              <p>
                We needed something persistent like a dev machine, simple like Docker,
                POSIX-complete for agent workloads, and affordable enough to leave running. So we
                built it.
              </p>
              <p>
                <strong>What makes Sandock different:</strong>
              </p>
              <div className="space-y-2 pl-4">
                <p>
                  💾 <strong>100% POSIX + Persistent SSD Volumes</strong> — symlinks, permissions,
                  hard links all work. Claude Code, Codex, Anthropic Agent SDK, OpenClaw, Hermes,
                  and Pi Coding Agent — zero config, no workarounds.
                </p>
                <p>
                  ⚡ <strong>Long-running workspaces, simple pricing</strong> — containers stay
                  alive between calls. Starts at $5/mo, with Pro tiers from $15/mo.
                </p>
                <p>
                  🔌 <strong>MCP Server Hosting + Simple SDK</strong> — 5 lines of Python or
                  Node.js. Persistent MCP servers. No Docker expertise required.
                </p>
              </div>
              <p>
                We've been running our own agents on Sandock for months. It's the infrastructure we
                wished existed when we started.
              </p>
              <p>Your coding agent deserves a real home. What are you building? 🐳</p>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <button type="button" className="flex items-center gap-1 hover:text-foreground">
                👍 Upvote
              </button>
              <button type="button" className="hover:text-foreground">
                Reply
              </button>
              <button type="button" className="hover:text-foreground">
                Share
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Hunter Invite</h2>
                <p className="text-xs text-muted-foreground">Draft for Kevin William David</p>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Subject</div>
                <div className="rounded-lg border border-border bg-background p-3 text-sm font-medium text-foreground">
                  {hunterInvitationSubject}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Email body</div>
                <pre className="max-h-[520px] whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-sans text-sm leading-relaxed text-foreground">
                  {hunterInvitationBody}
                </pre>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <CopyButton value={hunterInvitationSubject} label="Copy subject" />
              <CopyButton value={hunterInvitationBody} label="Copy body" />
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">Use Cases</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="mb-3 text-2xl">🤖</div>
              <h3 className="mb-2 font-semibold text-foreground">
                Run OpenClaw, Hermes, and Claude Code
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Give your coding agent a persistent cloud workspace. Run OpenClaw, Hermes, Claude
                Code, Codex, or any terminal-based agent 24/7 with persistent SSD volumes and 100%
                POSIX compatibility.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="mb-3 text-2xl">☁️</div>
              <h3 className="mb-2 font-semibold text-foreground">
                Embed a Hermes-Style Agent in Your Product
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Create your own OpenClaw or Hermes-style coding agent experience. Provision a
                persistent Docker workspace per user so agents keep files, build on previous work,
                and stay alive between sessions.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <div className="mb-3 text-2xl">🔌</div>
              <h3 className="mb-2 font-semibold text-foreground">
                Embed Code Execution Into Your Product
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Add a real coding-agent environment to your SaaS in minutes. Let customers run
                agents, preview apps, open terminals, and execute code inside isolated Sandock
                workspaces — no infrastructure to manage.
              </p>
            </div>
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
                href="https://sandock.ai"
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                sandock.ai
              </Link>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Launched</div>
              <div className="text-sm text-foreground">2025</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
