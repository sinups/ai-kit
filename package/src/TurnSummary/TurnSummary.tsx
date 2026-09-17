import React, { memo } from 'react';
import { Group, Loader, Text } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import type { TurnSummaryPart } from '../types';
import {
  DEFAULT_TURN_SUMMARY_LABELS,
  getTurnSummarySegments,
  type TurnSummaryLabels,
} from './turn-summary';

export interface TurnSummaryProps extends Omit<TurnSummaryPart, 'type'> {
  /** Overrides of the default English labels */
  labels?: Partial<TurnSummaryLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** End-of-turn line: `Took 2m 3s · 40k / 100k · 2 tasks left running` */
export const TurnSummary = memo(function TurnSummary({
  durationMs,
  tokens,
  tokenBudget,
  backgroundTasks,
  labels,
  className,
  style,
}: TurnSummaryProps) {
  const segments = getTurnSummarySegments(
    { durationMs, tokens, tokenBudget, backgroundTasks },
    { ...DEFAULT_TURN_SUMMARY_LABELS, ...labels }
  );

  return (
    <Group
      gap={6}
      wrap="nowrap"
      c="dimmed"
      className={className}
      style={style}
      role="status"
      data-turn-summary
    >
      {backgroundTasks ? (
        <Loader size={12} color="gray" aria-hidden />
      ) : (
        <IconClock size={12} aria-hidden />
      )}
      <Text size="xs" c="dimmed" miw={0}>
        {segments.join(' · ')}
      </Text>
    </Group>
  );
});

TurnSummary.displayName = 'TurnSummary';
