import React, { memo } from 'react';
import { Avatar, type MantineSize } from '@mantine/core';
import type { AgentDefinition } from '../types';

export interface AgentAvatarProps {
  /** Agent to render, `icon` wins over initials of `displayName` or `name` */
  agent: Pick<AgentDefinition, 'name' | 'displayName' | 'color' | 'icon'>;
  /** Avatar size, `md` by default */
  size?: MantineSize | number;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Colored avatar of an agent with its icon or initials */
export const AgentAvatar = memo(function AgentAvatar({
  agent,
  size = 'md',
  className,
  style,
}: AgentAvatarProps) {
  const label = agent.displayName || agent.name;
  return (
    <Avatar
      size={size}
      radius="md"
      variant="light"
      color={agent.color ?? 'gray'}
      name={agent.icon ? undefined : label.replace(/-/g, ' ')}
      aria-hidden
      className={className}
      style={style}
    >
      {agent.icon}
    </Avatar>
  );
});

AgentAvatar.displayName = 'AgentAvatar';
