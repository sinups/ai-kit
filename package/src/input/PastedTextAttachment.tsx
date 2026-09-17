import React, { memo, useState } from 'react';
import { Box, Code, Modal, ScrollArea, UnstyledButton } from '@mantine/core';
import { IconClipboardText, IconX } from '@tabler/icons-react';
import { formatPasteLabel, type PastedText } from './pasted-text';
import classes from './FileAttachment.module.css';

export interface PastedTextAttachmentLabels {
  /** Chip name and preview title, `{id}` is replaced, `Pasted text #{id}` by default */
  name: string;
  /** Secondary line of the chip, `{lines}` is replaced, `{lines} lines` by default */
  lines: string;
  /** Accessible label of the remove button, `Remove pasted text` by default */
  remove: string;
}

export const DEFAULT_PASTED_TEXT_ATTACHMENT_LABELS: PastedTextAttachmentLabels = {
  name: 'Pasted text #{id}',
  lines: '{lines} lines',
  remove: 'Remove pasted text',
};

export interface PastedTextAttachmentProps {
  /** Collapsed paste */
  paste: PastedText;
  /** Renders the remove button when set */
  onRemove?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<PastedTextAttachmentLabels>;
}

/** Chip for a large paste collapsed out of the composer, styled like a file attachment; opens a read-only preview */
export const PastedTextAttachment = memo(function PastedTextAttachment({
  paste,
  onRemove,
  labels: labelsProp,
}: PastedTextAttachmentProps) {
  const labels = { ...DEFAULT_PASTED_TEXT_ATTACHMENT_LABELS, ...labelsProp };
  const [opened, setOpened] = useState(false);
  const name = formatPasteLabel(paste, labels.name);

  return (
    <Box className={classes.root}>
      <div className={classes.iconBox}>
        <IconClipboardText size={16} className={classes.fileIcon} />
      </div>
      <UnstyledButton
        className={classes.meta}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          setOpened(true);
        }}
      >
        <span className={classes.name}>{name}</span>
        <span className={classes.size}>{formatPasteLabel(paste, labels.lines)}</span>
      </UnstyledButton>
      {onRemove && (
        <UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className={classes.remove}
          aria-label={labels.remove}
        >
          <IconX size={12} />
        </UnstyledButton>
      )}
      <Modal opened={opened} onClose={() => setOpened(false)} title={name} size="xl">
        <ScrollArea.Autosize mah="70vh" type="auto">
          <Code block>{paste.text}</Code>
        </ScrollArea.Autosize>
      </Modal>
    </Box>
  );
});

PastedTextAttachment.displayName = 'PastedTextAttachment';
