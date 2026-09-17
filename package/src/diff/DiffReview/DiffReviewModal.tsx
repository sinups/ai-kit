import React, { memo, useMemo } from 'react';
import { Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { resolveDiffLabels } from '../labels';
import { DiffReview, type DiffReviewProps } from './DiffReview';
import classes from './DiffReview.module.css';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';

export interface DiffReviewModalProps extends DiffReviewProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Called when the modal requests to close */
  onClose: () => void;
  /** Modal title, `labels.title` by default */
  title?: React.ReactNode;
  /** Modal width on wide screens, `90%` by default */
  size?: string | number;
  /** Media query under which the modal fills the screen, `(max-width: 48em)` by default */
  narrowQuery?: string;
}

/** `DiffReview` in a modal: 90% wide on large screens, full screen on narrow ones */
export const DiffReviewModal = memo(function DiffReviewModal({
  opened,
  onClose,
  title,
  size = '90%',
  narrowQuery = '(max-width: 48em)',
  className,
  style,
  ...reviewProps
}: DiffReviewModalProps) {
  const labels = useMemo(() => resolveDiffLabels(reviewProps.labels), [reviewProps.labels]);
  const fullScreen = useMediaQuery(narrowQuery) ?? false;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title ?? labels.title}
      size={size}
      fullScreen={fullScreen}
      classNames={{
        inner: OVERLAY_INNER_CLASS,
        content: fullScreen ? classes.modalContentFull : classes.modalContent,
        body: classes.modalBody,
      }}
      className={className}
      style={style}
    >
      <DiffReview {...reviewProps} />
    </Modal>
  );
});

DiffReviewModal.displayName = 'DiffReviewModal';
