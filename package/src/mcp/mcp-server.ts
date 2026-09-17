import type { AgentUiStatus } from '../primitives/StatusBadge/status-meta';
import type {
  McpPromptArgument,
  McpServer,
  McpServerScope,
  McpServerStatus,
  McpToolAnnotations,
  McpToolDefinition,
} from './types';

const STATUS_MAP: Record<McpServerStatus, AgentUiStatus> = {
  connected: 'success',
  connecting: 'running',
  disconnected: 'idle',
  error: 'error',
  'needs-auth': 'needs-auth',
  disabled: 'disabled',
};

export function getMcpAgentUiStatus(status: McpServerStatus): AgentUiStatus {
  return STATUS_MAP[status] ?? 'idle';
}

export const MCP_STATUS_LABELS: Record<McpServerStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  error: 'Failed',
  'needs-auth': 'Needs auth',
  disabled: 'Disabled',
};

export const MCP_SCOPE_LABELS: Record<McpServerScope, string> = {
  user: 'User',
  project: 'Project',
  local: 'Local',
};

export const MCP_SCOPE_ORDER: McpServerScope[] = ['project', 'local', 'user'];

export function getMcpServerTarget(
  server: Pick<McpServer, 'transport' | 'command' | 'args' | 'url'>
) {
  if (server.transport === 'stdio') {
    return [server.command, ...(server.args ?? [])].filter(Boolean).join(' ');
  }
  return server.url ?? '';
}

export function getMcpToolCount(server: McpServer): number | undefined {
  return server.tools?.length ?? server.toolCount;
}

export type McpServerFilter =
  | 'all'
  | 'connected'
  | 'attention'
  | 'disabled'
  | `scope:${McpServerScope}`;

export type McpServerFilterOption = { value: McpServerFilter; count: number };

export function needsMcpAttention(status: McpServerStatus): boolean {
  return status === 'error' || status === 'needs-auth' || status === 'disconnected';
}

export function matchesMcpServerFilter(server: McpServer, filter: string): boolean {
  if (filter.startsWith('scope:')) {
    return (server.scope ?? 'user') === filter.slice('scope:'.length);
  }
  switch (filter) {
    case 'connected':
      return server.status === 'connected' || server.status === 'connecting';
    case 'attention':
      return needsMcpAttention(server.status);
    case 'disabled':
      return server.status === 'disabled';
    default:
      return true;
  }
}

export function getMcpServerFilterOptions(servers: McpServer[]): McpServerFilterOption[] {
  const base: McpServerFilter[] = ['all', 'connected', 'attention', 'disabled'];
  const scopes = MCP_SCOPE_ORDER.filter((scope) =>
    servers.some((server) => (server.scope ?? 'user') === scope)
  );
  const values: McpServerFilter[] =
    scopes.length > 1 ? [...base, ...scopes.map((scope) => `scope:${scope}` as const)] : base;
  return values
    .map((value) => ({
      value,
      count: servers.filter((server) => matchesMcpServerFilter(server, value)).length,
    }))
    .filter((option) => option.value === 'all' || option.count > 0);
}

export function matchesMcpServerQuery(server: McpServer, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [server.name, getMcpServerTarget(server)].some((text) =>
    text.toLowerCase().includes(needle)
  );
}

export type McpToolAnnotationKind = 'read-only' | 'destructive' | 'idempotent' | 'open-world';

export function getMcpToolAnnotationKinds(
  annotations: McpToolAnnotations | undefined
): McpToolAnnotationKind[] {
  if (!annotations) {
    return [];
  }
  const kinds: McpToolAnnotationKind[] = [];
  if (annotations.readOnlyHint) {
    kinds.push('read-only');
  } else if (annotations.destructiveHint) {
    kinds.push('destructive');
  }
  if (annotations.idempotentHint) {
    kinds.push('idempotent');
  }
  if (annotations.openWorldHint) {
    kinds.push('open-world');
  }
  return kinds;
}

export function getMcpToolDisplayName(tool: McpToolDefinition): string {
  return tool.title ?? tool.name;
}

export function matchesMcpToolQuery(tool: McpToolDefinition, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return [tool.name, tool.title ?? '', tool.description ?? ''].some((text) =>
    text.toLowerCase().includes(needle)
  );
}

export function formatMcpPromptArguments(args: McpPromptArgument[]): string {
  return args.map((arg) => (arg.required ? `${arg.name}*` : arg.name)).join(', ');
}
