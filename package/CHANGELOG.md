# Changelog

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
