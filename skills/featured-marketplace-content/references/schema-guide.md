# Schema Guide

Featured content is stored as TypeScript config files that behave like JSON with better editor support.

Always import:

```ts
import { defineFeaturedMarketplaceItem } from "../featured-marketplace-define";
```

## Fields

- `slug`: URL slug, lowercase hyphen-case. Do not add redundant `-skill` or `-agent`; the directory and page type already provide that context.
- `kind`: `"skill"` or `"agent"`.
- `status`: use `"published"` only when ready for indexing.
- `title`: human-readable page title.
- `metaTitle`: SEO title, specific and concise. Do not append `| Buda`, `Buda`, or `Buda AI`; Buda app layouts already render final page titles with the `Buda AI - %s` title template.
- `metaDescription`: SERP description and card subtitle. Write a natural workflow-benefit sentence, not a mechanical source label.
- `category`: one primary category.
- `tags`: 3-5 short scan labels.
- `author`: creator attribution. Preserve community/open-source authors.
- `publishedAt`: source listing publish date when known; otherwise current publish date.
- `updatedAt`: source listing update date when known; otherwise current date.
- `listingId`: optional marketplace listing id. Extract from Buda marketplace URL final path segment.
- `keywords`: target SEO query phrases. Use a string array; put the most important keyword first, followed by related phrases.
- `hero`: H1 area copy. Keep it specific.
- `overviewMarkdown`: what it does, maintained as markdown text.
- `steps`: 3-5 workflow steps.
- `useCasesMarkdown`: markdown bullet list of business use cases.
- `faqs`: real, useful questions; no invented claims.
- `reviews`: keep `[]` unless real authorized reviews are available.
- `cta`: usually only `primaryLabel`, such as `Use this skill` or `Hire this agent`. Add `secondaryLabel` only when the product explicitly needs a second CTA.
- `installs`: use marketplace install count if visible; otherwise `0`.
- `usedByAgentCount`: optional for skills.
- `skillCount`: optional for agents.

## File And Index Paths

In Internal Repo Mode, write files directly to the Buda repo and update the matching index. In Partner Draft Package Mode, write files under the draft package and do not update Buda repo indexes.

Skill file:

```txt
apps/buda/src/domains/marketplace/data/featured-skills/<slug>.ts
```

Skill index:

```ts
import pptMaster from "./ppt-master";

export const items = [existingSkill, pptMaster] as const;
```

Agent file:

```txt
apps/buda/src/domains/marketplace/data/featured-agents/<slug>.ts
```

Agent index:

```ts
import wechatEditor from "./wechat-editor";

export const items = [wechatEditor] as const;
```

## GitHub SKILL.md Inputs

When the source is a GitHub `SKILL.md` URL:

1. Open the URL.
2. Use frontmatter `name`/`description` when present.
3. Read the folder/repo owner for attribution.
4. Convert workflow instructions into `overviewMarkdown`, `steps`, and `useCasesMarkdown`.
5. If no Buda marketplace listing exists, omit `listingId`.
6. If the user asks for a draft only, set `status: "draft"` unless they explicitly want published.

For partner packages, default to `status: "draft"` even when a listing exists. Buda maintainers decide when to publish.
