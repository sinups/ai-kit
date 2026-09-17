import React, { memo, useState } from 'react';
import { Box, Code, Modal, ScrollArea, UnstyledButton } from '@mantine/core';
import { IconClipboardText, IconX } from '@tabler/icons-react';
import { formatPasteLabel, type PastedText } from './pasted-text';
import classes from './FileAttachment.module.css';

export interface PastedTextAttachmentProps {
  /** Collapsed paste */
  paste: PastedText;
  /** Chip name and preview title, `{id}` is replaced, `Pasted text #{id}` by default */
  label?: string;
  /** Secondary line of the chip, `{lines}` is replaced, `{lines} lines` by default */
  linesLabel?: string;
  /** Accessible label of the remove button, `Remove pasted text` by default */
  removeLabel?: string;
  /** Renders the remove button when set */
  onRemove?: () => void;
}

/** Chip for a large paste collapsed out of the composer, styled like a file attachment; opens a read-only preview */
export const PastedTextAttachment = memo(function PastedTextAttachment({
  paste,
  label = 'Pasted text #{id}',
  linesLabel = '{lines} lines',
  removeLabel = 'Remove pasted text',
  onRemove,
}: PastedTextAttachmentProps) {
  const [opened, setOpened] = useState(false);
  const name = formatPasteLabel(paste, label);

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
        <span className={classes.size}>{formatPasteLabel(paste, linesLabel)}</span>
      </UnstyledButton>
      {onRemove && (
        <UnstyledButton
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className={classes.remove}
          aria-label={removeLabel}
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
