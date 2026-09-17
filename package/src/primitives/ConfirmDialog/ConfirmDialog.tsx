import React, { memo, useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';
import { getErrorMessage } from '../../utils/error-message';

export interface ConfirmDialogLabels {
  /** Confirm button, `Confirm` by default */
  confirm: string;
  /** Cancel button, `Cancel` by default */
  cancel: string;
  /** Shown when `onConfirm` rejects without a message, `Something went wrong` by default */
  error: string;
}

export const DEFAULT_CONFIRM_DIALOG_LABELS: ConfirmDialogLabels = {
  confirm: 'Confirm',
  cancel: 'Cancel',
  error: 'Something went wrong',
};

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Dialog title, for example `Delete rule` */
  title: React.ReactNode;
  /** Explanation that names what is affected */
  message?: React.ReactNode;
  /** Colors the confirm button red for destructive actions */
  danger?: boolean;
  /** Called by the confirm button; the dialog closes when it settles and shows the rejection in an alert */
  onConfirm: () => void | Promise<void>;
  /** Called when the dialog is dismissed or the confirmed action succeeded */
  onClose: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<ConfirmDialogLabels>;
}

/** Small confirmation modal for destructive or irreversible actions, with a pending confirm button and an error alert */
export const ConfirmDialog = memo(function ConfirmDialog({
  opened,
  title,
  message,
  danger = false,
  onConfirm,
  onClose,
  labels: labelsProp,
}: ConfirmDialogProps) {
  const labels = { ...DEFAULT_CONFIRM_DIALOG_LABELS, ...labelsProp };
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setFailure(null);
    }
  }, [opened]);

  const handleClose = () => {
    if (!pending) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (pending) {
      return;
    }
    setFailure(null);
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      onClose();
    } catch (error) {
      setPending(false);
      setFailure(getErrorMessage(error, labels.error));
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="sm"
      closeOnClickOutside={!pending}
      classNames={{ inner: OVERLAY_INNER_CLASS }}
    >
      <Stack gap="md">
        {message && (
          <Text size="sm" component="div">
            {message}
          </Text>
        )}
        {failure && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
            {failure}
          </Alert>
        )}
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            size="sm"
            onClick={handleClose}
            disabled={pending}
            data-autofocus={danger || undefined}
          >
            {labels.cancel}
          </Button>
          <Button
            size="sm"
            color={danger ? 'red' : undefined}
            loading={pending}
            onClick={handleConfirm}
            data-autofocus={!danger || undefined}
          >
            {labels.confirm}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
