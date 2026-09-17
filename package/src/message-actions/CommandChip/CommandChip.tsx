import React, { memo } from 'react';
import { Badge, Group, Text, Tooltip, type MantineSize } from '@mantine/core';
import { IconSlash } from '@tabler/icons-react';
import classes from './CommandChip.module.css';

export interface CommandChipProps {
  /** Command name with or without the leading slash, for example `review` */
  name: string;
  /** Arguments typed after the command */
  args?: string;
  /** Command description shown in a tooltip */
  description?: string;
  /** Icon rendered in the badge instead of the slash */
  icon?: React.ReactNode;
  /** Badge and text size, `sm` by default */
  size?: Extract<MantineSize, 'xs' | 'sm' | 'md'>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Slash command invocation: the command as a badge followed by its arguments */
export const CommandChip = memo(function CommandChip({
  name,
  args,
  description,
  icon,
  size = 'sm',
  className,
  style,
}: CommandChipProps) {
  const commandName = name.replace(/^\//, '');
  const badge = (
    <Badge
      variant="light"
      radius="sm"
      size={size}
      tt="none"
      ff="monospace"
      leftSection={icon ?? <IconSlash size={12} aria-hidden />}
      data-command={commandName}
    >
      {commandName}
    </Badge>
  );

  return (
    <Group gap={6} wrap="wrap" align="baseline" className={className} style={style}>
      {description ? (
        <Tooltip label={description} withArrow openDelay={300}>
          {badge}
        </Tooltip>
      ) : (
        badge
      )}
      {args && (
        <Text component="span" size={size} className={classes.args}>
          {args}
        </Text>
      )}
    </Group>
  );
});

CommandChip.displayName = 'CommandChip';
