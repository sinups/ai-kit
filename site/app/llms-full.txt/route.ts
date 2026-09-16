import {
  COMPONENT_DOCS,
  componentIdFromName,
  type ComponentBlock,
} from "@/app/data/component-docs";

import { SITE_URL } from "@/app/lib/site";

function codeFence(code: string, lang = "tsx") {
  return ["```" + lang, code.trim(), "```"].join("\n");
}

function blockToMarkdown(block: ComponentBlock): string {
  if (block.type === "example") {
    return [`### Example: ${block.title}`, "", codeFence(block.code, "tsx")].join(
      "\n",
    );
  }
  if (block.type === "code") {
    const lang = /^\s*type\s|^type\s/.test(block.content) ? "ts" : "tsx";
    return [`### ${block.title}`, "", codeFence(block.content, lang)].join(
      "\n",
    );
  }
  return [`### ${block.title}`, "", block.content.trim()].join("\n");
}

function renderIntroduction(): string {
  return [
    "# Introduction",
    "",
    `URL: ${SITE_URL}/docs`,
    "",
    "AI UI Kit is an open-source collection of chat and agent UI components (messages, tool cards, streaming states, and input controls), built on top of Mantine. Install one npm package and use the components like any other Mantine extension: they follow your theme, color scheme and fonts.",
    "",
    "Messages are structurally compatible with `UIMessage` from the Vercel AI SDK (`ChatMessage` in this package) and status is `ChatStatus`, so `useChat` plugs in directly. The project is a fork of Agent Elements by 21st.dev (MIT): same design and behavior, Mantine instead of Tailwind and shadcn, an npm package instead of a component registry.",
    "",
    "## Component groups",
    "",
    "- **Chat surface**: AgentChat, MessageList, UserMessage, ErrorMessage, Markdown",
    "- **Input**: InputBar, Suggestions, ModelPicker, ModeSelector, SendButton, AttachmentButton, FileAttachment",
    "- **Tool cards**: BashTool, EditTool, SearchTool, TodoTool, PlanTool, ToolGroup, SubagentTool, McpTool, QuestionTool, GenericTool",
    "- **Streaming states**: ThinkingTool, TextShimmer, SpiralLoader",
    "",
    "## Quick start",
    "",
    codeFence("npm install @sinups/ai-kit @mantine/core @mantine/hooks", "bash"),
  ].join("\n");
}

function renderInstallation(): string {
  return [
    "# Installation",
    "",
    `URL: ${SITE_URL}/docs/installation`,
    "",
    "## Prerequisites",
    "",
    "- Node 18+",
    "- React 18 or 19",
    "- Mantine 7+ (`@mantine/core` and `@mantine/hooks`)",
    "",
    "## Install the package",
    "",
    codeFence("npm install @sinups/ai-kit @mantine/core @mantine/hooks", "bash"),
    "",
    "## Styles and provider",
    "",
    codeFence(
      `import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";`,
      "tsx",
    ),
    "",
    "Render the app inside `MantineProvider`; light and dark mode follow its color scheme. Override `--ae-*` custom properties on any ancestor to restyle a chat instance.",
    "",
    "## Usage",
    "",
    codeFence(
      `"use client";

import { AgentChat } from "@sinups/ai-kit";
import type { ChatMessage } from "@sinups/ai-kit";

const messages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    parts: [{ type: "text", text: "Welcome to AI UI Kit." }],
  },
];

export default function App() {
  return (
    <AgentChat
      messages={messages}
      status="ready"
      onSend={() => {}}
      onStop={() => {}}
    />
  );
}`,
      "tsx",
    ),
  ].join("\n");
}

function renderMcp(): string {
  return [
    "# MCP",
    "",
    `URL: ${SITE_URL}/docs/mcp`,
    "",
    `This site publishes its documentation for AI assistants: ${SITE_URL}/llms.txt is the index and ${SITE_URL}/llms-full.txt contains every page. Point any Model Context Protocol client (Cursor, Claude Code, Windsurf) at them through a documentation MCP server such as Context7 or a plain fetch server.`,
    "",
    "## Cursor setup",
    "",
    "Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per project):",
    "",
    codeFence(
      `{
  "mcpServers": {
    "@sinups/ai-kit": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.context7.com/mcp"]
    }
  }
}`,
      "json",
    ),
    "",
    "## Claude Code setup",
    "",
    codeFence(
      "claude mcp add --transport http context7 https://mcp.context7.com/mcp",
      "bash",
    ),
    "",
    "## Example prompts",
    "",
    "- Show me all available AI UI Kit components.",
    "- Add AgentChat to my Mantine app and wire it to the Vercel AI SDK.",
    "- Show me the API reference and a preview of InputBar.",
    "- Build a chat page using AgentChat with BashTool and EditTool renderers.",
  ].join("\n");
}

function renderSkills(): string {
  return [
    "# Skills",
    "",
    `URL: ${SITE_URL}/docs/skills`,
    "",
    "Skills give AI assistants like Claude Code and Cursor project-aware context about AI UI Kit. When installed, your assistant knows how to install, compose, and customise components using the correct APIs, prop shapes, and theming patterns.",
    "",
    "## Install",
    "",
    codeFence("npx skills add sinups/ai-kit", "bash"),
    "",
    "## What's included",
    "",
    "- Project detection (reads `package.json` and imports)",
    "- Component catalog with API shapes and prop defaults",
    "- Composition patterns (AgentChat + tool renderers, InputBar + AI SDK, etc.)",
    "- Theming guardrails (Mantine theme and `--ae-*` tokens)",
    "- Docs access through llms-full.txt",
  ].join("\n");
}

function renderComponent(doc: (typeof COMPONENT_DOCS)[number]): string {
  const id = componentIdFromName(doc.name);
  const blocks = doc.blocks ?? [];
  const parts: string[] = [
    `## ${doc.name}`,
    "",
    `URL: ${SITE_URL}/docs/${id}`,
    "",
    "Install: `npm install @sinups/ai-kit @mantine/core @mantine/hooks`",
    "",
  ];
  for (const block of blocks) {
    parts.push(blockToMarkdown(block));
    parts.push("");
  }
  return parts.join("\n");
}

export const dynamic = "force-static";

export function GET() {
  const parts: string[] = [];

  parts.push("# AI UI Kit: Full docs");
  parts.push("");
  parts.push(`Source: ${SITE_URL}/llms-full.txt`);
  parts.push("");
  parts.push("---");
  parts.push("");

  parts.push(renderIntroduction());
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(renderInstallation());
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(renderMcp());
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(renderSkills());
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push("# Components");
  parts.push("");
  for (const doc of COMPONENT_DOCS) {
    parts.push(renderComponent(doc));
    parts.push("---");
    parts.push("");
  }

  return new Response(parts.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
