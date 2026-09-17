# Architecture

`@sinups/ai-kit` is a UI kit for agent products built on Mantine. It covers the chat and the
screens around it: settings, MCP servers, agents, skills, permissions, hooks, memory, sessions,
background tasks and diff review, plus a theme provider and an embeddable launcher. Every piece
works in a narrow widget (about 360px) and in a full-page app (900px and wider).

## Layers

All source lives in `package/src`.

```
styles/            --ae-* tokens (vars.module.css), keyframes, overlay class
utils/, hooks/     pure functions and generic hooks: ANSI, highlighter, diffs, tool adapters, countdown
icons/, types/     file and mode icons, timeline types
primitives/        domain-neutral building blocks (Wizard, SettingsLayout, EntityList, ...)
theme/             AiKitProvider, AiKitThemeCustomizer, createAiKitTheme, token names
<chat modules>     AgentChat, MessageList, UserMessage, ErrorMessage, Markdown, CodeBlock,
                   AgentStatus, ContextUsage, CompactBoundary, TurnSummary, ContextEventRow,
                   HookActivity, ChatNotices, ImageLightbox, TextShimmer, SpiralLoader,
                   ToolRowBase, input/, tools/, question/, elicitation/
<domain modules>   mcp/, agents/, skills/, permissions/, hooks-config/, memory/, sessions/,
                   tasks/, message-actions/, diff/, model-settings/, help/
launcher/          ChatLauncher, mountChatLauncher (Shadow DOM)
```

Dependencies point down only. A domain module may use primitives, utilities and chat modules; a
primitive never imports a domain module; domain modules do not import each other except through
exported types. Everything public is re-exported from `package/src/index.ts`.

Folders that start with an underscore are not exported:

- `_stories/`: Storybook helpers (`WidthFrame` for Narrow and Wide stories, `flow-helpers` for
  play functions, a shiki highlighter for stories).
- `_layouts/`: page recipes shown in Storybook under `layouts/*` (full-page chat, chat with a
  sidebar, chat with an inspector, settings page, new chat, embedded widget).
- `_demo/`: a complete workspace assembled from the kit, used as an integration story.
- `primitives/_testing/`: test helpers for primitives.

## Component contract

- **Presentational and controlled.** Components receive data through props and report intent
  through callbacks (`onSelect`, `onSave`, `onReconnect`, ...). No fetching, no global stores, no
  routing. The host app owns data and side effects.
- **Async actions return promises.** A callback may return `Promise<void>`; the component shows
  the pending state (`loading` on the button) until it settles and shows the rejection message
  in an `Alert`.
- **Every data view handles four states:** `loading` (Skeleton), `error` (Alert with optional
  `onRetry`), empty (Mantine `EmptyState`), and data.
- **Logic lives outside JSX.** Parsing, validation, filtering, grouping and formatting are pure
  functions in a `*.ts` file next to the component, each with unit tests. Only helpers useful to
  consumers are exported from the package index.
  Stateful logic reusable without the UI is a hook (`useWizard`, `useFuzzySearch`).
- **Domain types** live in `<module>/types.ts`, are exported, and stay structurally compatible
  with the source protocol where one exists (MCP specification for `mcp/` and `elicitation/`,
  AI SDK `UIMessage` for chat).
- **Labels** are English defaults overridable through props (`labels?: Partial<XLabels>` for
  components with many strings). No hard-coded user-visible text without an override.
- **Width.** Layout adapts to the component's own width, not the viewport: Mantine
  `Grid type="container"`, `useElementSize`, or container queries. Wide: side by side (list and
  detail, navigation and content). Narrow: stacked with a back action.

## Mantine only

- Build from Mantine components and the Styles API: `Paper`, `Stack`, `Group`, `Grid`,
  `NavLink`, `Tabs`, `Stepper`, `Tree`, `Splitter`, `Menu`, `Modal`, `Drawer`, `Combobox`,
  `Table`, `Badge`, `Alert`, `EmptyState`, `Skeleton`, `Kbd`, form inputs. No custom `<button>`,
  `<input>`, lists or cards.
- Check every prop against `node_modules/@mantine/core/lib/components/<Name>/*.d.ts` (Mantine 9).
- CSS modules only for what props cannot express, using `--ae-*` and `--mantine-*` variables and
  `rem()`. No hex colors, no magic pixel values in inline styles.
- Icons: `@tabler/icons-react`.
- Peer dependencies stay `@mantine/core` and `@mantine/hooks`. No `@mantine/form`,
  `@mantine/dates`, `@mantine/spotlight` or `@mantine/charts`. Syntax highlighting is injected
  through the `SyntaxHighlighter` type (`createShikiHighlighter` adapts a highlighter the host
  creates), so the package has no highlighter dependency.

## Theme

Kit components read `--ae-*` tokens declared in `styles/vars.module.css`; the tokens point at
Mantine variables where they can (`--ae-primary` at the primary color, `--ae-font-*` at theme
fonts). `theme/AiKitProvider` applies `createAiKitTheme()` to its subtree and re-declares the CSS
variables that differ from the host theme in a scoped stylesheet, including on portals. See
`DESIGN.md` for the token values and theme rules.

## Launcher

`launcher/ChatLauncher` positions a button and a panel against the viewport (or a container with
`withinPortal={false}`); the pure sizing rules are in `launcher-layout.ts`.
`launcher/mount-chat-launcher` creates a shadow root, a React root and a `MantineProvider` whose
CSS variables and portals are scoped to a container inside the shadow root; `shadow-styles.ts`
rewrites `:root`, `html` and `body` selectors of the stylesheets passed in.

## Files per component

```
<module>/<Name>/<Name>.tsx          memo component, JSDoc on every prop
<module>/<Name>/<Name>.module.css   optional
<module>/<Name>/<Name>.story.tsx    Usage + Narrow + Wide (+ states: Loading, Error, Empty) + *Flow
<module>/<Name>/<Name>.test.tsx     behavior tests with @mantine-tests/core + user-event
<module>/<logic>.ts + .test.ts      pure logic
```

Small modules keep components flat in the module folder (`tools/`, `input/`, `mcp/`, `sessions/`,
`memory/`). Stories use `_stories/WidthFrame` for Narrow and Wide. Stories with a `play` function
end with `Flow`; see `CONTRIBUTING.md` for Storybook and visual tests.

## Primitives

| Primitive | Purpose |
|---|---|
| `Wizard`, `WizardModal`, `useWizard` | Multi-step flows: per-step validation, conditional steps, review step, non-linear editing |
| `SettingsLayout`, `SettingsSection`, `SettingRow`, `SettingsModal` | Settings screens: section navigation, titled groups, label/description/control rows, the same in a modal |
| `MasterDetail` | List and detail: two panes when wide, stacked with a back action when narrow |
| `EntityList`, `EntityListItem` | Searchable, filterable, groupable lists with the four data states and per-item actions |
| `CommandPalette`, `useFuzzySearch` | Mod+K palette: fuzzy search, groups, shortcuts, recent items |
| `ConfirmDialog` | Confirmation of destructive actions with pending and error states |
| `StatusBadge` | One status vocabulary (`idle`, `pending`, `running`, `success`, `warning`, `error`, `disabled`, `needs-auth`) |
| `SchemaView` | JSON Schema as a parameter table: name, type, required, default, enum, nested objects |
| `KeyValueEditor` | Editable key/value pairs (env vars, headers) with secret masking and validation |
| `ShortcutHint` | Keyboard shortcut rendered with `Kbd`, mod key resolved per platform |
| `ValidationErrorsList`, `InvalidSettingsNotice` | Settings validation errors grouped by file, and an alert with recovery actions |

## Documentation site

`site/` is a Next.js app exported as static HTML. Component pages are data in
`site/app/data/component-docs*.ts` with previews in `site/app/components/previews/`; the API
table is generated from the `<Name>Props` type in `package/src`, and the Hooks and utilities page
from the exports of `package/src/index.ts`. The site imports the built package, so run
`yarn build` before building the site.

## Checks

`yarn test` runs syncpack, formatting, typecheck, lint, site lint and jest; `yarn build` builds
the package; `yarn storybook` serves stories on :8271; `yarn test:storybook` and
`yarn test:visual` run interaction and visual tests against it. Mind the esbuild-jest trap: a
file containing the substring `ock(` (for example `jest.mock(` or `CodeBlock(`) is routed to Babel
and fails.
