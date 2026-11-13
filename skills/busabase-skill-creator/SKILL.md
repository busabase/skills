---
name: busabase-skill-creator
description: >-
  Create or revise a Busabase Skill — a SKILL.md playbook that teaches an agent a repeatable job
  in a Busabase workspace — and package it for installation. Entry name for skill-authoring work;
  the package format contract lives in the busabase-app-creator skill, which this alias delegates
  to.
---

# Busabase Skill Creator (alias)

This is an **entry-name alias** for [`busabase-app-creator`](../busabase-app-creator/SKILL.md) —
four entry names, one contract. How a skill is packaged, versioned and verified is defined there,
not here; do not improvise a package format from this file.

If `busabase-app-creator` is not installed in your environment, install it first:

```bash
npx skills add busabase/skills --skill busabase-app-creator
```

Then load its `SKILL.md` and follow it. For this entry name, your task is the skill-authoring
slice:

- Author the `SKILL.md` itself: frontmatter `name` matching the skill's directory, a
  `description` that says what job it does and when to use it (agents pick skills by the
  description — write it for the task, not the brand), and a body that carries method and
  operating experience, not result snapshots.
- Keep the skill self-contained: an agent that installs only this skill must be able to do the
  job, or the body must name the companion skill to install (the way this alias names
  `busabase-app-creator`).
- Package and version it under the contract, then verify: install it fresh
  (`npx skills add … --skill <name>` against your checkout) and run one real task with it before
  calling it done.

A skill that will live inside a Busabase Space as a playbook node is written through the
`busabase` skill instead — this alias covers skills shipped as files/packages.
