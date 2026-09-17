import React, { memo, useState } from 'react';
import { Alert, Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAsyncAction } from '../use-async-action';

export interface EditMessageComposerLabels {
  input: string;
  placeholder: string;
  save: string;
  cancel: string;
  hint: string;
  error: string;
}

export const DEFAULT_EDIT_MESSAGE_COMPOSER_LABELS: EditMessageComposerLabels = {
  input: 'Edit message',
  placeholder: 'Edit your message',
  save: 'Save & resend',
  cancel: 'Cancel',
  hint: 'Enter to send, Shift+Enter for a new line, Esc to cancel',
  error: 'Could not resend the message',
};

export interface EditMessageComposerProps {
  /** Text the editor starts with, usually the original message */
  defaultValue: string;
  /** Saves and resends the edited text, trimmed; the composer stays open and shows a loader until the promise settles */
  onSubmit: (text: string) => void | Promise<void>;
  /** Leaves editing without saving */
  onCancel: () => void;
  /** Maximum number of rows before the editor scrolls, `10` by default */
  maxRows?: number;
  /** Shows the keyboard hint, `true` by default */
  withHint?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<EditMessageComposerLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Inline editor that replaces a user message: Enter resends, Escape cancels */
export const EditMessageComposer = memo(function EditMessageComposer({
  defaultValue,
  onSubmit,
  onCancel,
  maxRows = 10,
  withHint = true,
  labels: labelsProp,
  className,
  style,
}: EditMessageComposerProps) {
  const labels = { ...DEFAULT_EDIT_MESSAGE_COMPOSER_LABELS, ...labelsProp };
  const [value, setValue] = useState(defaultValue);
  const { pendingKey, error, run } = useAsyncAction(labels.error);
  const isPending = pendingKey !== null;
  const trimmed = value.trim();

  const submit = () => {
    if (!trimmed || isPending) {
      return;
    }
    run('save', () => onSubmit(trimmed));
  };

  return (
    <Paper withBorder radius="md" p="xs" className={className} style={style}>
      <Stack gap="xs">
        <Textarea
          aria-label={labels.input}
          placeholder={labels.placeholder}
          variant="unstyled"
          autosize
          minRows={1}
          maxRows={maxRows}
          autoFocus
          value={value}
          readOnly={isPending}
          onFocus={(event) => {
            const length = event.currentTarget.value.length;
            event.currentTarget.setSelectionRange(length, length);
          }}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              if (!isPending) {
                onCancel();
              }
              return;
            }
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
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
        <Group gap="xs" justify="space-between" wrap="nowrap">
          {withHint ? (
            <Text size="xs" c="dimmed" truncate="end" miw={0}>
              {labels.hint}
            </Text>
          ) : (
            <span />
          )}
          <Group gap="xs" wrap="nowrap">
            <Button size="xs" variant="subtle" color="gray" onClick={onCancel} disabled={isPending}>
              {labels.cancel}
            </Button>
            <Button size="xs" onClick={submit} disabled={!trimmed} loading={isPending}>
              {labels.save}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
});

EditMessageComposer.displayName = 'EditMessageComposer';
