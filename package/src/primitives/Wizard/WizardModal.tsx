import React, { memo, useState } from 'react';
import { FocusTrap, Modal, type ModalProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Wizard, type WizardProps } from './Wizard';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';
import classes from './Wizard.module.css';

export interface WizardModalProps<V> extends WizardProps<V> {
  /** Whether the modal is open */
  opened: boolean;
  /** Called when the modal is dismissed or cancelled, after `onCancel` */
  onClose: () => void;
  /** Modal title */
  title?: React.ReactNode;
  /** Modal width, `xl` by default so the vertical stepper fits */
  size?: ModalProps['size'];
  /** Media query that switches the modal to full screen, `(max-width: 36em)` by default */
  fullScreenQuery?: string;
}

function WizardModalInner<V>({
  opened,
  onClose,
  onCancel,
  onComplete,
  title,
  size = 'xl',
  fullScreenQuery = '(max-width: 36em)',
  ...wizardProps
}: WizardModalProps<V>) {
  const fullScreen = useMediaQuery(fullScreenQuery, false);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async (values: V) => {
    setCompleting(true);
    try {
      await onComplete(values);
    } finally {
      setCompleting(false);
    }
  };

  const handleClose = () => {
    if (completing) {
      return;
    }
    onCancel?.();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size={size}
      fullScreen={fullScreen}
      closeOnEscape={!completing}
      closeOnClickOutside={!completing}
      withCloseButton={!completing}
      classNames={{
        inner: OVERLAY_INNER_CLASS,
        content: classes.modalContent,
        body: classes.modalBody,
      }}
    >
      <FocusTrap.InitialFocus />
      <Wizard<V>
        scrollContent
        {...wizardProps}
        onComplete={handleComplete}
        onCancel={handleClose}
      />
    </Modal>
  );
}

/** `Wizard` inside a Mantine `Modal`, full screen on narrow viewports; only the step content scrolls, the stepper and buttons stay visible; closing the modal cancels the wizard */
export const WizardModal = memo(WizardModalInner) as unknown as (<V>(
  props: WizardModalProps<V>
) => React.ReactElement) & { displayName?: string };

WizardModal.displayName = 'WizardModal';
