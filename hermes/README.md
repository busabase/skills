# Busabase in Hermes Agent

Current Hermes supports the portable Agent Plugins 1.0 files already at this repository's root:
`plugin.json`, `mcp.json` and `skills/`. Install disabled, review, then enable:

```sh
hermes plugins install busabase/skills --no-enable
hermes plugins list
hermes plugins enable busabase
hermes plugins update busabase
```

Portable installation is separate from authorization. Hermes' documented remote OAuth setup uses
`auth: oauth` in its native `mcp_servers` entry. If configuring that connection explicitly, use the
same `busabase` server name and `https://busabase.com/api/mcp`, then run `hermes mcp login busabase`
and call `auth_verify`. A native config entry overrides the package server with the same name.
Never put a token in the portable manifest or copy another profile's credentials.

`catalog-entry.draft.json` records a proposed catalog entry and the remaining review gates. The
catalog requires an owner/contributor PR and full commit SHA; updates require another reviewed SHA
bump. Portable developer docs and the catalog's older `plugin.yaml` prerequisite disagree, so
validate the pinned package with current Hermes and resolve that prerequisite before submitting.
The installed Hermes 0.14.0 predates this path; no current native load or OAuth claim is made.

Sources: [portable compatibility](https://hermes-agent.nousresearch.com/docs/developer-guide/plugins/),
[catalog admission](https://hermes-agent.nousresearch.com/docs/developer-guide/plugins/catalog-submission),
[OAuth](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).
