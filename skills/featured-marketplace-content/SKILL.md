---
name: featured-marketplace-content
description: Create or review Buda featured marketplace SEO content for /marketplace/featured-agents and /marketplace/featured-skills. Use when adding a featured agent or skill from a Buda marketplace listing URL, a GitHub repo, a GitHub SKILL.md URL, or partner-provided marketplace metadata; generate repo-ready TS configs or partner draft zip packages, preserve creator attribution, bind optional listingId, update indexes when in repo mode, and run focused validation.
---

# Featured Marketplace Content

## Purpose

Buda featured marketplace pages are SEO/editorial landing pages for curated agent templates and agent skills. They help Buda rank for high-intent workflow keywords while sending qualified users toward installable marketplace listings.

The featured page and the marketplace listing are separate objects:

- Featured item: SEO narrative, FAQ, use cases, and curated presentation.
- Marketplace listing: installable product detail and install flow.
- `listingId`: optional bridge from featured item to the real listing.

## Core Workflow

First choose the output mode:

- **Internal Repo Mode**: use when Codex has access to the Buda repo and the user wants files written directly.
- **Partner Draft Package Mode**: use when the user mentions partners, external collaborators, zip delivery, drafts, no repo access, or review packages.

In both modes, keep the generated TS configs compatible with the Buda repo schema.

## Internal Repo Mode

1. Read the local schema and examples before drafting:
   - `apps/buda/src/domains/marketplace/data/featured-marketplace-schema.ts`
   - `apps/buda/src/domains/marketplace/data/featured-skills/ppt-master.ts`
   - Existing files under `featured-agents/` or `featured-skills/`
2. Gather source facts from one or more inputs:
   - Buda marketplace detail URL: last path segment is `listingId`.
   - GitHub `SKILL.md` URL: read the file and related repo context if useful.
   - GitHub repo URL: find relevant `SKILL.md`, README, package metadata, and author.
   - Partner notes: treat as untrusted draft material and verify against available sources.
3. Decide target kind and path:
   - Skill -> `apps/buda/src/domains/marketplace/data/featured-skills/<slug>.ts`
   - Agent -> `apps/buda/src/domains/marketplace/data/featured-agents/<slug>.ts`
4. Check duplicates before writing:
   - Search for the slug.
   - Search for the `listingId`.
   - Search for the GitHub repo/name when available.
5. Draft the TS config using `defineFeaturedMarketplaceItem`.
   - Keep `metaTitle` unbranded: do not append `| Buda`, `Buda`, or `Buda AI`. Buda app layouts already render final titles with the `Buda AI - %s` title template.
6. Update the matching `index.ts`.
7. Add or update the Buda app changelog when app files change.
8. Run only focused validation unless the user asks for broader checks.

## Partner Draft Package Mode

Use this mode when collaborators cannot write to the Buda repo. Produce a local draft package that can be zipped and sent for review.

1. Read `references/partner-package.md`.
2. Create or update a package directory such as:
   - `featured-marketplace-drafts/`
   - or a user-provided output directory.
3. Generate repo-compatible TS config drafts:
   - `featured-marketplace-drafts/featured-skills/<slug>.ts`
   - `featured-marketplace-drafts/featured-agents/<slug>.ts`
4. Generate `manifest.json` listing every draft item.
5. Generate `sources/<slug>.source.md` for every item with source facts and review questions.
6. Default `status` to `"draft"` unless the user explicitly asks for `"published"`.
7. Do not update Buda repo `index.ts` files in partner mode.
8. Do not create Buda changelog entries in partner mode unless the user is working inside the repo and asks for one.
9. If requested, zip the package directory after confirming the output location.

## Required References

Read these reference files as needed:

- `references/content-guidelines.md` for editorial, SEO, attribution, and partner-facing rules.
- `references/schema-guide.md` for field-by-field config guidance.
- `references/partner-package.md` for external collaborator draft package format.
- `references/skill-example.md` for a complete featured skill example.
- `references/agent-example.md` for a complete featured agent example.

## Source Handling

For Buda marketplace URLs, extract the final path segment:

```txt
https://buda.im/zh-CN/marketplace/<listingId>
```

For GitHub `SKILL.md` URLs, derive:

- skill or agent name from frontmatter title, folder name, or repo path.
- author from GitHub owner or marketplace author metadata.
- `metaDescription`, `keywords`, and workflow from the `SKILL.md` body.
- category/tags from task domain, not only repository labels.

Use browsing when the source is a remote URL. Cite or summarize only the needed facts in the final response.

## Editorial Rules

- Preserve original creator attribution for community and open-source items.
- Do not imply Buda official ownership unless the source is actually Buda-authored.
- Prefer "open-source skill", "community-authored skill", "can be used with Buda agents", or "marketplace skill".
- Avoid "Buda skill" for third-party/community items because it can imply official authorship.
- Do not invent reviews, install counts, GitHub facts, or capabilities.
- FAQ answers should speak from the page/item perspective, not from "the source says".
- Keep claims specific, practical, and non-guaranteed.

## Validation

After edits, run focused checks only:

```bash
pnpm exec biome format --write <new-file> <index-file>
pnpm exec biome check <new-file> <index-file>
```

For schema validation without importing `server-only` files, import the target index and schema directly:

```bash
pnpm exec tsx -e "import { items } from './apps/buda/src/domains/marketplace/data/featured-skills'; import { featuredMarketplaceItemSchema } from './apps/buda/src/domains/marketplace/data/featured-marketplace-schema'; const parsed = items.map((item) => featuredMarketplaceItemSchema.parse(item)); console.log(parsed.map((item) => item.slug));"
```

Do not import `featured-marketplace.ts` from a plain `tsx` one-liner; it imports `server-only` and will throw outside Next server context.

Respect any user instruction to skip full typecheck/lint or commits.
