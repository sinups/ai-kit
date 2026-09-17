import React, { memo } from 'react';
import { Box, Button } from '@mantine/core';
import { TextShimmer } from '../TextShimmer/TextShimmer';
import { cx } from '../utils/cx';
import { fillTemplate } from '../utils/fill-template';
import { formatElapsedTime } from '../utils/format-elapsed';
import { formatTokens } from '../utils/format-tokens';
import { useStalled } from './use-stalled';
import classes from './AgentStatus.module.css';

export interface AgentStatusLabels {
  /** Text shown instead of `label` while stalled, empty by default to keep `label` */
  stalled: string;
  /** Token count text, `{tokens}` is replaced, `↓ {tokens} tokens` by default */
  tokens: string;
  /** Stop button, `Stop` by default */
  stop: string;
}

export const DEFAULT_AGENT_STATUS_LABELS: AgentStatusLabels = {
  stalled: '',
  tokens: '↓ {tokens} tokens',
  stop: 'Stop',
};

export interface AgentStatusProps {
  /** Status text while the agent is working, `Thinking` by default */
  label?: string;
  /** Moment the turn started, used for the live elapsed time */
  startedAt?: number | Date;
  /** Tokens received in this turn */
  tokens?: number;
  /** Moment the last token or event arrived, `startedAt` by default */
  lastActivityAt?: number | Date;
  /** Inactivity in ms after which the status is shown as stalled, `3000` by default */
  stallAfterMs?: number;
  /** Disables stall detection, for example while tools are running */
  paused?: boolean;
  /** Renders the stop button when provided */
  onStop?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<AgentStatusLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Live "agent is working" line with elapsed time, token count and stall detection */
export const AgentStatus = memo(function AgentStatus({
  label = 'Thinking',
  startedAt,
  tokens,
  lastActivityAt,
  stallAfterMs = 3000,
  paused,
  onStop,
  labels: labelsProp,
  className,
  style,
}: AgentStatusProps) {
  const labels = { ...DEFAULT_AGENT_STATUS_LABELS, ...labelsProp };
  const { elapsedMs, isStalled } = useStalled({ startedAt, lastActivityAt, stallAfterMs, paused });
  const elapsed = formatElapsedTime(elapsedMs);
  const text = isStalled ? labels.stalled || label : label;
  const hasTokens = tokens !== undefined && tokens > 0;

  return (
    <Box
      className={cx(classes.root, className)}
      style={style}
      data-stalled={isStalled || undefined}
    >
      <span role="status" aria-live="polite">
        {isStalled ? (
          <span className={classes.label}>{text}</span>
        ) : (
          <TextShimmer className={classes.label} duration={1.6}>
            {text}
          </TextShimmer>
        )}
      </span>
      {(elapsed || hasTokens) && (
        <span className={classes.meta} aria-hidden="true">
          {elapsed && <span>{elapsed}</span>}
          {elapsed && hasTokens && <span>·</span>}
          {hasTokens && (
            <span>{fillTemplate(labels.tokens, { tokens: formatTokens(tokens) })}</span>
          )}
        </span>
      )}
      {onStop && (
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          className={classes.stop}
          onClick={onStop}
        >
          {labels.stop}
        </Button>
      )}
    </Box>
  );
});

AgentStatus.displayName = 'AgentStatus';
