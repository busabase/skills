# Busabase in Pi

Pi can load this repository's existing `skills/` directory as a Git package. No separate extension
is required for the CLI-oriented Busabase skills:

```sh
pi install git:github.com/busabase/skills
pi list
pi update --extensions
```

Use a reviewed commit after `@` to pin a Git install. Updates preserve a configured tag/commit pin;
change that source explicitly when adopting a newer reviewed revision. Remove the same source with
`pi remove git:github.com/busabase/skills`.

For native MCP instead, current Pi documents `pi mcp add busabase --url
https://busabase.com/api/mcp` and `pi mcp login busabase`. Complete OAuth and call `auth_verify`.
Skill-package installation itself does not configure or authorize MCP. Pi supports discovery and
client registration; saved server credentials are separate from the package. Project packages and
MCP configuration require project trust.

Pi 0.84.3 installed/listed the local repository and reconciled it with `pi update --extensions`,
using temporary `PI_CODING_AGENT_DIR` and session storage. OAuth and real workspace actions were not
run. npm gallery distribution additionally needs a real package tarball with the `pi-package`
keyword; no npm package was published or name reserved here.

Sources: [packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md),
[MCP](https://pi.dev/docs/latest/mcp),
[isolation](https://docs.pi.dev/latest/environment-variables).
