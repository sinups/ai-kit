import React, { memo } from 'react';
import { Modal, type ModalProps } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { SettingsLayout, type SettingsLayoutProps } from './SettingsLayout';
import classes from './SettingsLayout.module.css';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';

export interface SettingsModalProps extends Omit<SettingsLayoutProps, 'title'> {
  /** Whether the modal is open */
  opened: boolean;
  /** Called when the modal is dismissed */
  onClose: () => void;
  /** Modal title, `Settings` by default */
  title?: React.ReactNode;
  /** Modal width when not full screen, `70rem` by default */
  size?: ModalProps['size'];
  /** Media query that switches the modal to full screen, `(max-width: 48em)` by default */
  fullScreenQuery?: string;
}

/** `SettingsLayout` in a large modal with a fixed height, full screen on narrow viewports */
export const SettingsModal = memo(function SettingsModal({
  opened,
  onClose,
  title = 'Settings',
  size = '70rem',
  fullScreenQuery = '(max-width: 48em)',
  className,
  style,
  ...layoutProps
}: SettingsModalProps) {
  const fullScreen = useMediaQuery(fullScreenQuery, false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
      fullScreen={fullScreen}
      className={className}
      style={style}
      classNames={{
        inner: OVERLAY_INNER_CLASS,
        content: classes.modalContent,
        body: classes.modalBody,
      }}
    >
      <SettingsLayout {...layoutProps} className={classes.modalLayout} />
    </Modal>
  );
});

SettingsModal.displayName = 'SettingsModal';
