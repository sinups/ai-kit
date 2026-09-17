import { COMPONENT_DOCS, componentIdFromName } from "@/app/data/component-docs";

export type SidebarItem = { label: string; href: string };

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
  /** Component sections render their labels split into words and are indexed with their doc blocks */
  components?: boolean;
};

/** Component groups in sidebar order; groups without documented components are hidden */
export const COMPONENT_GROUPS: Array<{ title: string; components: string[] }> = [
  {
    title: "Chat",
    components: [
      "AgentChat",
      "MessageList",
      "UserMessage",
      "ErrorMessage",
      "Markdown",
      "CodeBlock",
      "ImageLightbox",
      "TextShimmer",
      "SpiralLoader",
      "AgentStatus",
      "ContextUsage",
      "ContextBreakdown",
      "CompactBoundary",
      "TurnSummary",
      "ContextEventRow",
      "HookActivity",
      "TranscriptSearch",
      "IdleReturnPrompt",
      "SpendThresholdNotice",
      "MessageActions",
      "EditMessageComposer",
      "FeedbackForm",
      "PlanApproval",
      "RewindDialog",
      "ToolResultNotice",
      "MemoryNotice",
      "CommandChip",
    ],
  },
  {
    title: "Tools",
    components: [
      "ToolRenderer",
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
      "ToolApprovalFooter",
      "ElicitationForm",
      "ShellOutput",
      "DiffView",
      "ActionRow",
      "ToolRowBase",
      "FileExtIcon",
    ],
  },
  {
    title: "Input",
    components: [
      "InputBar",
      "Suggestions",
      "ModelPicker",
      "ModeSelector",
      "SendButton",
      "AttachmentButton",
      "FileAttachment",
      "PastedTextAttachment",
      "PromptHistorySearch",
      "InputPopover",
      "QuestionPrompt",
    ],
  },
  {
    title: "Primitives",
    components: [
      "Wizard",
      "ConfirmDialog",
      "SettingsLayout",
      "SettingsModal",
      "MasterDetail",
      "EntityList",
      "CommandPalette",
      "StatusBadge",
      "ShortcutHint",
      "KeyValueEditor",
      "SchemaView",
      "ValidationErrorsList",
      "InvalidSettingsNotice",
    ],
  },
  {
    title: "Agents & skills",
    components: [
      "AgentsSettingsPanel",
      "AgentList",
      "AgentDetail",
      "AgentEditor",
      "AgentCreateWizard",
      "AgentIdentityFields",
      "ToolSelector",
      "AgentAvatar",
      "SkillsSettingsPanel",
      "SkillCatalog",
      "SkillDetail",
      "SkillEditor",
      "SkillPicker",
    ],
  },
  {
    title: "MCP",
    components: [
      "McpSettingsPanel",
      "McpServerList",
      "McpServerDetail",
      "McpToolDetail",
      "McpServerWizard",
      "McpImportDialog",
      "McpDiscoveredServers",
      "McpConfigWarnings",
      "McpToolAnnotationBadges",
      "McpTransportIcon",
    ],
  },
  {
    title: "Permissions & hooks",
    components: [
      "PermissionRulesPanel",
      "AddPermissionRuleWizard",
      "PermissionRuleInput",
      "PermissionModeSelector",
      "HooksPanel",
      "HookWizard",
    ],
  },
  {
    title: "Sessions & tasks",
    components: [
      "SessionList",
      "SessionPreview",
      "ExportDialog",
      "BackgroundTasksPanel",
      "TaskList",
      "TaskDetail",
      "AgentTree",
      "TaskStatusPill",
      "TaskElapsed",
      "AgentMessage",
    ],
  },
  { title: "Diff", components: ["DiffReview", "DiffFileList", "DiffFileView", "DiffStats"] },
  {
    title: "Settings",
    components: [
      "ModelSettingsPanel",
      "EffortSelector",
      "OutputStylePicker",
      "UsagePanel",
      "StatusPanel",
      "MemoryPanel",
      "MemoryFileDetail",
      "CommandsHelp",
      "AiKitProvider",
      "AiKitThemeCustomizer",
      "ChatLauncher",
    ],
  },
];

const documented = new Set(COMPONENT_DOCS.map((doc) => doc.name));

const componentSections: SidebarSection[] = COMPONENT_GROUPS.map((group) => ({
  title: group.title,
  components: true,
  items: group.components
    .filter((name) => documented.has(name))
    .map((label) => ({ label, href: `/docs/${componentIdFromName(label)}` })),
})).filter((section) => section.items.length > 0);

const GETTING_STARTED: SidebarItem[] = [
  { label: "Introduction", href: "/docs" },
  { label: "Installation", href: "/docs/installation" },
  { label: "Architecture", href: "/docs/architecture" },
  { label: "Use cases", href: "/docs/use-cases" },
  { label: "MCP", href: "/docs/mcp" },
  { label: "Skills", href: "/docs/skills" },
];

const GUIDES: SidebarItem[] = [
  { label: "What you can build", href: "/docs/what-you-can-build" },
  { label: "Theming", href: "/docs/theming" },
  { label: "Layouts", href: "/docs/layouts" },
  { label: "Embedding the launcher", href: "/docs/launcher" },
  { label: "Bundle size", href: "/docs/bundle-size" },
  { label: "What's new", href: "/docs/whats-new" },
];

const UTILITIES: SidebarItem[] = [{ label: "Hooks and utilities", href: "/docs/utilities" }];

export const PRIMARY_DOC_HREFS = [...GETTING_STARTED, ...GUIDES, ...UTILITIES].map((item) => item.href);

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { title: "Getting Started", items: GETTING_STARTED },
  { title: "Guides", items: GUIDES },
  ...componentSections,
  { title: "Utilities", items: UTILITIES },
];

/** Documented components in sidebar order, used for previous/next links on component pages */
export const COMPONENT_NAV_ITEMS: SidebarItem[] = componentSections.flatMap(
  (section) => section.items,
);
