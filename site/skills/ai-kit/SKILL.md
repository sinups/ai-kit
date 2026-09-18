---
name: ai-kit
description: |
  Use whenever the user wants to build or change an agent product UI in a React + Mantine
  project: a chat with tool calls, a chat widget, settings for models, MCP servers, agents,
  skills, permissions or hooks, session history, background tasks or diff review. Especially
  when the code imports from `@sinups/ai-kit` or package.json lists it.
  Triggers: "agent chat", "tool call UI", "chat widget", "chat launcher", "MCP settings",
  "diff review", "AgentChat", "InputBar", "AiKitProvider", mentions of AI UI Kit.

  Do NOT use for Tailwind/shadcn projects without Mantine (use the upstream Agent Elements
  registry there) or for projects committed to a different agent UI kit.
---

# AI UI Kit skill

Context for building agent UIs with **AI UI Kit** (`@sinups/ai-kit`), a Mantine 9 UI kit:
the chat, tool cards and composer, and the screens around them. Docs:
`https://sinups.github.io/ai-kit`. The current, complete catalog with API tables is in
`https://sinups.github.io/ai-kit/llms-full.txt`: fetch it before writing code when you can,
and treat it as the source of truth over this file.

## Install

```bash
npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react
```

Peer dependencies: `@mantine/core` and `@mantine/hooks` ^9.4, `react` and `react-dom` ^19.2,
`@tabler/icons-react` ^3. Import the stylesheets once at the app root and render inside
`MantineProvider`:

```tsx
import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";
```

Use `@sinups/ai-kit/styles.layer.css` instead when the app uses CSS layers.

## Detection

The project is ready for the kit if `package.json` lists `@sinups/ai-kit`, source files import
from it, or the project uses `@mantine/core` and the user asks for an agent or chat UI. If the
package is missing, install it with the project's package manager.

## Contract

- Everything is exported from the package root. Pure helpers (validation, filtering,
  formatting) are exported next to the components.
- Components are controlled: data through props, intent through callbacks. Async callbacks may
  return a promise; the component shows the pending state and the rejection message.
- Data views take `loading`, `error` + `onRetry` and render an empty state.
- Layout adapts to the component's own width (360px widget to 900px page), not the viewport.
- Visible text has English defaults overridable through `labels` (`DEFAULT_<NAME>_LABELS` holds
  them); labels of nested parts sit under a key, for example `labels.wizard`.
- Messages are `ChatMessage[]`, structurally compatible with AI SDK `UIMessage`; status is
  `ChatStatus`. `useChat()` output plugs in without importing `ai`.

## Chat

```tsx
"use client";

import { AgentChat } from "@sinups/ai-kit";
import { useChat } from "@ai-sdk/react";
import { IconBook2, IconBug, IconSparkles } from "@tabler/icons-react";

export function Chat() {
  const { messages, status, sendMessage, stop } = useChat();
  return (
    <AgentChat
      messages={messages}
      status={status}
      onSend={({ content }) => sendMessage({ text: content })}
      onStop={stop}
      contentWidth={760}
      collapseToolRuns
      alignComposer
      emptyState={{
        avatar: <IconSparkles size={22} />,
        title: "How can I help you today?",
        description: "Ask about the code, fix a bug or plan a change.",
        actions: [
          { id: "explain", label: "Explain this repository", icon: <IconBook2 /> },
          { id: "bug", label: "Find the cause of a bug", icon: <IconBug />, badge: "New" },
        ],
      }}
    />
  );
}
```

- `AgentChat` props: `messages`, `status`, `onSend`, `onStop` (required); `error`,
  `suggestions`, `attachments`, `toolRenderers`, `onToolAction`, `messageActions`, `onRetry`,
  `statusBar`, `inputBarProps`, `withSearch`, `stickyPrompt`, `collapseToolRuns`,
  `highlighter`, `longMessageThreshold`, `contentWidth`, `emptyState`, `emptyStateWidth`,
  `alignComposer`, `topFade`, `wrapLines`, `responsiveTables`, `frameBatched`, `tailGranularity`,
  `presentation`, `approvals`, `labels`, `toolCatalog`, `toolArgs`, `toolOutputs`, `locale`,
  `workingRow`, `toolActivity`, `animateAppearance`, `evenSpacing`, `classNames`, `slots`.
- Defaults differ between the two transcripts: `AgentChat` turns on `frameBatched`,
  `animateAppearance`, `workingRow` and `toolActivity`; a standalone `MessageList` keeps them off.
  Pass `={false}` to `AgentChat` to turn one off. `evenSpacing` is off in both.
- `frameBatched` commits the streaming answer once per animation frame;
  `tailGranularity="line"` reveals the growing tail line by line instead of character by character.
- `presentation`: `'cards'` by default; `rowsPresentation` for the flat rows of a terminal client,
  `quietPresentation` for muted MCP lines and one folded line per turn. Import the value from the
  package root and pass it.
- `toolCatalog`: MCP tool definitions keyed by `mcp__<server>__<tool>` (`title`, `description`,
  `annotations`, `inputSchema`), so calls read by their titles. `toolArgs` and `toolOutputs`
  format arguments and results, keyed like `toolRenderers` (`tool-mcp__<server>__*` allowed);
  returning `null` keeps the kit summary. `locale` formats numbers and dates.
- `approvals`: approval requests keyed by `toolCallId` (the `ToolApprovalFooter` props plus
  `isPending` and `outcome`), rendered under the card of that call. A standalone `MessageList`
  reads them from `ToolApprovalsProvider`.
- `labels`: one section per component (`messageList`, `inputBar`, `toolApproval` with `scopes`,
  `mcpTool`, `thinkingTool`, `durationUnits`, ...). A standalone `MessageList` reads them from
  `ChatLabelsProvider`.
- `workingRow`: a quiet line while the agent works between calls, or your node such as
  `<AgentStatus />`. `toolActivity`: time and progress of running calls. `animateAppearance`:
  fade-in of new parts.
- `contentWidth`: `420px` by default; a number such as `760` on pages, `"100%"` in panels and
  widgets. In narrow containers pass `wrapLines`.
- `emptyState`: the `welcome` layout (default) shows `avatar`, `title`, `description` and
  `actions` (`id`, `label`, `icon`, `badge`, `value`, `onSelect`) with the composer at the
  bottom. `layout: "center"` centers greeting and composer, with `suggestions` as pills above
  the composer.
- `emptySuggestionsPosition` is deprecated: suggestions always render above the composer and
  `"bottom"` behaves as `"top"`. Do not pass it.
- `statusBar`: content above the composer, for example `<AgentStatus />`. Context indicators
  such as `<ContextUsage />` go into `inputBarProps.rightActions`.
- `MessageList` renders the feed alone; `InputBar` is the composer (`leftActions`,
  `rightActions`, `suggestions`, `completions`, `onQueue`, `history`, `infoBar`,
  `questionBar`, `contextItems` with `onRemoveContext` and `onRestoreContext` for context chips).
  Put `ModeSelector` (`modes` with an optional `badge`, `value`/`defaultValue`, `onChange`,
  `shortcuts` to pick a mode by digit, `labels.title` for a menu heading) and `ModelPicker`
  (`models`: `{ id, name, version? }[]`) into `leftActions`.

## Tool cards

`AgentChat` and `MessageList` render built-in cards for tool parts on their own:
`tool-Bash` (BashTool), `tool-Edit` and `tool-Write` (EditTool), `tool-Grep`, `tool-Glob`,
`tool-WebSearch` (SearchTool), `tool-TodoWrite` (TodoTool), `tool-PlanWrite` (PlanTool),
`tool-Question` (QuestionTool), `tool-Task` and `tool-Agent` (ToolGroup with nested tools),
`tool-Thinking` (ThinkingTool), `tool-mcp__<server>__<tool>` (McpTool).

Add or replace a card with `toolRenderers`, keyed by the **full part type**. A bare name only
matches `mcp__user-tools__<name>`. Renderers receive `CustomToolRendererProps`: `name`,
`input`, `output`, `status` (`pending`, `streaming`, `success`, `error`), `toolCallId`, `part`,
`onAction`; `onAction(action, payload)` reaches `onToolAction(toolCallId, action, payload)`.

```tsx
import { Button, Group, Paper, Text } from "@mantine/core";
import { AgentChat, type CustomToolRendererProps } from "@sinups/ai-kit";

function DeployCard({ input, status, onAction }: CustomToolRendererProps) {
  return (
    <Paper withBorder p="xs">
      <Group justify="space-between">
        <Text size="sm">Deploy {String(input.service)} · {status}</Text>
        <Button size="xs" onClick={() => onAction?.("approve")}>Approve</Button>
      </Group>
    </Paper>
  );
}

<AgentChat
  {...chat}
  toolRenderers={{ "tool-Deploy": DeployCard }}
  onToolAction={(toolCallId, action) => approveDeploy(toolCallId, action)}
/>;
```

Confirmation UI for a pending call: `ToolApprovalFooter` (`onApprove(scope)`, `onReject`,
`approveOptions`, `onExplain` with a risk level, `ruleSuggestion`).

## Screens around the chat

| Need | Components |
| --- | --- |
| Multi-step flows, settings screens, lists | `Wizard`, `WizardModal`, `SettingsLayout`, `SettingsSection`, `SettingRow`, `SettingsModal`, `MasterDetail`, `EntityList`, `CommandPalette`, `ConfirmDialog`, `KeyValueEditor`, `SchemaView`, `StatusBadge` |
| MCP servers | `McpSettingsPanel`, `McpServerList`, `McpServerDetail`, `McpToolDetail`, `McpServerWizard`, `McpImportDialog` |
| Agents and skills | `AgentsSettingsPanel`, `AgentList`, `AgentDetail`, `AgentEditor`, `AgentCreateWizard`, `SkillsSettingsPanel`, `SkillCatalog`, `SkillPicker` |
| Permissions and hooks | `PermissionRulesPanel`, `AddPermissionRuleWizard`, `PermissionModeSelector`, `HooksPanel`, `HookWizard` |
| Sessions and tasks | `SessionList`, `SessionPreview`, `ExportDialog`, `BackgroundTasksPanel`, `TaskList`, `AgentTree` |
| Diff review | `DiffReview`, `DiffReviewModal`, `DiffFileList`, `DiffFileView` |
| Model, usage, memory, help | `ModelSettingsPanel`, `UsagePanel`, `StatusPanel`, `MemoryPanel`, `CommandsHelp` |
| Message actions | `messageActions` on `AgentChat` (`onEdit`, `onRetry`, `onRewind`, `onBranch`, `onFeedback`), `PlanApproval`, `RewindDialog` |

Check each component's props in `llms-full.txt` before use.

## Theming

- Without a provider the kit follows the Mantine primary color, fonts and color scheme.
- `AiKitProvider` goes inside `MantineProvider` and themes its subtree: `accent` (`gray`,
  `blue`, `indigo`, `violet`, `grape`, `pink`), `radius` (`sharp`, `default`, `round`),
  `density` (`default`, `compact`), `colorScheme` (`light`, `dark`, `auto`), `theme`,
  `tokens` (`--ae-*` names without the prefix), `persistKey`.
- `AiKitThemeCustomizer` is a ready settings panel; `useAiKitTheme()` reads and changes the
  settings.
- Restyle through `--ae-*` tokens (`--ae-bg`, `--ae-fg`, `--ae-border`, `--ae-primary`,
  `--ae-tool-radius`, `--ae-max-width`, ...), never by overriding component internals.
- Whole-app kit look: `<MantineProvider theme={mergeAiKitTheme(appTheme)}>` with the `ae-kit`
  class on the app root.

## Launcher

```tsx
<ChatLauncher title="Assistant" unreadCount={unread}>
  <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer emptyState={welcome} />
</ChatLauncher>
```

On a page that is not a React app, or to isolate the widget from page CSS, use
`mountChatLauncher(target, element, { styles: [mantineCss, kitCss], wrap })`; it renders into a
shadow root and returns `unmount`.

## Layout rules

- Give the chat a bounded height: flex column with `minHeight: 0` down to `AgentChat`.
- Measure the container, not the viewport; below about 720px pass `wrapLines` and move side
  panes into a `Drawer`.
- Chat with history: a 272px `SessionList` column. Chat with an inspector: Mantine `Splitter`
  with `DiffReview` or `BackgroundTasksPanel`.

## When not to use

- Projects on another agent UI kit; do not mix kits.
- Tailwind + shadcn projects without Mantine: use the upstream Agent Elements registry.
- Mantine versions below 9.4.

## Reference

- Docs: `https://sinups.github.io/ai-kit/docs`
- Recipes with live previews: `https://sinups.github.io/ai-kit/docs/what-you-can-build`
- Index for assistants: `https://sinups.github.io/ai-kit/llms.txt`
- Full docs in one file: `https://sinups.github.io/ai-kit/llms-full.txt`
- Source: `https://github.com/sinups/ai-kit`
