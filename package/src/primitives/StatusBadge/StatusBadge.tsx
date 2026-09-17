import React, { memo } from 'react';
import { Badge, ColorSwatch, Group, Loader, Text, type MantineSize } from '@mantine/core';
import { cx } from '../../utils/cx';
import { getStatusMeta, type AgentUiStatus } from './status-meta';
import classes from './StatusBadge.module.css';

export interface StatusBadgeProps {
  /** Status from the shared vocabulary */
  status: AgentUiStatus;
  /** Overrides the default English label of the status */
  label?: string;
  /** `badge` renders a Mantine `Badge`, `dot` renders a colored dot with text, `badge` by default */
  variant?: 'badge' | 'dot';
  /** Badge and text size, `sm` by default */
  size?: MantineSize;
  /** Shows the status icon, or a loader for `pending` and `running`, `true` by default */
  withIcon?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const ICON_SIZE: Record<MantineSize, number> = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 };

/** Status of a server, agent, task or tool from one shared vocabulary */
export const StatusBadge = memo(function StatusBadge({
  status,
  label,
  variant = 'badge',
  size = 'sm',
  withIcon = true,
  className,
  style,
}: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const text = label ?? meta.label;
  const iconSize = ICON_SIZE[size];
  const StatusIcon = meta.icon;

  if (variant === 'dot') {
    return (
      <Group
        gap={6}
        wrap="nowrap"
        className={cx(classes.dot, className)}
        style={style}
        data-status={status}
      >
        {withIcon && meta.loading ? (
          <Loader size={iconSize} color={meta.color} aria-hidden />
        ) : (
          <ColorSwatch
            color={`var(--mantine-color-${meta.color}-filled)`}
            size={iconSize - 4}
            withShadow={false}
            className={classes.swatch}
          />
        )}
        <Text size={size} c="dimmed" truncate>
          {text}
        </Text>
      </Group>
    );
  }

  return (
    <Badge
      variant="light"
      color={meta.color}
      size={size}
      className={className}
      style={style}
      data-status={status}
      leftSection={
        withIcon ? (
          meta.loading ? (
            <Loader size={iconSize - 2} color={meta.color} aria-hidden />
          ) : (
            <StatusIcon size={iconSize} aria-hidden />
          )
        ) : undefined
      }
    >
      {text}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';
