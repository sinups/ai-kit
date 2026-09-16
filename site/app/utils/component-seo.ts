export type ComponentSeo = {
  description: string;
  keywords: string[];
};

const baseTail =
  "Open-source React component from AI UI Kit - built for Claude Code-style agents and the Vercel AI SDK.";

export const COMPONENT_SEO: Record<string, ComponentSeo> = {
  AgentChat: {
    description:
      "AgentChat is a drop-in React chat shell for LLM agents: streaming messages, tool cards, plans, approvals, and an input bar. Works with ChatMessage from the Vercel AI SDK.",
    keywords: [
      "AgentChat component",
      "React agent chat component",
      "AI SDK chat",
      "Claude Code chat UI",
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
      "ModelPicker is a standalone dropdown for switching between LLM models (Sonnet, Opus, Haiku, or your own). Drop it into InputBar via leftActions, a header, or a settings sheet.",
    keywords: [
      "ModelPicker component",
      "LLM model selector",
      "AI model dropdown React",
      "Claude model picker",
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
      "BashTool renders shell commands the agent runs: live command line, streaming stdout/stderr, exit codes, and collapse/expand. Built for Claude Code-style terminals.",
    keywords: [
      "BashTool component",
      "shell tool UI",
      "terminal tool call React",
      "Claude Code Bash UI",
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
      "Claude Code todo UI",
    ],
  },
  PlanTool: {
    description:
      "PlanTool renders an agent's plan with a summary, numbered steps, and an explicit approve/reject interaction - gate risky rollouts behind human review.",
    keywords: [
      "PlanTool component",
      "agent plan UI",
      "plan approval UI",
      "Claude Code plan",
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
      "Claude thinking block",
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
};

export function getComponentSeo(name: string): ComponentSeo {
  const hit = COMPONENT_SEO[name];
  if (hit) return hit;
  return {
    description: `${name} - ${baseTail}`,
    keywords: [`${name} component`, "agent UI", "React component"],
  };
}
