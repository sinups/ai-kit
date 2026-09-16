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
import { countDiffStats, diffLines } from '../utils/line-diff';

export type ToolVariant = 'simple' | 'collapsible';

/** Display metadata for a built-in tool type (`tool-<Name>`) */
export type ToolMeta = {
  icon: React.ComponentType<{ className?: string }>;
  title: (part: any) => string;
  subtitle?: (part: any) => string;
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
  title: (part) => {
    const subagentType = part.input?.subagent_type || 'Agent';
    return isPartPending(part) ? `Running ${subagentType}` : `${subagentType} completed`;
  },
  subtitle: (part) => truncate(part.input?.description || '', 50),
  variant: 'simple',
};

export const toolRegistry: Record<string, ToolMeta> = {
  'tool-Task': subagentMeta,
  'tool-Agent': subagentMeta,
  'tool-Skill': {
    icon: IconSparkles,
    title: () => 'Skill',
    subtitle: (part) => part.input?.skill || '',
    variant: 'simple',
  },
  'tool-Grep': {
    icon: IconSearch,
    title: (part) => {
      if (isPartPending(part)) {
        return 'Grepping';
      }
      const numFiles = part.output?.numFiles || 0;
      return numFiles > 0 ? `Grepped ${numFiles} files` : 'No matches';
    },
    subtitle: (part) => {
      const pattern = part.input?.pattern || '';
      const path = part.input?.path || '';
      if (path) {
        return truncate(`${pattern} in ${getDisplayPath(path)}`, 40);
      }
      return truncate(pattern, 40);
    },
    variant: 'simple',
  },
  'tool-Glob': {
    icon: IconFolderSearch,
    title: (part) => {
      if (isPartPending(part)) {
        return 'Exploring files';
      }
      const numFiles = part.output?.numFiles || 0;
      return numFiles > 0 ? `Found ${numFiles} files` : 'No files found';
    },
    subtitle: (part) => truncate(part.input?.pattern || '', 40),
    variant: 'simple',
  },
  'tool-Read': {
    icon: IconEye,
    title: (part) => (isPartPending(part) ? 'Reading' : 'Read'),
    subtitle: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || '' : '';
    },
    variant: 'simple',
  },
  'tool-Edit': {
    icon: IconFileCode,
    title: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || 'Edit' : 'Edit';
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
    title: () => 'Create',
    subtitle: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || '' : '';
    },
    variant: 'simple',
  },
  'tool-Bash': {
    icon: IconTerminal2,
    title: (part) => (isPartPending(part) ? 'Running command' : 'Ran command'),
    subtitle: (part) => {
      const command = part.input?.command || '';
      return command ? normalizeCommand(command) : '';
    },
    variant: 'simple',
  },
  'tool-WebFetch': {
    icon: IconGlobe,
    title: (part) => (isPartPending(part) ? 'Fetching' : 'Fetched'),
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
    title: (part) => (isPartPending(part) ? 'Searching web' : 'Searched web'),
    subtitle: (part) => truncate(part.input?.query || '', 40),
    variant: 'collapsible',
  },
  'tool-TodoWrite': {
    icon: IconChecklist,
    title: (part) => {
      const action = part.input?.action || 'update';
      if (isPartPending(part)) {
        return action === 'add' ? 'Adding todo' : 'Updating todos';
      }
      return action === 'add' ? 'Added todo' : 'Updated todos';
    },
    subtitle: (part) => {
      const todos = part.input?.todos || [];
      if (todos.length === 0) {
        return '';
      }
      return `${todos.length} ${todos.length === 1 ? 'item' : 'items'}`;
    },
    variant: 'simple',
  },
  'tool-PlanWrite': {
    icon: IconSparkles,
    title: (part) => {
      const action = part.input?.action || 'create';
      if (isPartPending(part)) {
        if (action === 'create') {
          return 'Creating plan';
        }
        if (action === 'approve') {
          return 'Approving plan';
        }
        return 'Updating plan';
      }
      const status = part.input?.plan?.status;
      if (status === 'awaiting_approval') {
        return 'Plan ready for review';
      }
      if (status === 'approved') {
        return 'Plan approved';
      }
      if (status === 'completed') {
        return 'Plan completed';
      }
      return action === 'create' ? 'Created plan' : 'Updated plan';
    },
    variant: 'simple',
  },
  'tool-ExitPlanMode': {
    icon: IconLogout,
    title: (part) => (isPartPending(part) ? 'Finishing plan' : 'Plan complete'),
    variant: 'simple',
  },
  'tool-NotebookEdit': {
    icon: IconFileCode,
    title: (part) => (isPartPending(part) ? 'Editing notebook' : 'Edited notebook'),
    subtitle: (part) => {
      const filePath = part.input?.file_path || '';
      return filePath ? filePath.split('/').pop() || '' : '';
    },
    variant: 'simple',
  },
  'tool-BashOutput': {
    icon: IconTerminal2,
    title: (part) => (isPartPending(part) ? 'Getting output' : 'Command output'),
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
    title: (part) => (isPartPending(part) ? 'Stopping shell' : 'Shell stopped'),
    subtitle: (part) => {
      const pid = part.input?.pid;
      return typeof pid === 'number' ? `pid ${pid}` : '';
    },
    variant: 'simple',
  },
  'tool-cloning': {
    icon: IconGitBranch,
    title: (part) => (isPartPending(part) ? 'Cloning repo' : 'Repo cloned'),
    subtitle: (part) => part.input?.repo ?? '',
    variant: 'simple',
  },
  'tool-Thinking': {
    icon: IconSparkles,
    title: (part) => (isPartPending(part) ? 'Thinking...' : 'Thought'),
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
