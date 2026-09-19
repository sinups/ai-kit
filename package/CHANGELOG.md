# Changelog

## [0.4.0](https://github.com/sinups/ai-kit/compare/v0.3.0...v0.4.0) (2026-09-19)


### Features

* media, artifacts, voice and upload ui, mcp protocol tool results ([#17](https://github.com/sinups/ai-kit/issues/17)) ([153a013](https://github.com/sinups/ai-kit/commit/153a01362d6e1209e686b0ff02936bd4bb6f5f54))

## [0.3.0](https://github.com/sinups/ai-kit/compare/v0.2.0...v0.3.0) (2026-09-18)


### Features

* quiet transcript, tool catalog, approvals, labels and composer context ([#15](https://github.com/sinups/ai-kit/issues/15)) ([3fcb670](https://github.com/sinups/ai-kit/commit/3fcb670c3be3b6e36d91ad908e7e78a20f791eed))

## [0.2.0](https://github.com/sinups/ai-kit/compare/v0.1.0...v0.2.0) (2026-09-17)


### ⚠ BREAKING CHANGES

* `@tabler/icons-react` is a peer dependency; peer ranges are `@mantine/core` and `@mantine/hooks` ^9.4.0 and `react` ^19.2.0. Suggestions render above the composer only, and `AgentChat` `emptySuggestionsPosition` is deprecated.
* **input:** `InputBar` `questionBar.onSubmit` receives `{ questionIndex }` as a second argument and skipping calls `questionBar.onSkip({ questionIndex })` instead of `onSubmit({ kind: 'skip' })`.

### Features

* grow the chat components into a UI kit for agent products ([#13](https://github.com/sinups/ai-kit/issues/13)) ([8efdc79](https://github.com/sinups/ai-kit/commit/8efdc790434125d3acfce9aeec0b983f72c0b77d))


### Bug Fixes

* **input:** fix multi-step question bar, tool statuses and review findings ([#12](https://github.com/sinups/ai-kit/issues/12)) ([1e09dbd](https://github.com/sinups/ai-kit/commit/1e09dbd358b8321db18d6a006ea8363f2a21d261))


### Documentation

* describe the initial release and configure changelog sections ([#10](https://github.com/sinups/ai-kit/issues/10)) ([ef35834](https://github.com/sinups/ai-kit/commit/ef3583442e9d53d8a308f69d895c3337038f92dc))

## 0.1.0 (2026-09-16)

Initial public release of `@sinups/ai-kit`, agent chat UI components for Mantine.

### Features

* chat surface: `AgentChat`, `MessageList`, `UserMessage`, `ErrorMessage`, streaming `Markdown`
* composer: `InputBar`, `Suggestions`, `ModelPicker`, `ModeSelector`, `SendButton`, `AttachmentButton`, `FileAttachment`, `ImageLightbox`
* tool cards: `ToolRenderer`, `BashTool`, `EditTool`, `SearchTool`, `TodoTool`, `PlanTool`, `ToolGroup`, `SubagentTool`, `McpTool`, `ThinkingTool`, `GenericTool`, `QuestionTool`, `ToolRowBase`
* streaming states: `TextShimmer`, `SpiralLoader`
* theming through `--ae-*` CSS tokens on top of Mantine variables, light and dark color schemes
* message and status types structurally compatible with the Vercel AI SDK, no dependency on `ai`

### Documentation

* documentation site at https://sinups.github.io/ai-kit
