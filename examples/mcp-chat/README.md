# Chat over MCP

A Next.js app that shows what a chat over MCP servers could look like when it is built from
[`@sinups/ai-kit`](https://www.npmjs.com/package/@sinups/ai-kit). An agent answers through the MCP
servers you configure. The kit renders the transcript, the approval of each tool call, the composer and
an inspector with the servers and the saved permission rules.

The example is not published or deployed. It runs locally against the kit in this repository.

## What it shows

- **Header**: `ChatHeader` with the title, a button that opens the inspector, a language menu and
  a color scheme toggle.
- **Inspector**: `ChatInspectorLayout` with two tabs, **Servers** and **Rules**. The servers tab
  shows each configured server and `McpServerDetail` for the selected one, fed by a real MCP handshake:
  status, version, tools with their descriptions, annotations and input schemas. The rules tab shows
  `PermissionRulesPanel` over the rules this chat has saved.
- **Composer**:
  - `ModeSelector` with four permission modes.
  - `ModelPicker` over `lib/models.ts`; the chosen model is sent with each request.
  - `ContextUsage` next to the send button.
  - An `infoBar` with a reconnect action when a server does not answer.
- **Transcript**:
  - `presentation={quietPresentation}`: MCP calls are quiet lines, and the work before an answer
    folds into one line.
  - `toolCatalog` built from the handshake (`lib/tool-catalog.ts`), so calls read by readable
    titles. The Russian dictionary also renames several tools of the default servers.
  - `evenSpacing`, and `locale` and `labels` from the active dictionary.
  - The model's thinking, requested with `thinking: { type: 'adaptive', display: 'summarized' }`,
    streams into `tool-Thinking` parts.
  - Calls still open when a turn ends (stopped, failed or out of turns) are closed as interrupted.
- **Languages**: English and Russian dictionaries in `app/i18n/` (`en.ts` sets the shape, `ru.ts`
  must match it). The server renders in the language of the saved cookie or of `Accept-Language`;
  after mounting, the page switches to the choice stored in `localStorage` or to
  `navigator.language`. The header menu changes the language and remembers it. English passes no
  kit labels at all, the kit ships English defaults; Russian translates every kit component the
  page renders.
- **Approvals**: a call that needs a decision gets Allow and Deny through the `approvals` prop of
  `AgentChat`: **once**, **in this chat** and **always allow** through the rule suggestion, a risk
  level, a **Why?** explanation, and the rule that made the chat ask when an `ask` rule did.

## Prerequisites

- Node.js 20+ and Yarn 4.
- The agent runs on the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`). It reuses the CLI session
  already logged in on this machine, so the example has no API key setting.
- Network access for `npx`, which starts the filesystem server on the first request. The two HTTP
  servers are public and need no key.

## Run

```bash
cd examples/mcp-chat
cp .env.example .env.local   # optional, the defaults work as they are
yarn install
yarn dev                     # http://localhost:4200
```

`yarn dev` first builds the kit in the repository root (`yarn build:kit`), then starts `next dev` on
port 4200. The package resolves `@sinups/ai-kit` through a `portal:` link to `../../package`, so the
example uses unreleased work of the kit. `next.config.ts` pins React, Mantine and the icons to the
example's own `node_modules`, because the repository root has its own copies. An app outside this
repository installs the package from npm and needs none of this.

Try a starter action from the welcome screen, or ask `Who is on the team and in which time zones?`.

## Servers

`MCP_SERVERS` in `.env.local` is a JSON array. Every entry needs a `name` and either a `url` (HTTP)
or a `command` with `args` (stdio). `.env.example` connects three servers that need no credentials;
without `MCP_SERVERS` and the older keys below, only `files` is connected.

| Server | Entry | What it does |
| --- | --- | --- |
| `files` | `{"name":"files","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","{dataDir}"]}` | The official filesystem server, scoped to `./data` |
| `context7` | `{"name":"context7","url":"https://mcp.context7.com/mcp"}` | Documentation and code examples for public libraries |
| `deepwiki` | `{"name":"deepwiki","url":"https://mcp.deepwiki.com/mcp"}` | Questions about a public repository and its wiki |

- `{dataDir}` in an argument becomes the absolute path of `data/`, which holds three short sample
  files. The filesystem server cannot read anything outside it.
- `token` on an entry is sent as `Authorization: Bearer …`, and `headers` adds other headers. A stdio
  entry takes `env` for its secrets; keep secrets out of `args` and out of the URL. Keep all of them
  in `.env.local`, which git ignores.
- The browser sees each server's name, transport and address without credentials: scheme, host and
  path of a URL, or the bare command of a stdio server. Handshake errors are cleaned of every
  configured value before they reach the browser or the system prompt.
- The older single-server keys (`MCP_SERVER_NAME`, `MCP_TRANSPORT`, `MCP_URL`, `MCP_TOKEN`,
  `MCP_HEADERS`, `MCP_COMMAND`, `MCP_ARGS`) still work. That server is added first, and
  `MCP_SERVERS` is appended to it. An HTTP server set this way needs `MCP_URL`; there is no default
  address.
- A server that fails the handshake is marked in the inspector and announced in the composer
  `infoBar`; the others keep working.

Restart `yarn dev` after editing `.env.local`.

## Permission modes

The composer's `ModeSelector` decides which calls wait for the user (`lib/permissions.ts` stores the
mode per chat, and `canUseTool` in `lib/agent.ts` applies it):

| Mode | Behavior |
| --- | --- |
| `ask-writes` (default) | Read-only tools run at once; tools that change data wait for a decision |
| `ask-all` | Every call waits for a decision |
| `read-only` | Tools that change data are refused without running |
| `auto` | Every call runs at once |

`isReadOnlyTool` in `lib/mcp-tools.ts` classifies a tool. It trusts the server's `readOnlyHint` and
`destructiveHint` annotations first. Without them, `lib/tool-effect.ts` reads the tool name
conservatively: a tool only reads when every word of its name is a reading verb (`get`, `list`,
`read`, `search`…) or a neutral noun (`file`, `directory`, `docs`…) and at least one is a verb.
Any other word, such as `resolve`, `execute` or `mark`, makes it a write, so an unknown tool asks
instead of running.

Rules from the **Rules** tab are checked before the mode, in this order:

1. A `deny` rule refuses the call in every mode, `auto` included.
2. `read-only` refuses tools that change data.
3. An `ask` rule, or the `ask-all` mode, asks every time, whatever `allow` rules say.
4. An `allow` rule runs the call without asking, and its settled line says so.

Rules name a whole tool; a rule with a specifier is refused when it is saved, since MCP tools have no
arguments to match it against. Approving **in this chat** or **always allow** both save an `allow`
rule for this chat (the second opens the rule editor first). Rules and the mode live in server
memory, keyed by the chat: a page reload starts over, one tab cannot approve tools for another, and
the least recently used chats are forgotten past 200. A question nobody answers is refused after
10 minutes.

## System prompt

`lib/system-prompt.ts` builds the prompt for every turn from two parts:

1. **Core**: rules for any MCP server: answer in the user's language, act instead of asking questions,
   at most one question and only with candidates, treat errors as information, keep answers short.
   The approval step is the confirmation, so the model is told not to ask for permission on top of it.
2. **Generated**: one section per server, read off the handshake: the server's name, the start of its
   own `instructions`, the number of tools and read-only tools, and the tools marked
   `destructiveHint`.

Notes for your own server, such as a default project or house style, go in `AGENT_CONTEXT`. It is
appended at the end of the prompt, so the example code stays server-neutral.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `MCP_SERVERS` | `files` only; `.env.example` adds context7 and deepwiki | MCP servers as a JSON array |
| `AGENT_MODEL` | `claude-sonnet-5` | Model used when the request does not pick one from `lib/models.ts` |
| `AGENT_MAX_TURNS` | `30` | Maximum agent turns per request |
| `AGENT_CONTEXT_WINDOW` | `200000` | Context size shown by `ContextUsage` |
| `AGENT_CONTEXT` | empty | Extra instructions appended to the system prompt |
| `DEV_ORIGINS` | empty | Hosts allowed to reach the dev server with `yarn dev:lan` |

### Opening it from another device

`yarn dev` listens on localhost only. To reach the chat from another device, set `DEV_ORIGINS` to
this machine's address and run `yarn dev:lan`:

```bash
DEV_ORIGINS=192.168.0.7    # in .env.local
yarn dev:lan               # then open http://192.168.0.7:4200
```

`dev:lan` binds to every interface. `DEV_ORIGINS` feeds `allowedDevOrigins` in `next.config.ts`,
which lets those hosts load the development assets under `/_next`; without it the page from another
device does not come alive. The variable takes comma-separated hostnames or addresses, not network
ranges. With both set, anyone on that network can use the chat with your servers and model quota, so
use it only on a network you trust.

### Requests from other sites

Every `/api/*` route goes through `lib/request-guard.ts`: it accepts only `application/json` bodies,
and only from the page's own origin or a host listed in `DEV_ORIGINS`. A request another site sends
on your behalf (a form or a `no-cors` fetch) gets 403 before it can start a turn, change the mode or
answer an approval. `lib/validate.ts` then checks every body and answers 400 to anything else.

## How it works

| File | Role |
| --- | --- |
| `lib/config.ts` | Reads the environment and builds the server list, including the older single-server keys |
| `lib/mcp-tools.ts` | MCP handshake with the official SDK, tool definitions, `isReadOnlyTool` |
| `lib/tool-effect.ts` | Conservative read-or-write guess from a tool name, for tools without annotations |
| `lib/tool-catalog.ts` | `toolCatalog` for `AgentChat`, keyed `mcp__<server>__<tool>` |
| `lib/system-prompt.ts` | Core rules plus a generated section per server, then `AGENT_CONTEXT` |
| `lib/agent.ts` | Runs `query()` with built-in tools off (`tools: []`, `strictMcpConfig`), applies the permission mode in `canUseTool`, streams NDJSON events |
| `lib/approvals.ts` | Holds a pending `canUseTool` call until the browser answers, per chat, with a timeout |
| `lib/describe-call.ts` | Risk and effect of a call (`read`, `write`, `destructive`); the page words them from its dictionary |
| `lib/request-guard.ts` | Refuses cross-site requests and non-JSON bodies on every API route |
| `lib/validate.ts` | Checks the bodies of the API requests |
| `lib/permissions.ts` | Per-chat rules and permission mode, kept in server memory |
| `lib/models.ts` | Models offered by `ModelPicker` |
| `lib/events.ts` | Types of the event stream and the API requests |
| `lib/use-agent-chat.ts` | Turns the events into `ChatMessage[]`: text, `tool-Thinking` and `tool-mcp__*` parts, approvals, usage |
| `app/api/chat/route.ts` | Streams the events of one turn |
| `app/api/approvals/route.ts` | Receives a decision and releases the pending call |
| `app/api/permissions/route.ts` | Changes the mode and the rules of a chat |
| `app/api/servers/route.ts` | Handshake results for the inspector, `?refresh` reconnects |
| `app/api/status/route.ts` | Configured servers and the default model |
| `app/page.tsx` | `ChatInspectorLayout`, `ChatHeader` and `AgentChat` with approvals, catalog, presentation and composer actions |
| `app/inspector.tsx` | The inspector tabs: servers and rules |
| `app/i18n/` | Dictionaries (`en.ts`, `ru.ts`), the locale provider and `useLocale()`, the server-side language pick |
| `app/welcome.ts` | Starter actions and suggestions for the servers that connected |
