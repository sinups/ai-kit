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

## Point it at another MCP server

Any stdio MCP server works. Set the command in `.env.local`:

```bash
MCP_SERVER_NAME=git
MCP_COMMAND=uvx
MCP_ARGS=mcp-server-git,--repository,/path/to/repo
```

`MCP_ARGS` is a comma-separated argument list, where `{dataDir}` stands for the absolute path of the
sample folder. The tool cards need no configuration: their titles come from the tool name in the part
type, so a new server shows up correctly on its own.

Servers that need a token are configured the same way, through `.env.local`, which stays out of git.

## How it works

| File | Role |
| --- | --- |
| `lib/agent.ts` | Runs `query()` from the agent SDK and turns its messages into a small NDJSON event stream |
| `lib/approvals.ts` | Parks the SDK's `canUseTool` callback until the browser answers |
| `app/api/chat/route.ts` | Streams the events of one turn |
| `app/api/approvals/route.ts` | Receives the allow/deny decision and releases the parked call |
| `lib/use-agent-chat.ts` | Builds `ChatMessage[]` from the events: text parts and `tool-mcp__*` parts |
| `app/mcp-tool-card.tsx` | Tool renderer: `McpTool` plus `ToolApprovalFooter` while a call waits |
| `app/page.tsx` | `AgentChat` with the renderers keyed by part type, plus a small server bar |

The agent runs with the built-in tools disabled (`tools: []`) and `strictMcpConfig`, so everything it
can do comes from the configured MCP server.
