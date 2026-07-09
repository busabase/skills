import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Star, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { type Localized, pickLocale, useGtmLocale } from "../../data";
import Link from "../../next-link-shim";

interface CopyDraft {
  title: string;
  copy: string;
}

interface ShareDraft extends CopyDraft {
  channel: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface ProductHuntCopyVariant {
  id: string;
  label: Localized<string>;
  note: Localized<string>;
  name: Localized<string>;
  tagline: Localized<string>;
  shortDescription: Localized<string>;
  makerComment: Localized<string>;
}

const tLocale = (value: Localized<string>, locale: Parameters<typeof pickLocale<string>>[1]) =>
  pickLocale(value, locale) ?? "";

const productHuntCopyVariants: ProductHuntCopyVariant[] = [
  {
    id: "ph-final",
    label: { en: "PH final", "zh-CN": "PH 最终版" },
    note: {
      en: "Recommended Product Hunt copy: keeps the tagline under 60 characters and matches the final gallery story.",
      "zh-CN": "推荐用于 Product Hunt：tagline 控制在 60 字符内，并对齐最终 gallery 叙事。",
    },
    name: {
      en: "Busabase: Give your agents reviewed, trusted data",
      "zh-CN": "Busabase：给你的 Agent 审核过的可信数据",
    },
    tagline: {
      en: "Review, approve, and audit AI-agent data before merge",
      "zh-CN": "AI Agent 数据合并前，先审核、批准并审计",
    },
    shortDescription: {
      en: "Busabase is the approval-first database and knowledge base for AI agents. Every change gets human review before it becomes a record you can trust. Agents submit Change Requests; humans review, approve, and merge the data that becomes canonical.",
      "zh-CN":
        "Busabase 是为 AI Agent 打造的审批优先数据库与知识库。每个变更都先经人工审核，通过后才成为你能信任的记录。Agent 提交 Change Request，人类审核、批准并合并成为正式数据。",
    },
    makerComment: {
      en: `Hey Product Hunt,

We built Busabase because AI agents are starting to write data that other systems depend on.

The problem: most teams still review that work in Slack threads, Notion pages, Airtable comments, spreadsheets, or not at all.

Busabase gives your agents reviewed, trusted data.

Think GitHub Pull Requests, but for structured data: agents submit Change Requests, humans review the diff, approve, and merge. Only approved records become the knowledge base your agents and systems can trust.

For this launch, we are starting with the open-source core and a desktop-first workflow. We want Busabase to be something you can inspect, run close to your data, and trust before connecting it to agent tools or Cloud APIs.

It is useful for AI-reviewed CMS workflows, dataset quality, product records, private knowledge bases, and routine operations where every field matters.

We would love feedback from builders working with AI agents:

What is the first piece of agent-generated data you would want reviewed before it becomes official?`,
      "zh-CN": `Hey Product Hunt,

我们做 Busabase，是因为 AI Agent 已经开始写入会被其他系统依赖的数据。

问题是：很多团队仍然在 Slack 线程、Notion 页面、Airtable 评论、表格里审核这些工作，甚至完全不审核。

Busabase 给你的 Agent 审核过的可信数据。

你可以把它理解成 GitHub Pull Requests，但对象不是代码，而是结构化数据：Agent 提交 Change Request，人类查看 diff、批准并合并。只有通过审核的记录，才会成为 Agent 和系统可以信任的知识库。

这次 Product Hunt 首发，我们会强调开源核心和桌面端优先。我们希望 Busabase 是一个你可以审查、可以在数据身边运行、可以先信任再接入 Agent 工具或 Cloud API 的产品。

它适合 AI-reviewed CMS、数据集质量流程、商品记录、私有知识库，以及每个字段都重要的日常运营场景。

我们很想听听正在用 AI Agent 的 builders 的反馈：

你最希望先审核哪一类 agent 生成的数据，再让它变成正式记录？`,
    },
  },
  {
    id: "review-action",
    label: { en: "Review action", "zh-CN": "动作型" },
    note: {
      en: "Fastest to understand on a Product Hunt feed: what the user does and why.",
      "zh-CN": "在 Product Hunt 信息流里最快懂：用户做什么、为什么做。",
    },
    name: { en: "Busabase", "zh-CN": "Busabase" },
    tagline: {
      en: "Review AI agent data before it becomes trusted",
      "zh-CN": "AI Agent 数据成为可信记录前，先审核",
    },
    shortDescription: {
      en: "Busabase is a review workspace for AI agent-written records. Agents propose changes, humans preview the result, approve or request revisions, and only merged records become trusted data.",
      "zh-CN":
        "Busabase 是给 AI Agent 写入记录用的审核工作区。Agent 提交改动，人类预览结果、批准或要求修改，只有合并后的记录才成为可信数据。",
    },
    makerComment: {
      en: `Hey Product Hunt,

We built Busabase for a simple agent-era problem: AI can generate useful data faster than teams can safely trust it.

Agents can draft blog posts, clean datasets, enrich CRM records, summarize research, and prepare operational updates. But if those records go straight into a database, nobody can easily answer what changed, who reviewed it, or whether it should be trusted.

Busabase puts a review step in the middle.

Agents propose Change Requests. Humans inspect field-level diffs, preview rich records, comment, request revisions, approve, and merge. The merged record becomes trusted data, and the review history stays attached.

The product is local-first and API-first, so you can run it privately while still giving your own agents a structured place to propose work.

What agent-written data would you want reviewed before it becomes official?`,
      "zh-CN": `Hey Product Hunt,

我们做 Busabase，是为了解决 agent 时代一个很具体的问题：AI 可以很快生成有用数据，但团队不一定能马上信任这些数据。

Agent 会起草博客、清洗数据集、补全 CRM 记录、总结研究、准备运营更新。如果这些记录直接写进数据库，之后很难回答：改了什么、谁审核过、到底能不能信。

Busabase 在中间加了一层 review。

Agent 提交 Change Request。人类查看字段级 diff、预览富文本记录、评论、要求修改、批准并合并。合并后的记录才成为可信数据，审核历史会一直跟着这条记录。

它是 local-first、API-first 的，所以可以私有运行，也能给你自己的 agent 一个结构化的提案入口。

你最希望先审核哪类 agent 写出来的数据，再让它变成正式记录？`,
    },
  },
  {
    id: "data-prs",
    label: { en: "PRs for data", "zh-CN": "数据版 PR" },
    note: {
      en: "Developer-friendly mental model: pull requests, but for records instead of code.",
      "zh-CN": "偏开发者心智：不是代码 PR，而是记录和字段的 PR。",
    },
    name: { en: "Busabase Data PRs", "zh-CN": "Busabase Data PRs" },
    tagline: {
      en: "Pull requests for AI agent data",
      "zh-CN": "给 AI Agent 数据用的 Pull Requests",
    },
    shortDescription: {
      en: "Busabase brings the pull request workflow to structured data. Agents open Change Requests for records and fields; humans review diffs, discuss, approve, merge, and audit what became canonical.",
      "zh-CN":
        "Busabase 把 pull request 工作流带到结构化数据。Agent 给记录和字段提交 Change Request，人类查看 diff、讨论、批准、合并，并审计哪些内容成为正式数据。",
    },
    makerComment: {
      en: `Hey Product Hunt,

The simplest way to explain Busabase is this:

GitHub Pull Requests, but for structured data instead of code.

AI agents are starting to create the same kind of work that used to be typed by humans: content records, dataset rows, knowledge base entries, product updates, research notes, and operational logs.

Code already has a mature review workflow. Structured data usually does not.

Busabase gives that data a PR-like lifecycle. An agent opens a Change Request, reviewers inspect the operations and field diffs, discuss the proposal, request revisions, approve, and merge. The merged record becomes canonical, and the review trail stays attached.

It is not meant to replace GitHub. It is for the agent-written records that do not belong in code review but still need the same discipline.

What non-code data in your workflow deserves a PR before it becomes real?`,
      "zh-CN": `Hey Product Hunt,

Busabase 最简单的理解方式是：

GitHub Pull Requests，但对象是结构化数据，不是代码。

AI Agent 正在生产以前由人手动填写的工作：内容记录、数据集 rows、知识库条目、商品更新、研究笔记和运营日志。

代码已经有成熟的 review 流程，但结构化数据通常没有。

Busabase 给这些数据一个类似 PR 的生命周期。Agent 打开 Change Request，审核者查看 operations 和字段 diff，讨论、要求修改、批准并合并。合并后的记录成为 canonical，review trail 会一直保留。

它不是替代 GitHub。它服务的是那些不属于 code review、但同样需要审核纪律的 agent-written records。

你的工作流里，哪类非代码数据最需要先走一次 PR？`,
    },
  },
  {
    id: "trust-layer",
    label: { en: "Trust layer", "zh-CN": "信任层" },
    note: {
      en: "Governance framing: provenance, auditability, and source-of-truth safety.",
      "zh-CN": "偏治理表达：来源、审计、source-of-truth 安全。",
    },
    name: { en: "Busabase Trust Layer", "zh-CN": "Busabase Trust Layer" },
    tagline: {
      en: "Turn AI agent output into auditable records",
      "zh-CN": "把 AI Agent 输出变成可审计记录",
    },
    shortDescription: {
      en: "Busabase is the trust layer between AI agents and your source of truth. Every proposed record is reviewed before merge, then preserved with provenance, reviewer decisions, and audit history.",
      "zh-CN":
        "Busabase 是 AI Agent 和 source of truth 之间的信任层。每条提议记录在合并前先被审核，合并后保留来源、审核决策和审计历史。",
    },
    makerComment: {
      en: `Hey Product Hunt,

We think the next agent infrastructure problem is not only generation. It is trust.

When an AI agent creates a record, teams need to know more than the final value. They need to know who or what proposed it, which fields changed, why it changed, who reviewed it, when it merged, and whether the history can be audited later.

Busabase is built as the trust layer for that workflow.

Agents submit proposed data as Change Requests. Humans review the diff, preview the record, comment, approve, and merge. Approved records become the source of truth, with provenance and audit history attached.

Use it for AI-reviewed CMS records, dataset QA, multimodal annotations, operational records, and private knowledge bases that agents can help maintain without writing straight to production.

For teams using agents: what information would you need before trusting an AI-written record?`,
      "zh-CN": `Hey Product Hunt,

我们认为下一阶段 agent infrastructure 的问题不只是生成，而是信任。

当 AI Agent 创建一条记录时，团队不只需要最终值。还需要知道谁或哪个 agent 提出了它、哪些字段变了、为什么变、谁审核过、什么时候合并，以及之后还能不能审计。

Busabase 就是为这个工作流设计的 trust layer。

Agent 把数据作为 Change Request 提交。人类查看 diff、预览记录、评论、批准并合并。批准后的记录才成为 source of truth，并且自带来源和审计历史。

它适合 AI-reviewed CMS、数据集 QA、多模态标注、运营记录，以及 agent 可以维护但不能直接写入生产数据的私有知识库。

对正在使用 agent 的团队来说：你需要看到哪些信息，才会信任一条 AI 写出来的记录？`,
    },
  },
  {
    id: "local-first",
    label: { en: "Local-first", "zh-CN": "本地优先" },
    note: {
      en: "Privacy and OSS framing: a local database agents can write to safely.",
      "zh-CN": "偏隐私和开源表达：agent 可以安全写入的本地数据库。",
    },
    name: { en: "Busabase Local", "zh-CN": "Busabase Local" },
    tagline: {
      en: "Local-first database agents can write to safely",
      "zh-CN": "Agent 可以安全写入的 local-first 数据库",
    },
    shortDescription: {
      en: "Busabase runs locally and gives your own AI agents a safe place to propose data changes. Review Change Requests, approve what is trustworthy, merge it, and keep the full history on your machine.",
      "zh-CN":
        "Busabase 可本地运行，给你自己的 AI Agent 一个安全提交数据改动的地方。审核 Change Requests，批准可信内容，合并，并把完整历史保留在你的机器上。",
    },
    makerComment: {
      en: `Hey Product Hunt,

We built Busabase for people who want AI agents to help maintain data, but still want ownership, review, and privacy.

The open-source edition runs locally. Your agent does not need to write straight into production or a default-cloud workspace. It can propose a Change Request to your local Busabase instead.

You review the proposed operations, inspect field diffs, preview rich records, request changes, approve, and merge. Only approved records become canonical, and the history stays with your data.

That makes Busabase useful as a private knowledge base, AI-assisted CMS, dataset review queue, or local operations database.

The cloud path is for teams that need hosted APIs, permissions, and collaboration. The starting point is still simple: agent output should be reviewed before it becomes trusted data.

What local data would you let an agent help maintain if every change had to be approved first?`,
      "zh-CN": `Hey Product Hunt,

我们做 Busabase，是给那些希望 AI Agent 帮忙维护数据，但仍然想保留所有权、审核权和隐私边界的人。

开源版可以本地运行。你的 agent 不需要直接写进生产库，也不需要默认写到云端 workspace。它可以先向本地 Busabase 提交 Change Request。

你可以审核 operations、查看字段 diff、预览富文本记录、要求修改、批准并合并。只有批准后的记录才成为正式数据，历史也一直跟着数据留在本机。

这让 Busabase 很适合作为私有知识库、AI-assisted CMS、数据集审核队列，或者本地运营数据库。

云端路径服务于需要 hosted APIs、权限和协作的团队。但起点仍然很简单：agent output 在成为可信数据前，应该先被审核。

如果每次改动都必须先批准，你会让 agent 帮你维护哪类本地数据？`,
    },
  },
];

// Final 1270×760 gallery images, generated from SVG sources via `pnpm gallery:generate`.
// Source: apps/busabase-cloud/scripts/gallery/slides.ts → public/assets/gallery/*.png
const gallerySlides: Array<{
  id: number;
  image: string;
  title: Localized<string>;
  caption: Localized<string>;
}> = [
  {
    id: 1,
    image: "hero.png",
    title: {
      en: "Give your agents reviewed, trusted data",
      "zh-CN": "给你的 Agent 审核过的可信数据",
    },
    caption: { en: "AI drafts, humans approve", "zh-CN": "AI 起草，人类批准" },
  },
  {
    id: 2,
    image: "slide1-no-prod-writes.png",
    title: {
      en: "AI agents should not write straight to production",
      "zh-CN": "AI Agent 不该直接写入生产数据",
    },
    caption: { en: "The problem", "zh-CN": "问题" },
  },
  {
    id: 3,
    image: "slide2-prs-for-data.png",
    title: { en: "Pull Requests, but for data", "zh-CN": "像 PR 一样审核数据改动" },
    caption: {
      en: "Change Request inbox + field diff",
      "zh-CN": "Change Request 收件箱 + 字段 diff",
    },
  },
  {
    id: 4,
    image: "slide3-preview-before-truth.png",
    title: {
      en: "Review the result before it becomes truth",
      "zh-CN": "结果成为事实前，先审核",
    },
    caption: { en: "Record preview + side panel", "zh-CN": "记录预览 + 侧边栏" },
  },
  {
    id: 5,
    image: "slide4-flexible-auditable.png",
    title: {
      en: "Notion flexibility. Auditable accountability",
      "zh-CN": "Notion 的灵活性，加上可审计责任链",
    },
    caption: { en: "Activity feed + audit trail", "zh-CN": "Activity 活动清单 + 审计轨迹" },
  },
  {
    id: 6,
    image: "slide5-headless-cms.png",
    title: {
      en: "A CMS where AI can draft and humans approve",
      "zh-CN": "AI 起草，人类批准的 CMS",
    },
    caption: { en: "Headless CMS workflow", "zh-CN": "Headless CMS 工作流" },
  },
  {
    id: 7,
    image: "slide6-datasets.png",
    title: { en: "High-quality AI data needs approval", "zh-CN": "高质量 AI 数据需要审核" },
    caption: { en: "Dataset review", "zh-CN": "数据集审核" },
  },
  {
    id: 8,
    image: "slide7-local-first.png",
    title: { en: "Your data can live close to you", "zh-CN": "数据可以先留在你身边" },
    caption: { en: "Local-first, cloud-connected", "zh-CN": "Local-first，可连接云端" },
  },
  {
    id: 9,
    image: "slide-cta.png",
    title: {
      en: "Run locally. Review in Cloud. Merge with confidence",
      "zh-CN": "本地运行，云端审核，放心合并",
    },
    caption: { en: "Call to action", "zh-CN": "行动号召" },
  },
];

const commentDrafts: Localized<CopyDraft[]> = {
  en: [
    {
      title: "Approval-first",
      copy: "Congrats on the launch! The approval-first framing is strong. AI agents are producing real records now, and teams need a review layer before that output becomes official.",
    },
    {
      title: "Auditable data",
      copy: "The audit trail angle is the part that clicks for me. It is not enough to know the final value. I want to know who proposed it, what changed, who reviewed it, and whether an agent was involved.",
    },
    {
      title: "PRs for data",
      copy: "GitHub Pull Requests for structured data is a useful mental model. Code already has a mature review workflow. Content, datasets, and operations records need the same discipline.",
    },
    {
      title: "Agent safety",
      copy: "This feels like the missing safety layer for agent workflows. Let agents draft and enrich data, but keep humans in the loop before anything becomes canonical.",
    },
    {
      title: "Headless CMS",
      copy: "The headless CMS use case is very clear. Agents can draft blog posts or social variants, reviewers approve them, and the website reads only merged records through the API.",
    },
    {
      title: "Datasets",
      copy: "Dataset review is an underrated use case. Training and evaluation data needs provenance, comments, reviewer decisions, and field-level history, not just rows in a spreadsheet.",
    },
    {
      title: "Local-first",
      copy: "I like the local-first path. A private knowledge base that can later expose scoped APIs or tunnels to agents is a different privacy model from default-cloud tools.",
    },
    {
      title: "Operations log",
      copy: "Approval-backed routine operations are interesting: daily checks, content QA, support triage, compliance prep. The value is the trusted record that remains after the work is done.",
    },
    {
      title: "Question",
      copy: "Congrats team. Which use case are you seeing first: AI-reviewed CMS, dataset quality workflows, routine operations, or personal local knowledge bases?",
    },
  ],
  "zh-CN": [
    {
      title: "先审再合并",
      copy: "恭喜发布！approval-first 这个定位很清楚。AI Agent 现在已经在生产真实记录了，团队需要在这些输出成为正式数据前加一层 review。",
    },
    {
      title: "可审计数据",
      copy: "我最有感觉的是 audit trail。只知道最终值不够，我还想知道谁提出了改动、改了什么、谁审核过、有没有 agent 参与。",
    },
    {
      title: "数据版 PR",
      copy: "GitHub Pull Requests for structured data 这个心智模型很好。代码已经有成熟 review 流程，内容、数据集和运营记录也需要同样的纪律。",
    },
    {
      title: "Agent 安全层",
      copy: "这像是 agent 工作流里缺的安全层。可以让 agent 起草和补充数据，但任何东西变成 canonical 前，人类还在 loop 里。",
    },
    {
      title: "Headless CMS",
      copy: "Headless CMS 的场景非常清楚。Agent 可以起草博客或社媒变体，审核者 approve，网站只读取已经 merge 的正式记录。",
    },
    {
      title: "数据集",
      copy: "Dataset review 是个被低估的场景。训练和评测数据需要来源、评论、审核决策和字段级历史，而不只是表格里的 rows。",
    },
    {
      title: "Local-first",
      copy: "我喜欢 local-first 这条路。私有知识库先留在本地，再给 agent 暴露受控 API 或 tunnel，这跟默认全云端工具是不同的隐私模型。",
    },
    {
      title: "运营记录",
      copy: "带 approval 的日常运营也很有意思：每日检查、内容 QA、客服分流、合规准备。真正的价值是工作完成后留下可信记录。",
    },
    {
      title: "提问",
      copy: "恭喜团队。你们最先看到的使用场景是哪类：AI-reviewed CMS、数据集质量流程、日常运营，还是个人本地知识库？",
    },
  ],
};

const launchShareDrafts: Localized<ShareDraft[]> = {
  en: [
    {
      channel: "X thread",
      title: "Founder launch thread",
      copy: `AI agents should not write straight to production.

Today we are launching Busabase: an approval-first, auditable database for AI-generated data.

Agents propose Change Requests.
Humans review diffs, preview rich records, comment, approve, and merge.
Every record keeps provenance, reviewer decisions, merge history, and an audit trail.

Think GitHub Pull Requests, but for structured data instead of code.

Useful for:
- AI-reviewed headless CMS
- Dataset quality pipelines
- Multimodal content databases
- Approval-backed routine operations
- Local-first private knowledge bases

Busabase is for the question teams will ask more often in the agent era:

Who proposed this data?
What changed?
Who reviewed it?
Was an agent involved?
Did it merge?
Can we audit it later?`,
    },
    {
      channel: "LinkedIn",
      title: "Professional launch post",
      copy: `We are launching Busabase, an approval-first, auditable database for teams using AI agents to create structured data.

The core idea is simple: agent-generated data should be reviewed before it becomes a source of truth.

Instead of letting agents write directly into production tables, Busabase turns every proposed change into a Change Request. Reviewers can inspect field-level diffs, preview Markdown and HTML, comment, ask an agent to revise, approve, and merge.

Every merged record keeps provenance, reviewer decisions, and history.

This is especially useful for AI-reviewed CMS workflows, dataset quality pipelines, multimodal content databases, and routine operations where the final record must be trustworthy.`,
    },
    {
      channel: "Community",
      title: "Short forum post",
      copy: `We built Busabase for teams that want AI agents to help create data, but do not want agents writing straight to production.

It is an approval-first, auditable database:
- Agents submit Change Requests
- Humans review diffs and previews
- Approved records become canonical
- History and provenance stay attached

The mental model is GitHub PRs for structured data: content, datasets, knowledge bases, and operations records rather than code.`,
    },
    {
      channel: "WeChat",
      title: "中文介绍",
      copy: `我们在准备 Busabase 的 Product Hunt launch。

一句话：Busabase 是一个 approval-first、auditable 的数据库，给 AI Agent 生成的数据做审批。

Agent 不应该直接写入正式数据库。它应该先提交 Change Request，人类可以看 diff、预览 Markdown/HTML、评论、让 Agent 修改，然后 approve + merge。

适合做：
- AI 参与的 Headless CMS
- 高质量数据集审核
- 多模态内容库
- 日常流程任务记录
- 本地优先的个人知识库和数据库

核心不是简单存数据，而是回答：谁提出了这个数据？为什么要改？改了哪些字段？谁审核过？有没有 Agent 参与？最终有没有 merge？以后还能不能追溯？`,
    },
  ],
  "zh-CN": [
    {
      channel: "X thread",
      title: "Founder launch thread",
      copy: `AI Agent 不应该直接写入生产数据。

今天我们发布 Busabase：一个给 AI 生成数据使用的 approval-first、auditable 数据库。

Agent 提交 Change Request。
人类查看 diff，预览富文本记录，评论，批准并合并。
每条记录都会保留来源、审核决策、合并历史和审计链路。

可以把它理解成：
GitHub Pull Requests，但对象是结构化数据，不是代码。

适合：
- AI-reviewed headless CMS
- 数据集质量流程
- 多模态内容数据库
- 带审批的日常运营
- Local-first 私有知识库

在 agent 时代，团队会越来越常问：

谁提出了这条数据？
改了什么？
谁审核过？
有没有 agent 参与？
合并了吗？
以后还能审计吗？`,
    },
    {
      channel: "LinkedIn",
      title: "专业发布帖",
      copy: `我们正在发布 Busabase，一个面向 AI Agent 生成结构化数据团队的 approval-first、auditable 数据库。

核心想法很简单：agent 生成的数据在成为 source of truth 前，应该先被审核。

Busabase 不让 agent 直接写入生产表，而是把每次提议改动变成 Change Request。审核者可以查看字段级 diff、预览 Markdown 和 HTML、评论、要求 agent 修改、批准并合并。

每条已合并记录都会保留来源、审核决策和历史。

这尤其适合 AI-reviewed CMS、数据集质量流程、多模态内容数据库，以及最终记录必须可信的日常运营场景。`,
    },
    {
      channel: "Community",
      title: "短论坛帖",
      copy: `我们做 Busabase，是给那些希望 AI Agent 帮忙创建数据、但不希望 agent 直接写入生产数据的团队。

它是一个 approval-first、auditable 数据库：
- Agent 提交 Change Request
- 人类查看 diff 和预览
- 审核通过的记录才成为正式数据
- 历史和来源会一直保留

心智模型是结构化数据版 GitHub PR：对象是内容、数据集、知识库和运营记录，而不是代码。`,
    },
    {
      channel: "WeChat",
      title: "中文介绍",
      copy: `我们在准备 Busabase 的 Product Hunt launch。

一句话：Busabase 是一个 approval-first、auditable 的数据库，给 AI Agent 生成的数据做审批。

Agent 不应该直接写入正式数据库。它应该先提交 Change Request，人类可以看 diff、预览 Markdown/HTML、评论、让 Agent 修改，然后 approve + merge。

适合做：
- AI 参与的 Headless CMS
- 高质量数据集审核
- 多模态内容库
- 日常流程任务记录
- 本地优先的个人知识库和数据库

核心不是简单存数据，而是回答：谁提出了这个数据？为什么要改？改了哪些字段？谁审核过？有没有 Agent 参与？最终有没有 merge？以后还能不能追溯？`,
    },
  ],
};

const faqs: Localized<FaqItem[]> = {
  en: [
    {
      question: "Why not just use Airtable?",
      answer:
        "Airtable is great for flexible data. Busabase adds Change Requests, operations, comments, reviewer decisions, merge history, and agent-friendly review.",
    },
    {
      question: "Why not just use PostgreSQL?",
      answer:
        "PostgreSQL is durable storage. Busabase is the approval and audit workflow above structured data. Approved records can still sync into your own database.",
    },
    {
      question: "What does auditable mean here?",
      answer:
        "Busabase is designed to answer who proposed a change, which fields changed, why it exists, who reviewed it, whether an agent participated, when it merged, and which automation ran afterward.",
    },
    {
      question: "Is this only for content?",
      answer:
        "No. Content is the easiest example, but the same workflow fits datasets, research notes, multimodal records, support triage, and routine operations.",
    },
  ],
  "zh-CN": [
    {
      question: "为什么不用 Airtable？",
      answer:
        "Airtable 很适合灵活数据。Busabase 在它之上强调 Change Requests、operations、comments、reviewer decisions、merge history，以及适合 agent 的审核流程。",
    },
    {
      question: "为什么不用 PostgreSQL？",
      answer:
        "PostgreSQL 是可靠存储。Busabase 是结构化数据上方的审批和审计工作流。已批准的记录之后仍然可以同步到你自己的数据库。",
    },
    {
      question: "这里的 auditable 是什么意思？",
      answer:
        "Busabase 设计上要回答：谁提出了改动、哪些字段变了、为什么存在、谁审核过、是否有 agent 参与、什么时候合并，以及合并后哪些自动化运行过。",
    },
    {
      question: "这只适合内容场景吗？",
      answer:
        "不是。内容是最容易理解的例子，但同一套流程也适合数据集、研究笔记、多模态记录、客服分流和日常运营记录。",
    },
  ],
};

const assetChecklist: Localized<string[]> = {
  en: [
    "Product Hunt title, tagline, short description, and maker comment",
    "Product categories: AI / AI Agents; Developer Tools / Databases; Productivity / Knowledge Management",
    "9 gallery images: hero, 7 feature slides, and CTA",
    "45-60 second product video",
    "Screenshots: Inbox, Change Request detail, Base table, Record detail, Design view",
    "Demo dataset: AI industry content workflow",
    "Founder X thread, LinkedIn post, community post, WeChat post",
    "FAQ covering local-first, privacy, agents, APIs, and auditability",
  ],
  "zh-CN": [
    "Product Hunt 标题、tagline、短描述和 maker comment",
    "Product categories：AI / AI Agents；Developer Tools / Databases；Productivity / Knowledge Management",
    "9 张 gallery 图：hero、7 张功能图和 CTA",
    "45-60 秒产品视频",
    "截图：Inbox、Change Request 详情、Base 表格、Record 详情、Design view",
    "演示数据集：AI 行业内容工作流",
    "Founder X thread、LinkedIn post、community post、WeChat post",
    "覆盖 local-first、隐私、agents、APIs 和 auditability 的 FAQ",
  ],
};

const pageCopy = {
  copy: { en: "Copy", "zh-CN": "复制" },
  copied: { en: "Copied", "zh-CN": "已复制" },
  launchKit: { en: "Launch kit", "zh-CN": "Launch kit" },
  aiDataReview: { en: "AI data review", "zh-CN": "AI 数据审核" },
  visitWebsite: { en: "Visit website", "zh-CN": "访问官网" },
  addToCollection: { en: "Add to collection", "zh-CN": "加入收藏" },
  categories: {
    en: ["AI", "Developer Tools", "Productivity"],
    "zh-CN": ["AI", "开发者工具", "效率"],
  },
  introOne: {
    en: "Busabase turns agent-generated content, datasets, and operational records into reviewable Change Requests. Humans inspect field diffs, preview rich records, comment, approve, and merge.",
    "zh-CN":
      "Busabase 把 agent 生成的内容、数据集和运营记录变成可审核的 Change Requests。人类查看字段 diff、预览富文本记录、评论、批准并合并。",
  },
  introTwo: {
    en: "Every approved record keeps provenance, reviewer decisions, merge history, and an auditable trail, so agent-produced data can become trusted data.",
    "zh-CN":
      "每条已批准记录都会保留来源、审核决策、合并历史和可审计链路，让 agent 产出的数据可以变成可信数据。",
  },
  overview: { en: "Overview", "zh-CN": "总览" },
  launches: { en: "Launches", "zh-CN": "发布" },
  reviews: { en: "Reviews", "zh-CN": "评论" },
  alternatives: { en: "Alternatives", "zh-CN": "替代品" },
  customers: { en: "Customers", "zh-CN": "客户" },
  more: { en: "More", "zh-CN": "更多" },
  makerComment: { en: "Maker Comment", "zh-CN": "Maker 评论" },
  listingCopy: { en: "Product Hunt Listing Copy", "zh-CN": "Product Hunt Listing 文案" },
  listingHelp: {
    en: "Switch between five copy directions, then copy the Product Hunt name, 60-character tagline, categories, description, and maker comment.",
    "zh-CN":
      "在 5 个文案方向之间切换，然后复制 Product Hunt name、60 字符内 tagline、分类、description 和 maker comment。",
  },
  variant: { en: "Positioning Variant", "zh-CN": "定位版本" },
  name: { en: "Name", "zh-CN": "Name" },
  tagline: { en: "Tagline", "zh-CN": "Tagline" },
  productCategories: {
    en: "Product categories (up to 3)",
    "zh-CN": "Product categories（最多 3 个）",
  },
  shortDescription: { en: "Short description", "zh-CN": "短描述" },
  commentDrafts: { en: "Product Hunt Comment Drafts", "zh-CN": "Product Hunt 评论草稿" },
  commentDraftsHelp: {
    en: "Short comments for supporters, makers, and early users. They each reinforce a different part of the story without sounding identical.",
    "zh-CN":
      "给 supporters、makers 和 early users 的短评论。每条强化一个不同故事点，避免听起来都一样。",
  },
  launchShareCopy: { en: "Launch Share Copy", "zh-CN": "Launch 分享文案" },
  launchShareHelp: {
    en: "Thread, LinkedIn, community, and Chinese launch notes for the first wave of promotion.",
    "zh-CN": "第一波推广用的 thread、LinkedIn、community 和中文 launch notes。",
  },
  faq: { en: "FAQ", "zh-CN": "FAQ" },
  faqHelp: {
    en: "The best comments will ask why this is not just Airtable, PostgreSQL, Notion, or GitHub. Keep the answers crisp.",
    "zh-CN": "常见问题会问它为什么不是 Airtable、PostgreSQL、Notion 或 GitHub。回答保持简洁清楚。",
  },
  launchAssetChecklist: { en: "Launch asset checklist", "zh-CN": "Launch 资产清单" },
  checklistHelp: {
    en: "Product Hunt headline to repeat: approval-first and auditable.",
    "zh-CN": "Product Hunt 需要反复强调的 headline：approval-first and auditable。",
  },
  companyInfo: { en: "Company Info", "zh-CN": "公司信息" },
  website: { en: "Website", "zh-CN": "官网" },
  positioning: { en: "Positioning", "zh-CN": "定位" },
  positioningValue: {
    en: "Approval-first database for AI agents",
    "zh-CN": "给 AI Agent 数据先审再合并的数据库",
  },
  gallerySource: { en: "Gallery Source", "zh-CN": "Gallery 源文件" },
};

function CopyButton({
  value,
  copyLabel,
  copiedLabel,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}

function CopyCard({
  title,
  value,
  multiline = false,
  copyLabel,
  copiedLabel,
}: {
  title: string;
  value: string;
  multiline?: boolean;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <article className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <CopyButton value={value} copyLabel={copyLabel} copiedLabel={copiedLabel} />
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
    locale === "zh-CN" ? "/public-busabase/assets/gallery-zh" : "/public-busabase/assets/gallery";
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
          className="flex gap-5 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={(e) => {
            const slideWidth = 368 + 20;
            setCurrentSlide(Math.round(e.currentTarget.scrollLeft / slideWidth));
          }}
        >
          {gallerySlides.map((slide, index) => {
            const title = tLocale(slide.title, locale);
            const caption = tLocale(slide.caption, locale);
            return (
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
                  <Image
                    src={`${imageBase}/${slide.image}`}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="368px"
                  />
                </div>
                <p className="mt-2 px-1 text-xs font-medium text-muted-foreground">
                  {slide.id}. {caption}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {gallerySlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => {
                const container = document.getElementById("gallery-carousel");
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

          <div className="relative max-h-[90vh] max-w-[92vw]">
            <Image
              src={`${imageBase}/${gallerySlides[selectedImage].image}`}
              alt={tLocale(gallerySlides[selectedImage].title, locale)}
              width={1270}
              height={760}
              className="h-auto max-h-[82vh] w-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="mt-3 text-center text-sm font-medium text-white/80">
              {tLocale(gallerySlides[selectedImage].title, locale)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function BusabaseProductHunt() {
  const locale = useGtmLocale();
  const t = (value: Localized<string>) => tLocale(value, locale);
  const [selectedVariantId, setSelectedVariantId] = useState(productHuntCopyVariants[0].id);
  const selectedVariant =
    productHuntCopyVariants.find((variant) => variant.id === selectedVariantId) ??
    productHuntCopyVariants[0];
  const copy = {
    name: t(selectedVariant.name),
    tagline: t(selectedVariant.tagline),
    productCategories:
      "AI — AI Agents\nDeveloper Tools — Databases\nProductivity — Knowledge Management",
    shortDescription: t(selectedVariant.shortDescription),
    makerComment: t(selectedVariant.makerComment),
    variantNote: t(selectedVariant.note),
  };
  const categories = pickLocale(pageCopy.categories, locale) ?? [];
  const localizedCommentDrafts = pickLocale(commentDrafts, locale) ?? [];
  const localizedLaunchShareDrafts = pickLocale(launchShareDrafts, locale) ?? [];
  const localizedFaqs = pickLocale(faqs, locale) ?? [];
  const localizedAssetChecklist = pickLocale(assetChecklist, locale) ?? [];
  const copyButtonLabels = {
    copyLabel: t(pageCopy.copy),
    copiedLabel: t(pageCopy.copied),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
                <Image
                  src="/public-busabase/assets/icons/icon.svg"
                  alt="Busabase"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain p-2"
                />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                {copy.name}
              </h1>
              <p className="mb-2 text-base text-muted-foreground">{copy.tagline}</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">5.0</span>
                </div>
                <span className="text-sm text-muted-foreground">{t(pageCopy.launchKit)}</span>
                <span className="text-sm text-muted-foreground">{t(pageCopy.aiDataReview)}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:w-auto">
            <Link
              href="https://busabase.com"
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
          {categories.map((category, index) => (
            <span key={category} className="contents">
              {index > 0 && <span>·</span>}
              <span>{category}</span>
            </span>
          ))}
        </div>

        <div className="mb-8">
          <div className="space-y-3 text-base leading-relaxed text-foreground">
            <p>{t(pageCopy.introOne)}</p>
            <p>{t(pageCopy.introTwo)}</p>
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
        </div>

        <div className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground">{t(pageCopy.makerComment)}</h2>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(pageCopy.variant)}
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {t(selectedVariant.label)}
              </div>
            </div>
            <CopyButton value={copy.makerComment} {...copyButtonLabels} />
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {copy.makerComment}
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-bold text-foreground">{t(pageCopy.listingCopy)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t(pageCopy.listingHelp)}
            </p>
          </div>
          <div className="mb-5 rounded-lg border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">{t(pageCopy.variant)}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{copy.variantNote}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {productHuntCopyVariants.map((variant) => {
                const isSelected = variant.id === selectedVariant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {t(variant.label)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CopyCard title={t(pageCopy.name)} value={copy.name} {...copyButtonLabels} />
            <CopyCard title={t(pageCopy.tagline)} value={copy.tagline} {...copyButtonLabels} />
            <div className="lg:col-span-2">
              <CopyCard
                title={t(pageCopy.productCategories)}
                value={copy.productCategories}
                multiline
                {...copyButtonLabels}
              />
            </div>
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
                value={draft.copy}
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
                value={draft.copy}
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
              {localizedFaqs.map((faq) => (
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
            <div className="mb-5">
              <h2 className="text-base font-semibold text-foreground">
                {t(pageCopy.launchAssetChecklist)}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(pageCopy.checklistHelp)}
              </p>
            </div>
            <ul className="space-y-3">
              {localizedAssetChecklist.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <Check className="mt-1 size-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">{t(pageCopy.companyInfo)}</h2>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t(pageCopy.website)}</div>
              <Link
                href="https://busabase.com"
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                busabase.com
              </Link>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t(pageCopy.positioning)}</div>
              <div className="text-sm text-foreground">{t(pageCopy.positioningValue)}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t(pageCopy.gallerySource)}</div>
              <div className="text-sm text-foreground">
                apps/busabase-cloud/scripts/gallery/slides.ts
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
