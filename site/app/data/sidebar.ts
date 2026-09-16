import { componentIdFromName } from "@/app/data/component-docs";

export type SidebarSection = {
  title: string;
  items: Array<{ label: string; href: string }>;
};

const COMPONENT_ITEMS = [
  "AgentChat",
  "MessageList",
  "InputBar",
  "Suggestions",
  "ModelPicker",
  "ModeSelector",
  "UserMessage",
  "Markdown",
  "SendButton",
  "AttachmentButton",
  "FileAttachment",
  "TextShimmer",
  "SpiralLoader",
  "BashTool",
  "EditTool",
  "SearchTool",
  "TodoTool",
  "PlanTool",
  "ToolGroup",
  "SubagentTool",
  "QuestionTool",
  "McpTool",
  "ThinkingTool",
  "GenericTool",
];

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "MCP", href: "/docs/mcp" },
      { label: "Skills", href: "/docs/skills" },
    ],
  },
  {
    title: "Home",
    items: [{ label: "Use cases", href: "/docs/use-cases" }],
  },
  {
    title: "Components",
    items: COMPONENT_ITEMS.map((label) => ({
      label,
      href: `/docs/${componentIdFromName(label)}`,
    })),
  },
];
