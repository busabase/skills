# Busabase for Gemini CLI

This extension bundles Busabase's MCP server and the shared Busabase skill. The extension root
contains `gemini-extension.json` and `skills/busabase/SKILL.md`. No credential belongs in either file.

Google continues to support Gemini CLI for Code Assist Standard/Enterprise and paid API-key users.
Google ended Gemini CLI service for Google AI Pro/Ultra and free Code Assist individual users on
June 18, 2026, and directs those users to Antigravity CLI. This package targets Gemini CLI's
supported extension format; the `antigravity/` package provides Antigravity's native format.

From a checkout of this repository, install this directory:

```sh
gemini extensions install ./gemini
gemini extensions list
```

For a release archive, extract it and pass the extracted directory to `gemini extensions install`.
The archive must have `gemini-extension.json` at its root. Restart Gemini CLI after installation,
inspect `/mcp`, and complete the standard browser authorization flow with `/mcp auth busabase`.
Authorize the intended Busabase account and workspace. Installation alone does not authorize access.

The `busabase` skill is discovered from the extension's `skills/` directory. Ask Gemini CLI to use
Busabase for a workspace task; it verifies the connection and reads that workspace's instructions
before acting. Writes depend on the selected connection's permissions and can wait for review.

Update the checkout with `git pull --ff-only`, then run `gemini extensions update busabase` and
restart Gemini CLI. The manifest version must change for the update to be detected. For local edits
that keep the same version, uninstall and install the directory again. Remove the local installation
with `gemini extensions uninstall busabase`.

## Git distribution and the official gallery

This repository's `gemini/` subdirectory is a local-install and archive source. Installing the
repository URL as a Gemini extension does not select this subdirectory.

For a future dedicated public extension repository, put this directory's contents at the repository
root. Users can then run `gemini extensions install <extension-repository-url>` and optionally pin
a tag with `--ref <tag>`; `gemini extensions update busabase` checks that source for updates.
Keep the manifest version and release tags in sync. GitHub Release archives must also contain
`gemini-extension.json` at the archive root.

Gallery discovery additionally requires the public repository's `gemini-cli-extension` GitHub topic.
Google's crawler checks tagged repositories daily and validates their root manifest. A local install
or an archive does not demonstrate gallery listing. No dedicated repository or gallery submission
is created by this package.

For an isolated local verification, Gemini CLI documents
`GEMINI_CLI_HOME=/path/to/test-state`; it creates its `.gemini` state inside that directory.

References: [extension reference](https://geminicli.com/docs/extensions/reference/),
[install extensions](https://geminicli.com/docs/extensions/reference/#install-an-extension),
[release extensions](https://geminicli.com/docs/extensions/releasing/),
[MCP OAuth](https://geminicli.com/docs/tools/mcp-server/), and
[configuration](https://geminicli.com/docs/reference/configuration/), and
[Google's availability announcement](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/).
