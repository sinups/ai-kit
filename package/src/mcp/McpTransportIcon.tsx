import React, { memo } from 'react';
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
  /** Class name added to the icon */
  className?: string;
  /** Inline styles added to the icon */
  style?: React.CSSProperties;
}

export const McpTransportIcon = memo(function McpTransportIcon({
  transport,
  size = 16,
  className,
  style,
}: McpTransportIconProps) {
  if (transport === 'stdio') {
    return <IconTerminal2 size={size} className={className} style={style} aria-hidden />;
  }
  if (transport === 'sse') {
    return <IconBroadcast size={size} className={className} style={style} aria-hidden />;
  }
  return <IconWorld size={size} className={className} style={style} aria-hidden />;
});

McpTransportIcon.displayName = 'McpTransportIcon';
