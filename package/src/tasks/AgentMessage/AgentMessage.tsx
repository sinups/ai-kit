import React, { memo, useState } from 'react';
import { Badge, Button, Collapse, Group, Stack, Text } from '@mantine/core';
import { IconArrowRight, IconChevronDown } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { DEFAULT_TASK_LABELS, toTimestamp } from '../task-utils';
import type { AgentIdentity, AgentMessageData, BackgroundTaskLabels } from '../types';
import classes from './AgentMessage.module.css';

export interface AgentMessageProps {
  /** Message between agents */
  message: AgentMessageData;
  /** Shows the full content from the start */
  defaultExpanded?: boolean;
  /** Formats the timestamp, `HH:MM` in the user locale by default */
  formatTime?: (date: Date) => string;
  /** Overrides of the default English labels */
  labels?: Partial<BackgroundTaskLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const defaultFormatTime = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

function AgentName({ agent }: { agent: AgentIdentity }) {
  return (
    <Badge
      size="sm"
      variant="dot"
      color={agent.color ?? 'gray'}
      tt="none"
      className={classes.agent}
    >
      {agent.name}
    </Badge>
  );
}

/** Message sent from one agent to another: sender and recipient colors, a summary and expandable content */
export const AgentMessage = memo(function AgentMessage({
  message,
  defaultExpanded = false,
  formatTime = defaultFormatTime,
  labels: labelsProp,
  className,
  style,
}: AgentMessageProps) {
  const labels = { ...DEFAULT_TASK_LABELS, ...labelsProp };
  const [expanded, setExpanded] = useState(defaultExpanded);
  const time = toTimestamp(message.timestamp);
  const hasContent = Boolean(message.content && message.content !== message.summary);

  return (
    <Stack gap={6} className={cx(classes.root, className)} style={style}>
      <Group gap={6} wrap="wrap" justify="space-between">
        <Group gap={4} wrap="wrap" miw={0}>
          <AgentName agent={message.from} />
          <IconArrowRight size={12} className={classes.arrow} aria-hidden />
          {message.to ? (
            <AgentName agent={message.to} />
          ) : (
            <Text span size="xs" c="dimmed">
              {labels.broadcast}
            </Text>
          )}
        </Group>
        {time !== undefined && (
          <Text span size="xs" c="dimmed" className={classes.time}>
            {formatTime(new Date(time))}
          </Text>
        )}
      </Group>
      <Text size="sm">{message.summary}</Text>
      {hasContent && (
        <>
          <Collapse expanded={expanded}>
            <Text size="sm" c="dimmed" className={classes.content}>
              {message.content}
            </Text>
          </Collapse>
          <Button
            variant="subtle"
            color="gray"
            size="compact-xs"
            className={classes.toggle}
            aria-expanded={expanded}
            rightSection={
              <IconChevronDown
                size={12}
                className={classes.chevron}
                data-expanded={expanded || undefined}
              />
            }
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? labels.hideMessage : labels.showMessage}
          </Button>
        </>
      )}
    </Stack>
  );
});

AgentMessage.displayName = 'AgentMessage';
