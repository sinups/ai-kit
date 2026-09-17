import React, { memo, useState } from 'react';
import { Alert, Button, Chip, Group, Stack, Text, Textarea } from '@mantine/core';
import { IconAlertCircle, IconHeart } from '@tabler/icons-react';
import type { FeedbackDetails, FeedbackReason, MessageFeedbackValue } from '../types';
import { useAsyncAction } from '../use-async-action';

export interface FeedbackFormLabels {
  title: string;
  commentLabel: string;
  commentPlaceholder: string;
  submit: string;
  skip: string;
  thanks: string;
  error: string;
}

export const DEFAULT_FEEDBACK_REASONS: FeedbackReason[] = [
  { value: 'inaccurate', label: 'Inaccurate' },
  { value: 'not-helpful', label: 'Not helpful' },
  { value: 'too-slow', label: 'Too slow' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'other', label: 'Other' },
];

export const DEFAULT_FEEDBACK_FORM_LABELS: FeedbackFormLabels = {
  title: 'What went wrong?',
  commentLabel: 'Details',
  commentPlaceholder: 'Tell us more (optional)',
  submit: 'Send feedback',
  skip: 'Skip',
  thanks: 'Thanks for your feedback',
  error: 'Could not send feedback',
};

export interface FeedbackFormProps {
  /** Rating the form belongs to: `up` renders only the thank-you note, `down` renders reasons and a comment */
  value: MessageFeedbackValue;
  /** Sends the negative feedback details; the form shows the thank-you note once the promise resolves */
  onSubmit?: (details: FeedbackDetails) => void | Promise<void>;
  /** Adds a skip button that sends the rating without details */
  onSkip?: () => void | Promise<void>;
  /** Reasons rendered as chips, `Inaccurate`, `Not helpful`, `Too slow`, `Unsafe`, `Other` by default */
  reasons?: FeedbackReason[];
  /** Renders the thank-you note, for feedback that was already sent */
  submitted?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<FeedbackFormLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Negative feedback form with reason chips and a comment, or a short thank-you note for positive ratings */
export const FeedbackForm = memo(function FeedbackForm({
  value,
  onSubmit,
  onSkip,
  reasons = DEFAULT_FEEDBACK_REASONS,
  submitted = false,
  labels: labelsProp,
  className,
  style,
}: FeedbackFormProps) {
  const labels = { ...DEFAULT_FEEDBACK_FORM_LABELS, ...labelsProp };
  const [selected, setSelected] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const { pendingKey, error, run } = useAsyncAction(labels.error);

  if (value === 'up' || submitted || sent) {
    return (
      <Group gap="xs" wrap="nowrap" className={className} style={style} role="status">
        <IconHeart size={16} aria-hidden />
        <Text size="sm">{labels.thanks}</Text>
      </Group>
    );
  }

  const trimmed = comment.trim();
  const canSubmit = selected.length > 0 || trimmed.length > 0;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    const ok = await run('submit', () => onSubmit?.({ reasons: selected, comment: trimmed }));
    if (ok) {
      setSent(true);
    }
  };

  const skip = async () => {
    const ok = await run('skip', () => onSkip?.());
    if (ok) {
      setSent(true);
    }
  };

  return (
    <Stack gap="sm" className={className} style={style}>
      <Text size="sm" fw={500}>
        {labels.title}
      </Text>
      <Chip.Group multiple value={selected} onChange={setSelected}>
        <Group gap={6}>
          {reasons.map((reason) => (
            <Chip key={reason.value} value={reason.value} size="xs" variant="outline">
              {reason.label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
      <Textarea
        aria-label={labels.commentLabel}
        placeholder={labels.commentPlaceholder}
        autosize
        minRows={2}
        maxRows={6}
        value={comment}
        onChange={(event) => setComment(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            submit();
          }
        }}
      />
      {error && (
        <Alert color="red" variant="light" p="xs" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}
      <Group gap="xs" justify="flex-end" wrap="nowrap">
        {onSkip && (
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            onClick={skip}
            loading={pendingKey === 'skip'}
            disabled={pendingKey === 'submit'}
          >
            {labels.skip}
          </Button>
        )}
        <Button
          size="xs"
          onClick={submit}
          disabled={!canSubmit || pendingKey === 'skip'}
          loading={pendingKey === 'submit'}
        >
          {labels.submit}
        </Button>
      </Group>
    </Stack>
  );
});

FeedbackForm.displayName = 'FeedbackForm';
