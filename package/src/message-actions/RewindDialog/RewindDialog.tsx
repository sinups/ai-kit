import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Divider,
  FocusTrap,
  Group,
  Modal,
  Radio,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowBackUp,
  IconFoldDown,
  IconFoldUp,
  IconMessage,
} from '@tabler/icons-react';
import { EntityList } from '../../primitives/EntityList/EntityList';
import { EntityListItem } from '../../primitives/EntityList/EntityListItem';
import type { ChatMessage } from '../../types';
import {
  buildRewindPoints,
  buildSummarizeRequest,
  DEFAULT_REWIND_GROUP_LABELS,
  getRewindGroup,
  type RewindGroupLabels,
} from '../rewind-points';
import type {
  RewindMode,
  RewindPoint,
  RewindRequest,
  SummarizeDirection,
  SummarizeRequest,
} from '../types';
import { getErrorMessage } from '../../utils/error-message';
import { usePendingActions } from '../../hooks/use-pending-actions';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';

export interface RewindDialogLabels extends RewindGroupLabels {
  title: string;
  description: string;
  search: string;
  empty: string;
  noResults: string;
  modeLabel: string;
  conversation: string;
  conversationDescription: string;
  conversationAndCode: string;
  conversationAndCodeDescription: string;
  confirm: string;
  cancel: string;
  untitled: string;
  messagesAfter: (count: number) => string;
  error: string;
  summarizeTitle: string;
  summarizeDescription: string;
  summarizeContext: string;
  summarizeContextPlaceholder: string;
  summarizeFrom: string;
  summarizeUpTo: string;
  summarizeError: string;
}

export const DEFAULT_REWIND_DIALOG_LABELS: RewindDialogLabels = {
  ...DEFAULT_REWIND_GROUP_LABELS,
  title: 'Rewind conversation',
  description: 'Pick the message to return to. It and everything after it will be removed.',
  search: 'Search messages',
  empty: 'No messages to rewind to',
  noResults: 'No matching messages',
  modeLabel: 'What to restore',
  conversation: 'Messages only',
  conversationDescription: 'Remove the later messages, keep file changes as they are',
  conversationAndCode: 'Messages and file changes',
  conversationAndCodeDescription: 'Also revert file changes the agent made after this point',
  confirm: 'Rewind',
  cancel: 'Cancel',
  untitled: 'Message without text',
  messagesAfter: (count) => `${count} later ${count === 1 ? 'message' : 'messages'}`,
  error: 'Could not rewind the conversation',
  summarizeTitle: 'Or summarize instead',
  summarizeDescription:
    'Replace part of the conversation with a summary to free context without losing the thread.',
  summarizeContext: 'What should the summary keep?',
  summarizeContextPlaceholder: 'Decisions, open questions, file names…',
  summarizeFrom: 'Summarize this and below',
  summarizeUpTo: 'Summarize everything above',
  summarizeError: 'Could not summarize the conversation',
};

const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export interface RewindDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Closes the dialog */
  onClose: () => void;
  /** Conversation messages; user messages become rewind points */
  messages: ChatMessage[];
  /** Rewinds the conversation; the dialog closes when the promise resolves and shows the error when it rejects */
  onRewind: (request: RewindRequest) => void | Promise<void>;
  /** Summarizes the conversation from or up to the selected point; the summarize actions are shown only when set, the dialog closes when the promise resolves */
  onSummarize?: (request: SummarizeRequest) => void | Promise<void>;
  /** Point selected when the dialog opens, the newest message by default */
  defaultMessageId?: string;
  /** Restore modes offered, both by default; with a single mode the choice is hidden */
  modes?: RewindMode[];
  /** Overrides of the default English labels */
  labels?: Partial<RewindDialogLabels>;
}

/** Modal that returns the conversation to an earlier user message, optionally reverting code changes */
export const RewindDialog = memo(function RewindDialog({
  opened,
  onClose,
  messages,
  onRewind,
  onSummarize,
  defaultMessageId,
  modes = ['conversation', 'conversation-and-code'],
  labels: labelsProp,
}: RewindDialogProps) {
  const labels = { ...DEFAULT_REWIND_DIALOG_LABELS, ...labelsProp };
  const points = useMemo(() => buildRewindPoints(messages), [messages]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<RewindMode>(modes[0] ?? 'conversation');
  const [query, setQuery] = useState('');
  const [summaryContext, setSummaryContext] = useState('');
  const [now, setNow] = useState(() => new Date());
  const { isPending: actionPending, error, tryRun, clearError } = usePendingActions(labels.error);
  const isPending = actionPending();

  useEffect(() => {
    if (!opened) {
      return;
    }
    setSelectedId(defaultMessageId ?? points[0]?.messageId ?? null);
    setMode(modes[0] ?? 'conversation');
    setQuery('');
    setSummaryContext('');
    setNow(new Date());
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, defaultMessageId]);

  const selected = points.find((point) => point.messageId === selectedId);

  const confirm = async () => {
    if (!selected) {
      return;
    }
    const ok = await tryRun('rewind', () => onRewind({ messageId: selected.messageId, mode }), {
      exclusive: true,
    });
    if (ok) {
      onClose();
    }
  };

  const summarize = async (direction: SummarizeDirection) => {
    if (!selected || !onSummarize) {
      return;
    }
    const request = buildSummarizeRequest(selected.messageId, direction, summaryContext);
    const ok = await tryRun(
      `summarize-${direction}`,
      async () => {
        try {
          await onSummarize(request);
        } catch (reason) {
          throw new Error(getErrorMessage(reason, labels.summarizeError));
        }
      },
      { exclusive: true }
    );
    if (ok) {
      onClose();
    }
  };

  const modeOptions: Record<RewindMode, { label: string; description: string }> = {
    conversation: { label: labels.conversation, description: labels.conversationDescription },
    'conversation-and-code': {
      label: labels.conversationAndCode,
      description: labels.conversationAndCodeDescription,
    },
  };

  return (
    <Modal
      opened={opened}
      onClose={isPending ? () => {} : onClose}
      title={labels.title}
      size="lg"
      closeButtonProps={{ 'aria-label': labels.cancel, disabled: isPending }}
      classNames={{ inner: OVERLAY_INNER_CLASS }}
    >
      <FocusTrap.InitialFocus />
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {labels.description}
        </Text>
        <EntityList<RewindPoint>
          items={points}
          getId={(point) => point.messageId}
          selectedId={selectedId}
          onSelect={(point) => !isPending && setSelectedId(point.messageId)}
          groupBy={(point) => getRewindGroup(point, now, labels)}
          ariaLabel={labels.title}
          search={
            points.length > 5
              ? {
                  value: query,
                  onChange: setQuery,
                  placeholder: labels.search,
                  filter: (point, text) =>
                    point.preview.toLowerCase().includes(text.trim().toLowerCase()),
                }
              : undefined
          }
          empty={{ title: labels.empty, icon: <IconMessage size={24} /> }}
          labels={{ noResults: labels.noResults }}
          renderItem={(point, state) => (
            <EntityListItem
              selected={state.selected}
              icon={<IconMessage size={16} />}
              title={point.preview || labels.untitled}
              description={
                point.messagesAfter > 0 ? labels.messagesAfter(point.messagesAfter) : undefined
              }
              meta={point.createdAt ? timeFormatter.format(point.createdAt) : undefined}
              descriptionLines={1}
            />
          )}
        />
        {modes.length > 1 && (
          <Radio.Group
            size="xs"
            label={labels.modeLabel}
            value={mode}
            onChange={(value) => setMode(value as RewindMode)}
          >
            <Stack gap="xs" mt="xs">
              {modes.map((option) => (
                <Radio
                  key={option}
                  value={option}
                  label={modeOptions[option].label}
                  description={modeOptions[option].description}
                  disabled={isPending}
                />
              ))}
            </Stack>
          </Radio.Group>
        )}
        {onSummarize && (
          <Stack gap="xs">
            <Divider label={labels.summarizeTitle} labelPosition="left" />
            <Text size="xs" c="dimmed">
              {labels.summarizeDescription}
            </Text>
            <Textarea
              label={labels.summarizeContext}
              placeholder={labels.summarizeContextPlaceholder}
              value={summaryContext}
              onChange={(event) => setSummaryContext(event.currentTarget.value)}
              autosize
              minRows={2}
              maxRows={5}
              disabled={isPending}
            />
            <Group gap="xs" justify="flex-end">
              <Button
                variant="default"
                leftSection={<IconFoldUp size={16} />}
                onClick={() => summarize('up-to')}
                disabled={!selected || (isPending && !actionPending('summarize-up-to'))}
                loading={actionPending('summarize-up-to')}
              >
                {labels.summarizeUpTo}
              </Button>
              <Button
                variant="default"
                leftSection={<IconFoldDown size={16} />}
                onClick={() => summarize('from')}
                disabled={!selected || (isPending && !actionPending('summarize-from'))}
                loading={actionPending('summarize-from')}
              >
                {labels.summarizeFrom}
              </Button>
            </Group>
          </Stack>
        )}
        {error && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            {labels.cancel}
          </Button>
          <Button
            leftSection={<IconArrowBackUp size={16} />}
            onClick={confirm}
            disabled={!selected || (isPending && !actionPending('rewind'))}
            loading={actionPending('rewind')}
          >
            {labels.confirm}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
});

RewindDialog.displayName = 'RewindDialog';
