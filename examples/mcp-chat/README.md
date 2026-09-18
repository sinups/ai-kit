# Chat over MCP

A Next.js app that puts an agent in front of an MCP server and renders the whole exchange with the
published [`@sinups/ai-kit`](https://www.npmjs.com/package/@sinups/ai-kit) package.

What it shows:

- assistant text streamed token by token into the kit's markdown renderer;
- every MCP call rendered as a tool card — `ToolRenderer` routes `tool-mcp__<server>__<tool>` parts
  to `McpTool`, which names the server, the tool and shows the JSON result;
- an approval step: the agent asks before each call and the answer comes from
  `ToolApprovalFooter` under the card;
- tool errors, a chat-level error card, and the composer with suggestions.

The example runs against the kit **in this repository**, not the published package: `yarn dev`
rebuilds `package/dist` and Next resolves `@sinups/ai-kit` to it through a yarn portal. That is a
development setup — it lets the example use work that has not been released yet, such as the
streaming smoothing, and it means `node_modules` of the example and of the repository both exist, so
`next.config.ts` pins React, Mantine and the icons to the example's own copies. An app outside this
repository installs `@sinups/ai-kit` from npm and needs none of that.

## Prerequisites

- Node.js 20+ and Yarn 4.
- A Claude Code session already logged in on this machine. The app talks to Claude through
  `@anthropic-ai/claude-agent-sdk`, which reuses that session — there is no API key anywhere in this
  example and none is needed.
- Network access to `npx`, which starts the MCP server on the first message.

## Run

```bash
cd examples/mcp-chat
cp .env.example .env.local          # optional, the defaults work as they are
yarn install
yarn dev                            # http://localhost:4200
```

Ask something about the sample folder, for example `What is in the sample folder?`. The agent calls
the filesystem MCP server, the call appears as a card with an **Allow** / **Deny** footer, and the
answer streams in once the call is allowed.

The sample folder is `data/` — three short anonymised files. The MCP server is scoped to it, so the
agent cannot read anything else on the machine.

### Opening it from another device

`yarn dev` listens on localhost only. Reaching the chat from a phone or another machine takes two
settings, not one:

```bash
DEV_ORIGINS=192.168.0.7    # in .env.local: this machine's address on the network
yarn dev:lan               # then open http://192.168.0.7:4200
```

`dev:lan` binds the dev server to every interface. `DEV_ORIGINS` feeds `allowedDevOrigins` in
`next.config.ts`, which is what lets the dev server answer requests whose origin is not localhost —
without it the page loads and every call to `/api/*` is refused, so the chat looks alive and answers
nothing. It takes hostnames or addresses separated by commas; network ranges such as
`192.168.0.0/16` are not accepted.

Both together mean **anyone on that network can use the chat** — they talk to your MCP server with
your credentials and your model quota. The credentials themselves stay on the server: `.env.local` is
read in the route handlers and no token is ever sent to the browser. Use `dev:lan` on a network you
trust, and stop it when you are done.

## Approving tool calls

Every call needs a decision the first time. The footer under the card carries what the agent is
about to do — the tool's own title and arguments in words, a badge for the server that asked, and a
risk level taken from the tool's MCP annotations (`readOnlyHint` reads, `destructiveHint` changes).
**Why?** expands the tool's description and what the call will touch.

The approve button has scopes: **Allow once**, **Allow for this chat**, and **Always allow this
tool**, which saves a permission rule. **Deny** sends the refusal back to the agent, which says what
it could not do.

Saved rules live on the server, keyed by the chat: a reload starts over and one tab cannot approve
tools for another. The **Permissions** tab of the inspector lists them and lets you add or delete
rules by hand; a call approved by a rule says so on its card instead of asking again. The
**Auto-approve** switch in the header approves everything without asking and is off by default.

Each card keeps its outcome as a badge: `Allowed once`, `Allowed`, `By rule`, `Auto` or `Denied`.

## The inspector

The panel on the right has two tabs, and turns into a bottom sheet under 1100px:

- **Servers** — the configured servers, each with its transport and tool count, and
  `McpServerDetail` for the selected one, fed by a real MCP handshake (`lib/mcp-tools.ts` connects
  with the official MCP SDK): connection status, version, and every tool with its description,
  annotations and input schema;
- **Permissions** — `PermissionRulesPanel` over the rules this chat has saved.

## Connecting MCP servers

`MCP_SERVERS` in `.env.local` is a JSON array; every entry needs a name and either a `url` (HTTP) or
a `command` with `args` (stdio):

```bash
MCP_SERVERS=[{"name":"files","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","{dataDir}"]},{"name":"context7","url":"https://mcp.context7.com/mcp"}]
```

`{dataDir}` in an argument becomes the absolute path of the sample folder. `token` on an entry is
sent as `Authorization: Bearer …`, `headers` adds anything else; both belong in `.env.local`, which
stays out of git, and neither is ever sent to the browser — the UI shows the URL alone.

The single-server keys of earlier versions (`MCP_SERVER_NAME`, `MCP_TRANSPORT`, `MCP_URL`,
`MCP_TOKEN`, `MCP_HEADERS`, `MCP_COMMAND`, `MCP_ARGS`) still work: that server is added first and
`MCP_SERVERS` is appended to it, so an existing `.env.local` keeps working while public servers are
added next to it.

### Public servers to try, none of which needs a key

| Server | What it does |
| --- | --- |
| `{"name":"files","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","{dataDir}"]}` | The sample folder of this example: list, read, search |
| `{"name":"context7","url":"https://mcp.context7.com/mcp"}` | Current documentation and code examples for public libraries |
| `{"name":"deepwiki","url":"https://mcp.deepwiki.com/mcp"}` | Questions about a public GitHub repository and its wiki |
| `{"name":"fetch","command":"uvx","args":["mcp-server-fetch"]}` | Reads a URL and returns it as markdown |
| `{"name":"git","command":"uvx","args":["mcp-server-git","--repository","/path/to/repo"]}` | History, diffs and branches of a local repository |

All five were checked against this example. Restart `next dev` after editing `.env.local`.

### Several servers at once

Every server is listed in the header with its transport, and the inspector switches between them:
status, version and the tools each one exposes. A tool call says which server it belongs to, and a
saved permission rule is per server and tool (`mcp__context7__query-docs`), so allowing a tool on
one server says nothing about another. A server that fails to connect turns red in the header and
shows its error in the panel; the others keep working, and the agent is told which one is down.

## The system prompt

A chat over MCP is only as good as what the model was told about the server, and the tool catalogue
alone does not say it: it lists 120 ways to act without saying which to reach for first, what a
failure means, or how long an answer should be. `lib/system-prompt.ts` builds that in three layers,
and the result is assembled per turn from the live handshake, not written by hand:

1. **Core** — the same for every server: answer in the user's language (Cyrillic, or Russian typed on
   the wrong keyboard layout, means Russian); act instead of interviewing, take the obvious default
   and name the assumption in one line afterwards; at most one question, asked with candidates
   instead of open; no warm-up calls to resolve ids the tool resolves itself; errors are information
   — candidates mean "which one", throttling means wait and repeat, a refusal is reported and not
   worked around; answers two to four lines, no retold tool output. The approval footer is the
   confirmation step, so the model is told not to ask for permission on top of it.
2. **Generated** — read off the handshake `lib/mcp-tools.ts` already performs: the server's name, the
   opening of its own `instructions` field, how many tools it has and how many are read-only, and the
   tools carrying `destructiveHint` by name, since those are the ones worth a question.
3. **Playbook** — hand-written operating notes for a server the example recognises, matched on its
   tool names. The Layers one covers the entity hierarchy, orienting once per conversation, the
   multi-workspace disambiguation error, working by name rather than id, `__me__` for the caller,
   `*Name` versus `*Id` fields, and the bulk tools.

Only the third layer knows about a product, so pointing the example at a public server such as
context7 still yields the core rules plus whatever that server says about itself — no Layers wording
leaks in. `AGENT_CONTEXT` in `.env.local` appends a free-text block at the end, which is where a
default workspace or a house style belongs.

## How it works

| File | Role |
| --- | --- |
| `lib/config.ts` | Reads the environment and builds the list of MCP servers, migrating the old single-server keys |
| `lib/system-prompt.ts` | Core rules, a section generated from each server's handshake, and the playbook for a server it recognises |
| `lib/agent.ts` | Runs `query()` from the agent SDK and turns its messages into a small NDJSON event stream |
| `lib/approvals.ts` | Parks the SDK's `canUseTool` callback until the browser answers |
| `app/api/chat/route.ts` | Streams the events of one turn |
| `app/api/approvals/route.ts` | Receives the allow/deny decision and releases the parked call |
| `lib/use-agent-chat.ts` | Builds `ChatMessage[]` from the events: text parts and `tool-mcp__*` parts |
| `lib/permissions.ts` | Per-chat allowlist and the auto-approve flag, kept on the server |
| `app/mcp-tool-card.tsx` | Tool renderer: `McpTool` plus `ToolApprovalFooter` while a call waits |
| `app/page.tsx` | `AgentChat` with the renderers keyed by part type, plus a small server bar |

The agent runs with the built-in tools disabled (`tools: []`) and `strictMcpConfig`, so everything it
can do comes from the configured MCP server.
