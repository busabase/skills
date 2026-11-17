# OpenHands integration submission draft

`catalog/busabase.json` is a draft for `OpenHands/extensions/integrations/catalog/busabase.json`.
It passes the current upstream JSON Schema. Its OAuth URLs, public-client authentication, scopes,
and PKCE method were read from Busabase's public authorization-server metadata.

OpenHands SDK 1.49.2+ can also reuse this repository's portable root package directly; no
OpenHands-specific duplicate Skill is required.

Submit the single catalog entry through an upstream pull request after authenticated acceptance.
The upstream package generates its catalog index from these entries. Updates use another PR to the
same file; merging a listing does not publish a new Busabase server or authorize any user.

For a manual connection, open Agent Canvas **Customize → MCP Servers → Add custom server**, choose
SHTTP, enter `https://busabase.com/api/mcp`, select OAuth, test and save the connection. Start a new
conversation and ask it to call `auth_verify`. OAuth may request client information in some setups;
verify discovery/registration in a live account before calling this draft fully accepted.

No API keys, client secrets or user/workspace identities are included. Authenticated connection,
real workspace operations, upstream catalog CI and review remain pending. No submission was sent.

Sources: [catalog contract](https://github.com/OpenHands/extensions/blob/main/integrations/README.md),
[JSON Schema](https://github.com/OpenHands/extensions/blob/main/integrations/catalog.schema.json),
[MCP settings](https://docs.openhands.dev/openhands/usage/settings/mcp-settings),
[portable package support](https://docs.openhands.dev/overview/agent-plugins),
[Busabase OAuth metadata](https://busabase.com/.well-known/oauth-authorization-server).
