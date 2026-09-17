import React, { memo, useMemo } from 'react';
import { Alert, Badge, Button, Divider, Group, Skeleton, Stack, Text } from '@mantine/core';
import {
  IconAlertCircle,
  IconDownload,
  IconGitBranch,
  IconMessages,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { MessageList } from '../MessageList/MessageList';
import type { ChatMessage } from '../types';
import { formatRelativeTime } from './format-relative-time';
import type { SessionSummary } from './types';
import classes from './SessionPreview.module.css';

export interface SessionPreviewLabels {
  resume: string;
  export: string;
  retry: string;
  messages: (count: number) => string;
  tokens: (count: string) => string;
  moreMessages: (count: number) => string;
  updated: (time: string) => string;
}

export interface SessionPreviewProps {
  /** Session shown in the header */
  session: SessionSummary;
  /** Conversation of the session, only the first `maxMessages` are rendered */
  messages?: ChatMessage[];
  /** Shows skeletons instead of the messages */
  loading?: boolean;
  /** Error message shown instead of the messages */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Continues the session, the button is rendered only when set */
  onResume?: (session: SessionSummary) => void;
  /** Opens the export flow, the button is rendered only when set */
  onExport?: (session: SessionSummary) => void;
  /** Number of messages rendered, `6` by default */
  maxMessages?: number;
  /** Reference time for the relative time, the current time by default */
  now?: Date;
  /** Locale of numbers and relative time, `en` by default */
  locale?: string;
  /** Overrides of the default English labels */
  labels?: Partial<SessionPreviewLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_SESSION_PREVIEW_LABELS: SessionPreviewLabels = {
  resume: 'Resume',
  export: 'Export',
  retry: 'Retry',
  messages: (count) => `${count} ${count === 1 ? 'message' : 'messages'}`,
  tokens: (count) => `${count} tokens`,
  moreMessages: (count) => `${count} more ${count === 1 ? 'message' : 'messages'}`,
  updated: (time) => `Updated ${time}`,
};

/** Summary of one session with its latest messages and Resume and Export actions */
export const SessionPreview = memo(function SessionPreview({
  session,
  messages = [],
  loading = false,
  error,
  onRetry,
  onResume,
  onExport,
  maxMessages = 6,
  now,
  locale = 'en',
  labels,
  className,
  style,
}: SessionPreviewProps) {
  const text = { ...DEFAULT_SESSION_PREVIEW_LABELS, ...labels };
  const visible = useMemo(() => messages.slice(0, maxMessages), [messages, maxMessages]);
  const hidden = Math.max(messages.length - visible.length, 0);
  const numbers = new Intl.NumberFormat(locale);
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });

  let body: React.ReactNode;
  if (loading) {
    body = (
      <Stack gap="md" aria-busy="true">
        <Skeleton height={36} width="60%" radius="md" ml="auto" />
        <Skeleton height={12} width="90%" radius="sm" />
        <Skeleton height={12} width="75%" radius="sm" />
        <Skeleton height={12} width="82%" radius="sm" />
      </Stack>
    );
  } else if (error) {
    body = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error}</Text>
          {onRetry && (
            <Button size="xs" variant="light" color="red" onClick={onRetry}>
              {text.retry}
            </Button>
          )}
        </Stack>
      </Alert>
    );
  } else {
    body = (
      <Stack gap="xs">
        <MessageList
          messages={visible}
          status="ready"
          showCopyToolbar={false}
          initialScrollBehavior="top"
          contentWidth="100%"
          className={classes.messages}
        />
        {hidden > 0 && (
          <Text size="xs" c="dimmed" ta="center">
            {text.moreMessages(hidden)}
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="md" p="md" className={className} style={style}>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Text component="h4" size="sm" fw={500} className={classes.title}>
            {session.title}
          </Text>
          {(onResume || onExport) && (
            <Group gap="xs" wrap="nowrap">
              {onExport && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => onExport(session)}
                >
                  {text.export}
                </Button>
              )}
              {onResume && (
                <Button
                  size="xs"
                  leftSection={<IconPlayerPlay size={14} />}
                  onClick={() => onResume(session)}
                >
                  {text.resume}
                </Button>
              )}
            </Group>
          )}
        </Group>
        <Group gap="xs" c="dimmed">
          <Text size="xs">
            {text.updated(formatRelativeTime(session.updatedAt, now ?? new Date(), locale))}
          </Text>
          <Group gap={4} wrap="nowrap">
            <IconMessages size={12} />
            <Text size="xs">{text.messages(session.messageCount)}</Text>
          </Group>
          {session.branch && (
            <Group gap={4} wrap="nowrap">
              <IconGitBranch size={12} />
              <Text size="xs" ff="monospace">
                {session.branch}
              </Text>
            </Group>
          )}
          {session.tokenCount !== undefined && (
            <Text size="xs">{text.tokens(numbers.format(session.tokenCount))}</Text>
          )}
          {session.cost !== undefined && <Text size="xs">{currency.format(session.cost)}</Text>}
          {session.model && (
            <Badge size="xs" variant="light" color="gray">
              {session.model}
            </Badge>
          )}
        </Group>
      </Stack>
      <Divider />
      {body}
    </Stack>
  );
});

SessionPreview.displayName = 'SessionPreview';
