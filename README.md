# AI UI Kit

AI UI Kit (`@sinups/ai-kit`) is a React UI kit for agent products, built on [Mantine](https://mantine.dev) 9. It covers the chat and the
screens around it: settings, MCP servers, agents, skills, permissions, hooks, memory, sessions,
background tasks and diff review. Every component works in a 360px widget and on a full page, in
light and dark color schemes.

Documentation: https://sinups.github.io/ai-kit. For coding agents: https://sinups.github.io/ai-kit/llms.txt

## Modules

| Module | What it gives you |
| --- | --- |
| Chat | `AgentChat`, `MessageList`, `InputBar`, `Markdown`, status and context rows (`AgentStatus`, `ContextUsage`, `TurnSummary`, `CompactBoundary`), conversation and prompt search |
| Tools | Tool call cards (`BashTool`, `EditTool`, `SearchTool`, `TodoTool`, `PlanTool`, `SubagentTool`, `McpTool`, ...) and `ToolApprovalFooter` |
| Primitives | `Wizard`, `SettingsLayout`, `MasterDetail`, `EntityList`, `CommandPalette`, `ConfirmDialog`, `KeyValueEditor`, `SchemaView`, `StatusBadge`, `ShortcutHint` |
| MCP | Server list and detail, add/edit wizard, import, discovered servers, tool detail |
| Agents | Agent list, detail, editor, creation wizard, tool selector |
| Skills | Skill catalog, detail, editor, picker |
| Permissions | Allow/ask/deny rules panel, rule wizard, permission mode selector |
| Hooks | Lifecycle hooks panel and wizard |
| Memory | Memory files panel with preview and editor |
| Sessions | Session history, preview, export |
| Message actions | Edit, retry, rewind, branch, feedback, plan approval |
| Tasks | Background tasks panel, task list and detail, agent tree |
| Diff | Multi-file diff review with accept and reject |
| Model settings | Model, effort, output style, usage, status |
| Help | Commands and shortcuts reference |
| Elicitation | Forms from MCP elicitation schemas |
| Theme | `AiKitProvider`, `AiKitThemeCustomizer`, `createAiKitTheme`, `--ae-*` tokens |
| Launcher | `ChatLauncher`, `mountChatLauncher` with Shadow DOM isolation |

Components are controlled: data comes in through props, intent goes out through callbacks. Pure
logic (validation, filtering, formatting) is exported next to them.

## Installation

```bash
npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react
```

Import the stylesheets once at the root of your app. Either take all kit styles in one file:

```tsx
import '@mantine/core/styles.css';
import '@sinups/ai-kit/styles.css';
```

or only the styles of the components you use, like `@mantine/core/styles/Button.css`. `base.css` holds
the `--ae-*` tokens and is required once; each component file already includes the styles of the
components it renders:

```tsx
import '@mantine/core/styles.css';
import '@sinups/ai-kit/styles/base.css';
import '@sinups/ai-kit/styles/Wizard.css';
import '@sinups/ai-kit/styles/ChatLauncher.css';
```

With cascade layers, import `@sinups/ai-kit/styles.layer.css` (everything inside `@layer mantine`),
or put per-component files into a layer yourself:
`@import '@sinups/ai-kit/styles/Wizard.css' layer(ai-kit);`. JavaScript is tree-shaken the same way: importing `Wizard` bundles about 4 KB gzip, not the whole kit. Sizes per
component are on the [Bundle size](https://sinups.github.io/ai-kit/docs/bundle-size) page.

## Usage

```tsx
import { MantineProvider } from '@mantine/core';
import { AgentChat } from '@sinups/ai-kit';

export function Chat({ messages, status, send, stop }) {
  return (
    <MantineProvider>
      <AgentChat
        messages={messages}
        status={status}
        onSend={({ content }) => send(content)}
        onStop={stop}
        contentWidth={760}
      />
    </MantineProvider>
  );
}
```

Messages are structurally compatible with `UIMessage` from the AI SDK, so `useChat` output can be
passed directly. The package does not depend on `ai`.

### Transcript options

- `presentation`: `'cards'` by default; `rowsPresentation` shows the flat rows of a terminal client,
  `quietPresentation` shows MCP calls as muted lines and folds the work before an answer into one
  line. Import the value from the package root.
- `approvals`: Allow/Deny under any tool call, keyed by `toolCallId`. A standalone `MessageList`
  takes the same map from `ToolApprovalsProvider`.
- `labels`: every text of the chat, one section per component; `ChatLabelsProvider` does the same
  for a standalone `MessageList`.
- `toolCatalog`, `toolArgs`, `toolOutputs`, `locale`: tool titles from your MCP servers and
  formatters for arguments and results.
- `workingRow`, `toolActivity`, `animateAppearance`, `frameBatched`: on by default in `AgentChat`,
  off in a standalone `MessageList`. `evenSpacing` is off in both.
- Composer: `InputBar` shows context chips with `contextItems`, `onRemoveContext` and
  `onRestoreContext`; `ModeSelector` takes a menu title, a badge per mode and digit `shortcuts`.

## Theming

Without extra setup the kit follows your Mantine primary color, fonts and color scheme. Wrap kit
screens in `AiKitProvider` to apply the kit theme to stock Mantine components inside them and to
expose accent, radius, density and color scheme settings:

```tsx
<MantineProvider theme={appTheme}>
  <AiKitProvider accent="violet" radius="default" density="compact" persistKey="kit-theme">
    <McpSettingsPanel servers={servers} />
    <AiKitThemeCustomizer />
  </AiKitProvider>
</MantineProvider>
```

See [Theming](https://sinups.github.io/ai-kit/docs/theming).

## Embedding the launcher

In a React app, render `ChatLauncher` with the chat inside:

```tsx
<ChatLauncher title="Assistant">
  <AgentChat {...chat} contentWidth="100%" wrapLines />
</ChatLauncher>
```

On a page you do not control, mount it in a shadow root:

```tsx
import mantineCss from '@mantine/core/styles.css?inline';
import baseCss from '@sinups/ai-kit/styles/base.css?inline';
import launcherCss from '@sinups/ai-kit/styles/ChatLauncher.css?inline';
import chatCss from '@sinups/ai-kit/styles/AgentChat.css?inline';

const widget = mountChatLauncher(document.getElementById('assistant'), <SupportLauncher />, {
  styles: [mantineCss, baseCss, launcherCss, chatCss],
});
```

See [Embedding the launcher](https://sinups.github.io/ai-kit/docs/launcher).

## Documentation

- [Installation](https://sinups.github.io/ai-kit/docs/installation)
- [Architecture](https://sinups.github.io/ai-kit/docs/architecture): layers and the component contract
- [Layouts](https://sinups.github.io/ai-kit/docs/layouts): full page, sidebar, inspector, settings, widget
- [Hooks and utilities](https://sinups.github.io/ai-kit/docs/utilities)
- [What's new](https://sinups.github.io/ai-kit/docs/whats-new)
- Component reference with live previews: https://sinups.github.io/ai-kit/docs

## Repository

| Path | What it is |
| --- | --- |
| `package/` | The npm package `@sinups/ai-kit`: components, styles, tests and stories |
| `site/` | The documentation site (Next.js) |
| `ARCHITECTURE.md` | Layers, component contract, file layout |
| `DESIGN.md` | Design tokens, sizes, spacing and theme rules |
| `CONTRIBUTING.md` | Development commands, tests, commit and release rules |

```bash
yarn install
yarn storybook    # component playground on http://localhost:8271
yarn dev          # documentation site on http://localhost:4100
yarn test         # dependency check, format check, typecheck, lint and unit tests
yarn build        # build the package into package/dist
```

Releases are automated with release-please from Conventional Commit titles. See
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Credits

This project is a fork of [Agent Elements](https://github.com/21st-dev/agent-elements) by
[21st.dev](https://21st.dev), released under the MIT License. The original chat component design,
behavior, examples, skills and the documentation site come from that project; the implementation
was rebuilt on Mantine and the distribution became a single npm package. Build tooling is derived
from the [Mantine extension template](https://github.com/mantinedev/extension-template). See
[NOTICE](./NOTICE).

## License

MIT
