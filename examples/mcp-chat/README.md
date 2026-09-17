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

The example depends on `@sinups/ai-kit` from npm, not on the workspace copy, so running it proves the
published build works in a plain app.

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

`yarn dev` listens on localhost only. To try the chat from a phone or another machine on the same
network, start it with `yarn dev:lan` and open `http://<your-ip>:4200`.

That binds the dev server to every interface, so **anyone on that network can use the chat** — they
talk to your MCP server with your credentials and your model quota. The credentials themselves stay
on the server: `.env.local` is read in the route handlers and no token is ever sent to the browser.
Use `dev:lan` on a network you trust, and stop it when you are done.

## Point it at another MCP server

Both transports are supported, picked with `MCP_TRANSPORT` in `.env.local`.

**Another stdio server** — set the command:

```bash
MCP_TRANSPORT=stdio
MCP_SERVER_NAME=git
MCP_COMMAND=uvx
MCP_ARGS=mcp-server-git,--repository,/path/to/repo
```

`MCP_ARGS` is a comma-separated argument list, where `{dataDir}` stands for the absolute path of the
sample folder.

**An HTTP server** — set the endpoint, and credentials if it needs them:

```bash
MCP_TRANSPORT=http
MCP_SERVER_NAME=layers
MCP_URL=http://localhost:8091/mcp
MCP_TOKEN=<token>
MCP_HEADERS=X-Layers-Profile:core
```

`MCP_TOKEN` is sent as `Authorization: Bearer <token>`; `MCP_HEADERS` is a comma-separated list of
`Name:value` pairs for anything else the server expects. Both belong in `.env.local`, which stays out
of git — `.env.example` holds placeholders only, and no credential is ever logged or shown in the UI
(the server bar shows the URL, never the headers).

For the Layers MCP server that means starting it on `http://localhost:8091/mcp` first (its own
repository documents how) and pointing the example at it with the block above. Restart `next dev`
after editing `.env.local`.

The tool cards need no configuration either way: their titles come from the tool name in the part
type, so a new server shows up correctly on its own.

## How it works

| File | Role |
| --- | --- |
| `lib/config.ts` | Reads the environment and builds the MCP server config for either transport |
| `lib/agent.ts` | Runs `query()` from the agent SDK and turns its messages into a small NDJSON event stream |
| `lib/approvals.ts` | Parks the SDK's `canUseTool` callback until the browser answers |
| `app/api/chat/route.ts` | Streams the events of one turn |
| `app/api/approvals/route.ts` | Receives the allow/deny decision and releases the parked call |
| `lib/use-agent-chat.ts` | Builds `ChatMessage[]` from the events: text parts and `tool-mcp__*` parts |
| `app/mcp-tool-card.tsx` | Tool renderer: `McpTool` plus `ToolApprovalFooter` while a call waits |
| `app/page.tsx` | `AgentChat` with the renderers keyed by part type, plus a small server bar |

The agent runs with the built-in tools disabled (`tools: []`) and `strictMcpConfig`, so everything it
can do comes from the configured MCP server.
