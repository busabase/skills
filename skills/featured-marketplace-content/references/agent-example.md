# Featured Agent Example

```ts
import { defineFeaturedMarketplaceItem } from "../featured-marketplace-define";

export default defineFeaturedMarketplaceItem({
  slug: "wechat-editor",
  kind: "agent",
  status: "published",
  title: "WeChat Editor",
  metaTitle: "WeChat Editor AI Agent Template for Article Publishing",
  metaDescription:
    "Turn a topic into a reviewable WeChat article workflow with research, drafting, structure, and publishing preparation.",
  category: "Marketing",
  tags: ["Marketing", "Content", "Publishing"],
  author: {
    name: "Buda Team",
    role: "Marketplace Editors",
  },
  publishedAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
  keywords: [
    "WeChat editor AI agent template",
    "AI content agent",
    "WeChat article generator",
    "AI publishing agent",
  ],
  hero: {
    eyebrow: "Featured agent template",
    headline: "WeChat Editor",
    description:
      "A 24/7 AI editor that researches, writes, illustrates, formats, and prepares articles for your WeChat Official Account.",
  },
  overviewMarkdown: [
    "WeChat Editor takes a single topic and turns it into a structured, reviewable article draft. It gathers context, proposes a clear outline, writes the body, and prepares publishing-ready assets.",
    "Because it runs as a Buda agent, the work happens inside a workspace where teammates can review the artifact before it goes live.",
    "- Researches the topic and pulls in supporting facts",
    "- Writes in a consistent brand voice",
    "- Prepares illustrations and article structure",
    "- Keeps the final draft visible in Buda Drive",
  ].join("\n\n"),
  steps: [
    {
      title: "Set your topic",
      description:
        "Enter the subject, choose a tone, and add source links or key points when you need tighter direction.",
    },
    {
      title: "The agent researches and drafts",
      description:
        "WeChat Editor gathers context, structures an outline, and writes a full article draft.",
    },
    {
      title: "Review and publish",
      description:
        "You review the draft and assets in Buda before moving it into your publishing workflow.",
    },
  ],
  useCasesMarkdown: [
    "- **Content publishing:** Keep a steady WeChat publishing cadence without writing every article from scratch.",
    "- **Campaign amplification:** Turn campaign themes, product updates, or event notes into reviewable article drafts.",
    "- **Brand operations:** Maintain a consistent official-account voice while keeping human review in the workflow.",
  ].join("\n\n"),
  faqs: [
    {
      question: "What is the WeChat Editor agent?",
      answer:
        "WeChat Editor is an AI agent template that turns a topic into a structured WeChat article workflow with research, drafting, review, and publishing preparation.",
    },
    {
      question: "Does it publish automatically?",
      answer:
        "The first version focuses on creating reviewable artifacts in Buda. Teams can connect it to their own publishing process after review.",
    },
    {
      question: "How is it different from a generic writing tool?",
      answer:
        "It is designed as a repeatable agent workflow: topic intake, research, outline, draft, asset preparation, and review in one workspace.",
    },
  ],
  reviews: [],
  cta: {
    primaryLabel: "Hire this agent",
  },
  installs: 41,
  skillCount: 6,
});
```
