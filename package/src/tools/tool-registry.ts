import type React from 'react';
import {
  IconChecklist,
  IconCircleX,
  IconEye,
  IconFileCode,
  IconFilePlus,
  IconFolderSearch,
  IconGitBranch,
  IconGlobe,
  IconLogout,
  IconSearch,
  IconSparkles,
  IconTerminal2,
} from '@tabler/icons-react';
import { fillTemplate } from '../utils/fill-template';
import { countDiffStats, diffLines } from '../utils/line-diff';

export type ToolVariant = 'simple' | 'collapsible';

/** Row titles and subtitles of the built-in tools; `{name}`-style placeholders are replaced */
export interface ToolTitleLabels {
  /** Running subagent, `{name}` is its type, `Running {name}` by default */
  subagentRunning: string;
  /** Finished subagent, `{name} completed` by default */
  subagentCompleted: string;
  /** Subagent type when the call names none, `Agent` by default */
  subagentName: string;
  /** `Skill` by default */
  skill: string;
  /** `Grepping` by default */
  grepping: string;
  /** `Grepped {count} files` by default */
  grepped: string;
  /** `No matches` by default */
  noMatches: string;
  /** Subtitle of a search limited to a path, `{pattern} in {path}` by default */
  patternInPath: string;
  /** `Exploring files` by default */
  exploringFiles: string;
  /** `Found {count} files` by default */
  foundFiles: string;
  /** `No files found` by default */
  noFilesFound: string;
  /** `Reading` by default */
  reading: string;
  /** `Read` by default */
  read: string;
  /** Title of an edit without a file path, `Edit` by default */
  edit: string;
  /** `Create` by default */
  create: string;
  /** `Running command` by default */
  runningCommand: string;
  /** `Ran command` by default */
  ranCommand: string;
  /** `Fetching` by default */
  fetching: string;
  /** `Fetched` by default */
  fetched: string;
  /** `Searching web` by default */
  searchingWeb: string;
  /** `Searched web` by default */
  searchedWeb: string;
  /** `Adding todo` by default */
  addingTodo: string;
  /** `Updating todos` by default */
  updatingTodos: string;
  /** `Added todo` by default */
  addedTodo: string;
  /** `Updated todos` by default */
  updatedTodos: string;
  /** Subtitle with the number of todos, `1 item` or `{count} items` by default */
  todoCount: (count: number) => string;
  /** `Creating plan` by default */
  creatingPlan: string;
  /** `Approving plan` by default */
  approvingPlan: string;
  /** `Updating plan` by default */
  updatingPlan: string;
  /** `Plan ready for review` by default */
  planReady: string;
  /** `Plan approved` by default */
  planApproved: string;
  /** `Plan completed` by default */
  planCompleted: string;
  /** `Created plan` by default */
  createdPlan: string;
  /** `Updated plan` by default */
  updatedPlan: string;
  /** `Finishing plan` by default */
  finishingPlan: string;
  /** `Plan complete` by default */
  planComplete: string;
  /** `Editing notebook` by default */
  editingNotebook: string;
  /** `Edited notebook` by default */
  editedNotebook: string;
  /** `Getting output` by default */
  gettingOutput: string;
  /** `Command output` by default */
  commandOutput: string;
  /** `Stopping shell` by default */
  stoppingShell: string;
  /** `Shell stopped` by default */
  shellStopped: string;
  /** Subtitle of a stopped shell, `pid {pid}` by default */
  pid: string;
  /** `Cloning repo` by default */
  cloningRepo: string;
  /** `Repo cloned` by default */
  repoCloned: string;
  /** `Thinking...` by default */
  thinking: string;
  /** `Thought` by default */
  thought: string;
}

export const DEFAULT_TOOL_TITLE_LABELS: ToolTitleLabels = {
  subagentRunning: 'Running {name}',
  subagentCompleted: '{name} completed',
  subagentName: 'Agent',
  skill: 'Skill',
  grepping: 'Grepping',
  grepped: 'Grepped {count} files',
  noMatches: 'No matches',
  patternInPath: '{pattern} in {path}',
  exploringFiles: 'Exploring files',
  foundFiles: 'Found {count} files',
  noFilesFound: 'No files found',
  reading: 'Reading',
  read: 'Read',
  edit: 'Edit',
  create: 'Create',
  runningCommand: 'Running command',
  ranCommand: 'Ran command',
  fetching: 'Fetching',
  fetched: 'Fetched',
  searchingWeb: 'Searching web',
  searchedWeb: 'Searched web',
  addingTodo: 'Adding todo',
  updatingTodos: 'Updating todos',
  addedTodo: 'Added todo',
  updatedTodos: 'Updated todos',
  todoCount: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
  creatingPlan: 'Creating plan',
  approvingPlan: 'Approving plan',
  updatingPlan: 'Updating plan',
  planReady: 'Plan ready for review',
  planApproved: 'Plan approved',
  planCompleted: 'Plan completed',
  createdPlan: 'Created plan',
  updatedPlan: 'Updated plan',
  finishingPlan: 'Finishing plan',
  planComplete: 'Plan complete',
  editingNotebook: 'Editing notebook',
  editedNotebook: 'Edited notebook',
  gettingOutput: 'Getting output',
  commandOutput: 'Command output',
  stoppingShell: 'Stopping shell',
  shellStopped: 'Shell stopped',
  pid: 'pid {pid}',
  cloningRepo: 'Cloning repo',
  repoCloned: 'Repo cloned',
  thinking: 'Thinking...',
  thought: 'Thought',
};

/** Title labels with every key filled: the defaults under `labels` */
export function resolveToolTitleLabels(labels?: Partial<ToolTitleLabels>): ToolTitleLabels {
  return labels ? { ...DEFAULT_TOOL_TITLE_LABELS, ...labels } : DEFAULT_TOOL_TITLE_LABELS;
}

type Labels = ToolTitleLabels;
const L = DEFAULT_TOOL_TITLE_LABELS;

/** Display metadata for a built-in tool type (`tool-<Name>`); `labels` are the English defaults when omitted */
export type ToolMeta = {
  icon: React.ComponentType<{ className?: string }>;
  title: (part: any, labels?: ToolTitleLabels) => string;
  subtitle?: (part: any, labels?: ToolTitleLabels) => string;
  variant: ToolVariant;
};

function isPartPending(part: any): boolean {
  return part.state !== 'output-available' && part.state !== 'output-error';
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function getDisplayPath(filePath: string): string {
  if (!filePath) {
    return '';
  }
  const prefixes = ['/project/sandbox/repo/', '/project/sandbox/', '/project/', '/workspace/'];
  for (const prefix of prefixes) {
    if (filePath.startsWith(prefix)) {
      return filePath.slice(prefix.length);
    }
  }
  const worktreeMatch = filePath.match(/\.21st\/worktrees\/[^/]+\/[^/]+\/(.+)$/);
  if (worktreeMatch) {
    return worktreeMatch[1]!;
  }
  if (filePath.startsWith('/')) {
    const parts = filePath.split('/');
    const rootIndicators = ['apps', 'packages', 'src', 'lib', 'components'];
    const rootIndex = parts.findIndex((p) => rootIndicators.includes(p));
    if (rootIndex > 0) {
      return parts.slice(rootIndex).join('/');
    }
  }
  return filePath;
}

function normalizeCommand(command: string): string {
  let normalized = command.replace(/\\\s*\n\s*/g, ' ').trim();
  normalized = normalized.replace(/\/(?:Users|home|root)\/[^\s"']+/g, (match: string) =>
    getDisplayPath(match)
  );
  return truncate(normalized, 50);
}

const subagentMeta: ToolMeta = {
  icon: IconSparkles,
  title: (part, labels: Labels = L) => {
    const name = part.input?.subagent_type || labels.subagentName;
    return fillTemplate(isPartPending(part) ? labels.subagentRunning : labels.subagentCompleted, {
      name,
    });
  },
  subtitle: (part) => truncate(part.input?.description || '', 50),
  variant: 'simple',
};

export const toolRegistry: Record<string, ToolMeta> = {
  'tool-Task': subagentMeta,
  'tool-Agent': subagentMeta,
  'tool-Skill': {
    icon: IconSparkles,
    title: (_part, labels: Labels = L) => labels.skill,
    subtitle: (part) => part.input?.skill || '',
    variant: 'simple',
  },
  'tool-Grep': {
    icon: IconSearch,
    title: (part, labels: Labels = L) => {
      if (isPartPending(part)) {
        return labels.grepping;
      }
      const numFiles = part.output?.numFiles || 0;
      return numFiles > 0 ? fillTemplate(labels.grepped, { count: numFiles }) : labels.noMatches;
    },
    subtitle: (part, labels: Labels = L) => {
      const pattern = part.input?.pattern || '';
      const path = part.input?.path || '';
      if (path) {
        return truncate(
          fillTemplate(labels.patternInPath, { pattern, path: getDisplayPath(path) }),
          40
        );
      }
      return truncate(pattern, 40);
    },
    variant: 'simple',
  },
  'tool-Glob': {
    icon: IconFolderSearch,
    title: (part, labels: Labels = L) => {
      if (isPartPending(part)) {
        return labels.exploringFiles;
      }
      const numFiles = part.output?.numFiles || 0;
      return numFiles > 0
        ? fillTemplate(labels.foundFiles, { count: numFiles })
        : labels.noFilesFound;
    },
    subtitle: (part) => truncate(part.input?.pattern || '', 40),
    variant: 'simple',
  },
  'tool-Read': {
    icon: IconEye,
    title: (part, labels: Labels = L) => (isPartPending(part) ? labels.reading : labels.read),
    subtitle: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || '' : '';
    },
    variant: 'simple',
  },
  'tool-Edit': {
    icon: IconFileCode,
    title: (part, labels: Labels = L) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || labels.edit : labels.edit;
    },
    subtitle: (part) => {
      if (isPartPending(part)) {
        return '';
      }
      const oldString = part.input?.old_string || '';
      const newString = part.input?.new_string || '';
      if (!oldString && !newString) {
        return '';
      }
      if (oldString !== newString) {
        const { added, removed } = countDiffStats(diffLines(oldString, newString));
        return `+${added} -${removed}`;
      }
      return '';
    },
    variant: 'simple',
  },
  'tool-Write': {
    icon: IconFilePlus,
    title: (_part, labels: Labels = L) => labels.create,
    subtitle: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || '' : '';
    },
    variant: 'simple',
  },
  'tool-Bash': {
    icon: IconTerminal2,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.runningCommand : labels.ranCommand,
    subtitle: (part) => {
      const command = part.input?.command || '';
      return command ? normalizeCommand(command) : '';
    },
    variant: 'simple',
  },
  'tool-WebFetch': {
    icon: IconGlobe,
    title: (part, labels: Labels = L) => (isPartPending(part) ? labels.fetching : labels.fetched),
    subtitle: (part) => {
      const url = part.input?.url || '';
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return url.slice(0, 30);
      }
    },
    variant: 'simple',
  },
  'tool-WebSearch': {
    icon: IconSearch,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.searchingWeb : labels.searchedWeb,
    subtitle: (part) => truncate(part.input?.query || '', 40),
    variant: 'collapsible',
  },
  'tool-TodoWrite': {
    icon: IconChecklist,
    title: (part, labels: Labels = L) => {
      const action = part.input?.action || 'update';
      if (isPartPending(part)) {
        return action === 'add' ? labels.addingTodo : labels.updatingTodos;
      }
      return action === 'add' ? labels.addedTodo : labels.updatedTodos;
    },
    subtitle: (part, labels: Labels = L) => {
      const todos = part.input?.todos || [];
      if (todos.length === 0) {
        return '';
      }
      return labels.todoCount(todos.length);
    },
    variant: 'simple',
  },
  'tool-PlanWrite': {
    icon: IconSparkles,
    title: (part, labels: Labels = L) => {
      const action = part.input?.action || 'create';
      if (isPartPending(part)) {
        if (action === 'create') {
          return labels.creatingPlan;
        }
        if (action === 'approve') {
          return labels.approvingPlan;
        }
        return labels.updatingPlan;
      }
      const status = part.input?.plan?.status;
      if (status === 'awaiting_approval') {
        return labels.planReady;
      }
      if (status === 'approved') {
        return labels.planApproved;
      }
      if (status === 'completed') {
        return labels.planCompleted;
      }
      return action === 'create' ? labels.createdPlan : labels.updatedPlan;
    },
    variant: 'simple',
  },
  'tool-ExitPlanMode': {
    icon: IconLogout,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.finishingPlan : labels.planComplete,
    variant: 'simple',
  },
  'tool-NotebookEdit': {
    icon: IconFileCode,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.editingNotebook : labels.editedNotebook,
    subtitle: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || '' : '';
    },
    variant: 'simple',
  },
  'tool-BashOutput': {
    icon: IconTerminal2,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.gettingOutput : labels.commandOutput,
    subtitle: (part) => {
      const output = part.output;
      if (typeof output === 'string' && output.trim()) {
        return truncate(output.trim(), 50);
      }
      const command = part.input?.command || '';
      return command ? normalizeCommand(command) : '';
    },
    variant: 'simple',
  },
  'tool-KillShell': {
    icon: IconCircleX,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.stoppingShell : labels.shellStopped,
    subtitle: (part, labels: Labels = L) => {
      const pid = part.input?.pid;
      return typeof pid === 'number' ? fillTemplate(labels.pid, { pid }) : '';
    },
    variant: 'simple',
  },
  'tool-cloning': {
    icon: IconGitBranch,
    title: (part, labels: Labels = L) =>
      isPartPending(part) ? labels.cloningRepo : labels.repoCloned,
    subtitle: (part) => part.input?.repo ?? '',
    variant: 'simple',
  },
  'tool-Thinking': {
    icon: IconSparkles,
    title: (part, labels: Labels = L) => (isPartPending(part) ? labels.thinking : labels.thought),
    variant: 'collapsible',
  },
};

const MCP_TOOL_PREFIX = 'tool-mcp__';

export type McpToolInfo = {
  serverName: string;
  toolName: string;
  displayName: string;
  category: string;
};

const BUILTIN_MCP_TOOLS: Record<string, McpToolInfo> = {
  'tool-ListMcpResources': {
    serverName: 'mcp',
    toolName: 'list_resources',
    displayName: 'List Resources',
    category: 'list',
  },
  'tool-ListMcpResourcesTool': {
    serverName: 'mcp',
    toolName: 'list_resources',
    displayName: 'List Resources',
    category: 'list',
  },
  'tool-ReadMcpResource': {
    serverName: 'mcp',
    toolName: 'read_resource',
    displayName: 'Read Resource',
    category: 'get',
  },
  'tool-ReadMcpResourceTool': {
    serverName: 'mcp',
    toolName: 'read_resource',
    displayName: 'Read Resource',
    category: 'get',
  },
};

/** Parses `tool-mcp__<server>__<tool>` part types (and built-in MCP resource tools) */
const FRAMED_TOOL_TYPES = new Set([
  'tool-Bash',
  'tool-Edit',
  'tool-Write',
  'tool-TodoWrite',
  'tool-PlanWrite',
  'tool-Question',
]);

/** Whether a call renders as a card with a frame of its own rather than a single row */
export function rendersFramedToolCard(partType: string): boolean {
  return FRAMED_TOOL_TYPES.has(partType);
}

export function parseMcpToolType(partType: string): McpToolInfo | null {
  const builtin = BUILTIN_MCP_TOOLS[partType];
  if (builtin) {
    return builtin;
  }
  if (!partType.startsWith(MCP_TOOL_PREFIX)) {
    return null;
  }
  const withoutPrefix = partType.slice(MCP_TOOL_PREFIX.length);
  const separatorIndex = withoutPrefix.indexOf('__');
  if (separatorIndex === -1) {
    return null;
  }
  const serverName = withoutPrefix.slice(0, separatorIndex);
  const toolName = withoutPrefix.slice(separatorIndex + 2);
  return {
    serverName,
    toolName,
    displayName: toolName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim(),
    category: 'other',
  };
}
