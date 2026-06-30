# Busabase Skills

Agent Skills for [Busabase](https://busabase.com) — the approval-first knowledge base where AI
proposes changes, a human reviews them, and only approved changes get merged.

## Install

```bash
npx skills add busabase/skills
```

This installs the **busabase** skill into your coding agent (Claude Code, Cursor, Codex, …). It is
small and evergreen: it reads your workspace base URL (and API key, on Cloud) from
`~/.busabase/.env`, and points at your workspace's live `/api/v1/openapi.json` for the full API.

To set up a workspace from scratch first, paste the onboarding prompt from your Busabase dashboard
(**Agent Skills** button) — it walks your agent through connecting, seeding a first Base, and then
running the install command above.

## Skills

| Skill | What it does |
| --- | --- |
| [`busabase`](./busabase/SKILL.md) | Drive a Busabase workspace over HTTP: list Bases/records, propose ChangeRequests, and merge approved ones. |
