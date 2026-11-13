---
name: busabase-app-package-creator
description: >-
  Package an existing Busabase AirApp or workspace app into an installable package — correct
  manifest, bundled resources, versioning and install verification. Entry name for app-packaging
  work; the full format contract lives in the busabase-app-creator skill, which this alias
  delegates to.
---

# Busabase App Package Creator (alias)

This is an **entry-name alias** for [`busabase-app-creator`](../busabase-app-creator/SKILL.md) —
four entry names, one contract. The packaging format, its correctness rules and its review gates
are defined there, not here; do not improvise a package format from this file.

If `busabase-app-creator` is not installed in your environment, install it first:

```bash
npx skills add busabase/skills --skill busabase-app-creator
```

Then load its `SKILL.md` and follow it. For this entry name, your task is the packaging slice of
that contract:

- Start from an identified, working AirApp (in a live Space or as template files on disk) — if the
  app itself still needs building or fixing, that is `busabase-app-creator`'s main workflow, not a
  packaging shortcut.
- Assemble the package exactly as the contract specifies: manifest, the app blueprint, bundled
  files/assets, and the manual an installing agent reads.
- Version the package as the contract requires; never reuse a version for changed contents.
- Verify by installing the package into a scratch Space and opening the app before calling it done.

Publishing the package to the public `busabase/templates` catalog adds the
`busabase-template-creator` layer on top of the same contract.
