# Featured Skill Example

```ts
import { defineFeaturedMarketplaceItem } from "../featured-marketplace-define";

export default defineFeaturedMarketplaceItem({
  slug: "ppt-master",
  kind: "skill",
  status: "published",
  title: "PPT Master",
  metaTitle: "PPT Master AI Agent Skill for Presentation Generation",
  metaDescription:
    "Turn PDFs, links, Markdown, and rough source material into structured presentation decks agents can refine.",
  category: "Marketing",
  tags: ["Marketing", "Presentation", "PPT"],
  author: {
    name: "hugohe3",
    role: "Open-source Creator",
  },
  publishedAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  listingId: "mpl-mpc-mprz4G9GFxpvGEQZnCN-hugohe3-ppt-master-skill-ppt-master",
  keywords: [
    "PPT Master AI agent skill",
    "AI presentation generator skill",
    "AI PPT creation skill",
    "agent presentation workflow",
  ],
  hero: {
    eyebrow: "Featured agent skill",
    headline: "PPT Master",
    description:
      "Help agents convert documents, URLs, Markdown, and source content into presentation pages and editable PPTX decks.",
  },
  overviewMarkdown: [
    "PPT Master is an open-source skill for creating presentation decks from source material. It can work from PDFs, documents, URLs, Markdown, or user-provided content and help an agent turn them into presentation-ready pages.",
    "The workflow is designed for multi-step deck creation: source processing, project setup, strategy, visual execution, quality checks, and PPTX export.",
    "- Converts source documents into presentation-ready content",
    "- Supports PDF, DOCX, URL, Markdown, and other source formats",
    "- Creates SVG-based pages before exporting to PPTX",
    "- Helps agents follow a repeatable presentation generation workflow",
  ].join("\n\n"),
  steps: [
    {
      title: "Collect source material",
      description:
        "The agent starts from a document, URL, Markdown file, or user-provided topic and prepares it for deck generation.",
    },
    {
      title: "Plan the presentation",
      description:
        "The skill guides the agent through structure, audience, format, style, and content decisions before page creation begins.",
    },
    {
      title: "Generate and review pages",
      description:
        "The workflow creates presentation pages, checks quality, and prepares the deck for export.",
    },
    {
      title: "Export to PPTX",
      description: "The final SVG pages can be post-processed and exported into a PowerPoint deck.",
    },
  ],
  useCasesMarkdown: [
    "- **Presentation production:** Turn source documents or research notes into structured business presentations.",
    "- **Marketing and sales decks:** Help teams create campaign, product, or proposal decks from existing content.",
    "- **Research-to-slides workflows:** Convert reports, URLs, and long-form materials into presentation outlines and pages.",
  ].join("\n\n"),
  faqs: [
    {
      question: "What is the PPT Master skill?",
      answer:
        "PPT Master is an open-source skill that helps agents create presentation decks from documents, URLs, Markdown, and other source materials.",
    },
    {
      question: "Can it export to PowerPoint?",
      answer:
        "Yes. This skill outputs an editable PPTX file that you can open and refine in PowerPoint.",
    },
    {
      question: "When should an agent use this skill?",
      answer:
        "Use it when a workflow needs to create a PPT, make a presentation, generate slides, or turn source material into a structured deck.",
    },
  ],
  reviews: [],
  cta: {
    primaryLabel: "Use this skill",
  },
  installs: 23,
});
```
