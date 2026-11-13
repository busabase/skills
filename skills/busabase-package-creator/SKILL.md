---
name: busabase-package-creator
description: >-
  Author or revise a Busabase package — the installable bundle that apps, templates and skills
  ship as — with a correct manifest, contents and versioning. Entry name for package-authoring
  work; the full format contract lives in the busabase-app-creator skill, which this alias
  delegates to.
---

# Busabase Package Creator (alias)

This is an **entry-name alias** for [`busabase-app-creator`](../busabase-app-creator/SKILL.md) —
four entry names, one contract. The package format, its correctness rules and its review gates
are defined there, not here; do not improvise a package format from this file.

If `busabase-app-creator` is not installed in your environment, install it first:

```bash
npx skills add busabase/skills --skill busabase-app-creator
```

Then load its `SKILL.md` and follow it. For this entry name, your task is the package slice of
that contract:

- Decide what the package carries (an AirApp blueprint, a template, a skill, or a bundle) and lay
  out the files exactly as the contract's package format specifies.
- Write the manifest and the agent-facing manual the contract requires — an installing agent must
  be able to install and verify the package from the manual alone.
- Version deliberately; never reuse a version for changed contents.
- Verify by installing the package into a scratch Space before calling it done.

Packaging one specific existing AirApp is also reachable as `busabase-app-package-creator`;
publishing to the public `busabase/templates` catalog adds the `busabase-template-creator`
layer on top of the same contract.
