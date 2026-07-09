---
name: align
description: Alias for align-productready. Ensures consistency with apps/productready.
disable-model-invocation: false
allowed-tools: Skill
user-invocable: true
---

# Align Alias

This skill delegates to `align-productready`.

1. Invoke the `align-productready` skill immediately.
2. Pass any arguments provided by the user to the `align-productready` skill.
3. Do not perform any other actions yourself.

Example:
If user runs `/align npschimp`, you should run:
`skill: "align-productready", args: "npschimp"`
