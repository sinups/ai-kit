import "server-only";

import { readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

/** The library lives next to the site in the monorepo: <repo>/package/src */
const PACKAGE_SRC = resolve(process.cwd(), "../package/src");

/** Map from component docs id (kebab-case, matches SIDEBAR id) to the primary source file inside package/src */
const COMPONENT_PRIMARY_FILE: Record<string, string> = {
  "agent-chat": "AgentChat/AgentChat.tsx",
  "message-list": "MessageList/MessageList.tsx",
  "input-bar": "input/InputBar.tsx",
  suggestions: "input/Suggestions.tsx",
  "model-picker": "input/ModelPicker.tsx",
  "mode-selector": "input/ModeSelector.tsx",
  "user-message": "UserMessage/UserMessage.tsx",
  "error-message": "ErrorMessage/ErrorMessage.tsx",
  markdown: "Markdown/Markdown.tsx",
  "send-button": "input/SendButton.tsx",
  "attachment-button": "input/AttachmentButton.tsx",
  "file-attachment": "input/FileAttachment.tsx",
  "text-shimmer": "TextShimmer/TextShimmer.tsx",
  "spiral-loader": "SpiralLoader/SpiralLoader.tsx",
  "bash-tool": "tools/BashTool.tsx",
  "edit-tool": "tools/EditTool.tsx",
  "search-tool": "tools/SearchTool.tsx",
  "todo-tool": "tools/TodoTool.tsx",
  "plan-tool": "tools/PlanTool.tsx",
  "tool-group": "tools/ToolGroup.tsx",
  "subagent-tool": "tools/SubagentTool.tsx",
  "question-tool": "question/QuestionTool.tsx",
  "mcp-tool": "tools/McpTool.tsx",
  "thinking-tool": "tools/ThinkingTool.tsx",
  "generic-tool": "tools/GenericTool.tsx",
  "tool-approval-footer": "tools/ToolApprovalFooter.tsx",
  "elicitation-form": "elicitation/ElicitationForm.tsx",
  "agent-status": "AgentStatus/AgentStatus.tsx",
  "context-usage": "ContextUsage/ContextUsage.tsx",
  "compact-boundary": "CompactBoundary/CompactBoundary.tsx",
  wizard: "primitives/Wizard/Wizard.tsx",
  "confirm-dialog": "primitives/ConfirmDialog/ConfirmDialog.tsx",
  "settings-layout": "primitives/SettingsLayout/SettingsLayout.tsx",
  "master-detail": "primitives/MasterDetail/MasterDetail.tsx",
  "entity-list": "primitives/EntityList/EntityList.tsx",
  "command-palette": "primitives/CommandPalette/CommandPalette.tsx",
  "status-badge": "primitives/StatusBadge/StatusBadge.tsx",
  "shortcut-hint": "primitives/ShortcutHint/ShortcutHint.tsx",
  "key-value-editor": "primitives/KeyValueEditor/KeyValueEditor.tsx",
  "schema-view": "primitives/SchemaView/SchemaView.tsx",
  "mcp-settings-panel": "mcp/McpSettingsPanel.tsx",
  "mcp-server-list": "mcp/McpServerList.tsx",
  "mcp-server-detail": "mcp/McpServerDetail.tsx",
  "mcp-tool-detail": "mcp/McpToolDetail.tsx",
  "mcp-server-wizard": "mcp/McpServerWizard.tsx",
  "permission-rules-panel": "permissions/PermissionRulesPanel.tsx",
  "add-permission-rule-wizard": "permissions/AddPermissionRuleWizard.tsx",
  "permission-rule-input": "permissions/PermissionRuleInput.tsx",
  "permission-mode-selector": "permissions/PermissionModeSelector.tsx",
  "hooks-panel": "hooks-config/HooksPanel.tsx",
  "hook-wizard": "hooks-config/HookWizard.tsx",
  "agents-settings-panel": "agents/AgentsSettingsPanel/AgentsSettingsPanel.tsx",
  "agent-list": "agents/AgentList/AgentList.tsx",
  "agent-detail": "agents/AgentDetail/AgentDetail.tsx",
  "agent-editor": "agents/AgentEditor/AgentEditor.tsx",
  "agent-create-wizard": "agents/AgentCreateWizard/AgentCreateWizard.tsx",
  "tool-selector": "agents/ToolSelector/ToolSelector.tsx",
  "agent-avatar": "agents/AgentAvatar/AgentAvatar.tsx",
  "skills-settings-panel": "skills/SkillsSettingsPanel.tsx",
  "skill-catalog": "skills/SkillCatalog.tsx",
  "skill-detail": "skills/SkillDetail.tsx",
  "skill-editor": "skills/SkillEditor.tsx",
  "skill-picker": "skills/SkillPicker.tsx",
  "session-list": "sessions/SessionList.tsx",
  "session-preview": "sessions/SessionPreview.tsx",
  "export-dialog": "sessions/ExportDialog.tsx",
  "message-actions": "message-actions/MessageActions/MessageActions.tsx",
  "edit-message-composer": "message-actions/EditMessageComposer/EditMessageComposer.tsx",
  "feedback-form": "message-actions/FeedbackForm/FeedbackForm.tsx",
  "plan-approval": "message-actions/PlanApproval/PlanApproval.tsx",
  "rewind-dialog": "message-actions/RewindDialog/RewindDialog.tsx",
  "tool-result-notice": "message-actions/ToolResultNotice/ToolResultNotice.tsx",
  "memory-notice": "message-actions/MemoryNotice/MemoryNotice.tsx",
  "command-chip": "message-actions/CommandChip/CommandChip.tsx",
  "commands-help": "help/CommandsHelp/CommandsHelp.tsx",
  "model-settings-panel": "model-settings/ModelSettingsPanel/ModelSettingsPanel.tsx",
  "effort-selector": "model-settings/EffortSelector/EffortSelector.tsx",
  "output-style-picker": "model-settings/OutputStylePicker/OutputStylePicker.tsx",
  "usage-panel": "model-settings/UsagePanel/UsagePanel.tsx",
  "status-panel": "model-settings/StatusPanel/StatusPanel.tsx",
  "background-tasks-panel": "tasks/BackgroundTasksPanel/BackgroundTasksPanel.tsx",
  "task-list": "tasks/TaskList/TaskList.tsx",
  "task-detail": "tasks/TaskDetail/TaskDetail.tsx",
  "agent-tree": "tasks/AgentTree/AgentTree.tsx",
  "task-status-pill": "tasks/TaskStatusPill/TaskStatusPill.tsx",
  "diff-review": "diff/DiffReview/DiffReview.tsx",
  "diff-file-list": "diff/DiffFileList/DiffFileList.tsx",
  "diff-file-view": "diff/DiffFileView/DiffFileView.tsx",
};

export type ComponentSourceFile = {
  /** Path relative to package/src, e.g. "tools/BashTool.tsx" */
  path: string;
  /** Same as `path`, shown in the code block header */
  relativePath: string;
  content: string;
  language: string;
};

export function getPrimarySourcePath(componentId: string): string | null {
  return COMPONENT_PRIMARY_FILE[componentId] ?? null;
}

/** Inverse lookup: file path -> component id */
const PATH_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(COMPONENT_PRIMARY_FILE).map(([id, path]) => [path, id]),
);

export type RegistryDependency = {
  id: string;
  name: string;
  href: string;
  relativePath: string;
};

function prettifyName(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function guessLanguage(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".js")) return "js";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "text";
}

// Matches runtime `import ... from "..."` / `export ... from "..."` / `import("...")`.
const IMPORT_REGEX =
  /(?:import(?!\s+type\b)|export(?!\s+type\b))[^'"`]*?from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

/** Resolve a relative import to a file inside package/src, or null for npm packages */
async function resolveImport(
  fromFile: string,
  spec: string,
): Promise<string | null> {
  if (!spec.startsWith("./") && !spec.startsWith("../")) return null;
  const basePath = resolve(dirname(fromFile), spec);
  if (relative(PACKAGE_SRC, basePath).startsWith("..")) return null;

  const candidates = [
    basePath,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    `${basePath}.css`,
    join(basePath, "index.tsx"),
    join(basePath, "index.ts"),
  ];
  for (const candidate of candidates) {
    try {
      await readFile(candidate, "utf-8");
      return candidate;
    } catch {
      // keep trying
    }
  }
  return null;
}

function extractImportSpecs(source: string): string[] {
  const specs: string[] = [];
  for (const match of source.matchAll(IMPORT_REGEX)) {
    const spec = match[1] ?? match[2];
    if (spec) specs.push(spec);
  }
  return specs;
}

/** Read the primary source file of a component from package/src */
export async function getPrimaryFile(
  componentId: string,
): Promise<ComponentSourceFile | null> {
  const entry = COMPONENT_PRIMARY_FILE[componentId];
  if (!entry) return null;

  const abs = resolve(PACKAGE_SRC, entry);
  try {
    const content = await readFile(abs, "utf-8");
    return {
      path: entry,
      relativePath: entry,
      content,
      language: guessLanguage(abs),
    };
  } catch {
    return null;
  }
}

/** Walk local imports transitively and return every other documented component the file depends on */
export async function getRegistryDependencies(
  componentId: string,
): Promise<RegistryDependency[]> {
  const entry = COMPONENT_PRIMARY_FILE[componentId];
  if (!entry) return [];

  const visited = new Set<string>();
  const queue: string[] = [resolve(PACKAGE_SRC, entry)];
  const depIds = new Set<string>();

  while (queue.length > 0) {
    const abs = queue.shift()!;
    if (visited.has(abs)) continue;
    visited.add(abs);

    let content: string;
    try {
      content = await readFile(abs, "utf-8");
    } catch {
      continue;
    }

    const id = PATH_TO_ID[relative(PACKAGE_SRC, abs)];
    if (id && id !== componentId) depIds.add(id);

    for (const spec of extractImportSpecs(content)) {
      const resolved = await resolveImport(abs, spec);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }

  return [...depIds].sort().map((id) => ({
    id,
    name: prettifyName(id),
    href: `/docs/${id}`,
    relativePath: COMPONENT_PRIMARY_FILE[id],
  }));
}
