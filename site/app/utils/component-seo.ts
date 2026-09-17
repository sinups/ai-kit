export type ComponentSeo = {
  description: string;
  keywords: string[];
};

const baseTail =
  "Open-source React component from AI UI Kit - built for coding-agent-style agents and the Vercel AI SDK.";

export const COMPONENT_SEO: Record<string, ComponentSeo> = {
  AgentChat: {
    description:
      "AgentChat is a drop-in React chat shell for LLM agents: streaming messages, tool cards, plans, approvals, and an input bar. Works with ChatMessage from the Vercel AI SDK.",
    keywords: [
      "AgentChat component",
      "React agent chat component",
      "AI SDK chat",
      "Agent CLI chat UI",
      "LLM chat component",
      "streaming chat UI",
    ],
  },
  MessageList: {
    description:
      "MessageList renders the full agent transcript: user and assistant turns, tool calls, thinking, and markdown - with streaming updates and smooth auto-scroll.",
    keywords: [
      "MessageList component",
      "chat transcript UI",
      "agent message list",
      "streaming transcript React",
    ],
  },
  InputBar: {
    description:
      "InputBar is the agent composer: multiline input, file attachments, suggestions, send/stop controls, and slot overrides. Hook it up to the Vercel AI SDK in one line.",
    keywords: [
      "InputBar component",
      "chat composer UI",
      "agent composer React",
      "AI SDK input",
      "file attachment input",
    ],
  },
  Suggestions: {
    description:
      "Suggestions renders quick-action chips above the InputBar so users can kick off common agent flows like Write, Plan, Code, or Learn with one tap.",
    keywords: [
      "Suggestions component",
      "prompt suggestions UI",
      "quick action chips",
      "AI prompt starters",
    ],
  },
  ModelPicker: {
    description:
      "ModelPicker is a standalone dropdown for switching between LLM models (Llama, Qwen, Mistral, or your own). Drop it into InputBar via leftActions, a header, or a settings sheet.",
    keywords: [
      "ModelPicker component",
      "LLM model selector",
      "AI model dropdown React",
      "LLM model picker",
    ],
  },
  ModeSelector: {
    description:
      "ModeSelector is a standalone toggle for agent modes (Agent, Plan, or your own set). Composable into InputBar via leftActions or used anywhere else.",
    keywords: [
      "ModeSelector component",
      "agent mode toggle",
      "plan mode UI",
      "React mode selector",
    ],
  },
  UserMessage: {
    description:
      "UserMessage renders the human turn of an agent chat with avatar, text, attachments, and file chips - supports markdown and inline images.",
    keywords: [
      "UserMessage component",
      "chat user bubble",
      "React chat message",
      "AI chat UI",
    ],
  },
  Markdown: {
    description:
      "Markdown is a streaming-aware renderer for assistant output: GFM tables, code highlighting via Shiki, callouts, and incremental updates during LLM streaming.",
    keywords: [
      "Markdown component",
      "streaming markdown React",
      "LLM markdown renderer",
      "Shiki React",
      "GFM tables",
    ],
  },
  AttachmentButton: {
    description:
      "AttachmentButton opens the file picker for the agent composer and emits selected files ready to send with a message.",
    keywords: [
      "AttachmentButton component",
      "file upload button React",
      "chat attachment UI",
    ],
  },
  SendButton: {
    description:
      "SendButton toggles between send and stop states based on the agent status - ready, submitted, streaming - from the Vercel AI SDK.",
    keywords: [
      "SendButton component",
      "send stop toggle",
      "AI SDK status button",
      "chat submit button",
    ],
  },
  FileAttachment: {
    description:
      "FileAttachment renders a file chip with filename, size, and remove action - used inline in messages and the input bar.",
    keywords: [
      "FileAttachment component",
      "file chip React",
      "upload preview UI",
    ],
  },
  TextShimmer: {
    description:
      "TextShimmer is a lightweight loading state for text while the agent is thinking or a tool is still streaming.",
    keywords: [
      "TextShimmer component",
      "loading text React",
      "LLM thinking indicator",
      "shimmer UI",
    ],
  },
  SpiralLoader: {
    description:
      "SpiralLoader is a Lottie-based waiting animation tuned for agent pauses - tool prep, long plans, or approval gates.",
    keywords: [
      "SpiralLoader component",
      "Lottie loader React",
      "agent loading animation",
    ],
  },
  BashTool: {
    description:
      "BashTool renders shell commands the agent runs: live command line, streaming stdout/stderr, exit codes, and collapse/expand. Built for coding-agent-style terminals.",
    keywords: [
      "BashTool component",
      "shell tool UI",
      "terminal tool call React",
      "Agent CLI Bash UI",
      "agent shell UI",
    ],
  },
  EditTool: {
    description:
      "EditTool shows file edits as a proper diff: old vs new, structured patches, line numbers, and collapsible hunks - with an optional approve/reject footer.",
    keywords: [
      "EditTool component",
      "file diff viewer React",
      "code diff UI",
      "agent edit approval",
      "structured patch UI",
    ],
  },
  SearchTool: {
    description:
      "SearchTool renders grouped web search results - tabs per source, snippets, and dates - so agents can cite and the user can verify at a glance.",
    keywords: [
      "SearchTool component",
      "search results UI",
      "web search React",
      "agent citations UI",
    ],
  },
  TodoTool: {
    description:
      "TodoTool displays the agent's running checklist with in-progress, completed, and pending states - perfect for long-running tasks and plans.",
    keywords: [
      "TodoTool component",
      "agent todo list",
      "task checklist UI",
      "Agent CLI todo UI",
    ],
  },
  PlanTool: {
    description:
      "PlanTool renders an agent's plan with a summary, numbered steps, and an explicit approve/reject interaction - gate risky rollouts behind human review.",
    keywords: [
      "PlanTool component",
      "agent plan UI",
      "plan approval UI",
      "Agent CLI plan",
      "rollout plan UI",
    ],
  },
  QuestionTool: {
    description:
      "QuestionTool lets the agent ask a clarifying question with suggested answer chips - keeps flows unambiguous without breaking the chat surface.",
    keywords: [
      "QuestionTool component",
      "clarifying question UI",
      "agent follow-up question",
      "AI clarification UI",
    ],
  },
  ToolGroup: {
    description:
      "ToolGroup compacts a sequence of tool calls (reads, edits, bashes) into a single collapsible row so the chat stays scannable during long runs.",
    keywords: [
      "ToolGroup component",
      "grouped tool calls UI",
      "collapsible tool calls",
      "agent activity row",
    ],
  },
  SubagentTool: {
    description:
      "SubagentTool renders a nested agent run - its own tool calls, plans, and summary - inline in the parent chat. Built for delegated or parallel agents.",
    keywords: [
      "SubagentTool component",
      "subagent UI",
      "nested agent run UI",
      "delegated agent React",
    ],
  },
  McpTool: {
    description:
      "McpTool is the generic MCP (Model Context Protocol) tool renderer - recognizes mcp__server__tool naming and shows structured input/output with a tool icon.",
    keywords: [
      "McpTool component",
      "MCP tool UI",
      "Model Context Protocol UI",
      "MCP React renderer",
    ],
  },
  ThinkingTool: {
    description:
      "ThinkingTool shows the agent's reasoning block with streaming text - collapsible so the reasoning stays accessible but out of the way.",
    keywords: [
      "ThinkingTool component",
      "LLM reasoning UI",
      "chain of thought UI",
      "LLM thinking block",
    ],
  },
  GenericTool: {
    description:
      "GenericTool is the fallback renderer for any tool call - shows name, input JSON, output, and status. Use it before you add a custom renderer.",
    keywords: [
      "GenericTool component",
      "fallback tool UI",
      "tool call JSON renderer",
      "agent tool card",
    ],
  },
  ErrorMessage: {
    description:
      "ErrorMessage renders a failed assistant turn with an optional live retry countdown, a retry button, and a warning variant for usage limits.",
    keywords: ["ErrorMessage component", "LLM error UI", "retry countdown", "rate limit message"],
  },
  ToolApprovalFooter: {
    description:
      "ToolApprovalFooter asks the user to confirm a tool call, with approval scopes (once, session, always), a reason line, and rejection with feedback for the agent.",
    keywords: ["tool approval UI", "agent permission prompt", "human in the loop", "tool call confirmation"],
  },
  ElicitationForm: {
    description:
      "ElicitationForm answers MCP elicitation requests: it builds a validated Mantine form from the server's JSON Schema or asks the user to open a link.",
    keywords: ["MCP elicitation", "JSON Schema form", "MCP client UI", "agent input request"],
  },
  AgentStatus: {
    description:
      "AgentStatus shows that the agent is working, with elapsed time, received tokens, and a stalled state when the stream goes quiet.",
    keywords: ["agent status line", "LLM streaming indicator", "stalled response", "thinking indicator"],
  },
  ContextUsage: {
    description:
      "ContextUsage is a compact ring showing how full the context window is, with a per-segment breakdown and a compact action near the limit.",
    keywords: ["context window usage", "token usage indicator", "LLM context ring", "compact conversation"],
  },
  CompactBoundary: {
    description:
      "CompactBoundary marks where earlier conversation history was replaced with a summary, with token counts and an expandable summary.",
    keywords: ["conversation compaction", "context summary divider", "chat history summary"],
  },
  Wizard: {
    description:
      "Wizard is a Mantine multi-step flow for agent settings: per-step sync or async validation, conditional steps, a review step, a modal variant and non-linear editing.",
    keywords: ["React wizard component", "Mantine stepper form", "multi-step form", "useWizard hook"],
  },
  ConfirmDialog: {
    description:
      "ConfirmDialog asks for confirmation before destructive actions, keeps the confirm button pending while the promise runs and shows a failed action in an alert.",
    keywords: ["confirm dialog React", "Mantine confirm modal", "destructive action confirmation"],
  },
  SettingsLayout: {
    description:
      "SettingsLayout, SettingsSection and SettingRow build responsive settings screens: grouped section navigation, searchable sections and label/control rows that stack in narrow widgets.",
    keywords: ["settings page layout React", "Mantine settings screen", "settings navigation", "setting row component"],
  },
  MasterDetail: {
    description:
      "MasterDetail shows a list and the selected item's details side by side when wide and as one pane with a back action in narrow widgets, with an optional resizable splitter.",
    keywords: ["master detail layout React", "list detail view", "responsive split view", "Mantine Splitter"],
  },
  EntityList: {
    description:
      "EntityList renders searchable, filterable, grouped lists with loading, error and empty states, keyboard navigation and per-item action menus.",
    keywords: ["entity list component", "searchable list React", "Mantine list with actions", "empty state list"],
  },
  CommandPalette: {
    description:
      "CommandPalette is a Mod+K command menu with fuzzy search, match highlighting, groups, recent commands and keyboard shortcut hints.",
    keywords: ["command palette React", "cmd k menu", "fuzzy search commands", "Mantine spotlight alternative"],
  },
  StatusBadge: {
    description:
      "StatusBadge shows one status vocabulary for servers, agents, tasks and tools: idle, pending, running, success, warning, error, disabled and needs-auth.",
    keywords: ["status badge component", "connection status indicator", "agent status badge"],
  },
  ShortcutHint: {
    description:
      "ShortcutHint renders keyboard shortcuts with Mantine Kbd and resolves the mod key to Command on macOS and Ctrl elsewhere.",
    keywords: ["keyboard shortcut hint", "Kbd component", "mod key platform"],
  },
  KeyValueEditor: {
    description:
      "KeyValueEditor edits environment variables and HTTP headers with key validation, secret masking and .env paste support.",
    keywords: ["key value editor React", "environment variables editor", "HTTP headers editor", ".env paste"],
  },
  SchemaView: {
    description:
      "SchemaView renders a JSON Schema as a parameter table with types, required badges, defaults, enums and collapsible nested objects.",
    keywords: ["JSON Schema viewer React", "tool input schema table", "MCP tool parameters"],
  },
  McpSettingsPanel: {
    description:
      "McpSettingsPanel is a complete MCP server settings screen: server list, server and tool details, add and edit wizard, for full pages and narrow widgets.",
    keywords: ["MCP settings UI", "MCP server manager React", "Model Context Protocol client UI"],
  },
  McpServerList: {
    description:
      "McpServerList lists MCP servers with status, transport, tool counts, search, filters, scope groups and reconnect, authenticate, enable and remove actions.",
    keywords: ["MCP server list", "MCP connection status", "MCP client servers UI"],
  },
  McpServerDetail: {
    description:
      "McpServerDetail shows an MCP server's status and actions, its tools with annotations, resources, prompts and configuration with masked secrets.",
    keywords: ["MCP server details", "MCP tools list", "MCP resources prompts UI"],
  },
  McpToolDetail: {
    description:
      "McpToolDetail documents an MCP tool: description, behavior annotations and input and output JSON Schemas.",
    keywords: ["MCP tool detail", "MCP tool annotations", "MCP inputSchema viewer"],
  },
  McpServerWizard: {
    description:
      "McpServerWizard adds or edits MCP servers: stdio command and arguments or HTTP/SSE URL, environment variables or headers with secrets, and a review step.",
    keywords: ["add MCP server UI", "MCP server configuration form", "stdio http sse MCP"],
  },
  PermissionRulesPanel: {
    description:
      "PermissionRulesPanel manages agent tool permission rules by allow, ask and deny, with scopes, recent denials and additional working directories.",
    keywords: ["agent permission rules UI", "tool permissions settings", "Agent CLI permissions"],
  },
  AddPermissionRuleWizard: {
    description:
      "AddPermissionRuleWizard creates or edits a tool permission rule: behavior, rule with tool suggestions and the scope it is stored in.",
    keywords: ["permission rule wizard", "allow tool rule", "agent permissions form"],
  },
  PermissionRuleInput: {
    description:
      "PermissionRuleInput edits a Tool(specifier) permission rule with tool suggestions, syntax validation and a plain-words explanation.",
    keywords: ["permission rule input", "tool rule syntax", "Bash rule validation"],
  },
  PermissionModeSelector: {
    description:
      "PermissionModeSelector switches the agent permission mode between Default, Accept edits, Plan and Bypass with descriptions and a danger warning.",
    keywords: ["permission mode selector", "plan mode toggle", "accept edits mode"],
  },
  HooksPanel: {
    description:
      "HooksPanel configures agent lifecycle hooks grouped by event, with matchers, commands or prompts, timeouts, scopes and enable toggles.",
    keywords: ["agent hooks settings", "PreToolUse hook UI", "Agent CLI hooks"],
  },
  HookWizard: {
    description:
      "HookWizard creates or edits an agent hook: event, tool matcher, shell command or prompt, timeout, scope and the payload the hook receives.",
    keywords: ["hook wizard", "agent hook form", "PostToolUse command hook"],
  },
  AgentsSettingsPanel: { description: "AgentsSettingsPanel is a complete subagent settings screen: agent list, details, editor, creation wizard with AI generation and delete confirmation, for full pages and narrow widgets.", keywords: ["subagent settings UI", "AI agent manager React", "Agent CLI agents UI"] },
  AgentList: { description: "AgentList lists agent definitions grouped by source with avatars, models, search, loading, error and empty states and edit, duplicate and delete actions.", keywords: ["agent list component", "subagents list", "AI agents catalog"] },
  AgentDetail: { description: "AgentDetail shows a subagent's purpose, model, tools, skills and Markdown system prompt with use in chat, edit, duplicate and delete actions.", keywords: ["agent detail view", "system prompt viewer", "subagent configuration"] },
  AgentEditor: { description: "AgentEditor edits a subagent: identity, system prompt, allowed and disallowed tools, model, skills and color, with validation and unsaved changes protection.", keywords: ["agent editor form", "system prompt editor", "subagent configuration form"] },
  AgentCreateWizard: { description: "AgentCreateWizard creates a subagent step by step or generates a draft from a task description, with a review that warns about destructive tools.", keywords: ["create agent wizard", "generate agent with AI", "subagent setup"] },
  ToolSelector: { description: "ToolSelector picks the tools an agent may call: all tools or a searchable selection grouped by MCP server with read-only and destructive markers.", keywords: ["tool selector", "agent tools picker", "MCP tools selection"] },
  AgentAvatar: { description: "AgentAvatar renders an agent with its icon or initials in the agent color.", keywords: ["agent avatar", "AI agent icon", "Mantine avatar"] },
  SkillsSettingsPanel: { description: "SkillsSettingsPanel manages agent skills: catalog, details, editor and removal confirmation, side by side when wide and stacked in narrow widgets.", keywords: ["agent skills settings", "skills manager UI", "agent skills UI"] },
  SkillCatalog: { description: "SkillCatalog lists agent skills as rows or cards with search, source filter, enable switches and edit, duplicate and remove actions.", keywords: ["skill catalog", "agent skills list", "skills marketplace UI"] },
  SkillDetail: { description: "SkillDetail shows a skill's status, source, version, allowed tools and Markdown instructions with edit and enable actions.", keywords: ["skill detail", "SKILL.md viewer", "agent skill instructions"] },
  SkillEditor: { description: "SkillEditor creates or edits a skill: name, description, tags, allowed tools and Markdown instructions with preview and unsaved changes protection.", keywords: ["skill editor", "Markdown instructions editor", "agent skill form"] },
  SkillPicker: { description: "SkillPicker selects several skills with search by name and tag, pills and disabled skill markers.", keywords: ["skill picker", "multi select skills", "agent skills input"] },
  SessionList: { description: "SessionList shows past agent conversations grouped by date with fuzzy search, pinned and archived filters, and rename, pin, archive, delete and export actions.", keywords: ["chat history sidebar", "session list React", "conversation history UI", "Mantine session list"] },
  SessionPreview: { description: "SessionPreview shows a past conversation with its model, branch, token count and cost, and offers to resume or export it.", keywords: ["conversation preview", "resume chat session", "agent session history"] },
  ExportDialog: { description: "ExportDialog exports a conversation as Markdown, JSON or text with options for tool calls, thinking and timestamps, a live preview, copy and download.", keywords: ["export chat transcript", "conversation to markdown", "chat export dialog"] },
  MessageActions: { description: "MessageActions adds copy, edit, retry, rewind, branch and feedback actions under chat messages, built into MessageList through messageActions.", keywords: ["chat message actions", "regenerate response UI", "thumbs up down feedback", "edit message React"] },
  EditMessageComposer: { description: "EditMessageComposer edits a sent user message inline: Enter resends, Shift+Enter adds a line, Escape cancels.", keywords: ["edit sent message", "inline message editor", "chat resend edited message"] },
  FeedbackForm: { description: "FeedbackForm collects reasons and a comment for a thumbs down on an AI answer and shows a thank-you note after sending.", keywords: ["AI answer feedback form", "thumbs down reasons", "LLM response rating"] },
  PlanApproval: { description: "PlanApproval lets the user review an agent plan and approve it, approve with edits or reject with feedback.", keywords: ["agent plan approval", "plan mode UI", "human in the loop plan review"] },
  RewindDialog: { description: "RewindDialog returns an agent conversation to an earlier user message and can also restore code changes.", keywords: ["rewind conversation", "undo agent changes", "checkpoint restore UI"] },
  ToolResultNotice: { description: "ToolResultNotice leaves a compact, expandable trace of a rejected, cancelled, failed or interrupted tool call.", keywords: ["rejected tool call", "tool error notice", "agent tool trace"] },
  MemoryNotice: { description: "MemoryNotice tells the user the agent saved something to memory, with the saved text, open and undo actions.", keywords: ["agent memory notice", "AGENTS.md memory", "saved memory UI"] },
  CommandChip: { description: "CommandChip renders a slash command invocation as a badge with its arguments and a description tooltip.", keywords: ["slash command chip", "command badge", "chat slash commands"] },
  CommandsHelp: { description: "CommandsHelp is a searchable reference of slash commands and keyboard shortcuts with groups and clickable commands.", keywords: ["slash commands help", "keyboard shortcuts reference", "command help panel"] },
  ModelSettingsPanel: { description: "ModelSettingsPanel assembles model, reasoning effort, output style, usage and status sections into one responsive settings screen.", keywords: ["model settings UI", "LLM model picker settings", "agent settings panel"] },
  EffortSelector: { description: "EffortSelector picks the reasoning effort level with an extended thinking switch, as a segmented control, a select or a compact toolbar menu.", keywords: ["reasoning effort selector", "extended thinking toggle", "LLM effort level"] },
  OutputStylePicker: { description: "OutputStylePicker lets users choose how the agent writes answers with radio cards showing a description and a sample answer.", keywords: ["output style picker", "answer style selector", "radio cards"] },
  UsagePanel: { description: "UsagePanel shows token and cost usage per period with plan limits, reset countdowns, usage by model and per day.", keywords: ["LLM usage dashboard", "token usage panel", "plan limits UI", "API cost tracking"] },
  StatusPanel: { description: "StatusPanel summarizes the agent environment: version, model, account, working directory, MCP servers, memory files and context usage.", keywords: ["agent status panel", "status command UI", "MCP server status summary"] },
  BackgroundTasksPanel: { description: "BackgroundTasksPanel monitors agent background tasks with a grouped task list and a detail pane with output logs and subtasks, also available as a drawer.", keywords: ["background tasks UI", "agent task monitor", "subagent progress", "task output log"] },
  TaskList: { description: "TaskList groups background tasks into running, queued and finished with live elapsed time, progress, search, kind filter and stop, retry and remove actions.", keywords: ["task list component", "background job list", "running tasks UI"] },
  TaskDetail: { description: "TaskDetail shows one background task with stats, progress, error, a live output log with copy and follow, and its subtasks.", keywords: ["task detail view", "live output log React", "job logs UI"] },
  AgentTree: { description: "AgentTree shows an agent and its subagents as a collapsible tree with status, last activity and elapsed time.", keywords: ["agent tree view", "subagent hierarchy", "Mantine Tree tasks"] },
  TaskStatusPill: { description: "TaskStatusPill is a compact background task indicator for a status bar, such as 2 running · 1 failed, that opens the task panel.", keywords: ["task status pill", "status bar indicator", "running tasks badge"] },
  DiffReview: { description: "DiffReview reviews agent file changes: file list and diff side by side, j/k navigation, viewed marks and accept or reject per file or all.", keywords: ["code review UI React", "diff review component", "accept reject changes", "agent file changes"] },
  DiffFileList: { description: "DiffFileList lists changed files as a list or folder tree with status, line counts, viewed marks, decisions, search and a status filter.", keywords: ["changed files list", "diff file tree", "git status UI"] },
  DiffFileView: { description: "DiffFileView renders one file diff in unified or split layout with word highlights, collapsible unchanged lines and states for binary, deleted and renamed files.", keywords: ["diff viewer React", "split diff view", "word level diff", "unified diff component"] },
};

export function getComponentSeo(name: string): ComponentSeo {
  const hit = COMPONENT_SEO[name];
  if (hit) return hit;
  return {
    description: `${name} - ${baseTail}`,
    keywords: [`${name} component`, "agent UI", "React component"],
  };
}
