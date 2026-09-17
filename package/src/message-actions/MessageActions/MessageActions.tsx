import React, { memo, useRef, useState } from 'react';
import { ActionIcon, CopyButton, Group, Popover, Text, Tooltip } from '@mantine/core';
import {
  IconArrowBackUp,
  IconCheck,
  IconCopy,
  IconGitBranch,
  IconPencil,
  IconRefresh,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { getErrorMessage } from '../../utils/error-message';
import { FeedbackForm, type FeedbackFormLabels } from '../FeedbackForm/FeedbackForm';
import type { FeedbackDetails, FeedbackReason, MessageFeedbackValue } from '../types';
import { useAsyncAction } from '../use-async-action';
import classes from './MessageActions.module.css';

export interface MessageActionsLabels {
  toolbar: string;
  copy: string;
  copied: string;
  edit: string;
  retry: string;
  rewind: string;
  branch: string;
  good: string;
  bad: string;
  error: string;
  /** Labels of the feedback form */
  feedbackForm: Partial<FeedbackFormLabels>;
}

export const DEFAULT_MESSAGE_ACTIONS_LABELS: MessageActionsLabels = {
  toolbar: 'Message actions',
  copy: 'Copy',
  copied: 'Copied',
  edit: 'Edit',
  retry: 'Retry',
  rewind: 'Rewind to here',
  branch: 'Branch from here',
  good: 'Good response',
  bad: 'Bad response',
  error: 'Action failed',
  feedbackForm: {},
};

export interface MessageActionsProps {
  /** Author of the message: user messages get edit and rewind, assistant messages get retry, feedback and branch */
  messageRole: 'user' | 'assistant';
  /** Text copied by the copy action, the action is hidden when empty */
  text?: string;
  /** Time label rendered before the actions */
  timestamp?: string;
  /** Opens inline editing of a user message */
  onEdit?: () => void;
  /** Regenerates an assistant message; the button shows a loader until the promise settles */
  onRetry?: () => void | Promise<void>;
  /** Returns the conversation to this message */
  onRewind?: () => void | Promise<void>;
  /** Starts a new branch from this message */
  onBranch?: () => void | Promise<void>;
  /** Rates an assistant message, adds the thumbs up and thumbs down buttons */
  onFeedback?: (value: MessageFeedbackValue, details?: FeedbackDetails) => void | Promise<void>;
  /** Controlled rating */
  feedback?: MessageFeedbackValue | null;
  /** Reasons offered after a thumbs down */
  feedbackReasons?: FeedbackReason[];
  /** Disables every action except copy, for example while the agent is responding */
  disabled?: boolean;
  /** `hover` reveals the actions on hover and focus of the toolbar or of an ancestor with `data-message-actions-host`, touch devices always see them; `always` keeps them visible, `hover` by default */
  visibility?: 'hover' | 'always';
  /** Horizontal placement of the actions, `start` by default */
  align?: 'start' | 'end';
  /** Overrides of the default English labels */
  labels?: Partial<MessageActionsLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const ICON_SIZE = 16;

function ActionButton({
  label,
  onClick,
  loading,
  disabled,
  active,
  action,
  children,
}: {
  action?: string;
  label: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} withArrow openDelay={300}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="md"
        aria-label={label}
        data-action={action}
        aria-pressed={active}
        loading={loading}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  );
}

/** Toolbar under a chat message: copy, edit, retry, rewind, branch and feedback, each shown when its callback is set */
export const MessageActions = memo(function MessageActions({
  messageRole,
  text,
  timestamp,
  onEdit,
  onRetry,
  onRewind,
  onBranch,
  onFeedback,
  feedback,
  feedbackReasons,
  disabled = false,
  visibility = 'hover',
  align = 'start',
  labels: labelsProp,
  className,
  style,
}: MessageActionsProps) {
  const labels = { ...DEFAULT_MESSAGE_ACTIONS_LABELS, ...labelsProp };
  const { pendingKey, run } = useAsyncAction(labels.error);
  const [internalFeedback, setInternalFeedback] = useState<MessageFeedbackValue | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const downSentRef = useRef(false);
  const rating =
    feedback === undefined || (feedbackOpen && internalFeedback) ? internalFeedback : feedback;
  const isUser = messageRole === 'user';
  const locked = disabled || pendingKey !== null;

  const rate = async (value: MessageFeedbackValue) => {
    if (!onFeedback) {
      return;
    }
    setFeedbackError(null);
    setInternalFeedback(value);
    setFeedbackOpen(true);
    if (value === 'down') {
      downSentRef.current = false;
      return;
    }
    try {
      await onFeedback('up');
    } catch (error) {
      setInternalFeedback(null);
      setFeedbackError(getErrorMessage(error, labels.error));
    }
  };

  const copy = text ? (
    <CopyButton value={text} timeout={2000}>
      {({ copied, copy: copyText }) => (
        <ActionButton label={copied ? labels.copied : labels.copy} onClick={copyText}>
          {copied ? <IconCheck size={ICON_SIZE} /> : <IconCopy size={ICON_SIZE} />}
        </ActionButton>
      )}
    </CopyButton>
  ) : null;

  const feedbackButtons = !isUser && onFeedback && (
    <Popover
      opened={feedbackOpen}
      onChange={(opened) => {
        setFeedbackOpen(opened);
        if (!opened && internalFeedback === 'down' && !downSentRef.current) {
          setInternalFeedback(null);
        }
      }}
      position="bottom-start"
      width={300}
      shadow="md"
      withArrow
      trapFocus={rating === 'down'}
    >
      <Popover.Target>
        <Group gap={2} wrap="nowrap">
          <ActionButton
            label={labels.good}
            active={rating === 'up'}
            disabled={disabled}
            onClick={() => rate('up')}
          >
            {rating === 'up' ? (
              <IconThumbUpFilled size={ICON_SIZE} />
            ) : (
              <IconThumbUp size={ICON_SIZE} />
            )}
          </ActionButton>
          <ActionButton
            label={labels.bad}
            active={rating === 'down'}
            disabled={disabled}
            onClick={() => rate('down')}
          >
            {rating === 'down' ? (
              <IconThumbDownFilled size={ICON_SIZE} />
            ) : (
              <IconThumbDown size={ICON_SIZE} />
            )}
          </ActionButton>
        </Group>
      </Popover.Target>
      <Popover.Dropdown>
        {feedbackError ? (
          <Text size="sm" c="var(--ae-danger)">
            {feedbackError}
          </Text>
        ) : (
          <FeedbackForm
            value={internalFeedback ?? 'up'}
            reasons={feedbackReasons}
            labels={labels.feedbackForm}
            onSubmit={async (details) => {
              await onFeedback('down', details);
              downSentRef.current = true;
            }}
            onSkip={async () => {
              await onFeedback('down');
              downSentRef.current = true;
            }}
          />
        )}
      </Popover.Dropdown>
    </Popover>
  );

  return (
    <Group
      role="toolbar"
      aria-label={labels.toolbar}
      gap={2}
      wrap="nowrap"
      justify={align === 'end' ? 'flex-end' : 'flex-start'}
      className={cx(classes.root, className)}
      style={style}
      data-visibility={visibility}
      data-active={feedbackOpen || pendingKey !== null || undefined}
    >
      {timestamp && (
        <Text component="span" size="xs" c="dimmed" px={4}>
          {timestamp}
        </Text>
      )}
      {isUser && onRewind && (
        <ActionButton
          label={labels.rewind}
          disabled={locked}
          loading={pendingKey === 'rewind'}
          onClick={() => run('rewind', onRewind)}
        >
          <IconArrowBackUp size={ICON_SIZE} />
        </ActionButton>
      )}
      {isUser && onEdit && (
        <ActionButton label={labels.edit} action="edit" disabled={locked} onClick={onEdit}>
          <IconPencil size={ICON_SIZE} />
        </ActionButton>
      )}
      {copy}
      {!isUser && onRetry && (
        <ActionButton
          label={labels.retry}
          disabled={locked}
          loading={pendingKey === 'retry'}
          onClick={() => run('retry', onRetry)}
        >
          <IconRefresh size={ICON_SIZE} />
        </ActionButton>
      )}
      {feedbackButtons}
      {!isUser && onBranch && (
        <ActionButton
          label={labels.branch}
          disabled={locked}
          loading={pendingKey === 'branch'}
          onClick={() => run('branch', onBranch)}
        >
          <IconGitBranch size={ICON_SIZE} />
        </ActionButton>
      )}
    </Group>
  );
});

MessageActions.displayName = 'MessageActions';
