# Partner Draft Package

Use this format when external partners cannot access the Buda repository but need to produce featured agent/skill configuration drafts.

## Directory Structure

```txt
featured-marketplace-drafts/
├── manifest.json
├── featured-skills/
│   ├── ppt-master.ts
│   └── xurl-skill.ts
├── featured-agents/
│   └── research-assistant-agent.ts
└── sources/
    ├── ppt-master.source.md
    ├── xurl-skill.source.md
    └── research-assistant-agent.source.md
```

Only include directories that have items. Keep TS config files repo-compatible so Buda maintainers can copy them into:

- `apps/buda/src/domains/marketplace/data/featured-skills/`
- `apps/buda/src/domains/marketplace/data/featured-agents/`

## Manifest

Create `manifest.json` at package root:

```json
{
  "packageVersion": 1,
  "createdAt": "2026-06-30T00:00:00.000Z",
  "createdBy": "partner-name-or-agent",
  "items": [
    {
      "slug": "ppt-master",
      "kind": "skill",
      "title": "PPT Master",
      "status": "draft",
      "targetPath": "apps/buda/src/domains/marketplace/data/featured-skills/ppt-master.ts",
      "sourceUrl": "https://buda.im/zh-CN/marketplace/mpl-example",
      "listingId": "mpl-example",
      "author": "hugohe3",
      "sourceNotesPath": "sources/ppt-master.source.md",
      "reviewNotes": [
        "Confirm category is Marketing.",
        "Install count was extracted from the marketplace page."
      ]
    }
  ]
}
```

Rules:

- Keep `packageVersion` as `1`.
- Use ISO timestamps.
- `status` should usually be `"draft"` for partner submissions.
- `targetPath` should point to the eventual Buda repo location.
- Include `listingId` only when a Buda marketplace URL exists.
- Include review notes for uncertain categories, dates, counts, or claims.

## Source Notes

Create one `sources/<slug>.source.md` file per item:

```md
# PPT Master Source Notes

## Source URLs
- Marketplace: https://buda.im/zh-CN/marketplace/mpl-example
- GitHub SKILL.md: https://github.com/example/repo/blob/main/skills/ppt-master/SKILL.md
- GitHub Repo: https://github.com/example/repo

## Extracted Facts
- Author: hugohe3
- Category: Marketing
- Installs: 23
- Published: 2026-06-01
- Updated: 2026-06-28
- Capabilities:
  - Converts source documents into presentation pages
  - Exports editable PPTX files

## Editorial Decisions
- Used `Open-source Creator` attribution.
- Avoided `Buda skill` wording because the source is community-authored.
- Set status to `draft` pending Buda review.

## Review Questions
- Confirm category.
- Confirm whether this should be published immediately.
```

## Partner Output Rules

- Do not update Buda repo `index.ts` files.
- Do not write changelog files.
- Do not invent reviews or install counts.
- Include source notes for every item.
- Keep generated TS files formatted and readable.
- Prefer `draft` status unless Buda explicitly asks for `published`.
- If packaging as zip, zip the package root:

```bash
zip -r featured-marketplace-drafts.zip featured-marketplace-drafts
```
