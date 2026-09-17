import type { AgentUiStatus } from '../primitives/StatusBadge/status-meta';
import type { StatusMcpServer } from './types';

export type McpStatusCount = { status: AgentUiStatus; count: number };

const STATUS_ORDER: AgentUiStatus[] = [
  'success',
  'running',
  'pending',
  'needs-auth',
  'warning',
  'error',
  'disabled',
  'idle',
];

/** Number of servers per status, in a fixed order from healthy to inactive, statuses without servers skipped */
export function countMcpStatuses(servers: StatusMcpServer[]): McpStatusCount[] {
  const counts = new Map<AgentUiStatus, number>();
  for (const server of servers) {
    counts.set(server.status, (counts.get(server.status) ?? 0) + 1);
  }
  return STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    status,
    count: counts.get(status)!,
  }));
}
