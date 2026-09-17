import React from 'react';
import { IconBroadcast, IconTerminal2, IconWorld } from '@tabler/icons-react';
import type { McpTransport } from './types';

export const MCP_TRANSPORT_LABELS: Record<McpTransport, string> = {
  stdio: 'stdio',
  http: 'HTTP',
  sse: 'SSE',
};

export interface McpTransportIconProps {
  /** Server transport: `stdio` shows a terminal, `sse` a broadcast icon, `http` a globe */
  transport: McpTransport;
  /** Icon size in px, `16` by default */
  size?: number;
}

export function McpTransportIcon({ transport, size = 16 }: McpTransportIconProps) {
  if (transport === 'stdio') {
    return <IconTerminal2 size={size} aria-hidden />;
  }
  if (transport === 'sse') {
    return <IconBroadcast size={size} aria-hidden />;
  }
  return <IconWorld size={size} aria-hidden />;
}
