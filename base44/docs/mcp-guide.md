# Add the Busabase MCP to Base44

> **Build time only.** A Base44 MCP connection lets the **AI chat help you while you build**. It does
> **not** run in your published app: Base44's docs say MCP connections "cannot be called from app
> flows, workflows, backend functions, or via invokeLLM at runtime", and data the AI pulls through an
> MCP is written into your app at build time and never refreshes. For anything your live app must do,
> use the [custom integration](import-guide.md) or the [backend functions](../README.md#two-way-sync).

Use it to let the AI chat read your Busabase Bases (field names, sample records, rules) so what it
generates fits your real data model.

**Requirements:** a Base44 **Builder plan or higher**. Connections belong to **your account**, apply
to every app in every workspace you can reach, and are visible only to you (collaborators add their
own). An account can hold up to 20.

## Add it

1. Click your **workspace name** at the bottom left, then **Account settings**.
2. Click **Builder** and scroll to **MCP Connections**.
3. Click **Add custom MCP** (or **Add MCP** if you already have one).
4. Fill in:

   | Field | Value |
   | --- | --- |
   | Name | `Busabase` |
   | URL | `https://busabase.com/api/mcp` (self-hosted: `https://your-host/api/mcp`) |
   | Authentication | **OAuth** |

5. Click **Authorize & Add**. A window opens on busabase.com: sign in, review the `mcp` scope, choose
   the **space**, a **permission level** and an **expiry**, and approve. Busabase uses OAuth
   discovery, dynamic client registration and PKCE, so there is no client secret to paste.

   **Pick `read`.** The AI chat only needs to look at your data. With `changeRequest` it could
   propose changes (a human still reviews them); `write` would let it change data directly.

   *If OAuth is not possible:* choose **Not required**, add a custom header
   `Authorization` = `Bearer <Busabase API key>` (a `read`-level key), and click **Test & Add**.

6. The connection appears in the list with an on/off toggle. Turn it off to stop the AI chat using
   it without losing the setup.

New or changed tools can take up to 15 minutes to show up in the AI chat; switching the connection
off and on picks them up at once. If the OAuth sign-in expires, remove the connection and add it
again. MCP use adds to your credit usage because the AI reads more.

## Two prompts to try

Name the MCP in the prompt, as Base44 recommends ("Use the Busabase MCP to …").

**1. Read a Base and generate typed wiring code**

> Use the Busabase MCP. List the Bases in my space, then open the one called "Orders" and read its
> fields (slugs and types, including select options) and three sample records. Then create a
> `BusabaseOrder` TypeScript type that matches exactly, and a `toBusabaseFields(order)` function that
> maps my Base44 `Order` entity to those field slugs. Use the Busabase custom integration
> (`base44.integrations.custom.call("busabase", …)`) for every runtime call; do not call the MCP from
> app code and do not put any API key in the code.

**2. Wire up the two-way sync from a real schema**

> Use the Busabase MCP to read the field slugs of the Busabase Bases "Orders" and "Customers" and the
> id of each Base. Then update `base44/shared/mappings.ts` so every field of my `Order` and `Customer`
> entities that has a matching Busabase field is mapped, set both Base ids, and tell me which fields
> on either side have no match. Keep `base44_id` as the source id field. Do not write any secret into
> a file; list the secrets I need to set (`BUSABASE_API_KEY`, `BUSABASE_WEBHOOK_SECRET`).

## Is it the right tool?

| Need | Use |
| --- | --- |
| AI chat reads Busabase while building | This MCP connection |
| The published app reads or writes Busabase | [Custom integration](import-guide.md) |
| Data flows automatically both ways | [Backend functions + workflows](../README.md#two-way-sync) |
| An outside assistant (Claude, ChatGPT, Cursor) works with *your Base44 app* | The opposite direction: Base44's own MCP server, see Base44's docs |
