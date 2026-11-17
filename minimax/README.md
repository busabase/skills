# Busabase Skill for MiniMax Code

Use Busabase to work with the records, docs, files and skills your team shares. This package
provides the complete Busabase Skill and its reference files. It uses the Busabase CLI or API
connection available to your agent's execution environment.

## Install and connect

Use MiniMax Code's plugin import or marketplace entry available to your account and provide this
package. Its root contains `.minimax-plugin/plugin.json`; do not add another enclosing directory
inside the ZIP. The manifest declares only the `busabase` Skill.

Ask MiniMax to use the Busabase Skill. It checks for an existing connection and guides device
sign-in when needed. Complete the login in your own browser and select the intended workspace.
Keep credentials in the local or cloud execution environment's credential store; do not paste
keys into chat or add them to the package. A local CLI login and a separate cloud runtime each
need their own usable connection.

The Skill's connection guide is at `skills/busabase/references/connect-and-space.md`. After
connecting, verify the account and target space, read its space instructions, then list its Bases
before requesting a change.

## Native MCP connector status

This is a Skill-only plugin: it does not install an authenticated MiniMax MCP connector.
MiniMax requires user-authenticated remote MCP services, including OAuth and user-entered API
keys, to complete its App/Connector onboarding before a plugin can reference an assigned provider.
Busabase's canonical MCP endpoint is `https://busabase.com/api/mcp`; adding a regular MCP JSON
file would bypass that required integration process. Native connector support is pending MiniMax
provider onboarding.

## Maintainers and publication

Generate `skills/busabase/` by copying the COMPLETE canonical `skills/busabase/` directory from the
same public Busabase skills release, including every reference and its LICENSE. Its upstream
source is `.agents/skills/busabase/` in kapps. Do not maintain a separate MiniMax Skill body or
render the MCP-only template into this package. `icon.png` is the existing Busabase plugin icon.

Submit a ZIP or public GitHub repository/subdirectory through MiniMax's documented third-party
form. Choose Desktop/Cloud and CN/US in the form, then retain the submission id for status queries.
Increment the plugin version whenever package content changes. Submission, client installation
and authenticated tasks require separate acceptance; package validation alone does not assert them.

[MiniMax plugin marketplace](https://code.minimax.io/docs/code/agents/plugins) ·
[Native package and submission guide](https://code.minimax.io/docs/code/agents/plugin-submission)
