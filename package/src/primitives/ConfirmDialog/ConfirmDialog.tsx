import React, { memo, useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';
import { getErrorMessage } from '../../utils/error-message';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  opened: boolean;
  /** Dialog title, for example `Delete rule` */
  title: React.ReactNode;
  /** Explanation that names what is affected */
  message?: React.ReactNode;
  /** Confirm button label, `Confirm` by default */
  confirmLabel?: string;
  /** Cancel button label, `Cancel` by default */
  cancelLabel?: string;
  /** Colors the confirm button red for destructive actions */
  danger?: boolean;
  /** Called by the confirm button; the dialog closes when it settles and shows the rejection in an alert */
  onConfirm: () => void | Promise<void>;
  /** Called when the dialog is dismissed or the confirmed action succeeded */
  onClose: () => void;
  /** Shown when `onConfirm` rejects without a message, `Something went wrong` by default */
  errorLabel?: string;
}

/** Small confirmation modal for destructive or irreversible actions, with a pending confirm button and an error alert */
export const ConfirmDialog = memo(function ConfirmDialog({
  opened,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
  errorLabel = 'Something went wrong',
}: ConfirmDialogProps) {
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
      setFailure(getErrorMessage(error, errorLabel));
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
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            color={danger ? 'red' : undefined}
            loading={pending}
            onClick={handleConfirm}
            data-autofocus={!danger || undefined}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
