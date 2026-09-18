import React, { memo } from 'react';
import { ActionIcon, Box, Group } from '@mantine/core';
import { IconPlayerStopFilled } from '@tabler/icons-react';
import { VisuallyHiddenStatus } from '../../primitives/VisuallyHiddenStatus/VisuallyHiddenStatus';
import { TextShimmer } from '../../TextShimmer/TextShimmer';
import { cx } from '../../utils/cx';
import { VoiceLevel } from '../VoiceLevel/VoiceLevel';
import classes from './SpeakingIndicator.module.css';

export interface SpeakingIndicatorLabels {
  /** Caption while the assistant speaks, `Speaking` by default */
  speaking: string;
  /** Accessible label of the stop button, `Stop speaking` by default */
  stop: string;
}

export const DEFAULT_SPEAKING_INDICATOR_LABELS: SpeakingIndicatorLabels = {
  speaking: 'Speaking',
  stop: 'Stop speaking',
};

export interface SpeakingIndicatorProps {
  /** The assistant's voice is playing; the indicator is empty otherwise */
  speaking: boolean;
  /** Output level from 0 to 1, per bar or one number, see `VoiceLevel` */
  levels?: number[] | number;
  /** Renders a stop button when set */
  onStop?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<SpeakingIndicatorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** "The assistant is speaking" line with its level and a stop button; playback stays with the host */
export const SpeakingIndicator = memo(function SpeakingIndicator({
  speaking,
  levels = 0,
  onStop,
  labels: labelsProp,
  className,
  style,
}: SpeakingIndicatorProps) {
  const labels = { ...DEFAULT_SPEAKING_INDICATOR_LABELS, ...labelsProp };

  return (
    <Box
      className={cx(classes.root, className)}
      style={style}
      data-speaking={speaking || undefined}
    >
      {speaking && (
        <Group gap="xs" wrap="nowrap" className={classes.line}>
          <VoiceLevel levels={levels} source="assistant" size="xs" />
          <TextShimmer className={classes.caption} aria-hidden>
            {labels.speaking}
          </TextShimmer>
          {onStop && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              radius="xl"
              onClick={onStop}
              aria-label={labels.stop}
            >
              <IconPlayerStopFilled size={12} />
            </ActionIcon>
          )}
        </Group>
      )}
      <VisuallyHiddenStatus>{speaking ? labels.speaking : null}</VisuallyHiddenStatus>
    </Box>
  );
});

SpeakingIndicator.displayName = 'SpeakingIndicator';
