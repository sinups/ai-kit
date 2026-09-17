import React, { memo } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconShieldX, IconWebhook } from '@tabler/icons-react';
import { SpiralLoader } from '../SpiralLoader/SpiralLoader';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { HookActivityPart } from '../types';
import { formatDuration } from '../utils/format-elapsed';
import {
  DEFAULT_HOOK_ACTIVITY_LABELS,
  getHookActivityTitle,
  type HookActivityLabels,
} from './hook-activity';
import classes from './HookActivity.module.css';

export interface HookActivityProps extends Omit<HookActivityPart, 'type'> {
  /** Initial expanded state, `true` for blocked and failed hooks by default */
  defaultExpanded?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<HookActivityLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Hooks run for an event: running, finished, blocked with a reason, or failed */
export const HookActivity = memo(function HookActivity({
  event,
  status,
  hooks = [],
  reason,
  defaultExpanded,
  labels,
  className,
  style,
}: HookActivityProps) {
  const title = getHookActivityTitle(event, status, hooks.length, {
    ...DEFAULT_HOOK_ACTIVITY_LABELS,
    ...labels,
  });
  const isProblem = status === 'blocked' || status === 'error';
  const hasDetails = Boolean(reason) || hooks.length > 0;

  let icon: React.ReactNode = <IconWebhook size={12} aria-hidden />;
  if (status === 'running') {
    icon = <SpiralLoader size={12} />;
  } else if (status === 'blocked') {
    icon = <IconShieldX size={12} color="var(--ae-warning)" aria-hidden />;
  } else if (status === 'error') {
    icon = <IconAlertTriangle size={12} color="var(--ae-danger)" aria-hidden />;
  }

  return (
    <ToolRowBase
      icon={icon}
      shimmerLabel={title}
      completeLabel={title}
      isAnimating={status === 'running'}
      expandable={hasDetails && status !== 'running'}
      defaultOpen={defaultExpanded ?? isProblem}
      className={className}
      style={style}
      data-hook-status={status}
    >
      <Stack gap={4} className={classes.details}>
        {reason && (
          <Text
            size="xs"
            c={status === 'error' ? 'var(--ae-danger)' : 'var(--ae-warning)'}
            className={classes.reason}
          >
            {reason}
          </Text>
        )}
        {hooks.map((hook, index) => (
          <Stack key={`${hook.name}-${index}`} gap={0}>
            <Group gap="xs" wrap="nowrap">
              <Text size="xs" ff="monospace" truncate="end" miw={0}>
                {hook.name}
              </Text>
              {hook.durationMs !== undefined && (
                <Text size="xs" c="dimmed">
                  {formatDuration(hook.durationMs)}
                </Text>
              )}
            </Group>
            {hook.error && (
              <Text size="xs" c="var(--ae-danger)" className={classes.reason}>
                {hook.error}
              </Text>
            )}
          </Stack>
        ))}
      </Stack>
    </ToolRowBase>
  );
});

HookActivity.displayName = 'HookActivity';
