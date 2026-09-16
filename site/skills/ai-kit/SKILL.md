---
name: ai-kit
description: |
  Use whenever the user wants to build or modify a chat, agent, or tool-calling
  UI in a React + Mantine project, especially if the code imports from
  `@sinups/ai-kit` or the package is listed in package.json.
  Triggers: "agent chat", "tool call UI", "streaming chat", "plan approval",
  "AgentChat", "InputBar", "tool renderer", mentions of AI UI Kit, or requests to add a new agent surface to a Mantine app.

  Do NOT use for plain chat UIs that don't need tool/plan/approval cards, for
  Tailwind/shadcn projects (use the upstream Agent Elements skill there), or
  for projects already committed to a different agent UI kit.
---

# AI UI Kit skill

Project-aware context for building chat and agent UIs with **AI UI Kit**, an npm package (`@sinups/ai-kit`) that ports AI UI Kit by
21st.dev to Mantine primitives and theme tokens. Docs:
`https://sinups.github.io/ai-kit`.

## What this skill gives you

When this skill loads, you know:

1. **Install is one package.** `npm install @sinups/ai-kit @mantine/core @mantine/hooks`,
   then import `@mantine/core/styles.css` and `@sinups/ai-kit/styles.css`
   once at the app root and render inside `MantineProvider`.
2. **The API is structurally compatible with the Vercel AI SDK.** Messages are
   `ChatMessage[]` (same shape as `ChatMessage` from `ai`), status is
   `ChatStatus`. `useChat()` output plugs in directly without importing `ai`.
3. **The full component catalog with API shapes and composition rules** (see
   sections below).
4. **Theming guardrails**: the components read Mantine CSS variables and the
   `--ae-*` custom properties; restyle through tokens, not by overriding
   internals.

## Detection

Consider this project ready for AI UI Kit if any of these are true:

- `package.json` dependencies include `@sinups/ai-kit`
- source files import from `@sinups/ai-kit`
- the project uses `@mantine/core` and the user asks for an agent or chat UI

If the package is missing, install it with the project's package manager and
add the two stylesheet imports next to `@mantine/core/styles.css`.

## Imports

Everything is exported from the package root:

```tsx
import {
  AgentChat, MessageList, UserMessage, ErrorMessage, Markdown,
  InputBar, Suggestions, ModelPicker, ModelBadge, ModeSelector,
  SendButton, AttachmentButton, FileAttachment,
  BashTool, EditTool, SearchTool, TodoTool, PlanTool, ToolGroup,
  SubagentTool, McpTool, ThinkingTool, GenericTool, QuestionTool,
  ToolRenderer, TextShimmer, SpiralLoader,
  parseMcpToolType, toolRegistry,
} from "@sinups/ai-kit";
import type { ChatMessage, ChatStatus, ToolPart } from "@sinups/ai-kit";
```

## Component catalog

### Chat surface

- **AgentChat** — the full chat shell. Renders `MessageList` + `InputBar`,
  handles tool invocations via `toolRenderers`, shows an empty state with
  optional `suggestions`. Props: `messages`, `status`, `onSend`, `onStop`,
  `toolRenderers?`, `suggestions?`, `attachments?`, `classNames?`, `slots?`.
- **MessageList** — transcript only. Use when you need the input bar somewhere
  else. Accepts `toolRenderers` and `showCopyToolbar`.
- **UserMessage / ErrorMessage / Markdown** — low-level message pieces.
  `Markdown` streams safely (external links get `rel="noreferrer"` by default).

### Input

- **InputBar** — composer. Props: `status`, `onSend({ content })`, `onStop`,
  `value?` + `onChange?` (controlled), `attachedImages`/`attachedFiles` with
  their remove handlers, `leftActions`/`rightActions` slots, `suggestions?`,
  `questionBar?`, `infoBar?`.
- **Suggestions** — quick-prompt chips for the empty state or inline.
- **ModelPicker / ModeSelector** — designed to drop into `leftActions`. Both
  accept a simple `{ id, name, version? }` / `{ id, label, icon?, description? }`
  shape. Do not import `CLAUDE_MODELS` — it was removed; supply your own array.
- **SendButton / AttachmentButton / FileAttachment** — usable standalone if
  you're building a custom composer.

### Tool cards

All tool cards accept a `part` prop of type
`Extract<ChatMessage["parts"][number], { type: \`tool-<Name>\` }>` from the AI
SDK. Register them via `toolRenderers` on `AgentChat`/`MessageList`:

```tsx
<AgentChat
  toolRenderers={{
    Bash: BashTool,
    Edit: EditTool,
    Write: EditTool,      // Write reuses EditTool
    Search: SearchTool,
    WebSearch: SearchTool,
    TodoWrite: TodoTool,
    PlanWrite: PlanTool,
    Task: SubagentTool,
    Thinking: ThinkingTool,
  }}
/>
```

Cards available:

- **BashTool** — command + stdout, collapsible.
- **EditTool** — diff card. Supports `input.old_string`/`input.new_string` or
  `output.structuredPatch`, plus an approval footer via `input.approval`.
- **SearchTool** — grouped search results. Pass `results` or use `output.results`.
- **TodoTool** — diffed todo list from `input.todos` vs `output.oldTodos`.
- **PlanTool** — plan title + summary with approve/reject footer.
- **ToolGroup** — collapses consecutive tool calls into one row.
- **SubagentTool** — sub-agent task with nested tools.
- **McpTool** — generic MCP tool output; use `parseMcpToolType` from
  `@sinups/ai-kit` to get `mcpInfo`.
- **ThinkingTool** — collapsible reasoning row.
- **GenericTool** — fallback for unknown tools.
- **QuestionTool** — clarifying question with single/multi/text answer kinds.

### Streaming states

- **TextShimmer** — shimmering status label.
- **SpiralLoader** — Lottie spiral; use for multi-second loading states.

## Composition patterns

### Full chat with tool rendering (most common)

```tsx
"use client";

import { AgentChat } from "@sinups/ai-kit";
import { BashTool } from "@sinups/ai-kit";
import { EditTool } from "@sinups/ai-kit";
import { SearchTool } from "@sinups/ai-kit";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const { messages, status, sendMessage, stop } = useChat();
  return (
    <AgentChat
      messages={messages}
      status={status}
      onSend={({ content }) => sendMessage({ text: content })}
      onStop={stop}
      toolRenderers={{
        Bash: BashTool,
        Edit: EditTool,
        Write: EditTool,
        Search: SearchTool,
      }}
    />
  );
}
```

### Composer with mode + model pickers

```tsx
import { InputBar } from "@sinups/ai-kit";
import { ModeSelector } from "@sinups/ai-kit";
import { ModelPicker } from "@sinups/ai-kit";
import { IconBulb, IconCursor } from "@tabler/icons-react";

const modes = [
  { id: "agent", label: "Agent", icon: IconCursor },
  { id: "plan", label: "Plan", icon: IconBulb },
];
const models = [
  { id: "sonnet", name: "Sonnet", version: "4.6" },
  { id: "opus", name: "Opus", version: "4.7" },
];

<InputBar
  status="ready"
  onSend={handleSend}
  onStop={handleStop}
  leftActions={
    <>
      <ModeSelector modes={modes} defaultValue="agent" />
      <ModelPicker models={models} defaultValue="sonnet" />
    </>
  }
/>
```

### Custom tool renderer

`toolRenderers` values are React components that receive `{ part, chatStatus }`.
Return whatever UI you want; reuse `GenericTool` as a fallback shell.

## Theming

The components read Mantine CSS variables and a set of `--ae-*` custom
properties defined by `@sinups/ai-kit/styles.css`. Restyle through them,
never by reaching into component internals:

- Colors: `--ae-bg`, `--ae-fg`, `--ae-fg-muted`, `--ae-border`, `--ae-primary`,
  `--ae-tool-bg`, `--ae-user-message-bg`, `--ae-diff-added-text`, ...
- Geometry: `--ae-radius`, `--ae-tool-radius`, `--ae-max-width`
- Fonts: `--ae-font-mono`, `--ae-font-size-sm`, `--ae-line-height-sm`

Override them on any ancestor (`.my-chat { --ae-max-width: 640px; }`) or through
the Mantine theme (`primaryColor`, `radius`, `fontFamily`). Light and dark
schemes follow `MantineProvider`.

## When NOT to use AI UI Kit

- Projects using `assistant-ui`, `ai-elements`, `copilotkit`, or another kit;
  don't mix.
- Tailwind + shadcn projects: use the upstream Agent Elements registry instead.
- Pure chat UIs that never render tool calls or plans: `InputBar` + your own
  message rendering may be enough; skip `AgentChat`.
- Mantine < 7: the components depend on Mantine CSS variables.

## Quick answers for common asks

- **"Add AI UI Kit to this project"** → run
  `npm install @sinups/ai-kit @mantine/core @mantine/hooks`, import
  `@mantine/core/styles.css` and `@sinups/ai-kit/styles.css` at the root,
  make sure a `MantineProvider` wraps the app.
- **"Switch the default SendButton look"** → pass `className`/`style` or
  override `--ae-send-button-bg` / `--ae-send-button-color`; the source is in
  the package (`input/SendButton.tsx`) if you need to fork it.
- **"Render a custom tool"** → map its type in `toolRenderers`; fall back to
  `GenericTool` for unknown tools.
- **"Use with useChat"** → pass `messages` and `status` straight through,
  translate `sendMessage`/`stop` to `onSend({ content })`/`onStop`.

## Reference

- Docs: `https://sinups.github.io/ai-kit/docs`
- Full docs in one file: `https://sinups.github.io/ai-kit/llms-full.txt`
- Source: `https://github.com/sinups/ai-kit`
- Upstream (Tailwind/shadcn): `https://github.com/21st-dev/agent-elements`
